import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function MembersLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <div className="flex justify-center p-4 overflow-x-hidden">
      <div className="max-w-5xl w-full min-w-0 flex flex-col gap-4">
        <h1 className="font-cinzel text-3xl text-foreground tracking-wide">Members</h1>
        {children}
      </div>
    </div>
  )
}
