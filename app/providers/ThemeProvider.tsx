"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchUser } from '@/lib/users'
import { useSession } from 'next-auth/react'

type ThemeName = 'parchment' | 'shadowfell' | 'dragonfire' | 'feywild'
type ThemeMode = 'light' | 'dark'

interface ThemeState {
  primaryColor: string
  themeMode: ThemeMode
  themeName: ThemeName
  particleEffect: string
  coronaIntensity: number
}

interface ThemeContextValue {
  theme: ThemeState
  updateSettings: (partial: Partial<ThemeState>) => void
  saveSettings: () => Promise<void>
  hasUnsavedChanges: boolean
  isSaving: boolean
}

const DEFAULTS: ThemeState = {
  primaryColor: '#c8a44e',
  themeMode: 'dark',
  themeName: 'parchment',
  particleEffect: 'auto',
  coronaIntensity: 0.5,
}

const AUTO_PARTICLES: Record<string, string> = {
  parchment: 'ember',
  shadowfell: 'wisp',
  dragonfire: 'flame',
  feywild: 'sparkle',
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(DEFAULTS)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const initializedRef = useRef(false)

  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user', session?.user?.id],
    queryFn: () => fetchUser(session?.user?.id),
    enabled: !!session?.user?.id,
    staleTime: 300000,
  })

  // Load from DB when authenticated user data arrives
  useEffect(() => {
    if (user && !Array.isArray(user) && user.id) {
      setTheme({
        primaryColor: user.color || DEFAULTS.primaryColor,
        themeMode: (user.theme_mode as ThemeMode) || DEFAULTS.themeMode,
        themeName: (user.theme_name as ThemeName) || DEFAULTS.themeName,
        particleEffect: user.particle_effect || DEFAULTS.particleEffect,
        coronaIntensity: user.corona_intensity ?? DEFAULTS.coronaIntensity,
      })
      setHasUnsavedChanges(false)
      initializedRef.current = true
    }
  }, [user])

  // Fallback: load from localStorage for unauthenticated users
  useEffect(() => {
    if (!session?.user) {
      const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || DEFAULTS.themeMode
      const savedName = (localStorage.getItem('themeName') as ThemeName) || DEFAULTS.themeName
      setTheme((prev) => ({ ...prev, themeMode: savedMode, themeName: savedName }))
      initializedRef.current = true
    }
  }, [session?.user])

  // Apply DOM attributes whenever theme changes
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme.themeName)
    root.setAttribute('data-mode', theme.themeMode)

    // Override primary color and derived variables
    const hex = theme.primaryColor
    root.style.setProperty('--primary', hex)
    root.style.setProperty('--ring', hex)
    root.style.setProperty('--alt', hex)

    // Convert hex to RGB for corona-rgb
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    root.style.setProperty('--corona-rgb', `${r}, ${g}, ${b}`)

    const resolvedParticle = theme.particleEffect === 'auto'
      ? AUTO_PARTICLES[theme.themeName] || 'ember'
      : theme.particleEffect
    root.setAttribute('data-particle', resolvedParticle)

    root.style.setProperty('--corona-intensity', String(theme.coronaIntensity))
  }, [theme.primaryColor, theme.themeMode, theme.themeName, theme.particleEffect, theme.coronaIntensity])

  const updateSettings = useCallback((partial: Partial<ThemeState>) => {
    setTheme((prev) => ({ ...prev, ...partial }))
    setHasUnsavedChanges(true)

    // For unauthenticated users, persist theme/mode to localStorage
    if (!session?.user) {
      if (partial.themeMode) localStorage.setItem('themeMode', partial.themeMode)
      if (partial.themeName) localStorage.setItem('themeName', partial.themeName)
    }
  }, [session?.user])

  const saveSettings = useCallback(async () => {
    if (!session?.user?.id) return
    setIsSaving(true)

    try {
      await fetch(`/api/users/${session.user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color: theme.primaryColor,
          themeName: theme.themeName,
          themeMode: theme.themeMode,
          particleEffect: theme.particleEffect,
          coronaIntensity: theme.coronaIntensity,
        }),
      })

      await queryClient.invalidateQueries({ queryKey: ['user', session.user.id] })
      setHasUnsavedChanges(false)
    } finally {
      setIsSaving(false)
    }
  }, [session?.user?.id, theme, queryClient])

  return (
    <ThemeContext.Provider value={{ theme, updateSettings, saveSettings, hasUnsavedChanges, isSaving }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
