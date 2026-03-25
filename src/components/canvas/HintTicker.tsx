import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  COLOR_NODE_SELECTED,
  COLOR_TICKER_BG,
  COLOR_TICKER_BORDER,
  COLOR_TICKER_TEXT,
  FONT_FAMILY,
  TICKER_FADE_MS,
  TICKER_FONT_SIZE,
  TICKER_HEIGHT,
  TICKER_READ_MS,
  TRANSITION_FAST,
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
  'Right-click a node to add a description',
  'Green dot on node — hover to read info',
  'Menu → Download cmap skill for Claude Code',
  'Right-click a node to open AI chat',
  'Chat reply — hit Read for a full view',
  'Arrow keys navigate between connected nodes',
  'Alt+Arrow selects an edge from current node',
  'Tab cycles through every node on canvas',
  'Drag an edge tip to reconnect it',
  'Ctrl+Arrow nudges the selected node or edge',
  'Enable AI Assist in Settings to use AI',
]

// Four-phase cycle per hint:
//   idle       — opacity 0, no transition; index just advanced
//   fading-in  — opacity 0 → 1 over TICKER_FADE_MS
//   reading    — opacity 1; timer counts down (hover pauses it)
//   fading-out — opacity 1 → 0 over TICKER_FADE_MS; then advance index
type Phase = 'idle' | 'fading-in' | 'reading' | 'fading-out'

interface HintTickerProps {
  aiAssistEnabled?: boolean
}

export function HintTicker({ aiAssistEnabled = false }: HintTickerProps): React.JSX.Element {
  const [visible, setVisible] = useState(true)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [hovered, setHovered] = useState(false)

  const readStartRef = useRef<number>(0)
  const readElapsedRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback((): void => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startReadTimer = useCallback((remaining: number): void => {
    readStartRef.current = Date.now()
    timerRef.current = setTimeout((): void => setPhase('fading-out'), remaining)
  }, [])

  // State machine: idle → fading-in → reading → fading-out → idle → …
  useEffect(() => {
    if (!visible) return

    if (phase === 'idle') {
      const raf = requestAnimationFrame((): void => setPhase('fading-in'))
      return (): void => cancelAnimationFrame(raf)
    }

    if (phase === 'fading-in') {
      timerRef.current = setTimeout((): void => setPhase('reading'), TICKER_FADE_MS)
      return clearTimer
    }

    if (phase === 'reading') {
      readElapsedRef.current = 0
    }

    if (phase === 'fading-out') {
      timerRef.current = setTimeout((): void => {
        readElapsedRef.current = 0
        setIndex(prev => (prev + 1) % HINTS.length)
        setPhase('idle')
      }, TICKER_FADE_MS)
      return clearTimer
    }
  }, [phase, visible, clearTimer])

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

  // Restart cycle when ticker is re-shown
  useEffect(() => {
    if (visible) {
      clearTimer()
      readElapsedRef.current = 0
      setPhase('idle')
    }
  }, [visible, clearTimer])

  const opacity = phase === 'fading-in' || phase === 'reading' ? 1 : 0
  const transition =
    phase === 'fading-in' || phase === 'fading-out' ? `opacity ${TICKER_FADE_MS}ms ease` : 'none'

  return (
    <>
      {visible && (
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              opacity,
              transition,
              fontFamily: FONT_FAMILY,
              fontSize: TICKER_FONT_SIZE,
              lineHeight: 1,
              color: COLOR_TICKER_TEXT,
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            <span style={{ color: COLOR_NODE_SELECTED, marginRight: 5, opacity: 0.75 }}>Tip:</span>
            {HINTS[index]}
          </div>
        </div>
      )}

      <TipsToggle visible={visible} onToggle={(): void => setVisible(v => !v)} />
      <AiAssistIndicator enabled={aiAssistEnabled} tickerVisible={visible} />
    </>
  )
}

function AiAssistIndicator({
  enabled,
  tickerVisible,
}: {
  enabled: boolean
  tickerVisible: boolean
}): React.JSX.Element {
  return (
    <div
      aria-label={enabled ? 'AI Assist on' : 'AI Assist off'}
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        height: TICKER_HEIGHT,
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        borderLeft: `1px solid ${COLOR_TICKER_BORDER}`,
        borderTop: tickerVisible ? `1px solid ${COLOR_TICKER_BORDER}` : 'none',
        fontFamily: FONT_FAMILY,
        fontSize: TICKER_FONT_SIZE,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: enabled ? COLOR_NODE_SELECTED : COLOR_TICKER_TEXT,
        opacity: enabled ? 1 : 0.35,
        pointerEvents: 'none',
        userSelect: 'none',
        transition: `color ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
        zIndex: 11,
      }}
    >
      {`AI Assist ${enabled ? 'ON' : 'OFF'}`}
    </div>
  )
}

function TipsToggle({
  visible,
  onToggle,
}: {
  visible: boolean
  onToggle: () => void
}): React.JSX.Element {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      aria-label={visible ? 'Hide hints' : 'Show hints'}
      aria-pressed={visible}
      onClick={onToggle}
      onMouseEnter={(): void => setHovered(true)}
      onMouseLeave={(): void => setHovered(false)}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: TICKER_HEIGHT,
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
        background: visible
          ? hovered
            ? 'rgba(249,115,22,0.12)'
            : 'rgba(249,115,22,0.07)'
          : hovered
            ? 'rgba(255,255,255,0.04)'
            : 'transparent',
        border: 'none',
        borderRight: `1px solid ${COLOR_TICKER_BORDER}`,
        borderTop: visible ? `1px solid ${COLOR_TICKER_BORDER}` : 'none',
        cursor: 'pointer',
        fontFamily: FONT_FAMILY,
        fontSize: TICKER_FONT_SIZE,
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: visible ? COLOR_NODE_SELECTED : COLOR_TICKER_TEXT,
        opacity: visible ? 1 : hovered ? 0.6 : 0.35,
        transition: `opacity ${TRANSITION_FAST}, background ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
        zIndex: 11,
        textTransform: 'uppercase',
      }}
    >
      Tips
    </button>
  )
}
