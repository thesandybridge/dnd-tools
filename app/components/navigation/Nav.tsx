import { auth } from "@/auth"
import { faCalculator, faDungeon} from "@fortawesome/free-solid-svg-icons"
import SignIn from "./Login"
import UserNav from "./UserNav"
import MainNav from "./MainNav"
import ToggleTheme from "./ToggleTheme"

const routes = [
  {
    title: 'Home',
    path: '/',
    icon: faDungeon
  },
  {
    title: 'Tools/Calculators',
    path: '/tools',
    icon: faCalculator
  }
]
export default async function Nav() {
  const session = await auth()

  return (
    <nav className="main-nav">
      <div className="nav-spacer" />
      {routes.map((route => (
        <MainNav
          key={route.title}
          route={route}
        />
      )))}
      {session?.user ? (
        <UserNav user={session?.user} />
      ) : (
        <SignIn />
      )}
      <ToggleTheme />
    </nav>
  )
}
