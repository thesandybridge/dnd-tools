import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const url = new URL(request.url)
    const take = parseInt(url.searchParams.get('take') || '5', 10)
    const match = url.searchParams.get('match') || ''

    const data = await prisma.user.findMany({
      where: {
        name: { contains: match, mode: 'insensitive' },
      },
      select: { id: true, name: true, email: true },
      take,
    })

    return Response.json(data)
  } catch (error) {
    console.error('Failed to fetch users:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch users',
      details: (error as Error).message
    }, { status: 500 })
  }
})
