import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, uuid } = await params
    const guildId = guild_id as string
    const userId = session.user.id!

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    // Check: must be marker creator or have manage_markers permission
    const marker = await prisma.marker.findUnique({
      where: { uuid: uuid as string },
      select: { userId: true },
    })
    if (!marker) {
      return Response.json({ error: "Marker not found" }, { status: 404 })
    }
    if (marker.userId !== userId && !(await hasPermission(guildId, userId, "manage_markers"))) {
      return Response.json({ error: "You can only edit your own markers" }, { status: 403 })
    }

    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.distance !== undefined) data.distance = body.distance
    if (body.text !== undefined) data.text = body.text

    await prisma.marker.update({
      where: { uuid: uuid as string },
      data,
    })

    return Response.json(null)
  } catch (error) {
    console.error("Failed to update marker:", (error as Error).message)
    return Response.json({
      error: "Failed to update marker",
      details: (error as Error).message,
    }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, uuid } = await params
    const guildId = guild_id as string
    const userId = session.user.id!

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    // Check: must be marker creator or have manage_markers permission
    const marker = await prisma.marker.findUnique({
      where: { uuid: uuid as string },
      select: { userId: true, prevMarker: true },
    })
    if (!marker) {
      return Response.json({ error: "Marker not found" }, { status: 404 })
    }
    if (marker.userId !== userId && !(await hasPermission(guildId, userId, "manage_markers"))) {
      return Response.json({ error: "You can only delete your own markers" }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.marker.updateMany({
        where: { prevMarker: uuid as string },
        data: { prevMarker: marker.prevMarker },
      })

      await tx.marker.delete({ where: { uuid: uuid as string } })
    })

    return Response.json({ message: "Marker deleted successfully" })
  } catch (error) {
    console.error("Failed to delete marker:", (error as Error).message)
    return Response.json({
      error: "Failed to delete marker",
      details: (error as Error).message,
    }, { status: 500 })
  }
})
