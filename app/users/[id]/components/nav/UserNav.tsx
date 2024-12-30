import Link from "next/link"
import styles from "./nav.module.css"

const PATH = "/users/"
const routes = [
  {
    path: '/settings',
    label: 'Settings'
  },
  {
    path: '/guilds',
    label: 'Guilds'
  },
]
export default function UserNav({ userId }) {
  return (
    <nav className={styles.userNav}>
      {routes.map((route, idx) => (
        <Link
          key={idx}
          className={styles.link}
          href={`${PATH}${userId}${route.path}`}>
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
