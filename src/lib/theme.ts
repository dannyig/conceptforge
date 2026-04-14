// Design tokens — single source of truth for all visual constants
// Never hardcode a colour, size, or timing value in a component

// ─── Theme type ────────────────────────────────────────────────────────────────
export type Theme = 'dark' | 'light'

// ─── ThemeTokens interface ─────────────────────────────────────────────────────
// All colour tokens that differ between Dark and Light themes.
// Non-colour constants (sizing, timing, fonts) remain as top-level exports below.
export interface ThemeTokens {
  // Canvas
  COLOR_CANVAS_BG: string
  COLOR_BG_DOT: string
  // Nodes
  COLOR_NODE_BG: string
  COLOR_NODE_BORDER: string
  COLOR_NODE_TEXT: string
  COLOR_NODE_SELECTED: string
  COLOR_NODE_GLOW: string
  COLOR_NODE_INFO_DOT: string
  // Edges
  COLOR_EDGE: string
  COLOR_EDGE_SELECTED: string
  COLOR_HANDLE: string
  COLOR_HANDLE_HOVER: string
  // Minimap
  COLOR_MINIMAP_BG: string
  COLOR_MINIMAP_MASK: string
  COLOR_MINIMAP_BORDER: string
  // Controls
  COLOR_CONTROLS_BG: string
  COLOR_CONTROLS_BORDER: string
  COLOR_CONTROLS_TEXT: string
  COLOR_CONTROLS_HOVER_BG: string
  // Panels & inputs
  COLOR_PANEL_BG: string
  COLOR_PANEL_OVERLAY: string
  COLOR_INPUT_BG: string
  COLOR_INPUT_BORDER: string
  COLOR_INPUT_FOCUS_BORDER: string
  // Buttons
  COLOR_BUTTON_PRIMARY_BG: string
  COLOR_BUTTON_PRIMARY_TEXT: string
  COLOR_BUTTON_PRIMARY_HOVER_BG: string
  COLOR_BUTTON_GHOST_HOVER_BG: string
  // Status
  COLOR_STATUS_SUCCESS: string
  COLOR_STATUS_ERROR: string
  COLOR_TEXT_MUTED: string
  // AI thinking border
  COLOR_THINKING_BORDER_DEEP: string
  COLOR_THINKING_BORDER_SKY: string
  // Summary panel
  COLOR_SUMMARY_BG: string
  COLOR_SUMMARY_BORDER: string
  COLOR_SUMMARY_LINK: string
  COLOR_SUMMARY_LINK_HOVER: string
  // Hint ticker
  COLOR_TICKER_BG: string
  COLOR_TICKER_BORDER: string
  COLOR_TICKER_TEXT: string
  COLOR_TICKER_RESTORE_BG: string
  // Notes
  NOTE_COLORS: readonly string[]
  NOTE_DEFAULT_COLOR: string
}

// ─── Dark theme ────────────────────────────────────────────────────────────────
export const DARK_TOKENS: ThemeTokens = {
  COLOR_CANVAS_BG: '#0d1117',
  COLOR_BG_DOT: '#21262d',
  COLOR_NODE_BG: '#161b22',
  COLOR_NODE_BORDER: '#30363d',
  COLOR_NODE_TEXT: '#e6edf3',
  COLOR_NODE_SELECTED: '#f97316',
  COLOR_NODE_GLOW: 'rgba(249,115,22,0.25)',
  COLOR_NODE_INFO_DOT: '#22c55e',
  COLOR_EDGE: '#4b5563',
  COLOR_EDGE_SELECTED: '#f97316',
  COLOR_HANDLE: '#4b5563',
  COLOR_HANDLE_HOVER: '#f97316',
  COLOR_MINIMAP_BG: '#0d1117',
  COLOR_MINIMAP_MASK: 'rgba(13,17,23,0.7)',
  COLOR_MINIMAP_BORDER: '#30363d',
  COLOR_CONTROLS_BG: '#161b22',
  COLOR_CONTROLS_BORDER: '#30363d',
  COLOR_CONTROLS_TEXT: '#e6edf3',
  COLOR_CONTROLS_HOVER_BG: '#21262d',
  COLOR_PANEL_BG: '#161b22',
  COLOR_PANEL_OVERLAY: 'rgba(13,17,23,0.6)',
  COLOR_INPUT_BG: '#0d1117',
  COLOR_INPUT_BORDER: '#30363d',
  COLOR_INPUT_FOCUS_BORDER: '#f97316',
  COLOR_BUTTON_PRIMARY_BG: '#f97316',
  COLOR_BUTTON_PRIMARY_TEXT: '#0d1117',
  COLOR_BUTTON_PRIMARY_HOVER_BG: '#ea6c0a',
  COLOR_BUTTON_GHOST_HOVER_BG: '#21262d',
  COLOR_STATUS_SUCCESS: '#3fb950',
  COLOR_STATUS_ERROR: '#f85149',
  COLOR_TEXT_MUTED: '#8b949e',
  COLOR_THINKING_BORDER_DEEP: '#1e40af',
  COLOR_THINKING_BORDER_SKY: '#38bdf8',
  COLOR_SUMMARY_BG: 'rgba(13,17,23,0.72)',
  COLOR_SUMMARY_BORDER: '#21262d',
  COLOR_SUMMARY_LINK: '#f97316',
  COLOR_SUMMARY_LINK_HOVER: '#ea6c0a',
  COLOR_TICKER_BG: 'rgba(13,17,23,0.88)',
  COLOR_TICKER_BORDER: '#21262d',
  COLOR_TICKER_TEXT: '#6e7681',
  COLOR_TICKER_RESTORE_BG: 'rgba(22,27,34,0.9)',
  NOTE_COLORS: [
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
  ],
  NOTE_DEFAULT_COLOR: '#1e3a5f',
}

// ─── Light theme ───────────────────────────────────────────────────────────────
// Crisp, precise, technical — same orange accent throughout
export const LIGHT_TOKENS: ThemeTokens = {
  COLOR_CANVAS_BG: '#f0f2f5',
  COLOR_BG_DOT: '#c8cdd5',
  COLOR_NODE_BG: '#ffffff',
  COLOR_NODE_BORDER: '#c8cdd5',
  COLOR_NODE_TEXT: '#1c2128',
  COLOR_NODE_SELECTED: '#f97316',
  COLOR_NODE_GLOW: 'rgba(249,115,22,0.20)',
  COLOR_NODE_INFO_DOT: '#16a34a',
  COLOR_EDGE: '#8b949e',
  COLOR_EDGE_SELECTED: '#f97316',
  COLOR_HANDLE: '#8b949e',
  COLOR_HANDLE_HOVER: '#f97316',
  COLOR_MINIMAP_BG: '#e8ebf0',
  COLOR_MINIMAP_MASK: 'rgba(240,242,245,0.75)',
  COLOR_MINIMAP_BORDER: '#c8cdd5',
  COLOR_CONTROLS_BG: '#ffffff',
  COLOR_CONTROLS_BORDER: '#c8cdd5',
  COLOR_CONTROLS_TEXT: '#1c2128',
  COLOR_CONTROLS_HOVER_BG: '#eaecef',
  COLOR_PANEL_BG: '#ffffff',
  COLOR_PANEL_OVERLAY: 'rgba(0,0,0,0.18)',
  COLOR_INPUT_BG: '#f6f8fa',
  COLOR_INPUT_BORDER: '#c8cdd5',
  COLOR_INPUT_FOCUS_BORDER: '#f97316',
  COLOR_BUTTON_PRIMARY_BG: '#f97316',
  COLOR_BUTTON_PRIMARY_TEXT: '#ffffff',
  COLOR_BUTTON_PRIMARY_HOVER_BG: '#ea6c0a',
  COLOR_BUTTON_GHOST_HOVER_BG: '#eaecef',
  COLOR_STATUS_SUCCESS: '#1a7f37',
  COLOR_STATUS_ERROR: '#cf222e',
  COLOR_TEXT_MUTED: '#6e7681',
  COLOR_THINKING_BORDER_DEEP: '#1e40af',
  COLOR_THINKING_BORDER_SKY: '#0ea5e9',
  COLOR_SUMMARY_BG: 'rgba(255,255,255,0.94)',
  COLOR_SUMMARY_BORDER: '#c8cdd5',
  COLOR_SUMMARY_LINK: '#f97316',
  COLOR_SUMMARY_LINK_HOVER: '#ea6c0a',
  COLOR_TICKER_BG: 'rgba(240,242,245,0.95)',
  COLOR_TICKER_BORDER: '#c8cdd5',
  COLOR_TICKER_TEXT: '#57606a',
  COLOR_TICKER_RESTORE_BG: 'rgba(240,242,245,0.95)',
  NOTE_COLORS: [
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
  ],
  NOTE_DEFAULT_COLOR: '#1e3a5f',
}

// ─── Token resolver ────────────────────────────────────────────────────────────
export function getThemeTokens(theme: Theme): ThemeTokens {
  return theme === 'light' ? LIGHT_TOKENS : DARK_TOKENS
}

// ─── Backward-compat named exports (dark theme defaults) ───────────────────────
// Components that use useTheme() read tokens from context.
// These named exports remain for non-reactive use (e.g. NODE_TYPES default edge options).
export const COLOR_CANVAS_BG = DARK_TOKENS.COLOR_CANVAS_BG
export const COLOR_NODE_BG = DARK_TOKENS.COLOR_NODE_BG
export const COLOR_NODE_BORDER = DARK_TOKENS.COLOR_NODE_BORDER
export const COLOR_NODE_TEXT = DARK_TOKENS.COLOR_NODE_TEXT
export const COLOR_NODE_SELECTED = DARK_TOKENS.COLOR_NODE_SELECTED
export const COLOR_NODE_GLOW = DARK_TOKENS.COLOR_NODE_GLOW
export const COLOR_NODE_INFO_DOT = DARK_TOKENS.COLOR_NODE_INFO_DOT
export const COLOR_EDGE = DARK_TOKENS.COLOR_EDGE
export const COLOR_EDGE_SELECTED = DARK_TOKENS.COLOR_EDGE_SELECTED
export const COLOR_HANDLE = DARK_TOKENS.COLOR_HANDLE
export const COLOR_HANDLE_HOVER = DARK_TOKENS.COLOR_HANDLE_HOVER
export const COLOR_BG_DOT = DARK_TOKENS.COLOR_BG_DOT
export const COLOR_MINIMAP_BG = DARK_TOKENS.COLOR_MINIMAP_BG
export const COLOR_MINIMAP_MASK = DARK_TOKENS.COLOR_MINIMAP_MASK
export const COLOR_MINIMAP_BORDER = DARK_TOKENS.COLOR_MINIMAP_BORDER
export const COLOR_CONTROLS_BG = DARK_TOKENS.COLOR_CONTROLS_BG
export const COLOR_CONTROLS_BORDER = DARK_TOKENS.COLOR_CONTROLS_BORDER
export const COLOR_CONTROLS_TEXT = DARK_TOKENS.COLOR_CONTROLS_TEXT
export const COLOR_CONTROLS_HOVER_BG = DARK_TOKENS.COLOR_CONTROLS_HOVER_BG
export const COLOR_PANEL_BG = DARK_TOKENS.COLOR_PANEL_BG
export const COLOR_PANEL_OVERLAY = DARK_TOKENS.COLOR_PANEL_OVERLAY
export const COLOR_INPUT_BG = DARK_TOKENS.COLOR_INPUT_BG
export const COLOR_INPUT_BORDER = DARK_TOKENS.COLOR_INPUT_BORDER
export const COLOR_INPUT_FOCUS_BORDER = DARK_TOKENS.COLOR_INPUT_FOCUS_BORDER
export const COLOR_BUTTON_PRIMARY_BG = DARK_TOKENS.COLOR_BUTTON_PRIMARY_BG
export const COLOR_BUTTON_PRIMARY_TEXT = DARK_TOKENS.COLOR_BUTTON_PRIMARY_TEXT
export const COLOR_BUTTON_PRIMARY_HOVER_BG = DARK_TOKENS.COLOR_BUTTON_PRIMARY_HOVER_BG
export const COLOR_BUTTON_GHOST_HOVER_BG = DARK_TOKENS.COLOR_BUTTON_GHOST_HOVER_BG
export const COLOR_STATUS_SUCCESS = DARK_TOKENS.COLOR_STATUS_SUCCESS
export const COLOR_STATUS_ERROR = DARK_TOKENS.COLOR_STATUS_ERROR
export const COLOR_TEXT_MUTED = DARK_TOKENS.COLOR_TEXT_MUTED
export const COLOR_THINKING_BORDER_DEEP = DARK_TOKENS.COLOR_THINKING_BORDER_DEEP
export const COLOR_THINKING_BORDER_SKY = DARK_TOKENS.COLOR_THINKING_BORDER_SKY
export const COLOR_SUMMARY_BG = DARK_TOKENS.COLOR_SUMMARY_BG
export const COLOR_SUMMARY_BORDER = DARK_TOKENS.COLOR_SUMMARY_BORDER
export const COLOR_SUMMARY_LINK = DARK_TOKENS.COLOR_SUMMARY_LINK
export const COLOR_SUMMARY_LINK_HOVER = DARK_TOKENS.COLOR_SUMMARY_LINK_HOVER
export const COLOR_TICKER_BG = DARK_TOKENS.COLOR_TICKER_BG
export const COLOR_TICKER_BORDER = DARK_TOKENS.COLOR_TICKER_BORDER
export const COLOR_TICKER_TEXT = DARK_TOKENS.COLOR_TICKER_TEXT
export const COLOR_TICKER_RESTORE_BG = DARK_TOKENS.COLOR_TICKER_RESTORE_BG
export const NOTE_COLORS: readonly string[] = DARK_TOKENS.NOTE_COLORS
export const NOTE_DEFAULT_COLOR = DARK_TOKENS.NOTE_DEFAULT_COLOR

// ─── Static tokens (theme-independent) ────────────────────────────────────────
// Background dot geometry
export const BG_DOT_SIZE = 1.5
export const BG_DOT_GAP = 24

// Typography
export const FONT_FAMILY = "'JetBrains Mono', 'Fira Code', monospace"
export const FONT_SIZE_NODE_LABEL = '14px'
export const FONT_SIZE_EDGE_LABEL = '10px'
export const FONT_WEIGHT_NODE_LABEL = '500'

// Motion — all transitions use these timings
export const TRANSITION_FAST = '100ms ease'
export const TRANSITION_NORMAL = '180ms ease'
export const TRANSITION_PANEL = '220ms ease'

// Settings panel
export const SETTINGS_PANEL_WIDTH = '360px'
export const FONT_SIZE_SMALL = '12px'
export const FONT_SIZE_BASE = '14px'
export const FONT_SIZE_FOCUS_QUESTION = '15px'

// Focus question bar
export const FOCUS_BAR_HEIGHT = 52

// Hint Ticker (H-01→H-06)
export const TICKER_HEIGHT = 26
export const TICKER_FONT_SIZE = '13px'
export const TICKER_FADE_MS = 600 // fade in / fade out duration (ms)
export const TICKER_READ_MS = 5500 // pause-to-read duration (ms)

// Fit-to-view animation (A-25)
export const FIT_VIEW_DURATION_MS = 400

// V-12: Thinking/Expanding indicator animated gradient border
export const THINKING_BORDER_DURATION_MS = 2000

// Summary Panel (A-16 → A-22)
export const SUMMARY_PANEL_WIDTH = 300
export const TYPEWRITER_CHAR_DELAY_MS = 18
// MiniMap bottom offset (TICKER_HEIGHT + 2) + minimap height (~152) + gap (8)
export const SUMMARY_PANEL_BOTTOM = 188

// Notes & Groups (G-01→G-10)
export const NOTE_DEFAULT_WIDTH = 200
export const NOTE_DEFAULT_HEIGHT = 120
export const NOTE_TEXT_SIZES: Record<'small' | 'medium' | 'large', string> = {
  small: '11px',
  medium: '14px',
  large: '18px',
}
