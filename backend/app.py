import os
import requests
from bs4 import BeautifulSoup
import threading
import time
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse

try:
    import fitz  # PyMuPDF
except ImportError:
    import pymupdf as fitz
import json
from flask import Flask, request, jsonify, render_template_string, Response, session
from flask_cors import CORS
from dotenv import load_dotenv
from langdetect import detect
from deep_translator import GoogleTranslator
from google import genai
from google.genai import types
from datetime import datetime
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import lru_cache, wraps
import jwt
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
import uuid
import resend
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.pool import NullPool
import csv
import io
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load API keys from .env
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is required")

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
if not ADMIN_PASSWORD:
    raise RuntimeError("ADMIN_PASSWORD is required")

allowed_emails_str = os.getenv("ALLOWED_ADMIN_EMAILS")
if not allowed_emails_str:
    raise RuntimeError("ALLOWED_ADMIN_EMAILS is required")
ALLOWED_ADMIN_EMAILS = [e.strip() for e in allowed_emails_str.split(",")]

GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# Initialize LLMs
gemini_client = None
if GEMINI_API_KEY:
    gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# Flask app
app = Flask(__name__)
app.secret_key = JWT_SECRET

# Restrict CORS to explicit domains to prevent cross-origin attacks
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS(app, resources={
    r"/chat": {"origins": [frontend_url], "methods": ["POST"], "allow_headers": ["Content-Type", "Authorization"]},
    r"/api/*": {"origins": [frontend_url], "allow_headers": ["Content-Type", "Authorization"]}
})

# SQLite Database for Chat Logging
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat_logs.db'
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'poolclass': NullPool}
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
sql_db = SQLAlchemy(app)

class ChatLog(sql_db.Model):
    __tablename__ = 'chat_logs'
    id = sql_db.Column(sql_db.Integer, primary_key=True)
    user_message = sql_db.Column(sql_db.Text, nullable=False)
    bot_reply = sql_db.Column(sql_db.Text, nullable=False)
    detected_language = sql_db.Column(sql_db.String(10), nullable=False)
    timestamp = sql_db.Column(sql_db.DateTime, default=datetime.utcnow)

with app.app_context():
    sql_db.create_all()

# Rate Limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

@app.route("/")
def home():
    return "Welcome to the ANITS Campus Assistant API!"

# MongoDB setup
uri = os.getenv("MONGO_URI")
mongo_client = None
db = None
chat_logs = None
enquiries_collection = None
telegram_users_collection = None
student_records_collection = None

try:
    import certifi
    mongo_client = MongoClient(uri, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    db = mongo_client.get_database("college_data")
    chat_logs = db['chat_logs']
    enquiries_collection = db['enquiries']
    telegram_users_collection = db['telegram_users']
    student_records_collection = db['students']
    faculty_users_collection = db['faculty_users']
    
    # Send a ping to confirm a successful connection
    mongo_client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
    
    # Ensure indexes
    enquiries_collection.create_index([("timestamp", -1)])
    telegram_users_collection.create_index([("chat_id", 1)], unique=True)
except Exception as e:
    print("MongoDB connection error:", e)
    print("App will run without database logging.")

# Enquiries Data Handling (Local JSON Fallback)
enquiries_file_path = "../data/enquiries.json"

embedding_model = None
def get_embedding_model():
    global embedding_model
    if embedding_model is None:
        try:
            from fastembed import TextEmbedding
            print("Loading FastEmbed Model...")
            embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
            print("Loaded FastEmbed Model!")
        except Exception as e:
            print("Failed to load fastembed:", e)
    return embedding_model


def load_enquiries():
    if os.path.exists(enquiries_file_path):
        with open(enquiries_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_enquiries(data):
    os.makedirs(os.path.dirname(enquiries_file_path), exist_ok=True)
    with open(enquiries_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Syllabus Data Handling (Local JSON Fallback for reliability)
syllabus_file_path = "../data/syllabus.json"
def load_syllabus():
    if os.path.exists(syllabus_file_path):
        with open(syllabus_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_syllabus(data):
    os.makedirs(os.path.dirname(syllabus_file_path), exist_ok=True)
    with open(syllabus_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Academic Calendar Data Handling
calendar_file_path = "../data/academic_calendar.json"
def load_academic_calendar():
    if os.path.exists(calendar_file_path):
        with open(calendar_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_academic_calendar(data):
    os.makedirs(os.path.dirname(calendar_file_path), exist_ok=True)
    with open(calendar_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Time Tables Data Handling
time_tables_file_path = "../data/time_tables.json"
def load_time_tables():
    if os.path.exists(time_tables_file_path):
        with open(time_tables_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_time_tables(data):
    os.makedirs(os.path.dirname(time_tables_file_path), exist_ok=True)
    with open(time_tables_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Events Data Handling
events_file_path = "../data/events.json"
def load_events():
    if os.path.exists(events_file_path):
        with open(events_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_events(data):
    os.makedirs(os.path.dirname(events_file_path), exist_ok=True)
    with open(events_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Faculty Data Handling
faculty_file_path = "../data/faculty.json"
def load_faculty():
    if os.path.exists(faculty_file_path):
        with open(faculty_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_faculty(data):
    os.makedirs(os.path.dirname(faculty_file_path), exist_ok=True)
    with open(faculty_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Placements Data Handling
placements_file_path = "../data/placements.json"
def load_placements():
    if os.path.exists(placements_file_path):
        with open(placements_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_placements(data):
    os.makedirs(os.path.dirname(placements_file_path), exist_ok=True)
    with open(placements_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Research Data Handling
research_file_path = "../data/research.json"
def load_research():
    if os.path.exists(research_file_path):
        with open(research_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_research(data):
    os.makedirs(os.path.dirname(research_file_path), exist_ok=True)
    with open(research_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Gallery Data Handling
gallery_file_path = "../data/gallery.json"
def load_gallery():
    if os.path.exists(gallery_file_path):
        with open(gallery_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_gallery(data):
    os.makedirs(os.path.dirname(gallery_file_path), exist_ok=True)
    with open(gallery_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Blogs Data Handling
blogs_file_path = "../data/blogs.json"
def load_blogs():
    if os.path.exists(blogs_file_path):
        with open(blogs_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_blogs(data):
    os.makedirs(os.path.dirname(blogs_file_path), exist_ok=True)
    with open(blogs_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Jobs Data Handling
jobs_file_path = "../data/jobs.json"
def load_jobs():
    if os.path.exists(jobs_file_path):
        with open(jobs_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_jobs(data):
    os.makedirs(os.path.dirname(jobs_file_path), exist_ok=True)
    with open(jobs_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# Alumni Data Handling
alumni_file_path = "../data/alumni.json"
def load_alumni():
    if os.path.exists(alumni_file_path):
        with open(alumni_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_alumni(data):
    os.makedirs(os.path.dirname(alumni_file_path), exist_ok=True)
    with open(alumni_file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# PDF Loader
@lru_cache(maxsize=1)
def extract_text_from_pdfs():
    data = ""
    pdf_dirs = [
        "../data/circulars", "../data/syllabus", "../data/policies", 
        "../data/academic_calendar", "../data/time_tables"
    ]
    for pdf_dir in pdf_dirs:
        if not os.path.isdir(pdf_dir):
            continue
        for file in os.listdir(pdf_dir):
            if file.endswith(".pdf"):
                try:
                    with fitz.open(os.path.join(pdf_dir, file)) as doc:
                        for page in doc:
                            data += page.get_text()
                except Exception as e:
                    print(f"Error reading {file}: {e}")
    return data

@lru_cache(maxsize=1)
def extract_website_data():
    data = ""
    src_dirs = ["../frontend/src/pages", "../frontend/src/components", "../frontend/src/data"]
    for src_dir in src_dirs:
        if not os.path.isdir(src_dir):
            continue
        for root, _, files in os.walk(src_dir):
            for file in files:
                if file.endswith((".js", ".jsx")):
                    try:
                        with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                            data += f"\\n--- File: {file} ---\\n"
                            data += f.read()
                    except Exception as e:
                        print(f"Error reading {file}: {e}")
    return data

@lru_cache(maxsize=1)
def extract_image_data():
    if not gemini_client: return ""
    file_path = "../data/image_context.txt"
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
            
    data = ""
    img_dirs = ["../data/gallery", "../data/blogs"]
    for img_dir in img_dirs:
        if not os.path.isdir(img_dir):
            continue
        for file in os.listdir(img_dir):
            if file.lower().endswith((".png", ".jpg", ".jpeg")):
                try:
                    # Upload to Gemini using File API or pass bytes directly
                    with open(os.path.join(img_dir, file), "rb") as f:
                        image_bytes = f.read()
                    response = gemini_client.models.generate_content(
                        model="gemini-2.5-flash",
                        contents=[
                            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                            "Describe this image in extreme detail and transcribe any text you see in it. This is for a college website database."
                        ]
                    )
                    data += f"\n--- Image: {file} ---\n{response.text}\n"
                except Exception as e:
                    print(f"Error processing image {file}: {e}")
                    
    # Save to file
    os.makedirs("../data", exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(data)
    return data

def perform_deep_scrape_anits_org():
    base_url = "https://anits.org"
    visited = set()
    to_visit = [base_url]
    data = ""
    
    # Simple BFS scraper, max 25 pages to avoid infinite loops
    max_pages = 25
    count = 0
    
    while to_visit and count < max_pages:
        url = to_visit.pop(0)
        if url in visited:
            continue
            
        visited.add(url)
        count += 1
        
        try:
            response = requests.get(url, timeout=10, verify=False)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                for script in soup(["script", "style"]):
                    script.extract()
                text = soup.get_text(separator=' ', strip=True)
                data += f"\n--- Official Page: {url} ---\n{text}\n"
                
                # Find links
                for link in soup.find_all("a", href=True):
                    href = link['href']
                    if href.startswith("/"):
                        href = base_url + href
                    if href.startswith(base_url) and href not in visited and "#" not in href:
                        to_visit.append(href)
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            
    # Save to file
    os.makedirs("../data", exist_ok=True)
    with open("../data/scraped_anits_org.txt", "w", encoding="utf-8") as f:
        f.write(data)
    return data

@lru_cache(maxsize=1)
def extract_official_website_data():
    file_path = "../data/scraped_anits_org.txt"
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    # If not exists, do a quick fallback or perform scrape
    return perform_deep_scrape_anits_org()

# Load FAQs
faq_data = []
faq_path = "../data/faqs.json"
if os.path.exists(faq_path):
    with open(faq_path, "r", encoding="utf-8") as f:
        faq_data = json.load(f)

# Initialize TF-IDF Vectorizer for FAQs
faq_questions = []
faq_answers = []
tfidf_vectorizer = None
tfidf_matrix = None

if faq_data:
    faq_questions = [item.get("question", "") for item in faq_data]
    faq_answers = [item.get("answer", "") for item in faq_data]
    tfidf_vectorizer = TfidfVectorizer()
    tfidf_matrix = tfidf_vectorizer.fit_transform(faq_questions)

@lru_cache(maxsize=1000)
def translate_cached(text: str, src: str, dest: str) -> str:
    """Cache translations to reduce API calls."""
    try:
        translator = GoogleTranslator(source=src, target=dest)
        return translator.translate(text)
    except Exception as e:
        print(f"Translation error: {e}")
        return text

# Authentication Decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({}), 200
            
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            # Bearer <token>
            token = token.split(" ")[1] if " " in token else token
            jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except Exception as e:
            print("JWT Decode Error:", e)
            return jsonify({"error": "Token is invalid"}), 401
        return f(*args, **kwargs)
    return decorated

def faculty_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({}), 200
            
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            token = token.split(" ")[1] if " " in token else token
            decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            if decoded.get("role") != "faculty":
                return jsonify({"error": "Unauthorized. Faculty access required."}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except Exception as e:
            return jsonify({"error": "Token is invalid"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route("/api/admin/create-faculty", methods=["POST", "OPTIONS"])
@token_required
def create_faculty():
    if request.method == "OPTIONS": return jsonify({}), 200
    try:
        data = request.json
        email = data.get("email")
        password = data.get("password")
        name = data.get("name")
        department = data.get("department")
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
            
        if faculty_users_collection is None:
            return jsonify({"error": "Database not connected"}), 500
            
        existing = faculty_users_collection.find_one({"email": email})
        if existing:
            return jsonify({"error": "Faculty user already exists"}), 400
            
        hashed_password = generate_password_hash(password)
        faculty_users_collection.insert_one({
            "email": email,
            "password": hashed_password,
            "name": name,
            "department": department,
            "created_at": datetime.utcnow()
        })
        
        return jsonify({"message": "Faculty account created successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/faculty/login", methods=["POST", "OPTIONS"])
def faculty_login():
    if request.method == "OPTIONS": return jsonify({}), 200
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    if faculty_users_collection is None:
        return jsonify({"error": "Database not connected"}), 500
        
    user = faculty_users_collection.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401
        
    token = jwt.encode(
        {
            "user": email, 
            "role": "faculty",
            "name": user.get("name", ""),
            "department": user.get("department", ""),
            "exp": datetime.utcnow().timestamp() + 3600*24*7 # 7 days
        }, 
        JWT_SECRET,
        algorithm="HS256"
    )
    return jsonify({
        "token": token, 
        "message": "Login successful",
        "faculty": {
            "name": user.get("name", ""),
            "email": email,
            "department": user.get("department", "")
        }
    })

@app.route("/api/faculty/email-broadcast", methods=["POST", "OPTIONS"])
@faculty_token_required
def faculty_email_broadcast():
    if request.method == "OPTIONS": return jsonify({}), 200
    try:
        data = request.json
        subject = data.get("subject")
        html_body = data.get("html_body")
        target_year = data.get("target_year") # e.g. "3rd"
        target_branch = data.get("target_branch") # e.g. "CSE"
        
        if not subject or not html_body:
            return jsonify({"error": "Subject and HTML body are required"}), 400
            
        if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
            return jsonify({"error": "Gmail credentials not configured in environment"}), 500
            
        # Optional filtering if we want to send to specific students
        query = {}
        if target_year: query["year"] = target_year
        if target_branch: query["branch"] = target_branch
        
        student_emails = []
        if student_records_collection is not None:
            students = list(student_records_collection.find(query))
            student_emails = [s["email"] for s in students if "email" in s]
            
        if not student_emails:
            # Fallback to the sender's email for testing if no students match
            auth_header = request.headers.get("Authorization").split(" ")[1]
            decoded = jwt.decode(auth_header, JWT_SECRET, algorithms=["HS256"])
            student_emails = [decoded.get("user")]
            
        success_count = 0
        
        # Setup SMTP server connection once for all emails
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            
            for email_addr in student_emails:
                try:
                    msg = MIMEMultipart("alternative")
                    msg['Subject'] = subject
                    msg['From'] = f"ANITS Faculty <{GMAIL_ADDRESS}>"
                    msg['To'] = email_addr
                    
                    part2 = MIMEText(html_body, 'html')
                    msg.attach(part2)
                    
                    server.sendmail(GMAIL_ADDRESS, email_addr, msg.as_string())
                    success_count += 1
                except Exception as e:
                    print(f"Error sending email to {email_addr}: {e}")
                    
            server.quit()
        except Exception as e:
            print("SMTP Connection Error:", e)
            return jsonify({"error": "Failed to connect to Gmail SMTP server"}), 500
                
        return jsonify({"message": f"Broadcast sent to {success_count} emails successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/broadcast", methods=["POST", "OPTIONS"])
@token_required
def admin_broadcast():
    try:
        data = request.json
        message = data.get('message')
        if not message:
            return jsonify({"error": "Message is required"}), 400
            
        if telegram_users_collection is None or not TELEGRAM_BOT_TOKEN:
            return jsonify({"error": "Telegram not configured"}), 500
            
        users = list(telegram_users_collection.find({}))
        success_count = 0
        
        base_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
        for user in users:
            try:
                resp = requests.post(f"{base_url}/sendMessage", json={
                    "chat_id": user["chat_id"],
                    "text": f"📢 *ANITS Broadcast*\n\n{message}",
                    "parse_mode": "Markdown"
                }, timeout=5)
                if resp.status_code == 200:
                    success_count += 1
            except Exception as e:
                print(f"Failed to broadcast to {user['chat_id']}: {e}")
                
        return jsonify({"message": f"Broadcast sent to {success_count} students."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/report.pdf", methods=["GET"])
@token_required
def admin_report():
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        import io
        
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Draw Title
        p.setFont("Helvetica-Bold", 24)
        p.drawString(50, 750, "ANITS Assistant - Monthly Analytics Report")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, 720, f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        
        if chat_logs is not None:
            total = chat_logs.count_documents({})
            p.drawString(50, 680, f"Total Queries Served: {total}")
            
            # Aggregate top languages
            pipeline = [
                {"$group": {"_id": "$detected_language", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 5}
            ]
            top_langs = list(chat_logs.aggregate(pipeline))
            
            p.setFont("Helvetica-Bold", 16)
            p.drawString(50, 640, "Top Languages Used:")
            p.setFont("Helvetica", 12)
            y = 610
            for lang in top_langs:
                p.drawString(70, y, f"- {lang['_id']}: {lang['count']} queries")
                y -= 25
                
        p.showPage()
        p.save()
        
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name="ANITS_Monthly_Report.pdf", mimetype="application/pdf")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    
    if email not in ALLOWED_ADMIN_EMAILS:
        return jsonify({"error": "Unauthorized email address"}), 403
        
    if password == ADMIN_PASSWORD:
        token = jwt.encode(
            {"user": email, "exp": datetime.utcnow().timestamp() + 3600*24*30}, # 30 days expire
            JWT_SECRET,
            algorithm="HS256"
        )
        return jsonify({"token": token, "message": "Login successful"})
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/upload_circular", methods=["POST"])
@token_required
def upload_circular():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    if file and file.filename.endswith(".pdf"):
        filename = secure_filename(file.filename)
        pdf_dir = "../data/circulars"
        os.makedirs(pdf_dir, exist_ok=True)
        file.save(os.path.join(pdf_dir, filename))
        # Clear cache so chatbot learns new circular immediately
        extract_text_from_pdfs.cache_clear()
        return jsonify({"message": f"Successfully uploaded {filename}"})
    
    return jsonify({"error": "Only PDF files are allowed"}), 400

@app.route("/api/upload_syllabus", methods=["POST"])
@token_required
def upload_syllabus():
    academic_year = request.form.get("academic_year")
    program = request.form.get("program")
    
    if not academic_year or not program:
        return jsonify({"error": "Academic year and program are required"}), 400
        
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    if file and file.filename.endswith(".pdf"):
        # Generate unique filename to avoid overwrites
        unique_id = str(uuid.uuid4())[:8]
        filename = f"syllabus_{unique_id}_{secure_filename(file.filename)}"
        
        pdf_dir = "../data/syllabus_files"
        os.makedirs(pdf_dir, exist_ok=True)
        file.save(os.path.join(pdf_dir, filename))
        
        # Save to JSON
        syllabus_data = load_syllabus()
        new_entry = {
            "id": unique_id,
            "academic_year": academic_year,
            "program": program,
            "filename": filename,
            "upload_date": datetime.utcnow().isoformat()
        }
        syllabus_data.append(new_entry)
        save_syllabus(syllabus_data)
        
        return jsonify({"message": f"Successfully uploaded syllabus for {program}"})
        
    return jsonify({"error": "Only PDF files are allowed"}), 400

@app.route("/api/syllabus", methods=["GET"])
def get_syllabus():
    data = load_syllabus()
    return jsonify(data)

@app.route("/api/syllabus_file/<filename>")
def serve_syllabus_file(filename):
    pdf_dir = "../data/syllabus_files"
    return send_from_directory(pdf_dir, filename)

@app.route("/api/upload_policy", methods=["POST"])
@token_required
def upload_policy():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    policy_name = request.form.get("policy_name")
    
    if not policy_name:
        return jsonify({"error": "Policy name is required"}), 400
        
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    if file and file.filename.endswith(".pdf"):
        # Format the policy name to be URL-safe (e.g., "IT Policy" -> "it-policy")
        formatted_name = policy_name.lower().replace(" ", "-").replace("/", "-")
        filename = f"{formatted_name}.pdf"
        
        pdf_dir = "../data/policies"
        os.makedirs(pdf_dir, exist_ok=True)
        file.save(os.path.join(pdf_dir, filename))
        
        return jsonify({"message": f"Successfully uploaded {policy_name}"})
        
    return jsonify({"error": "Only PDF files are allowed"}), 400

@app.route("/api/policy_file/<filename>")
def serve_policy_file(filename):
    pdf_dir = "../data/policies"
    return send_from_directory(pdf_dir, filename)

@app.route("/api/upload_academic_calendar", methods=["POST"])
@token_required
def upload_academic_calendar():
    academic_year_header = request.form.get("academic_year_header")
    year = request.form.get("year")
    program = request.form.get("program")
    
    if not academic_year_header or not year or not program:
        return jsonify({"error": "Academic year header, year, and program are required"}), 400
        
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    if file and file.filename.endswith(".pdf"):
        unique_id = str(uuid.uuid4())[:8]
        filename = f"calendar_{unique_id}_{secure_filename(file.filename)}"
        
        pdf_dir = "../data/academic_calendar_files"
        os.makedirs(pdf_dir, exist_ok=True)
        file.save(os.path.join(pdf_dir, filename))
        
        calendar_data = load_academic_calendar()
        
        # We need to structure the JSON grouping by yearHeader
        # e.g., [{"yearHeader": "Academic Year 2025-26", "items": [{"year": "2025-26", "program": "UG", "filename": "..."}]}]
        
        # Find if section exists
        section = next((s for s in calendar_data if s["yearHeader"] == academic_year_header), None)
        new_item = {
            "id": unique_id,
            "year": year,
            "program": program,
            "filename": filename,
            "upload_date": datetime.utcnow().isoformat()
        }
        
        if section:
            section["items"].append(new_item)
        else:
            calendar_data.append({
                "yearHeader": academic_year_header,
                "items": [new_item]
            })
            
        save_academic_calendar(calendar_data)
        
        return jsonify({"message": f"Successfully uploaded calendar for {program}"})
        
    return jsonify({"error": "Only PDF files are allowed"}), 400

@app.route("/api/academic_calendar", methods=["GET"])
def get_academic_calendar():
    data = load_academic_calendar()
    return jsonify(data)

@app.route("/api/academic_calendar_file/<filename>")
def serve_academic_calendar_file(filename):
    pdf_dir = "../data/academic_calendar_files"
    return send_from_directory(pdf_dir, filename)

@app.route("/api/upload_time_table", methods=["POST"])
@token_required
def upload_time_table():
    department = request.form.get("department")
    
    if not department:
        return jsonify({"error": "Department name is required"}), 400
        
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    if file and file.filename.endswith(".pdf"):
        unique_id = str(uuid.uuid4())[:8]
        filename = f"timetable_{unique_id}_{secure_filename(file.filename)}"
        
        pdf_dir = "../data/time_table_files"
        os.makedirs(pdf_dir, exist_ok=True)
        file.save(os.path.join(pdf_dir, filename))
        
        time_tables_data = load_time_tables()
        
        # If department already exists, update filename, else add new
        existing_idx = next((i for i, t in enumerate(time_tables_data) if t["department"] == department), None)
        if existing_idx is not None:
            time_tables_data[existing_idx]["filename"] = filename
            time_tables_data[existing_idx]["upload_date"] = datetime.utcnow().isoformat()
        else:
            time_tables_data.append({
                "id": unique_id,
                "department": department,
                "filename": filename,
                "upload_date": datetime.utcnow().isoformat()
            })
            
        save_time_tables(time_tables_data)
        
        return jsonify({"message": f"Successfully uploaded Time Table for {department}"})
        
    return jsonify({"error": "Only PDF files are allowed"}), 400

@app.route("/api/time_tables", methods=["GET"])
def get_time_tables():
    data = load_time_tables()
    return jsonify(data)

@app.route("/api/time_table_file/<filename>")
def serve_time_table_file(filename):
    pdf_dir = "../data/time_table_files"
    return send_from_directory(pdf_dir, filename)

@app.route("/api/events", methods=["GET"])
def get_events():
    data = load_events()
    return jsonify(data)

@app.route("/api/events", methods=["POST"])
@token_required
def add_event():
    data = request.get_json()
    title = data.get("title")
    date = data.get("date")
    description = data.get("description")
    
    if not title or not date or not description:
        return jsonify({"error": "Title, date, and description are required"}), 400
        
    events_data = load_events()
    new_event = {
        "id": str(uuid.uuid4())[:8],
        "title": title,
        "date": date,
        "description": description,
        "created_at": datetime.utcnow().isoformat()
    }
    events_data.append(new_event)
    save_events(events_data)
    
    return jsonify({"message": "Event added successfully", "event": new_event})

@app.route("/api/events/<event_id>", methods=["DELETE"])
@token_required
def delete_event(event_id):
    events_data = load_events()
    filtered_data = [e for e in events_data if e.get("id") != event_id]
    
    if len(filtered_data) == len(events_data):
        return jsonify({"error": "Event not found"}), 404
        
    save_events(filtered_data)
    return jsonify({"message": "Event deleted successfully"})

@app.route("/api/faculty", methods=["GET"])
def get_faculty():
    data = load_faculty()
    return jsonify(data)

@app.route("/api/faculty", methods=["POST"])
@token_required
def add_faculty():
    data = request.get_json()
    name = data.get("name")
    department = data.get("department")
    designation = data.get("designation")
    qualification = data.get("qualification", "")
    email = data.get("email", "")
    
    if not name or not department or not designation:
        return jsonify({"error": "Name, department, and designation are required"}), 400
        
    faculty_data = load_faculty()
    new_faculty = {
        "id": str(uuid.uuid4())[:8],
        "name": name,
        "department": department,
        "designation": designation,
        "qualification": qualification,
        "email": email,
        "created_at": datetime.utcnow().isoformat()
    }
    faculty_data.append(new_faculty)
    save_faculty(faculty_data)
    
    return jsonify({"message": "Faculty member added successfully", "faculty": new_faculty})

@app.route("/api/faculty/<faculty_id>", methods=["DELETE"])
@token_required
def delete_faculty(faculty_id):
    faculty_data = load_faculty()
    filtered_data = [f for f in faculty_data if f.get("id") != faculty_id]
    
    if len(filtered_data) == len(faculty_data):
        return jsonify({"error": "Faculty not found"}), 404
        
    save_faculty(filtered_data)
    return jsonify({"message": "Faculty deleted successfully"})

@app.route("/api/placements", methods=["GET"])
def get_placements():
    data = load_placements()
    return jsonify(data)

@app.route("/api/placements", methods=["POST"])
@token_required
def add_placement():
    data = request.get_json()
    year = data.get("year")
    total_offers = data.get("total_offers")
    highest_package = data.get("highest_package")
    average_package = data.get("average_package")
    total_recruiters = data.get("total_recruiters")
    
    if not year or not total_offers or not highest_package or not average_package or not total_recruiters:
        return jsonify({"error": "All placement fields are required"}), 400
        
    placements_data = load_placements()
    new_placement = {
        "id": str(uuid.uuid4())[:8],
        "year": year,
        "total_offers": total_offers,
        "highest_package": highest_package,
        "average_package": average_package,
        "total_recruiters": total_recruiters,
        "created_at": datetime.utcnow().isoformat()
    }
    placements_data.append(new_placement)
    save_placements(placements_data)
    
    return jsonify({"message": "Placement stats added successfully", "placement": new_placement})

@app.route("/api/placements/<placement_id>", methods=["DELETE"])
@token_required
def delete_placement(placement_id):
    placements_data = load_placements()
    filtered_data = [p for p in placements_data if p.get("id") != placement_id]
    
    if len(filtered_data) == len(placements_data):
        return jsonify({"error": "Placement record not found"}), 404
        
    save_placements(filtered_data)
    return jsonify({"message": "Placement record deleted successfully"})

@app.route("/api/research", methods=["GET"])
def get_research():
    data = load_research()
    return jsonify(data)

@app.route("/api/research", methods=["POST"])
@token_required
def add_research():
    data = request.get_json()
    title = data.get("title")
    authors = data.get("authors")
    journal = data.get("journal")
    year = data.get("year")
    link = data.get("link", "")
    department = data.get("department", "General")
    
    if not title or not authors or not journal or not year:
        return jsonify({"error": "Title, authors, journal, and year are required"}), 400
        
    research_data = load_research()
    new_research = {
        "id": str(uuid.uuid4())[:8],
        "title": title,
        "authors": authors,
        "journal": journal,
        "year": year,
        "link": link,
        "department": department,
        "created_at": datetime.utcnow().isoformat()
    }
    research_data.append(new_research)
    save_research(research_data)
    
    return jsonify({"message": "Research publication added successfully", "research": new_research})

@app.route("/api/research/<research_id>", methods=["DELETE"])
@token_required
def delete_research(research_id):
    research_data = load_research()
    filtered_data = [r for r in research_data if r.get("id") != research_id]
    
    if len(filtered_data) == len(research_data):
        return jsonify({"error": "Research record not found"}), 404
        
    save_research(filtered_data)
    return jsonify({"message": "Research record deleted successfully"})

@app.route("/api/upload_gallery", methods=["POST"])
@token_required
def upload_gallery():
    title = request.form.get("title")
    category = request.form.get("category", "General")
    
    if not title:
        return jsonify({"error": "Title is required"}), 400
        
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    allowed_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext in allowed_extensions:
        unique_id = str(uuid.uuid4())[:8]
        filename = f"gallery_{unique_id}_{secure_filename(file.filename)}"
        
        gallery_dir = "../data/gallery_files"
        os.makedirs(gallery_dir, exist_ok=True)
        file.save(os.path.join(gallery_dir, filename))
        
        gallery_data = load_gallery()
        new_item = {
            "id": unique_id,
            "title": title,
            "category": category,
            "filename": filename,
            "upload_date": datetime.utcnow().isoformat()
        }
        gallery_data.append(new_item)
        save_gallery(gallery_data)
        
        return jsonify({"message": "Successfully uploaded image", "item": new_item})
        
    return jsonify({"error": "Only image files are allowed"}), 400

@app.route("/api/gallery", methods=["GET"])
def get_gallery():
    data = load_gallery()
    return jsonify(data)

@app.route("/api/gallery_file/<filename>")
def serve_gallery_file(filename):
    gallery_dir = "../data/gallery_files"
    return send_from_directory(gallery_dir, filename)

@app.route("/api/gallery/<gallery_id>", methods=["DELETE"])
@token_required
def delete_gallery(gallery_id):
    gallery_data = load_gallery()
    filtered_data = [g for g in gallery_data if g.get("id") != gallery_id]
    
    if len(filtered_data) == len(gallery_data):
        return jsonify({"error": "Gallery item not found"}), 404
        
    # We could also delete the file here to save space, but keeping it simple for now
    save_gallery(filtered_data)
    return jsonify({"message": "Gallery item deleted successfully"})

@app.route("/api/upload_blog", methods=["POST"])
@token_required
def upload_blog():
    title = request.form.get("title")
    author = request.form.get("author", "ANITS")
    content = request.form.get("content")
    
    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400
        
    filename = None
    if "file" in request.files and request.files["file"].filename != "":
        file = request.files["file"]
        allowed_extensions = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
        ext = os.path.splitext(file.filename)[1].lower()
        if ext in allowed_extensions:
            unique_id = str(uuid.uuid4())[:8]
            filename = f"blog_{unique_id}_{secure_filename(file.filename)}"
            blog_img_dir = "../data/blog_images"
            os.makedirs(blog_img_dir, exist_ok=True)
            file.save(os.path.join(blog_img_dir, filename))
    
    blogs_data = load_blogs()
    new_blog = {
        "id": str(uuid.uuid4())[:8],
        "title": title,
        "author": author,
        "content": content,
        "image": filename,
        "created_at": datetime.utcnow().isoformat()
    }
    blogs_data.append(new_blog)
    save_blogs(blogs_data)
    
    return jsonify({"message": "Successfully published blog post", "blog": new_blog})

@app.route("/api/blogs", methods=["GET"])
def get_blogs():
    data = load_blogs()
    return jsonify(data)

@app.route("/api/blog_image/<filename>")
def serve_blog_image(filename):
    blog_img_dir = "../data/blog_images"
    return send_from_directory(blog_img_dir, filename)

@app.route("/api/blogs/<blog_id>", methods=["DELETE"])
@token_required
def delete_blog(blog_id):
    blogs_data = load_blogs()
    filtered_data = [b for b in blogs_data if b.get("id") != blog_id]
    
    if len(filtered_data) == len(blogs_data):
        return jsonify({"error": "Blog post not found"}), 404
        
    save_blogs(filtered_data)
    return jsonify({"message": "Blog post deleted successfully"})

@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    data = load_jobs()
    return jsonify(data)

@app.route("/api/jobs", methods=["POST"])
@token_required
def add_job():
    data = request.get_json()
    title = data.get("title")
    company = data.get("company")
    role = data.get("role")
    salary = data.get("salary", "Not Disclosed")
    deadline = data.get("deadline", "Rolling")
    link = data.get("link", "")
    
    if not title or not company or not role:
        return jsonify({"error": "Title, company, and role are required"}), 400
        
    jobs_data = load_jobs()
    new_job = {
        "id": str(uuid.uuid4())[:8],
        "title": title,
        "company": company,
        "role": role,
        "salary": salary,
        "deadline": deadline,
        "link": link,
        "created_at": datetime.utcnow().isoformat()
    }
    jobs_data.append(new_job)
    save_jobs(jobs_data)
    
    return jsonify({"message": "Successfully posted job", "job": new_job})

@app.route("/api/jobs/<job_id>", methods=["DELETE"])
@token_required
def delete_job(job_id):
    jobs_data = load_jobs()
    filtered_data = [j for j in jobs_data if j.get("id") != job_id]
    
    if len(filtered_data) == len(jobs_data):
        return jsonify({"error": "Job post not found"}), 404
        
    save_jobs(filtered_data)
    return jsonify({"message": "Job post deleted successfully"})

@app.route("/api/alumni", methods=["GET"])
def get_alumni():
    data = load_alumni()
    return jsonify(data)

@app.route("/api/alumni", methods=["POST"])
@limiter.limit("5 per minute")
def register_alumni():
    data = request.get_json()
    name = data.get("name")
    batch = data.get("batch")
    department = data.get("department")
    company = data.get("company")
    role = data.get("role")
    linkedin = data.get("linkedin")
    
    if not name or not batch or not department:
        return jsonify({"error": "Name, batch, and department are required"}), 400
        
    alumni_data = load_alumni()
    new_alumni = {
        "id": str(uuid.uuid4())[:8],
        "name": name,
        "batch": batch,
        "department": department,
        "company": company or "",
        "role": role or "",
        "linkedin": linkedin or "",
        "registered_at": datetime.utcnow().isoformat()
    }
    alumni_data.append(new_alumni)
    save_alumni(alumni_data)
    
    return jsonify({"message": "Alumni registered successfully", "alumni": new_alumni})

@app.route("/api/contact", methods=["POST"])
@limiter.limit("5 per minute")
def submit_contact():
    data = request.get_json()
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone", "")
    subject = data.get("subject", "")
    message = data.get("message")
    
    if not name or not email or not message:
        return jsonify({"error": "Name, email, and message are required"}), 400
        
    enquiry = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "message": message,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "unread"
    }
    
    # Save to MongoDB if available, else JSON fallback
    if enquiries_collection is not None:
        try:
            enquiries_collection.insert_one(enquiry)
        except Exception as e:
            print("Failed to save to MongoDB, falling back to JSON", e)
            local_data = load_enquiries()
            local_data.append(enquiry)
            save_enquiries(local_data)
    else:
        local_data = load_enquiries()
        local_data.append(enquiry)
        save_enquiries(local_data)
        
    return jsonify({"message": "Enquiry submitted successfully", "id": enquiry["id"]})

@app.route("/api/enquiries", methods=["GET"])
@token_required
def get_enquiries():
    if enquiries_collection is not None:
        try:
            enquiries = list(enquiries_collection.find().sort("timestamp", -1).limit(200))
            for eq in enquiries:
                eq["_id"] = str(eq["_id"])
            return jsonify(enquiries)
        except Exception as e:
            pass
            
    # Fallback to JSON
    data = load_enquiries()
    data = list(db.logs.find({}, {"_id": 0}))
    data.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return jsonify(data)

@app.route("/api/train-web", methods=["POST"])
@token_required
def train_web():
    try:
        perform_deep_scrape_anits_org()
        extract_official_website_data.cache_clear()
        extract_official_website_data() # pre-warm
        return jsonify({"message": "Deep scrape of anits.org complete."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/train-docs", methods=["POST"])
@token_required
def train_docs():
    try:
        extract_text_from_pdfs.cache_clear()
        extract_text_from_pdfs() # pre-warm
        return jsonify({"message": "PDFs and Documents processed successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/train-ui", methods=["POST"])
@token_required
def train_ui():
    try:
        extract_website_data.cache_clear()
        extract_website_data() # pre-warm
        return jsonify({"message": "Local React UI Codebase indexed successfully."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


MAX_MESSAGE_LENGTH = 10000



# Mock Student Database for SSO features
def load_student_db():
    try:
        with open("../data/demo_students.json", "r", encoding="utf-8") as f:
            data = json.load(f)
            data.pop("_comment", None)
            return data
    except Exception:
        return {}

STUDENT_DB = load_student_db()

query_cache = {}

def answer_query(user_message, session_id="default", audio_payload=None, image_payload=None):
    if not audio_payload and user_message:
        normalized_query = user_message.lower().strip()
        
        # Handle student login (mock SSO)
        if normalized_query.startswith("/login"):
            parts = normalized_query.split()
            if len(parts) >= 2:
                roll_no = parts[1]
                students_collection = db["students"]
                student = students_collection.find_one({"roll_number": roll_no})
                if student:
                    name = student.get("name", student.get("Name", "Student"))
                    return {"type": "contact_request", "roll_number": roll_no, "name": name}
                elif roll_no in STUDENT_DB:
                    return {"type": "contact_request", "roll_number": roll_no, "name": STUDENT_DB[roll_no]['name']}
                else:
                    return "❌ Invalid Roll Number. Please check and try again."
        
        if normalized_query in query_cache:
            print("Cache hit for:", normalized_query)
            return query_cache[normalized_query]
            
    try:
        # Check if user is logged in
        student_context = ""
        if telegram_users_collection is not None and "telegram_" in session_id:
            chat_id = session_id.replace("telegram_", "")
            user_data = telegram_users_collection.find_one({"chat_id": int(chat_id) if chat_id.isdigit() else chat_id})
            if user_data and "student_id" in user_data:
                roll_no = user_data["student_id"]
                if roll_no in STUDENT_DB:
                    sd = STUDENT_DB[roll_no]
                    student_context = f"\n\n[USER CONTEXT: The user speaking to you is logged in as {sd['name']}, Roll No: {roll_no}. Their attendance is {sd['attendance']}, CGPA is {sd['marks']}, and next exam is {sd['next_exam']}]. Use this info if they ask personal questions."

        # langdetect is notoriously inaccurate for very short words like "hi" or "hallo"
        if user_message and len(user_message.split()) >= 3:
            lang_code = detect(user_message)
        else:
            lang_code = "en"
    except:
        lang_code = "en"
        
    try:
        # Fetch history from MongoDB
        history_docs = list(db['chat_logs'].find({"session_id": session_id}).sort("timestamp", -1).limit(5))
        history_docs.reverse()
        history = []
        for doc in history_docs:
            history.append({"role": "user", "content": doc.get("user_message", "")})
            history.append({"role": "assistant", "content": doc.get("bot_reply", "")})

        # Vector Search MongoDB
        vector_context = ""
        if user_message:
            try:
                emb_model = get_embedding_model()
                if emb_model:
                    query_embedding = list(emb_model.embed([user_message]))[0].tolist()
                    pipeline = [
                        {
                            "$vectorSearch": {
                                "index": "vector_index",
                                "path": "embedding",
                                "queryVector": query_embedding,
                                "numCandidates": 50,
                                "limit": 4
                            }
                        },
                        {
                            "$project": {
                                "_id": 0,
                                "text": 1,
                                "type": 1,
                                "score": { "$meta": "vectorSearchScore" }
                            }
                        }
                    ]
                    results = list(db['knowledge_base'].aggregate(pipeline))
                    vector_chunks = [res.get('text', '') for res in results]
                    vector_context = "\n\n".join(vector_chunks)
            except Exception as e:
                print(f"Vector search failed: {e}")

        # Fallback Contexts
        pdf_context = extract_text_from_pdfs()[:2000]
        official_web_context = extract_official_website_data()[:2000]
        
        # Format history for Gemini
        gemini_contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            gemini_contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg["content"])]))
            
        user_parts = []
        if user_message:
            user_parts.append(types.Part.from_text(text=user_message))
            
        if audio_payload:
            import base64
            audio_bytes = base64.b64decode(audio_payload.split(',')[1] if ',' in audio_payload else audio_payload)
            user_parts.append(types.Part.from_bytes(data=audio_bytes, mime_type="audio/webm"))
            if not user_message and not image_payload:
                user_parts.append(types.Part.from_text(text="Listen to this audio and reply naturally."))
                
        if image_payload:
            import base64
            # Determine mime type from base64 header if present, otherwise default to jpeg
            mime_type = "image/jpeg"
            if image_payload.startswith("data:image/"):
                mime_type = image_payload.split(';')[0].split(':')[1]
            
            image_bytes = base64.b64decode(image_payload.split(',')[1] if ',' in image_payload else image_payload)
            user_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
            if not user_message and not audio_payload:
                user_parts.append(types.Part.from_text(text="Describe this image in detail or answer any implied questions."))
                
        gemini_contents.append(types.Content(role="user", parts=user_parts))
        
        sys_instruct = (
            "You are an incredibly smart, highly capable General Intelligence AI and the official Assistant for ANITS College. "
            "Act as a friendly, helpful, and concise conversational assistant. "
            "You actively fetch live internet data when asked about current events, global knowledge, or anything outside the provided college dataset. "
            "Use your built-in Google Search tool to answer anything the user asks you about the real world! "
            "For ANITS-specific questions, heavily rely on the 'Vector Search Data' which contains the most relevant college information. "
            "CRITICAL INSTRUCTION FOR FORMATTING: Do NOT output raw asterisk lists or em dashes. Use proper cleanly formatted paragraphs, or numbered lists (1. 2. 3.). "
            "CRITICAL INSTRUCTION FOR ANONYMITY: Never mention internal file names, vector DBs, or say 'according to the scraped data'. Synthesize the information naturally as if you are a human college expert speaking directly to a student! "
            "CRITICAL INSTRUCTION FOR LANGUAGE: You are a deeply multilingual AI. Always adapt to the user's language natively. "
            "If the user speaks ANY official Indian language (e.g., Hindi, Telugu, Tamil, Bengali, Marathi, Gujarati, etc.) using English/Latin letters (e.g., 'Hinglish', 'Tenglish' like 'kya haal hai' or 'anits kaisa college hai'), YOU MUST reply back in the EXACT same Romanized style natively. "
            "Maintain context from the conversation naturally. "
            f"Current detected text language code: '{lang_code}'. (Note: ignore this code if the user is clearly speaking Hinglish/Romanized regional languages).\n\n"
            f"Vector Search Data (HIGHLY RELEVANT):\n{vector_context}\n\n"
            f"Official Website Fallback Data:\n{official_web_context}\n\n"
            f"PDF Documents Fallback Context:\n{pdf_context}\n\n"
            f"{student_context}"
        )
        
        # Advanced AI Routing (Multi-Agent Simulation)
        if user_message and any(word in user_message.lower() for word in ["compare", "difference", "vs", "versus", "analyze", "evaluate"]):
            sys_instruct += "\n\n[REASONING AGENT MODE ENABLED]: The user is asking a complex comparative or analytical question. You MUST act as an advanced Reasoning Agent. Break down your answer into clear Pros/Cons or Differences using highly structured comparative analysis."
            

        import time
        max_retries = 3
        response = None
        for attempt in range(max_retries):
            try:
                response = gemini_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=gemini_contents,
                    config=types.GenerateContentConfig(
                        system_instruction=sys_instruct,
                        max_output_tokens=2048,
                        tools=[{"google_search": {}}]
                    )
                )
                break
            except Exception as e:
                if ("429" in str(e) or "RESOURCE_EXHAUSTED" in str(e)) and attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    raise e
        bot_reply = response.text.strip()
        
        # Clean up Markdown artifacts that don't render well in Telegram/Chat widget
        import re
        bot_reply = re.sub(r'\*\*(.*?)\*\*', r'\1', bot_reply)  # Remove bold **
        bot_reply = re.sub(r'(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)', r'\1', bot_reply)  # Remove italic *
        bot_reply = re.sub(r'#+\s*(.*?)\n', r'\1\n', bot_reply) # Remove heading hashes
        bot_reply = bot_reply.replace('---', '-')
        
        # Save to cache
        if not audio_payload and user_message:
            normalized_query = user_message.lower().strip()
            query_cache[normalized_query] = bot_reply
            
        # Log to MongoDB
        try:
            if db is not None:
                db['chat_logs'].insert_one({
                    "session_id": session_id,
                    "user_message": user_message,
                    "bot_reply": bot_reply,
                    "detected_language": lang_code,
                    "timestamp": datetime.utcnow()
                })
        except Exception as e:
            print("MongoDB Log error:", e)
            
        return bot_reply

    except Exception as e:
        import traceback
        trace = traceback.format_exc()
        print(f"Gemini API error: {e}\n{trace}")
        error_str = str(e)
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            return "I am currently processing too many requests (Rate Limit Reached). Please wait about 30 seconds and ask me again!"
        elif "503" in error_str or "UNAVAILABLE" in error_str:
            return "I am currently experiencing a massive surge in traffic! Please give me a few moments and try your question again."
        else:
            return "I'm sorry, I am currently experiencing technical difficulties. Please try again later."


@app.route("/chat", methods=["POST"])
@limiter.limit("55 per minute")
def chat():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing payload"}), 400
        
    user_message = data.get("message", "").strip()
    session_id = data.get("session_id", "default")
    audio_payload = data.get("audio")
    image_payload = data.get("image")
    
    if not user_message and not audio_payload and not image_payload:
        return jsonify({"error": "Message, image, or audio cannot be empty"}), 400
        
    if len(user_message) > 10000:
        return jsonify({"error": "Message exceeds 10000 characters limit"}), 400

    bot_reply = answer_query(user_message, session_id, audio_payload, image_payload)
    return jsonify({"reply": bot_reply})



def process_twilio_message(incoming_msg, sender_number, receiver_number):
    try:
        session_id = sender_number if sender_number else "whatsapp_default"
        bot_reply = answer_query(incoming_msg, session_id=session_id)
        
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        
        if account_sid and auth_token:
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            client.messages.create(
                body=bot_reply,
                from_=receiver_number,
                to=sender_number
            )
        else:
            print("Missing Twilio credentials in environment.")
    except Exception as e:
        print(f"Twilio REST API Error: {e}")

@app.route("/api/whatsapp", methods=["POST"])
def whatsapp_webhook():
    # TEMPORARILY DISABLED: User is using Twilio for another project
    # incoming_msg = request.values.get('Body', '').strip()
    # sender_number = request.values.get('From', '')
    # receiver_number = request.values.get('To', '')
    # 
    # threading.Thread(
    #     target=process_twilio_message, 
    #     args=(incoming_msg, sender_number, receiver_number), 
    #     daemon=True
    # ).start()
    
    # Acknowledge receipt immediately without processing
    return '', 200


@app.route("/api/recent_queries", methods=["GET"])
@token_required
def recent_queries():
    try:
        # Fetch the last 50 queries
        recent_docs = list(ChatLog.query.order_by(ChatLog.timestamp.desc()).limit(50).all())
        queries = []
        for doc in recent_docs:
            queries.append({
                "id": doc.id,
                "user_message": doc.user_message,
                "detected_language": doc.detected_language,
                "timestamp": doc.timestamp.isoformat()
            })
        return jsonify(queries)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analytics", methods=["GET"])
@token_required
def analytics():
    try:
        total_messages = ChatLog.query.count()
        
        # Language breakdown
        langs = sql_db.session.query(ChatLog.detected_language, sql_db.func.count(ChatLog.id)).group_by(ChatLog.detected_language).all()
        language_breakdown = {lang: count for lang, count in langs}
        
        # Top 10 frequently asked questions
        top_questions_query = sql_db.session.query(ChatLog.user_message, sql_db.func.count(ChatLog.id)).group_by(ChatLog.user_message).order_by(sql_db.func.count(ChatLog.id).desc()).limit(10).all()
        top_questions = {q: c for q, c in top_questions_query}
        
        return jsonify({
            "total_messages": total_messages,
            "language_usage": language_breakdown,
            "frequent_questions": top_questions
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

import subprocess

@app.route("/api/upload", methods=["POST"])
@token_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        os.makedirs("data", exist_ok=True)
        file_path = os.path.join("data", filename)
        file.save(file_path)
        return jsonify({"message": f"File {filename} uploaded successfully. Remember to trigger sync!"}), 200
    return jsonify({"error": "Only PDF files are allowed"}), 400

@app.route("/api/sync", methods=["POST"])
@token_required
def sync_data():
    try:
        def run_sync():
            try:
                import sys
                subprocess.run([sys.executable, "sync_vectors.py"], check=True)
                print("Vector DB Sync completed successfully.")
            except Exception as e:
                print(f"Error during vector sync: {e}")
                
        threading.Thread(target=run_sync, daemon=True).start()
        
        return jsonify({"message": "Data sync process started in the background. This may take a few minutes."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/export", methods=["GET"])
@token_required
def export_logs():
    try:
        logs = ChatLog.query.order_by(ChatLog.timestamp.desc()).all()
        
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerow(['id', 'user_message', 'bot_reply', 'detected_language', 'timestamp'])
        
        for log in logs:
            cw.writerow([log.id, log.user_message, log.bot_reply, log.detected_language, log.timestamp.isoformat() if log.timestamp else ''])
            
        output = si.getvalue()
        return Response(
            output,
            mimetype="text/csv",
            headers={"Content-Disposition": "attachment;filename=chat_logs.csv"}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health_check():
    try:
        # Check DB connection
        ChatLog.query.limit(1).all()
        return jsonify({
            "status": "ok",
            "db_connected": True,
            "timestamp": datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "reason": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500


def telegram_polling():
    if not TELEGRAM_BOT_TOKEN:
        print("Telegram bot token not found. Skipping Telegram polling.")
        return
        
    base_url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
    offset = None
    
    print("Started Telegram Polling Thread!")
    while True:
        try:
            url = f"{base_url}/getUpdates?timeout=30"
            if offset:
                url += f"&offset={offset}"
                
            response = requests.get(url, timeout=40)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    for update in data["result"]:
                        offset = update["update_id"] + 1
                        
                        if "message" in update:
                            msg = update["message"]
                            chat_id = msg["chat"]["id"]
                            session_id = f"telegram_{chat_id}"
                            
                            # Track user for broadcasting
                            if telegram_users_collection is not None:
                                try:
                                    telegram_users_collection.update_one(
                                        {"chat_id": chat_id},
                                        {"$set": {"chat_id": chat_id, "last_active": datetime.utcnow()}},
                                        upsert=True
                                    )
                                except Exception as db_err:
                                    print("Failed to save telegram user:", db_err)
                            
                            if "text" in msg:
                                user_text = msg["text"]
                                if user_text.startswith('/start'):
                                    reply_markup = {
                                        "keyboard": [
                                            [{"text": "🏫 Admissions"}, {"text": "💼 Placements"}],
                                            [{"text": "📅 Academic Calendar"}, {"text": "📞 Contact Info"}]
                                        ],
                                        "resize_keyboard": True
                                    }
                                    requests.post(f"{base_url}/sendMessage", json={
                                        "chat_id": chat_id,
                                        "text": "Welcome to the ANITS Assistant! I can answer any questions you have about the college. Try tapping one of the buttons below, sending a voice message, or typing your question in English, Telugu, or Hindi!",
                                        "reply_markup": reply_markup
                                    })
                                    continue
                                
                                requests.post(f"{base_url}/sendChatAction", json={"chat_id": chat_id, "action": "typing"})
                                bot_reply = answer_query(user_text, session_id=session_id)
                                if isinstance(bot_reply, dict) and bot_reply.get("type") == "contact_request":
                                    if telegram_users_collection is not None:
                                        telegram_users_collection.update_one(
                                            {"chat_id": chat_id},
                                            {"$set": {"pending_roll_number": bot_reply.get("roll_number")}}
                                        )
                                    reply_markup = {
                                        "keyboard": [[{"text": "📱 Share Phone Number to Verify", "request_contact": True}]],
                                        "one_time_keyboard": True,
                                        "resize_keyboard": True
                                    }
                                    requests.post(f"{base_url}/sendMessage", json={
                                        "chat_id": chat_id,
                                        "text": f"Welcome {bot_reply.get('name', '')}! To protect your privacy, please verify your identity by sharing your phone number.",
                                        "reply_markup": reply_markup
                                    })
                                else:
                                    requests.post(f"{base_url}/sendMessage", json={"chat_id": chat_id, "text": bot_reply})
                            
                            elif "contact" in msg:
                                phone_number = msg["contact"].get("phone_number")
                                if phone_number and telegram_users_collection is not None:
                                    user_data = telegram_users_collection.find_one({"chat_id": chat_id})
                                    if user_data and "pending_roll_number" in user_data:
                                        roll_no = user_data["pending_roll_number"]
                                        clean_phone = ''.join(filter(str.isdigit, str(phone_number)))
                                        if clean_phone.startswith("91") and len(clean_phone) > 10:
                                            clean_phone = clean_phone[-10:]
                                            
                                        students_collection = db["students"]
                                        student = students_collection.find_one({"roll_number": roll_no})
                                        db_phone = ""
                                        if student:
                                            db_phone = str(student.get("phone", student.get("Phone", student.get("phone_number", ""))))
                                        elif roll_no in STUDENT_DB:
                                            db_phone = STUDENT_DB[roll_no].get("phone", "")
                                            
                                        clean_db_phone = ''.join(filter(str.isdigit, db_phone))
                                        if clean_db_phone.startswith("91") and len(clean_db_phone) > 10:
                                            clean_db_phone = clean_db_phone[-10:]
                                            
                                        if not clean_db_phone or clean_phone == clean_db_phone:
                                            telegram_users_collection.update_one(
                                                {"chat_id": chat_id},
                                                {"$set": {"student_id": roll_no}, "$unset": {"pending_roll_number": ""}}
                                            )
                                            requests.post(f"{base_url}/sendMessage", json={
                                                "chat_id": chat_id,
                                                "text": "✅ Successfully verified! You are now securely logged in. You can ask about your personal data.",
                                                "reply_markup": {"remove_keyboard": True}
                                            })
                                        else:
                                            requests.post(f"{base_url}/sendMessage", json={
                                                "chat_id": chat_id,
                                                "text": "❌ Verification failed. The phone number does not match our records.",
                                                "reply_markup": {"remove_keyboard": True}
                                            })
                            elif "voice" in msg:
                                file_id = msg["voice"]["file_id"]
                                requests.post(f"{base_url}/sendChatAction", json={"chat_id": chat_id, "action": "typing"})
                                
                                file_info = requests.get(f"{base_url}/getFile?file_id={file_id}").json()
                                if file_info.get("ok"):
                                    file_path = file_info["result"]["file_path"]
                                    download_url = f"https://api.telegram.org/file/bot{TELEGRAM_BOT_TOKEN}/{file_path}"
                                    audio_data = requests.get(download_url).content
                                    import base64
                                    audio_payload = f"data:audio/ogg;base64,{base64.b64encode(audio_data).decode('utf-8')}"
                                    bot_reply = answer_query("", session_id=session_id, audio_payload=audio_payload)
                                    requests.post(f"{base_url}/sendMessage", json={"chat_id": chat_id, "text": bot_reply})
        except Exception as e:
            print(f"Telegram polling error: {e}")
            time.sleep(5)
            
if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
    threading.Thread(target=telegram_polling, daemon=True).start()


import pandas as pd
import docx
import fitz
import json

@app.route("/api/admin/upload_student_data", methods=["POST", "OPTIONS"])
@token_required
def upload_student_data():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    filename = file.filename.lower()
    students_collection = db["students"]
    inserted_count = 0
    records = []
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(file)
            records = df.to_dict(orient='records')
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(file)
            records = df.to_dict(orient='records')
        elif filename.endswith(".json"):
            data = json.loads(file.read().decode('utf-8', errors='ignore'))
            records = data if isinstance(data, list) else [data]
        elif filename.endswith(".pdf") or filename.endswith(".docx") or filename.endswith(".txt"):
            text = ""
            if filename.endswith(".pdf"):
                doc = fitz.open(stream=file.read(), filetype="pdf")
                for page in doc:
                    text += page.get_text()
            elif filename.endswith(".docx"):
                doc = docx.Document(file)
                for para in doc.paragraphs:
                    text += para.text + "\n"
            else:
                text = file.read().decode('utf-8', errors='ignore')
            
            prompt = "Extract all student records from the following text. Return a JSON array of objects. Each object MUST have a 'roll_number' field (string). Include any other fields like name, attendance, marks, phone, etc. found in the text. Ensure output is ONLY a raw JSON array.\n\nTEXT:\n" + text[:30000]
            
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            try:
                records = json.loads(response.text)
            except:
                # Fallback if markdown formatting is present
                clean_json = response.text.replace("```json", "").replace("```", "").strip()
                records = json.loads(clean_json)
        else:
            return jsonify({"error": "Unsupported file type. Allowed: .csv, .xlsx, .xls, .pdf, .docx, .txt, .json"}), 400
            
        for r in records:
            roll_no = str(r.get("roll_number", r.get("RollNo", r.get("rollno", r.get("Roll Number")))))
            if roll_no and roll_no != "None":
                r["roll_number"] = roll_no
                students_collection.update_one({"roll_number": roll_no}, {"$set": r}, upsert=True)
                inserted_count += 1
                
        return jsonify({"message": f"Successfully processed and updated {inserted_count} student records."})
    except Exception as e:
        print("Upload Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/student_fields", methods=["GET"])
@token_required
def get_student_fields():
    try:
        students_collection = db["students"]
        docs = students_collection.find().limit(500)
        keys = set()
        for d in docs:
            for k in d.keys():
                if k not in ["_id"]:
                    keys.add(k)
        return jsonify({"fields": list(keys)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/admin/delete_field", methods=["POST", "OPTIONS"])
@token_required
def delete_student_field():
    try:
        data = request.json
        field = data.get("field")
        if not field:
            return jsonify({"error": "Field is required"}), 400
        if field == "roll_number":
            return jsonify({"error": "Cannot delete primary key roll_number"}), 400
            
        students_collection = db["students"]
        result = students_collection.update_many({}, {"$unset": {field: ""}})
        return jsonify({"message": f"Successfully deleted '{field}' from {result.modified_count} records."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    import threading
    def prewarm_cache():
        print("Pre-warming caches in background...")
        try:
            extract_text_from_pdfs()
            extract_official_website_data()
            extract_website_data()
            extract_image_data()
            print("Caches pre-warmed successfully!")
        except Exception as e:
            print("Error pre-warming caches:", e)
            
    threading.Thread(target=prewarm_cache, daemon=True).start()
    
    app.run(debug=True)
