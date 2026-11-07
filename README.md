# 🛡️ ScopeSentry AI
### *"Never Lose Track of What Was Agreed."*

An intelligent AI-powered scope management SaaS application for freelancers, software agencies, and small service businesses.

---

## 🧠 What It Does

ScopeSentry AI uses **persistent AI memory** (Hindsight) to remember client agreements. When a client makes a new request, the AI agent:

1. **Recalls** the original agreement from Hindsight memory
2. **Analyzes** the new request against that agreement using Groq AI
3. **Decides** whether the request is: `IN SCOPE` | `OUT OF SCOPE` | `NEEDS CLARIFICATION`
4. **Stores** the interaction for future reference — so the agent gets smarter over time

---

## 🏗️ Architecture

```
ScopeSentry AI
├── backend/          # FastAPI + Python
│   ├── app/
│   │   ├── api/      # REST API endpoints
│   │   ├── models/   # SQLAlchemy DB models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Hindsight, Groq, Scope logic
│   │   ├── database/ # SQLite connection
│   │   └── utils/    # Prompts & helpers
│   ├── requirements.txt
│   └── .env.example
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── pages/    # 8 application pages
        ├── components/
        └── services/ # API client
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Lucide React, Recharts |
| Backend | Python 3.11+, FastAPI, Pydantic v2 |
| AI Brain | Groq API (openai/gpt-oss-120b) |
| Persistent Memory | Hindsight Cloud (`hindsight-client`) |
| Database | SQLite + SQLAlchemy (async) |

---

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Hindsight API key (at [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io))

### Step 1: Clone & Configure

```bash
# Navigate to project root
cd "ScopeSentry AI"

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:
```env
GROQ_API_KEY=gsk_your_groq_key_here
HINDSIGHT_API_KEY=your_hindsight_key_here
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
DATABASE_URL=sqlite:///./scopesentry.db
```

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🎯 Demo Workflow (For Judges)

### One-Click Demo Setup

1. Open the app at `http://localhost:5173`
2. Navigate to **Dashboard**
3. Click **"Run Demo Scenario"** button
4. This will:
   - Create client: **Acme Technologies**
   - Create project: **Corporate Website Development**
   - Store the agreement in **Hindsight memory**
   - Create 4 historical interactions in Hindsight

### Walkthrough

| Step | Action | What Happens |
|------|--------|--------------|
| 1 | Agreement created | Stored in SQLite AND Hindsight memory bank |
| 2 | Client requests payment gateway | AI recalls agreement, identifies EXCLUDED feature |
| 3 | Decision: OUT OF SCOPE | Groq analyzes with Hindsight memories as context |
| 4 | Interaction stored | Hindsight retains decision for future reference |
| 5 | New request analyzed | Agent recalls ALL previous history, smarter analysis |

### Manual Demo

1. Go to **Agreements** → Create a new agreement
2. Go to **Request Analyzer** → Select the project
3. Enter: *"Please add an online payment gateway and three additional pages"*
4. Watch the AI recall memories and make its decision

---

## 📄 Core Features

### 🔵 Dashboard
- Live stats: Clients, Projects, Analyses, Out-of-Scope count
- Groq + Hindsight connection status indicators
- Recent activity table
- Scope risk distribution chart

### 👥 Client Management
- Full CRUD for clients
- View client profiles with associated projects

### 📋 Agreement Management
- Detailed agreement creation with structured fields
- **Automatically stores every agreement in Hindsight**
- Visual indicator when memory is stored

### 🤖 AI Request Analyzer (Main Feature)
- Select project → Enter request → Get AI analysis
- Shows:
  - Decision with color-coded badge (🟢 🔴 🟠)
  - Risk level (LOW / MEDIUM / HIGH)
  - Agreement reference clauses
  - Requested changes list
  - AI reasoning explanation
  - **Number of memories retrieved from Hindsight**
  - Recommended action
  - Professional client reply (copyable)
  - Suggested additional charge (when pricing info exists)

### 🧠 Memory Center
- Browse all stored memories per project
- Search/query memories using Hindsight recall
- View agreement history, past decisions, approved changes

### 📈 Learning History
- Timeline of all scope analyses
- Shows how the agent accumulates context over time
- Decision distribution charts

---

## 🔐 Security

- API keys stored only in backend `.env` — never exposed to frontend
- Client memories are isolated per project bank
- Input validation on all endpoints
- Error messages never leak sensitive information

---

## 🗺️ API Endpoints

```
GET  /api/dashboard/stats          # Dashboard statistics
GET  /api/dashboard/status         # Service health check
GET  /api/clients                  # List clients
POST /api/clients                  # Create client
GET  /api/projects                 # List projects
POST /api/projects                 # Create project
GET  /api/agreements               # List agreements
POST /api/agreements               # Create + store in Hindsight
POST /api/analyze                  # Analyze client request
GET  /api/analyses                 # List all analyses
GET  /api/memory/{pid}/{cid}       # Get project memories
POST /api/memory/{pid}/{cid}/search # Search memories
GET  /api/memory/status            # Hindsight status
POST /api/demo/setup               # Create demo data
```

---

## 🧪 How Hindsight Memory Works

```
1. RETAIN (Store)
   Agreement created → hindsight.retain(bank_id, agreement_text)
   
2. RECALL (Retrieve)
   New request → hindsight.recall(bank_id, query) → relevant memories
   
3. REFLECT (Reason)
   Complex history → hindsight.reflect(bank_id, query) → insight summary

4. PERSIST (Accumulate)
   Every analysis stored → future analyses have more context
```

Memory banks are isolated per project: `scopesentry-project-{id}-client-{id}`

---

## 🤝 Built With

- [FastAPI](https://fastapi.tiangolo.com/) — High-performance Python API
- [Groq](https://groq.com/) — Ultra-fast AI inference
- [Hindsight](https://docs.hindsight.vectorize.io/) — Persistent agent memory
- [React](https://react.dev/) — UI framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Recharts](https://recharts.org/) — Data visualization

---

*ScopeSentry AI — Protecting freelancers and agencies from scope creep since 2024.*
