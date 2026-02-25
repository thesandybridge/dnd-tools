'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJoinRequests, reviewJoinRequest } from '@/lib/join-requests'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X, Clock, Inbox } from 'lucide-react'

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatExpiresIn(dateStr: string | null) {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Expires today'
  return `Expires in ${days}d`
}

export default function PendingTab({ guildId }: { guildId: string }) {
  const queryClient = useQueryClient()

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['join-requests', guildId, 'pending'],
    queryFn: () => fetchJoinRequests(guildId, 'pending'),
  })

  const approveMutation = useMutation({
    mutationFn: (requestId: number) => reviewJoinRequest(guildId, requestId, 'approved'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', guildId] })
      queryClient.invalidateQueries({ queryKey: ['guild', 'members', guildId] })
    },
  })

  const denyMutation = useMutation({
    mutationFn: (requestId: number) => reviewJoinRequest(guildId, requestId, 'denied'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['join-requests', guildId] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <GlassPanel key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          </GlassPanel>
        ))}
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <GlassPanel variant="subtle" className="p-8 text-center">
        <Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No pending requests</p>
      </GlassPanel>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {requests.map((req) => (
        <GlassPanel key={req.id} className="p-4">
          <div className="flex items-start gap-3">
            {req.user.image ? (
              <img src={req.user.image} alt="" className="h-10 w-10 rounded-full shrink-0" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/[0.08] shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{req.user.name || 'Unknown User'}</span>
                <span className="text-xs text-muted-foreground">{formatTimeAgo(req.created_at)}</span>
              </div>

              {req.message && (
                <p className="text-sm text-muted-foreground mt-1">{req.message}</p>
              )}

              {req.expires_at && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatExpiresIn(req.expires_at)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10 cursor-pointer"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate(req.id)}
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10 cursor-pointer"
                disabled={denyMutation.isPending}
                onClick={() => denyMutation.mutate(req.id)}
                title="Deny"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </GlassPanel>
      ))}
    </div>
  )
}
