'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitJoinRequest } from '@/lib/join-requests'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Users, ArrowLeft, Loader2 } from 'lucide-react'

interface GuildInfo {
  guild_id: string
  name: string
  description: string | null
  member_count: number
}

export default function GuildNonMemberView({
  guild,
  hasPendingRequest,
}: {
  guild: GuildInfo
  hasPendingRequest: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(hasPendingRequest)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => submitJoinRequest(guild.guild_id, message.trim() || undefined),
    onSuccess: () => {
      setSubmitted(true)
      setShowForm(false)
      queryClient.invalidateQueries({ queryKey: ['discover-guilds'] })
    },
  })

  return (
    <div className="w-full flex flex-col gap-4">
      <GlassPanel corona className="w-full px-4 sm:px-6 py-5">
        <h1 className="font-cinzel text-xl sm:text-2xl font-bold text-foreground tracking-wide truncate">
          {guild.name}
        </h1>
        {guild.description && (
          <p className="text-sm text-muted-foreground mt-2">{guild.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{guild.member_count} {guild.member_count === 1 ? 'member' : 'members'}</span>
        </div>
      </GlassPanel>

      <GlassPanel className="w-full p-6">
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Your request to join is pending review by the guild managers.</p>
          </div>
        ) : showForm ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-cinzel text-lg font-semibold">Request to Join</h2>
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
              <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => setShowForm(false)}>
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
        ) : (
          <div className="text-center py-4 flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">You are not a member of this guild.</p>
            <Button size="sm" className="cursor-pointer" onClick={() => setShowForm(true)}>
              Request to Join
            </Button>
          </div>
        )}
      </GlassPanel>

      <Link href="/guilds" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to Guilds
      </Link>
    </div>
  )
}
