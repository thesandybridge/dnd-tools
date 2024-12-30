import { auth } from "@/auth"
import { redirect } from "next/navigation"
import GuildMembers from "../components/GuildMembers";
import GuildAddMember from "../components/GuildAddMember";

export default async function Page() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  return (
    <>
      <GuildAddMember />
      <GuildMembers userId={session.user.id} />
    </>
  )
}
