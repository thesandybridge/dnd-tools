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

  return (
    <main className="main">
      <div className="wrapper">
        <GuildProvider guildId={params.id}>
          <GuildNav guildId={params.id} userId={session.user.id}/>
          <GuildBanner />
          {children}
        </GuildProvider>
      </div>
    </main>
  )
}
