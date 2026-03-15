// Design tokens — single source of truth for all visual constants
// Never hardcode a colour, size, or timing value in a component

// Colour tokens
export const COLOR_CANVAS_BG = '#0d1117'
export const COLOR_NODE_BG = '#161b22'
export const COLOR_NODE_BORDER = '#30363d'
export const COLOR_NODE_TEXT = '#e6edf3'
export const COLOR_NODE_SELECTED = '#f97316'
export const COLOR_NODE_GLOW = 'rgba(249,115,22,0.25)'
export const COLOR_EDGE = '#4b5563'
export const COLOR_EDGE_SELECTED = '#f97316'
export const COLOR_HANDLE = '#4b5563'
export const COLOR_HANDLE_HOVER = '#f97316'
export const COLOR_BG_DOT = '#21262d'

// Minimap tokens
export const COLOR_MINIMAP_BG = '#0d1117'
export const COLOR_MINIMAP_MASK = 'rgba(13,17,23,0.7)'
export const COLOR_MINIMAP_BORDER = '#30363d'

// Controls tokens
export const COLOR_CONTROLS_BG = '#161b22'
export const COLOR_CONTROLS_BORDER = '#30363d'
export const COLOR_CONTROLS_TEXT = '#e6edf3'
export const COLOR_CONTROLS_HOVER_BG = '#21262d'

// Background dot geometry
export const BG_DOT_SIZE = 1.5
export const BG_DOT_GAP = 24

// Typography
export const FONT_FAMILY = "'JetBrains Mono', 'Fira Code', monospace"
export const FONT_SIZE_NODE_LABEL = '13px'
export const FONT_SIZE_EDGE_LABEL = '9px'
export const FONT_WEIGHT_NODE_LABEL = '500'

// Motion — all transitions use these timings
export const TRANSITION_FAST = '100ms ease'
export const TRANSITION_NORMAL = '180ms ease'
export const TRANSITION_PANEL = '220ms ease'

// Settings panel
export const COLOR_PANEL_BG = '#161b22'
export const COLOR_PANEL_OVERLAY = 'rgba(13,17,23,0.6)'
export const COLOR_INPUT_BG = '#0d1117'
export const COLOR_INPUT_BORDER = '#30363d'
export const COLOR_INPUT_FOCUS_BORDER = '#f97316'
export const COLOR_BUTTON_PRIMARY_BG = '#f97316'
export const COLOR_BUTTON_PRIMARY_TEXT = '#0d1117'
export const COLOR_BUTTON_PRIMARY_HOVER_BG = '#ea6c0a'
export const COLOR_BUTTON_GHOST_HOVER_BG = '#21262d'
export const COLOR_STATUS_SUCCESS = '#3fb950'
export const COLOR_STATUS_ERROR = '#f85149'
export const COLOR_TEXT_MUTED = '#8b949e'
export const SETTINGS_PANEL_WIDTH = '360px'
export const FONT_SIZE_SMALL = '12px'
export const FONT_SIZE_BASE = '14px'
export const FONT_SIZE_FOCUS_QUESTION = '15px'

// Focus question bar
export const FOCUS_BAR_HEIGHT = 52

// Hint Ticker (H-01→H-06)
export const COLOR_TICKER_BG = 'rgba(13,17,23,0.88)'
export const COLOR_TICKER_BORDER = '#21262d'
export const COLOR_TICKER_TEXT = '#6e7681'
export const COLOR_TICKER_RESTORE_BG = 'rgba(22,27,34,0.9)'
export const TICKER_HEIGHT = 26
export const TICKER_FONT_SIZE = '13px'
export const TICKER_FADE_MS = 600 // fade in / fade out duration (ms)
export const TICKER_READ_MS = 5500 // pause-to-read duration (ms)

// Notes & Groups (G-01→G-10)
// 10 dark colours that all yield near-white contrast text via the luminance formula
export const NOTE_COLORS: readonly string[] = [
  '#1e3a5f', // dark blue (default)
  '#166534', // dark green
  '#854d0e', // dark amber
  '#4a1942', // dark purple
  '#7f1d1d', // dark red
  '#134e4a', // dark teal
  '#3b2f00', // dark yellow-brown
  '#1c1c3a', // dark indigo
  '#2d1b00', // dark orange-brown
  '#1a2e1a', // dark forest
]
export const NOTE_DEFAULT_COLOR = '#1e3a5f'
export const NOTE_DEFAULT_WIDTH = 200
export const NOTE_DEFAULT_HEIGHT = 120
export const NOTE_TEXT_SIZES: Record<'small' | 'medium' | 'large', string> = {
  small: '11px',
  medium: '14px',
  large: '18px',
}
