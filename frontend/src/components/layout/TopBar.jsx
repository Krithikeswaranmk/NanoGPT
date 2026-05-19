import React from 'react'
import { Zap, Brain, Github, BookOpen } from 'lucide-react'

export default function TopBar({ mode, onModeChange }) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-surface-900/80 backdrop-blur-sm flex-shrink-0 z-10">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-accent-500/20 border border-accent-500/30 flex items-center justify-center">
          <span className="text-accent-400 font-bold text-sm">G</span>
        </div>
        <div>
          <span className="font-semibold text-white text-sm">NanoGPT</span>
          <span className="text-gray-500 text-sm ml-1.5">Visualizer</span>
        </div>
        <span className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-medium">
          GPT-2 from scratch
        </span>
      </div>

      {/* Mode switcher */}
      <div className="flex items-center gap-2 bg-surface-850 rounded-xl p-1 border border-white/[0.05]">
        <button
          onClick={() => onModeChange('fast')}
          className={`mode-btn text-xs py-1.5 px-3 ${mode === 'fast' ? 'active' : ''}`}
        >
          <Zap size={13} />
          Fast
        </button>
        <button
          onClick={() => onModeChange('thinking')}
          className={`mode-btn text-xs py-1.5 px-3 ${mode === 'thinking' ? 'active' : ''}`}
        >
          <Brain size={13} />
          Thinking
        </button>
      </div>

      {/* Right links */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
          <div className={`w-1.5 h-1.5 rounded-full ${mode === 'thinking' ? 'bg-amber-400' : 'bg-teal-400'} animate-pulse-slow`} />
          {mode === 'thinking' ? 'llama-3.3-70b' : 'llama-3.1-8b'}
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="View on GitHub"
        >
          <Github size={16} />
        </a>
      </div>
    </header>
  )
}
