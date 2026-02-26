"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToParentElement } from "@dnd-kit/modifiers"
import { AnimatePresence } from "framer-motion"
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

function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function nudgeCollidingWidgets(
  movedId: WidgetId,
  positions: Record<string, { x: number; y: number }>,
  openWidgets: Set<WidgetId>
): Record<string, { x: number; y: number }> {
  const result = { ...positions }
  const movedMeta = WIDGET_REGISTRY[movedId]
  const movedRect = {
    x: result[movedId].x,
    y: result[movedId].y,
    w: movedMeta.defaultWidth,
    h: movedMeta.defaultHeight,
  }

  for (const otherId of openWidgets) {
    if (otherId === movedId) continue
    const otherPos = result[otherId]
    if (!otherPos) continue
    const otherMeta = WIDGET_REGISTRY[otherId]
    const otherRect = { x: otherPos.x, y: otherPos.y, w: otherMeta.defaultWidth, h: otherMeta.defaultHeight }

    if (rectsIntersect(movedRect, otherRect)) {
      // Push in direction of least overlap
      const overlapX = Math.min(movedRect.x + movedRect.w - otherRect.x, otherRect.x + otherRect.w - movedRect.x)
      const overlapY = Math.min(movedRect.y + movedRect.h - otherRect.y, otherRect.y + otherRect.h - movedRect.y)

      if (overlapX < overlapY) {
        // Push horizontally
        if (otherRect.x + otherRect.w / 2 > movedRect.x + movedRect.w / 2) {
          result[otherId] = { ...otherPos, x: movedRect.x + movedRect.w + 8 }
        } else {
          result[otherId] = { ...otherPos, x: movedRect.x - otherRect.w - 8 }
        }
      } else {
        // Push vertically
        if (otherRect.y + otherRect.h / 2 > movedRect.y + movedRect.h / 2) {
          result[otherId] = { ...otherPos, y: movedRect.y + movedRect.h + 8 }
        } else {
          result[otherId] = { ...otherPos, y: movedRect.y - otherRect.h - 8 }
        }
      }
    }
  }

  return result
}

function DesktopWidgetArea() {
  const { openWidgets, positions, batchUpdatePositions } = useWidgets()
  const containerRef = useRef<HTMLDivElement>(null)

  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  const keyboardSensor = useSensor(KeyboardSensor)
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor)

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event
      const widgetId = (active.id as string).replace("widget-", "") as WidgetId
      const currentPos = positions[widgetId]
      if (!currentPos) return

      const newPos = {
        x: currentPos.x + delta.x,
        y: currentPos.y + delta.y,
      }

      // Nudge colliding widgets and batch all position updates together
      const allPositions = { ...positions, [widgetId]: newPos }
      const nudged = nudgeCollidingWidgets(widgetId, allPositions, openWidgets)
      batchUpdatePositions(nudged)
    },
    [positions, openWidgets, batchUpdatePositions]
  )

  const openIds = Array.from(openWidgets)
  if (openIds.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[1040] pointer-events-none md:left-16"
    >
      <DndContext
        sensors={sensors}
        modifiers={[restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence>
          {openIds.map((id) => (
            <div key={id} className="pointer-events-auto">
              <WidgetShell id={id}>
                {getWidgetContent(id)}
              </WidgetShell>
            </div>
          ))}
        </AnimatePresence>
      </DndContext>
    </div>
  )
}

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
