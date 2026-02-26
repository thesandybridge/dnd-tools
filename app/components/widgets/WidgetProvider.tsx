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
import type { WidgetId, WidgetScope } from "./widget-registry"
import { WIDGET_REGISTRY } from "./widget-registry"

type WidgetState = {
  openWidgets: Set<WidgetId>
  cellAssignments: Record<string, number>
  collapsed: boolean
  mobileDrawerOpen: boolean
  activeScopes: Set<WidgetScope>
  overflowWidgets: WidgetId[]
  totalCells: number
}

type WidgetAction =
  | { type: "TOGGLE_WIDGET"; id: WidgetId }
  | { type: "CLOSE_WIDGET"; id: WidgetId }
  | { type: "MOVE_TO_CELL"; id: WidgetId; cellIndex: number }
  | { type: "TOGGLE_COLLAPSED" }
  | { type: "SET_MOBILE_DRAWER"; open: boolean }
  | { type: "INIT_ASSIGNMENTS"; assignments: Record<string, number> }
  | { type: "REGISTER_SCOPE"; scope: WidgetScope }
  | { type: "UNREGISTER_SCOPE"; scope: WidgetScope }
  | { type: "SET_TOTAL_CELLS"; count: number }
  | { type: "SWAP_OVERFLOW"; overflowId: WidgetId; cellIndex: number }

type WidgetContextValue = {
  openWidgets: Set<WidgetId>
  cellAssignments: Record<string, number>
  collapsed: boolean
  mobileDrawerOpen: boolean
  activeScopes: Set<WidgetScope>
  overflowWidgets: WidgetId[]
  totalCells: number
  toggleWidget: (id: WidgetId) => void
  closeWidget: (id: WidgetId) => void
  moveToCell: (id: WidgetId, cellIndex: number) => void
  getWidgetInCell: (cellIndex: number) => WidgetId | null
  toggleCollapsed: () => void
  setMobileDrawerOpen: (open: boolean) => void
  registerScope: (scope: WidgetScope) => void
  unregisterScope: (scope: WidgetScope) => void
  setTotalCells: (count: number) => void
  swapOverflow: (overflowId: WidgetId, cellIndex: number) => void
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
        // Closing a widget
        next.delete(action.id)
        const wasOverflow = state.overflowWidgets.includes(action.id)
        const newOverflow = wasOverflow
          ? state.overflowWidgets.filter(id => id !== action.id)
          : state.overflowWidgets
        const newState = { ...state, openWidgets: next, overflowWidgets: newOverflow }
        // If we freed a cell and there are overflow widgets, promote the oldest
        if (!wasOverflow && newOverflow.length > 0) {
          const [promoteId, ...restOverflow] = newOverflow
          const activeCells: Record<string, number> = {}
          for (const wid of next) {
            if (wid !== promoteId && newState.cellAssignments[wid] !== undefined && !newOverflow.includes(wid)) {
              activeCells[wid] = newState.cellAssignments[wid]
            }
          }
          const cellIndex = findFirstUnoccupiedCell(activeCells)
          const cellAssignments = { ...newState.cellAssignments, [promoteId]: cellIndex }
          saveCellAssignments(cellAssignments)
          return { ...newState, cellAssignments, overflowWidgets: restOverflow }
        }
        return newState
      } else {
        // Opening a widget
        next.add(action.id)
        const activeCells: Record<string, number> = {}
        for (const wid of next) {
          if (wid !== action.id && state.cellAssignments[wid] !== undefined && !state.overflowWidgets.includes(wid)) {
            activeCells[wid] = state.cellAssignments[wid]
          }
        }
        const cellIndex = findFirstUnoccupiedCell(activeCells)
        // Check if we exceeded totalCells
        if (state.totalCells > 0 && cellIndex >= state.totalCells) {
          return { ...state, openWidgets: next, overflowWidgets: [...state.overflowWidgets, action.id] }
        }
        const cellAssignments = { ...state.cellAssignments, [action.id]: cellIndex }
        saveCellAssignments(cellAssignments)
        return { ...state, openWidgets: next, cellAssignments }
      }
    }
    case "CLOSE_WIDGET": {
      const next = new Set(state.openWidgets)
      next.delete(action.id)
      const newOverflow = state.overflowWidgets.filter(id => id !== action.id)
      return { ...state, openWidgets: next, overflowWidgets: newOverflow }
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
    case "REGISTER_SCOPE": {
      const scopes = new Set(state.activeScopes)
      scopes.add(action.scope)
      return { ...state, activeScopes: scopes }
    }
    case "UNREGISTER_SCOPE": {
      const scopes = new Set(state.activeScopes)
      scopes.delete(action.scope)
      // Auto-close widgets with this scope
      const next = new Set(state.openWidgets)
      const newOverflow = [...state.overflowWidgets]
      for (const wid of state.openWidgets) {
        if (WIDGET_REGISTRY[wid]?.scope === action.scope) {
          next.delete(wid)
          const overflowIdx = newOverflow.indexOf(wid)
          if (overflowIdx !== -1) newOverflow.splice(overflowIdx, 1)
        }
      }
      return { ...state, activeScopes: scopes, openWidgets: next, overflowWidgets: newOverflow }
    }
    case "SET_TOTAL_CELLS":
      return { ...state, totalCells: action.count }
    case "SWAP_OVERFLOW": {
      // Swap an overflow widget into a specific cell, displacing occupant to overflow
      const occupant = Object.entries(state.cellAssignments).find(
        ([id, idx]) => idx === action.cellIndex && state.openWidgets.has(id as WidgetId) && !state.overflowWidgets.includes(id as WidgetId)
      )
      const newOverflow = state.overflowWidgets.filter(id => id !== action.overflowId)
      if (occupant) {
        newOverflow.push(occupant[0] as WidgetId)
      }
      const cellAssignments = { ...state.cellAssignments, [action.overflowId]: action.cellIndex }
      saveCellAssignments(cellAssignments)
      return { ...state, cellAssignments, overflowWidgets: newOverflow }
    }
  }
}

export function WidgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(widgetReducer, {
    openWidgets: new Set<WidgetId>(),
    cellAssignments: {},
    collapsed: false,
    mobileDrawerOpen: false,
    activeScopes: new Set<WidgetScope>(["global"]),
    overflowWidgets: [],
    totalCells: 0,
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

  const registerScope = useCallback((scope: WidgetScope) => {
    dispatch({ type: "REGISTER_SCOPE", scope })
  }, [])

  const unregisterScope = useCallback((scope: WidgetScope) => {
    dispatch({ type: "UNREGISTER_SCOPE", scope })
  }, [])

  const setTotalCells = useCallback((count: number) => {
    dispatch({ type: "SET_TOTAL_CELLS", count })
  }, [])

  const swapOverflow = useCallback((overflowId: WidgetId, cellIndex: number) => {
    dispatch({ type: "SWAP_OVERFLOW", overflowId, cellIndex })
  }, [])

  const getWidgetInCell = useCallback((cellIndex: number): WidgetId | null => {
    const entry = Object.entries(state.cellAssignments).find(
      ([, idx]) => idx === cellIndex
    )
    if (!entry) return null
    const widgetId = entry[0] as WidgetId
    if (!state.openWidgets.has(widgetId)) return null
    if (state.overflowWidgets.includes(widgetId)) return null
    return widgetId
  }, [state.cellAssignments, state.openWidgets, state.overflowWidgets])

  const contextValue = useMemo<WidgetContextValue>(() => ({
    openWidgets: state.openWidgets,
    cellAssignments: state.cellAssignments,
    collapsed: state.collapsed,
    mobileDrawerOpen: state.mobileDrawerOpen,
    activeScopes: state.activeScopes,
    overflowWidgets: state.overflowWidgets,
    totalCells: state.totalCells,
    toggleWidget,
    closeWidget,
    moveToCell,
    getWidgetInCell,
    toggleCollapsed,
    setMobileDrawerOpen,
    registerScope,
    unregisterScope,
    setTotalCells,
    swapOverflow,
  }), [state.openWidgets, state.cellAssignments, state.collapsed, state.mobileDrawerOpen, state.activeScopes, state.overflowWidgets, state.totalCells, toggleWidget, closeWidget, moveToCell, getWidgetInCell, toggleCollapsed, setMobileDrawerOpen, registerScope, unregisterScope, setTotalCells, swapOverflow])

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
