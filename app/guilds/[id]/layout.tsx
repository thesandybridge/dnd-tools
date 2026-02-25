import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { GuildProvider } from "./providers/GuildProvider"
import GuildBanner from "./components/GuildBanner"
import GuildNav from "./components/GuildNav"

export default async function GuildLayout({ params, children }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  const { id } = await params

  return (
    <div className="flex justify-center p-4 overflow-x-hidden">
      <div className="max-w-5xl w-full min-w-0 flex flex-col items-center gap-4">
        <GuildProvider guildId={id}>
          <GuildBanner />
          <GuildNav guildId={id} userId={session.user.id} />
          <div className="w-full min-w-0">
            {children}
          </div>
        </GuildProvider>
      </div>
    </div>
  )
}
