import { auth } from "@/auth"
import { redirect } from "next/navigation"
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
      <AppearanceSettings />
      <ProfileSettings userId={id} />
      <AccountSettings userId={id} />
    </div>
  )
}
