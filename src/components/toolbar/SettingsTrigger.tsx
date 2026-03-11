import React from 'react'
import {
  COLOR_BUTTON_GHOST_HOVER_BG,
  COLOR_NODE_BORDER,
  COLOR_NODE_TEXT,
  COLOR_PANEL_BG,
  COLOR_TEXT_MUTED,
  FONT_FAMILY,
  TRANSITION_FAST,
} from '@/lib/theme'

interface SettingsTriggerProps {
  onOpen: () => void
}

// Gear icon SVG
function GearIcon(): React.JSX.Element {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" />
      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.892 3.433-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.892-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z" />
    </svg>
  )
}

export function SettingsTrigger({ onOpen }: SettingsTriggerProps): React.JSX.Element {
  return (
    <button
      onClick={onOpen}
      aria-label="Open settings"
      className="cf-settings-trigger"
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        backgroundColor: COLOR_PANEL_BG,
        border: `1px solid ${COLOR_NODE_BORDER}`,
        borderRadius: 6,
        color: COLOR_TEXT_MUTED,
        fontFamily: FONT_FAMILY,
        fontSize: '12px',
        cursor: 'pointer',
        transition: `background-color ${TRANSITION_FAST}, color ${TRANSITION_FAST}`,
      }}
    >
      <style>{`
        .cf-settings-trigger:hover { background-color: ${COLOR_BUTTON_GHOST_HOVER_BG} !important; color: ${COLOR_NODE_TEXT} !important; }
        .cf-settings-trigger:focus-visible { outline: 2px solid #f97316; outline-offset: 2px; }
      `}</style>
      <GearIcon />
      <span>Settings</span>
    </button>
  )
}
