"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Castle, Calculator, Shield, Menu, LogIn, LogOut, Sun, Moon, User, Settings } from "lucide-react"
import { signIn, signOut } from "next-auth/react"
import { useTheme } from "@/app/providers/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface NavUser {
  id?: string
  name?: string | null
  image?: string | null
}

const publicRoutes = [
  { title: "Home", path: "/", icon: Castle },
  { title: "Tools", path: "/tools", icon: Calculator },
]

const authRoutes = [
  { title: "Guilds", path: "/guilds", icon: Shield },
]

export function MobileNav({ user }: { user: NavUser | null }) {
  const path = usePathname()
  const { theme, updateSettings } = useTheme()
  const routes = user ? [...publicRoutes, ...authRoutes] : publicRoutes

  function isActive(routePath: string) {
    if (routePath === "/") return path === "/"
    return path.startsWith(routePath)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-border backdrop-blur-lg bg-card/85 px-2 py-1 pb-[env(safe-area-inset-bottom)]">
      {routes.map((route) => {
        const Icon = route.icon
        const active = isActive(route.path)
        return (
          <Link
            key={route.path}
            href={route.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] transition-colors
              ${active ? "text-primary drop-shadow-[0_0_6px_rgba(var(--corona-rgb),0.4)]" : "text-muted-foreground"}`}
          >
            <Icon className="h-5 w-5" />
            <span>{route.title}</span>
          </Link>
        )
      })}

      {/* More menu */}
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] text-muted-foreground">
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 py-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    {user.image && <AvatarImage src={user.image} alt={user.name ?? "User"} />}
                    <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                  </div>
                </div>

                <Separator className="my-2" />

                <Link
                  href={`/users/${user.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-foreground hover:bg-accent"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  Profile
                </Link>
                <Link
                  href={`/users/${user.id}/settings`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-foreground hover:bg-accent"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  Settings
                </Link>

                <Separator className="my-2" />

                <button
                  onClick={() => updateSettings({ themeMode: theme.themeMode === 'dark' ? 'light' : 'dark' })}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-foreground hover:bg-accent w-full"
                >
                  {theme.themeMode === "dark" ? (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  )}
                  {theme.themeMode === "dark" ? "Light mode" : "Dark mode"}
                </button>

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-destructive hover:bg-accent w-full"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => updateSettings({ themeMode: theme.themeMode === 'dark' ? 'light' : 'dark' })}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-foreground hover:bg-accent w-full"
                >
                  {theme.themeMode === "dark" ? (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  )}
                  {theme.themeMode === "dark" ? "Light mode" : "Dark mode"}
                </button>

                <Button
                  variant="default"
                  className="mt-2"
                  onClick={() => signIn("discord")}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in with Discord
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
