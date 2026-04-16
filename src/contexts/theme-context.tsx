import React, { createContext, useCallback, useMemo, useState } from 'react'
import { type Theme, type ThemeTokens, getThemeTokens } from '@/lib/theme'
import { THEME_STORAGE_KEY, getOsThemePreference } from '@/hooks/use-theme'
import { getHighContrast, setHighContrast } from '@/lib/contrastConfig'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  tokens: ThemeTokens
  highContrastNodes: boolean
  setHighContrastNodes: (value: boolean) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // localStorage unavailable — fall through to OS preference
  }
  return getOsThemePreference()
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)
  const [highContrastNodes, setHighContrastState] = useState<boolean>(getHighContrast)

  const setTheme = useCallback((t: Theme): void => {
    setThemeState(t)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t)
    } catch {
      // ignore
    }
  }, [])

  const setHighContrastNodes = useCallback((value: boolean): void => {
    setHighContrastState(value)
    setHighContrast(value)
  }, [])

  const tokens = useMemo(() => getThemeTokens(theme), [theme])

  const value = useMemo(
    (): ThemeContextValue => ({ theme, setTheme, tokens, highContrastNodes, setHighContrastNodes }),
    [theme, setTheme, tokens, highContrastNodes, setHighContrastNodes]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
