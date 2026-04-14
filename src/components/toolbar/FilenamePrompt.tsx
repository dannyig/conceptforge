import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/hooks/use-theme'
import { FONT_FAMILY, FONT_SIZE_SMALL, TRANSITION_FAST } from '@/lib/theme'

interface FilenamePromptProps {
  defaultValue: string
  onConfirm: (filename: string) => void
  onCancel: () => void
}

// P-08: shown before every save; empty on first save, pre-populated on subsequent saves.
// The static ".json" suffix is displayed outside the input to indicate automatic extension.
export function FilenamePrompt({
  defaultValue,
  onConfirm,
  onCancel,
}: FilenamePromptProps): React.JSX.Element {
  const { tokens } = useTheme()
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect((): void => {
    inputRef.current?.focus()
    if (defaultValue) inputRef.current?.select()
  }, [defaultValue])

  const canConfirm = value.trim().length > 0

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && canConfirm) onConfirm(value.trim())
    if (e.key === 'Escape') onCancel()
  }

  return createPortal(
    <div
      onClick={(e): void => {
        if (e.target === e.currentTarget) onCancel()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <style>{`
        .cf-save-confirm:hover:not(:disabled) { background-color: #ea6c0a !important; }
        .cf-save-confirm:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
        .cf-save-cancel:hover { background-color: #21262d !important; }
        .cf-save-cancel:focus-visible { outline: 2px solid ${tokens.COLOR_NODE_SELECTED}; outline-offset: 2px; }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Save map as"
        style={{
          backgroundColor: tokens.COLOR_SUMMARY_BG,
          border: `1px solid ${tokens.COLOR_SUMMARY_BORDER}`,
          borderRadius: 8,
          padding: '20px 22px',
          width: 340,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <span
          style={{
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: tokens.COLOR_TEXT_MUTED,
          }}
        >
          Save map as
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            ref={inputRef}
            value={value}
            onChange={(e): void => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="filename"
            aria-label="Filename"
            style={{
              flex: 1,
              background: tokens.COLOR_INPUT_BG,
              border: `1px solid ${tokens.COLOR_INPUT_BORDER}`,
              borderRadius: 4,
              color: tokens.COLOR_NODE_TEXT,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              padding: '6px 8px',
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
          <span
            style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: tokens.COLOR_TEXT_MUTED,
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            .json
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            className="cf-save-cancel"
            onClick={onCancel}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
              borderRadius: 4,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              color: tokens.COLOR_TEXT_MUTED,
              cursor: 'pointer',
              transition: `background-color ${TRANSITION_FAST}`,
            }}
          >
            Cancel
          </button>
          <button
            className="cf-save-confirm"
            onClick={(): void => {
              if (canConfirm) onConfirm(value.trim())
            }}
            disabled={!canConfirm}
            style={{
              padding: '6px 14px',
              background: tokens.COLOR_NODE_SELECTED,
              border: 'none',
              borderRadius: 4,
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZE_SMALL,
              fontWeight: 600,
              color: '#0d1117',
              cursor: canConfirm ? 'pointer' : 'not-allowed',
              opacity: canConfirm ? 1 : 0.4,
              transition: `background-color ${TRANSITION_FAST}, opacity ${TRANSITION_FAST}`,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
