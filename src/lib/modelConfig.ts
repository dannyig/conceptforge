// K-14: Claude model selector — localStorage get/set with fixed model list

export const MODEL_CONFIG_KEY = 'conceptforge:claude-model'
export const DEFAULT_MODEL = 'claude-sonnet-4-6'

export const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-opus-4-6', label: 'Opus 4.6' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
] as const

export type ClaudeModelId = (typeof CLAUDE_MODELS)[number]['id']

const VALID_IDS: readonly string[] = CLAUDE_MODELS.map(m => m.id)

export function getModel(): ClaudeModelId {
  const stored = localStorage.getItem(MODEL_CONFIG_KEY)
  if (stored && VALID_IDS.includes(stored)) return stored as ClaudeModelId
  return DEFAULT_MODEL
}

export function setModel(id: ClaudeModelId): void {
  localStorage.setItem(MODEL_CONFIG_KEY, id)
}
