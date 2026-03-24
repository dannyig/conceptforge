// API key localStorage operations — the only place in the codebase that touches the key
// Security rules: never log the key, never store it anywhere except localStorage

const API_KEY_STORAGE_KEY = 'conceptforge:anthropic-api-key'
const AI_ASSIST_STORAGE_KEY = 'conceptforge:ai-assist'

// Custom events for cross-component communication
export const OPEN_SETTINGS_EVENT = 'conceptforge:open-settings' as const
export const API_KEY_CHANGED_EVENT = 'conceptforge:api-key-changed' as const
export const AI_ASSIST_CHANGED_EVENT = 'conceptforge:ai-assist-changed' as const

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key)
  // K-06: auto-enable AI Assist when a key is saved
  localStorage.setItem(AI_ASSIST_STORAGE_KEY, 'true')
  window.dispatchEvent(new CustomEvent(API_KEY_CHANGED_EVENT))
  window.dispatchEvent(new CustomEvent(AI_ASSIST_CHANGED_EVENT))
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY)
  // K-06: auto-disable AI Assist when key is removed
  localStorage.setItem(AI_ASSIST_STORAGE_KEY, 'false')
  window.dispatchEvent(new CustomEvent(API_KEY_CHANGED_EVENT))
  window.dispatchEvent(new CustomEvent(AI_ASSIST_CHANGED_EVENT))
}

// K-07: returns false if no API key is stored, regardless of persisted value
export function getAiAssist(): boolean {
  if (!getApiKey()) return false
  return localStorage.getItem(AI_ASSIST_STORAGE_KEY) === 'true'
}

export function setAiAssist(enabled: boolean): void {
  localStorage.setItem(AI_ASSIST_STORAGE_KEY, enabled ? 'true' : 'false')
  window.dispatchEvent(new CustomEvent(AI_ASSIST_CHANGED_EVENT))
}

export function isValidApiKeyFormat(key: string): boolean {
  return key.trim().length >= 20 && key.trim().startsWith('sk-ant-')
}
