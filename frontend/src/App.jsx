import React, { useState, useCallback, useRef } from 'react'
import ChatPanel from './components/chat/ChatPanel.jsx'
import VisualizerPanel from './components/visualizer/VisualizerPanel.jsx'
import TopBar from './components/layout/TopBar.jsx'

export default function App() {
  const [mode, setMode]             = useState('fast')        // 'fast' | 'thinking'
  const [vizData, setVizData]       = useState(null)
  const [isVizLoading, setVizLoading] = useState(false)
  const [activeStep, setActiveStep] = useState('tokenize')
  const [inputText, setInputText]   = useState('')

  // Called by ChatPanel when user sends a message
  const handleQuery = useCallback(async (text) => {
    setInputText(text)
    setActiveStep('tokenize')
    setVizLoading(true)
    try {
      const r = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode }),
      })
      const data = await r.json()
      setVizData(data)
    } catch (e) {
      console.error('Visualize error:', e)
    } finally {
      setVizLoading(false)
    }
  }, [mode])

  return (
    <div className="flex flex-col h-screen bg-surface-950 overflow-hidden">
      <TopBar mode={mode} onModeChange={setMode} />

      {/* Split screen */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT — Chat */}
        <div className="flex flex-col w-1/2 border-r border-white/[0.06] overflow-hidden">
          <ChatPanel
            mode={mode}
            onQuery={handleQuery}
          />
        </div>

        {/* RIGHT — Visualizer */}
        <div className="flex flex-col w-1/2 overflow-hidden">
          <VisualizerPanel
            data={vizData}
            isLoading={isVizLoading}
            activeStep={activeStep}
            onStepChange={setActiveStep}
            inputText={inputText}
            mode={mode}
          />
        </div>
      </div>
    </div>
  )
}
