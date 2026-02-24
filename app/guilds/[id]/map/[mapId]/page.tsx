import { auth } from "@/auth"
import { redirect } from "next/navigation"
import GuildMapLoader from "./components/GuildMapLoader"

export default async function GuildMapViewPage({ params }) {
  const session = await auth()
  if (!session?.user) redirect("/")
  const { id, mapId } = await params
  return <GuildMapLoader guildId={id} mapId={mapId} />
}
