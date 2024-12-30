import { auth } from "@/auth"
import { redirect } from "next/navigation"
import GuildSettings from "../components/GuildSettings";

export default async function Page() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }
  return (
    <GuildSettings userId={session.user.id} />
  )
}
