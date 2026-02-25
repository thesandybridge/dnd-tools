'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createInvite, type InvitableGuild } from '@/lib/invites'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function InviteDialog({
  guild,
  targetUserId,
  targetUserName,
  open,
  onOpenChange,
}: {
  guild: InvitableGuild
  targetUserId: string
  targetUserName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => createInvite(guild.guild_id, targetUserId, message.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitable-guilds', targetUserId] })
      onOpenChange(false)
      setMessage('')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-cinzel">
            Invite {targetUserName || 'User'} to {guild.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Send an invite with an optional message. The invite expires in 7 days.
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message (optional)"
            className="bg-white/[0.05] border-white/[0.08] min-h-[80px]"
          />
          {mutation.isError && (
            <p className="text-sm text-destructive">{mutation.error.message}</p>
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="cursor-pointer"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
