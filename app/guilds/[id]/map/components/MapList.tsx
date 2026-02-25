"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Map, Plus, Trash2, Loader2, Pencil, ExternalLink } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchGuildMaps, createGuildMap, updateGuildMap, deleteGuildMap, type GuildMap } from "@/lib/guild-maps"
import { fetchUser } from "@/lib/users"
import { useGuild } from "../../providers/GuildProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import TileForgePickerDialog from "./TileForgePickerDialog"
import { getTileForgepmtilesUrl, TILEFORGE_URLS, TILEFORGE_COPY, type TileForgeTileset } from "@/lib/tileforge"

function MapFormFields({
  name, setName,
  pmtilesUrl, setPmtilesUrl,
  pmtilesApiKey, setPmtilesApiKey,
  imageWidth, setImageWidth,
  imageHeight, setImageHeight,
  maxZoom, setMaxZoom,
  defaultZoom, setDefaultZoom,
  visibility, setVisibility,
  onImportTileForge,
  showTileForgePromo,
}: {
  name: string; setName: (v: string) => void
  pmtilesUrl: string; setPmtilesUrl: (v: string) => void
  pmtilesApiKey: string; setPmtilesApiKey: (v: string) => void
  imageWidth: string; setImageWidth: (v: string) => void
  imageHeight: string; setImageHeight: (v: string) => void
  maxZoom: string; setMaxZoom: (v: string) => void
  defaultZoom: string; setDefaultZoom: (v: string) => void
  visibility: string; setVisibility: (v: string) => void
  onImportTileForge?: () => void
  showTileForgePromo?: boolean
}) {
  return (
    <>
      {onImportTileForge ? (
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={onImportTileForge}
        >
          Import from TileForge
        </Button>
      ) : showTileForgePromo ? (
        <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <p className="text-xs text-muted-foreground flex-1">
            {TILEFORGE_COPY.formPromo}
          </p>
          <a
            href={TILEFORGE_URLS.signup}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline whitespace-nowrap"
          >
            {TILEFORGE_COPY.ctaGetStarted} &rarr;
          </a>
        </div>
      ) : null}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
        <Input
          type="number"
          placeholder="Default zoom"
          value={defaultZoom}
          onChange={(e) => setDefaultZoom(e.target.value)}
          className="bg-white/[0.05] border-white/[0.08]"
        />
      </div>
      <Select value={visibility} onValueChange={setVisibility}>
        <SelectTrigger className="bg-white/[0.05] border-white/[0.08]">
          <SelectValue placeholder="Visibility" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="everyone">Everyone</SelectItem>
          <SelectItem value="dm_only">DM Only</SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}

function EditMapDialog({ map, guildId, open, onOpenChange, hasTileForge }: {
  map: GuildMap
  guildId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  hasTileForge?: boolean
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(map.name)
  const [pmtilesUrl, setPmtilesUrl] = useState(map.pmtiles_url)
  const [pmtilesApiKey, setPmtilesApiKey] = useState("")
  const [imageWidth, setImageWidth] = useState(map.image_width?.toString() ?? "")
  const [imageHeight, setImageHeight] = useState(map.image_height?.toString() ?? "")
  const [maxZoom, setMaxZoom] = useState((map.max_zoom ?? 5).toString())
  const [defaultZoom, setDefaultZoom] = useState(map.default_zoom?.toString() ?? "")
  const [visibility, setVisibility] = useState(map.visibility || "everyone")
  const [showTfPicker, setShowTfPicker] = useState(false)
  const [useTileForgeKey, setUseTileForgeKey] = useState(false)

  function handleTileForgeSelect(tileset: TileForgeTileset) {
    setName(tileset.name)
    setPmtilesUrl(getTileForgepmtilesUrl(tileset.slug))
    setUseTileForgeKey(true)
    if (tileset.width) setImageWidth(tileset.width.toString())
    if (tileset.height) setImageHeight(tileset.height.toString())
    setMaxZoom(tileset.max_zoom.toString())
  }

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
      defaultZoom: defaultZoom ? parseInt(defaultZoom) : null,
      visibility,
      useTileForgeKey,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
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
            defaultZoom={defaultZoom} setDefaultZoom={setDefaultZoom}
            visibility={visibility} setVisibility={setVisibility}
            onImportTileForge={hasTileForge ? () => setShowTfPicker(true) : undefined}
            showTileForgePromo={!hasTileForge}
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
        {hasTileForge && (
          <TileForgePickerDialog
            open={showTfPicker}
            onOpenChange={setShowTfPicker}
            onSelect={handleTileForgeSelect}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function MapList({ guildId, userId }: { guildId: string; userId: string }) {
  const { hasPermission } = useGuild()
  const canManageMaps = hasPermission(userId, 'manage_maps')
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  const { data: currentUser } = useQuery({
    queryKey: ['user', session?.user?.id],
    queryFn: () => fetchUser(session?.user?.id),
    enabled: !!session?.user?.id,
    staleTime: 300000,
  })
  const hasTileForge = !!currentUser?.tileforge_connected

  const [showForm, setShowForm] = useState(false)
  const [showTfPicker, setShowTfPicker] = useState(false)
  const [name, setName] = useState("")
  const [pmtilesUrl, setPmtilesUrl] = useState("")
  const [pmtilesApiKey, setPmtilesApiKey] = useState("")
  const [imageWidth, setImageWidth] = useState("")
  const [imageHeight, setImageHeight] = useState("")
  const [maxZoom, setMaxZoom] = useState("5")
  const [defaultZoom, setDefaultZoom] = useState("")
  const [visibility, setVisibility] = useState("everyone")
  const [useTileForgeKey, setUseTileForgeKey] = useState(false)

  const [editingMap, setEditingMap] = useState<GuildMap | null>(null)

  function handleTileForgeSelect(tileset: TileForgeTileset) {
    setName(tileset.name)
    setPmtilesUrl(getTileForgepmtilesUrl(tileset.slug))
    setUseTileForgeKey(true)
    if (tileset.width) setImageWidth(tileset.width.toString())
    if (tileset.height) setImageHeight(tileset.height.toString())
    setMaxZoom(tileset.max_zoom.toString())
  }

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
      setDefaultZoom("")
      setVisibility("everyone")
      setUseTileForgeKey(false)
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
      visibility,
      useTileForgeKey,
    })
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <Skeleton className="h-7 w-16" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <GlassPanel key={i} className="p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-cinzel text-lg font-semibold">Maps</h2>
        {canManageMaps && !showForm && (
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
              defaultZoom={defaultZoom} setDefaultZoom={setDefaultZoom}
              visibility={visibility} setVisibility={setVisibility}
              onImportTileForge={hasTileForge ? () => setShowTfPicker(true) : undefined}
              showTileForgePromo={!hasTileForge}
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
        <GlassPanel variant="default" corona className="p-8 text-center max-w-lg mx-auto">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-cinzel text-lg font-semibold">Bring your world to life</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {TILEFORGE_COPY.pitch}
              </p>
            </div>
            {canManageMaps && (
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {hasTileForge ? (
                  <Button className="w-full sm:w-auto gap-2" onClick={() => { setShowForm(true); setShowTfPicker(true) }}>
                    Import from TileForge
                  </Button>
                ) : (
                  <Button className="w-full sm:w-auto gap-2" asChild>
                    <a href={TILEFORGE_URLS.signup} target="_blank" rel="noopener noreferrer">
                      {TILEFORGE_COPY.ctaGetStarted}
                      <ExternalLink size={14} />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={() => setShowForm(true)}
                >
                  Add Map Manually
                </Button>
              </div>
            )}
          </div>
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
                  {map.visibility === 'dm_only' && (
                    <Badge variant="secondary" className="text-xs shrink-0">DM Only</Badge>
                  )}
                </div>
                {canManageMaps && (
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
                      disabled={deleteMutation.isPending}
                      className="text-destructive hover:text-destructive/80 transition-colors cursor-pointer disabled:opacity-50"
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

      {hasTileForge && (
        <TileForgePickerDialog
          open={showTfPicker}
          onOpenChange={setShowTfPicker}
          onSelect={handleTileForgeSelect}
        />
      )}

      {editingMap && (
        <EditMapDialog
          map={editingMap}
          guildId={guildId}
          open={!!editingMap}
          onOpenChange={(open) => { if (!open) setEditingMap(null) }}
          hasTileForge={hasTileForge}
        />
      )}
    </div>
  )
}
