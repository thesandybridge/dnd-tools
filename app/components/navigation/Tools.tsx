'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

const routes = [
  {
    path: "mounts",
    label: "Mounts",
    image: "/images/mounts.png",
  },
  {
    path: "services",
    label: "Services",
    image: "/images/tavern.png",
  },
  {
    path: "transportation",
    label: "Transportation",
    image: "/images/travel.png",
  },
  {
    path: "items",
    label: "Items",
    image: "/images/blacksmith.png",
  }
]

export default function ToolsNav() {
  const path = usePathname()
  return (
    <>
      <nav className="tools-nav">
        {routes.map(route => (
          <Link
            key={btoa(route.path)}
            href={`/tools/${route.path}`}
            className={`tools-link ${path === `/tools/${route.path}` ? 'active' : ''}`}
            style={{backgroundImage: `url(${route.image})`}}
          >
            <span className="tools-link--label">
              {route.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  )
}
