# 04 - Machine Learning Pipeline & Tech Stack

## 1. Machine Learning Pipeline (RAG)

The core intelligence of the ANITS Assistant relies on a Retrieval-Augmented Generation (RAG) pipeline powered by Google Gemini. 

### Data Ingestion & Embedding (`sync_vectors.py`)
1. **Extraction**: The script crawls local directories (`/data/circulars`, `/data/policies`, etc.) extracting text using `PyMuPDF` (for PDFs) and `BeautifulSoup` (for web scrapes).
2. **Chunking**: The extracted text is split into semantic chunks to ensure it fits within embedding context limits.
3. **Embedding**: Each chunk is sent to the `text-embedding-004` (Google Gemini) model, which converts the text into a high-dimensional vector array.
4. **Vector Storage**: The vectors, along with their original text and metadata, are upserted into MongoDB Atlas using `$vectorSearch` indexes.

### Query Inference
1. **User Query**: A student asks a question.
2. **Query Embedding**: The backend instantly embeds the user's question using the same `text-embedding-004` model.
3. **Similarity Search**: MongoDB executes a Cosine Similarity search (`$vectorSearch`) comparing the query vector against the knowledge base, returning the top 4 most relevant chunks.
4. **Contextual Generation**: The system prompt, the retrieved chunks, and the user's chat history are packaged and sent to `gemini-2.5-flash`.
5. **Multimodality**: If the user attached an image, it is encoded in Base64 and appended to the payload as a `types.Part.from_bytes` object, allowing the vision model to "see" the image in conjunction with the retrieved text.

## 2. Dataset Documentation
The AI does not rely on a static fine-tuned dataset. Instead, it relies on a dynamic corpus:
- **Unstructured Corpus**: PDF Circulars, Exam Timetables, Policy Handbooks.
- **Structured Corpus**: MongoDB `students` collection containing highly sensitive grades, attendance, and contact information.
- **Image Corpus**: Screenshots, notice boards, and diagrams uploaded on the fly by users.

## 3. Technology Stack & Justification

| Layer | Technology | Why we chose it |
|-------|------------|-----------------|
| **Frontend** | React 19 + Vite | Vite provides instant server start and lightning-fast HMR. React allows for highly reusable UI components (like the Chat Widget). |
| **Styling** | Tailwind CSS | Utility-first CSS eliminates the need for separate `.css` files and significantly speeds up UI development. |
| **Backend Core** | Python 3.11 + Flask | Python is the native language for AI. Flask is unopinionated, allowing us to build custom LLM routing logic without framework bloat. |
| **Database** | MongoDB Atlas | Perfectly handles the unpredictable schemas of student records uploaded by different departments. Native Vector Search eliminates the need for Pinecone. |
| **LLM Inference** | Google Gemini | `gemini-2.5-flash` offers unmatched speed, a massive 1M token context window, and native multimodal vision capabilities out of the box. |
| **Omnichannel** | Telegram API + Twilio | Telegram provides secure, native phone-number sharing for authentication. Twilio is the industry standard for WhatsApp integration. |
| **Email** | Python `smtplib` + Gmail | Completely free, reliable SMTP broadcasting solution bypassing the strict domain verification requirements of services like Resend or Sendgrid. |

## 4. Folder Structure

```text
anits-college-website/
│
├── backend/
│   ├── app.py                 # Main Flask server and routing
│   ├── sync_vectors.py        # Background script for embedding PDFs
│   ├── requirements.txt       # Python dependencies
│   └── venv311/               # Virtual Environment
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI (Chatbot.jsx, Navbar.jsx)
│   │   ├── pages/             # Route pages (AdminDashboard, Home)
│   │   ├── App.jsx            # React Router definitions
│   │   └── main.jsx           # React DOM entry
│   ├── package.json           # Node dependencies
│   ├── tailwind.config.js     # Tailwind configuration
│   └── vite.config.js         # Vite bundler configuration
│
├── data/                      # Local storage for PDFs, scraped text, etc.
│   ├── circulars/
│   └── syllabus/
│
├── docs/                      # Documentation
│
├── .env                       # Secrets and API Keys
└── README.md                  # Project Root Documentation
```
