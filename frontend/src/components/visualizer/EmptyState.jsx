import React from 'react'
import { Hash, BarChart2, Grid, Layers, TrendingUp, ArrowLeft } from 'lucide-react'

const PIPELINE = [
  { icon: Hash,       label: 'Tokenize',  desc: 'Text → token IDs via BPE',              color: 'text-teal-400',   bg: 'bg-teal-500/10',   border: 'border-teal-500/20'   },
  { icon: BarChart2,  label: 'Embed',     desc: 'Token IDs → dense vectors',             color: 'text-accent-400', bg: 'bg-accent-500/10', border: 'border-accent-500/20' },
  { icon: Grid,       label: 'Attention', desc: 'Causal multi-head self-attention',       color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20'  },
  { icon: Layers,     label: 'FFN',       desc: 'Feed-forward + GELU activation',         color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
  { icon: TrendingUp, label: 'Output',    desc: 'Softmax → next token distribution',      color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20'  },
]

export default function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8 animate-fade-in">
      {/* Arrow pointing left */}
      <div className="flex items-center gap-2 text-gray-600 mb-8 text-sm">
        <ArrowLeft size={14} />
        <span>Send a message to see the transformer in action</span>
      </div>

      {/* Pipeline diagram */}
      <div className="w-full max-w-xs space-y-2">
        {PIPELINE.map((step, i) => {
          const Icon = step.icon
          return (
            <React.Fragment key={step.label}>
              <div className={`flex items-center gap-3 rounded-xl border ${step.border} ${step.bg} px-4 py-3 transition-all`}>
                <div className={`flex-shrink-0 ${step.color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className={`text-xs font-semibold ${step.color}`}>{step.label}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{step.desc}</div>
                </div>
                <div className="ml-auto text-gray-700 font-mono text-[10px]">
                  Step {i + 1}
                </div>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="flex justify-center">
                  <div className="w-px h-3 bg-white/[0.06]" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      <p className="text-[11px] text-gray-700 mt-8 text-center max-w-xs leading-relaxed">
        Each step of the GPT-2 transformer will be visualized here in real time — from raw bytes to attention heatmaps to probability distributions.
      </p>
    </div>
  )
}
