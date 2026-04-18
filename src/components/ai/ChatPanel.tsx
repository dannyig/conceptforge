import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/hooks/use-theme'
import { FONT_FAMILY, FONT_SIZE_SMALL, TRANSITION_FAST, TRANSITION_NORMAL } from '@/lib/theme'
import { chatNode, voiceChat, type ChatMessage } from '@/lib/claude'
import { speak, stopSpeaking } from '@/lib/tts'
import { getApiKey } from '@/lib/apiKey'
import { getConceptChatPrompt } from '@/lib/chatPrompts'
import { renderMarkdown } from '@/lib/markdown'
import type { VoiceChatConcept, VoiceChatMessage } from '@/types'

const SPEECH_SEND_DEBOUNCE_MS = 1500

type VoiceState = 'listening' | 'thinking' | 'speaking'

type ContentSegment =
  | { type: 'user'; text: string }
  | { type: 'ai'; content: string }
  | { type: 'concepts'; id: string; items: VoiceChatConcept[]; applied: boolean }

interface ChatPanelProps {
  nodeId: string
  nodeLabel: string
  nodeDescription?: string
  focusQuestion?: string
  onDismiss: () => void
  onApplyConcepts?: (concepts: VoiceChatConcept[], originNodeId: string) => void
  aiAssistEnabled?: boolean
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
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: accentColor,
          animation: 'cf-chat-pulse 1.8s ease-in-out infinite',
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
          width: 8,
          height: 8,
          borderRadius: '50%',
          border: `2px solid ${accentColor}`,
          borderTopColor: 'transparent',
          animation: 'cf-chat-spin 0.7s linear infinite',
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
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: '#60a5fa',
        animation: 'cf-chat-pulse 0.9s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  )
}

export function ChatPanel({
  nodeId,
  nodeLabel,
  nodeDescription,
  focusQuestion,
  onDismiss,
  onApplyConcepts,
  aiAssistEnabled = true,
}: ChatPanelProps): React.JSX.Element {
  const { tokens } = useTheme()

  // Content
  const [segments, setSegments] = useState<ContentSegment[]>([])
  const [checkedItems, setCheckedItems] = useState<Record<string, number[]>>({})

  // Text mode
  const [draft, setDraft] = useState('')
  const [isTextLoading, setIsTextLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Voice mode
  const [isVoiceMode, setIsVoiceMode] = useState(false)
  const [voiceState, setVoiceState] = useState<VoiceState | null>(null)
  const [speechSupported, setSpeechSupported] = useState(true)

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<ChatMessage[]>([])
  const isActiveRef = useRef(true)
  const isVoiceModeRef = useRef(false)
  const voiceStateRef = useRef<VoiceState | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isRecognizingRef = useRef(false)
  const pendingTranscriptRef = useRef('')
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable ref for exitVoiceMode — avoids dep issues in recognition setup
  const exitVoiceModeRef = useRef<() => void>(() => {})

  // Auto-scroll on new segments
  useEffect((): void => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [segments])

  const exitVoiceMode = useCallback((): void => {
    isVoiceModeRef.current = false
    setIsVoiceMode(false)
    voiceStateRef.current = null
    setVoiceState(null)
    if (sendTimerRef.current) {
      clearTimeout(sendTimerRef.current)
      sendTimerRef.current = null
    }
    pendingTranscriptRef.current = ''
    stopSpeaking()
    const rec = recognitionRef.current
    if (rec && isRecognizingRef.current) {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
    }
  }, [])

  useEffect((): void => {
    exitVoiceModeRef.current = exitVoiceMode
  }, [exitVoiceMode])

  const enterVoiceMode = useCallback((): void => {
    isVoiceModeRef.current = true
    setIsVoiceMode(true)
    voiceStateRef.current = 'listening'
    setVoiceState('listening')
    const rec = recognitionRef.current
    if (rec && !isRecognizingRef.current) {
      try {
        rec.start()
      } catch {
        /* ignore */
      }
    }
  }, [])

  // Stable ref for voice input handler — always points to latest without re-binding recognition
  const handleVoiceInputRef = useRef<(transcript: string) => Promise<void>>(async () => {})

  useEffect((): void => {
    handleVoiceInputRef.current = async (transcript: string): Promise<void> => {
      const apiKey = getApiKey()
      if (!apiKey || !isActiveRef.current) {
        if (isVoiceModeRef.current) {
          voiceStateRef.current = 'listening'
          setVoiceState('listening')
        }
        return
      }

      setSegments(prev => [...prev, { type: 'user', text: transcript }])

      try {
        const response = await voiceChat(
          nodeLabel,
          nodeDescription,
          focusQuestion,
          historyRef.current as VoiceChatMessage[],
          transcript,
          apiKey
        )

        if (!isActiveRef.current) return

        historyRef.current = [
          ...historyRef.current,
          { role: 'user', content: transcript },
          { role: 'assistant', content: response.speech },
        ]

        const pendingVisual = response.visual
        const pendingConcepts = response.concepts?.length ? response.concepts : undefined
        const pendingSegId = `concepts-${Date.now()}`

        await speak(response.speech, (): void => {
          if (!isActiveRef.current) return
          voiceStateRef.current = 'speaking'
          setVoiceState('speaking')
          if (pendingVisual) {
            setSegments(prev => [...prev, { type: 'ai', content: pendingVisual }])
          }
          if (pendingConcepts) {
            setSegments(prev => [
              ...prev,
              { type: 'concepts', id: pendingSegId, items: pendingConcepts, applied: false },
            ])
          }
        })

        if (!isActiveRef.current) return
        if (isVoiceModeRef.current) {
          voiceStateRef.current = 'listening'
          setVoiceState('listening')
          const rec = recognitionRef.current
          if (rec && !isRecognizingRef.current) {
            try {
              rec.start()
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        if (isActiveRef.current && isVoiceModeRef.current) {
          voiceStateRef.current = 'listening'
          setVoiceState('listening')
        }
      }
    }
  }, [nodeLabel, nodeDescription, focusQuestion])

  // Initialize SpeechRecognition once on mount — start/stop driven by voice mode toggle
  useEffect((): (() => void) => {
    const SpeechRecCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecCtor) {
      setSpeechSupported(false)
      return (): void => {}
    }

    const rec = new SpeechRecCtor()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'

    rec.onstart = (): void => {
      isRecognizingRef.current = true
    }

    rec.onend = (): void => {
      isRecognizingRef.current = false
      if (isVoiceModeRef.current && voiceStateRef.current === 'listening' && isActiveRef.current) {
        try {
          rec.start()
        } catch {
          /* ignore */
        }
      }
    }

    rec.onerror = (event: SpeechRecognitionErrorEvent): void => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setSpeechSupported(false)
        exitVoiceModeRef.current()
      }
      isRecognizingRef.current = false
    }

    rec.onresult = (event: SpeechRecognitionEvent): void => {
      if (!isVoiceModeRef.current) return
      if (voiceStateRef.current === 'thinking' || voiceStateRef.current === 'speaking') return

      const parts: string[] = []
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) parts.push(result[0].transcript)
      }
      const newText = parts.join(' ').trim()
      if (!newText) return

      stopSpeaking()
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

    recognitionRef.current = rec

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
        /* ignore */
      }
      stopSpeaking()
    }
  }, [])

  // Clear state when nodeId changes (A-30)
  useEffect((): void => {
    setSegments([])
    setDraft('')
    setError(null)
    historyRef.current = []
    if (isVoiceModeRef.current) exitVoiceModeRef.current()
  }, [nodeId])

  // Escape to dismiss
  useEffect((): (() => void) => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', handler)
    return (): void => window.removeEventListener('keydown', handler)
  }, [onDismiss])

  const handleSubmit = useCallback(async (): Promise<void> => {
    const text = draft.trim()
    if (!text || isTextLoading) return

    const apiKey = getApiKey()
    if (!apiKey) return

    // Exit voice mode if active (VC-01)
    if (isVoiceModeRef.current) exitVoiceMode()

    setDraft('')
    setError(null)
    setIsTextLoading(true)
    setSegments(prev => [...prev, { type: 'user', text }])

    const priorHistory = [...historyRef.current]

    try {
      const response = await chatNode(
        nodeLabel,
        nodeDescription,
        focusQuestion,
        priorHistory,
        text,
        apiKey,
        getConceptChatPrompt()
      )

      historyRef.current = [
        ...priorHistory,
        { role: 'user', content: text },
        { role: 'assistant', content: response },
      ]
      setSegments(prev => [...prev, { type: 'ai', content: response }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed')
    } finally {
      setIsTextLoading(false)
    }
  }, [draft, isTextLoading, nodeLabel, nodeDescription, focusQuestion, exitVoiceMode])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleMicClick = useCallback((): void => {
    if (!speechSupported) return
    if (isVoiceMode) {
      exitVoiceMode()
    } else {
      enterVoiceMode()
    }
  }, [speechSupported, isVoiceMode, exitVoiceMode, enterVoiceMode])

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
      setVisualSegmentsApplied(segId)
    },
    [checkedItems, nodeId, onApplyConcepts]
  )

  const setVisualSegmentsApplied = useCallback((segId: string): void => {
    setSegments(prev =>
      prev.map(s => (s.type === 'concepts' && s.id === segId ? { ...s, applied: true } : s))
    )
  }, [])

  const micDisabled = !aiAssistEnabled || !speechSupported
  const micTitle = !aiAssistEnabled
    ? 'AI Assist is off'
    : !speechSupported
      ? 'Voice input is not supported in this browser'
      : isVoiceMode
        ? 'Exit voice mode'
        : 'Enter voice mode'

  const voiceStatusLabel =
    voiceState === 'listening'
      ? 'Listening…'
      : voiceState === 'thinking'
        ? 'Thinking…'
        : 'Speaking…'

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

  const renderSegment = (seg: ContentSegment, i: number): React.ReactNode => {
    if (seg.type === 'user') {
      return (
        <div
          key={i}
          style={{
            alignSelf: 'flex-end',
            maxWidth: '88%',
            backgroundColor: 'rgba(249,115,22,0.12)',
            border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: 6,
            padding: '6px 10px',
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            color: tokens.COLOR_NODE_TEXT,
            lineHeight: '1.55',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {seg.text}
        </div>
      )
    }

    if (seg.type === 'ai') {
      return (
        <div
          key={i}
          style={{
            alignSelf: 'flex-start',
            maxWidth: '92%',
            backgroundColor: tokens.COLOR_CODE_BG,
            border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
            borderRadius: 6,
            padding: '8px 12px',
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            color: tokens.COLOR_NODE_TEXT,
            lineHeight: '1.6',
            wordBreak: 'break-word',
          }}
        >
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
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            color: '#34d399',
            padding: '4px 0',
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
      <div
        key={i}
        style={{
          alignSelf: 'flex-start',
          width: '100%',
          backgroundColor: tokens.COLOR_CODE_BG,
          border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
          borderRadius: 6,
          padding: '10px 12px',
        }}
      >
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
              style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}
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
      aria-label={`Chat — ${nodeLabel}`}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.72)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e): void => {
        if (e.target === e.currentTarget) onDismiss()
      }}
    >
      <style>{`
        @keyframes cf-chat-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.2); }
        }
        @keyframes cf-chat-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .cf-chat-dismiss:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-chat-dismiss:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
        .cf-chat-send:hover:not(:disabled) { background-color: ${tokens.COLOR_BUTTON_PRIMARY_HOVER_BG} !important; }
        .cf-chat-send:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
        .cf-chat-mic:hover:not(:disabled) { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-chat-mic:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
      `}</style>

      <div
        style={{
          width: '70vw',
          maxWidth: 860,
          height: '70vh',
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
            title={`Chat — ${nodeLabel}`}
          >
            Chat — {nodeLabel}
          </span>
          <button
            className="cf-chat-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss chat panel"
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
            Dismiss
          </button>
        </div>

        {/* Accumulating content area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {segments.length === 0 && !isTextLoading && (
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
              Ask anything about &ldquo;{nodeLabel}&rdquo; — type below or click the mic to speak.
            </p>
          )}

          {segments.map((seg, i) => renderSegment(seg, i))}

          {isTextLoading && (
            <div
              aria-live="polite"
              style={{
                alignSelf: 'flex-start',
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_TEXT_MUTED,
                fontStyle: 'italic',
              }}
            >
              Thinking…
            </div>
          )}

          {error !== null && (
            <div
              role="alert"
              style={{
                alignSelf: 'flex-start',
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_STATUS_ERROR,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Voice state indicator — shown above input when voice mode active */}
        {voiceState !== null && (
          <div
            style={{
              flexShrink: 0,
              padding: '6px 20px',
              borderTop: `1px solid ${tokens.COLOR_NODE_BORDER}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
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
              {voiceStatusLabel}
            </span>
          </div>
        )}

        {/* Bottom bar: textarea + mic + send */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 16px',
            borderTop: `1px solid ${tokens.COLOR_SUMMARY_BORDER}`,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <textarea
            value={draft}
            onChange={(e): void => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isVoiceMode ? 'Type to exit voice mode and send…' : 'Ask about this concept…'
            }
            rows={2}
            disabled={isTextLoading}
            aria-label="Chat input"
            style={{
              flex: 1,
              background: tokens.COLOR_INPUT_BG,
              border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
              borderRadius: 4,
              color: tokens.COLOR_NODE_TEXT,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              padding: '6px 8px',
              resize: 'none',
              outline: 'none',
              transition: `border-color ${TRANSITION_FAST}`,
            }}
            onFocus={(e): void => {
              e.currentTarget.style.borderColor = tokens.COLOR_INPUT_FOCUS_BORDER
            }}
            onBlur={(e): void => {
              e.currentTarget.style.borderColor = tokens.COLOR_INPUT_BORDER
            }}
          />

          {/* Mic button — VC-01 */}
          <button
            className="cf-chat-mic"
            onClick={handleMicClick}
            disabled={micDisabled}
            aria-label={micTitle}
            title={micTitle}
            style={{
              flexShrink: 0,
              padding: '6px 8px',
              background: isVoiceMode ? `${tokens.COLOR_NODE_SELECTED}22` : 'transparent',
              border: `1px solid ${isVoiceMode ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_NODE_BORDER}`,
              borderRadius: 4,
              cursor: micDisabled ? 'not-allowed' : 'pointer',
              opacity: micDisabled ? 0.35 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `background-color ${TRANSITION_FAST}, border-color ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
              alignSelf: 'flex-end',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="9"
                y="2"
                width="6"
                height="12"
                rx="3"
                stroke={isVoiceMode ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_TEXT_MUTED}
                strokeWidth="2"
              />
              <path
                d="M5 11a7 7 0 0 0 14 0"
                stroke={isVoiceMode ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_TEXT_MUTED}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="18"
                x2="12"
                y2="22"
                stroke={isVoiceMode ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_TEXT_MUTED}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="9"
                y1="22"
                x2="15"
                y2="22"
                stroke={isVoiceMode ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_TEXT_MUTED}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            className="cf-chat-send"
            onClick={(): void => {
              void handleSubmit()
            }}
            disabled={!draft.trim() || isTextLoading}
            aria-label="Send message"
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              background: tokens.COLOR_NODE_SELECTED,
              border: 'none',
              borderRadius: 4,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              fontWeight: 600,
              color: tokens.COLOR_BUTTON_PRIMARY_TEXT,
              cursor: !draft.trim() || isTextLoading ? 'not-allowed' : 'pointer',
              opacity: !draft.trim() || isTextLoading ? 0.4 : 1,
              transition: `background-color ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
              alignSelf: 'flex-end',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
