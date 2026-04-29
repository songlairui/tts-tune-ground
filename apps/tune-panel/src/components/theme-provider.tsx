import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderState {
  theme: Theme
  resolvedTheme: 'dark' | 'light'
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | null>(null)

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function applyTheme(resolved: 'dark' | 'light') {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'tts-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(getSystemTheme())
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (t: Theme) => {
    localStorage.setItem(storageKey, t)
    setThemeState(t)
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeProviderContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
