'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { fetchInvitableGuilds, type InvitableGuild } from '@/lib/invites'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Mail, Loader2 } from 'lucide-react'
import InviteDialog from './InviteDialog'

export default function InvitePopover({
  targetUserId,
  targetUserName,
}: {
  targetUserId: string
  targetUserName: string | null
}) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [selectedGuild, setSelectedGuild] = useState<InvitableGuild | null>(null)

  const { data: guilds, isLoading } = useQuery({
    queryKey: ['invitable-guilds', targetUserId],
    queryFn: () => fetchInvitableGuilds(targetUserId),
    enabled: open,
  })

  // Don't show invite button for self or if not logged in
  if (!session?.user || session.user.id === targetUserId) return null

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button size="sm" variant="ghost" className="cursor-pointer gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5" />
            Invite
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-56" align="start">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : !guilds || guilds.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No guilds available to invite to
            </div>
          ) : (
            <Command>
              <CommandList>
                <CommandGroup heading="Your guilds">
                  {guilds.map((guild) => (
                    <CommandItem
                      key={guild.guild_id}
                      value={guild.name}
                      onSelect={() => {
                        setSelectedGuild(guild)
                        setOpen(false)
                      }}
                    >
                      {guild.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>

      {selectedGuild && (
        <InviteDialog
          guild={selectedGuild}
          targetUserId={targetUserId}
          targetUserName={targetUserName}
          open={!!selectedGuild}
          onOpenChange={(open) => { if (!open) setSelectedGuild(null) }}
        />
      )}
    </>
  )
}
