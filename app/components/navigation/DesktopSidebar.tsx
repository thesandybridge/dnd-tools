"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Castle, Calculator, Shield, LogIn, LogOut, Sun, Moon } from "lucide-react"
import { signIn, signOut } from "next-auth/react"
import { useTheme } from "@/app/providers/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
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

export function DesktopSidebar({ user }: { user: NavUser | null }) {
  const path = usePathname()
  const { theme, updateSettings } = useTheme()
  const routes = user ? [...publicRoutes, ...authRoutes] : publicRoutes

  function isActive(routePath: string) {
    if (routePath === "/") return path === "/"
    return path.startsWith(routePath)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-dvh w-16 flex-col items-center border-r border-border backdrop-blur-lg bg-sidebar/90 corona-border py-4 gap-2">
        {/* Logo */}
        <Link href="/" className="mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Castle className="h-5 w-5 text-primary" />
          </div>
        </Link>

        <Separator className="w-8" />

        {/* Nav links */}
        <nav className="flex flex-1 flex-col items-center gap-1 py-2">
          {routes.map((route) => {
            const Icon = route.icon
            const active = isActive(route.path)
            return (
              <Tooltip key={route.path}>
                <TooltipTrigger asChild>
                  <Link
                    href={route.path}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors
                      ${active
                        ? "bg-primary/15 text-primary shadow-[inset_-2px_0_0_0_rgb(var(--corona-rgb)),0_0_12px_-3px_rgba(var(--corona-rgb),0.4)]"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_8px_-2px_rgba(var(--corona-rgb),0.2)]"
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{route.title}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-2">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                onClick={() => updateSettings({ themeMode: theme.themeMode === 'dark' ? 'light' : 'dark' })}
              >
                {theme.themeMode === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme.themeMode === "dark" ? "Light mode" : "Dark mode"}
            </TooltipContent>
          </Tooltip>

          <Separator className="w-8" />

          {/* User / Sign in */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none ring-ring focus-visible:ring-2">
                  <Avatar className="h-9 w-9 border-2 border-primary/50">
                    {user.image && <AvatarImage src={user.image} alt={user.name ?? "User"} />}
                    <AvatarFallback className="text-xs">
                      {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/users/${user.id}`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/users/${user.id}/settings`}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-foreground"
                  onClick={() => signIn("discord")}
                >
                  <LogIn className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign in</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
