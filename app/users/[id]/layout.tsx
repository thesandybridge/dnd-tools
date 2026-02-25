import { auth } from "@/auth"
import { redirect } from "next/navigation"
import UserNav from "./components/nav/UserNav";
import UserComponent from "./components/user/UserComponent";
import { UserProvider } from "./providers/UserProvider";

export default async function UserLayout({ children, params }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  const { id } = await params
  const isOwner = session.user.id === id

  return (
    <div className="flex justify-center p-4 overflow-x-hidden">
      <div className="max-w-5xl w-full min-w-0 flex flex-col items-center gap-4">
        <UserProvider userId={id}>
          <UserComponent />
          <UserNav userId={id} isOwner={isOwner} />
          {children}
        </UserProvider>
      </div>
    </div>
  )
}
