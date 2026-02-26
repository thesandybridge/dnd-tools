import { Dice6, Swords, UserRound, BookOpen } from "lucide-react"
import type { ComponentType } from "react"

export type WidgetId = "dice" | "initiative" | "npc" | "conditions"

export type WidgetMeta = {
  id: WidgetId
  label: string
  icon: ComponentType<{ className?: string }>
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetMeta> = {
  dice: {
    id: "dice",
    label: "Dice Roller",
    icon: Dice6,
  },
  initiative: {
    id: "initiative",
    label: "Initiative",
    icon: Swords,
  },
  npc: {
    id: "npc",
    label: "NPC Generator",
    icon: UserRound,
  },
  conditions: {
    id: "conditions",
    label: "Conditions",
    icon: BookOpen,
  },
}
