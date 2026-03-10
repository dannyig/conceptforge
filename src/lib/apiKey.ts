// API key localStorage operations — the only place in the codebase that touches the key
// Security rules: never log the key, never store it anywhere except localStorage

const API_KEY_STORAGE_KEY = 'conceptforge:anthropic-api-key'

// Custom events for cross-component communication
export const OPEN_SETTINGS_EVENT = 'conceptforge:open-settings' as const
export const API_KEY_CHANGED_EVENT = 'conceptforge:api-key-changed' as const

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_STORAGE_KEY, key)
  window.dispatchEvent(new CustomEvent(API_KEY_CHANGED_EVENT))
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent(API_KEY_CHANGED_EVENT))
}

export function isValidApiKeyFormat(key: string): boolean {
  return key.trim().length >= 20 && key.trim().startsWith('sk-ant-')
}
