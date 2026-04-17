import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@/hooks/use-theme'
import {
  FONT_FAMILY,
  FONT_SIZE_SMALL,
  SUMMARY_PANEL_BOTTOM,
  SUMMARY_PANEL_WIDTH,
  TRANSITION_FAST,
} from '@/lib/theme'
import { chatNode, type ChatMessage } from '@/lib/claude'
import { getApiKey } from '@/lib/apiKey'
import { getConceptChatPrompt } from '@/lib/chatPrompts'
import { ChatReadingPanel } from './ChatReadingPanel'

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
  onVoiceChat?: (nodeId: string, nodeLabel: string, nodeDescription?: string) => void
}

export function ChatPanel({
  nodeId,
  nodeLabel,
  nodeDescription,
  focusQuestion,
  onDismiss,
  onVoiceChat,
}: ChatPanelProps): React.JSX.Element {
  const { tokens } = useTheme()
  const panelBottom = usePanelBottom()
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [readingContent, setReadingContent] = useState<string | null>(null)
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
        apiKey,
        getConceptChatPrompt()
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
        backgroundColor: tokens.COLOR_SUMMARY_BG,
        border: `1px solid ${tokens.COLOR_SUMMARY_BORDER}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
      }}
    >
      <style>{`
        .cf-chat-dismiss:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-chat-dismiss:focus-visible { outline: 2px solid ${tokens.COLOR_SUMMARY_LINK}; outline-offset: 2px; }
        .cf-chat-send:hover:not(:disabled) { background-color: ${tokens.COLOR_BUTTON_PRIMARY_HOVER_BG} !important; }
        .cf-chat-send:focus-visible { outline: 2px solid ${tokens.COLOR_SUMMARY_LINK}; outline-offset: 2px; }
        .cf-chat-read:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-chat-read:focus-visible { outline: 2px solid ${tokens.COLOR_SUMMARY_LINK}; outline-offset: 2px; }
        .cf-chat-voice:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-chat-voice:focus-visible { outline: 2px solid ${tokens.COLOR_SUMMARY_LINK}; outline-offset: 2px; }
      `}</style>

      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '14px 16px 10px',
          borderBottom: `1px solid ${tokens.COLOR_SUMMARY_BORDER}`,
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
            color: tokens.COLOR_TEXT_MUTED,
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
        {onVoiceChat !== undefined && (
          <button
            className="cf-chat-voice"
            onClick={(): void => onVoiceChat(nodeId, nodeLabel, nodeDescription)}
            aria-label="Switch to voice chat"
            title="Voice chat"
            style={{
              padding: '2px 6px',
              background: 'transparent',
              border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `background-color ${TRANSITION_FAST}`,
              flexShrink: 0,
            }}
          >
            {/* Microphone icon */}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="9"
                y="2"
                width="6"
                height="12"
                rx="3"
                stroke={tokens.COLOR_TEXT_MUTED}
                strokeWidth="2"
              />
              <path
                d="M5 11a7 7 0 0 0 14 0"
                stroke={tokens.COLOR_TEXT_MUTED}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="18"
                x2="12"
                y2="22"
                stroke={tokens.COLOR_TEXT_MUTED}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="9"
                y1="22"
                x2="15"
                y2="22"
                stroke={tokens.COLOR_TEXT_MUTED}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        <button
          className="cf-chat-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss chat panel"
          style={{
            padding: '2px 8px',
            background: 'transparent',
            border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
            borderRadius: 4,
            fontFamily: FONT_FAMILY,
            fontSize: '10px',
            color: tokens.COLOR_TEXT_MUTED,
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
              color: tokens.COLOR_TEXT_MUTED,
              fontStyle: 'italic',
            }}
          >
            Ask anything about &ldquo;{nodeLabel}&rdquo;
          </p>
        )}

        {history.map((msg, i) =>
          msg.role === 'user' ? (
            <div
              key={i}
              style={{
                alignSelf: 'flex-end',
                maxWidth: '92%',
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
              {msg.content}
            </div>
          ) : (
            /* A-31: AI response with persistent reading view button */
            <div
              key={i}
              style={{
                alignSelf: 'flex-start',
                maxWidth: '92%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  backgroundColor: tokens.COLOR_CODE_BG,
                  border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
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
                {msg.content}
              </div>
              <button
                className="cf-chat-read"
                onClick={(): void => setReadingContent(msg.content)}
                aria-label="Open reading view for this response"
                title="Reading view"
                style={{
                  alignSelf: 'flex-end',
                  marginTop: 3,
                  padding: '2px 5px',
                  background: 'transparent',
                  border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
                  borderRadius: 3,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  transition: `background-color ${TRANSITION_FAST}`,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path
                    d="M6 1h3v3"
                    stroke="#8b949e"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M9 1L5.5 4.5" stroke="#8b949e" strokeWidth="1.2" strokeLinecap="round" />
                  <path
                    d="M4 9H1V6"
                    stroke="#8b949e"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M1 9L4.5 5.5" stroke="#8b949e" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span
                  style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: '9px',
                    color: tokens.COLOR_TEXT_MUTED,
                    lineHeight: 1,
                  }}
                >
                  Read
                </span>
              </button>
            </div>
          )
        )}

        {isLoading && (
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

      {/* A-32: reading view panel — rendered into document.body via portal */}
      {readingContent !== null && (
        <ChatReadingPanel
          content={readingContent}
          onDismiss={(): void => setReadingContent(null)}
        />
      )}

      {/* Input area — pinned to bottom — A-29 */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 14px',
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
          placeholder="Ask about this concept…"
          rows={2}
          disabled={isLoading}
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
        <button
          className="cf-chat-send"
          onClick={(): void => {
            void handleSubmit()
          }}
          disabled={aiDisabled}
          aria-label="Send message"
          style={{
            padding: '6px 10px',
            background: tokens.COLOR_NODE_SELECTED,
            border: 'none',
            borderRadius: 4,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            fontWeight: 600,
            color: tokens.COLOR_BUTTON_PRIMARY_TEXT,
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
