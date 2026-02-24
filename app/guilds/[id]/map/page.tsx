import { auth } from "@/auth"
import { redirect } from "next/navigation"
import MapList from "./components/MapList"

export default async function GuildMapPage({ params }) {
  const session = await auth()
  if (!session?.user) redirect("/")
  const { id } = await params
  return <MapList guildId={id} userId={session.user.id} />
}
