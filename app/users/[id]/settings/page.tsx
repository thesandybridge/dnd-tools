import { auth } from "@/auth"
import { redirect } from "next/navigation"
import PendingInvites from "../components/settings/PendingInvites"
import AppearanceSettings from "../components/settings/AppearanceSettings"
import ProfileSettings from "../components/settings/ProfileSettings"
import AccountSettings from "../components/settings/AccountSettings"

export default async function Settings({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const { id } = await params

  if (!session?.user || session.user.id !== id) {
    redirect(`/users/${id}`)
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <PendingInvites userId={id} />
      <AppearanceSettings />
      <ProfileSettings userId={id} />
      <AccountSettings userId={id} />
    </div>
  )
}
