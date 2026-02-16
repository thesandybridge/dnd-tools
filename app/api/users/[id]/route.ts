import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

    return Response.json(data)
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
    const { userData } = await request.json()

    const data = await prisma.user.update({
      where: { id },
      data: { color: userData.color },
    })

    return Response.json([data])
  } catch (error) {
    console.error('Failed to update user color:', (error as Error).message)
    return Response.json({
      error: 'Failed to update user color',
      details: (error as Error).message
    }, { status: 500 })
  }
})
