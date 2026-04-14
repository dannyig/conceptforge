import React, { createContext, useCallback, useMemo, useState } from 'react'
import { type Theme, type ThemeTokens, getThemeTokens } from '@/lib/theme'
import { THEME_STORAGE_KEY, getOsThemePreference } from '@/hooks/use-theme'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  tokens: ThemeTokens
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

  const setTheme = useCallback((t: Theme): void => {
    setThemeState(t)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t)
    } catch {
      // ignore
    }
  }, [])

  const tokens = useMemo(() => getThemeTokens(theme), [theme])

  const value = useMemo(
    (): ThemeContextValue => ({ theme, setTheme, tokens }),
    [theme, setTheme, tokens]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
