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
  const currentPath = usePathname()
  return (
    <nav className="flex gap-4 w-full h-[50dvh] flex-wrap">
      {routes.map(route => {
        const isActive = currentPath === `/tools/${route.path}`
        return (
          <Link
            key={route.path}
            href={`/tools/${route.path}`}
            className={`group relative h-full w-full flex-1 basis-[calc(25%-1rem)] rounded-2xl flex justify-center items-center overflow-hidden border-[15px] border-ridge border-foreground text-[clamp(1rem,10vw,2rem)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[5px_5px_0_0_var(--alt),10px_10px_0_0_var(--alt)] hover:text-primary max-md:basis-full ${isActive ? 'text-primary' : ''}`}
          >
            <div
              className="absolute inset-0 grayscale transition-[filter] duration-300 group-hover:grayscale-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${route.image})` }}
            />
            <span className="z-10">
              {route.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
