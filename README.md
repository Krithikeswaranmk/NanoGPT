# NanoGPT Visualizer

**See inside a GPT transformer — live, as you chat.**

Split-screen web app: Claude-style chat on the left, live transformer internals on the right.

## Quickstart

```bash
cp backend/.env.example backend/.env   # add your GROQ_API_KEY
./start.sh                              # Mac/Linux  (or start.bat on Windows)
# open http://localhost:3000
```

Get a free Groq API key: https://console.groq.com

## Features

- ⚡ Fast mode (Llama 3.1 8B) and 🧠 Thinking mode (Llama 3.3 70B)
- 🌐 Web search via Tavily or DuckDuckGo
- 📊 Live visualizer: tokenize → embed → attention → FFN → output
- 🎛 Interactive temperature slider on output distribution

## Full setup guide: [INSTRUCTIONS.md](INSTRUCTIONS.md)
## Social media assets: [docs/social_media_assets.md](docs/social_media_assets.md)
