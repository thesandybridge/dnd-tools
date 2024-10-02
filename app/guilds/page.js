import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CreateGuild from "./components/CreateGuild"
import GuildsTable from "./components/GuildsTable"

export default async function Guilds() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  return (
    <main className="main">
      <div className="wrapper">
        <CreateGuild userId={session?.user.id} />
        <GuildsTable userId={session?.user.id} />
      </div>
    </main >
  )
}
