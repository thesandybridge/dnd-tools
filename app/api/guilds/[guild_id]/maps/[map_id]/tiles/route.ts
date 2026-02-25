import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// Cache presigned URLs in memory (they expire in 10 min, we refresh at 8)
const presignedCache = new Map<number, { url: string; expiresAt: number }>()
const CACHE_TTL = 8 * 60 * 1000

async function resolveApiKey(map: { pmtilesApiKey: string | null; tileforgeKeyUserId: string | null }): Promise<string | null> {
  if (map.tileforgeKeyUserId) {
    const user = await prisma.user.findUnique({
      where: { id: map.tileforgeKeyUserId },
      select: { tileforgeApiKey: true },
    })
    return user?.tileforgeApiKey ?? null
  }
  return map.pmtilesApiKey
}

async function resolvePresignedUrl(map: { id: number; pmtilesUrl: string; pmtilesApiKey: string | null; tileforgeKeyUserId: string | null }): Promise<string> {
  const cached = presignedCache.get(map.id)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  const apiKey = await resolveApiKey(map)

  const headers: HeadersInit = {}
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`
  }

  const res = await fetch(map.pmtilesUrl, { headers })
  if (!res.ok) {
    throw new Error(`Failed to resolve presigned URL: ${res.status}`)
  }

  const data = await res.json()
  const url = data.url as string

  presignedCache.set(map.id, { url, expiresAt: Date.now() + CACHE_TTL })
  return url
}

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

    const tileUrl = await resolvePresignedUrl(map)

    const range = request.headers.get("Range")
    const upstreamHeaders: HeadersInit = {}
    if (range) {
      upstreamHeaders["Range"] = range
    }

    const upstream = await fetch(tileUrl, {
      headers: upstreamHeaders,
      redirect: "follow",
    })

    if (!upstream.ok && upstream.status !== 206) {
      // Presigned URL may have expired early, clear cache and retry once
      presignedCache.delete(map.id)
      const retryUrl = await resolvePresignedUrl(map)
      const retry = await fetch(retryUrl, {
        headers: upstreamHeaders,
        redirect: "follow",
      })
      if (!retry.ok && retry.status !== 206) {
        return new Response("Failed to fetch tiles", { status: 502 })
      }
      return buildTileResponse(retry)
    }

    return buildTileResponse(upstream)
  } catch (error) {
    console.error("Tile proxy error:", (error as Error).message)
    return new Response("Internal server error", { status: 500 })
  }
})

function buildTileResponse(upstream: Response): Response {
  const responseHeaders = new Headers()
  const contentType = upstream.headers.get("Content-Type")
  if (contentType) responseHeaders.set("Content-Type", contentType)
  const contentLength = upstream.headers.get("Content-Length")
  if (contentLength) responseHeaders.set("Content-Length", contentLength)
  const contentRange = upstream.headers.get("Content-Range")
  if (contentRange) responseHeaders.set("Content-Range", contentRange)
  responseHeaders.set("Accept-Ranges", "bytes")

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}
