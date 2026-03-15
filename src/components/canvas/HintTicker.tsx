import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  COLOR_NODE_SELECTED,
  COLOR_TICKER_BG,
  COLOR_TICKER_BORDER,
  COLOR_TICKER_RESTORE_BG,
  COLOR_TICKER_TEXT,
  FONT_FAMILY,
  TICKER_FONT_SIZE,
  TICKER_HEIGHT,
  TICKER_READ_MS,
  TICKER_SLIDE_MS,
  TRANSITION_FAST,
  TRANSITION_NORMAL,
} from '@/lib/theme'

// Max 8 words per hint (H-02)
const HINTS: readonly string[] = [
  'Double-click canvas to add a node',
  'Right-click a node to expand with AI',
  'Drag node handles to connect two nodes',
  'Right-click canvas — Add Node or Note',
  'Select mode: drag to rubber-band select',
  'Space+drag in Select mode to pan',
  'Drag an edge label to reposition it',
  'Right-click a label to branch it',
  'Double-click any label to edit inline',
  'Save and load your map as JSON',
  'Focus question guides AI map generation',
  'Export your full canvas as PNG',
  'Notes resize by dragging edges or corners',
  'Delete key removes all selected items',
  'Drag a handle to empty space — new node',
  'Drag any selected node to move all',
]

// Three-phase cycle per hint:
//   idle     — text is off-screen right, no transition (instant reset)
//   entering — text transitions from off-screen right to resting position
//   reading  — text is at rest; timer counts down before next hint
type Phase = 'idle' | 'entering' | 'reading'

export function HintTicker(): React.JSX.Element {
  const [visible, setVisible] = useState(true)
  const [restoreHovered, setRestoreHovered] = useState(false)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [hovered, setHovered] = useState(false)

  // Track how much read-time has elapsed when hover pauses the timer
  const readStartRef = useRef<number>(0)
  const readElapsedRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const advanceToNextHint = useCallback((): void => {
    clearTimer()
    readElapsedRef.current = 0
    setPhase('idle')
    setIndex(prev => (prev + 1) % HINTS.length)
  }, [clearTimer])

  const startReadTimer = useCallback(
    (remaining: number): void => {
      readStartRef.current = Date.now()
      timerRef.current = setTimeout(advanceToNextHint, remaining)
    },
    [advanceToNextHint]
  )

  // State machine: idle → entering → reading → idle → …
  useEffect(() => {
    if (!visible) return

    if (phase === 'idle') {
      // One frame delay so the browser renders translateX(110%) before we
      // add the transition and set translateX(0)
      const raf = requestAnimationFrame((): void => {
        setPhase('entering')
      })
      return (): void => cancelAnimationFrame(raf)
    }

    if (phase === 'entering') {
      timerRef.current = setTimeout((): void => {
        setPhase('reading')
      }, TICKER_SLIDE_MS)
      return clearTimer
    }

    // 'reading' phase: timer is owned by the hover effect below
    if (phase === 'reading') {
      readElapsedRef.current = 0
    }
  }, [phase, visible, clearTimer, startReadTimer])

  // Pause / resume read timer on hover
  useEffect(() => {
    if (phase !== 'reading') return

    if (hovered) {
      clearTimer()
      readElapsedRef.current += Date.now() - readStartRef.current
    } else {
      const remaining = Math.max(0, TICKER_READ_MS - readElapsedRef.current)
      startReadTimer(remaining)
    }
  }, [hovered, phase, clearTimer, startReadTimer])

  // Reset to idle when ticker becomes visible again
  useEffect(() => {
    if (visible) {
      readElapsedRef.current = 0
      setPhase('idle')
    }
  }, [visible])

  if (!visible) {
    return (
      <button
        aria-label="Show hint ticker"
        onClick={(): void => setVisible(true)}
        onMouseEnter={(): void => setRestoreHovered(true)}
        onMouseLeave={(): void => setRestoreHovered(false)}
        style={{
          position: 'absolute',
          bottom: 10,
          right: 54,
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
          opacity: restoreHovered ? 0.9 : 0.35,
          transition: `opacity ${TRANSITION_NORMAL}`,
          zIndex: 10,
        }}
      >
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <rect x="0" y="0" width="10" height="1.5" rx="0.75" fill={COLOR_TICKER_TEXT} />
          <rect x="0" y="3.25" width="10" height="1.5" rx="0.75" fill={COLOR_TICKER_TEXT} />
          <rect x="0" y="6.5" width="10" height="1.5" rx="0.75" fill={COLOR_TICKER_TEXT} />
        </svg>
      </button>
    )
  }

  // Text is visible (at rest) during both 'entering' and 'reading'; off-screen only during 'idle'
  const translateX = phase === 'idle' ? '110%' : '0%'
  const transition =
    phase === 'entering'
      ? `transform ${TICKER_SLIDE_MS}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
      : 'none'

  return (
    <div
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
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {/* Sliding hint text — full width, passes in front of dismiss button (zIndex 2).
          pointerEvents none so clicks reach the dismiss button beneath. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          transform: `translateX(${translateX})`,
          transition,
          zIndex: 2,
          fontFamily: FONT_FAMILY,
          fontSize: TICKER_FONT_SIZE,
          lineHeight: 1,
          color: COLOR_TICKER_TEXT,
          letterSpacing: '0.03em',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}
      >
        <span style={{ color: COLOR_NODE_SELECTED, marginRight: 4, opacity: 0.7 }}>Tip:</span>
        {HINTS[index]}
      </div>

      {/* Dismiss button — behind sliding text (zIndex 1) */}
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
        opacity: hovered ? 1 : 0.5,
        transition: `opacity ${TRANSITION_FAST}, background ${TRANSITION_FAST}`,
        zIndex: 1,
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
