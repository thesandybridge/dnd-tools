import { Dice6, Swords, UserRound, BookOpen } from "lucide-react"
import type { ComponentType } from "react"

export type WidgetId = "dice" | "initiative" | "npc" | "conditions"

export type WidgetMeta = {
  id: WidgetId
  label: string
  icon: ComponentType<{ className?: string }>
  defaultWidth: number
  defaultHeight: number
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetMeta> = {
  dice: {
    id: "dice",
    label: "Dice Roller",
    icon: Dice6,
    defaultWidth: 280,
    defaultHeight: 280,
  },
  initiative: {
    id: "initiative",
    label: "Initiative",
    icon: Swords,
    defaultWidth: 280,
    defaultHeight: 320,
  },
  npc: {
    id: "npc",
    label: "NPC Generator",
    icon: UserRound,
    defaultWidth: 260,
    defaultHeight: 280,
  },
  conditions: {
    id: "conditions",
    label: "Conditions",
    icon: BookOpen,
    defaultWidth: 280,
    defaultHeight: 360,
  },
}
