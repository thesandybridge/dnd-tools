'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useGuild } from "../providers/GuildProvider"

const PATH = "/guilds/"
const routes = [
  { path: '/', label: 'Overview' },
  { path: '/members', label: 'Members' },
  { path: '/settings', label: 'Settings', permission: 'admin' },
]

export default function GuildNav({ guildId, userId }: { guildId: string; userId: string }) {
  const { isAdminOrOwner } = useGuild()
  const pathname = usePathname()

  function isActive(routePath: string) {
    const full = `${PATH}${guildId}${routePath === '/' ? '' : routePath}`
    if (routePath === '/') return pathname === `${PATH}${guildId}` || pathname === `${PATH}${guildId}/`
    return pathname.startsWith(full)
  }

  return (
    <nav className="flex w-full border-b border-border">
      {routes.map((route) => {
        if (route.permission && !isAdminOrOwner(userId)) return null

        const active = isActive(route.path)
        return (
          <Link
            key={route.path}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
              ${active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            href={`${PATH}${guildId}${route.path}`}
          >
            {route.label}
          </Link>
        )
      })}
    </nav>
  )
}
