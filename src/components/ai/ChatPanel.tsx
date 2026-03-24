import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  COLOR_INPUT_BG,
  COLOR_INPUT_BORDER,
  COLOR_INPUT_FOCUS_BORDER,
  COLOR_NODE_BORDER,
  COLOR_NODE_SELECTED,
  COLOR_NODE_TEXT,
  COLOR_STATUS_ERROR,
  COLOR_SUMMARY_BG,
  COLOR_SUMMARY_BORDER,
  COLOR_SUMMARY_LINK,
  COLOR_TEXT_MUTED,
  FONT_FAMILY,
  FONT_SIZE_SMALL,
  SUMMARY_PANEL_BOTTOM,
  SUMMARY_PANEL_WIDTH,
  TRANSITION_FAST,
} from '@/lib/theme'
import { chatNode, type ChatMessage } from '@/lib/claude'
import { getApiKey } from '@/lib/apiKey'

const MINIMAP_GAP = 8

function usePanelBottom(): number {
  const [bottom, setBottom] = useState(SUMMARY_PANEL_BOTTOM)

  useEffect(() => {
    const measure = (): void => {
      const minimap = document.querySelector('.react-flow__minimap')
      const canvas = minimap?.closest('.react-flow') as HTMLElement | null
      if (!minimap || !canvas) return
      const minimapRect = minimap.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()
      setBottom(canvasRect.bottom - minimapRect.top + MINIMAP_GAP)
    }

    measure()
    window.addEventListener('resize', measure)
    return (): void => window.removeEventListener('resize', measure)
  }, [])

  return bottom
}

interface ChatPanelProps {
  nodeId: string
  nodeLabel: string
  nodeDescription?: string
  focusQuestion?: string
  onDismiss: () => void
}

export function ChatPanel({
  nodeId,
  nodeLabel,
  nodeDescription,
  focusQuestion,
  onDismiss,
}: ChatPanelProps): React.JSX.Element {
  const panelBottom = usePanelBottom()
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Stable ref so handleSubmit never closes over stale history
  const historyRef = useRef(history)
  useEffect((): void => {
    historyRef.current = history
  }, [history])

  // A-30: clear history when nodeId changes
  useEffect(() => {
    setHistory([])
    setDraft('')
    setError(null)
  }, [nodeId])

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, isLoading])

  const handleSubmit = useCallback(async (): Promise<void> => {
    const text = draft.trim()
    if (!text || isLoading) return

    const apiKey = getApiKey()
    if (!apiKey) return

    setHistory(prev => [...prev, { role: 'user', content: text }])
    setDraft('')
    setError(null)
    setIsLoading(true)

    try {
      const response = await chatNode(
        nodeLabel,
        nodeDescription,
        focusQuestion,
        historyRef.current,
        text,
        apiKey
      )
      setHistory(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat failed')
    } finally {
      setIsLoading(false)
    }
  }, [draft, isLoading, nodeLabel, nodeDescription, focusQuestion])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void handleSubmit()
      }
    },
    [handleSubmit]
  )

  const aiDisabled = !draft.trim() || isLoading

  return (
    <div
      aria-label="AI Node Chat"
      role="complementary"
      style={{
        position: 'absolute',
        top: 64,
        right: 8,
        bottom: panelBottom,
        width: SUMMARY_PANEL_WIDTH,
        backgroundColor: COLOR_SUMMARY_BG,
        border: `1px solid ${COLOR_SUMMARY_BORDER}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}
    >
      <style>{`
        .cf-chat-dismiss:hover { background-color: #21262d !important; }
        .cf-chat-dismiss:focus-visible { outline: 2px solid ${COLOR_SUMMARY_LINK}; outline-offset: 2px; }
        .cf-chat-send:hover:not(:disabled) { background-color: #ea6c0a !important; }
        .cf-chat-send:focus-visible { outline: 2px solid ${COLOR_SUMMARY_LINK}; outline-offset: 2px; }
      `}</style>

      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '14px 16px 10px',
          borderBottom: `1px solid ${COLOR_SUMMARY_BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: '10px',
            fontWeight: '600',
            color: COLOR_TEXT_MUTED,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
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
            padding: '2px 8px',
            background: 'transparent',
            border: `1px solid ${COLOR_NODE_BORDER}`,
            borderRadius: 4,
            fontFamily: FONT_FAMILY,
            fontSize: '10px',
            color: COLOR_TEXT_MUTED,
            cursor: 'pointer',
            transition: `background-color ${TRANSITION_FAST}`,
            flexShrink: 0,
          }}
        >
          Dismiss
        </button>
      </div>

      {/* Scrollable message history — A-29 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {history.length === 0 && !isLoading && (
          <p
            style={{
              margin: 0,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: COLOR_TEXT_MUTED,
              fontStyle: 'italic',
            }}
          >
            Ask anything about &ldquo;{nodeLabel}&rdquo;
          </p>
        )}

        {history.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
              backgroundColor: msg.role === 'user' ? 'rgba(249,115,22,0.12)' : '#1c2128',
              border: `1px solid ${msg.role === 'user' ? 'rgba(249,115,22,0.25)' : COLOR_NODE_BORDER}`,
              borderRadius: 6,
              padding: '6px 10px',
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: COLOR_NODE_TEXT,
              lineHeight: '1.55',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {msg.content}
          </div>
        ))}

        {isLoading && (
          <div
            aria-live="polite"
            style={{
              alignSelf: 'flex-start',
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: COLOR_TEXT_MUTED,
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
              color: COLOR_STATUS_ERROR,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Input area — pinned to bottom — A-29 */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 14px',
          borderTop: `1px solid ${COLOR_SUMMARY_BORDER}`,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={draft}
          onChange={(e): void => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this concept…"
          rows={2}
          disabled={isLoading}
          aria-label="Chat input"
          style={{
            flex: 1,
            background: COLOR_INPUT_BG,
            border: `1px solid ${COLOR_INPUT_BORDER}`,
            borderRadius: 4,
            color: COLOR_NODE_TEXT,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            padding: '6px 8px',
            resize: 'none',
            outline: 'none',
            transition: `border-color ${TRANSITION_FAST}`,
          }}
          onFocus={(e): void => {
            e.currentTarget.style.borderColor = COLOR_INPUT_FOCUS_BORDER
          }}
          onBlur={(e): void => {
            e.currentTarget.style.borderColor = COLOR_INPUT_BORDER
          }}
        />
        <button
          className="cf-chat-send"
          onClick={(): void => {
            void handleSubmit()
          }}
          disabled={aiDisabled}
          aria-label="Send message"
          style={{
            padding: '6px 10px',
            background: COLOR_NODE_SELECTED,
            border: 'none',
            borderRadius: 4,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            fontWeight: 600,
            color: '#0d1117',
            cursor: aiDisabled ? 'not-allowed' : 'pointer',
            opacity: aiDisabled ? 0.4 : 1,
            transition: `background-color ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
            alignSelf: 'flex-end',
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
