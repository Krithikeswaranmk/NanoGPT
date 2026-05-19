import React, { useState } from 'react'

function Skeleton({ className = '' }) {
  return <div className={`shimmer rounded ${className}`} />
}

function NeuronBar({ value, maxVal, label, color }) {
  const width = Math.abs(value) / (maxVal + 1e-6) * 100
  const isNeg = value < 0
  return (
    <div className="flex items-center gap-2 group">
      <div className="text-[9px] font-mono text-gray-700 w-8 flex-shrink-0 group-hover:text-gray-400 transition-colors">
        {label}
      </div>
      <div className="flex-1 h-4 bg-surface-850 rounded-full overflow-hidden border border-white/[0.03] relative">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width:           `${width}%`,
            backgroundColor: isNeg ? '#f87171' : color,
            opacity:         0.8,
          }}
        />
      </div>
      <div
        className="text-[9px] font-mono w-12 text-right flex-shrink-0"
        style={{ color: isNeg ? '#f87171' : color }}
      >
        {value.toFixed(3)}
      </div>
    </div>
  )
}

const NEURON_COLORS = ['#2dd4bf','#7c6ff7','#fbbf24','#34d399','#818cf8','#fb923c','#a78bfa','#38bdf8']

export default function FFNStep({ data, isLoading }) {
  const [selected, setSelected] = useState(0)
  const [showGelu, setShowGelu] = useState(true)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    )
  }

  if (!data) return null
  const activations = data.activations || []
  const sel = activations[selected]
  if (!sel) return null

  const displayVals = showGelu ? sel.post_gelu : sel.pre_activation
  const maxVal = Math.max(...displayVals.map(Math.abs), 0.001)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Explanation */}
      <div className="flex items-start gap-3 rounded-xl bg-red-500/5 border border-red-500/15 p-3">
        <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
        <div>
          <div className="text-xs font-medium text-red-400 mb-0.5">Feed-Forward Network (FFN)</div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Applied to each position independently. 
            <span className="text-gray-300 font-mono"> Linear(C→4C) → GELU → Linear(4C→C)</span>.
            The 4× expansion gives the model expressive capacity to process what attention gathered.
          </p>
        </div>
      </div>

      {/* Architecture diagram */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-3">FFN Architecture</div>
        <div className="flex items-center justify-center gap-2 text-center">
          {[
            { label: 'Input',     dim: 'C',  color: 'bg-accent-500/20 border-accent-500/30 text-accent-400' },
            { label: '→',         dim: '',   color: 'text-gray-600 bg-transparent border-transparent text-sm', arrow: true },
            { label: 'Linear',    dim: '4C', color: 'bg-amber-400/20 border-amber-400/30 text-amber-400' },
            { label: '→',         dim: '',   color: 'text-gray-600 bg-transparent border-transparent text-sm', arrow: true },
            { label: 'GELU',      dim: '4C', color: 'bg-red-500/20 border-red-500/30 text-red-400' },
            { label: '→',         dim: '',   color: 'text-gray-600 bg-transparent border-transparent text-sm', arrow: true },
            { label: 'Linear',    dim: 'C',  color: 'bg-teal-500/20 border-teal-500/30 text-teal-400' },
          ].map((item, i) => (
            item.arrow ? (
              <div key={i} className="text-gray-600 text-xs">→</div>
            ) : (
              <div key={i} className={`rounded-lg border px-2 py-1.5 text-center ${item.color}`}>
                <div className="text-[10px] font-medium">{item.label}</div>
                {item.dim && <div className="font-mono text-[9px] opacity-70">{item.dim}</div>}
              </div>
            )
          ))}
        </div>
      </div>

      {/* GELU explanation */}
      <div className="step-panel">
        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">GELU vs ReLU</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-medium text-gray-400 mb-1">ReLU (original Transformer)</div>
            <div className="font-mono text-[11px] text-red-400/80">max(0, x)</div>
            <div className="text-[10px] text-gray-600 mt-1">Hard cutoff. Zero gradient for x&lt;0.</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-400 mb-1">GELU (GPT-2)</div>
            <div className="font-mono text-[11px] text-teal-400/80">x·Φ(x)</div>
            <div className="text-[10px] text-gray-600 mt-1">Soft gate. Small gradient even for x&lt;0.</div>
          </div>
        </div>
        {/* Mini GELU curve */}
        <div className="mt-3 h-12 relative">
          <svg viewBox="0 0 200 48" className="w-full h-full">
            {/* Axes */}
            <line x1="100" y1="0" x2="100" y2="48" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <line x1="0"   y1="32" x2="200" y2="32" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            {/* ReLU */}
            <polyline
              points="0,32 100,32 200,0"
              fill="none" stroke="#f87171" strokeWidth="1.5" opacity="0.7"
            />
            {/* GELU (approximated) */}
            <path
              d="M 0,33 C 20,33 40,34 60,33 80,31 90,28 100,24 120,14 150,4 200,0"
              fill="none" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.9"
            />
            <text x="158" y="10" fontSize="7" fill="#f87171" opacity="0.8">ReLU</text>
            <text x="158" y="20" fontSize="7" fill="#2dd4bf" opacity="0.8">GELU</text>
          </svg>
        </div>
      </div>

      {/* Token selector */}
      <div className="step-panel">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            FFN Activations per Token
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <button
              onClick={() => setShowGelu(false)}
              className={`px-2 py-0.5 rounded border transition-all ${!showGelu ? 'bg-amber-400/15 border-amber-400/30 text-amber-400' : 'border-white/[0.05] text-gray-500'}`}
            >
              pre-GELU
            </button>
            <button
              onClick={() => setShowGelu(true)}
              className={`px-2 py-0.5 rounded border transition-all ${showGelu ? 'bg-teal-500/15 border-teal-500/30 text-teal-400' : 'border-white/[0.05] text-gray-500'}`}
            >
              post-GELU
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {activations.map((a, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`font-mono text-xs px-2 py-1 rounded-lg border transition-all ${
                selected === i
                  ? 'bg-red-500/20 border-red-500/40 text-red-300 scale-105'
                  : 'bg-surface-800/40 border-white/[0.04] text-gray-400 hover:text-gray-200'
              }`}
            >
              {a.token.replace(/ /g, '·')}
            </button>
          ))}
        </div>

        {/* Neuron bars */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-gray-600 mb-2">
            {showGelu ? 'Post-GELU' : 'Pre-activation'} — 4C expanded neurons ({displayVals.length} shown)
          </div>
          {displayVals.map((v, i) => (
            <NeuronBar
              key={i}
              value={v}
              maxVal={maxVal}
              label={`n${i}`}
              color={NEURON_COLORS[i % NEURON_COLORS.length]}
            />
          ))}
        </div>

        {/* Output */}
        <div className="mt-4 pt-3 border-t border-white/[0.05]">
          <div className="text-[10px] text-gray-600 mb-2">FFN Output (contracted back to C)</div>
          <div className="flex gap-1.5">
            {(sel.output || []).map((v, i) => (
              <div key={i} className="flex-1 text-center">
                <div
                  className="h-8 rounded-lg mb-1"
                  style={{
                    backgroundColor: v >= 0
                      ? `rgba(45,212,191,${0.1 + Math.abs(v) * 0.8})`
                      : `rgba(248,113,113,${0.1 + Math.abs(v) * 0.8})`,
                  }}
                />
                <div className="text-[9px] font-mono text-gray-600">{v.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
