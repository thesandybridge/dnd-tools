'use client'

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Shield, Sword, MapPin, Map, Users } from "lucide-react"

interface ActivityEvent {
  type: string
  date: string
  data: Record<string, unknown>
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const EVENT_CONFIG: Record<string, { icon: typeof Shield; label: (d: Record<string, unknown>) => string; href?: (d: Record<string, unknown>) => string }> = {
  // User-scoped events
  guild_join: {
    icon: Shield,
    label: (d) => `Joined ${d.guild_name}`,
    href: (d) => `/guilds/${d.guild_id}`,
  },
  character_create: {
    icon: Sword,
    label: (d) => `Created ${d.name}${d.char_class ? ` the ${d.char_class}` : ''}`,
    href: (d) => `/characters/${d.id}`,
  },
  // Guild-scoped events
  member_join: {
    icon: Users,
    label: (d) => `${d.user_name} joined the guild`,
  },
  map_create: {
    icon: Map,
    label: (d) => `Map "${d.map_name}" was created`,
  },
  // Shared
  marker_place: {
    icon: MapPin,
    label: (d) => d.user_name
      ? `${d.user_name} placed a marker${d.text ? `: ${d.text}` : ''} on ${d.map_name}`
      : `Placed a marker${d.text ? `: ${d.text}` : ''} on ${d.map_name}`,
  },
}

interface ActivityFeedProps {
  limit?: number
  guildId?: string
}

export default function ActivityFeed({ limit = 10, guildId }: ActivityFeedProps) {
  const { data: session } = useSession()

  const { data: events = [], isLoading } = useQuery({
    queryKey: guildId ? ['guild-activity', guildId] : ['activity'],
    queryFn: async () => {
      const url = guildId ? `/api/guilds/${guildId}/activity` : '/api/activity'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch activity')
      return res.json() as Promise<ActivityEvent[]>
    },
    enabled: !!session?.user,
    staleTime: 60000,
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading activity...</p>
  }

  const display = events.slice(0, limit)

  if (display.length === 0) {
    const emptyText = guildId
      ? 'No recent guild activity yet.'
      : 'No recent activity. Join a guild or create a character to get started.'
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <div className="flex flex-col gap-1">
      {display.map((event, i) => {
        const config = EVENT_CONFIG[event.type]
        if (!config) return null
        const Icon = config.icon
        const label = config.label(event.data)
        const href = config.href?.(event.data)

        const content = (
          <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/[0.03] transition-colors">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm truncate flex-1">{label}</span>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo(event.date)}</span>
          </div>
        )

        return href ? (
          <Link key={`${event.type}-${i}`} href={href}>{content}</Link>
        ) : (
          <div key={`${event.type}-${i}`}>{content}</div>
        )
      })}
    </div>
  )
}
