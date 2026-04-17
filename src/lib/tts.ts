// TTS service — ElevenLabs streaming when available, blob fallback, speechSynthesis last resort
import { getElevenLabsKey, getElevenLabsVoiceId } from '@/lib/elevenlabsConfig'

const ELEVENLABS_TTS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech'
const ELEVENLABS_MODEL = 'eleven_turbo_v2_5'
const ELEVENLABS_VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75 }

let currentAudio: HTMLAudioElement | null = null
let currentObjectUrl: string | null = null
let currentStreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null

// Monotonically increasing; incremented by speak() so any in-flight call
// can detect it has been superseded and avoid settling its promise.
let activeSpeakId = 0

export function isSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused
}

export function stopSpeaking(): void {
  // Supersede any in-flight speak() call — their settle() will no-op
  activeSpeakId++
  if (currentStreamReader) {
    void currentStreamReader.cancel()
    currentStreamReader = null
  }
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.onplay = null
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

export async function speak(text: string, onStart?: () => void): Promise<void> {
  stopSpeaking()
  const callId = activeSpeakId
  const key = getElevenLabsKey()
  if (key) {
    try {
      return await speakElevenLabs(callId, text, key, onStart)
    } catch {
      // Fall through to browser TTS if ElevenLabs fails
    }
  }
  return speakBrowser(text, onStart)
}

async function speakElevenLabs(
  callId: number,
  text: string,
  apiKey: string,
  onStart?: () => void
): Promise<void> {
  if (typeof MediaSource !== 'undefined' && MediaSource.isTypeSupported('audio/mpeg')) {
    return speakElevenLabsStreaming(callId, text, apiKey, onStart)
  }
  return speakElevenLabsBlob(callId, text, apiKey, onStart)
}

// Streaming path: audio starts playing as first chunks arrive from ElevenLabs
async function speakElevenLabsStreaming(
  callId: number,
  text: string,
  apiKey: string,
  onStart?: () => void
): Promise<void> {
  const res = await fetch(`${ELEVENLABS_TTS_BASE}/${getElevenLabsVoiceId()}/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: ELEVENLABS_VOICE_SETTINGS,
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`)
  if (!res.body) throw new Error('No response body')

  // Abort early if superseded while fetching
  if (callId !== activeSpeakId) return new Promise(() => {})

  const mediaSource = new MediaSource()
  const objectUrl = URL.createObjectURL(mediaSource)
  const audio = new Audio(objectUrl)
  currentAudio = audio
  currentObjectUrl = objectUrl

  return new Promise<void>((resolve, reject) => {
    const pendingChunks: ArrayBuffer[] = []
    let streamDone = false
    let sourceBuffer: SourceBuffer | null = null
    let settled = false

    const settle = (err?: Error): void => {
      if (settled) return
      settled = true
      currentStreamReader = null
      // If this call has been superseded by stopSpeaking(), let the promise hang
      // so the caller's await never completes — preventing stale state transitions.
      if (callId !== activeSpeakId) return
      if (currentObjectUrl === objectUrl) {
        URL.revokeObjectURL(objectUrl)
        currentObjectUrl = null
      }
      currentAudio = null
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    }

    const tryFlush = (): void => {
      if (!sourceBuffer || sourceBuffer.updating) return
      if (pendingChunks.length > 0) {
        try {
          sourceBuffer.appendBuffer(pendingChunks.shift()!)
        } catch {
          /* ignore stale appends */
        }
        return
      }
      if (streamDone && mediaSource.readyState === 'open') {
        try {
          mediaSource.endOfStream()
        } catch {
          /* ignore */
        }
      }
    }

    mediaSource.addEventListener('sourceopen', () => {
      try {
        sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')
        sourceBuffer.mode = 'sequence'
      } catch (e) {
        settle(e instanceof Error ? e : new Error('SourceBuffer init failed'))
        return
      }
      sourceBuffer.addEventListener('updateend', tryFlush)

      const reader = res.body!.getReader()
      currentStreamReader = reader

      const pump = (): void => {
        reader
          .read()
          .then(({ done, value }) => {
            if (settled) return
            if (done) {
              streamDone = true
              currentStreamReader = null
              tryFlush()
              return
            }
            if (value?.length) {
              pendingChunks.push(
                value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
              )
              tryFlush()
            }
            pump()
          })
          .catch((err: unknown) => {
            if (!settled) settle(err instanceof Error ? err : new Error('Stream read error'))
          })
      }
      pump()
    })

    audio.onplay = (): void => {
      onStart?.()
    }
    audio.onended = (): void => {
      settle()
    }
    audio.onerror = (): void => {
      settle(new Error('Audio playback failed'))
    }

    void audio.play().catch((err: unknown) => {
      settle(err instanceof Error ? err : new Error('Audio play failed'))
    })
  })
}

// Blob fallback: download full audio then play (Safari, Firefox)
async function speakElevenLabsBlob(
  callId: number,
  text: string,
  apiKey: string,
  onStart?: () => void
): Promise<void> {
  const res = await fetch(`${ELEVENLABS_TTS_BASE}/${getElevenLabsVoiceId()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text,
      model_id: ELEVENLABS_MODEL,
      voice_settings: ELEVENLABS_VOICE_SETTINGS,
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs error ${res.status}`)

  if (callId !== activeSpeakId) return new Promise(() => {})

  const blob = await res.blob()

  if (callId !== activeSpeakId) return new Promise(() => {})

  const url = URL.createObjectURL(blob)
  currentObjectUrl = url
  const audio = new Audio(url)
  currentAudio = audio

  return new Promise((resolve, reject) => {
    audio.onplay = (): void => {
      onStart?.()
    }
    audio.onended = (): void => {
      if (callId !== activeSpeakId) return
      if (currentObjectUrl === url) {
        URL.revokeObjectURL(url)
        currentObjectUrl = null
      }
      currentAudio = null
      resolve()
    }
    audio.onerror = (): void => {
      if (callId !== activeSpeakId) return
      if (currentObjectUrl === url) {
        URL.revokeObjectURL(url)
        currentObjectUrl = null
      }
      currentAudio = null
      reject(new Error('Audio playback failed'))
    }
    void audio.play().catch(err => {
      if (callId !== activeSpeakId) return
      currentAudio = null
      reject(err)
    })
  })
}

function speakBrowser(text: string, onStart?: () => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onstart = (): void => {
      onStart?.()
    }
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
