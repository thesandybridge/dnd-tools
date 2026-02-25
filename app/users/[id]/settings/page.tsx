import AppearanceSettings from "../components/settings/AppearanceSettings"
import ProfileSettings from "../components/settings/ProfileSettings"
import AccountSettings from "../components/settings/AccountSettings"

export default async function Settings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6 w-full">
      <AppearanceSettings />
      <ProfileSettings userId={id} />
      <AccountSettings userId={id} />
    </div>
  )
}
