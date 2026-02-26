"use client"

import { type ReactNode } from "react"
import { useDraggable } from "@dnd-kit/core"
import { motion } from "framer-motion"
import { GripHorizontal, X } from "lucide-react"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { useWidgets } from "./WidgetProvider"
import { WIDGET_REGISTRY, type WidgetId } from "./widget-registry"

interface WidgetShellProps {
  id: WidgetId
  children: ReactNode
}

export function WidgetShell({ id, children }: WidgetShellProps) {
  const { positions, zIndices, bringToFront, closeWidget } = useWidgets()
  const meta = WIDGET_REGISTRY[id]
  const pos = positions[id] ?? { x: 0, y: 0 }
  const zOrder = zIndices[id] ?? 0

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `widget-${id}`,
  })

  const style: React.CSSProperties = {
    position: "absolute",
    left: pos.x,
    top: pos.y,
    width: meta.defaultWidth,
    zIndex: 1050 + zOrder,
    ...(transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : {}),
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onPointerDown={() => bringToFront(id)}
    >
      <GlassPanel variant="strong" corona className="overflow-hidden">
        {/* Title bar - drag handle */}
        <div
          className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
          {...listeners}
          {...attributes}
        >
          <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="flex-1 font-cinzel text-[11px] tracking-widest text-muted-foreground uppercase">
            {meta.label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeWidget(id)
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`Close ${meta.label}`}
            className="h-6 w-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Widget body */}
        <div className="px-3 pb-3">{children}</div>
      </GlassPanel>
    </motion.div>
  )
}
