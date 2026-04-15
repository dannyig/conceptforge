// A-40 / A-41: interactive suggestion panel — selectable labels or concepts with Apply button
import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/hooks/use-theme'
import { FONT_FAMILY, FONT_SIZE_BASE, FONT_SIZE_SMALL, TRANSITION_FAST } from '@/lib/theme'

export interface SuggestionItem {
  label: string
  explanation: string
}

// Parse the numbered-list AI response into diagram + items.
// Format expected:
//   [Source] -- label --> [Target]
//
//   1. Item Title
//   Explanation paragraph...
//
//   2. Another Title
//   ...
export function parseSuggestions(content: string): {
  diagram: string
  items: SuggestionItem[]
} {
  const lines = content.split('\n')
  let diagram = ''
  const items: SuggestionItem[] = []
  let currentLabel = ''
  const explanationLines: string[] = []

  const flush = (): void => {
    if (currentLabel) {
      items.push({ label: currentLabel, explanation: explanationLines.join(' ').trim() })
      currentLabel = ''
      explanationLines.length = 0
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // ASCII diagram line
    if (!diagram && /^\[.+\]\s*--/.test(trimmed)) {
      diagram = trimmed
      continue
    }

    // Numbered item: "1. Title" or "1. **Title**"
    const numMatch = trimmed.match(/^\d+\.\s+\*{0,2}(.+?)\*{0,2}\s*$/)
    if (numMatch) {
      flush()
      currentLabel = numMatch[1].trim()
      continue
    }

    // Explanation text (non-empty lines after a title)
    if (currentLabel && trimmed) {
      explanationLines.push(trimmed)
    }
  }
  flush()

  return { diagram, items }
}

interface SuggestionSelectPanelProps {
  title: string
  content: string
  mode: 'single' | 'multi'
  onApply: (selected: SuggestionItem[]) => void
  onDismiss: () => void
}

export function SuggestionSelectPanel({
  title,
  content,
  mode,
  onApply,
  onDismiss,
}: SuggestionSelectPanelProps): React.JSX.Element {
  const { tokens } = useTheme()
  const { diagram, items } = parseSuggestions(content)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const toggleItem = useCallback(
    (idx: number): void => {
      setSelected(prev => {
        if (mode === 'single') return new Set([idx])
        const next = new Set(prev)
        if (next.has(idx)) {
          next.delete(idx)
        } else {
          next.add(idx)
        }
        return next
      })
    },
    [mode]
  )

  const handleApply = useCallback((): void => {
    const selectedItems = items.filter((_, i) => selected.has(i))
    onApply(selectedItems)
  }, [items, selected, onApply])

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

  const canApply = selected.size > 0

  return createPortal(
    <div
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label="Suggestion selection"
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
        .cf-sugg-dismiss:hover { background-color: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-sugg-dismiss:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
        .cf-sugg-item:hover { background: ${tokens.COLOR_BUTTON_GHOST_HOVER_BG} !important; }
        .cf-sugg-apply:not(:disabled):hover { background: ${tokens.COLOR_BUTTON_PRIMARY_HOVER_BG} !important; color: ${tokens.COLOR_BUTTON_PRIMARY_TEXT} !important; }
        .cf-sugg-apply:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
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
            className="cf-sugg-dismiss"
            onClick={onDismiss}
            aria-label="Close panel"
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

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
          {/* ASCII diagram */}
          {diagram && (
            <pre
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                color: tokens.COLOR_TEXT_MUTED,
                background: tokens.COLOR_CODE_BG,
                border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 18,
                overflowX: 'auto',
                whiteSpace: 'pre',
              }}
            >
              {diagram}
            </pre>
          )}

          {/* Selectable items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, idx) => {
              const isSelected = selected.has(idx)
              return (
                <div
                  key={idx}
                  className="cf-sugg-item"
                  onClick={(): void => toggleItem(idx)}
                  role={mode === 'single' ? 'radio' : 'checkbox'}
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e): void => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault()
                      toggleItem(idx)
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: `1px solid ${isSelected ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_NODE_BORDER}`,
                    background: isSelected ? 'rgba(249,115,22,0.08)' : 'transparent',
                    cursor: 'pointer',
                    transition: `border-color ${TRANSITION_FAST}, background ${TRANSITION_FAST}`,
                  }}
                >
                  {/* Control indicator */}
                  <div
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      width: 14,
                      height: 14,
                      borderRadius: mode === 'single' ? '50%' : 3,
                      border: `2px solid ${isSelected ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_TEXT_MUTED}`,
                      background: isSelected ? tokens.COLOR_NODE_SELECTED : 'transparent',
                      transition: `border-color ${TRANSITION_FAST}, background ${TRANSITION_FAST}`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: FONT_FAMILY,
                        fontSize: FONT_SIZE_BASE,
                        fontWeight: 600,
                        color: isSelected ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_NODE_TEXT,
                        marginBottom: item.explanation ? 4 : 0,
                        transition: `color ${TRANSITION_FAST}`,
                      }}
                    >
                      {item.label}
                    </div>
                    {item.explanation && (
                      <div
                        style={{
                          fontFamily: FONT_FAMILY,
                          fontSize: FONT_SIZE_SMALL,
                          color: tokens.COLOR_TEXT_MUTED,
                          lineHeight: '1.6',
                        }}
                      >
                        {item.explanation}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 24px',
            borderTop: `1px solid ${tokens.COLOR_SUMMARY_BORDER}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            onClick={onDismiss}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
              borderRadius: 5,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: tokens.COLOR_TEXT_MUTED,
              cursor: 'pointer',
              transition: `background ${TRANSITION_FAST}`,
            }}
            onMouseEnter={(e): void => {
              ;(e.currentTarget as HTMLButtonElement).style.background =
                tokens.COLOR_BUTTON_GHOST_HOVER_BG
            }}
            onMouseLeave={(e): void => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            Dismiss
          </button>
          <button
            className="cf-sugg-apply"
            onClick={handleApply}
            disabled={!canApply}
            style={{
              padding: '6px 16px',
              background: canApply ? 'rgba(249,115,22,0.15)' : 'transparent',
              border: `1px solid ${canApply ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_NODE_BORDER}`,
              borderRadius: 5,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: canApply ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_TEXT_MUTED,
              cursor: canApply ? 'pointer' : 'not-allowed',
              opacity: canApply ? 1 : 0.35,
              transition: `background ${TRANSITION_FAST}, border-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
              pointerEvents: canApply ? 'auto' : 'none',
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
