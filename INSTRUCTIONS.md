# NanoGPT Visualizer — Complete Setup Instructions

> See exactly what happens inside a transformer as you chat.

---

## What You're Building

A split-screen web app:
- **Left panel** — Claude-style chat interface (Fast ⚡ or Thinking 🧠 mode)
- **Right panel** — Live transformer visualization: tokenization → embeddings → attention → FFN → output distribution

Every query you type gets processed by:
1. A real LLM (Groq's Llama 3 — free API)
2. A GPT-2 visualization pipeline showing every internal step

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Python | ≥ 3.13 | `python3 --version` |
| Node.js | ≥ 18 | `node --version` |
| npm | ≥ 9 | `npm --version` |

---

## Step 1 — Get API Keys (5 minutes, both free)

### Groq API Key (REQUIRED)
The LLM backbone. Free tier is generous (~100 requests/min).

1. Go to **https://console.groq.com**
2. Sign up (GitHub login works)
3. Click **API Keys → Create API Key**
4. Copy the key (starts with `gsk_...`)

### Tavily API Key (OPTIONAL — for web search)
Enables real-time web search when the model needs current info.

1. Go to **https://tavily.com**
2. Sign up → Dashboard → Copy API key
3. If you skip this, the app falls back to DuckDuckGo (no key needed)

---

## Step 2 — Clone / Extract the Project

```bash
# If you have the zip:
unzip nanogpt_visualizer.zip
cd nanogpt_viz

# Or clone from GitHub:
git clone https://github.com/yourname/nanogpt-visualizer
cd nanogpt-visualizer
```

---

## Step 3 — Configure Environment

```bash
# Copy the template
cp backend/.env.example backend/.env

# Open and edit
nano backend/.env        # Linux/Mac
notepad backend\.env     # Windows
```

Fill in:
```env
GROQ_API_KEY=gsk_your_actual_key_here
TAVILY_API_KEY=tvly_your_key_here   # optional
```

---

## Step 4 — Start the App

### Option A: One command (Mac/Linux)
```bash
chmod +x start.sh
./start.sh
```

### Option B: One command (Windows)
```cmd
start.bat
```

### Option C: Manual (any OS)

**Terminal 1 — Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Open your browser:
```
http://localhost:3000
```

---

## Step 5 — Using the App

### Chat modes
| Mode | Model | Best for |
|------|-------|----------|
| ⚡ Fast | llama-3.1-8b-instant | Quick answers, code, general Q&A |
| 🧠 Thinking | llama-3.3-70b-versatile | Complex reasoning, math, deep analysis |

Toggle with the mode switcher in the top bar.

### Web search
Click the **"Web search"** toggle above the input box. The model will search before answering when you ask about recent events, news, or time-sensitive facts.

### Transformer visualizer (right panel)
When you send a message, the right panel animates through 5 steps:

| Step | What you see |
|------|-------------|
| **Tokenize** | Your text split into BPE tokens. Click any token to see its ID, bytes, hex |
| **Embed** | Each token's 16-dim embedding vector shown as a bar chart. Heatmap of all tokens |
| **Attention** | Causal attention heatmap per head. Upper triangle is masked (future = forbidden) |
| **FFN** | Pre/post-GELU neuron activations for each token |
| **Output** | Next-token probability distribution. Interactive temperature slider |

Click any step tab to jump to it. Steps auto-advance every ~1.8 seconds after a new message.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React)                      │
│                                                          │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │   ChatPanel     │    │    VisualizerPanel           │ │
│  │  - WebSocket    │    │  - TokenizeStep              │ │
│  │    streaming    │    │  - EmbedStep                 │ │
│  │  - Thinking     │    │  - AttentionStep (heatmap)   │ │
│  │    mode tags    │    │  - FFNStep (GELU viz)        │ │
│  │  - Search       │    │  - OutputStep (prob dist)    │ │
│  │    results      │    │                              │ │
│  └────────┬────────┘    └────────────────────────────┬─┘ │
│           │ WebSocket /ws/stream                      │  │
│           │ POST /api/visualize ─────────────────────┘  │
└───────────┼──────────────────────────────────────────────┘
            │
     FastAPI (Python)
            │
     ┌──────┴───────────────────────────────────┐
     │              main.py                      │
     │                                           │
     │  /ws/stream  → Groq API (streaming)       │
     │  /api/chat   → Groq API (REST fallback)   │
     │  /api/visualize → BPE tokenizer +         │
     │                   attention simulator +   │
     │                   FFN simulator           │
     │  web_search()  → Tavily or DuckDuckGo    │
     └───────────────────────────────────────────┘
```

---

## File Structure

```
nanogpt_viz/
├── start.sh               ← Mac/Linux one-command starter
├── start.bat              ← Windows one-command starter
├── INSTRUCTIONS.md        ← This file
│
├── backend/
│   ├── main.py            ← FastAPI app (all endpoints)
│   ├── requirements.txt
│   ├── .env.example       ← Copy to .env and fill keys
│   └── .env               ← Your keys (DO NOT COMMIT)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx                           ← Split-screen layout
        ├── main.jsx
        ├── styles/globals.css
        └── components/
            ├── layout/TopBar.jsx             ← Mode switcher
            ├── chat/ChatPanel.jsx            ← Chat + streaming
            └── visualizer/
                ├── VisualizerPanel.jsx       ← Step orchestrator
                ├── EmptyState.jsx
                └── steps/
                    ├── TokenizeStep.jsx      ← BPE tokens
                    ├── EmbedStep.jsx         ← Embedding vectors
                    ├── AttentionStep.jsx     ← Attention heatmap
                    ├── FFNStep.jsx           ← GELU activations
                    └── OutputStep.jsx        ← Probability dist
```

---

## Troubleshooting

### "No GROQ_API_KEY" error in chat
→ You haven't set your key in `backend/.env`. Follow Step 3.

### Backend starts but frontend can't connect
→ Check that backend is on port 8000: `curl http://localhost:8000/api/health`

### `npm install` fails
→ Make sure Node.js ≥ 18: `node --version`. Update if needed.

### WebSocket disconnects immediately
→ Try the REST fallback by sending a message — the UI catches WS errors automatically.

### Port 3000 or 8000 already in use
```bash
# Kill whatever is on port 8000
lsof -ti:8000 | xargs kill -9

# Or change the port in backend:
uvicorn main:app --port 8001
# And update frontend/vite.config.js proxy target
```

### `python3 -m venv` fails on Ubuntu
```bash
sudo apt install python3-venv
```

---

## Deploying Online (Optional)

### Backend — Railway (free tier)
1. Create account at railway.app
2. New project → Deploy from GitHub → select `backend/` as root
3. Add environment variables: GROQ_API_KEY, TAVILY_API_KEY
4. Copy your Railway URL

### Frontend — Vercel (free tier)
1. Create account at vercel.com
2. Import from GitHub → select `frontend/` as root
3. Add environment variable: `VITE_API_URL=https://your-railway-url.railway.app`
4. Update `vite.config.js` proxy or use env var for API base URL

---

## What to Post on LinkedIn

See `docs/linkedin_post.md` for a ready-to-paste post.

## What to Post on GitHub

The README.md at the project root is already formatted for GitHub. Push the full `nanogpt_viz/` folder (excluding `backend/.env`) and it will render correctly.

---

*Built by Krithik — Integrated M.Sc. Data Science, Amrita Vishwa Vidyapeetham*
