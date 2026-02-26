"use client"

import { useCallback, useEffect, useState, useRef, useMemo } from "react"
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
import { useWidgets } from "./WidgetProvider"
import { WidgetShell } from "./WidgetShell"
import { WIDGET_REGISTRY, type WidgetId } from "./widget-registry"
import { DiceWidgetContent } from "./widgets/DiceWidget"
import { InitiativeTrackerContent } from "./widgets/InitiativeTracker"
import { NPCGeneratorContent } from "./widgets/NPCGenerator"
import { ConditionReferenceContent } from "./widgets/ConditionReference"

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    setMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])
  return mobile
}

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
  }
}

function getAdjacentCells(cellIndex: number, cols: number, totalCells: number): Set<number> {
  const adjacent = new Set<number>()
  const row = Math.floor(cellIndex / cols)
  const col = cellIndex % cols
  if (col > 0) adjacent.add(cellIndex - 1)
  if (col < cols - 1) adjacent.add(cellIndex + 1)
  if (row > 0) adjacent.add(cellIndex - cols)
  if (cellIndex + cols < totalCells) adjacent.add(cellIndex + cols)
  return adjacent
}

// --- Droppable grid cell ---

function GridCell({
  index,
  isDragging,
  overCellIndex,
  cols,
  totalCells,
  children,
}: {
  index: number
  isDragging: boolean
  overCellIndex: number | null
  cols: number
  totalCells: number
  children?: React.ReactNode
}) {
  const { setNodeRef } = useDroppable({ id: `cell-${index}` })

  const isOver = overCellIndex === index
  const isAdjacent = overCellIndex !== null && getAdjacentCells(overCellIndex, cols, totalCells).has(index)

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-xl transition-all duration-200 min-h-[320px]",
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

// --- Desktop grid area ---

function DesktopWidgetArea() {
  const { openWidgets, cellAssignments, moveToCell } = useWidgets()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [activeId, setActiveId] = useState<WidgetId | null>(null)
  const [overCellIndex, setOverCellIndex] = useState<number | null>(null)

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  // Track container size with ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainerSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const cols = Math.max(1, Math.floor(containerSize.width / 300))
  const rows = Math.max(1, Math.ceil(containerSize.height / 320))
  const totalCells = Math.max(cols * rows, openWidgets.size + 2)

  // Build cell -> widgetId map for open widgets only
  const cellToWidget = useMemo(() => {
    const map = new Map<number, WidgetId>()
    for (const id of openWidgets) {
      const cell = cellAssignments[id]
      if (cell !== undefined) map.set(cell, id)
    }
    return map
  }, [openWidgets, cellAssignments])

  const isDragging = activeId !== null

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const widgetId = event.active.data.current?.widgetId as WidgetId | undefined
    if (widgetId) setActiveId(widgetId)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined
    if (overId?.startsWith("cell-")) {
      setOverCellIndex(parseInt(overId.replace("cell-", ""), 10))
    } else {
      setOverCellIndex(null)
    }
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const widgetId = event.active.data.current?.widgetId as WidgetId | undefined
    const overId = event.over?.id as string | undefined

    if (widgetId && overId?.startsWith("cell-")) {
      const targetCell = parseInt(overId.replace("cell-", ""), 10)
      moveToCell(widgetId, targetCell)
    }

    setActiveId(null)
    setOverCellIndex(null)
  }, [moveToCell])

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    setOverCellIndex(null)
  }, [])

  const openIds = Array.from(openWidgets)
  if (openIds.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1040] md:left-16 pointer-events-none"
    >
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className="h-full p-4 pointer-events-none"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
            gridAutoRows: "minmax(320px, auto)",
            gap: "12px",
          }}
        >
          {Array.from({ length: totalCells }, (_, i) => {
            const widgetId = cellToWidget.get(i)
            return (
              <GridCell
                key={i}
                index={i}
                isDragging={isDragging}
                overCellIndex={overCellIndex}
                cols={cols}
                totalCells={totalCells}
              >
                {widgetId && (
                  <div className="pointer-events-auto h-full">
                    <DraggableWidget id={widgetId} activeId={activeId} />
                  </div>
                )}
              </GridCell>
            )
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div className="pointer-events-none opacity-80 backdrop-blur-sm">
              <WidgetShell id={activeId}>
                {getWidgetContent(activeId)}
              </WidgetShell>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// --- Mobile (unchanged) ---

function MobileWidgetArea() {
  const { openWidgets, closeWidget } = useWidgets()
  const openIds = Array.from(openWidgets)
  const isOpen = openIds.length > 0

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        for (const id of openWidgets) {
          closeWidget(id)
        }
      }
    },
    [openWidgets, closeWidget]
  )

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader>
          <DrawerTitle className="text-left font-cinzel">Widgets</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-4 pb-6 overflow-y-auto">
          {openIds.map((id) => {
            const meta = WIDGET_REGISTRY[id]
            return (
              <GlassPanel key={id} variant="strong" corona>
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="font-cinzel text-[11px] tracking-widest text-muted-foreground uppercase">
                    {meta.label}
                  </span>
                  <button
                    onClick={() => closeWidget(id)}
                    aria-label={`Close ${meta.label}`}
                    className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {getWidgetContent(id)}
              </GlassPanel>
            )
          })}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function WidgetArea() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileWidgetArea /> : <DesktopWidgetArea />
}
