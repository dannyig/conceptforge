import { useContext } from 'react'
import { ThemeContext } from '@/contexts/theme-context'
import type { Theme } from '@/lib/theme'
import type { ThemeContextValue } from '@/contexts/theme-context'

export const THEME_STORAGE_KEY = 'conceptforge:theme'

export function getOsThemePreference(): Theme {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
