# 04 - Machine Learning Pipeline & Technical Topology

## 17. Machine Learning Pipeline (RAG Architecture)

The core intelligence of the platform completely eschews static parameter fine-tuning in favor of a dynamic Retrieval-Augmented Generation (RAG) architecture. This completely eliminates "hallucinations" by strictly bounding the Large Language Model's reasoning engine to local, verified context chunks.

### Phase 1: Semantic Ingestion (`sync_vectors.py`)
1. **Extraction**: `PyMuPDF` recursively iterates over the `/data/circulars` and `/data/syllabus` directories, converting heavy PDF byte-streams into raw UTF-8 strings.
2. **Semantic Chunking**: 
   - Standard splitting by arbitrary characters ruins contextual meaning. Instead, we split via semantic token thresholds.
   - **Hyperparameters**: `chunk_size = 1000 tokens`, `chunk_overlap = 150 tokens`. The overlap ensures that sentences spanning two chunks are not contextually orphaned.
3. **Vector Generation**: Text chunks are dispatched to Google's `text-embedding-004` API. The model evaluates the semantic meaning and returns exactly `768 float values` (a high-dimensional vector space representation).
4. **HNSW Upsert**: The arrays are committed to MongoDB Atlas. We configure the Vector Index using the **Hierarchical Navigable Small World (HNSW)** algorithm to ensure sub-millisecond retrieval speeds, drastically outperforming flat KNN scans.

### Phase 2: Inference & Synthesis (`app.py`)
1. **Query Embedding**: The incoming user query (e.g., "What is the fee?") is instantaneously embedded using the identical `text-embedding-004` model.
2. **Vector Similarity Search**: MongoDB executes `$vectorSearch`. We utilize the **Cosine Similarity** metric (`similarity > 0.75`) to fetch the top 4 most semantically similar text chunks.
3. **Prompt Injection**: A strict system prompt is formulated:
   > *"You are the ANITS AI Assistant. Answer the user strictly using the provided context chunks below. If the answer is not in the context, explicitly state you do not know."*
4. **Multimodal Synthesis**: The prompt, the 4 context chunks, and the Base64 image payload (if present) are transmitted to `gemini-1.5-flash`.
   - **Hyperparameters**: `temperature = 0.2` (Near deterministic output to prevent creative hallucination), `max_output_tokens = 2048`.

## 18. Dataset Documentation
The AI avoids catastrophic forgetting by abstaining from static weights. It utilizes a highly dynamic, real-time Retrieval Corpus:
- **Unstructured Corpus**: High-fidelity PDF Circulars, Exam Timetables, Policy Handbooks stored natively in `/data/` and embedded offline.
- **Structured Corpus**: MongoDB `students` collection containing highly sensitive academic records (CGPA, Attendance). The AI queries this dynamically via deterministic API calls rather than probabilistic RAG retrieval.
- **Vision Corpus**: Transient, user-uploaded Base64 image payloads evaluated strictly at runtime in volatile memory and immediately discarded to ensure maximum PII privacy compliance.

## 19. Folder Structure
The repository strictly adheres to modern separation of concerns:
```text
anits-college-website/
│
├── backend/
│   ├── app.py                 # API Gateway, RAG orchestration, & REST Routing
│   ├── sync_vectors.py        # Embedding ingestion worker for MongoDB Vector Search
│   ├── requirements.txt       # Strict Python dependencies (Flask, PyMongo, google-genai)
│   └── venv/                  # Virtual Environment (Git Ignored)
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable functional components (Chatbot.jsx, Navbar.jsx)
│   │   ├── pages/             # Route-level components (AdminDashboard.jsx)
│   │   ├── App.jsx            # React Router DOM context wrapper
│   │   └── main.jsx           # React strict-mode injection point
│   ├── tailwind.config.js     # PostCSS Utility Styling Configuration
│   └── vite.config.js         # ESBuild tooling and minification config
│
├── data/                      # Local storage for PDFs and system configuration
├── docs/                      # Auxiliary Enterprise documentation
└── README.md                  # The Root Master Document
```

## 20. Technology Stack with Architectural Justification

| Architecture Layer | Technology | Engineering Justification |
|-------|------------|---------------------------|
| **Frontend Framework** | React 19 + Vite | Vite replaces Webpack, providing sub-second Hot Module Replacement (HMR) via native ES modules. React's virtual DOM architecture is crucial for maintaining the complex state of the Glassmorphism Admin Dashboard without expensive prop-drilling or full-page browser repaints. |
| **Backend Gateway** | Python 3.11 (Flask) | Chosen over Node.js (Express) or Django. Python possesses the most mature AI/ML ecosystem globally (LangChain, PyMuPDF, GenAI). Flask’s lightweight WSGI nature prevents framework bloat and allows custom, ultra-low-latency routing pipelines natively compatible with AI libraries. |
| **Database** | MongoDB Atlas | Student datasets have wildly unpredictable schemas across different academic years. A NoSQL document store handles this natively without breaking SQL `ALTER TABLE` scripts. Furthermore, **Atlas Vector Search** eliminates the high network latency and exorbitant licensing costs of managing an external, isolated vector database (e.g., Pinecone or Milvus). |
| **LLM Inference** | Google Gemini 1.5 Flash | Significantly outperforms competitors (like GPT-4o-mini) in multimodal vision speed. Offers a massive 1M token context window, essential for processing and grounding answers against massive PDF policy chunks concurrently without encountering context truncation. |
| **Integrations**| Twilio & Telegram | Telegram’s native contact-sharing API prevents students from spoofing phone numbers (ensuring cryptographic identity verification). Twilio is the global enterprise standard for WhatsApp business API routing, ensuring 99.99% message delivery SLAs. |
