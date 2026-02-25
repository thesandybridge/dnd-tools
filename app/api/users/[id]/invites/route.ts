import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuildInvite } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const userId = id as string

    if (session.user.id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    // Expiry-on-read: mark expired invites
    await prisma.guildInvite.updateMany({
      where: {
        targetUserId: userId,
        status: "pending",
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    })

    const invites = await prisma.guildInvite.findMany({
      where: {
        targetUserId: userId,
        status: "pending",
      },
      include: {
        guild: { select: { guildId: true, name: true } },
        invitedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(invites.map(serializeGuildInvite))
  } catch (error) {
    console.error("Failed to fetch invites:", (error as Error).message)
    return Response.json({ error: "Failed to fetch invites" }, { status: 500 })
  }
})
