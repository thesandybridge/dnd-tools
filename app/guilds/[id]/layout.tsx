import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { GuildProvider } from "./providers/GuildProvider"
import GuildBanner from "./components/GuildBanner"
import GuildNav from "./components/GuildNav"
import GuildNonMemberView from "./components/GuildNonMemberView"

export default async function GuildLayout({ params, children }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  const { id } = await params
  const userId = session.user.id!

  const [guild, membership] = await Promise.all([
    prisma.guild.findUnique({
      where: { guildId: id },
      select: {
        guildId: true,
        name: true,
        description: true,
        visibility: true,
        ownerId: true,
        _count: { select: { members: true } },
      },
    }),
    prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: id, userId } },
    }),
  ])

  if (!guild) {
    redirect('/guilds')
  }

  const isMember = !!membership || guild.ownerId === userId

  if (!isMember) {
    if (guild.visibility !== 'public') {
      redirect('/guilds')
    }

    const pendingRequest = await prisma.joinRequest.findFirst({
      where: { guildId: id, userId, status: 'pending' },
      select: { id: true },
    })

    return (
      <div className="flex justify-center p-4 overflow-x-hidden">
        <div className="max-w-5xl w-full min-w-0 flex flex-col items-center gap-4">
          <GuildNonMemberView
            guild={{
              guild_id: guild.guildId,
              name: guild.name,
              description: guild.description,
              member_count: guild._count.members,
            }}
            hasPendingRequest={!!pendingRequest}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center p-4 overflow-x-hidden">
      <div className="max-w-5xl w-full min-w-0 flex flex-col items-center gap-4">
        <GuildProvider guildId={id}>
          <GuildBanner />
          <GuildNav guildId={id} userId={userId} />
          <div className="w-full min-w-0">
            {children}
          </div>
        </GuildProvider>
      </div>
    </div>
  )
}
