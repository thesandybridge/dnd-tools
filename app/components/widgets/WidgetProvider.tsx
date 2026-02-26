"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react"
import { WIDGET_REGISTRY, type WidgetId } from "./widget-registry"

type Position = { x: number; y: number }

type WidgetState = {
  openWidgets: Set<WidgetId>
  positions: Record<string, Position>
  zIndices: Record<string, number>
}

type WidgetContextValue = {
  openWidgets: Set<WidgetId>
  positions: Record<string, Position>
  zIndices: Record<string, number>
  toggleWidget: (id: WidgetId) => void
  closeWidget: (id: WidgetId) => void
  updatePosition: (id: WidgetId, pos: Position) => void
  batchUpdatePositions: (updates: Record<string, Position>) => void
  bringToFront: (id: WidgetId) => void
}

const WidgetContext = createContext<WidgetContextValue | null>(null)

const STORAGE_KEY = "ds-widget-positions"
const WIDGET_IDS = Object.keys(WIDGET_REGISTRY) as WidgetId[]

function getDefaultPosition(id: WidgetId): Position {
  const idx = WIDGET_IDS.indexOf(id)
  // Stagger in top-right area, offset by 40px each
  return { x: 80 + idx * 40, y: 80 + idx * 40 }
}

function loadPositions(): Record<string, Position> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function savePositions(positions: Record<string, Position>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
  } catch {}
}

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WidgetState>(() => ({
    openWidgets: new Set(),
    positions: {},
    zIndices: {},
  }))
  const zCounterRef = useRef(0)
  const initializedRef = useRef(false)

  // Load persisted positions on mount (client only)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const saved = loadPositions()
    if (Object.keys(saved).length > 0) {
      setState(prev => ({ ...prev, positions: { ...prev.positions, ...saved } }))
    }
  }, [])

  const toggleWidget = useCallback((id: WidgetId) => {
    setState(prev => {
      const next = new Set(prev.openWidgets)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        // Ensure position exists
        if (!prev.positions[id]) {
          const pos = getDefaultPosition(id)
          const positions = { ...prev.positions, [id]: pos }
          savePositions(positions)
          const z = ++zCounterRef.current
          return { ...prev, openWidgets: next, positions, zIndices: { ...prev.zIndices, [id]: z } }
        }
        const z = ++zCounterRef.current
        return { ...prev, openWidgets: next, zIndices: { ...prev.zIndices, [id]: z } }
      }
      return { ...prev, openWidgets: next }
    })
  }, [])

  const closeWidget = useCallback((id: WidgetId) => {
    setState(prev => {
      const next = new Set(prev.openWidgets)
      next.delete(id)
      return { ...prev, openWidgets: next }
    })
  }, [])

  const updatePosition = useCallback((id: WidgetId, pos: Position) => {
    setState(prev => {
      const positions = { ...prev.positions, [id]: pos }
      savePositions(positions)
      return { ...prev, positions }
    })
  }, [])

  const batchUpdatePositions = useCallback((updates: Record<string, Position>) => {
    setState(prev => {
      const positions = { ...prev.positions, ...updates }
      savePositions(positions)
      return { ...prev, positions }
    })
  }, [])

  const bringToFront = useCallback((id: WidgetId) => {
    const z = ++zCounterRef.current
    setState(prev => ({
      ...prev,
      zIndices: { ...prev.zIndices, [id]: z },
    }))
  }, [])

  // Derive positions with defaults for open widgets
  const positions = useMemo(() => {
    const result: Record<string, Position> = {}
    for (const id of state.openWidgets) {
      result[id] = state.positions[id] ?? getDefaultPosition(id)
    }
    return result
  }, [state.openWidgets, state.positions])

  const contextValue = useMemo<WidgetContextValue>(() => ({
    openWidgets: state.openWidgets,
    positions,
    zIndices: state.zIndices,
    toggleWidget,
    closeWidget,
    updatePosition,
    batchUpdatePositions,
    bringToFront,
  }), [state.openWidgets, positions, state.zIndices, toggleWidget, closeWidget, updatePosition, batchUpdatePositions, bringToFront])

  return (
    <WidgetContext.Provider value={contextValue}>
      {children}
    </WidgetContext.Provider>
  )
}

export function useWidgets(): WidgetContextValue {
  const ctx = useContext(WidgetContext)
  if (!ctx) throw new Error("useWidgets must be used within a WidgetProvider")
  return ctx
}
