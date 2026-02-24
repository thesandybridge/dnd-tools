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
    <div className="flex justify-center p-4">
      <div className="max-w-6xl w-full flex flex-col gap-6">
        <h1 className="font-cinzel text-3xl text-foreground tracking-wide">Your Guilds</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CreateGuild userId={session?.user.id} />
          <GuildsTable userId={session?.user.id} />
        </div>
      </div>
    </div>
  )
}
