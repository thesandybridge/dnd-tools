import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, uuid } = await params

    const member = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: session.user.id!,
        },
      },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
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

    const member = await prisma.guildMember.findUnique({
      where: {
        guildId_userId: {
          guildId: guild_id as string,
          userId: session.user.id!,
        },
      },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      const marker = await tx.marker.findUniqueOrThrow({
        where: { uuid: uuid as string },
        select: { prevMarker: true },
      })

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
