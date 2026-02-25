import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CreateGuild from "../../components/CreateGuild"
import GuildsTable from "../../components/GuildsTable"

export default async function MyGuilds() {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <CreateGuild userId={session.user.id!} />
      <GuildsTable userId={session.user.id!} />
    </div>
  )
}
