'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitJoinRequest } from '@/lib/join-requests'
import type { DiscoverGuild } from '@/lib/guilds'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function JoinRequestDialog({
  guild,
  open,
  onOpenChange,
}: {
  guild: DiscoverGuild
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => submitJoinRequest(guild.guild_id, message.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover-guilds'] })
      onOpenChange(false)
      setMessage('')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-cinzel">Request to Join {guild.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Send a message to the guild managers with your request. This is optional.
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Why would you like to join? (optional)"
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
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
