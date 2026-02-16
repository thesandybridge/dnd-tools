import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeMarker } from "@/lib/serializers"
import type { Marker } from "@/lib/markers"

export const GET = auth(async function GET(request) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const markers = await prisma.marker.findMany({
      where: { userId: session.user.id! },
    })

    return Response.json(markers.map(serializeMarker))
  } catch (error) {
    console.error('Failed to fetch markers:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch markers',
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
    const requestData: Marker = await request.json()
    const { position, prev_marker, distance, uuid } = requestData

    const marker = await prisma.marker.create({
      data: {
        uuid: uuid,
        userId: session.user.id!,
        position: position as object,
        distance: distance != null ? Number(distance) : 0,
        prevMarker: prev_marker != null ? String(prev_marker) : null,
      },
    })

    return Response.json(serializeMarker(marker), { status: 201 })
  } catch (error) {
    console.error('Failed to insert marker:', (error as Error).message)
    return Response.json({
      error: 'Failed to insert marker',
      details: (error as Error).message
    }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await request.json()

    await prisma.marker.delete({
      where: { id },
    })

    return Response.json(null, { status: 201 })
  } catch (error) {
    console.error('Failed to delete marker:', (error as Error).message)
    return Response.json({
      error: 'Failed to delete marker',
      details: (error as Error).message
    }, { status: 500 })
  }
})
