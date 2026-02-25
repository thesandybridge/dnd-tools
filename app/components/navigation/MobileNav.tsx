"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Castle, Calculator, Shield, Sword, Menu, LogIn, LogOut, Sun, Moon, User, Settings } from "lucide-react"
import { signIn, signOut } from "next-auth/react"
import { useTheme } from "@/app/providers/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer"
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
  { title: "Characters", path: "/characters", icon: Sword },
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

      {/* More menu - swipable drawer */}
      <Drawer>
        <DrawerTrigger asChild>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] text-muted-foreground">
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left">Menu</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 px-6 pb-8">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-2 py-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/50">
                    {user.image && <AvatarImage src={user.image} alt={user.name ?? "User"} />}
                    <AvatarFallback>{user.name?.charAt(0)?.toUpperCase() ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                  </div>
                </div>

                <Separator className="my-2" />

                <DrawerClose asChild>
                  <Link
                    href={`/users/${user.id}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-accent active:bg-accent/80"
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    Profile
                  </Link>
                </DrawerClose>
                <DrawerClose asChild>
                  <Link
                    href={`/users/${user.id}/settings`}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-accent active:bg-accent/80"
                  >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    Settings
                  </Link>
                </DrawerClose>

                <Separator className="my-2" />

                <button
                  onClick={() => updateSettings({ themeMode: theme.themeMode === 'dark' ? 'light' : 'dark' })}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-accent active:bg-accent/80 w-full"
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
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-destructive hover:bg-accent active:bg-accent/80 w-full"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => updateSettings({ themeMode: theme.themeMode === 'dark' ? 'light' : 'dark' })}
                  className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-accent active:bg-accent/80 w-full"
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
        </DrawerContent>
      </Drawer>
    </nav>
  )
}
