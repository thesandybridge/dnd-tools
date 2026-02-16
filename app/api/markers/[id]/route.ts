import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    const uuid = id as string

    await prisma.$transaction(async (tx) => {
      // Get the marker being deleted to know its prev_marker
      const marker = await tx.marker.findUniqueOrThrow({
        where: { uuid },
        select: { prevMarker: true },
      })

      // Re-link any markers that pointed to this one
      await tx.marker.updateMany({
        where: { prevMarker: uuid },
        data: { prevMarker: marker.prevMarker },
      })

      // Delete the marker
      await tx.marker.delete({ where: { uuid } })
    })

    return Response.json({ message: "Marker deleted successfully" })
  } catch (error) {
    console.error('Failed to delete marker:', (error as Error).message)
    return Response.json({
      error: 'Failed to delete marker',
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
    const { distance } = await request.json()

    await prisma.marker.update({
      where: { id: Number(id) },
      data: { distance },
    })

    return Response.json(null)
  } catch (error) {
    console.error('Failed to update marker:', (error as Error).message)
    return Response.json({
      error: 'Failed to update marker',
      details: (error as Error).message
    }, { status: 500 })
  }
})
