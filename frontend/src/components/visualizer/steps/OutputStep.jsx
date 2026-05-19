import React, { useState } from 'react'

function Skeleton({ className = '' }) {
  return <div className={`shimmer rounded ${className}`} />
}

export default function OutputStep({ data, isLoading, modelInfo }) {
  const [temperature, setTemperature] = useState(1.0)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-xl" />)}
      </div>
    )
  }

  if (!data) return null

  const dist = data.next_token_distribution || []

  // Apply temperature scaling to logits → re-softmax
  const scaled = dist.map(item => ({
    ...item,
    scaled_logit: item.logit / Math.max(temperature, 0.01),
  }))
  const maxLogit = Math.max(...scaled.map(s => s.scaled_logit))
  const exps     = scaled.map(s => Math.exp(s.scaled_logit - maxLogit))
  const sumExps  = exps.reduce((a, b) => a + b, 0)
  const displayed = scaled.map((item, i) => ({
    ...item,
    prob: exps[i] / sumExps,
  })).sort((a, b) => b.prob - a.prob)

  const maxProb = displayed[0]?.prob || 1

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Explanation */}
      <div className="flex items-start gap-3 rounded-xl bg-green-500/5 border border-green-500/15 p-3">
        <div className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
        <div>
          <div className="text-xs font-medium text-green-400 mb-0.5">Output — Next Token Distribution</div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            The LM head projects from embedding space to vocabulary logits: 
            <span className="text-gray-300 font-mono"> Linear(C, {(50256).toLocaleString()})</span>.
            Softmax converts logits to probabilities. The next token is sampled from this distribution.
            <span className="text-gray-300 font-mono"> wte.weight = lm_head.weight</span> (weight tying).
          </p>
        </div>
      </div>

      {/* Model info */}
      {modelInfo && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Layers',   value: modelInfo.n_layer },
            { label: 'Heads',    value: modelInfo.n_head  },
            { label: 'Dim',      value: modelInfo.n_embd  },
            { label: 'Tokens',   value: modelInfo.n_tokens },
          ].map(s => (
            <div key={s.label} className="step-panel text-center">
              <div className="text-base font-semibold text-green-400">{s.value}</div>
              <div className="text-[10px] text-gray-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Temperature control */}
      <div className="step-panel">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            Temperature Sampling
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-green-400">{temperature.toFixed(1)}</span>
            <div className={`text-[10px] px-2 py-0.5 rounded-full border ${
              temperature < 0.7
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                : temperature > 1.3
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-green-500/10 border-green-500/20 text-green-400'
            }`}>
              {temperature < 0.7 ? 'Focused' : temperature > 1.3 ? 'Creative' : 'Balanced'}
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={temperature}
          onChange={e => setTemperature(parseFloat(e.target.value))}
          className="w-full accent-green-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-700 mt-1">
          <span>0.1 (deterministic)</span>
          <span>1.0 (balanced)</span>
          <span>2.0 (random)</span>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 leading-relaxed">
          Logits ÷ T before softmax. Low T → sharp distribution (picks top token). High T → flat distribution (more variety).
          GPT-2 uses T=1 for evaluation.
        </p>
      </div>

      {/* Probability bars */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Top {displayed.length} Next-Token Probabilities
        </div>
        <div className="space-y-1.5">
          {displayed.map((item, i) => (
            <div key={item.token} className="group">
              <div className="flex items-center gap-2 mb-0.5">
                <div
                  className="font-mono text-xs flex-shrink-0 px-1.5 py-0.5 rounded border"
                  style={{ minWidth: '60px',
                    backgroundColor: i === 0 ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                    borderColor:     i === 0 ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.05)',
                    color:           i === 0 ? '#34d399' : '#9ca3af',
                  }}
                >
                  "{item.token}"
                </div>
                <div className="flex-1 h-5 bg-surface-850 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width:           `${(item.prob / maxProb) * 100}%`,
                      backgroundColor: i === 0
                        ? '#34d399'
                        : i < 3 ? '#2dd4bf' : i < 6 ? '#7c6ff7' : '#374151',
                    }}
                  />
                </div>
                <div className="text-xs font-mono text-right flex-shrink-0 w-14" style={{
                  color: i === 0 ? '#34d399' : '#6b7280'
                }}>
                  {(item.prob * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono text-gray-700 w-14 text-right flex-shrink-0">
                  {item.logit.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-2 text-[9px] text-gray-700">
          <span>← token</span>
          <span>probability →</span>
          <span>logit →</span>
        </div>
      </div>

      {/* Entropy */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">
          Distribution Entropy
        </div>
        {(() => {
          const entropy = -displayed.reduce((sum, item) => {
            const p = item.prob
            return p > 0 ? sum + p * Math.log2(p) : sum
          }, 0)
          const maxEntropy = Math.log2(displayed.length)
          const pct = (entropy / maxEntropy) * 100
          return (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 bg-surface-850 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct < 30 ? '#34d399' : pct < 70 ? '#fbbf24' : '#f87171',
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-400">{entropy.toFixed(2)} bits</span>
              </div>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                {entropy < 2
                  ? 'Low entropy — model is confident about the next token.'
                  : entropy < 3.5
                    ? 'Medium entropy — a few plausible next tokens.'
                    : 'High entropy — model is uncertain, many plausible continuations.'}
                {' '}At T={temperature.toFixed(1)}.
              </p>
            </>
          )
        })()}
      </div>

      {/* Full pipeline summary */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">
          Full Forward Pass Summary
        </div>
        <div className="space-y-1 font-mono text-[10px]">
          {[
            { label: 'Input tokens',   value: `(1, T)`,                      color: 'text-teal-400' },
            { label: 'After embed',    value: `(1, T, ${modelInfo?.n_embd || 16})`,  color: 'text-accent-400' },
            { label: `× ${modelInfo?.n_layer || 4} blocks`,  value: `(1, T, ${modelInfo?.n_embd || 16})`,  color: 'text-amber-400' },
            { label: 'After LN_f',     value: `(1, T, ${modelInfo?.n_embd || 16})`,  color: 'text-amber-400' },
            { label: 'LM head logits', value: `(1, T, 50256)`,               color: 'text-green-400' },
            { label: 'Softmax probs',  value: `(1, T, 50256) → sample`,      color: 'text-green-400' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-2">
              <div className="text-gray-700 w-28 flex-shrink-0">{row.label}</div>
              <div className="text-gray-700">→</div>
              <div className={row.color}>{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
