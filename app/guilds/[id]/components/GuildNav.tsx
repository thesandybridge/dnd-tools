'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useGuild } from "../providers/GuildProvider"
import { fetchJoinRequests } from "@/lib/join-requests"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const PATH = "/guilds/"
const routes = [
  { path: '/', label: 'Overview' },
  { path: '/map', label: 'Maps' },
  { path: '/members', label: 'Members', pendingBadge: true },
  { path: '/settings', label: 'Settings', permission: 'admin' },
]

export default function GuildNav({ guildId, userId }: { guildId: string; userId: string }) {
  const { hasPermission } = useGuild()
  const pathname = usePathname()
  const canManageMembers = hasPermission(userId, 'manage_members')

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['join-requests', guildId, 'pending'],
    queryFn: () => fetchJoinRequests(guildId, 'pending'),
    enabled: canManageMembers,
  })

  function isActive(routePath: string) {
    const full = `${PATH}${guildId}${routePath === '/' ? '' : routePath}`
    if (routePath === '/') return pathname === `${PATH}${guildId}` || pathname === `${PATH}${guildId}/`
    return pathname.startsWith(full)
  }

  return (
    <GlassPanel variant="subtle" className="w-full rounded-full p-1.5 overflow-x-auto">
      <nav className="flex gap-1 flex-wrap sm:flex-nowrap justify-center">
        {routes.map((route) => {
          if (route.permission && !hasPermission(userId, 'manage_guild')) return null

          const active = isActive(route.path)
          const pendingCount = route.pendingBadge && canManageMembers ? pendingRequests.length : 0
          return (
            <Link
              key={route.path}
              className={`px-3 py-2 sm:px-4 text-sm font-medium rounded-full transition-all whitespace-nowrap flex items-center gap-1.5
                ${active
                  ? "bg-white/[0.08] text-primary shadow-[0_0_12px_rgba(var(--corona-rgb),0.4)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              href={`${PATH}${guildId}${route.path}`}
            >
              {route.label}
              {pendingCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
    </GlassPanel>
  )
}
