import { prisma } from "@/lib/prisma"

type Permission = 'manage_members' | 'manage_maps' | 'manage_markers' | 'manage_guild'

/** Check if a user has a specific permission in a guild. Owner always returns true. */
export async function hasPermission(guildId: string, userId: string, permission: Permission): Promise<boolean> {
  const guild = await prisma.guild.findUnique({ where: { guildId } })
  if (!guild) return false
  if (guild.ownerId === userId) return true

  const member = await prisma.guildMember.findUnique({
    where: { guildId_userId: { guildId, userId } },
    include: { role: true },
  })
  if (!member) return false

  const permissionMap: Record<Permission, keyof typeof member.role> = {
    manage_members: 'manageMembers',
    manage_maps: 'manageMaps',
    manage_markers: 'manageMarkers',
    manage_guild: 'manageGuild',
  }

  return member.role[permissionMap[permission]] as boolean
}

/** Check if a user is the guild owner */
export async function isGuildOwner(guildId: string, userId: string): Promise<boolean> {
  const guild = await prisma.guild.findUnique({ where: { guildId } })
  return guild?.ownerId === userId
}

/** Check if actor's role outranks target's role (lower position = higher rank) */
export function outranks(actorPosition: number, targetPosition: number): boolean {
  return actorPosition < targetPosition
}
