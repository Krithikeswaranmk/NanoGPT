# NanoGPT Visualizer — Social Media Assets

---

## LinkedIn Post (ready to copy-paste)

---

**I built a transformer visualizer that shows you what GPT is actually doing — in real time, as you chat.**

Most people use LLMs like a black box. I wanted to see inside.

So I built a split-screen interface: left side is a chat UI (Fast ⚡ and Thinking 🧠 modes, web search), right side shows every step the transformer takes to process your text:

→ **Tokenization** — your text split into BPE subword tokens, each with its ID and byte representation
→ **Embeddings** — each token ID mapped to a learned vector (token embedding + position embedding, added together)
→ **Attention** — causal multi-head attention heatmaps, one per head. Watch the upper triangle go to zero (that's the causal mask — no peeking at future tokens)
→ **FFN** — feed-forward network neuron activations before and after GELU, for each token position
→ **Output** — next-token probability distribution with a temperature slider so you can see how sampling works

The visualization is live and reacts to every message you send.

**Tech stack:**
- Backend: FastAPI + Python (pure BPE tokenizer from scratch)
- LLM: Groq (Llama 3.1 8B for fast mode, Llama 3.3 70B for thinking mode)
- Web search: Tavily / DuckDuckGo fallback
- Frontend: React + Tailwind (dark mode, streaming via WebSocket)

**What I learned building this:**
The thing that surprised me most was how simple the causal mask actually is — it's just `torch.tril` filled with `-inf`. The softmax does the rest. Everything that looks magical about autoregression is just one triangular matrix.

Full code + setup instructions in the comments. Runs locally in ~5 minutes with a free Groq API key.

#MachineLearning #Transformers #GPT #DeepLearning #NLP #Python #React #BuildInPublic #AI

---

*[Attach a screen recording or screenshot of the split-screen app — especially the attention heatmap. A 20-second video of you typing "how does attention work" and the right panel animating will get significantly more engagement than a static image.]*

---

## Twitter/X Thread (8 tweets)

**Tweet 1 (hook):**
I built a transformer visualizer that shows you what GPT is ACTUALLY doing — step by step — as you chat with it.

Not just theory. Live, in a browser. Thread 🧵

**Tweet 2:**
Most people use LLMs like a black box. I wanted to see inside.

So I split the screen: left is a chat interface. Right shows the transformer internals updating in real time with every message.

**Tweet 3:**
Step 1: Tokenization
Your text → BPE subword tokens → integer IDs.

"attention" might become ["att", "ention"] or a single token depending on the vocabulary. Click any token to see its exact bytes.

**Tweet 4:**
Step 2: Embeddings
Each integer ID → a dense vector via wte (token embedding) + wpe (position embedding), added together.

Fun fact: the token embedding table and the LM head output share the SAME weights. This saves ~38M parameters. Press & Wolf (2017).

**Tweet 5:**
Step 3: Attention heatmaps
You can see every head's (T × T) attention weight matrix.

The upper triangle is always zero — that's the causal mask. "No attending to the future." It's implemented as torch.tril filled with -inf before softmax.

**Tweet 6:**
Step 4: FFN activations
After attention, each token passes through Linear(C→4C) → GELU → Linear(4C→C).

I visualized the neuron activations pre- and post-GELU. GELU is smoother than ReLU — small gradient even for slightly negative inputs. That's why transformers prefer it.

**Tweet 7:**
Step 5: Output distribution
The LM head projects back to vocabulary size → softmax → probability over 50,256 possible next tokens.

There's an interactive temperature slider. Drag it and watch the distribution sharpen or flatten in real time.

**Tweet 8:**
The whole thing runs locally with a free Groq API key.

FastAPI backend + React frontend. BPE tokenizer written from scratch in Python (no HuggingFace for the tokenizer).

Code + setup: [github link]
🧵 end

---

## Hacker News — Show HN Post

**Title:**
Show HN: NanoGPT Visualizer – see tokenization, attention, and FFN in real time as you chat

**Text:**
I built a split-screen app that visualizes every step a GPT-2 style transformer takes as you type.

Left side is a chat interface backed by Llama 3 via Groq (fast mode and thinking mode). Right side shows the transformer internals updating with each message: BPE tokenization with byte-level detail, token + positional embedding vectors as bar charts, causal attention heatmaps for each head (upper triangle masked to -inf → 0 after softmax), FFN neuron activations pre/post-GELU, and the final next-token probability distribution with a temperature slider.

The BPE tokenizer is implemented from scratch in Python — no HuggingFace tokenizers. The attention visualization uses the actual causal mask computation (torch.tril converted to -inf mask). Everything runs locally.

Runs in 5 minutes with a free Groq key. Code and setup instructions in the repo.

What motivated this: I was studying transformer internals and found that most "visualizers" either show too little (just the chat) or require a running GPU. This one runs entirely on CPU for the visualization layer — the LLM inference is delegated to Groq's API.

Happy to answer questions about the architecture or the BPE implementation.

[github link]

---

## GitHub README (project root)

---

# NanoGPT Visualizer

**See inside a GPT transformer — live, as you chat.**

A split-screen interface: chat on the left, transformer internals on the right. Every message you send triggers a full visualization pipeline.

![Demo screenshot placeholder — replace with actual screenshot](assets/demo_screenshot.png)

## What gets visualized

| Step | What you see |
|------|-------------|
| **Tokenize** | BPE token IDs, byte representations, vocab stats |
| **Embed** | Token + positional embedding vectors as heatmaps |
| **Attention** | Causal multi-head attention matrices (T × T per head) |
| **FFN** | Pre/post-GELU neuron activations |
| **Output** | Next-token probability distribution, interactive temperature |

## Features

- ⚡ **Fast mode** — Llama 3.1 8B via Groq (streaming, low latency)
- 🧠 **Thinking mode** — Llama 3.3 70B with chain-of-thought reasoning shown
- 🌐 **Web search** — Tavily or DuckDuckGo fallback for current events
- 🎛 **Temperature slider** — live manipulation of output probability distribution

## Quickstart

```bash
# 1. Add your Groq API key to backend/.env
cp backend/.env.example backend/.env
# edit backend/.env

# 2. Start everything
./start.sh          # Mac/Linux
start.bat           # Windows

# 3. Open http://localhost:3000
```

Get a free Groq API key at https://console.groq.com

## Tech Stack

**Backend:** FastAPI · httpx · pure Python BPE tokenizer (no HuggingFace)  
**LLM:** Groq (Llama 3.1 8B / Llama 3.3 70B)  
**Frontend:** React 18 · Tailwind CSS · Vite · WebSocket streaming  
**Search:** Tavily · DuckDuckGo fallback

## Architecture

```
Chat input → FastAPI → Groq LLM (streaming WebSocket)
           ↘ Visualizer pipeline:
               BPE tokenize → embed → attention sim → FFN sim → output dist
```

See [INSTRUCTIONS.md](INSTRUCTIONS.md) for full setup and deployment guide.

---

*Built by Krithik — Integrated M.Sc. Data Science, Amrita Vishwa Vidyapeetham*
