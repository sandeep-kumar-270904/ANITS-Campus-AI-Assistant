# 01 - Project Overview

## 1. Problem Statement
Many engineering institutions, including Anil Neerukonda Institute of Technology & Sciences (ANITS), struggle with centralized information dissemination. Students and faculty frequently face challenges accessing up-to-date circulars, policy documents, schedules, and personalized academic information. The existing systems are often fragmented across multiple static webpages, PDF files, and legacy databases. 
This results in:
- High latency in answering student queries.
- Administrative overhead for faculty.
- Inconsistent communication channels.
- Difficulty parsing and analyzing large volumes of unstructured student data.

## 2. Objectives
- **Centralized Knowledge Hub**: Create a single conversational interface capable of answering any college-related query with 100% accuracy based on official documents.
- **Omnichannel Accessibility**: Ensure the assistant is available where students already are (Web, Telegram, WhatsApp).
- **Administrative Empowerment**: Provide a secure portal for faculty to broadcast emails and manage student databases effortlessly.
- **Multimodal Understanding**: Enable the AI to interpret visual data (schedules, handwritten notes).
- **Scalability and Extensibility**: Build an architecture that can handle thousands of concurrent queries with low latency.

## 3. Features
- **RAG-Powered Conversational AI**: Grounded responses using MongoDB Vector Search.
- **Multilingual Support**: Natively understands and responds in English, Telugu, Hindi, and romanized hybrid languages (e.g., Hinglish).
- **Multimodal Vision**: Upload and query images via Gemini 2.5 Flash.
- **Dynamic Student Database Ingestion**: Automated parsing of CSV/XLSX/JSON into structured MongoDB documents.
- **Faculty Broadcast Portal**: One-click email broadcasts to the entire student body via Google SMTP.
- **Cross-Platform Bots**: Fully integrated Telegram bot with secure phone-number-based student authentication.

## 4. Functional Requirements
- The system MUST authenticate administrators via JWT before granting access to the dashboard.
- The system MUST allow faculty to upload `.csv` or `.xlsx` files and automatically map the columns to the MongoDB schema.
- The Telegram bot MUST verify a student's phone number against the database before allowing queries about personal grades or attendance.
- The chatbot MUST support image uploads and process them within 5 seconds.
- The RAG pipeline MUST embed and store uploaded PDF circulars within 10 seconds.

## 5. Non-Functional Requirements
- **Performance**: 95% of text-based chat queries should resolve in < 2.5 seconds.
- **Scalability**: The backend should comfortably support 500 concurrent connections.
- **Availability**: 99.9% uptime for the chat interface.
- **Security**: All API keys, secrets, and database URIs must be injected via Environment Variables. No sensitive data in the repository. Password hashes and JWT tokens must use enterprise-standard encryption (HS256/bcrypt).

## 6. User Stories
- *As a student*, I want to ask the bot in my native language about the upcoming exam schedule so that I don't have to navigate through the official website.
- *As a student*, I want to upload a photo of a notice board so the bot can extract the text and explain it to me.
- *As a faculty member*, I want to send an emergency email broadcast to all 2nd-year students regarding a class cancellation.
- *As an administrator*, I want to see analytics on what languages students are using to query the bot.

## 7. Use Cases
1. **Academic Inquiry**: Student asks "What is the syllabus for 3rd year Data Structures?" -> Bot retrieves the Vector embedding for the syllabus PDF and generates a concise answer.
2. **Personalized Data Access**: Student asks "What is my current attendance?" on Telegram -> Bot verifies their Telegram ID, queries the student collection, and returns their specific attendance percentage.
3. **Data Ingestion**: Admin uploads a new batch of 2026 students -> Backend parses the CSV, dynamically adjusts the schema, and inserts the records into MongoDB.
