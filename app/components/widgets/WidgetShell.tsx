"use client"

import { type ReactNode, useCallback } from "react"
import { GripHorizontal, X } from "lucide-react"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { useWidgets } from "./WidgetProvider"
import { WIDGET_REGISTRY, type WidgetId } from "./widget-registry"

const stopPointerPropagation = (e: React.PointerEvent) => e.stopPropagation()

interface WidgetShellProps {
  id: WidgetId
  children: ReactNode
  dragHandleProps?: Record<string, unknown>
}

export function WidgetShell({ id, children, dragHandleProps }: WidgetShellProps) {
  const { closeWidget } = useWidgets()
  const meta = WIDGET_REGISTRY[id]

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    closeWidget(id)
  }, [closeWidget, id])

  return (
    <GlassPanel variant="strong" corona className="h-full flex flex-col">
      {/* Title bar - drag handle */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
        {...dragHandleProps}
      >
        <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="flex-1 font-cinzel text-[11px] tracking-widest text-muted-foreground uppercase">
          {meta.label}
        </span>
        <button
          onClick={handleClose}
          onPointerDown={stopPointerPropagation}
          aria-label={`Close ${meta.label}`}
          className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Widget body - flex-1 to fill remaining space */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </GlassPanel>
  )
}
