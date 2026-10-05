# 01 - Product Requirements Document (PRD)

## 2. Project Overview
The ANITS AI Assistant is an enterprise-scale conversational intelligence platform developed to unify fragmented academic data at the Anil Neerukonda Institute of Technology & Sciences. By adopting a Retrieval-Augmented Generation (RAG) architecture, the system dynamically vectorizes localized documents (PDF circulars, syllabuses) alongside dynamic student database records (CSVs), bypassing the need for computationally expensive static fine-tuning of foundational models. 

## 3. Problem Statement
**Current State Analysis:**
- **Data Fragmentation**: Administrative data is distributed across disparate legacy PHP portals, physical notice boards, and unstructured PDF files.
- **Latency in Query Resolution**: Faculty spend upwards of 15 hours a week responding to repetitive student inquiries regarding deadlines, fees, and syllabuses.
- **Authentication Barriers**: Students face friction utilizing traditional Web portals, leading to poor adoption rates for critical campus communications.
- **Data Ingestion Bottlenecks**: Student datasets shift in schema every academic year (e.g., adding "Placement Status"), requiring manual SQL schema migrations and developer intervention.

## 4. Objectives
- **Zero-Latency Orchestration**: Achieve P95 text inference < 2.5 seconds via edge-optimized caching and highly available vector search.
- **Dynamic Ingestion (Schema-less)**: Support ingestion of raw, malformed CSV datasets directly from the UI without database migrations.
- **Omnichannel Pervasiveness**: Embed the AI natively into Telegram and WhatsApp where students actively reside, establishing native cryptographic authentication flows.
- **Faculty Empowerment**: Provide an isolated, JWT-secured portal allowing asynchronous SMTP email broadcasting to batches of >1000 students without memory overflow.

## 5. Features
- **Semantic RAG Inference**: Resolves domain-specific queries using a customized Gemini 1.5 Flash pipeline.
- **Multimodal Context Processing**: Interprets user-uploaded Base64 image payloads (e.g., timetables) simultaneously alongside text queries.
- **Hinglish/Multilingual NLP Tokenization**: Naturally tokenizes and replies in regional scripts (Telugu/Hindi) or romanized phonetic text.
- **Dynamic BSON Schema Manager**: Reads CSV headers dynamically in Python `pandas` and maps them directly to MongoDB NoSQL documents.
- **Zero-Trust Role-Based Access Control (RBAC)**: Enforces stateless HS256 JWT tokens with strict 24-hour lifespans for all admin/faculty endpoints.

## 6. Functional Requirements
- **FR1 (Authentication)**: The `/api/login` endpoint MUST validate credentials via `bcrypt` hashing and issue a signed JWT.
- **FR2 (Vectorization)**: The `sync_vectors.py` worker MUST chunk uploaded PDFs (chunk size=1000, overlap=150) and output 768-dimensional float arrays via `text-embedding-004` within 10 seconds.
- **FR3 (Bot Identity)**: The Telegram bot (`python-telegram-bot`) MUST require the native Telegram `contact` object to cryptographically verify the user's phone number against the MongoDB `students` collection before authorizing queries.
- **FR4 (Broadcast Engine)**: The SMTP dispatcher MUST iterate over the student collection in chunks of 100 to prevent ThreadPool starvation.

## 7. Non-Functional Requirements
- **NFR1 (Performance)**: MongoDB Atlas `$vectorSearch` MUST execute Cosine Similarity matches in < 150ms over a 10,000+ vector corpus.
- **NFR2 (Security)**: All secrets MUST be injected at runtime via `.env` conforming to `os.getenv`. CORS MUST restrict traffic strictly to the Vercel production domain.
- **NFR3 (Availability)**: The Flask gateway MUST employ a `gunicorn` WSGI server utilizing the `eventlet` worker class (`-w 4`) to ensure concurrent I/O operations do not block the main thread.
- **NFR4 (Usability)**: The React dashboard MUST achieve a Lighthouse Accessibility and Performance score of > 90.

## 8. User Stories
- *As a 3rd-year CS student*, I want to text the Telegram bot in Hinglish asking "mera attendance kitna hai?" so that I can instantly receive my precise attendance percentage without logging into the clunky desktop portal.
- *As a faculty administrator*, I want to upload a massive Excel sheet of the incoming freshmen class with new, previously unseen columns (e.g., "Extracurriculars"), so the database automatically adopts these fields dynamically.
- *As a student*, I want to snap a photo of a complicated, handwritten lab schedule and ask the AI "When is my physics lab?" so it can perform OCR and contextual analysis simultaneously.

## 9. Use Cases
1. **The RAG Query Flow**: 
   - *Trigger*: User asks a question via Web UI. 
   - *System Action*: Flask receives JSON -> Embeds query -> `$vectorSearch` retrieves Top 4 documents -> Gemini synthesizes the answer.
2. **The Cryptographic Identity Flow**: 
   - *Trigger*: User clicks `/start` on Telegram. 
   - *System Action*: Bot prompts for Phone Number -> User shares Contact -> Bot validates against MongoDB -> Links `telegram_id` to `student_id`.
3. **The SMTP Broadcast Flow**: 
   - *Trigger*: Faculty hits 'Send' on the Web UI. 
   - *System Action*: Flask receives rich-text HTML -> Queries all valid student emails -> Spawns background worker -> Establishes TLS connection to Google SMTP -> Dispatches chunks of 100 emails asynchronously.
