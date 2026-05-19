import React, { useState, useEffect } from 'react'
import { Cpu, Hash, BarChart2, Grid, Layers, TrendingUp, ChevronRight } from 'lucide-react'
import TokenizeStep from './steps/TokenizeStep.jsx'
import EmbedStep from './steps/EmbedStep.jsx'
import AttentionStep from './steps/AttentionStep.jsx'
import FFNStep from './steps/FFNStep.jsx'
import OutputStep from './steps/OutputStep.jsx'
import EmptyState from './EmptyState.jsx'

const STEPS = [
  { id: 'tokenize', label: 'Tokenize',  icon: Hash,      color: 'text-teal-400',   border: 'border-teal-500/40',   bg: 'bg-teal-500/10'   },
  { id: 'embed',    label: 'Embed',     icon: BarChart2,  color: 'text-accent-400', border: 'border-accent-500/40', bg: 'bg-accent-500/10' },
  { id: 'attention',label: 'Attention', icon: Grid,       color: 'text-amber-400',  border: 'border-amber-400/40',  bg: 'bg-amber-400/10'  },
  { id: 'ffn',      label: 'FFN',       icon: Layers,     color: 'text-coral-400',  border: 'border-coral-400/40',  bg: 'bg-coral-400/10'  },
  { id: 'output',   label: 'Output',    icon: TrendingUp, color: 'text-green-400',  border: 'border-green-500/40',  bg: 'bg-green-500/10'  },
]

function StepTab({ step, active, done, onClick }) {
  const Icon = step.icon
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-all duration-200 flex-1 min-w-0 ${
        active
          ? `${step.bg} ${step.border} ${step.color}`
          : done
            ? 'bg-surface-800/40 border-white/[0.04] text-gray-400'
            : 'bg-transparent border-transparent text-gray-600 hover:text-gray-400'
      }`}
    >
      <Icon size={14} className={active ? step.color : ''} />
      <span className="text-[10px] font-medium truncate">{step.label}</span>
      {done && !active && (
        <div className="w-1 h-1 rounded-full bg-teal-400/60" />
      )}
    </button>
  )
}

// Auto-advance through steps as data loads
function useAutoAdvance(data, activeStep, onStepChange) {
  useEffect(() => {
    if (!data) return
    const order = ['tokenize', 'embed', 'attention', 'ffn', 'output']
    const idx = order.indexOf(activeStep)
    if (idx < order.length - 1) {
      const timer = setTimeout(() => onStepChange(order[idx + 1]), 1800)
      return () => clearTimeout(timer)
    }
  }, [data, activeStep])
}

export default function VisualizerPanel({ data, isLoading, activeStep, onStepChange, inputText, mode }) {
  const [completedSteps, setCompletedSteps] = useState(new Set())

  useEffect(() => {
    if (!data) { setCompletedSteps(new Set()); return }
  }, [data])

  useEffect(() => {
    if (data) setCompletedSteps(prev => new Set([...prev, activeStep]))
  }, [activeStep, data])

  useAutoAdvance(data, activeStep, onStepChange)

  const steps = data?.steps || {}

  const renderStep = () => {
    switch (activeStep) {
      case 'tokenize': return <TokenizeStep data={steps.tokenize} isLoading={isLoading} inputText={inputText} />
      case 'embed':    return <EmbedStep    data={steps.embed}    isLoading={isLoading} />
      case 'attention':return <AttentionStep data={steps.attention} isLoading={isLoading} />
      case 'ffn':      return <FFNStep      data={steps.ffn}      isLoading={isLoading} />
      case 'output':   return <OutputStep   data={steps.output}   isLoading={isLoading} modelInfo={data?.model_info} />
      default:         return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-accent-400" />
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Transformer Internals</span>
        </div>
        {data?.model_info && (
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <span>{data.model_info.n_layer}L</span>
            <span>·</span>
            <span>{data.model_info.n_head}H</span>
            <span>·</span>
            <span>{data.model_info.n_embd}d</span>
            <span>·</span>
            <span>{data.model_info.n_tokens} tokens</span>
          </div>
        )}
      </div>

      {/* Step progress bar */}
      {(data || isLoading) && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-white/[0.04] flex-shrink-0">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              <StepTab
                step={step}
                active={activeStep === step.id}
                done={completedSteps.has(step.id) && activeStep !== step.id}
                onClick={() => data && onStepChange(step.id)}
              />
              {i < STEPS.length - 1 && (
                <ChevronRight size={10} className="text-gray-700 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step description */}
      {data && (
        <div className="px-4 py-2 border-b border-white/[0.04] flex-shrink-0">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {steps[activeStep]?.description || ''}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!data && !isLoading ? (
          <EmptyState />
        ) : (
          <div className="animate-fade-in">
            {renderStep()}
          </div>
        )}
      </div>
    </div>
  )
}
