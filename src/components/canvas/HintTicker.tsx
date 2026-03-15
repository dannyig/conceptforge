import React, { useState } from 'react'
import {
  COLOR_TICKER_BG,
  COLOR_TICKER_BORDER,
  COLOR_TICKER_RESTORE_BG,
  COLOR_TICKER_TEXT,
  FONT_FAMILY,
  TICKER_FONT_SIZE,
  TICKER_HEIGHT,
  TICKER_SCROLL_DURATION,
  TRANSITION_FAST,
  TRANSITION_NORMAL,
} from '@/lib/theme'

const HINTS: readonly string[] = [
  'Double-click the canvas to add a node',
  'Right-click any node to expand it with AI',
  'Drag from a node handle to connect two nodes',
  'Right-click the canvas for Add Node and Add Note options',
  'In Select mode, drag to rubber-band select multiple items',
  'Hold Space in Select mode to pan instead of selecting',
  'Drag an edge label to reposition it as a waypoint',
  'Right-click a labelled edge to branch it to multiple targets',
  'Double-click a node or edge label to edit it inline',
  'Save your map as JSON — all positions and labels are preserved',
  'Use the Focus Question bar to guide your AI map generation',
  'Export your full canvas as a PNG from the toolbar',
  'Concept maps work best with 5–10 nodes per cluster',
  'Use branching edges to show one concept relating to many',
  'Drag a node handle to an empty area to create and connect a new node',
  'Select multiple items and drag any selected node to move the group',
  'Press Delete while items are selected to remove them all at once',
  'Right-click a branching hub to restructure or delete the entire branch',
  'The focus question is saved with your map and included in AI prompts',
  'Notes can be resized by dragging their edges or corners',
]

const TICKER_ANIMATION_ID = 'cf-ticker-keyframes'

function ensureTickerKeyframes(): void {
  if (document.getElementById(TICKER_ANIMATION_ID)) return
  const style = document.createElement('style')
  style.id = TICKER_ANIMATION_ID
  style.textContent = `
    @keyframes cf-ticker-scroll {
      0%   { transform: translateX(100vw); }
      100% { transform: translateX(-100%); }
    }
  `
  document.head.appendChild(style)
}

export function HintTicker(): React.JSX.Element {
  const [visible, setVisible] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [restoreHovered, setRestoreHovered] = useState(false)

  // Inject @keyframes once into document head (no .css file)
  ensureTickerKeyframes()

  const tickerText = HINTS.join('  ·  ')

  if (!visible) {
    return (
      <button
        aria-label="Show hint ticker"
        onClick={(): void => setVisible(true)}
        onMouseEnter={(): void => setRestoreHovered(true)}
        onMouseLeave={(): void => setRestoreHovered(false)}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 56,
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: COLOR_TICKER_RESTORE_BG,
          border: `1px solid ${COLOR_TICKER_BORDER}`,
          borderRadius: 4,
          cursor: 'pointer',
          padding: 0,
          opacity: restoreHovered ? 0.9 : 0.45,
          transition: `opacity ${TRANSITION_NORMAL}`,
          zIndex: 10,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1" y="3.5" width="8" height="1" rx="0.5" fill={COLOR_TICKER_TEXT} />
          <rect x="1" y="5.5" width="8" height="1" rx="0.5" fill={COLOR_TICKER_TEXT} />
          <rect x="1" y="7.5" width="8" height="1" rx="0.5" fill={COLOR_TICKER_TEXT} />
        </svg>
      </button>
    )
  }

  return (
    <div
      role="marquee"
      aria-label="ConceptForge hints"
      onMouseEnter={(): void => setHovered(true)}
      onMouseLeave={(): void => setHovered(false)}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: TICKER_HEIGHT,
        background: COLOR_TICKER_BG,
        borderTop: `1px solid ${COLOR_TICKER_BORDER}`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        zIndex: 10,
        fontFamily: FONT_FAMILY,
        fontSize: TICKER_FONT_SIZE,
        color: COLOR_TICKER_TEXT,
        letterSpacing: '0.02em',
        userSelect: 'none',
      }}
    >
      {/* Scrolling text track */}
      <span
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: `cf-ticker-scroll ${TICKER_SCROLL_DURATION} linear infinite`,
          animationPlayState: hovered ? 'paused' : 'running',
          paddingRight: '4rem',
        }}
      >
        {tickerText}
      </span>

      {/* Dismiss button */}
      <DismissButton onDismiss={(): void => setVisible(false)} />
    </div>
  )
}

function DismissButton({ onDismiss }: { onDismiss: () => void }): React.JSX.Element {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      aria-label="Hide hint ticker"
      onClick={onDismiss}
      onMouseEnter={(): void => setHovered(true)}
      onMouseLeave={(): void => setHovered(false)}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none',
        borderLeft: `1px solid ${COLOR_TICKER_BORDER}`,
        cursor: 'pointer',
        padding: 0,
        color: COLOR_TICKER_TEXT,
        opacity: hovered ? 1 : 0.6,
        transition: `opacity ${TRANSITION_FAST}, background ${TRANSITION_FAST}`,
        flexShrink: 0,
      }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <line
          x1="1"
          y1="1"
          x2="7"
          y2="7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="7"
          y1="1"
          x2="1"
          y2="7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
