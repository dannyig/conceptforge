const ELEVENLABS_KEY_STORAGE_KEY = 'conceptforge:elevenlabs-api-key'
const ELEVENLABS_VOICE_ID_STORAGE_KEY = 'conceptforge:elevenlabs-voice-id'
const ELEVENLABS_ENABLED_STORAGE_KEY = 'conceptforge:elevenlabs-enabled'

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

// Returns the stored voice ID, or the default Rachel voice if none is set
export function getElevenLabsVoiceId(): string {
  return localStorage.getItem(ELEVENLABS_VOICE_ID_STORAGE_KEY) ?? ELEVENLABS_DEFAULT_VOICE_ID
}

export function setElevenLabsVoiceId(id: string): void {
  localStorage.setItem(ELEVENLABS_VOICE_ID_STORAGE_KEY, id)
}

export function clearElevenLabsVoiceId(): void {
  localStorage.removeItem(ELEVENLABS_VOICE_ID_STORAGE_KEY)
}

// K-18: ElevenLabs TTS enabled toggle — defaults off
export function getElevenLabsEnabled(): boolean {
  return localStorage.getItem(ELEVENLABS_ENABLED_STORAGE_KEY) === 'true'
}

export function setElevenLabsEnabled(enabled: boolean): void {
  localStorage.setItem(ELEVENLABS_ENABLED_STORAGE_KEY, String(enabled))
}
