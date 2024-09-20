'use client'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function MainNav({route}) {
  const path = usePathname()
  let activePath = route.path === path
  if (route.path !== '/') {
    activePath = path.includes(route.path)
  }
  return (
    <Link href={route.path}>
      <FontAwesomeIcon
        className={`user-control ${activePath ? 'active' : ''}`}
        title={route.title}
        style={{ fontSize: "25px" }}
        icon={route.icon}
      >
      </FontAwesomeIcon>
    </Link>
  )
}
