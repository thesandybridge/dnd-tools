"use client"

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react"
import type { WidgetId } from "./widget-registry"

type WidgetState = {
  openWidgets: Set<WidgetId>
  cellAssignments: Record<string, number>
  collapsed: boolean
  mobileDrawerOpen: boolean
}

type WidgetAction =
  | { type: "TOGGLE_WIDGET"; id: WidgetId }
  | { type: "CLOSE_WIDGET"; id: WidgetId }
  | { type: "MOVE_TO_CELL"; id: WidgetId; cellIndex: number }
  | { type: "TOGGLE_COLLAPSED" }
  | { type: "SET_MOBILE_DRAWER"; open: boolean }
  | { type: "INIT_ASSIGNMENTS"; assignments: Record<string, number> }

type WidgetContextValue = {
  openWidgets: Set<WidgetId>
  cellAssignments: Record<string, number>
  collapsed: boolean
  mobileDrawerOpen: boolean
  toggleWidget: (id: WidgetId) => void
  closeWidget: (id: WidgetId) => void
  moveToCell: (id: WidgetId, cellIndex: number) => void
  getWidgetInCell: (cellIndex: number) => WidgetId | null
  toggleCollapsed: () => void
  setMobileDrawerOpen: (open: boolean) => void
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

function widgetReducer(state: WidgetState, action: WidgetAction): WidgetState {
  switch (action.type) {
    case "TOGGLE_WIDGET": {
      const next = new Set(state.openWidgets)
      if (next.has(action.id)) {
        next.delete(action.id)
        return { ...state, openWidgets: next }
      } else {
        next.add(action.id)
        const activeCells: Record<string, number> = {}
        for (const wid of next) {
          if (wid !== action.id && state.cellAssignments[wid] !== undefined) {
            activeCells[wid] = state.cellAssignments[wid]
          }
        }
        const cellIndex = findFirstUnoccupiedCell(activeCells)
        const cellAssignments = { ...state.cellAssignments, [action.id]: cellIndex }
        saveCellAssignments(cellAssignments)
        return { ...state, openWidgets: next, cellAssignments }
      }
    }
    case "CLOSE_WIDGET": {
      const next = new Set(state.openWidgets)
      next.delete(action.id)
      return { ...state, openWidgets: next }
    }
    case "MOVE_TO_CELL": {
      const cellAssignments = { ...state.cellAssignments }
      const occupant = Object.entries(cellAssignments).find(
        ([, idx]) => idx === action.cellIndex
      )
      if (occupant) {
        const [occupantId] = occupant
        cellAssignments[occupantId] = cellAssignments[action.id]
      }
      cellAssignments[action.id] = action.cellIndex
      saveCellAssignments(cellAssignments)
      return { ...state, cellAssignments }
    }
    case "TOGGLE_COLLAPSED":
      return { ...state, collapsed: !state.collapsed }
    case "SET_MOBILE_DRAWER":
      return { ...state, mobileDrawerOpen: action.open }
    case "INIT_ASSIGNMENTS":
      return { ...state, cellAssignments: { ...state.cellAssignments, ...action.assignments } }
  }
}

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(widgetReducer, {
    openWidgets: new Set<WidgetId>(),
    cellAssignments: {},
    collapsed: false,
    mobileDrawerOpen: false,
  })
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const saved = loadCellAssignments()
    if (Object.keys(saved).length > 0) {
      dispatch({ type: "INIT_ASSIGNMENTS", assignments: saved })
    }
  }, [])

  const toggleWidget = useCallback((id: WidgetId) => {
    dispatch({ type: "TOGGLE_WIDGET", id })
  }, [])

  const closeWidget = useCallback((id: WidgetId) => {
    dispatch({ type: "CLOSE_WIDGET", id })
  }, [])

  const moveToCell = useCallback((id: WidgetId, cellIndex: number) => {
    dispatch({ type: "MOVE_TO_CELL", id, cellIndex })
  }, [])

  const toggleCollapsed = useCallback(() => {
    dispatch({ type: "TOGGLE_COLLAPSED" })
  }, [])

  const setMobileDrawerOpen = useCallback((open: boolean) => {
    dispatch({ type: "SET_MOBILE_DRAWER", open })
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
    collapsed: state.collapsed,
    mobileDrawerOpen: state.mobileDrawerOpen,
    toggleWidget,
    closeWidget,
    moveToCell,
    getWidgetInCell,
    toggleCollapsed,
    setMobileDrawerOpen,
  }), [state.openWidgets, state.cellAssignments, state.collapsed, state.mobileDrawerOpen, toggleWidget, closeWidget, moveToCell, getWidgetInCell, toggleCollapsed, setMobileDrawerOpen])

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
