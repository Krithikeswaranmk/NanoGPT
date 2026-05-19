import React, { useState, useRef, useEffect } from 'react'
import { Send, Globe, Loader2, Search, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const SUGGESTIONS = [
  "Explain how attention works in transformers",
  "What is the difference between GPT-2 and GPT-4?",
  "How does byte-pair encoding tokenization work?",
  "What are scaling laws in large language models?",
  "Explain residual connections and why they matter",
]

function ThinkingBlock({ content, isStreaming }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="thinking-block mb-3">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-2 text-amber-400/80 text-xs font-medium w-full text-left"
      >
        <Lightbulb size={12} className={isStreaming ? 'animate-thinking' : ''} />
        <span>{isStreaming ? 'Thinking...' : 'Reasoning process'}</span>
        {!isStreaming && (expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </button>
      {(expanded || isStreaming) && content && (
        <p className="mt-2 text-xs text-amber-200/60 leading-relaxed font-mono whitespace-pre-wrap">{content}</p>
      )}
    </div>
  )
}

function SearchResults({ results }) {
  if (!results?.length) return null
  return (
    <div className="mb-3 rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
      <div className="flex items-center gap-1.5 text-xs text-accent-400 font-medium mb-2">
        <Search size={11} />
        Web search results used
      </div>
      <div className="space-y-1.5">
        {results.slice(0, 3).map((r, i) => (
          <div key={i} className="text-xs">
            <a href={r.url} target="_blank" rel="noopener noreferrer"
               className="text-gray-300 hover:text-white font-medium underline decoration-dotted">
              {r.title}
            </a>
            <p className="text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{r.snippet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-accent-400 font-bold text-xs">G</span>
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'order-first' : ''}`}>
        {isUser ? (
          <div className="bg-accent-500/15 border border-accent-500/25 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-gray-100 leading-relaxed">
            {msg.content}
          </div>
        ) : (
          <div className="space-y-1">
            {msg.thinking && (
              <ThinkingBlock content={msg.thinking} isStreaming={msg.isThinkingStreaming} />
            )}
            {msg.searchResults?.length > 0 && (
              <SearchResults results={msg.searchResults} />
            )}
            <div className={`rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed bg-surface-800/60 border border-white/[0.05] text-gray-200 chat-prose ${msg.isStreaming ? 'cursor-blink' : ''}`}>
              {msg.content ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 size={13} className="animate-spin" />
                  <span className="text-xs">Generating...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ChatPanel({ mode, onQuery }) {
  const [messages, setMessages]     = useState([])
  const [input, setInput]           = useState('')
  const [useSearch, setUseSearch]   = useState(false)
  const [isLoading, setIsLoading]   = useState(false)
  const scrollRef                   = useRef(null)
  const inputRef                    = useRef(null)
  const wsRef                       = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const connectWS = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/stream`)
    wsRef.current = ws
    return ws
  }

  const send = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput('')
    setIsLoading(true)

    // Trigger visualizer
    onQuery(text)

    // Add user message
    const userMsg = { role: 'user', content: text, id: Date.now() }
    setMessages(prev => [...prev, userMsg])

    // Add empty assistant message
    const assistantId = Date.now() + 1
    setMessages(prev => [...prev, {
      role: 'assistant', content: '', id: assistantId,
      isStreaming: true, thinking: '', isThinkingStreaming: false,
      searchResults: [],
    }])

    // Stream via WebSocket
    const ws = connectWS()
    let fullContent = ''
    let thinking    = ''

    ws.onopen = () => {
      ws.send(JSON.stringify({
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        mode,
        use_search: useSearch,
        query: text,
      }))
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'token') {
        fullContent += data.content
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: fullContent } : m
        ))
      } else if (data.type === 'thinking') {
        thinking += data.content
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, thinking, isThinkingStreaming: true } : m
        ))
      } else if (data.type === 'thinking_end') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, isThinkingStreaming: false } : m
        ))
      } else if (data.type === 'search') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, searchResults: data.results } : m
        ))
      } else if (data.type === 'done') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        ))
        setIsLoading(false)
        ws.close()
      } else if (data.type === 'error') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `Error: ${data.content}`, isStreaming: false }
            : m
        ))
        setIsLoading(false)
        ws.close()
      }
    }

    ws.onerror = () => {
      // Fallback to REST API
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          mode, use_search: useSearch, query: text,
        }),
      })
        .then(r => r.json())
        .then(data => {
          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? { ...m, content: data.response, isStreaming: false,
                  thinking: data.thinking || '', searchResults: data.search_results || [] }
              : m
          ))
        })
        .catch(err => {
          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? { ...m, content: `Error: ${err.message}`, isStreaming: false }
              : m
          ))
        })
        .finally(() => setIsLoading(false))
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] flex-shrink-0">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Chat</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            mode === 'thinking'
              ? 'bg-amber-400/10 border-amber-400/20 text-amber-400'
              : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
          }`}>
            {mode === 'thinking' ? '🧠 Thinking' : '⚡ Fast'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold grad-text">G</span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">NanoGPT Visualizer</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
              Ask anything. Watch the transformer process your text in real time on the right.
            </p>
            <div className="w-full max-w-sm space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="w-full text-left text-xs text-gray-400 hover:text-gray-200 bg-surface-850/50 hover:bg-surface-800/80 border border-white/[0.05] hover:border-white/10 rounded-xl px-3 py-2.5 transition-all duration-150"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => <Message key={msg.id} msg={msg} />)
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 p-3 border-t border-white/[0.04] bg-surface-900/40">
        {/* Search toggle */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setUseSearch(s => !s)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-all ${
              useSearch
                ? 'bg-accent-500/15 border-accent-500/30 text-accent-400'
                : 'bg-transparent border-white/[0.06] text-gray-500 hover:text-gray-300'
            }`}
          >
            <Globe size={11} />
            Web search
          </button>
          {useSearch && (
            <span className="text-[10px] text-gray-600">
              Uses Tavily / DuckDuckGo for recent info
            </span>
          )}
        </div>

        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask anything about transformers, AI, or anything else..."
            rows={1}
            style={{ resize: 'none', minHeight: '40px', maxHeight: '120px', overflowY: 'auto' }}
            className="flex-1 bg-surface-800/60 border border-white/[0.06] focus:border-accent-500/40 focus:outline-none rounded-xl px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-600 transition-colors"
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || isLoading}
            className="send-btn flex-shrink-0"
          >
            {isLoading
              ? <Loader2 size={15} className="animate-spin" />
              : <Send size={15} />
            }
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 text-center">
          Enter to send · Shift+Enter for newline · Right panel shows transformer internals
        </p>
      </div>
    </div>
  )
}
