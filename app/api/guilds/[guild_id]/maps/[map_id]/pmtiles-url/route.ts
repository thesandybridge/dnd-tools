import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id as string, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const map = await prisma.guildMap.findFirst({
      where: { mapId: map_id as string, guildId: guild_id as string },
    })
    if (!map) {
      return Response.json({ error: "Map not found" }, { status: 404 })
    }

    const tileforgeApiUrl = process.env.TILEFORGE_API_URL
    if (!tileforgeApiUrl) {
      console.error('TILEFORGE_API_URL is not configured')
      return Response.json({ error: "Tileforge not configured" }, { status: 500 })
    }

    const res = await fetch(
      `${tileforgeApiUrl}/api/tilesets/${map.tileforgeSlug}/pmtiles-url`,
      { headers: { Authorization: `Bearer ${map.tileforgeKey}` } }
    )

    if (!res.ok) {
      console.error('Tileforge API error:', res.status, await res.text())
      return Response.json({ error: "Failed to fetch PMTiles URL from Tileforge" }, { status: 502 })
    }

    const data = await res.json()
    return Response.json({ url: data.url })
  } catch (error) {
    console.error('Failed to fetch PMTiles URL:', (error as Error).message)
    return Response.json({
      error: 'Failed to fetch PMTiles URL',
      details: (error as Error).message
    }, { status: 500 })
  }
})
