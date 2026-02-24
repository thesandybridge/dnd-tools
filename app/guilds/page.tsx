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
      <div className="max-w-[1200px] w-full flex flex-col items-center gap-4">
        <CreateGuild userId={session?.user.id} />
        <GuildsTable userId={session?.user.id} />
      </div>
    </div>
  )
}
