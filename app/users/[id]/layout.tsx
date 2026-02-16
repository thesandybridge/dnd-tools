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

  return (
    <main className="main">
      <div className="wrapper">
        <UserProvider userId={id}>
          <UserNav userId={id} />
          <UserComponent/>
          {children}
        </UserProvider>
      </div>
    </main>
  )
}
