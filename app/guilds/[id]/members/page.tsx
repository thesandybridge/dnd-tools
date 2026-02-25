import { auth } from "@/auth"
import { redirect } from "next/navigation"
import MembersContent from "./components/MembersContent"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/')
  const { id } = await params

  return <MembersContent guildId={id} userId={session.user.id!} />
}
