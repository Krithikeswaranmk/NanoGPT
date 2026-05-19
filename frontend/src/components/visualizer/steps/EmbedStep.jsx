import React, { useState } from 'react'

function Skeleton({ className = '' }) {
  return <div className={`shimmer rounded ${className}`} />
}

function EmbeddingBar({ value, max, color }) {
  const pct = Math.abs(value) / (max + 0.001) * 100
  const isNeg = value < 0
  return (
    <div className="flex items-center gap-1.5 h-4">
      <div className="flex-1 flex items-center justify-end">
        {isNeg && (
          <div
            className="h-1.5 rounded-full opacity-80"
            style={{ width: `${pct}%`, backgroundColor: '#f87171' }}
          />
        )}
      </div>
      <div className="w-px h-3 bg-white/[0.08] flex-shrink-0" />
      <div className="flex-1">
        {!isNeg && (
          <div
            className="h-1.5 rounded-full opacity-80"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        )}
      </div>
    </div>
  )
}

export default function EmbedStep({ data, isLoading }) {
  const [selected, setSelected] = useState(0)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-56" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) return null
  const embeddings = data.token_embeddings || []
  const nEmbd = data.n_embd || 16
  const sel = embeddings[selected]

  const allVals = embeddings.flatMap(e => e.vector || [])
  const maxVal  = Math.max(...allVals.map(Math.abs), 0.001)

  const EMBED_COLORS = ['#2dd4bf', '#7c6ff7', '#fbbf24', '#f87171', '#34d399', '#818cf8', '#fb923c', '#a78bfa']

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Explanation */}
      <div className="flex items-start gap-3 rounded-xl bg-accent-500/5 border border-accent-500/15 p-3">
        <div className="w-1 h-1 rounded-full bg-accent-400 mt-1.5 flex-shrink-0" />
        <div>
          <div className="text-xs font-medium text-accent-400 mb-0.5">Token + Positional Embeddings</div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Each token ID → a {nEmbd}-dim vector from the embedding table <span className="text-gray-300 font-mono">wte</span>.
            A position vector from <span className="text-gray-300 font-mono">wpe</span> is added.
            Result: <span className="text-gray-300 font-mono">x = wte(id) + wpe(pos)</span> — shape <span className="text-teal-400 font-mono">(B, T, {nEmbd})</span>
          </p>
        </div>
      </div>

      {/* Weight tying note */}
      <div className="step-panel flex items-center gap-3">
        <div className="text-lg">🔗</div>
        <div>
          <div className="text-xs font-medium text-white mb-0.5">Weight Tying</div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <span className="font-mono text-gray-300">wte.weight</span> and <span className="font-mono text-gray-300">lm_head.weight</span> are the <em>same</em> tensor.
            Saves ~38M params and improves performance.
          </p>
        </div>
      </div>

      {/* Token selector */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
          Select a token to inspect its embedding
        </div>
        <div className="flex flex-wrap gap-1.5">
          {embeddings.map((e, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`font-mono text-xs px-2 py-1 rounded-lg border transition-all ${
                selected === i
                  ? 'bg-accent-500/20 border-accent-500/40 text-accent-300 scale-105'
                  : 'bg-surface-800/40 border-white/[0.04] text-gray-400 hover:text-gray-200'
              }`}
            >
              {e.token.replace(/ /g, '·').replace(/\n/g, '↵')}
              <span className="ml-1 text-[9px] text-gray-600">@{e.position}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected embedding detail */}
      {sel && (
        <div className="step-panel animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-mono text-sm text-accent-400">"{sel.token}"</span>
              <span className="text-[11px] text-gray-600 ml-2">at position {sel.position}</span>
            </div>
            <div className="text-[10px] text-gray-600">
              ‖v‖ = <span className="text-teal-400 font-mono">{sel.norm}</span>
            </div>
          </div>

          {/* Embedding vector bars */}
          <div className="space-y-1">
            <div className="text-[10px] text-gray-600 mb-1.5">
              Embedding vector — {nEmbd} dimensions
            </div>
            {(sel.vector || []).map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="text-[9px] text-gray-700 font-mono w-6 flex-shrink-0">d{i}</div>
                <EmbeddingBar value={v} max={maxVal} color={EMBED_COLORS[i % EMBED_COLORS.length]} />
                <div className={`text-[9px] font-mono w-14 text-right flex-shrink-0 ${v >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                  {v.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mini heatmap of all embeddings */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
          Embedding matrix — all tokens × all dimensions
        </div>
        <div className="overflow-x-auto">
          <div
            className="grid gap-px"
            style={{ gridTemplateColumns: `repeat(${nEmbd}, minmax(0, 1fr))` }}
          >
            {embeddings.slice(0, 16).flatMap((e, ti) =>
              (e.vector || []).map((v, di) => {
                const intensity = Math.abs(v) / (maxVal + 0.001)
                const isPos = v >= 0
                return (
                  <div
                    key={`${ti}-${di}`}
                    title={`tok="${e.token}" dim=${di} val=${v.toFixed(3)}`}
                    className="rounded-[1px] cursor-default"
                    style={{
                      height: '10px',
                      backgroundColor: isPos
                        ? `rgba(45, 212, 191, ${0.1 + intensity * 0.9})`
                        : `rgba(248, 113, 113, ${0.1 + intensity * 0.9})`,
                    }}
                  />
                )
              })
            )}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-gray-700">token 0</span>
            <span className="text-[9px] text-gray-700">token {Math.min(embeddings.length, 16) - 1}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-red-400/60" />
              <span className="text-[9px] text-gray-600">negative</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-teal-400/60" />
              <span className="text-[9px] text-gray-600">positive</span>
            </div>
          </div>
        </div>
      </div>

      {/* formula */}
      <div className="step-panel font-mono text-center text-xs">
        <div className="text-gray-500 mb-2">Mathematical formula</div>
        <div className="text-gray-300">
          x<sub>t</sub> = <span className="text-teal-400">wte(id<sub>t</sub>)</span> + <span className="text-accent-400">wpe(t)</span>
        </div>
        <div className="text-[10px] text-gray-600 mt-1">
          Output shape: (B=1, T={embeddings.length}, C={nEmbd})
        </div>
      </div>
    </div>
  )
}
