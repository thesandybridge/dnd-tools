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
    <div className="flex flex-col gap-6">
      <GuildAddMember userId={session.user.id} />
      <GuildMembers userId={session.user.id} />
    </div>
  )
}
