import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const data = await prisma.user.findMany()

    return Response.json(data)
  } catch (error) {
    console.error('Failed to fetch users:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch users',
      details: (error as Error).message
    }, { status: 500 })
  }
})
