import Link from "next/link";
import Calculator from "@/app/components/calculator/Calculator";

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
  return (
    <>
      <Calculator />
      <nav className="tools-nav">
        {routes.map(route => (
          <Link
            key={btoa(route.path)}
            href={`/tools/${route.path}`}
            className="tools-link"
          >
            {route.label}
          </Link>
        ))}
      </nav>
    </>
  )
}
