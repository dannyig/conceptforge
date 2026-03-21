import React, { useEffect, useRef, useState } from 'react'
import type { SummaryResource } from '@/types'
import {
  COLOR_NODE_BORDER,
  COLOR_NODE_TEXT,
  COLOR_SUMMARY_BG,
  COLOR_SUMMARY_BORDER,
  COLOR_SUMMARY_LINK,
  COLOR_SUMMARY_LINK_HOVER,
  COLOR_TEXT_MUTED,
  FONT_FAMILY,
  FONT_SIZE_SMALL,
  SUMMARY_PANEL_WIDTH,
  TRANSITION_FAST,
  TYPEWRITER_CHAR_DELAY_MS,
} from '@/lib/theme'

interface SummaryPanelProps {
  narrative: string
  resources: SummaryResource[]
  onDismiss: () => void
}

export function SummaryPanel({
  narrative,
  resources,
  onDismiss,
}: SummaryPanelProps): React.JSX.Element {
  const [displayed, setDisplayed] = useState('')
  const [animDone, setAnimDone] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    indexRef.current = 0
    setDisplayed('')
    setAnimDone(false)

    timerRef.current = setInterval(() => {
      indexRef.current += 1
      const next = narrative.slice(0, indexRef.current)
      setDisplayed(next)
      if (indexRef.current >= narrative.length) {
        if (timerRef.current !== null) clearInterval(timerRef.current)
        setAnimDone(true)
      }
    }, TYPEWRITER_CHAR_DELAY_MS)

    return (): void => {
      if (timerRef.current !== null) clearInterval(timerRef.current)
    }
  }, [narrative])

  return (
    <div
      aria-label="AI Summary Panel"
      role="complementary"
      style={{
        flexShrink: 0,
        width: SUMMARY_PANEL_WIDTH,
        height: '100%',
        backgroundColor: COLOR_SUMMARY_BG,
        borderLeft: `1px solid ${COLOR_SUMMARY_BORDER}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .cf-summary-link { color: ${COLOR_SUMMARY_LINK}; text-decoration: none; transition: color ${TRANSITION_FAST}; }
        .cf-summary-link:hover { color: ${COLOR_SUMMARY_LINK_HOVER}; text-decoration: underline; }
        .cf-summary-link:focus-visible { outline: 2px solid ${COLOR_SUMMARY_LINK}; outline-offset: 2px; border-radius: 2px; }
        .cf-summary-dismiss:hover { background-color: #21262d !important; }
        .cf-summary-dismiss:focus-visible { outline: 2px solid ${COLOR_SUMMARY_LINK}; outline-offset: 2px; }
      `}</style>

      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '14px 16px 10px',
          borderBottom: `1px solid ${COLOR_SUMMARY_BORDER}`,
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
          }}
        >
          AI Summary
        </span>
      </div>

      {/* Scrollable content area — A-21 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* A-19: typewriter narrative */}
        <p
          style={{
            margin: 0,
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_SMALL,
            lineHeight: '1.6',
            color: COLOR_NODE_TEXT,
          }}
        >
          {displayed}
          {!animDone && (
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 2,
                height: '1em',
                backgroundColor: COLOR_SUMMARY_LINK,
                marginLeft: 1,
                verticalAlign: 'text-bottom',
                animation: 'cf-cursor-blink 0.8s step-end infinite',
              }}
            />
          )}
        </p>

        {/* A-19: resources appear after animation completes */}
        {animDone && resources.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: '10px',
                fontWeight: '600',
                color: COLOR_TEXT_MUTED,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Resources
            </span>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {resources.slice(0, 5).map((res, i) => (
                <li key={i}>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cf-summary-link"
                    style={{ fontFamily: FONT_FAMILY, fontSize: '10px' }}
                  >
                    ↗ {res.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* A-20: dismiss button — appears after animation completes */}
      {animDone && (
        <div
          style={{
            flexShrink: 0,
            padding: '10px 16px',
            borderTop: `1px solid ${COLOR_SUMMARY_BORDER}`,
          }}
        >
          <button
            className="cf-summary-dismiss"
            onClick={onDismiss}
            aria-label="Dismiss summary panel"
            style={{
              width: '100%',
              padding: '6px 0',
              background: 'transparent',
              border: `1px solid ${COLOR_NODE_BORDER}`,
              borderRadius: 4,
              fontFamily: FONT_FAMILY,
              fontSize: '10px',
              color: COLOR_TEXT_MUTED,
              cursor: 'pointer',
              transition: `background-color ${TRANSITION_FAST}`,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <style>{`
        @keyframes cf-cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  )
}
