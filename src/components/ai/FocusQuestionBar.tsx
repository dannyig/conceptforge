import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  COLOR_BUTTON_PRIMARY_BG,
  COLOR_BUTTON_PRIMARY_HOVER_BG,
  COLOR_BUTTON_PRIMARY_TEXT,
  COLOR_INPUT_FOCUS_BORDER,
  COLOR_NODE_BORDER,
  COLOR_NODE_SELECTED,
  COLOR_NODE_TEXT,
  COLOR_PANEL_BG,
  COLOR_STATUS_ERROR,
  COLOR_TEXT_MUTED,
  FOCUS_BAR_HEIGHT,
  FONT_FAMILY,
  FONT_SIZE_FOCUS_QUESTION,
  FONT_SIZE_SMALL,
  TRANSITION_FAST,
} from '@/lib/theme'

interface FocusQuestionBarProps {
  value: string
  onChange: (value: string) => void
  onGenerateMap?: () => void
  onSuggestConcepts?: () => void
  isGenerating?: boolean
  aiError?: string | null
  onDismissError?: () => void
}

export function FocusQuestionBar({
  value,
  onChange,
  onGenerateMap,
  onSuggestConcepts,
  isGenerating = false,
  aiError = null,
  onDismissError,
}: FocusQuestionBarProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  // Snapshot of the committed value at focus time — used to revert on Escape
  const committedRef = useRef<string>(value)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [hoveredBtn, setHoveredBtn] = useState<'generate' | 'suggest' | null>(null)

  // Sync the input DOM value when value changes externally (e.g. map loaded from file — F-06)
  useEffect((): void => {
    if (!isFocused && inputRef.current) {
      inputRef.current.value = value
      committedRef.current = value
    }
  }, [value, isFocused])

  const handleFocus = useCallback((): void => {
    committedRef.current = inputRef.current?.value ?? ''
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback((): void => {
    setIsFocused(false)
    const trimmed = inputRef.current?.value.trim() ?? ''
    if (inputRef.current) inputRef.current.value = trimmed
    committedRef.current = trimmed
    onChange(trimmed)
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      if (inputRef.current) {
        inputRef.current.value = committedRef.current
      }
      inputRef.current?.blur()
    }
  }, [])

  // A-11: buttons appear when focus question has content
  const hasQuestion = value.trim().length > 0
  const showButtons =
    hasQuestion && (onGenerateMap !== undefined || onSuggestConcepts !== undefined)

  const btnBase: React.CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 11px',
    border: 'none',
    borderRadius: 5,
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE_SMALL,
    fontWeight: '500',
    cursor: isGenerating ? 'not-allowed' : 'pointer',
    opacity: isGenerating ? 0.5 : 1,
    transition: `background-color ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
  }

  return (
    <div
      role="banner"
      aria-label="Focus question bar"
      style={{
        flexShrink: 0,
        width: '100%',
        backgroundColor: COLOR_PANEL_BG,
        borderBottom: `1px solid ${isFocused ? COLOR_INPUT_FOCUS_BORDER : COLOR_NODE_BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: `border-color ${TRANSITION_FAST}`,
        position: 'relative',
      }}
    >
      <style>{`
        .cf-fqb-input::placeholder { color: ${COLOR_TEXT_MUTED}; opacity: 1; }
        .cf-fqb-btn-generate:hover:not(:disabled) { background-color: ${COLOR_BUTTON_PRIMARY_HOVER_BG} !important; }
        .cf-fqb-btn-suggest:hover:not(:disabled) { background-color: #21262d !important; }
        .cf-fqb-btn-generate:focus-visible, .cf-fqb-btn-suggest:focus-visible { outline: 2px solid ${COLOR_NODE_SELECTED}; outline-offset: 2px; }
      `}</style>

      {/* Main bar row */}
      <div
        style={{
          height: FOCUS_BAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 24,
          paddingRight: 24,
          gap: 10,
          boxSizing: 'border-box',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="cf-fqb-input"
          defaultValue={value}
          placeholder="Enter your focus question or statement…"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label="Focus question or statement"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZE_FOCUS_QUESTION,
            fontWeight: '600',
            color: COLOR_NODE_SELECTED,
            cursor: 'text',
            padding: 0,
          }}
        />

        {/* A-11: mode buttons — visible when focus question is non-empty */}
        {showButtons && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            aria-label="AI generation modes"
          >
            {onGenerateMap !== undefined && (
              <button
                className="cf-fqb-btn-generate"
                disabled={isGenerating}
                onClick={onGenerateMap}
                onMouseEnter={() => setHoveredBtn('generate')}
                onMouseLeave={() => setHoveredBtn(null)}
                aria-label="Generate Map from focus question"
                style={{
                  ...btnBase,
                  backgroundColor:
                    hoveredBtn === 'generate' && !isGenerating
                      ? COLOR_BUTTON_PRIMARY_HOVER_BG
                      : COLOR_BUTTON_PRIMARY_BG,
                  color: COLOR_BUTTON_PRIMARY_TEXT,
                }}
              >
                {isGenerating ? <SpinnerIcon /> : <MapIcon />}
                Generate Map
              </button>
            )}
            {onSuggestConcepts !== undefined && (
              <button
                className="cf-fqb-btn-suggest"
                disabled={isGenerating}
                onClick={onSuggestConcepts}
                onMouseEnter={() => setHoveredBtn('suggest')}
                onMouseLeave={() => setHoveredBtn(null)}
                aria-label="Suggest concepts from focus question"
                style={{
                  ...btnBase,
                  backgroundColor:
                    hoveredBtn === 'suggest' && !isGenerating ? '#21262d' : 'transparent',
                  color: isGenerating ? COLOR_TEXT_MUTED : COLOR_NODE_TEXT,
                  border: `1px solid ${COLOR_NODE_BORDER}`,
                }}
              >
                {isGenerating ? <SpinnerIcon /> : <BulbIcon />}
                Suggest Concepts
              </button>
            )}
          </div>
        )}

        {/* B-02: version badge */}
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            fontFamily: FONT_FAMILY,
            fontSize: '10px',
            color: COLOR_NODE_TEXT,
            opacity: 0.35,
            pointerEvents: 'none',
            userSelect: 'none',
            marginLeft: showButtons ? 0 : 'auto',
          }}
        >
          {`v${__APP_VERSION__}`}
        </span>
      </div>

      {/* A-11: inline error strip below the bar */}
      {aiError !== null && (
        <div
          role="alert"
          style={{
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: COLOR_STATUS_ERROR,
              flex: 1,
            }}
          >
            {aiError}
          </span>
          {onDismissError !== undefined && (
            <button
              onClick={onDismissError}
              aria-label="Dismiss error"
              style={{
                background: 'none',
                border: 'none',
                color: COLOR_TEXT_MUTED,
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZE_SMALL,
                cursor: 'pointer',
                padding: '0 2px',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SpinnerIcon(): React.JSX.Element {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      style={{ animation: 'cf-spin 0.8s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes cf-spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function MapIcon(): React.JSX.Element {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="20" cy="18" r="2" />
      <line x1="12" y1="9" x2="6" y2="7" />
      <line x1="12" y1="9" x2="18" y2="7" />
      <line x1="12" y1="15" x2="6" y2="17" />
      <line x1="12" y1="15" x2="18" y2="17" />
    </svg>
  )
}

function BulbIcon(): React.JSX.Element {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M9 21h6" />
      <path d="M12 3a6 6 0 0 1 6 6c0 2.2-1.2 4.1-3 5.2V17H9v-2.8C7.2 13.1 6 11.2 6 9a6 6 0 0 1 6-6z" />
    </svg>
  )
}
