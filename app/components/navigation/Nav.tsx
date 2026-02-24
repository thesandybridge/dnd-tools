import { auth } from "@/auth"
import { DesktopSidebar } from "./DesktopSidebar"
import { MobileNav } from "./MobileNav"

export default async function Nav() {
  const session = await auth()
  return (
    <>
      <DesktopSidebar user={session?.user ?? null} />
      <MobileNav user={session?.user ?? null} />
    </>
  )
}
