"""
NanoGPT Visualizer — Backend API
=================================
FastAPI server that powers the split-screen transformer visualizer.

Endpoints:
  POST /api/chat         — main chat endpoint (fast/thinking mode)
  POST /api/visualize    — returns step-by-step transformer internals
  GET  /api/search       — web search fallback
  GET  /api/health       — health check
  WS   /ws/stream        — streaming chat via WebSocket
"""

import os
import json
import math
import time
import asyncio
import logging
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="NanoGPT Visualizer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ─────────────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE    = "https://api.groq.com/openai/v1"
TAVILY_KEY   = os.getenv("TAVILY_API_KEY", "")

FAST_MODEL     = "llama-3.1-8b-instant"
THINKING_MODEL = "llama-3.3-70b-versatile"

SYSTEM_FAST = """You are NanoGPT, a fast and efficient AI assistant.
Answer concisely and clearly. If you are unsure about recent facts, say so.
Format responses with markdown when helpful."""

SYSTEM_THINKING = """You are NanoGPT in thinking mode — a deep reasoning AI assistant.
Before answering, reason through the problem carefully step by step.
Show your reasoning process using <think>...</think> tags, then give your final answer.
Be thorough, accurate, and insightful."""


# ── Request/Response models ────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]
    mode: str = "fast"          # "fast" | "thinking"
    use_search: bool = False
    query: str = ""

class VisualizeRequest(BaseModel):
    text: str
    mode: str = "fast"


# ── Web search ─────────────────────────────────────────────────────────────────

async def web_search(query: str) -> dict:
    """Search via Tavily API. Falls back to DuckDuckGo if no key."""
    if TAVILY_KEY:
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                r = await client.post(
                    "https://api.tavily.com/search",
                    json={"api_key": TAVILY_KEY, "query": query,
                          "max_results": 5, "search_depth": "basic"},
                )
                data = r.json()
                results = data.get("results", [])
                return {
                    "results": [{"title": x.get("title",""), "url": x.get("url",""),
                                 "snippet": x.get("content","")[:300]} for x in results[:4]],
                    "query": query,
                }
            except Exception as e:
                logger.warning(f"Tavily search failed: {e}")

    # DuckDuckGo fallback (no key needed)
    async with httpx.AsyncClient(timeout=8) as client:
        try:
            r = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
            )
            data = r.json()
            results = []
            for item in data.get("RelatedTopics", [])[:4]:
                if "Text" in item:
                    results.append({
                        "title": item.get("Text", "")[:60],
                        "url": item.get("FirstURL", ""),
                        "snippet": item.get("Text", "")[:250],
                    })
            return {"results": results, "query": query}
        except Exception as e:
            logger.warning(f"DDG search failed: {e}")
            return {"results": [], "query": query}


# ── Tokenizer (pure Python BPE for visualization) ─────────────────────────────

def tokenize_for_viz(text: str) -> list[dict]:
    """
    Simple character/word level tokenization for visualization.
    Returns tokens with their IDs and byte representations.
    """
    import re
    # GPT-2 style splitting
    pattern = r"'(?:s|t|re|ve|m|ll|d)|[^\s]+|\s+"
    raw_chunks = re.findall(pattern, text) or list(text)

    tokens = []
    for i, chunk in enumerate(raw_chunks[:64]):  # limit for viz
        token_bytes = chunk.encode("utf-8")
        token_id = sum(b * (256 ** j) for j, b in enumerate(token_bytes)) % 50256
        tokens.append({
            "id": i,
            "token_id": token_id,
            "text": chunk,
            "bytes": list(token_bytes),
            "hex": token_bytes.hex(),
        })
    return tokens


def compute_embeddings_viz(tokens: list[dict], n_embd: int = 16) -> list[dict]:
    """Generate fake-but-realistic embedding vectors for visualization."""
    import math, random
    random.seed(42)
    embeddings = []
    for i, tok in enumerate(tokens):
        # Simulate learned embeddings — mix of token and position signal
        tok_signal  = [math.sin(tok["token_id"] * 0.01 * (j + 1)) for j in range(n_embd // 2)]
        pos_signal  = [math.cos(i * 0.3 * (j + 1)) for j in range(n_embd // 2)]
        combined    = [t + p for t, p in zip(tok_signal, pos_signal)]
        # Normalize
        norm = math.sqrt(sum(x**2 for x in combined)) + 1e-8
        combined = [x / norm for x in combined]
        embeddings.append({
            "token": tok["text"],
            "position": i,
            "vector": [round(x, 4) for x in combined],
            "norm": round(norm, 4),
        })
    return embeddings


def compute_attention_viz(tokens: list[dict], n_head: int = 4) -> dict:
    """Generate causal attention weights for visualization."""
    import math, random
    random.seed(7)
    T = min(len(tokens), 20)
    heads = []
    for h in range(n_head):
        matrix = []
        for i in range(T):
            row = []
            # Causal: only attend to j <= i
            raw = [random.uniform(0.1, 2.0) if j <= i else -1e9 for j in range(T)]
            # Softmax
            max_r = max(raw[:i+1])
            exps  = [math.exp(x - max_r) if j <= i else 0.0 for j, x in enumerate(raw)]
            total = sum(exps) + 1e-8
            probs = [round(e / total, 4) for e in exps]
            row = probs
            matrix.append(row)
        heads.append({
            "head": h + 1,
            "matrix": matrix,
            "label": f"Head {h+1}",
        })
    return {
        "n_head": n_head,
        "T": T,
        "tokens": [t["text"] for t in tokens[:T]],
        "heads": heads,
    }


def compute_ffn_viz(tokens: list[dict], n_embd: int = 16) -> list[dict]:
    """Visualize FFN activations (expansion + GELU + contraction)."""
    import math
    ffn_data = []
    for i, tok in enumerate(tokens[:8]):
        x = math.sin(tok["token_id"] * 0.01 + i * 0.3)
        expanded = [round(max(0, x * math.sin(j * 0.7 + x)) * math.cos(j * 0.3), 4)
                    for j in range(8)]  # 4× expansion shown as 8 neurons
        # GELU: 0.5x(1+tanh(sqrt(2/pi)(x+0.044715x^3)))
        def gelu(v):
            return round(0.5 * v * (1 + math.tanh(math.sqrt(2/math.pi) * (v + 0.044715 * v**3))), 4)
        activated = [gelu(v) for v in expanded]
        contracted = [round(sum(activated[j] * math.sin(j * 0.5 + k) for j in range(8)) / 8, 4)
                      for k in range(4)]
        ffn_data.append({
            "token": tok["text"],
            "pre_activation": expanded,
            "post_gelu": activated,
            "output": contracted,
        })
    return ffn_data


# ── Main visualize endpoint ────────────────────────────────────────────────────

@app.post("/api/visualize")
async def visualize(req: VisualizeRequest):
    """
    Return full transformer visualization data for a given text input.
    Steps: tokenize → embed → attention → FFN → output
    """
    text = req.text[:200]  # cap for performance
    n_head = 4 if req.mode == "fast" else 6
    n_embd = 16

    tokens   = tokenize_for_viz(text)
    embeds   = compute_embeddings_viz(tokens, n_embd)
    attn     = compute_attention_viz(tokens, n_head)
    ffn      = compute_ffn_viz(tokens, n_embd)

    # Probability distribution over next tokens (simulated)
    import math, random
    random.seed(sum(ord(c) for c in text))
    top_tokens = ["the", "and", "to", "a", "of", "in", "that", "is", "it", "was",
                  "he", "she", "they", "for", "on", "are", "with", "as", "at", "be"]
    raw_logits = [random.uniform(0, 3) for _ in top_tokens]
    max_l = max(raw_logits)
    exps  = [math.exp(x - max_l) for x in raw_logits]
    total = sum(exps)
    probs = [round(e / total, 4) for e in exps]
    next_token_dist = sorted(
        [{"token": t, "prob": p, "logit": round(l, 3)}
         for t, p, l in zip(top_tokens, probs, raw_logits)],
        key=lambda x: -x["prob"]
    )[:10]

    return {
        "input_text": text,
        "mode": req.mode,
        "steps": {
            "tokenize": {
                "tokens": tokens,
                "vocab_size": 50256,
                "description": f"Text split into {len(tokens)} tokens using BPE",
            },
            "embed": {
                "token_embeddings": embeds,
                "n_embd": n_embd,
                "description": f"Each token → {n_embd}-dim vector (token emb + position emb)",
            },
            "attention": {
                **attn,
                "description": f"Causal self-attention across {len(tokens)} tokens, {n_head} heads",
            },
            "ffn": {
                "activations": ffn,
                "description": "Feed-forward: Linear(C→4C) → GELU → Linear(4C→C)",
            },
            "output": {
                "next_token_distribution": next_token_dist,
                "description": "Softmax over vocab → probability of next token",
            },
        },
        "model_info": {
            "mode": req.mode,
            "n_head": n_head,
            "n_embd": n_embd,
            "n_layer": 4 if req.mode == "fast" else 8,
            "n_tokens": len(tokens),
        },
    }


# ── Chat endpoint ──────────────────────────────────────────────────────────────

@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Non-streaming chat. Returns full response + search results if used."""
    if not GROQ_API_KEY:
        return {
            "response": "⚠️ No GROQ_API_KEY set. Add it to backend/.env and restart. See INSTRUCTIONS.md.",
            "mode": req.mode,
            "search_used": False,
            "search_results": [],
            "thinking": None,
        }

    search_results = []
    search_used = False

    # Web search if requested or if query seems to need it
    should_search = req.use_search or any(
        kw in req.query.lower()
        for kw in ["latest", "current", "today", "2024", "2025", "recent", "news", "price", "who is"]
    )

    if should_search and req.query:
        search_results = (await web_search(req.query)).get("results", [])
        search_used = bool(search_results)

    # Build messages
    system = SYSTEM_THINKING if req.mode == "thinking" else SYSTEM_FAST
    messages_payload = [{"role": "system", "content": system}]

    # Inject search context
    if search_results:
        search_ctx = "Web search results:\n" + "\n".join(
            f"- {r['title']}: {r['snippet']}" for r in search_results[:3]
        )
        messages_payload.append({"role": "system", "content": search_ctx})

    for m in req.messages[-10:]:
        messages_payload.append({"role": m.role, "content": m.content})

    model = THINKING_MODEL if req.mode == "thinking" else FAST_MODEL

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            r = await client.post(
                f"{GROQ_BASE}/chat/completions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}",
                         "Content-Type": "application/json"},
                json={"model": model, "messages": messages_payload,
                      "temperature": 0.7, "max_tokens": 2048},
            )
            data = r.json()
            content = data["choices"][0]["message"]["content"]

            # Extract thinking tags if present
            thinking = None
            if "<think>" in content and "</think>" in content:
                start = content.index("<think>") + 7
                end   = content.index("</think>")
                thinking = content[start:end].strip()
                content  = content[end + 8:].strip()

            return {
                "response": content,
                "mode": req.mode,
                "search_used": search_used,
                "search_results": search_results,
                "thinking": thinking,
                "model": model,
            }
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


# ── WebSocket streaming ────────────────────────────────────────────────────────

@app.websocket("/ws/stream")
async def ws_stream(websocket: WebSocket):
    """Stream chat tokens over WebSocket for real-time display."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            req  = ChatRequest(**data)

            if not GROQ_API_KEY:
                await websocket.send_json({
                    "type": "error",
                    "content": "No GROQ_API_KEY. See INSTRUCTIONS.md"
                })
                continue

            system = SYSTEM_THINKING if req.mode == "thinking" else SYSTEM_FAST
            messages_payload = [{"role": "system", "content": system}]

            # Search
            search_results = []
            if req.use_search and req.query:
                search_results = (await web_search(req.query)).get("results", [])
                if search_results:
                    ctx = "Web search results:\n" + "\n".join(
                        f"- {r['title']}: {r['snippet']}" for r in search_results[:3]
                    )
                    messages_payload.append({"role": "system", "content": ctx})

            for m in req.messages[-10:]:
                messages_payload.append({"role": m.role, "content": m.content})

            # Send search results first
            if search_results:
                await websocket.send_json({"type": "search", "results": search_results})

            model = THINKING_MODEL if req.mode == "thinking" else FAST_MODEL

            # Stream from Groq
            async with httpx.AsyncClient(timeout=60) as client:
                async with client.stream(
                    "POST",
                    f"{GROQ_BASE}/chat/completions",
                    headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                    json={"model": model, "messages": messages_payload,
                          "stream": True, "temperature": 0.7, "max_tokens": 2048},
                ) as resp:
                    in_thinking = False
                    async for line in resp.aiter_lines():
                        if line.startswith("data: "):
                            chunk = line[6:]
                            if chunk == "[DONE]":
                                await websocket.send_json({"type": "done"})
                                break
                            try:
                                obj = json.loads(chunk)
                                delta = obj["choices"][0]["delta"].get("content", "")
                                if not delta:
                                    continue
                                # Detect thinking tags
                                if "<think>" in delta:
                                    in_thinking = True
                                if "</think>" in delta:
                                    in_thinking = False
                                    await websocket.send_json({"type": "thinking_end"})
                                    continue
                                msg_type = "thinking" if in_thinking else "token"
                                await websocket.send_json({"type": msg_type, "content": delta})
                            except Exception:
                                pass

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WS error: {e}")
        try:
            await websocket.send_json({"type": "error", "content": str(e)})
        except:
            pass


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "groq_configured": bool(GROQ_API_KEY),
        "search_configured": bool(TAVILY_KEY),
        "models": {"fast": FAST_MODEL, "thinking": THINKING_MODEL},
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
