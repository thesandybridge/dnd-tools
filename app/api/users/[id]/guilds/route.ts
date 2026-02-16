import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuild } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params

    const guilds = await prisma.guild.findMany({
      where: { ownerId: id },
    })

    return Response.json(guilds.map(serializeGuild))
  } catch (error) {
    console.error('Failed to fetch user guilds:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch user guilds',
      details: (error as Error).message
    }, { status: 500 })
  }
})
