"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Map, Plus, Trash2, Loader2 } from "lucide-react"
import { fetchGuildMaps, createGuildMap, deleteGuildMap } from "@/lib/guild-maps"
import { useGuild } from "../../providers/GuildProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MapList({ guildId, userId }: { guildId: string; userId: string }) {
  const { isAdminOrOwner } = useGuild()
  const isOwner = isAdminOrOwner(userId)
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [pmtilesUrl, setPmtilesUrl] = useState("")

  const { data: maps = [], isLoading } = useQuery({
    queryKey: ["guild-maps", guildId],
    queryFn: () => fetchGuildMaps(guildId),
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string; pmtilesUrl: string }) =>
      createGuildMap(guildId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild-maps", guildId] })
      setName("")
      setPmtilesUrl("")
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (mapId: string) => deleteGuildMap(guildId, mapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild-maps", guildId] })
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pmtilesUrl.trim()) return
    createMutation.mutate({ name: name.trim(), pmtilesUrl: pmtilesUrl.trim() })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-semibold">Maps</h2>
        {isOwner && !showForm && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 cursor-pointer"
            onClick={() => setShowForm(true)}
          >
            <Plus size={16} />
            Add Map
          </Button>
        )}
      </div>

      {showForm && (
        <GlassPanel variant="default" corona className="p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <Input
              placeholder="Map name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/[0.05] border-white/[0.08]"
            />
            <Input
              placeholder="PMTiles URL"
              value={pmtilesUrl}
              onChange={(e) => setPmtilesUrl(e.target.value)}
              className="bg-white/[0.05] border-white/[0.08]"
            />
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" disabled={createMutation.isPending} className="cursor-pointer">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </GlassPanel>
      )}

      {maps.length === 0 && !showForm && (
        <GlassPanel variant="subtle" className="p-8 text-center">
          <Map className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No maps yet</p>
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {maps.map((map) => (
          <Link key={map.map_id} href={`/guilds/${guildId}/map/${map.map_id}`}>
            <GlassPanel coronaHover className="p-4 group cursor-pointer transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Map size={16} className="shrink-0 text-primary" />
                  <span className="font-cinzel text-sm font-medium truncate">{map.name}</span>
                </div>
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      deleteMutation.mutate(map.map_id)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  )
}
