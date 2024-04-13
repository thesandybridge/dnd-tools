
import { signIn } from "@/auth.js"

export default function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("discord")
      }}
    >
      <button type="submit">Signin with Discord</button>
    </form>
  )
}
