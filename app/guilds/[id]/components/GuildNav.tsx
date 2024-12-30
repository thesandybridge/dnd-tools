'use client'

import Link from "next/link"
import styles from "./nav.module.css"
import { useGuild } from "../providers/GuildProvider"

const PATH = "/guilds/"
const routes = [
  {
    path: '/',
    label: 'Guild Home'
  },
  {
    path: '/settings',
    label: 'Settings',
    permission: 'admin'
  },
  {
    path: '/members',
    label: 'Members'
  },
]

export default function GuildNav({ guildId, userId }) {
  const { isAdminOrOwner } = useGuild()

  return (
    <nav className={styles.guildNav}>
      {routes.map((route, idx) => {
        if (route.permission && !isAdminOrOwner(userId)) {
          return null
        }

        return (
          <Link
            key={idx}
            className={styles.link}
            href={`${PATH}${guildId}${route.path}`}
          >
            {route.label}
          </Link>
        )
      })}
    </nav>
  )
}
