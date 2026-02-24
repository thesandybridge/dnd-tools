'use client'

import { Plus } from "lucide-react"
import { createGuild } from "@/lib/guilds"
import { Button } from "@/components/ui/button"

export default function GuildControls() {
  return (
    <nav className="flex justify-center gap-3">
      <Button
        variant="outline"
        onClick={() => createGuild()}
        aria-label="Create Guild"
        title="Create Guild"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </nav>
  )
}
