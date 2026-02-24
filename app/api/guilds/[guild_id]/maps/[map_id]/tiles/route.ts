import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth

  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id as string, userId: session.user.id! } },
    })
    if (!member) {
      return new Response("Forbidden", { status: 403 })
    }

    const map = await prisma.guildMap.findFirst({
      where: { mapId: map_id as string, guildId: guild_id as string },
    })
    if (!map) {
      return new Response("Not found", { status: 404 })
    }

    const range = request.headers.get("Range")

    const upstreamHeaders: HeadersInit = {}
    if (range) {
      upstreamHeaders["Range"] = range
    }

    const upstream = await fetch(map.pmtilesUrl, {
      headers: upstreamHeaders,
      redirect: "follow",
    })

    if (!upstream.ok && upstream.status !== 206) {
      return new Response("Failed to fetch tiles", { status: 502 })
    }

    const responseHeaders = new Headers()
    const contentType = upstream.headers.get("Content-Type")
    if (contentType) responseHeaders.set("Content-Type", contentType)
    const contentLength = upstream.headers.get("Content-Length")
    if (contentLength) responseHeaders.set("Content-Length", contentLength)
    const contentRange = upstream.headers.get("Content-Range")
    if (contentRange) responseHeaders.set("Content-Range", contentRange)
    const acceptRanges = upstream.headers.get("Accept-Ranges")
    if (acceptRanges) responseHeaders.set("Accept-Ranges", acceptRanges)

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("Tile proxy error:", (error as Error).message)
    return new Response("Internal server error", { status: 500 })
  }
})
