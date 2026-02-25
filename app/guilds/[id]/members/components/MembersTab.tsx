'use client'

import { useGuild } from '../../providers/GuildProvider'
import useDeleteMemberMutation from '../../../hooks/useDeleteMemberMutation'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import GuildAddMember from '../../components/GuildAddMember'

export default function MembersTab({ userId }: { userId: string }) {
  const { guildData, membersData, rolesData, hasPermission, getMemberRole } = useGuild()
  const { mutation } = useDeleteMemberMutation(guildData)
  const { mutate: deleteMemberMutate, isPending: isDeleting } = mutation

  const canManage = hasPermission(userId, 'manage_members')
  const actorRole = getMemberRole(userId)
  const members = membersData || []
  const roles = (rolesData || []).sort((a, b) => a.position - b.position)

  // Group members by role id
  const membersByRole = new Map<number, typeof members>()
  for (const member of members) {
    const roleId = member.role.id
    if (!membersByRole.has(roleId)) membersByRole.set(roleId, [])
    membersByRole.get(roleId)!.push(member)
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && <GuildAddMember userId={userId} />}

      {roles.map((role) => {
        const roleMembers = membersByRole.get(role.id)
        if (!roleMembers || roleMembers.length === 0) return null

        return (
          <div key={role.id} className="flex flex-col gap-3">
            {/* Role header */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
              <span className="font-cinzel text-sm font-semibold">{role.name}</span>
              <span className="text-xs text-muted-foreground">({roleMembers.length})</span>
            </div>

            {/* Member cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {roleMembers.map((member) => {
                const canRemove = canManage
                  && actorRole
                  && member.role.position !== 0
                  && actorRole.position < member.role.position

                return (
                  <GlassPanel
                    key={member.user_id}
                    variant="subtle"
                    className="group p-4 flex items-center justify-between gap-2 transition-colors hover:bg-card/70"
                  >
                    <span className="text-sm font-medium text-foreground truncate">
                      {member.users?.name}
                    </span>
                    {canRemove && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteMemberMutate(member.user_id)
                        }}
                        disabled={isDeleting}
                        variant="destructive"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                      >
                        Remove
                      </Button>
                    )}
                  </GlassPanel>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
