import { auth } from "@/auth"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Shield, Wrench, Castle } from "lucide-react"
import Link from "next/link"
import { SignInButton } from "./components/SignInButton"
import QuickConvert from "./components/QuickConvert"
import ActivityFeed from "./components/ActivityFeed"

const features = [
  {
    title: "Guilds",
    description: "Create and manage your adventuring parties. Track members, roles, and campaigns.",
    icon: Shield,
    href: "/guilds",
    auth: true,
  },
  {
    title: "Tools",
    description: "Calculators for mounts, items, services, and travel costs. Everything a party needs.",
    icon: Wrench,
    href: "/tools",
    auth: false,
  },
]

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    return <Dashboard userName={session.user.name ?? "Adventurer"} userId={session.user.id} />
  }

  return <HeroPage />
}

function HeroPage() {
  return (
    <div className="flex flex-col items-center px-4 py-16 md:py-24">
      <div className="flex flex-col items-center text-center max-w-2xl gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Castle className="h-10 w-10 text-primary" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Dungeon Syndrome
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Your campaign, organized. Manage guilds, explore maps, and calculate costs for your D&D adventures.
        </p>

        <SignInButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 w-full max-w-3xl">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <GlassPanel key={feature.title} coronaHover className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </GlassPanel>
          )
        })}
      </div>
    </div>
  )
}

function Dashboard({ userName, userId }: { userName: string; userId?: string }) {
  return (
    <div className="flex flex-col gap-6 px-4 py-8 md:px-8 max-w-6xl mx-auto w-full">
      {/* Welcome */}
      <GlassPanel className="p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {userName}</h1>
        <p className="text-muted-foreground mt-1">What would you like to do today?</p>
      </GlassPanel>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.title} href={feature.href}>
              <GlassPanel coronaHover className="h-full p-6 flex flex-col items-center justify-center gap-3 transition-all hover:bg-accent/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature.title}</span>
              </GlassPanel>
            </Link>
          )
        })}
        <Link href={`/users/${userId}`}>
          <GlassPanel coronaHover className="h-full p-6 flex flex-col items-center justify-center gap-3 border-dashed transition-all hover:bg-accent/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Castle className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">Profile</span>
          </GlassPanel>
        </Link>
      </div>

      {/* Activity + Calculator row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <GlassPanel className="md:col-span-3 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <ActivityFeed limit={8} />
        </GlassPanel>
        <GlassPanel className="md:col-span-2 p-6">
          <h2 className="text-lg font-semibold font-cinzel mb-4">Quick Convert</h2>
          <QuickConvert />
        </GlassPanel>
      </div>
    </div>
  )
}
