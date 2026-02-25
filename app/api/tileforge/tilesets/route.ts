import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const TILEFORGE_API = "https://api.tileforge.sandybridge.io"

export const GET = auth(async function GET(request) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id! },
      select: { tileforgeApiKey: true },
    })

    if (!user?.tileforgeApiKey) {
      return Response.json(
        { error: "TileForge API key not configured" },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const params = new URLSearchParams()
    const search = searchParams.get("search")
    const page = searchParams.get("page")
    if (search) params.set("search", search)
    if (page) params.set("page", page)

    const res = await fetch(`${TILEFORGE_API}/api/tilesets?${params}`, {
      headers: { Authorization: `Bearer ${user.tileforgeApiKey}` },
    })

    if (res.status === 401) {
      return Response.json(
        { error: "TileForge API key is invalid or expired" },
        { status: 401 }
      )
    }

    if (!res.ok) {
      return Response.json(
        { error: "Failed to fetch tilesets from TileForge" },
        { status: 502 }
      )
    }

    const data = await res.json()
    return Response.json(data)
  } catch (error) {
    console.error("TileForge proxy error:", (error as Error).message)
    return Response.json(
      { error: "TileForge service unreachable" },
      { status: 502 }
    )
  }
})
