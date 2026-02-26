import { Dice6, Swords, UserRound, BookOpen, Calculator, MapPin } from "lucide-react"
import type { ComponentType } from "react"

export type WidgetScope = "global" | "map"

export type WidgetId = "dice" | "initiative" | "npc" | "conditions" | "calculator" | "markers"

export type WidgetMeta = {
  id: WidgetId
  label: string
  icon: ComponentType<{ className?: string }>
  scope: WidgetScope
}

export const WIDGET_REGISTRY: Record<WidgetId, WidgetMeta> = {
  dice: {
    id: "dice",
    label: "Dice Roller",
    icon: Dice6,
    scope: "global",
  },
  initiative: {
    id: "initiative",
    label: "Initiative",
    icon: Swords,
    scope: "global",
  },
  npc: {
    id: "npc",
    label: "NPC Generator",
    icon: UserRound,
    scope: "global",
  },
  conditions: {
    id: "conditions",
    label: "Conditions",
    icon: BookOpen,
    scope: "global",
  },
  calculator: {
    id: "calculator",
    label: "Quick Convert",
    icon: Calculator,
    scope: "global",
  },
  markers: {
    id: "markers",
    label: "Map Markers",
    icon: MapPin,
    scope: "map",
  },
}
