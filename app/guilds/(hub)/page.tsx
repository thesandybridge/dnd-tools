import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import GuildsSummary from "../components/GuildsSummary"
import ActivityFeed from "@/app/components/ActivityFeed"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { TrendingUp, Calendar } from "lucide-react"

export default async function GuildsOverview() {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <div className="flex flex-col gap-6">
      {/* Guild Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-cinzel text-lg font-semibold">Your Guilds</h2>
          <Link href="/guilds/my" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>
        <GuildsSummary userId={session.user.id!} />
      </div>

      {/* Activity + Future Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassPanel className="p-6">
          <h2 className="text-lg font-semibold font-cinzel mb-4">Recent Activity</h2>
          <ActivityFeed limit={6} />
        </GlassPanel>

        <div className="flex flex-col gap-4">
          <GlassPanel variant="subtle" className="p-6 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <h3 className="font-cinzel text-sm font-semibold">Trending Guilds</h3>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </GlassPanel>
          <GlassPanel variant="subtle" className="p-6 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <h3 className="font-cinzel text-sm font-semibold">Upcoming Events</h3>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  )
}
