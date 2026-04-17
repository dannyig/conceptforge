import React, { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/hooks/use-theme'
import { FONT_FAMILY, TRANSITION_FAST } from '@/lib/theme'
import { renderMarkdown } from '@/lib/markdown'

interface ChatReadingPanelProps {
  content: string
  onDismiss: () => void
  title?: string
}

// A-32: centred reading panel, 70% viewport, markdown rendering, dismiss button + outside-click
export function ChatReadingPanel({
  content,
  onDismiss,
  title = 'Reading View',
}: ChatReadingPanelProps): React.JSX.Element {
  const { tokens } = useTheme()
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent): void => {
      if (e.target === e.currentTarget) onDismiss()
    },
    [onDismiss]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    return (): void => document.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return createPortal(
    <div
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label="Reading view"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        .cf-reading-dismiss:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-reading-dismiss:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
      `}</style>

      <div
        style={{
          width: '70vw',
          height: '70vh',
          backgroundColor: tokens.COLOR_PANEL_BG,
          border: `1px solid ${tokens.COLOR_SUMMARY_BORDER}`,
          borderRadius: 10,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 18px',
            borderBottom: `1px solid ${tokens.COLOR_SUMMARY_BORDER}`,
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
            }}
          >
            {title}
          </span>
          <button
            className="cf-reading-dismiss"
            onClick={onDismiss}
            aria-label="Close reading view"
            style={{
              width: 24,
              height: 24,
              background: 'transparent',
              border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
              borderRadius: 4,
              fontFamily: FONT_FAMILY,
              fontSize: '16px',
              color: tokens.COLOR_TEXT_MUTED,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `background-color ${TRANSITION_FAST}`,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable markdown content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '22px 28px',
          }}
        >
          {renderMarkdown(content, tokens)}
        </div>
      </div>
    </div>,
    document.body
  )
}
