import { useCallback, useEffect, useState } from 'react'
import {
  AI_ASSIST_CHANGED_EVENT,
  API_KEY_CHANGED_EVENT,
  OPEN_SETTINGS_EVENT,
  getAiAssist,
  getApiKey,
} from '@/lib/apiKey'

export function useApiKey(): {
  apiKey: string | null
  hasKey: boolean
  aiAssistEnabled: boolean
  openSettings: () => void
} {
  const [apiKey, setKey] = useState<string | null>(() => getApiKey())
  const [aiAssistEnabled, setAiAssistEnabled] = useState<boolean>(() => getAiAssist())

  useEffect((): (() => void) => {
    const syncKey = (): void => setKey(getApiKey())
    const syncAssist = (): void => setAiAssistEnabled(getAiAssist())
    window.addEventListener(API_KEY_CHANGED_EVENT, syncKey)
    window.addEventListener(API_KEY_CHANGED_EVENT, syncAssist)
    window.addEventListener(AI_ASSIST_CHANGED_EVENT, syncAssist)
    window.addEventListener('storage', syncKey)
    window.addEventListener('storage', syncAssist)
    return (): void => {
      window.removeEventListener(API_KEY_CHANGED_EVENT, syncKey)
      window.removeEventListener(API_KEY_CHANGED_EVENT, syncAssist)
      window.removeEventListener(AI_ASSIST_CHANGED_EVENT, syncAssist)
      window.removeEventListener('storage', syncKey)
      window.removeEventListener('storage', syncAssist)
    }
  }, [])

  const openSettings = useCallback((): void => {
    window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
  }, [])

  return {
    apiKey,
    hasKey: apiKey !== null && apiKey.length > 0,
    aiAssistEnabled,
    openSettings,
  }
}
