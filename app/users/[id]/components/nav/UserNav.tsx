'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const PATH = "/users/"
const routes = [
  { path: '/', label: 'Profile' },
  { path: '/settings', label: 'Settings' },
  { path: '/guilds', label: 'Guilds' },
]

export default function UserNav({ userId }) {
  const pathname = usePathname()

  function isActive(routePath: string) {
    const full = `${PATH}${userId}${routePath === '/' ? '' : routePath}`
    if (routePath === '/') return pathname === `${PATH}${userId}` || pathname === `${PATH}${userId}/`
    return pathname.startsWith(full)
  }

  return (
    <GlassPanel variant="subtle" className="w-full rounded-full p-1.5">
      <nav className="flex gap-1 justify-center">
        {routes.map((route) => {
          const active = isActive(route.path)
          return (
            <Link
              key={route.path}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all
                ${active
                  ? "bg-white/[0.08] text-primary shadow-[0_0_12px_rgba(var(--corona-rgb),0.4)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              href={`${PATH}${userId}${route.path}`}
            >
              {route.label}
            </Link>
          )
        })}
      </nav>
    </GlassPanel>
  )
}
