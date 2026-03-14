import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  COLOR_INPUT_FOCUS_BORDER,
  COLOR_NODE_BORDER,
  COLOR_NODE_SELECTED,
  COLOR_NODE_TEXT,
  COLOR_PANEL_BG,
  COLOR_TEXT_MUTED,
  FOCUS_BAR_HEIGHT,
  FONT_FAMILY,
  FONT_SIZE_FOCUS_QUESTION,
  TRANSITION_FAST,
} from '@/lib/theme'

interface FocusQuestionBarProps {
  value: string
  onChange: (value: string) => void
}

export function FocusQuestionBar({ value, onChange }: FocusQuestionBarProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)
  // Snapshot of the committed value at focus time — used to revert on Escape
  const committedRef = useRef<string>(value)
  const [isFocused, setIsFocused] = useState<boolean>(false)

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

  return (
    <div
      role="banner"
      aria-label="Focus question bar"
      style={{
        flexShrink: 0,
        width: '100%',
        height: FOCUS_BAR_HEIGHT,
        backgroundColor: COLOR_PANEL_BG,
        borderBottom: `1px solid ${isFocused ? COLOR_INPUT_FOCUS_BORDER : COLOR_NODE_BORDER}`,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 24,
        paddingRight: 24,
        boxSizing: 'border-box',
        transition: `border-color ${TRANSITION_FAST}`,
        position: 'relative',
      }}
    >
      <style>{`
        .cf-fqb-input::placeholder { color: ${COLOR_TEXT_MUTED}; opacity: 1; }
      `}</style>
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
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 5,
          right: 24,
          fontFamily: FONT_FAMILY,
          fontSize: '10px',
          color: COLOR_NODE_TEXT,
          opacity: 0.35,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {`v${__APP_VERSION__}`}
      </span>
    </div>
  )
}
