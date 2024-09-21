import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserComponent from "../components/user/UserComponent";

export default async function User() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  return (
    <UserComponent user={session?.user}/>
  )
}
