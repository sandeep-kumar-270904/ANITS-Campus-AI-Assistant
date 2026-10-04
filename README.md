<div align="center">
  <h1>🤖 ANITS AI Assistant (Enterprise Campus Intelligence)</h1>
  <p>
    <strong>A highly scalable, omnichannel Generative AI platform engineered specifically for the Anil Neerukonda Institute of Technology & Sciences (ANITS).</strong>
  </p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React 19](https://img.shields.io/badge/Frontend-React_19-61dafb.svg)](https://react.dev/)
  [![Python 3.11+](https://img.shields.io/badge/Backend-Python_3.11+-blue.svg)](https://www.python.org/)
  [![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Vector_Search-47A248.svg)](https://www.mongodb.com/)
  [![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini_1.5-FFCA28.svg)](https://deepmind.google/technologies/gemini/)

</div>

---

## 📖 Project Overview

**The Problem:** Educational institutions suffer from fragmented data silos. Students struggle to find current circulars, and faculty spend excessive time answering repetitive administrative questions or manually managing disparate student databases.

**The Solution:** The ANITS AI Assistant is a centralized, zero-latency conversational hub. By leveraging **Retrieval-Augmented Generation (RAG)**, it ingests unstructured college documents (PDFs, Web Pages) and structured student data (CSVs, JSON) into a unified MongoDB Vector Database. Students can query this data natively via the Web, Telegram, and WhatsApp using multilingual text or images, while faculty are empowered with a secure broadcast portal.

---

## ✨ Enterprise-Grade Features

- **Omnichannel Inference**: Seamlessly interact with the AI via the React Web UI, a secured Telegram Bot, or WhatsApp.
- **Multimodal Vision Pipeline**: Powered by **Gemini 2.5 Flash**, users can upload photos of handwritten notices, timetables, or diagrams, and the AI will contextually interpret the image.
- **Hinglish & Multilingual NLP**: The system dynamically detects and responds in native scripts or romanized hybrid languages (e.g., *Hinglish*, *Tenglish*) without breaking character limits.
- **Dynamic Schema Manager**: Admins can upload raw `.csv` or `.xlsx` files. The backend intelligently parses the headers and dynamically alters the MongoDB schema to accommodate new academic parameters (CGPA, Attendance, etc.).
- **Zero-Trust Security & Auth**: 
  - Admin/Faculty web access is secured via stateless `HS256` signed **JWTs**.
  - Telegram student access requires cryptographic phone-number verification against the MongoDB student roster before exposing sensitive grades.
- **Faculty Broadcast SMTP Portal**: A secure dashboard allowing professors to instantly dispatch rich-text HTML emails to thousands of students via Python's `smtplib`.

---

## 🏗️ System Architecture & Data Flow

The platform utilizes a decoupled microservices-inspired design, ensuring the presentation layer (React) scales independently from the intelligence routing layer (Flask/Gemini).

```mermaid
graph TD
    subgraph Client Layer
        Web[React 19 Web App]
        Telegram[Telegram Bot]
        WhatsApp[Twilio WhatsApp]
    end

    subgraph API Gateway & Intelligence (Flask)
        Router[API Router]
        Auth[JWT / Cryptographic Auth]
        RAG[RAG Orchestrator]
    end

    subgraph Data & AI Services
        Mongo[(MongoDB Atlas)]
        VectorDB[(MongoDB Vector Index)]
        Gemini[Google Gemini 1.5]
        SMTP[Google SMTP]
    end

    Web -->|JSON/REST| Router
    Telegram -->|Long Polling| Router
    WhatsApp -->|Webhooks| Router

    Router --> Auth
    Auth --> RAG

    RAG -->|1. Vector Search Query| VectorDB
    VectorDB -->|2. Top-K Context Chunks| RAG
    RAG -->|3. Context + Prompt| Gemini
    Gemini -->|4. Synthesized Answer| RAG
    
    Auth -->|Email Broadcasts| SMTP
    Auth -->|CRUD Operations| Mongo
```

---

## 💻 Technology Stack & Justification

| Layer | Technology | Engineering Justification |
|-------|------------|---------------------------|
| **Frontend** | React 19 + Vite | Vite provides sub-second HMR. React's component architecture is crucial for maintaining the complex state of the Glassmorphism Admin Dashboard and floating Chat Widget. |
| **Backend** | Python 3.11 (Flask) | Chosen over Node.js/Django. Python is the undisputed standard for AI/ML ecosystems. Flask’s lightweight WSGI nature prevents framework bloat during LLM orchestration. |
| **Database** | MongoDB Atlas | Student datasets have unpredictable schemas across different academic years. A NoSQL document store handles this natively. Furthermore, **Atlas Vector Search** eliminates the latency and cost of managing a separate vector database (like Pinecone). |
| **LLM Inference** | Google Gemini 1.5 Flash | Outperforms competitors in multimodal vision speed and offers a massive 1M token context window, essential for processing massive PDF policy chunks concurrently. |
| **Integrations**| Twilio & Telegram | Telegram’s native contact-sharing API prevents students from spoofing phone numbers. Twilio is the enterprise standard for WhatsApp business routing. |

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+) & Python (3.11+)
- A MongoDB Atlas Cluster (with Vector Search Index named `vector_index` enabled).

### 2. Environment Configuration
Create a `.env` file in the `/backend` directory. **Do not commit this file.**
```env
MONGO_URI=mongodb+srv://<admin>:<password>@cluster0...
GEMINI_API_KEY=your_google_ai_studio_key
TELEGRAM_BOT_TOKEN=your_botfather_token
JWT_SECRET=your_32_byte_secure_string
ADMIN_PASSWORD=your_dashboard_password
GMAIL_ADDRESS=your_college_broadcaster@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

### 3. Spin Up the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the Flask API & Integrations
python app.py
```

### 4. Spin Up the Frontend
Open a new terminal session:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` to test the AI Assistant widget. Navigate to `http://localhost:5173/admin/login` to access the Admin/Faculty Portal.

---

## 📚 Deep-Dive Documentation

For a comprehensive breakdown of the system, including API contracts, ML Pipeline specifics, scalability metrics, and testing strategies, please refer to our dedicated `/docs` directory or the master architecture file:

- 📄 **[Master Enterprise Architecture Document](./docs/ENTERPRISE_ARCHITECTURE.md)** *(Contains all 40 requested architectural sections)*
- 📄 [Project Overview & User Stories](./docs/01_Project_Overview.md)
- 📄 [System Architecture & LLD](./docs/02_System_Architecture.md)
- 📄 [API & Database Schemas](./docs/03_API_and_Data.md)
- 📄 [Machine Learning Pipeline](./docs/04_ML_and_Tech_Stack.md)
- 📄 [Deployment, Security, & Operations](./docs/05_Deployment_and_Ops.md)

---

## 🛡️ Security & Scalability
- **Rate Limiting**: The `/chat` endpoint is throttled to 55 requests/minute per IP to prevent Gemini API cost-overruns.
- **Stateless Architecture**: The backend relies entirely on JWTs, allowing it to be horizontally scaled across multiple instances behind a load balancer without session stickiness issues.

---

## 🤝 Contributing
We operate under strict open-source enterprise standards. Please review our [Contributing Guidelines](./CONTRIBUTING.md) and ensure your code passes all linting and unit tests before issuing a Pull Request.

## 📄 License & Credits
Licensed under the **MIT License**. 
Designed and engineered for **ANITS College**. Powered by the groundbreaking research at **Google DeepMind** and the global open-source community.