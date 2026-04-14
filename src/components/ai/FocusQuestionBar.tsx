import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@/hooks/use-theme'
import {
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
  onIngestUrl?: (url: string) => void
  isGenerating?: boolean
  aiError?: string | null
  onDismissError?: () => void
  aiAssistEnabled?: boolean
}

export function FocusQuestionBar({
  value,
  onChange,
  onGenerateMap,
  onSuggestConcepts,
  onIngestUrl,
  isGenerating = false,
  aiError = null,
  onDismissError,
  aiAssistEnabled = true,
}: FocusQuestionBarProps): React.JSX.Element {
  const { tokens } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)
  // Snapshot of the committed value at focus time — used to revert on Escape
  const committedRef = useRef<string>(value)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [hoveredBtn, setHoveredBtn] = useState<'generate' | 'suggest' | 'url' | null>(null)
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false)
  const [urlDraft, setUrlDraft] = useState<string>('')

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

  const handleUrlKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter') {
        const trimmed = urlDraft.trim()
        if (trimmed && onIngestUrl) {
          onIngestUrl(trimmed)
          setShowUrlInput(false)
          setUrlDraft('')
        }
      }
      if (e.key === 'Escape') {
        setShowUrlInput(false)
        setUrlDraft('')
      }
    },
    [urlDraft, onIngestUrl]
  )

  const handleUrlButtonClick = useCallback((): void => {
    setShowUrlInput(prev => {
      if (!prev) {
        // Open: focus the input after render
        setTimeout((): void => urlInputRef.current?.focus(), 0)
      }
      return !prev
    })
    setUrlDraft('')
  }, [])

  // A-11: buttons appear when focus question has content
  const hasQuestion = value.trim().length > 0
  const showButtons =
    hasQuestion && (onGenerateMap !== undefined || onSuggestConcepts !== undefined)

  const aiDisabled = !aiAssistEnabled
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
    cursor: isGenerating || aiDisabled ? 'not-allowed' : 'pointer',
    opacity: aiDisabled ? 0.35 : isGenerating ? 0.5 : 1,
    pointerEvents: aiDisabled ? 'none' : 'auto',
    transition: `background-color ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
  }

  return (
    <div
      role="banner"
      aria-label="Focus question bar"
      style={{
        flexShrink: 0,
        width: '100%',
        backgroundColor: tokens.COLOR_PANEL_BG,
        borderBottom: `1px solid ${isFocused ? tokens.COLOR_INPUT_FOCUS_BORDER : tokens.COLOR_NODE_BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        transition: `border-color ${TRANSITION_FAST}`,
        position: 'relative',
      }}
    >
      <style>{`
        .cf-fqb-input::placeholder { color: ${tokens.COLOR_TEXT_MUTED}; opacity: 1; }
        .cf-fqb-btn-generate:hover:not(:disabled) { background-color: ${tokens.COLOR_BUTTON_PRIMARY_HOVER_BG} !important; }
        .cf-fqb-btn-suggest:hover:not(:disabled) { background-color: #21262d !important; }
        .cf-fqb-btn-url:hover:not(:disabled) { background-color: #21262d !important; }
        .cf-fqb-btn-generate:focus-visible, .cf-fqb-btn-suggest:focus-visible, .cf-fqb-btn-url:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
        .cf-fqb-url-input::placeholder { color: ${tokens.COLOR_TEXT_MUTED}; opacity: 1; }
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
            color: tokens.COLOR_NODE_SELECTED,
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
                      ? tokens.COLOR_BUTTON_PRIMARY_HOVER_BG
                      : tokens.COLOR_BUTTON_PRIMARY_BG,
                  color: tokens.COLOR_BUTTON_PRIMARY_TEXT,
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
                  color: isGenerating ? tokens.COLOR_TEXT_MUTED : tokens.COLOR_NODE_TEXT,
                  border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
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
            color: tokens.COLOR_NODE_TEXT,
            opacity: 0.35,
            pointerEvents: 'none',
            userSelect: 'none',
            marginLeft: showButtons ? 0 : 'auto',
          }}
        >
          {`v${__APP_VERSION__}`}
        </span>

        {/* U-01, U-05: URL ingestion button */}
        {onIngestUrl !== undefined && (
          <button
            className="cf-fqb-btn-url"
            disabled={isGenerating}
            onClick={handleUrlButtonClick}
            onMouseEnter={() => setHoveredBtn('url')}
            onMouseLeave={() => setHoveredBtn(null)}
            aria-label="Ingest URL — generate map from a web page"
            aria-pressed={showUrlInput}
            style={{
              ...btnBase,
              backgroundColor: showUrlInput || hoveredBtn === 'url' ? '#21262d' : 'transparent',
              color: showUrlInput ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_TEXT_MUTED,
              border: `1px solid ${showUrlInput ? tokens.COLOR_NODE_SELECTED : tokens.COLOR_NODE_BORDER}`,
              padding: '5px 8px',
              marginLeft: 4,
            }}
          >
            <LinkIcon />
          </button>
        )}
      </div>

      {/* U-05: inline URL input row — shown when URL button is toggled */}
      {showUrlInput && (
        <div
          style={{
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <input
            ref={urlInputRef}
            type="url"
            className="cf-fqb-url-input"
            value={urlDraft}
            onChange={(e): void => setUrlDraft(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder="Paste a URL and press Enter to generate a map…"
            aria-label="URL to ingest"
            style={{
              flex: 1,
              background: tokens.COLOR_INPUT_BG,
              border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
              borderRadius: 4,
              outline: 'none',
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: tokens.COLOR_NODE_TEXT,
              padding: '4px 8px',
              transition: `border-color ${TRANSITION_FAST}`,
            }}
            onFocus={(e): void => {
              e.currentTarget.style.borderColor = tokens.COLOR_INPUT_FOCUS_BORDER
            }}
            onBlur={(e): void => {
              e.currentTarget.style.borderColor = tokens.COLOR_INPUT_BORDER
            }}
          />
          <span
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: '11px',
              color: tokens.COLOR_TEXT_MUTED,
              flexShrink: 0,
            }}
          >
            Enter ↵ to generate · Esc to cancel
          </span>
        </div>
      )}

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
              color: tokens.COLOR_STATUS_ERROR,
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
                color: tokens.COLOR_TEXT_MUTED,
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

function LinkIcon(): React.JSX.Element {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}
