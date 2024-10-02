'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import ClientIcon from "../icons/ClientIcon"

export default function MainNav({route}) {
  const path = usePathname()
  let activePath = route.path === path
  if (route.path !== '/') {
    activePath = path.includes(route.path)
  }
  return (
    <Link href={route.path}>
      <ClientIcon
        className={`user-control ${activePath ? 'active' : ''}`}
        title={route.title}
        style={{ fontSize: "25px" }}
        icon={route.icon}
      />
    </Link>
  )
}
