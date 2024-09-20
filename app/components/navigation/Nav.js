import SignIn from "./Login";
import { auth } from "@/auth"
import { faScrewdriverWrench, faHome } from "@fortawesome/free-solid-svg-icons";
import UserNav from "./UserNav";
import MainNav from "./MainNav";

const routes = [
  {
    title: 'Home',
    path: '/',
    icon: faHome
  },
  {
    title: 'Tools/Calculators',
    path: '/tools',
    icon: faScrewdriverWrench
  }
]
export default async function Nav() {
  const session = await auth()

  return (
    <nav className="main-nav">
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
    </nav>
  )
}
