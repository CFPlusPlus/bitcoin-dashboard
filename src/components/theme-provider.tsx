import { useLayoutEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from '@/lib/theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  // Apply before paint and before chart effects read the current CSS tokens.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* Theme still works when storage is unavailable. */
    }
  }, [theme])
  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((value) => (value === 'dark' ? 'light' : 'dark')),
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
