import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/permissions"
import { serializeJoinRequest } from "@/lib/serializers"

export const POST = auth(async function POST(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params
    const guildId = guild_id as string
    const userId = session.user.id!

    const guild = await prisma.guild.findUnique({ where: { guildId } })
    if (!guild) {
      return Response.json({ error: "Guild not found" }, { status: 404 })
    }
    if (guild.visibility !== "public") {
      return Response.json({ error: "Guild is not accepting join requests" }, { status: 403 })
    }

    const existingMember = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId, userId } },
    })
    if (existingMember) {
      return Response.json({ error: "You are already a member of this guild" }, { status: 409 })
    }

    const existingRequest = await prisma.joinRequest.findFirst({
      where: { guildId, userId, status: "pending" },
    })
    if (existingRequest) {
      return Response.json({ error: "You already have a pending request for this guild" }, { status: 409 })
    }

    let body: { message?: string } = {}
    try {
      body = await request.json()
    } catch {
      // No body or invalid JSON is fine - message is optional
    }
    const message = body.message || null

    const expiresAt = guild.requestExpiryDays != null
      ? new Date(Date.now() + guild.requestExpiryDays * 24 * 60 * 60 * 1000)
      : null

    const joinRequest = await prisma.joinRequest.create({
      data: { guildId, userId, message, expiresAt },
      include: { user: { select: { id: true, name: true, image: true } } },
    })

    return Response.json(serializeJoinRequest(joinRequest))
  } catch (error) {
    console.error("Failed to create join request:", (error as Error).message)
    return Response.json({ error: "Failed to create join request", details: (error as Error).message }, { status: 500 })
  }
})

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params
    const guildId = guild_id as string

    if (!await hasPermission(guildId, session.user.id!, "manage_members")) {
      return Response.json({ error: "You do not have permission to view join requests" }, { status: 403 })
    }

    // Expire any overdue pending requests
    await prisma.joinRequest.updateMany({
      where: {
        guildId,
        status: "pending",
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    })

    const url = new URL(request.url)
    const validStatuses = ["pending", "approved", "denied", "expired"]
    const rawStatus = url.searchParams.get("status")
    const status = rawStatus && validStatuses.includes(rawStatus) ? rawStatus : null

    const requests = await prisma.joinRequest.findMany({
      where: {
        guildId,
        ...(status ? { status } : {}),
      },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(requests.map(serializeJoinRequest))
  } catch (error) {
    console.error("Failed to fetch join requests:", (error as Error).message)
    return Response.json({ error: "Failed to fetch join requests", details: (error as Error).message }, { status: 500 })
  }
})
