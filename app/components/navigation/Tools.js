'use client'

import Link from "next/link"
import Calculator from "@/app/tools/components/calculator/Calculator"
import { usePathname } from "next/navigation"

const routes = [
  {
    path: "mounts",
    label: "Mounts",
  },
  {
    path: "services",
    label: "Services",
  },
  {
    path: "transportation",
    label: "Transportation",
  },
  {
    path: "items",
    label: "Items",
  }
]

export default function ToolsNav() {
  const path = usePathname()
  return (
    <>
      <Calculator />
      <nav className="tools-nav">
        {routes.map(route => (
          <Link
            key={btoa(route.path)}
            href={`/tools/${route.path}`}
            className={`tools-link ${path === `/tools/${route.path}` ? 'active' : ''}`}
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
