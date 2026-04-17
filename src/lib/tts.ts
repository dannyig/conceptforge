// TTS service — ElevenLabs when key is stored, speechSynthesis fallback
import { getElevenLabsKey, ELEVENLABS_DEFAULT_VOICE_ID } from '@/lib/elevenlabsConfig'

const ELEVENLABS_TTS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech'

let currentAudio: HTMLAudioElement | null = null
let currentObjectUrl: string | null = null

export function isSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.onended = null
    currentAudio.onerror = null
    currentAudio = null
  }
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = null
  }
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel()
  }
}

export async function speak(text: string): Promise<void> {
  stopSpeaking()
  const key = getElevenLabsKey()
  if (key) {
    try {
      return await speakElevenLabs(text, key)
    } catch {
      // Fall through to browser TTS if ElevenLabs fails
    }
  }
  return speakBrowser(text)
}

async function speakElevenLabs(text: string, apiKey: string): Promise<void> {
  const res = await fetch(`${ELEVENLABS_TTS_BASE}/${ELEVENLABS_DEFAULT_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`)

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  currentObjectUrl = url
  const audio = new Audio(url)
  currentAudio = audio

  return new Promise((resolve, reject) => {
    audio.onended = (): void => {
      if (currentObjectUrl === url) {
        URL.revokeObjectURL(url)
        currentObjectUrl = null
      }
      currentAudio = null
      resolve()
    }
    audio.onerror = (): void => {
      if (currentObjectUrl === url) {
        URL.revokeObjectURL(url)
        currentObjectUrl = null
      }
      currentAudio = null
      reject(new Error('Audio playback failed'))
    }
    void audio.play().catch(err => {
      currentAudio = null
      reject(err)
    })
  })
}

function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = (): void => resolve()
    utterance.onerror = (e: SpeechSynthesisErrorEvent): void => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        resolve()
      } else {
        reject(new Error(`TTS error: ${e.error}`))
      }
    }
    speechSynthesis.speak(utterance)
  })
}
