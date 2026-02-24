'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useGuild } from "../providers/GuildProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const PATH = "/guilds/"
const routes = [
  { path: '/', label: 'Overview' },
  { path: '/map', label: 'Maps' },
  { path: '/members', label: 'Members' },
  { path: '/settings', label: 'Settings', permission: 'admin' },
]

export default function GuildNav({ guildId, userId }: { guildId: string; userId: string }) {
  const { hasPermission } = useGuild()
  const pathname = usePathname()

  function isActive(routePath: string) {
    const full = `${PATH}${guildId}${routePath === '/' ? '' : routePath}`
    if (routePath === '/') return pathname === `${PATH}${guildId}` || pathname === `${PATH}${guildId}/`
    return pathname.startsWith(full)
  }

  return (
    <GlassPanel variant="subtle" className="w-full rounded-full p-1.5">
      <nav className="flex gap-1">
        {routes.map((route) => {
          if (route.permission && !hasPermission(userId, 'manage_guild')) return null

          const active = isActive(route.path)
          return (
            <Link
              key={route.path}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all
                ${active
                  ? "bg-white/[0.08] text-primary shadow-[0_0_12px_rgba(var(--corona-rgb),0.4)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              href={`${PATH}${guildId}${route.path}`}
            >
              {route.label}
            </Link>
          )
        })}
      </nav>
    </GlassPanel>
  )
}
