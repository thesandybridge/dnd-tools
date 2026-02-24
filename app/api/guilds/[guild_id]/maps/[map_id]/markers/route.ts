import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeMarker } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

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

    const markers = await prisma.marker.findMany({
      where: { guildMapId: map_id as string },
      orderBy: { createdAt: "asc" },
    })

    return Response.json(markers.map(serializeMarker))
  } catch (error) {
    console.error("Failed to fetch markers:", (error as Error).message)
    return Response.json({
      error: "Failed to fetch markers",
      details: (error as Error).message,
    }, { status: 500 })
  }
})

export const POST = auth(async function POST(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

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

    const { position, prev_marker, distance, uuid } = await request.json()
    const numericDistance = typeof distance === "number" ? distance : parseFloat(distance)

    const marker = await prisma.marker.create({
      data: {
        uuid,
        userId: session.user.id!,
        guildMapId: map_id as string,
        position,
        prevMarker: prev_marker,
        distance: Number.isFinite(numericDistance) ? numericDistance : 0,
      },
    })

    return Response.json(serializeMarker(marker), { status: 201 })
  } catch (error) {
    console.error("Failed to create marker:", (error as Error).message)
    return Response.json({
      error: "Failed to create marker",
      details: (error as Error).message,
    }, { status: 500 })
  }
})
