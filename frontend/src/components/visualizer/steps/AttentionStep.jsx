import React, { useState, useRef, useEffect } from 'react'

function Skeleton({ className = '' }) {
  return <div className={`shimmer rounded ${className}`} />
}

function AttentionHeatmap({ matrix, tokens, headLabel, color }) {
  const T = Math.min(tokens.length, matrix.length)
  const cellSize = Math.min(28, Math.floor(260 / (T + 1)))

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Column headers (key positions) */}
        <div className="flex" style={{ paddingLeft: `${cellSize + 4}px` }}>
          {tokens.slice(0, T).map((tok, j) => (
            <div
              key={j}
              style={{ width: cellSize, flexShrink: 0 }}
              className="text-center"
              title={tok}
            >
              <span
                className="text-gray-600 font-mono"
                style={{ fontSize: '8px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'block', maxHeight: '40px', overflow: 'hidden' }}
              >
                {tok.replace(/ /g, '·').slice(0, 6)}
              </span>
            </div>
          ))}
        </div>

        {/* Rows */}
        {matrix.slice(0, T).map((row, i) => (
          <div key={i} className="flex items-center gap-1 mb-px">
            {/* Row label (query position) */}
            <div
              className="text-gray-600 font-mono text-right flex-shrink-0 truncate"
              style={{ width: cellSize, fontSize: '8px' }}
              title={tokens[i]}
            >
              {tokens[i]?.replace(/ /g, '·').slice(0, 5)}
            </div>

            {/* Cells */}
            {row.slice(0, T).map((val, j) => {
              const isMasked = j > i
              return (
                <div
                  key={j}
                  title={`q="${tokens[i]}" → k="${tokens[j]}": ${isMasked ? 'masked' : val.toFixed(3)}`}
                  style={{
                    width:           cellSize,
                    height:          cellSize,
                    flexShrink:      0,
                    backgroundColor: isMasked
                      ? 'rgba(255,255,255,0.02)'
                      : `rgba(${color}, ${0.08 + val * 0.92})`,
                    borderRadius:    '3px',
                  }}
                  className="transition-all hover:ring-1 hover:ring-white/20 cursor-default"
                />
              )
            })}
          </div>
        ))}

        {/* Axis labels */}
        <div className="flex items-center justify-between mt-2" style={{ paddingLeft: `${cellSize + 4}px` }}>
          <span className="text-[9px] text-gray-600">← Key position (attended to)</span>
        </div>
        <div className="text-[9px] text-gray-600 mt-1">Query position (attending) ↑</div>
      </div>
    </div>
  )
}

const HEAD_COLORS = [
  '45, 212, 191',   // teal
  '124, 111, 247',  // accent/purple
  '251, 191, 36',   // amber
  '248, 113, 113',  // coral
  '52, 211, 153',   // green
  '129, 140, 248',  // indigo
]

export default function AttentionStep({ data, isLoading }) {
  const [selectedHead, setSelectedHead] = useState(0)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-56" />
        <div className="flex gap-2">
          {[0,1,2,3].map(i => <Skeleton key={i} className="h-8 w-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  const heads  = data.heads || []
  const tokens = data.tokens || []
  const T      = data.T || tokens.length
  const head   = heads[selectedHead]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Explanation */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-400/5 border border-amber-400/15 p-3">
        <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
        <div>
          <div className="text-xs font-medium text-amber-400 mb-0.5">Causal Multi-Head Self-Attention</div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Each position queries all past positions. 
            Score<sub>ij</sub> = Q<sub>i</sub>·K<sub>j</sub>/√d<sub>k</sub> → softmax → weight × V.
            Upper triangle is <span className="text-red-400">masked to −∞</span> (future = forbidden).
            {data.n_head} heads run in parallel, each learning different patterns.
          </p>
        </div>
      </div>

      {/* Head selector */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
          {data.n_head} Attention Heads — select to inspect
        </div>
        <div className="flex flex-wrap gap-2">
          {heads.map((h, i) => (
            <button
              key={i}
              onClick={() => setSelectedHead(i)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                selectedHead === i
                  ? 'scale-105 ring-1 ring-white/20'
                  : 'opacity-60 hover:opacity-90'
              }`}
              style={{
                backgroundColor: `rgba(${HEAD_COLORS[i % HEAD_COLORS.length]}, 0.12)`,
                borderColor:     `rgba(${HEAD_COLORS[i % HEAD_COLORS.length]}, 0.35)`,
                color:           `rgb(${HEAD_COLORS[i % HEAD_COLORS.length]})`,
              }}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      {head && (
        <div className="step-panel">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-gray-300">{head.label} — Attention Weight Matrix</div>
            <div className="text-[10px] text-gray-600">
              Shape: ({T} × {T})
            </div>
          </div>
          <AttentionHeatmap
            matrix={head.matrix}
            tokens={tokens}
            headLabel={head.label}
            color={HEAD_COLORS[selectedHead % HEAD_COLORS.length]}
          />

          {/* Colorbar */}
          <div className="flex items-center gap-2 mt-3 justify-center">
            <span className="text-[9px] text-gray-700">0.0</span>
            <div
              className="h-2 w-32 rounded-full"
              style={{
                background: `linear-gradient(to right, rgba(${HEAD_COLORS[selectedHead % HEAD_COLORS.length]}, 0.05), rgba(${HEAD_COLORS[selectedHead % HEAD_COLORS.length]}, 1))`,
              }}
            />
            <span className="text-[9px] text-gray-700">1.0</span>
            <span className="text-[9px] text-gray-600 ml-2">attention weight</span>
          </div>
        </div>
      )}

      {/* Causal mask explanation */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">Causal Mask</div>
        <div className="font-mono text-[11px] text-gray-400 leading-relaxed space-y-1">
          <div className="text-gray-600">Upper triangle = -∞ before softmax → 0 after softmax</div>
          {['[1.0, 0.0, 0.0, 0.0]', '[0.6, 0.4, 0.0, 0.0]', '[0.4, 0.3, 0.3, 0.0]', '[0.3, 0.3, 0.2, 0.2]'].map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gray-700">pos {i}:</span>
              <span>
                {row.split(', ').map((v, j) => (
                  <span
                    key={j}
                    className={j > i ? 'text-surface-700' : j === i ? 'text-amber-400' : 'text-teal-400'}
                  >
                    {v}{j < 3 ? ', ' : ''}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-[10px]">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-teal-400/60" /><span className="text-gray-600">past (visible)</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-400/60" /><span className="text-gray-600">self (visible)</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-surface-700 border border-white/[0.04]" /><span className="text-gray-600">future (masked)</span></div>
        </div>
      </div>

      {/* Formula */}
      <div className="step-panel text-center font-mono text-xs">
        <div className="text-gray-500 mb-1">Scaled dot-product attention</div>
        <div className="text-gray-300">
          Attention(Q,K,V) = softmax( QK<sup>T</sup> / √d<sub>k</sub> ) V
        </div>
        <div className="text-[10px] text-gray-600 mt-1">
          Q,K,V: (B, {data.n_head}, T, {Math.floor(16 / data.n_head)}) — head_size = C / n_head
        </div>
      </div>
    </div>
  )
}
