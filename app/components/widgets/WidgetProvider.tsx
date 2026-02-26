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
import type { WidgetId } from "./widget-registry"

type WidgetState = {
  openWidgets: Set<WidgetId>
  cellAssignments: Record<string, number> // widgetId -> cellIndex
}

type WidgetContextValue = {
  openWidgets: Set<WidgetId>
  cellAssignments: Record<string, number>
  toggleWidget: (id: WidgetId) => void
  closeWidget: (id: WidgetId) => void
  moveToCell: (id: WidgetId, cellIndex: number) => void
  getWidgetInCell: (cellIndex: number) => WidgetId | null
}

const WidgetContext = createContext<WidgetContextValue | null>(null)

const STORAGE_KEY = "ds-widget-cells"

function loadCellAssignments(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function saveCellAssignments(assignments: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments))
  } catch {}
}

function findFirstUnoccupiedCell(assignments: Record<string, number>): number {
  const used = new Set(Object.values(assignments))
  let i = 0
  while (used.has(i)) i++
  return i
}

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WidgetState>(() => ({
    openWidgets: new Set(),
    cellAssignments: {},
  }))
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const saved = loadCellAssignments()
    if (Object.keys(saved).length > 0) {
      setState(prev => ({ ...prev, cellAssignments: { ...prev.cellAssignments, ...saved } }))
    }
  }, [])

  const toggleWidget = useCallback((id: WidgetId) => {
    setState(prev => {
      const next = new Set(prev.openWidgets)
      if (next.has(id)) {
        next.delete(id)
        return { ...prev, openWidgets: next }
      } else {
        next.add(id)
        if (prev.cellAssignments[id] === undefined) {
          const cellIndex = findFirstUnoccupiedCell(prev.cellAssignments)
          const cellAssignments = { ...prev.cellAssignments, [id]: cellIndex }
          saveCellAssignments(cellAssignments)
          return { ...prev, openWidgets: next, cellAssignments }
        }
        return { ...prev, openWidgets: next }
      }
    })
  }, [])

  const closeWidget = useCallback((id: WidgetId) => {
    setState(prev => {
      const next = new Set(prev.openWidgets)
      next.delete(id)
      return { ...prev, openWidgets: next }
    })
  }, [])

  const moveToCell = useCallback((id: WidgetId, cellIndex: number) => {
    setState(prev => {
      const cellAssignments = { ...prev.cellAssignments }
      // Find if another widget occupies the target cell — swap
      const occupant = Object.entries(cellAssignments).find(
        ([, idx]) => idx === cellIndex
      )
      if (occupant) {
        const [occupantId] = occupant
        cellAssignments[occupantId] = cellAssignments[id]
      }
      cellAssignments[id] = cellIndex
      saveCellAssignments(cellAssignments)
      return { ...prev, cellAssignments }
    })
  }, [])

  const getWidgetInCell = useCallback((cellIndex: number): WidgetId | null => {
    const entry = Object.entries(state.cellAssignments).find(
      ([, idx]) => idx === cellIndex
    )
    if (!entry) return null
    const widgetId = entry[0] as WidgetId
    return state.openWidgets.has(widgetId) ? widgetId : null
  }, [state.cellAssignments, state.openWidgets])

  const contextValue = useMemo<WidgetContextValue>(() => ({
    openWidgets: state.openWidgets,
    cellAssignments: state.cellAssignments,
    toggleWidget,
    closeWidget,
    moveToCell,
    getWidgetInCell,
  }), [state.openWidgets, state.cellAssignments, toggleWidget, closeWidget, moveToCell, getWidgetInCell])

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
