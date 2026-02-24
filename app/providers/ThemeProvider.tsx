"use client"

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUser } from '@/lib/users'
import { useSession } from 'next-auth/react'

type ThemeName = 'parchment' | 'shadowfell' | 'dragonfire' | 'feywild'
type ThemeMode = 'light' | 'dark'

interface ThemeState {
  primaryColor: string
  themeMode: ThemeMode
  themeName: ThemeName
}

interface ThemeContextValue {
  theme: ThemeState
  changePrimaryColor: (color: string) => void
  toggleThemeMode: () => void
  setThemeName: (name: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>({
    primaryColor: '#c8a44e',
    themeMode: "dark",
    themeName: "parchment",
  })

  const { data: session } = useSession()

  const changePrimaryColor = useCallback((color: string) => {
    setTheme((prev) => ({ ...prev, primaryColor: color }))
  }, [])

  const toggleThemeMode = useCallback(() => {
    setTheme((prev) => {
      const newMode: ThemeMode = prev.themeMode === 'light' ? 'dark' : 'light'
      localStorage.setItem('themeMode', newMode)
      return { ...prev, themeMode: newMode }
    })
  }, [])

  const setThemeName = useCallback((name: ThemeName) => {
    setTheme((prev) => {
      localStorage.setItem('themeName', name)
      return { ...prev, themeName: name }
    })
  }, [])

  const { data: user } = useQuery({
    queryKey: ['user', session?.user?.id],
    queryFn: () => fetchUser(session?.user?.id),
    enabled: !!session?.user?.id,
    staleTime: 300000,
  })

  useEffect(() => {
    if (user && Array.isArray(user) && user.length > 0) {
      const userData = user[0]
      if (userData.color) {
        changePrimaryColor(userData.color)
      }
    }
  }, [user, changePrimaryColor])

  useEffect(() => {
    const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || 'dark'
    const savedName = (localStorage.getItem('themeName') as ThemeName) || 'parchment'
    setTheme((prev) => ({ ...prev, themeMode: savedMode, themeName: savedName }))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme.themeName)
    root.setAttribute('data-mode', theme.themeMode)
    root.style.setProperty('--alt', theme.primaryColor)
  }, [theme.primaryColor, theme.themeMode, theme.themeName])

  return (
    <ThemeContext.Provider value={{ theme, changePrimaryColor, toggleThemeMode, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
