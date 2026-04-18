import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/hooks/use-theme'
import { FONT_FAMILY, FONT_SIZE_SMALL, TRANSITION_FAST, TRANSITION_NORMAL } from '@/lib/theme'
import { voiceChat } from '@/lib/claude'
import { speak, stopSpeaking } from '@/lib/tts'
import { getApiKey } from '@/lib/apiKey'
import { renderMarkdown } from '@/lib/markdown'
import type { VoiceChatConcept, VoiceChatMessage } from '@/types'

// How long of silence (ms) after the last speech segment before sending to AI.
// Prevents mid-sentence pauses from prematurely triggering a new turn.
const SPEECH_SEND_DEBOUNCE_MS = 1500

type VoiceState = 'listening' | 'thinking' | 'speaking' | 'unsupported'

type VisualSegment =
  | { type: 'text'; content: string }
  | { type: 'concepts'; id: string; items: VoiceChatConcept[]; applied: boolean }

interface VoiceChatPanelProps {
  nodeId: string
  nodeLabel: string
  nodeDescription?: string
  focusQuestion?: string
  onClose: () => void
  onApplyConcepts?: (concepts: VoiceChatConcept[], originNodeId: string) => void
}

function StateIndicator({
  state,
  accentColor,
}: {
  state: VoiceState
  accentColor: string
}): React.JSX.Element {
  if (state === 'listening') {
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: accentColor,
          animation: 'cf-voice-pulse 1.8s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
    )
  }
  if (state === 'thinking') {
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          border: `2px solid ${accentColor}`,
          borderTopColor: 'transparent',
          animation: 'cf-voice-spin 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
    )
  }
  if (state === 'speaking') {
    return (
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: '#60a5fa',
          animation: 'cf-voice-pulse 0.9s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        backgroundColor: '#f85149',
        flexShrink: 0,
      }}
    />
  )
}

export function VoiceChatPanel({
  nodeId,
  nodeLabel,
  nodeDescription,
  focusQuestion,
  onClose,
  onApplyConcepts,
}: VoiceChatPanelProps): React.JSX.Element {
  const { tokens } = useTheme()
  const [voiceState, setVoiceState] = useState<VoiceState>('listening')
  const [visualSegments, setVisualSegments] = useState<VisualSegment[]>([])
  // checkedItems: map from segment id → set of checked item indices
  const [checkedItems, setCheckedItems] = useState<Record<string, number[]>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const voiceStateRef = useRef<VoiceState>('listening')
  const historyRef = useRef<VoiceChatMessage[]>([])
  const isActiveRef = useRef(true)
  const isRecognizingRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const pendingTranscriptRef = useRef<string>('')
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateState = useCallback((s: VoiceState): void => {
    voiceStateRef.current = s
    setVoiceState(s)
  }, [])

  useEffect((): void => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visualSegments])

  const startRecognition = useCallback((): void => {
    const rec = recognitionRef.current
    if (!rec || !isActiveRef.current || isRecognizingRef.current) return
    try {
      rec.start()
    } catch {
      // Already started or unavailable — ignore
    }
  }, [])

  // Stable callback ref — always points to latest handleVoiceInput without re-binding recognition
  const handleVoiceInputRef = useRef<(transcript: string) => Promise<void>>(async () => {})

  useEffect((): void => {
    handleVoiceInputRef.current = async (transcript: string): Promise<void> => {
      const apiKey = getApiKey()
      if (!apiKey) {
        updateState('listening')
        startRecognition()
        return
      }

      try {
        const response = await voiceChat(
          nodeLabel,
          nodeDescription,
          focusQuestion,
          historyRef.current,
          transcript,
          apiKey
        )

        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: transcript },
          { role: 'assistant', content: response.speech },
        ]

        if (response.visual) {
          setVisualSegments(prev => [...prev, { type: 'text', content: response.visual! }])
        }

        if (response.concepts && response.concepts.length > 0) {
          const segId = `concepts-${Date.now()}`
          setVisualSegments(prev => [
            ...prev,
            { type: 'concepts', id: segId, items: response.concepts!, applied: false },
          ])
        }

        if (!isActiveRef.current) return

        await speak(response.speech, (): void => {
          if (isActiveRef.current) updateState('speaking')
        })

        if (!isActiveRef.current) return
        updateState('listening')
        startRecognition()
      } catch {
        if (isActiveRef.current) {
          updateState('listening')
          startRecognition()
        }
      }
    }
  }, [nodeLabel, nodeDescription, focusQuestion, updateState, startRecognition])

  useEffect((): (() => void) => {
    const SpeechRecCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecCtor) {
      updateState('unsupported')
      return (): void => {}
    }

    const rec = new SpeechRecCtor()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onstart = (): void => {
      isRecognizingRef.current = true
    }

    rec.onresult = (event: SpeechRecognitionEvent): void => {
      // Ignore STT results while AI is responding or speaking — prevents TTS audio
      // feeding back into the mic and being sent to the LLM as user input
      if (voiceStateRef.current === 'thinking' || voiceStateRef.current === 'speaking') return

      const parts: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          parts.push(result[0].transcript)
        }
      }
      const newText = parts.join(' ').trim()
      if (!newText) return

      // Interrupt TTS immediately when user speaks
      stopSpeaking()

      // Accumulate — debounce the AI call so natural mid-sentence pauses
      // don't prematurely end the turn
      pendingTranscriptRef.current = (pendingTranscriptRef.current + ' ' + newText).trim()

      if (sendTimerRef.current) clearTimeout(sendTimerRef.current)
      sendTimerRef.current = setTimeout((): void => {
        sendTimerRef.current = null
        const transcript = pendingTranscriptRef.current.trim()
        pendingTranscriptRef.current = ''
        if (!transcript || voiceStateRef.current === 'thinking') return

        voiceStateRef.current = 'thinking'
        setVoiceState('thinking')
        void handleVoiceInputRef.current(transcript)
      }, SPEECH_SEND_DEBOUNCE_MS)
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent): void => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        updateState('unsupported')
      }
      isRecognizingRef.current = false
    }

    rec.onend = (): void => {
      isRecognizingRef.current = false
      // Auto-restart only when in listening state — thinking/speaking will restart explicitly
      if (voiceStateRef.current === 'listening' && isActiveRef.current) {
        try {
          rec.start()
        } catch {
          // Ignore double-start errors
        }
      }
    }

    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      updateState('unsupported')
    }

    return (): void => {
      isActiveRef.current = false
      if (sendTimerRef.current) {
        clearTimeout(sendTimerRef.current)
        sendTimerRef.current = null
      }
      pendingTranscriptRef.current = ''
      try {
        rec.stop()
      } catch {
        // Ignore errors on cleanup
      }
      stopSpeaking()
    }
  }, [updateState])

  useEffect((): (() => void) => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return (): void => window.removeEventListener('keydown', handler)
  }, [onClose])

  const toggleCheck = useCallback((segId: string, idx: number): void => {
    setCheckedItems(prev => {
      const current = prev[segId] ?? []
      const next = current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx]
      return { ...prev, [segId]: next }
    })
  }, [])

  const handleApplySegment = useCallback(
    (segId: string, items: VoiceChatConcept[]): void => {
      const checked = checkedItems[segId] ?? []
      if (checked.length === 0 || !onApplyConcepts) return
      const selected = items.filter((_, i) => checked.includes(i))
      onApplyConcepts(selected, nodeId)
      setVisualSegments(prev =>
        prev.map(s => (s.type === 'concepts' && s.id === segId ? { ...s, applied: true } : s))
      )
    },
    [checkedItems, nodeId, onApplyConcepts]
  )

  const statusLabel =
    voiceState === 'listening'
      ? 'Listening…'
      : voiceState === 'thinking'
        ? 'Thinking…'
        : voiceState === 'speaking'
          ? 'Speaking…'
          : 'Voice input not available in this browser'

  const relationshipTagStyle: React.CSSProperties = {
    display: 'inline-block',
    fontFamily: FONT_FAMILY,
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: tokens.COLOR_TEXT_MUTED,
    border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
    borderRadius: 3,
    padding: '1px 5px',
    marginLeft: 8,
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  }

  const renderSegment = (seg: VisualSegment, i: number): React.ReactNode => {
    const isLast = i === visualSegments.length - 1
    const dividerStyle: React.CSSProperties = {
      marginBottom: isLast ? 0 : 20,
      paddingBottom: isLast ? 0 : 20,
      borderBottom: isLast ? 'none' : `1px solid ${tokens.COLOR_NODE_BORDER}`,
    }

    if (seg.type === 'text') {
      return (
        <div key={i} style={dividerStyle}>
          {renderMarkdown(seg.content, tokens)}
        </div>
      )
    }

    // Concept checklist segment
    const checked = checkedItems[seg.id] ?? []
    const hasChecked = checked.length > 0
    const applyAvailable = !!onApplyConcepts

    if (seg.applied) {
      return (
        <div
          key={i}
          style={{
            ...dividerStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            color: '#34d399',
          }}
        >
          <span>✓</span>
          <span>
            {checked.length > 0 ? checked.length : seg.items.length} concept
            {(checked.length > 0 ? checked.length : seg.items.length) !== 1 ? 's' : ''} added to map
          </span>
        </div>
      )
    }

    return (
      <div key={i} style={dividerStyle}>
        <div
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            color: tokens.COLOR_TEXT_MUTED,
            marginBottom: 10,
          }}
        >
          Suggested Concepts
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {seg.items.map((concept, idx) => (
            <label
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checked.includes(idx)}
                onChange={(): void => toggleCheck(seg.id, idx)}
                style={{ marginTop: 2, flexShrink: 0, accentColor: tokens.COLOR_NODE_SELECTED }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZE_SMALL,
                      fontWeight: 600,
                      color: tokens.COLOR_NODE_TEXT,
                    }}
                  >
                    {concept.label}
                  </span>
                  <span style={relationshipTagStyle}>{concept.relationship}</span>
                </div>
                <p
                  style={{
                    margin: '3px 0 0',
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZE_SMALL,
                    color: tokens.COLOR_TEXT_MUTED,
                    lineHeight: 1.6,
                  }}
                >
                  {concept.description}
                </p>
              </div>
            </label>
          ))}
        </div>
        {applyAvailable && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={(): void => handleApplySegment(seg.id, seg.items)}
              disabled={!hasChecked}
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 14px',
                borderRadius: 4,
                border: `1px solid ${hasChecked ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_NODE_BORDER}`,
                background: hasChecked ? tokens.COLOR_NODE_SELECTED : 'transparent',
                color: hasChecked ? '#fff' : tokens.COLOR_TEXT_MUTED,
                cursor: hasChecked ? 'pointer' : 'default',
                opacity: hasChecked ? 1 : 0.4,
                transition: `all ${TRANSITION_FAST}`,
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>
    )
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Voice chat — ${nodeLabel}`}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        @keyframes cf-voice-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.2); }
        }
        @keyframes cf-voice-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .cf-voice-close:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-voice-close:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
      `}</style>

      <div
        style={{
          width: '60vw',
          maxWidth: 760,
          height: '72vh',
          backgroundColor: tokens.COLOR_PANEL_BG,
          border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '14px 20px 12px',
            borderBottom: `1px solid ${tokens.COLOR_NODE_BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '10px',
              fontWeight: '600',
              color: tokens.COLOR_TEXT_MUTED,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
            title={`Voice Chat — ${nodeLabel}`}
          >
            Voice Chat — {nodeLabel}
          </span>
          <button
            className="cf-voice-close"
            onClick={onClose}
            aria-label="Close voice chat"
            style={{
              flexShrink: 0,
              padding: '2px 8px',
              background: 'transparent',
              border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
              borderRadius: 4,
              fontFamily: FONT_FAMILY,
              fontSize: '10px',
              color: tokens.COLOR_TEXT_MUTED,
              cursor: 'pointer',
              transition: `background-color ${TRANSITION_FAST}`,
              marginLeft: 12,
            }}
          >
            Close
          </button>
        </div>

        {/* Visual content area — accumulated AI-provided markdown and concept checklists */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 24px',
          }}
        >
          {visualSegments.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_TEXT_MUTED,
                fontStyle: 'italic',
                lineHeight: 1.7,
              }}
            >
              Supporting information will appear here as the conversation develops.
              <br />
              Start speaking to begin.
            </p>
          ) : (
            visualSegments.map((seg, i) => renderSegment(seg, i))
          )}
        </div>

        {/* Status bar */}
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid ${tokens.COLOR_NODE_BORDER}`,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <StateIndicator state={voiceState} accentColor={tokens.COLOR_NODE_SELECTED} />
          <span
            aria-live="polite"
            aria-atomic="true"
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: tokens.COLOR_TEXT_MUTED,
              transition: `color ${TRANSITION_NORMAL}`,
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}
