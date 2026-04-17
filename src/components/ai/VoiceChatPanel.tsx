import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/hooks/use-theme'
import { FONT_FAMILY, FONT_SIZE_SMALL, TRANSITION_FAST, TRANSITION_NORMAL } from '@/lib/theme'
import { voiceChat } from '@/lib/claude'
import { speak, stopSpeaking } from '@/lib/tts'
import { getApiKey } from '@/lib/apiKey'
import { renderMarkdown } from '@/lib/markdown'
import type { VoiceChatMessage } from '@/types'

type VoiceState = 'listening' | 'thinking' | 'speaking' | 'unsupported'

interface VoiceChatPanelProps {
  nodeLabel: string
  nodeDescription?: string
  focusQuestion?: string
  onClose: () => void
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
  nodeLabel,
  nodeDescription,
  focusQuestion,
  onClose,
}: VoiceChatPanelProps): React.JSX.Element {
  const { tokens } = useTheme()
  const [voiceState, setVoiceState] = useState<VoiceState>('listening')
  const [visualSegments, setVisualSegments] = useState<string[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const voiceStateRef = useRef<VoiceState>('listening')
  const historyRef = useRef<VoiceChatMessage[]>([])
  const isActiveRef = useRef(true)
  const isRecognizingRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

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
          setVisualSegments(prev => [...prev, response.visual!])
        }

        if (!isActiveRef.current) return

        updateState('speaking')
        await speak(response.speech)

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
      if (voiceStateRef.current === 'thinking') return

      const parts: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          parts.push(result[0].transcript)
        }
      }
      const transcript = parts.join(' ').trim()

      if (!transcript) return

      stopSpeaking()
      isRecognizingRef.current = false
      voiceStateRef.current = 'thinking'
      setVoiceState('thinking')
      void handleVoiceInputRef.current(transcript)
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

  const statusLabel =
    voiceState === 'listening'
      ? 'Listening…'
      : voiceState === 'thinking'
        ? 'Thinking…'
        : voiceState === 'speaking'
          ? 'Speaking…'
          : 'Voice input not available in this browser'

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

        {/* Visual content area — accumulated AI-provided markdown */}
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
            visualSegments.map((seg, i) => (
              <div
                key={i}
                style={{
                  marginBottom: i < visualSegments.length - 1 ? 20 : 0,
                  paddingBottom: i < visualSegments.length - 1 ? 20 : 0,
                  borderBottom:
                    i < visualSegments.length - 1
                      ? `1px solid ${tokens.COLOR_NODE_BORDER}`
                      : 'none',
                }}
              >
                {renderMarkdown(seg, tokens)}
              </div>
            ))
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
