import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const PATH = "/users/"
const routes = [
  { path: '/settings', label: 'Settings' },
  { path: '/guilds', label: 'Guilds' },
]

export default function UserNav({ userId }) {
  return (
    <Tabs defaultValue="">
      <TabsList>
        {routes.map((route) => (
          <TabsTrigger key={route.path} value={route.path} asChild>
            <Link href={`${PATH}${userId}${route.path}`}>
              {route.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
