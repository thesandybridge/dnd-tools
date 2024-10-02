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

  return (
    <main className="main">
      <div className="wrapper">
        <UserProvider userId={params.id}>
          <UserNav userId={params.id} />
          <UserComponent/>
          {children}
        </UserProvider>
      </div>
    </main>
  )
}
