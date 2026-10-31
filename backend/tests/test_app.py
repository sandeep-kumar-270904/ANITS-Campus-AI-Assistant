import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import app, sql_db, ChatLog, JWT_SECRET, ADMIN_PASSWORD, ALLOWED_ADMIN_EMAILS
import jwt
import time
from datetime import datetime
import pytest


@pytest.fixture
def client():
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.test_client() as client:
        with app.app_context():
            sql_db.create_all()
        yield client


def test_home(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"Welcome to the ANITS Campus Assistant API" in response.data


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] in ["ok", "healthy"]
    assert "timestamp" in data


def test_cors_headers(client):
    response = client.options("/chat")
    assert response.status_code == 200

    response_analytics = client.options("/analytics")
    assert response_analytics.status_code in [200, 204]


def test_login_unauthorized_email(client):
    response = client.post("/api/login", json={
        "email": "hacker@evil.com",
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 403
    assert b"Unauthorized email address" in response.data


def test_login_invalid_password(client):
    admin_email = ALLOWED_ADMIN_EMAILS[0]
    response = client.post("/api/login", json={
        "email": admin_email,
        "password": "wrong_password_12345"
    })
    assert response.status_code == 401
    assert b"Invalid credentials" in response.data


def test_login_success(client):
    admin_email = ALLOWED_ADMIN_EMAILS[0]
    response = client.post("/api/login", json={
        "email": admin_email,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert data["message"] == "Login successful"

    # Verify decoded token claims
    decoded = jwt.decode(data["token"], JWT_SECRET, algorithms=["HS256"])
    assert decoded["user"] == admin_email
    assert decoded["role"] == "admin"


def test_protected_routes_require_auth(client):
    response = client.get("/api/enquiries")
    assert response.status_code == 401
    assert b"Token is missing" in response.data

    response = client.get("/export")
    assert response.status_code == 401


def test_faculty_privilege_escalation_blocked(client):
    # Create a faculty token using JWT_SECRET
    faculty_token = jwt.encode({
        "user": "prof_test@anits.edu.in",
        "role": "faculty",
        "exp": time.time() + 3600
    }, JWT_SECRET, algorithm="HS256")

    headers = {"Authorization": f"Bearer {faculty_token}"}

    # Faculty should NOT be allowed to create faculty or broadcast as admin
    res = client.post("/api/admin/create-faculty", headers=headers, json={
        "email": "new_faculty@anits.edu.in",
        "password": "pass"
    })
    assert res.status_code == 403
    assert b"Admin privileges required" in res.data


def test_admin_access_with_valid_token(client):
    admin_token = jwt.encode({
        "user": ALLOWED_ADMIN_EMAILS[0],
        "role": "admin",
        "exp": time.time() + 3600
    }, JWT_SECRET, algorithm="HS256")

    headers = {"Authorization": f"Bearer {admin_token}"}
    response = client.get("/api/enquiries", headers=headers)
    assert response.status_code == 200


def test_analytics_and_recent_queries(client):
    admin_token = jwt.encode({
        "user": ALLOWED_ADMIN_EMAILS[0],
        "role": "admin",
        "exp": time.time() + 3600
    }, JWT_SECRET, algorithm="HS256")

    headers = {"Authorization": f"Bearer {admin_token}"}

    # Add a mock ChatLog entry
    with app.app_context():
        log = ChatLog(
            user_message="When do classes start?",
            bot_reply="Classes start on August 1st.",
            detected_language="en",
            timestamp=datetime.utcnow()
        )
        sql_db.session.add(log)
        sql_db.session.commit()

    # Query analytics
    res = client.get("/analytics", headers=headers)
    assert res.status_code == 200
    analytics_data = res.get_json()
    assert analytics_data["total_messages"] >= 1
    assert "en" in analytics_data["language_usage"]

    # Query recent queries
    res_recent = client.get("/api/recent_queries", headers=headers)
    assert res_recent.status_code == 200
    recent_data = res_recent.get_json()
    assert len(recent_data) >= 1
    assert recent_data[0]["user_message"] == "When do classes start?"


def test_export_csv_with_header_and_query_param(client):
    admin_token = jwt.encode({
        "user": ALLOWED_ADMIN_EMAILS[0],
        "role": "admin",
        "exp": time.time() + 3600
    }, JWT_SECRET, algorithm="HS256")

    # Test via Authorization Header
    res_header = client.get("/export", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_header.status_code == 200
    assert "text/csv" in res_header.content_type
    assert b"id,user_message,bot_reply,detected_language,timestamp" in res_header.data

    # Test via Query Param token (for direct browser downloads)
    res_param = client.get(f"/export?token={admin_token}")
    assert res_param.status_code == 200
    assert "text/csv" in res_param.content_type
