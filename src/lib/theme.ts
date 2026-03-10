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
export const FONT_WEIGHT_NODE_LABEL = '500'

// Motion — all transitions use these timings
export const TRANSITION_FAST = '100ms ease'
export const TRANSITION_NORMAL = '180ms ease'
