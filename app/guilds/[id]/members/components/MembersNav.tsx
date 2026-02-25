'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchJoinRequests } from '@/lib/join-requests'
import { useGuild } from '../../providers/GuildProvider'
import { GlassPanel } from '@/app/components/ui/GlassPanel'

export default function MembersNav({
  activeTab,
  onTabChange,
  guildId,
  userId,
}: {
  activeTab: 'members' | 'pending'
  onTabChange: (tab: 'members' | 'pending') => void
  guildId: string
  userId: string
}) {
  const { hasPermission } = useGuild()
  const canManage = hasPermission(userId, 'manage_members')

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['join-requests', guildId, 'pending'],
    queryFn: () => fetchJoinRequests(guildId, 'pending'),
    enabled: canManage,
  })

  const tabs = [
    { key: 'members' as const, label: 'Members' },
    ...(canManage ? [{ key: 'pending' as const, label: 'Pending', count: pendingRequests.length }] : []),
  ]

  return (
    <GlassPanel variant="subtle" className="w-full rounded-full p-1.5">
      <nav className="flex gap-1 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-3 py-2 sm:px-4 text-sm font-medium rounded-full transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5
              ${activeTab === tab.key
                ? "bg-white/[0.08] text-primary shadow-[0_0_12px_rgba(var(--corona-rgb),0.4)]"
                : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
          >
            {tab.label}
            {'count' in tab && tab.count > 0 && (
              <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </GlassPanel>
  )
}
