"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Map, Plus, Trash2, Loader2, Pencil } from "lucide-react"
import { fetchGuildMaps, createGuildMap, updateGuildMap, deleteGuildMap, type GuildMap } from "@/lib/guild-maps"
import { useGuild } from "../../providers/GuildProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function MapFormFields({
  name, setName,
  pmtilesUrl, setPmtilesUrl,
  pmtilesApiKey, setPmtilesApiKey,
  imageWidth, setImageWidth,
  imageHeight, setImageHeight,
  maxZoom, setMaxZoom,
}: {
  name: string; setName: (v: string) => void
  pmtilesUrl: string; setPmtilesUrl: (v: string) => void
  pmtilesApiKey: string; setPmtilesApiKey: (v: string) => void
  imageWidth: string; setImageWidth: (v: string) => void
  imageHeight: string; setImageHeight: (v: string) => void
  maxZoom: string; setMaxZoom: (v: string) => void
}) {
  return (
    <>
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
      <Input
        type="password"
        placeholder="API key (optional)"
        value={pmtilesApiKey}
        onChange={(e) => setPmtilesApiKey(e.target.value)}
        className="bg-white/[0.05] border-white/[0.08]"
      />
      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          placeholder="Width (px)"
          value={imageWidth}
          onChange={(e) => setImageWidth(e.target.value)}
          className="bg-white/[0.05] border-white/[0.08]"
        />
        <Input
          type="number"
          placeholder="Height (px)"
          value={imageHeight}
          onChange={(e) => setImageHeight(e.target.value)}
          className="bg-white/[0.05] border-white/[0.08]"
        />
        <Input
          type="number"
          placeholder="Max zoom"
          value={maxZoom}
          onChange={(e) => setMaxZoom(e.target.value)}
          className="bg-white/[0.05] border-white/[0.08]"
        />
      </div>
    </>
  )
}

function EditMapDialog({ map, guildId, open, onOpenChange }: {
  map: GuildMap
  guildId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(map.name)
  const [pmtilesUrl, setPmtilesUrl] = useState(map.pmtiles_url)
  const [pmtilesApiKey, setPmtilesApiKey] = useState("")
  const [imageWidth, setImageWidth] = useState(map.image_width?.toString() ?? "")
  const [imageHeight, setImageHeight] = useState(map.image_height?.toString() ?? "")
  const [maxZoom, setMaxZoom] = useState((map.max_zoom ?? 5).toString())

  const editMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateGuildMap>[2]) =>
      updateGuildMap(guildId, map.map_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild-maps", guildId] })
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !pmtilesUrl.trim()) return
    editMutation.mutate({
      name: name.trim(),
      pmtilesUrl: pmtilesUrl.trim(),
      ...(pmtilesApiKey.trim() && { pmtilesApiKey: pmtilesApiKey.trim() }),
      ...(imageWidth && { imageWidth: parseInt(imageWidth) }),
      ...(imageHeight && { imageHeight: parseInt(imageHeight) }),
      ...(maxZoom && { maxZoom: parseInt(maxZoom) }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-cinzel">Edit Map</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <MapFormFields
            name={name} setName={setName}
            pmtilesUrl={pmtilesUrl} setPmtilesUrl={setPmtilesUrl}
            pmtilesApiKey={pmtilesApiKey} setPmtilesApiKey={setPmtilesApiKey}
            imageWidth={imageWidth} setImageWidth={setImageWidth}
            imageHeight={imageHeight} setImageHeight={setImageHeight}
            maxZoom={maxZoom} setMaxZoom={setMaxZoom}
          />
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={editMutation.isPending} className="cursor-pointer">
              {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function MapList({ guildId, userId }: { guildId: string; userId: string }) {
  const { isAdminOrOwner } = useGuild()
  const isOwner = isAdminOrOwner(userId)
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [pmtilesUrl, setPmtilesUrl] = useState("")
  const [pmtilesApiKey, setPmtilesApiKey] = useState("")
  const [imageWidth, setImageWidth] = useState("")
  const [imageHeight, setImageHeight] = useState("")
  const [maxZoom, setMaxZoom] = useState("5")

  const [editingMap, setEditingMap] = useState<GuildMap | null>(null)

  const { data: maps = [], isLoading } = useQuery({
    queryKey: ["guild-maps", guildId],
    queryFn: () => fetchGuildMaps(guildId),
  })

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createGuildMap>[1]) =>
      createGuildMap(guildId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild-maps", guildId] })
      setName("")
      setPmtilesUrl("")
      setPmtilesApiKey("")
      setImageWidth("")
      setImageHeight("")
      setMaxZoom("5")
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
    createMutation.mutate({
      name: name.trim(),
      pmtilesUrl: pmtilesUrl.trim(),
      ...(pmtilesApiKey.trim() && { pmtilesApiKey: pmtilesApiKey.trim() }),
      ...(imageWidth && { imageWidth: parseInt(imageWidth) }),
      ...(imageHeight && { imageHeight: parseInt(imageHeight) }),
      ...(maxZoom && { maxZoom: parseInt(maxZoom) }),
    })
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
            <MapFormFields
              name={name} setName={setName}
              pmtilesUrl={pmtilesUrl} setPmtilesUrl={setPmtilesUrl}
              pmtilesApiKey={pmtilesApiKey} setPmtilesApiKey={setPmtilesApiKey}
              imageWidth={imageWidth} setImageWidth={setImageWidth}
              imageHeight={imageHeight} setImageHeight={setImageHeight}
              maxZoom={maxZoom} setMaxZoom={setMaxZoom}
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingMap(map)
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteMutation.mutate(map.map_id)
                      }}
                      className="text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </Link>
        ))}
      </div>

      {editingMap && (
        <EditMapDialog
          map={editingMap}
          guildId={guildId}
          open={!!editingMap}
          onOpenChange={(open) => { if (!open) setEditingMap(null) }}
        />
      )}
    </div>
  )
}
