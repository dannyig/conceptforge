import React from 'react'
import { useTheme } from '@/hooks/use-theme'
import { FONT_FAMILY, FONT_SIZE_SMALL, TRANSITION_PANEL } from '@/lib/theme'

interface MissingKeyBannerProps {
  isVisible: boolean
  onOpenSettings: () => void
  onDismiss: () => void
}

export function MissingKeyBanner({
  isVisible,
  onOpenSettings,
  onDismiss,
}: MissingKeyBannerProps): React.JSX.Element {
  const { tokens } = useTheme()
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: isVisible ? 'translate(-50%, 0)' : 'translate(-50%, calc(100% + 48px))',
        transition: `transform ${TRANSITION_PANEL}`,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        backgroundColor: tokens.COLOR_PANEL_BG,
        border: `1px solid ${tokens.COLOR_NODE_BORDER}`,
        borderLeft: `3px solid ${tokens.COLOR_STATUS_ERROR}`,
        borderRadius: 6,
        fontFamily: FONT_FAMILY,
        fontSize: FONT_SIZE_SMALL,
        color: tokens.COLOR_TEXT_MUTED,
        maxWidth: 480,
        whiteSpace: 'nowrap',
      }}
    >
      <span>Add your Anthropic API key in Settings to use AI features.</span>
      <button
        onClick={onOpenSettings}
        style={{
          background: 'none',
          border: 'none',
          color: tokens.COLOR_NODE_TEXT,
          fontFamily: FONT_FAMILY,
          fontSize: FONT_SIZE_SMALL,
          fontWeight: '600',
          cursor: 'pointer',
          padding: '2px 4px',
          textDecoration: 'underline',
          flexShrink: 0,
        }}
      >
        Open Settings
      </button>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          color: tokens.COLOR_TEXT_MUTED,
          cursor: 'pointer',
          fontSize: '14px',
          padding: '2px 4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}
