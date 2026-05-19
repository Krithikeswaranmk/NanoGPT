import React, { useState } from 'react'

const TOKEN_COLORS = [
  'bg-teal-500/20 border-teal-500/40 text-teal-300',
  'bg-accent-500/20 border-accent-500/40 text-accent-300',
  'bg-amber-400/20 border-amber-400/40 text-amber-300',
  'bg-pink-500/20 border-pink-500/40 text-pink-300',
  'bg-blue-500/20 border-blue-500/40 text-blue-300',
  'bg-purple-500/20 border-purple-500/40 text-purple-300',
  'bg-orange-500/20 border-orange-500/40 text-orange-300',
  'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
]

function Skeleton({ className = '' }) {
  return <div className={`shimmer rounded ${className}`} />
}

export default function TokenizeStep({ data, isLoading, inputText }) {
  const [selected, setSelected] = useState(null)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) return null
  const tokens = data.tokens || []

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Raw input */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">Raw Input Text</div>
        <p className="font-mono text-xs text-gray-300 leading-relaxed break-all">
          {inputText || '"' + (tokens.map(t => t.text).join('')) + '"'}
        </p>
      </div>

      {/* BPE explanation */}
      <div className="flex items-start gap-3 rounded-xl bg-teal-500/5 border border-teal-500/15 p-3">
        <div className="w-1 h-1 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
        <div>
          <div className="text-xs font-medium text-teal-400 mb-0.5">Byte-Pair Encoding (BPE)</div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Text is split into {tokens.length} subword tokens. Each token maps to an integer ID from the {data.vocab_size?.toLocaleString()}-token vocabulary. 
            Common words become single tokens; rare words split into pieces.
          </p>
        </div>
      </div>

      {/* Token chips */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          {tokens.length} Tokens — click to inspect
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((tok, i) => (
            <button
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`token-chip border rounded-lg px-2 py-1 text-xs font-mono transition-all ${
                TOKEN_COLORS[i % TOKEN_COLORS.length]
              } ${selected === i ? 'ring-1 ring-white/30 scale-105' : 'hover:scale-105'}`}
            >
              <span className="text-[9px] text-gray-500 mr-1">{i}</span>
              {tok.text.replace(/ /g, '·').replace(/\n/g, '↵')}
            </button>
          ))}
        </div>
      </div>

      {/* Selected token detail */}
      {selected !== null && tokens[selected] && (
        <div className="step-panel animate-slide-up border-white/10">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">
            Token #{selected} Inspector
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-gray-600 mb-1">Text</div>
              <div className="font-mono text-sm text-gray-200 bg-surface-850 rounded-lg px-3 py-2 border border-white/[0.05]">
                "{tokens[selected].text}"
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 mb-1">Token ID</div>
              <div className="font-mono text-sm text-accent-400 bg-surface-850 rounded-lg px-3 py-2 border border-white/[0.05]">
                {tokens[selected].token_id}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 mb-1">UTF-8 Bytes</div>
              <div className="font-mono text-xs text-teal-400 bg-surface-850 rounded-lg px-3 py-2 border border-white/[0.05]">
                [{tokens[selected].bytes?.join(', ')}]
              </div>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 mb-1">Hex</div>
              <div className="font-mono text-xs text-amber-400 bg-surface-850 rounded-lg px-3 py-2 border border-white/[0.05]">
                0x{tokens[selected].hex?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Tokens',    value: tokens.length,               color: 'text-teal-400'   },
          { label: 'Vocab size',value: data.vocab_size?.toLocaleString(), color: 'text-accent-400' },
          { label: 'Chars/tok', value: inputText ? (inputText.length / Math.max(tokens.length,1)).toFixed(1) : '—', color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="step-panel text-center">
            <div className={`text-lg font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* BPE algorithm trace */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">How BPE Works</div>
        <div className="space-y-1.5">
          {[
            { step: '1', text: 'Start: every character becomes a separate token', code: '"hello" → ["h","e","l","l","o"]' },
            { step: '2', text: 'Count most frequent byte pairs', code: 'h+e=2, e+l=3, l+l=1 ...' },
            { step: '3', text: 'Merge most frequent pair into new token', code: '"el" → new token ID 257' },
            { step: '4', text: 'Repeat until vocab_size reached (50,256 merges for GPT-2)', code: '"hello" → ["h", "ello"] eventually' },
          ].map(item => (
            <div key={item.step} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-surface-800 border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] text-gray-500">{item.step}</span>
              </div>
              <div>
                <div className="text-xs text-gray-400">{item.text}</div>
                <div className="font-mono text-[10px] text-teal-400/70 mt-0.5">{item.code}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
