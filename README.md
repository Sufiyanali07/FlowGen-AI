# FlowGen AI – Intelligent Support Workflow Automation System

**FlowGen AI** is a production-style, full-stack application that automates customer support ticket processing using **Google Gemini** for classification and draft replies, with **explicit guardrails**, routing logic, observability, and a clean modular architecture.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Setup & Running](#setup--running)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Guardrails & Safety](#guardrails--safety)
9. [Security & Validation](#security--validation)
10. [Frontend Overview](#frontend-overview)
11. [Observability & Logging](#observability--logging)
12. [Deployment Notes](#deployment-notes)
13. [Full Project Document (PDF)](#full-project-document-pdf)

---

## Overview

The system lets users **submit support tickets** (name, email, subject, message). The backend:

1. **Validates** input (Pydantic + custom security checks).
2. **Detects duplicates** via message hash (SHA-256).
3. **Calls Gemini** to get: category, urgency, priority score, confidence score, draft reply, and reasoning summary (strict JSON).
4. **Applies guardrails** in Python (low confidence, high urgency, risky phrases in draft).
5. **Routes** each ticket: **Human Review** if any guardrail flags, otherwise **Auto-Resolve**.
6. **Persists** the ticket and a log entry (raw input, AI output, flags, routing).
7. **Returns** the full result to the frontend.

The **frontend** provides:

- **Submit Ticket**: form + live AI analysis result (badges, progress bars, draft reply, guardrail flags).
- **Admin Dashboard**: filter tickets by status/urgency, view ticket list, and inspect **ticket logs** (raw input, AI output, guardrail flags, routing) with filters (all / with flags / with Gemini errors).

---

## Architecture

- **Backend**: Python 3.x, **FastAPI**, **Pydantic**, **SQLite** (SQLAlchemy), **Google Generative AI (Gemini)**, pydantic-settings, python-dotenv, CORS, in-memory rate limiting, rotating file + console logging.
- **Frontend**: **React 18**, **Vite**, **TypeScript**, **TailwindCSS**, shadcn-style UI components (button, card, badge, alert, textarea, select, table, progress, tabs, skeleton, toast).

Data flow:

```
User → Frontend (React) → POST /tickets → Backend (FastAPI)
  → Security validation → Duplicate check (hash) → Gemini API
  → Guardrails → DB (Ticket + TicketLog) → Response → Frontend (result + Admin logs)
```

---

## Project Structure

```
FlowGen AI/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, error handlers, DB startup
│   ├── config.py               # Pydantic Settings (env: Gemini, DB, rate limit, CORS)
│   ├── requirements.txt       # Python dependencies
│   ├── database/
│   │   ├── session.py          # SQLAlchemy engine, SessionLocal, Base, get_db
│   │   ├── models.py           # Ticket, TicketLog ORM models
│   │   └── crud.py             # create_ticket, list_tickets, get_ticket_by_hash, logs
│   ├── models/
│   │   └── schemas.py          # Pydantic: TicketCreate, GeminiResult, GuardrailResult, TicketResponse, etc.
│   ├── routers/
│   │   └── tickets.py          # POST /tickets, GET /tickets, GET /tickets/{id}/logs
│   ├── services/
│   │   ├── gemini_service.py  # call_gemini (JSON, retries, fallback)
│   │   └── guardrail_service.py # apply_guardrails (confidence, urgency, risky phrases)
│   └── utils/
│       ├── security.py         # validate_content_safety, hash_message (script/SQL/emoji checks)
│       ├── rate_limiter.py     # Per-IP fixed-window rate limiter
│       └── logging_config.py   # Rotating file + console logging
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx             # Tabs: Submit Ticket | Admin Dashboard
│       ├── lib/
│       │   └── api.ts          # submitTicket, getTickets, getTicketLogs (typed)
│       └── components/
│           ├── TicketForm.tsx  # Form + validation + submit
│           ├── TicketResult.tsx # AI result: badges, progress, draft reply, flags
│           ├── AdminDashboard.tsx # Filters, ticket table, ticket logs panel
│           └── ui/              # button, card, badge, alert, textarea, select, table, progress, tabs, skeleton, toast
├── .env                        # GEMINI_API_KEY, GEMINI_MODEL, DATABASE_URL, etc. (not committed)
├── .env.example                # Example env (optional)
├── .gitignore
├── README.md                   # This file
└── docs/
    └── PROJECT_DOCUMENTATION.md # Full project document (export to PDF)
```

---

## Technology Stack

| Layer      | Technology |
|-----------|------------|
| Backend   | Python 3, FastAPI, Uvicorn, Pydantic, Pydantic-Settings, SQLAlchemy, SQLite, google-generativeai, python-dotenv |
| Frontend  | React 18, Vite, TypeScript, TailwindCSS |
| AI        | Google Gemini (configurable model, e.g. gemini-1.5-flash / gemini-2.5-flash) |
| Database  | SQLite (default); schema supports migration to PostgreSQL/MySQL |

---

## Setup & Running

### Prerequisites

- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)
- **Google Cloud / AI Studio** account for a **Gemini API key**

### 1. Clone and enter project

```bash
cd "C:\Users\hp\Desktop\FlowGen AI"
```

### 2. Backend

```bash
# Create virtual environment (recommended)
python -m venv backend/.venv
# Activate: Windows
backend\.venv\Scripts\activate
# Activate: macOS/Linux
# source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env in project root with at least:
# GEMINI_API_KEY=your_key_here
# GEMINI_MODEL=gemini-1.5-flash   (or gemini-2.5-flash)
# Optional: DATABASE_URL, ALLOWED_ORIGINS, RATE_LIMIT_REQUESTS_PER_MINUTE
```

**Run the API from the project root:**

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

- API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: `http://localhost:5173`

Optional: create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:8000` if the API runs on a different host/port.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | — | Google Gemini API key (from AI Studio or Google Cloud). |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Model ID (e.g. `gemini-2.5-flash`). |
| `DATABASE_URL` | No | `sqlite:///./flowgen.db` | SQLAlchemy database URL. |
| `ALLOWED_ORIGINS` | No | — | Comma-separated CORS origins (e.g. `http://localhost:5173,http://127.0.0.1:5173`). If empty, defaults to these two. |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | No | `5` | Max requests per minute per client IP. |
| `ENVIRONMENT` | No | `development` | Used for app context (e.g. logging). |

Frontend (optional):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL. |

---

## API Reference

Base URL: `http://localhost:8000` (or your deployed backend).

### Health

- **GET** `/health`  
  - Response: `{ "status": "ok" }`

### Tickets

- **POST** `/tickets`  
  - **Body:** `{ "name": string, "email": string, "subject": string, "message": string }`  
  - **Validation:** name/subject 1–255 chars, message 10–5000 chars, valid email, no script/SQL/emoji-only.  
  - **Responses:**  
    - `200`: `TicketResponse` (id, name, email, subject, message, category, urgency, priority_score, confidence_score, draft_reply, reasoning_summary, status, guardrail_flags, routing_decision, is_duplicate, original_ticket_id, created_at).  
    - `400`: validation_error (security or business rules).  
    - `422`: validation_error (Pydantic).  
    - `429`: rate_limit_exceeded.

- **GET** `/tickets?status=...&urgency=...`  
  - **Query:** `status` (optional), `urgency` (optional).  
  - **Response:** `{ "items": [ TicketListItem, ... ] }`

- **GET** `/tickets/{ticket_id}/logs`  
  - **Response:** `[ TicketLogEntry, ... ]` (id, timestamp, raw_input, ai_output, guardrail_flags, routing_decision).

Error responses use a common shape: `{ "code": string, "message": string, "details": object? }`.

---

## Guardrails & Safety

Guardrails are implemented **in Python** (not in the model):

- **Low confidence:** `confidence_score < 0.65` → flag `low_confidence`.
- **High urgency:** `urgency == "high"` → flag `high_urgency`.
- **Risky draft content:** Refund/financial commitment, legal advice, compliance claims, policy/terms language → flags such as `refund_or_financial_commitment`, `legal_advice_or_liability`, `compliance_claim`, `fabricated_or_risky_policy`.

If **any** flag is set:

- `status` = `"Needs Human Review"`.
- `routing_decision` = `"Human Review"`.

Otherwise:

- `status` = `"Auto-Resolved"`.
- `routing_decision` = `"Auto-Resolve"`.

Gemini is asked for **strict JSON only**. On invalid JSON, timeout, or API errors, the backend **retries once**, then uses a **fallback** draft reply and sets an error in the ticket log so the Admin can see it.

---

## Security & Validation

- **Input:** Pydantic (required fields, email format, lengths) + custom validators (no whitespace-only).
- **Security filters** (`backend/utils/security.py`): script injection (`<script>`, `on*=`), basic SQL patterns, emoji-only content rejected.
- **Duplicate detection:** SHA-256 hash of normalized message; duplicate tickets linked via `original_ticket_id`.
- **Rate limiting:** In-memory, per-IP, configurable requests per minute (default 5).
- **CORS:** Configurable allowed origins via `ALLOWED_ORIGINS`.
- **Errors:** Global handlers return structured `code`/`message`/`details`; no stack traces to client.
- **Secrets:** API key and DB URL from `.env` only; do not commit `.env`.

---

## Frontend Overview

- **Submit Ticket tab:**  
  Form (name, email, subject, message) with client-side validation; on submit, result panel shows category, urgency, priority/confidence bars, status, guardrail flags, reasoning summary, and draft reply (with safety note).

- **Admin Dashboard tab:**  
  Status and urgency filters; ticket table (ID, subject/email, category, urgency, priority, status). Clicking a row loads **ticket logs** for that ticket. Log panel has a “Show logs” toggle, filter (All / With guardrail flags / With Gemini errors), and collapsible log entries with raw input, AI output, and guardrail flags.

UI uses Tailwind and shadcn-style components; toasts for success/error feedback.

---

## Observability & Logging

- **Database:**  
  - `tickets`: user data, message_hash, duplicate link, AI fields (category, urgency, scores, draft_reply, reasoning_summary), status, guardrail_flags, routing_decision, created_at.  
  - `ticket_logs`: ticket_id, timestamp, raw_input, ai_output, guardrail_flags, routing_decision.

- **Backend logs:**  
  Rotating file `logs/flowgen_backend.log` (max 5 MB, 3 backups) plus console; INFO level.

- **Admin UI:**  
  Ticket list and per-ticket logs provide an audit trail for classification, guardrails, and Gemini errors.

---

## Deployment Notes

- **Backend:** Run with a production ASGI server (e.g. `uvicorn backend.main:app --host 0.0.0.0 --port 8000` without `--reload`). Set `ALLOWED_ORIGINS` to your frontend URL(s). For production DB, set `DATABASE_URL` to PostgreSQL/MySQL and run migrations if you add any.
- **Frontend:** Build with `npm run build`; serve `dist/` with any static host. Set `VITE_API_BASE_URL` to the public backend URL at build time.
- **Secrets:** Never commit `.env`; use the platform’s env vars (e.g. Render, Railway, Vercel).

---

## Full Project Document (PDF)

A **detailed project document** (architecture, API, data models, security, guardrails, deployment, and more) is in:

**`docs/PROJECT_DOCUMENTATION.md`**

To get a **PDF**:

1. **VS Code / Cursor:** Install the “Markdown PDF” (or similar) extension, open `docs/PROJECT_DOCUMENTATION.md`, right‑click → “Markdown PDF: Export (pdf)”.
2. **Browser:** Open the repo in a viewer that renders Markdown (e.g. GitHub), then Print → Save as PDF.
3. **Pandoc:** `pandoc docs/PROJECT_DOCUMENTATION.md -o FlowGen_AI_Project_Documentation.pdf`

---

## License & Credits

FlowGen AI is a demonstration project for intelligent support workflow automation with Gemini and guardrails. Sign-off identity in draft replies is configurable in the Gemini system prompt (e.g. “Sufiyan Ali”).
