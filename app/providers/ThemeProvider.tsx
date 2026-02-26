"use client"

import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useMemo } from 'react'
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

type ProviderState = {
  theme: ThemeState
  hasUnsavedChanges: boolean
  isSaving: boolean
}

type ProviderAction =
  | { type: 'SET_THEME'; theme: ThemeState }
  | { type: 'SET_FIELD'; partial: Partial<ThemeState> }
  | { type: 'MARK_UNSAVED' }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_END' }
  | { type: 'INIT_THEME'; theme: ThemeState }

function providerReducer(state: ProviderState, action: ProviderAction): ProviderState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.theme }
    case 'SET_FIELD':
      return { ...state, theme: { ...state.theme, ...action.partial }, hasUnsavedChanges: true }
    case 'MARK_UNSAVED':
      return { ...state, hasUnsavedChanges: true }
    case 'SAVE_START':
      return { ...state, isSaving: true }
    case 'SAVE_END':
      return { ...state, isSaving: false, hasUnsavedChanges: false }
    case 'INIT_THEME':
      return { ...state, theme: action.theme, hasUnsavedChanges: false }
  }
}

function applyThemeToDOM(theme: ThemeState) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme.themeName)
  root.setAttribute('data-mode', theme.themeMode)

  const hex = theme.primaryColor
  root.style.setProperty('--primary', hex)
  root.style.setProperty('--ring', hex)
  root.style.setProperty('--alt', hex)

  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  root.style.setProperty('--corona-rgb', `${r}, ${g}, ${b}`)

  const resolvedParticle = theme.particleEffect === 'auto'
    ? AUTO_PARTICLES[theme.themeName] || 'ember'
    : theme.particleEffect
  root.setAttribute('data-particle', resolvedParticle)

  root.style.setProperty('--corona-intensity', String(theme.coronaIntensity))
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(providerReducer, {
    theme: DEFAULTS,
    hasUnsavedChanges: false,
    isSaving: false,
  })
  const initializedRef = useRef(false)

  const { data: session } = useSession()
  const userId = session?.user?.id
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
    staleTime: 300000,
  })

  // Load from DB when authenticated user data arrives
  useEffect(() => {
    if (user && !Array.isArray(user) && user.id) {
      dispatch({
        type: 'INIT_THEME',
        theme: {
          primaryColor: user.color || DEFAULTS.primaryColor,
          themeMode: (user.theme_mode as ThemeMode) || DEFAULTS.themeMode,
          themeName: (user.theme_name as ThemeName) || DEFAULTS.themeName,
          particleEffect: user.particle_effect || DEFAULTS.particleEffect,
          coronaIntensity: user.corona_intensity ?? DEFAULTS.coronaIntensity,
        },
      })
      initializedRef.current = true
    }
  }, [user])

  // Fallback: load from localStorage for unauthenticated users
  useEffect(() => {
    if (!userId) {
      const savedMode = (localStorage.getItem('themeMode') as ThemeMode) || DEFAULTS.themeMode
      const savedName = (localStorage.getItem('themeName') as ThemeName) || DEFAULTS.themeName
      dispatch({
        type: 'SET_FIELD',
        partial: { themeMode: savedMode, themeName: savedName },
      })
      initializedRef.current = true
    }
  }, [userId])

  // Apply DOM attributes whenever theme changes
  useEffect(() => {
    applyThemeToDOM(state.theme)
  }, [state.theme])

  const updateSettings = useCallback((partial: Partial<ThemeState>) => {
    dispatch({ type: 'SET_FIELD', partial })

    // For unauthenticated users, persist theme/mode to localStorage
    if (!userId) {
      if (partial.themeMode) localStorage.setItem('themeMode', partial.themeMode)
      if (partial.themeName) localStorage.setItem('themeName', partial.themeName)
    }
  }, [userId])

  const themeRef = useRef(state.theme)
  themeRef.current = state.theme

  const saveSettings = useCallback(async () => {
    if (!userId) return
    dispatch({ type: 'SAVE_START' })

    try {
      const theme = themeRef.current
      await fetch(`/api/users/${userId}`, {
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

      await queryClient.invalidateQueries({ queryKey: ['user', userId] })
      dispatch({ type: 'SAVE_END' })
    } catch {
      dispatch({ type: 'SAVE_END' })
    }
  }, [userId, queryClient])

  const contextValue = useMemo<ThemeContextValue>(() => ({
    theme: state.theme,
    updateSettings,
    saveSettings,
    hasUnsavedChanges: state.hasUnsavedChanges,
    isSaving: state.isSaving,
  }), [state.theme, state.hasUnsavedChanges, state.isSaving, updateSettings, saveSettings])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
