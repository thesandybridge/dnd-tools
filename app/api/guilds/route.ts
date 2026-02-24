import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuild } from "@/lib/serializers"

export const GET = auth(async function GET(request) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const guilds = await prisma.guild.findMany()

    return Response.json(guilds.map(serializeGuild))
  } catch (error) {
    console.error('Failed to fetch guilds:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch guilds',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const POST = auth(async function POST(request) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { guildData } = await request.json()

    const guild = await prisma.$transaction(async (tx) => {
      const newGuild = await tx.guild.create({
        data: {
          name: guildData.name,
          ownerId: guildData.owner,
        },
      })

      const guildMaster = await tx.guildRole.create({
        data: {
          guildId: newGuild.guildId,
          name: "Guild Master",
          color: "#f59e0b",
          position: 0,
          manageMembers: true,
          manageMaps: true,
          manageMarkers: true,
          manageGuild: true,
          isSystem: true,
        },
      })

      await tx.guildRole.create({
        data: {
          guildId: newGuild.guildId,
          name: "Dungeon Master",
          color: "#8b5cf6",
          position: 1,
          manageMembers: true,
          manageMaps: true,
          manageMarkers: true,
          manageGuild: false,
          isSystem: true,
        },
      })

      await tx.guildRole.create({
        data: {
          guildId: newGuild.guildId,
          name: "Adventurer",
          color: "#6b7280",
          position: 2,
          manageMembers: false,
          manageMaps: false,
          manageMarkers: true,
          manageGuild: false,
          isSystem: true,
        },
      })

      await tx.guildMember.create({
        data: {
          guildId: newGuild.guildId,
          userId: guildData.owner,
          roleId: guildMaster.id,
        },
      })

      return newGuild
    })

    return Response.json(serializeGuild(guild))
  } catch (error) {
    console.error('Failed to add guild:', (error as Error).message)
    return Response.json({
      error: 'Failed to add guild',
      details: (error as Error).message
    }, { status: 500 })
  }
})
