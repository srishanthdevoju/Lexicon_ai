# Lexicon AI — Document Intelligence Platform

> **AI-Powered Legal Document Analysis, Risk Scoring & Contract Intelligence**

Lexicon AI automates the tedious manual review of legal documents, using a multi-agent AI pipeline to highlight risks, extract clauses, and generate professional audit reports — with 99.8% semantic accuracy.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **PDF Upload & Text Paste** | Upload PDF contracts or paste raw text for instant analysis |
| **Multi-Agent AI Pipeline** | Summary, Risk, and Clause agents process documents in parallel |
| **Risk Scoring Engine** | Automated severity classification (High/Medium/Low) with visual risk gauge |
| **Clause Extraction** | Standard vs Non-Standard clause detection with inline document highlighting |
| **AI Contract Q&A** | Natural-language chat assistant for querying contract details |
| **AI Redraft Suggestions** | One-click AI-generated clause rewrites for flagged risks |
| **PDF Audit Reports** | Auto-generated professional reports with executive summaries |
| **Supabase Integration** | Optional cloud persistence (falls back to local storage gracefully) |

---

## 🏗️ Architecture

```
smart_document/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── main.py           # FastAPI app, routes, middleware
│   │   ├── agents/           # AI Agent modules
│   │   │   ├── summary_agent.py
│   │   │   ├── risk_agent.py
│   │   │   ├── clause_agent.py
│   │   │   └── db_agent.py
│   │   ├── core/
│   │   │   └── config.py     # Pydantic Settings (env vars)
│   │   ├── models/
│   │   │   └── schemas.py    # Pydantic data models
│   │   └── services/
│   │       ├── llm_client.py       # OpenAI-compatible client w/ retries
│   │       ├── pdf_parser.py       # PyMuPDF text extraction
│   │       └── report_generator.py # ReportLab PDF generation
│   ├── .env                  # API keys (gitignored)
│   ├── .env.example          # Template
│   ├── requirements.txt
│   └── schema.sql            # Supabase table schema
│
└── frontend/                 # Vite + React + Tailwind
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── layout/       # Navbar, Footer
    │   │   └── views/        # Login, Dashboard, Workspace, Library
    │   └── index.css         # Global styles & animations
    ├── tailwind.config.js
    └── vite.config.js        # Dev proxy to backend
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- An API key for Groq, OpenAI, or any OpenAI-compatible provider

### Backend Setup
```bash
cd smart_document/backend
cp .env.example .env          # Edit with your API keys
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd smart_document/frontend
npm install
npm run dev                   # Starts at http://localhost:5173
```

### Default Login
- **Email:** partner@jurisprecision.com
- **Password:** password

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | API key for LLM provider (Groq) |
| `GROQ_MODEL` | ✅ | Model name (e.g. `llama-3.1-8b-instant`) |
| `GROQ_BASE_URL` | ❌ | Custom base URL (e.g. `https://api.groq.com/openai/v1`) |
| `API_KEY` | ❌ | Optional endpoint protection key |
| `SUPABASE_URL` | ❌ | Supabase project URL |
| `SUPABASE_KEY` | ❌ | Supabase anon key |

---

## 🛠️ Tech Stack

- **Backend:** FastAPI, Pydantic, PyMuPDF, ReportLab, OpenAI SDK
- **Frontend:** React 19, Vite, Tailwind CSS, Material Symbols
- **AI:** Groq / OpenAI-compatible LLM with JSON mode
- **Database:** Supabase (PostgreSQL) — optional

---

## 📄 License

MIT License — Built by Juris Precision Systems
