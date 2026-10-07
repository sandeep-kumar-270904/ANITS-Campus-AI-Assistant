import os
import json
import pymongo
from fastembed import TextEmbedding
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = pymongo.MongoClient(MONGO_URI)
db = client['college_data']
collection = db['knowledge_base']

print("Initializing embedding model...")
model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

def load_json(filepath):
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

print("Clearing old knowledge base...")
collection.delete_many({})

docs_to_insert = []
texts_to_embed = []
metadata_list = []

# Process FAQs
faq_data = load_json("../data/faqs.json")
for item in faq_data:
    q = item.get('question', '')
    a = item.get('answer', '')
    text = f"FAQ - Question: {q}\nAnswer: {a}"
    texts_to_embed.append(text)
    metadata_list.append({"type": "faq", "text": text})

# Process Faculty
faculty_data = load_json("../data/faculty.json")
for item in faculty_data:
    text = f"Faculty Member: {item.get('name')} in Department: {item.get('department')}. Title: {item.get('title')}. Email: {item.get('email')}"
    texts_to_embed.append(text)
    metadata_list.append({"type": "faculty", "text": text})

# Process Events
events_data = load_json("../data/events.json")
for item in events_data:
    text = f"Event: {item.get('title')} on {item.get('date')}. Description: {item.get('description')}"
    texts_to_embed.append(text)
    metadata_list.append({"type": "event", "text": text})

# Process Placements
placements_data = load_json("../data/placements.json")
for item in placements_data:
    text = f"Placement Record: {item.get('company_name')}. Year: {item.get('year')}. Highest Package: {item.get('highest_package')}. Total Offers: {item.get('total_offers')}"
    texts_to_embed.append(text)
    metadata_list.append({"type": "placement", "text": text})

# Process Syllabus
syllabus_data = load_json("../data/syllabus.json")
for item in syllabus_data:
    text = f"Syllabus: {item.get('department')} Year {item.get('year')}. Subjects: {item.get('subjects')}. Description: {item.get('description')}"
    texts_to_embed.append(text)
    metadata_list.append({"type": "syllabus", "text": text})

# Process Academic Calendar
calendar_data = load_json("../data/academic_calendar.json")
for item in calendar_data:
    text = f"Academic Calendar: {item.get('event')} on {item.get('date')}. Department: {item.get('department')}"
    texts_to_embed.append(text)
    metadata_list.append({"type": "calendar", "text": text})

if texts_to_embed:
    print(f"Generating embeddings for {len(texts_to_embed)} documents...")
    embeddings = list(model.embed(texts_to_embed))
    
    print("Inserting into MongoDB...")
    for i, emb in enumerate(embeddings):
        # Convert numpy array to list for MongoDB
        doc = metadata_list[i]
        doc['embedding'] = emb.tolist()
        docs_to_insert.append(doc)
        
    if docs_to_insert:
        collection.insert_many(docs_to_insert)
    print("Successfully synced all data to MongoDB Vector Database!")
else:
    print("No data found to sync.")
