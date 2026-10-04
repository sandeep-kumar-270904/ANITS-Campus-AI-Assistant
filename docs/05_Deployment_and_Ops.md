# 05 - Deployment, Operations, and Future Enhancements

## 1. Installation & Running Locally

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- MongoDB Atlas Cluster URI

### Environment Variables (`backend/.env`)
Create a `.env` file in the `backend` folder:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster...
GEMINI_API_KEY=your_google_ai_studio_key
TELEGRAM_BOT_TOKEN=your_botfather_token
JWT_SECRET=your_super_secret_string
ADMIN_PASSWORD=your_secure_admin_password
GMAIL_ADDRESS=your_broadcast_email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_pass
```

### Starting the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (On Windows: venv\Scripts\activate)
pip install -r requirements.txt
python app.py
```

### Starting the Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`.

## 2. Docker Setup (Optional)
To containerize the application for enterprise deployment:
1. Create a `Dockerfile` in the frontend and backend directories.
2. Use a `docker-compose.yml` at the root to orchestrate both services.
*(Note: Dockerfiles are planned for the next release cycle).*

## 3. Deployment Guide

### Frontend Deployment (Vercel)
1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Set the Framework Preset to `Vite`.
4. Ensure the Build Command is `npm run build` and Output Directory is `dist`.
5. Add `VITE_API_URL=https://your-backend-url.onrender.com` in Vercel Environment Variables.

### Backend Deployment (Render / Heroku)
1. Connect the repository to Render (Web Service).
2. Set the Root Directory to `backend`.
3. Build Command: `pip install -r requirements.txt`.
4. Start Command: `gunicorn app:app --worker-class eventlet -w 1` (or simply `python app.py`).
5. Copy all variables from your local `.env` into Render's Environment Variables panel.

## 4. Testing Strategy
- **Unit Testing**: Python's `unittest` framework for testing individual utility functions in `app.py`.
- **Integration Testing**: Testing the `/chat` endpoint using `Postman` or `curl` to ensure the database and LLM communicate correctly.
- **UI Testing**: Manual verification of React components. (Future enhancement: Implement Cypress for E2E testing).

## 5. Scalability Considerations
- **Stateless Backend**: The Flask backend uses JWTs for authentication, making it completely stateless. It can be horizontally scaled across multiple instances behind a load balancer.
- **Connection Pooling**: MongoDB handles connection pooling automatically via `pymongo`.
- **Rate Limiting**: The `/chat` endpoint implements rate limiting (`@limiter.limit("55 per minute")`) to prevent API abuse and cost overruns on the Gemini API.

## 6. Security Considerations
- **No Hardcoded Secrets**: All keys are strictly injected via `.env`.
- **JWT Expiration**: Admin tokens expire after a set duration.
- **Cryptographic Verification**: Telegram user verification relies on native Telegram contact sharing, ensuring users cannot spoof their phone numbers.
- **CORS Policies**: Cross-Origin Resource Sharing is configured to only allow requests from the official frontend domain.

## 7. Limitations
- WhatsApp integration via Twilio requires an approved WhatsApp Business Account for production rollout.
- Extracting text from highly corrupted or image-heavy PDFs might yield lower RAG accuracy. (Resolved partially by Gemini Multimodal vision).

## 8. Future Enhancements
- **Redis Caching**: Implement Redis to cache frequent LLM responses (e.g., "What is the college fee?") to reduce API costs and latency to < 50ms.
- **Cypress E2E Tests**: Fully automate frontend testing.
- **Voice-to-Voice AI**: Upgrade the current WebRTC audio implementation to stream directly to Gemini 1.5 Pro's native audio understanding pipeline for ultra-low latency voice conversations.

## 9. Troubleshooting & FAQ

**Q: The frontend says "Failed to fetch logs" on the Admin Dashboard.**
**A:** Ensure the backend is running and `VITE_API_URL` is correctly pointing to it. Check for CORS errors in the browser console.

**Q: The AI is hallucinating answers.**
**A:** Ensure `sync_vectors.py` has been run recently and the Vector Search Index is correctly configured in MongoDB Atlas with the exact dimensions (768) and similarity metric (cosine).

**Q: Emails aren't sending from the Faculty Portal.**
**A:** Ensure you are using a Google "App Password" (16 characters) and not your standard Gmail password. 2FA must be enabled on the Google Account to generate an App Password.
