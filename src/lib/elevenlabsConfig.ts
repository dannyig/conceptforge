const ELEVENLABS_KEY_STORAGE_KEY = 'conceptforge:elevenlabs-api-key'

// Default voice: Rachel — a warm, neutral English voice suitable for conversation
export const ELEVENLABS_DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

export function getElevenLabsKey(): string | null {
  return localStorage.getItem(ELEVENLABS_KEY_STORAGE_KEY)
}

export function setElevenLabsKey(key: string): void {
  localStorage.setItem(ELEVENLABS_KEY_STORAGE_KEY, key)
}

export function clearElevenLabsKey(): void {
  localStorage.removeItem(ELEVENLABS_KEY_STORAGE_KEY)
}
