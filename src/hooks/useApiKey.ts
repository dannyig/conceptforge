import { useCallback, useEffect, useState } from 'react'
import { API_KEY_CHANGED_EVENT, OPEN_SETTINGS_EVENT, getApiKey } from '@/lib/apiKey'

export function useApiKey(): {
  apiKey: string | null
  hasKey: boolean
  openSettings: () => void
} {
  const [apiKey, setKey] = useState<string | null>(() => getApiKey())

  useEffect((): (() => void) => {
    const syncKey = (): void => setKey(getApiKey())
    // API_KEY_CHANGED_EVENT fires on same-tab changes
    window.addEventListener(API_KEY_CHANGED_EVENT, syncKey)
    // storage event fires on cross-tab changes
    window.addEventListener('storage', syncKey)
    return (): void => {
      window.removeEventListener(API_KEY_CHANGED_EVENT, syncKey)
      window.removeEventListener('storage', syncKey)
    }
  }, [])

  const openSettings = useCallback((): void => {
    window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT))
  }, [])

  return {
    apiKey,
    hasKey: apiKey !== null && apiKey.length > 0,
    openSettings,
  }
}
