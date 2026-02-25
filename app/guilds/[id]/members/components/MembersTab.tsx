'use client'

import { useGuild } from '../../providers/GuildProvider'
import useDeleteMemberMutation from '../../../hooks/useDeleteMemberMutation'
import { updateMember } from '@/lib/members'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import GuildAddMember from '../../components/GuildAddMember'

export default function MembersTab({ userId }: { userId: string }) {
  const { guildData, membersData, rolesData, hasPermission, getMemberRole } = useGuild()
  const { mutation } = useDeleteMemberMutation(guildData)
  const { mutate: deleteMemberMutate, isPending: isDeleting } = mutation

  const queryClient = useQueryClient()
  const canManage = hasPermission(userId, 'manage_members')
  const actorRole = getMemberRole(userId)
  const members = membersData || []
  const roles = (rolesData || []).sort((a, b) => a.position - b.position)

  const roleMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: number }) =>
      updateMember(guildData.guild_id, memberId, { roleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', guildData.guild_id] })
    },
  })

  // Roles the actor can assign (must outrank them)
  const assignableRoles = actorRole
    ? roles.filter(r => !r.is_system && r.position > actorRole.position)
    : []

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

                const canChangeRole = canManage
                  && actorRole
                  && member.role.position !== 0
                  && actorRole.position < member.role.position
                  && assignableRoles.length > 0

                return (
                  <GlassPanel
                    key={member.user_id}
                    variant="subtle"
                    className="group p-4 flex items-center justify-between gap-2 transition-colors hover:bg-card/70"
                  >
                    <span className="text-sm font-medium text-foreground truncate">
                      {member.users?.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {canChangeRole && (
                        <Select
                          value={member.role.id.toString()}
                          onValueChange={(value) =>
                            roleMutation.mutate({ memberId: member.user_id, roleId: parseInt(value) })
                          }
                          disabled={roleMutation.isPending}
                        >
                          <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assignableRoles.map((r) => (
                              <SelectItem key={r.id} value={r.id.toString()}>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                                  {r.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {canRemove && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMemberMutate(member.user_id)
                          }}
                          disabled={isDeleting}
                          variant="destructive"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
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
