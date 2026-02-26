"use client"

import { useCallback, useEffect, useReducer, useState, useMemo, memo } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { X } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { useIsMobile } from "@/app/hooks/useIsMobile"
import { useWidgets } from "./WidgetProvider"
import { WidgetShell } from "./WidgetShell"
import { WIDGET_REGISTRY, type WidgetId } from "./widget-registry"
import { DiceWidgetContent } from "./widgets/DiceWidget"
import { InitiativeTrackerContent } from "./widgets/InitiativeTracker"
import { NPCGeneratorContent } from "./widgets/NPCGenerator"
import { ConditionReferenceContent } from "./widgets/ConditionReference"
import QuickConvert from "@/app/components/QuickConvert"
import { MapMarkersContent } from "./widgets/MapMarkersWidget"

const MARGIN_WIDTH = 280
const CELL_HEIGHT = 280
const GAP = 12

function getWidgetContent(id: WidgetId) {
  switch (id) {
    case "dice":
      return <DiceWidgetContent />
    case "initiative":
      return <InitiativeTrackerContent />
    case "npc":
      return <NPCGeneratorContent />
    case "conditions":
      return <ConditionReferenceContent />
    case "calculator":
      return <div className="px-3 py-2"><QuickConvert /></div>
    case "markers":
      return <MapMarkersContent />
  }
}

// --- Drag state reducer for DesktopWidgetArea ---

type DragState = {
  activeId: WidgetId | null
  overCellIndex: number | null
}

type DragAction =
  | { type: "START"; id: WidgetId }
  | { type: "OVER"; cellIndex: number | null }
  | { type: "RESET" }

const initialDragState: DragState = { activeId: null, overCellIndex: null }

function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case "START":
      return { ...state, activeId: action.id }
    case "OVER":
      return { ...state, overCellIndex: action.cellIndex }
    case "RESET":
      return initialDragState
  }
}

// --- Droppable margin cell ---

function MarginCell({
  index,
  isDragging,
  overCellIndex,
  siblingIndices,
  children,
}: {
  index: number
  isDragging: boolean
  overCellIndex: number | null
  siblingIndices: number[]
  children?: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: `cell-${index}` })

  const isOver = overCellIndex === index
  // Adjacent = directly above or below in same column
  const myPos = siblingIndices.indexOf(index)
  const isAdjacent =
    overCellIndex !== null &&
    myPos !== -1 &&
    (siblingIndices[myPos - 1] === overCellIndex ||
      siblingIndices[myPos + 1] === overCellIndex)

  return (
    <div
      ref={setNodeRef}
      style={{ height: CELL_HEIGHT }}
      className={[
        "rounded-xl transition-all duration-200 overflow-hidden",
        isDragging ? "border border-dashed border-white/10" : "border border-transparent",
        isOver ? "bg-[radial-gradient(circle,rgba(var(--corona-rgb),0.15),transparent_70%)]" : "",
        isAdjacent ? "bg-[radial-gradient(circle,rgba(var(--corona-rgb),0.06),transparent_70%)]" : "",
      ].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  )
}

// --- Draggable widget wrapper ---

function DraggableWidget({ id, activeId }: { id: WidgetId; activeId: WidgetId | null }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `widget-${id}`,
    data: { widgetId: id },
  })

  return (
    <div
      ref={setNodeRef}
      className={[
        "h-full",
        isDragging || activeId === id ? "opacity-30" : "",
      ].filter(Boolean).join(" ")}
    >
      <WidgetShell id={id} dragHandleProps={{ ...listeners, ...attributes }}>
        {getWidgetContent(id)}
      </WidgetShell>
    </div>
  )
}

// --- Margin column ---

function MarginColumn({
  side,
  cellIndices,
  cellToWidget,
  isDragging,
  overCellIndex,
  activeId,
}: {
  side: "left" | "right"
  cellIndices: number[]
  cellToWidget: Map<number, WidgetId>
  isDragging: boolean
  overCellIndex: number | null
  activeId: WidgetId | null
}) {
  return (
    <div
      className={[
        "fixed top-0 z-30 flex flex-col gap-3 p-3 pointer-events-none",
        side === "left" ? "left-16" : "right-0",
      ].join(" ")}
      style={{ width: MARGIN_WIDTH }}
    >
      {cellIndices.map((cellIdx) => {
        const widgetId = cellToWidget.get(cellIdx)
        return (
          <MarginCell
            key={cellIdx}
            index={cellIdx}
            isDragging={isDragging}
            overCellIndex={overCellIndex}
            siblingIndices={cellIndices}
          >
            {widgetId && (
              <div className="pointer-events-auto h-full">
                <DraggableWidget id={widgetId} activeId={activeId} />
              </div>
            )}
          </MarginCell>
        )
      })}
    </div>
  )
}

// --- Desktop widget area ---

function DesktopWidgetArea() {
  const { openWidgets, cellAssignments, moveToCell, collapsed, setTotalCells, overflowWidgets, swapOverflow } = useWidgets()
  const [dragState, dispatchDrag] = useReducer(dragReducer, initialDragState)
  const [availableHeight, setAvailableHeight] = useState(0)

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  // Measure available height: viewport minus footer
  useEffect(() => {
    function measure() {
      const footer = document.querySelector("footer")
      const footerH = footer ? footer.getBoundingClientRect().height : 0
      setAvailableHeight(window.innerHeight - footerH)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  // Fill available height with cells (padding=12 top+bottom, gap=12 between)
  const padding = 24
  const cellsPerCol = Math.max(1, Math.floor((availableHeight - padding) / (CELL_HEIGHT + GAP)))
  const leftIndices = useMemo(
    () => Array.from({ length: cellsPerCol }, (_, i) => i),
    [cellsPerCol]
  )
  const rightIndices = useMemo(
    () => Array.from({ length: cellsPerCol }, (_, i) => cellsPerCol + i),
    [cellsPerCol]
  )

  useEffect(() => {
    setTotalCells(cellsPerCol * 2)
  }, [cellsPerCol, setTotalCells])

  // Build cell -> widgetId map for open widgets only (excluding overflow)
  const cellToWidget = useMemo(() => {
    const map = new Map<number, WidgetId>()
    for (const id of openWidgets) {
      if (overflowWidgets.includes(id)) continue
      const cell = cellAssignments[id]
      if (cell !== undefined) map.set(cell, id)
    }
    return map
  }, [openWidgets, cellAssignments, overflowWidgets])

  const isDragging = dragState.activeId !== null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const widgetId = event.active.data.current?.widgetId as WidgetId | undefined
    if (widgetId) dispatchDrag({ type: "START", id: widgetId })
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined
    if (overId?.startsWith("cell-")) {
      dispatchDrag({ type: "OVER", cellIndex: parseInt(overId.replace("cell-", ""), 10) })
    } else {
      dispatchDrag({ type: "OVER", cellIndex: null })
    }
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const widgetId = event.active.data.current?.widgetId as WidgetId | undefined
    const overId = event.over?.id as string | undefined

    if (widgetId && overId?.startsWith("cell-")) {
      const targetCell = parseInt(overId.replace("cell-", ""), 10)
      moveToCell(widgetId, targetCell)
    }

    dispatchDrag({ type: "RESET" })
  }, [moveToCell])

  const handleDragCancel = useCallback(() => {
    dispatchDrag({ type: "RESET" })
  }, [])

  const openIds = Array.from(openWidgets)
  if ((openIds.length === 0 && overflowWidgets.length === 0) || collapsed) return null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <MarginColumn
        side="left"
        cellIndices={leftIndices}
        cellToWidget={cellToWidget}
        isDragging={isDragging}
        overCellIndex={dragState.overCellIndex}
        activeId={dragState.activeId}
      />
      <MarginColumn
        side="right"
        cellIndices={rightIndices}
        cellToWidget={cellToWidget}
        isDragging={isDragging}
        overCellIndex={dragState.overCellIndex}
        activeId={dragState.activeId}
      />

      <DragOverlay dropAnimation={null}>
        {dragState.activeId ? (
          <div className="pointer-events-none opacity-80 backdrop-blur-sm" style={{ width: MARGIN_WIDTH - 24 }}>
            <WidgetShell id={dragState.activeId}>
              {getWidgetContent(dragState.activeId)}
            </WidgetShell>
          </div>
        ) : null}
      </DragOverlay>

      <OverflowTray
        overflowWidgets={overflowWidgets}
        onSwap={swapOverflow}
        cellsPerCol={cellsPerCol}
      />
    </DndContext>
  )
}

// --- Overflow tray ---

function OverflowTray({
  overflowWidgets,
  onSwap,
  cellsPerCol,
}: {
  overflowWidgets: WidgetId[]
  onSwap: (overflowId: WidgetId, cellIndex: number) => void
  cellsPerCol: number
}) {
  if (overflowWidgets.length === 0) return null

  // Swap with last occupied cell in right column (highest index)
  const lastRightCell = cellsPerCol * 2 - 1

  return (
    <div
      className="fixed bottom-3 right-0 z-30 flex flex-wrap gap-1.5 p-2 pointer-events-auto"
      style={{ width: MARGIN_WIDTH }}
    >
      {overflowWidgets.map((id) => {
        const meta = WIDGET_REGISTRY[id]
        const Icon = meta.icon
        return (
          <button
            key={id}
            onClick={() => onSwap(id, lastRightCell)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors cursor-pointer border bg-white/[0.03] border-white/[0.06] text-muted-foreground hover:bg-primary/20 hover:border-primary/30 hover:text-primary"
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}

// --- Memoized mobile sub-components ---

const WidgetTogglePill = memo(function WidgetTogglePill({
  id,
  isActive,
  onToggle,
}: {
  id: WidgetId
  isActive: boolean
  onToggle: (id: WidgetId) => void
}) {
  const meta = WIDGET_REGISTRY[id]
  const Icon = meta.icon
  const handleClick = useCallback(() => onToggle(id), [onToggle, id])

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors cursor-pointer border ${
        isActive
          ? "bg-primary/20 border-primary/30 text-primary"
          : "bg-white/[0.03] border-white/[0.06] text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </button>
  )
})

const MobileWidgetCard = memo(function MobileWidgetCard({
  id,
  onClose,
}: {
  id: WidgetId
  onClose: (id: WidgetId) => void
}) {
  const meta = WIDGET_REGISTRY[id]
  const handleClose = useCallback(() => onClose(id), [onClose, id])

  return (
    <GlassPanel variant="strong" corona>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-cinzel text-[11px] tracking-widest text-muted-foreground uppercase">
          {meta.label}
        </span>
        <button
          onClick={handleClose}
          aria-label={`Close ${meta.label}`}
          className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {getWidgetContent(id)}
    </GlassPanel>
  )
})

// --- Mobile ---

function MobileWidgetArea() {
  const { openWidgets, closeWidget, toggleWidget, mobileDrawerOpen, setMobileDrawerOpen, activeScopes } = useWidgets()
  const openIds = Array.from(openWidgets)
  const allWidgetIds = (Object.keys(WIDGET_REGISTRY) as WidgetId[]).filter(
    id => activeScopes.has(WIDGET_REGISTRY[id].scope)
  )

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setMobileDrawerOpen(open)
    },
    [setMobileDrawerOpen]
  )

  return (
    <Drawer open={mobileDrawerOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader>
          <DrawerTitle className="text-left font-cinzel">Widgets</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-4 pb-6 overflow-y-auto">
          {/* Widget toggles */}
          <div className="flex gap-2 flex-wrap">
            {allWidgetIds.map((id) => (
              <WidgetTogglePill
                key={id}
                id={id}
                isActive={openWidgets.has(id)}
                onToggle={toggleWidget}
              />
            ))}
          </div>

          {/* Open widgets */}
          {openIds.map((id) => (
            <MobileWidgetCard key={id} id={id} onClose={closeWidget} />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function WidgetArea() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileWidgetArea /> : <DesktopWidgetArea />
}
