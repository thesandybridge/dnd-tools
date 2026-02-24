'use client'

import { useGuild } from "../providers/GuildProvider"
import useDeleteMemberMutation from '../../hooks/useDeleteMemberMutation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

export default function GuildMembers({ userId }) {
  const { guildData, membersData, isAdminOrOwner } = useGuild()

  const { mutation } = useDeleteMemberMutation(guildData)
  const { mutate: deleteMemberMutate, isPending: isDeleting, error } = mutation

  const handleDeleteClick = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation()
    e.preventDefault()
    deleteMemberMutate(memberId)
  }

  if (isDeleting) return <p className="text-muted-foreground text-center py-8">Loading...</p>
  if (error) return <p className="text-destructive text-center py-8">Error: {error.message}</p>

  const members = membersData || []
  const canManage = isAdminOrOwner(userId)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {members.map((member) => {
        const role = member.role
        const variant = role === 'owner' ? 'default' : 'secondary'

        return (
          <GlassPanel
            key={member.user_id}
            variant="subtle"
            className="group p-4 flex flex-col gap-3 transition-colors hover:bg-card/70"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate">
                {member.users?.name}
              </span>
              <Badge variant={variant} className="capitalize shrink-0 ml-2">
                {role}
              </Badge>
            </div>

            {canManage && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  onClick={(e) => handleDeleteClick(e, member.user_id)}
                  disabled={isDeleting}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  {isDeleting ? 'Deleting...' : 'Remove'}
                </Button>
              </div>
            )}
          </GlassPanel>
        )
      })}
    </div>
  )
}
