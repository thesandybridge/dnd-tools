'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Crown, Utensils, Route, Hammer } from "lucide-react"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const routes = [
  {
    path: "mounts",
    label: "Mounts",
    description: "Calculate mount pricing and upkeep costs",
    icon: Crown,
  },
  {
    path: "services",
    label: "Services",
    description: "Tavern stays, hirelings, and service fees",
    icon: Utensils,
  },
  {
    path: "transportation",
    label: "Transportation",
    description: "Travel costs by land, sea, and air",
    icon: Route,
  },
  {
    path: "items",
    label: "Items",
    description: "Weapons, armor, and adventuring gear pricing",
    icon: Hammer,
  }
]

export default function ToolsNav() {
  const currentPath = usePathname()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
      {routes.map(route => {
        const Icon = route.icon
        const isActive = currentPath === `/tools/${route.path}`
        return (
          <Link key={route.path} href={`/tools/${route.path}`}>
            <GlassPanel
              coronaHover
              className={`h-full cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/5' : ''}`}
            >
              <div className="flex flex-col items-center text-center gap-3 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isActive ? 'bg-primary/20' : 'bg-primary/10'}`}>
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{route.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{route.description}</p>
                </div>
              </div>
            </GlassPanel>
          </Link>
        )
      })}
    </div>
  )
}
