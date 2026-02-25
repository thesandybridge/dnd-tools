'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { fetchUserInvites, respondToInvite } from '@/lib/invites'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, X, Clock, Mail } from 'lucide-react'

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatExpiresIn(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Expires today'
  return `Expires in ${days}d`
}

export default function PendingInvites({ userId }: { userId: string }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const isOwner = session?.user?.id === userId

  const { data: invites = [], isLoading } = useQuery({
    queryKey: ['user-invites', userId],
    queryFn: () => fetchUserInvites(userId),
    enabled: isOwner,
  })

  const acceptMutation = useMutation({
    mutationFn: (inviteId: number) => respondToInvite(userId, inviteId, 'accepted'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', userId] })
      queryClient.invalidateQueries({ queryKey: ['userGuilds', userId] })
    },
  })

  const declineMutation = useMutation({
    mutationFn: (inviteId: number) => respondToInvite(userId, inviteId, 'declined'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invites', userId] })
    },
  })

  if (!isOwner) return null

  return (
    <GlassPanel className="w-full p-6">
      <h2 className="font-cinzel text-lg font-semibold mb-4">Guild Invites</h2>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02]">
              <Skeleton className="h-4 w-4 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div className="text-center py-4">
          <Mail className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No pending invites</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {invites.map((invite) => (
            <div key={invite.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{invite.guild.name}</span>
                  <span className="text-xs text-muted-foreground">{formatTimeAgo(invite.created_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Invited by {invite.invited_by.name || 'Unknown'}
                </p>
                {invite.message && (
                  <p className="text-sm text-muted-foreground mt-1.5 italic">&ldquo;{invite.message}&rdquo;</p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatExpiresIn(invite.expires_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10 cursor-pointer"
                  disabled={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate(invite.id)}
                  title="Accept"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive/80 hover:bg-destructive/10 cursor-pointer"
                  disabled={declineMutation.isPending}
                  onClick={() => declineMutation.mutate(invite.id)}
                  title="Decline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}
