'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const routes = [
  { path: "/guilds", label: "Overview", exact: true },
  { path: "/guilds/my", label: "My Guilds" },
  { path: "/guilds/discover", label: "Discover" },
]

export default function GuildsNav() {
  const pathname = usePathname()

  function isActive(route: typeof routes[0]) {
    if ('exact' in route && route.exact) return pathname === route.path
    return pathname.startsWith(route.path)
  }

  return (
    <GlassPanel variant="subtle" className="w-full rounded-full p-1.5 overflow-x-auto">
      <nav className="flex gap-1 flex-wrap sm:flex-nowrap justify-center">
        {routes.map((route) => {
          const active = isActive(route)
          return (
            <Link
              key={route.path}
              className={`px-3 py-2 sm:px-4 text-sm font-medium rounded-full transition-all whitespace-nowrap
                ${active
                  ? "bg-white/[0.08] text-primary shadow-[0_0_12px_rgba(var(--corona-rgb),0.4)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              href={route.path}
            >
              {route.label}
            </Link>
          )
        })}
      </nav>
    </GlassPanel>
  )
}
