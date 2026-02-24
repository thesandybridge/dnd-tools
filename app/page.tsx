import { auth } from "@/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Map, Wrench, Castle } from "lucide-react"
import Link from "next/link"
import { SignInButton } from "./components/SignInButton"

const features = [
  {
    title: "Guilds",
    description: "Create and manage your adventuring parties. Track members, roles, and campaigns.",
    icon: Shield,
    href: "/guilds",
    auth: true,
  },
  {
    title: "World Map",
    description: "Explore an interactive map of Eberron. Mark locations, measure distances, and plan routes.",
    icon: Map,
    href: "/map",
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="bg-card/50 border-border/50">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Dashboard({ userName, userId }: { userName: string; userId?: string }) {
  return (
    <div className="flex flex-col gap-8 px-4 py-8 md:px-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Welcome back, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">What would you like to do today?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.title} href={feature.href}>
              <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center gap-3 pt-6 pb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{feature.title}</span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
        <Link href={`/users/${userId}`}>
          <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 pt-6 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Castle className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Profile</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
