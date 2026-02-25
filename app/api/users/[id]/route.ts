import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeUser } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params

    const data = await prisma.user.findUniqueOrThrow({
      where: { id },
    })

    return Response.json(serializeUser(data))
  } catch (error) {
    console.error('Failed to fetch user data:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch user data',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    if (session.user.id !== id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const allowed = ['name', 'bio', 'color', 'themeName', 'themeMode', 'particleEffect', 'coronaIntensity']
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    })

    return Response.json(serializeUser(user))
  } catch (error) {
    console.error('Failed to update user:', (error as Error).message)
    return Response.json({ error: 'Failed to update user' }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    if (session.user.id !== id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      // Find guilds owned by this user
      const ownedGuilds = await tx.guild.findMany({
        where: { ownerId: id },
        include: {
          members: {
            where: { userId: { not: id } },
            include: { role: true },
            orderBy: { role: { position: 'asc' } },
          },
        },
      })

      for (const guild of ownedGuilds) {
        if (guild.members.length > 0) {
          const newOwner = guild.members[0]
          const ownerRole = await tx.guildRole.findFirst({
            where: { guildId: guild.guildId, position: 0 },
          })
          await tx.guild.update({
            where: { id: guild.id },
            data: { ownerId: newOwner.userId },
          })
          if (ownerRole) {
            await tx.guildMember.update({
              where: { guildId_userId: { guildId: guild.guildId, userId: newOwner.userId } },
              data: { roleId: ownerRole.id },
            })
          }
        } else {
          await tx.guild.delete({ where: { id: guild.id } })
        }
      }

      await tx.guildMember.deleteMany({ where: { userId: id } })
      await tx.user.delete({ where: { id } })
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', (error as Error).message)
    return Response.json({ error: 'Failed to delete account' }, { status: 500 })
  }
})
