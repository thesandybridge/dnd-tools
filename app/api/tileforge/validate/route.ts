import { auth } from "@/auth"

const TILEFORGE_API = "https://api.tileforge.sandybridge.io"

export const POST = auth(async function POST(request) {
  const session = request.auth

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { apiKey?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { apiKey } = body
  if (!apiKey || !apiKey.startsWith("tf_")) {
    return Response.json(
      { error: "Invalid API key format (must start with tf_)" },
      { status: 400 }
    )
  }

  try {
    const res = await fetch(`${TILEFORGE_API}/api/user`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (res.status === 401) {
      return Response.json(
        { error: "TileForge rejected the API key" },
        { status: 401 }
      )
    }

    if (!res.ok) {
      return Response.json(
        { error: "Failed to validate key with TileForge" },
        { status: 502 }
      )
    }

    const user = await res.json()
    return Response.json({ valid: true, plan: user.plan })
  } catch (error) {
    console.error("TileForge validation error:", (error as Error).message)
    return Response.json(
      { error: "TileForge service unreachable" },
      { status: 502 }
    )
  }
})
