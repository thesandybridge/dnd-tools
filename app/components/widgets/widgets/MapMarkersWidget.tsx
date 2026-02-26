"use client"

import { useState, useRef, useEffect, useCallback, memo } from "react"
import { MapPin, Trash2, Search, Pencil, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useMapWidget } from "@/app/guilds/[id]/map/[mapId]/components/MapWidgetContext"
import useGetMarkers from "@/app/guilds/[id]/map/[mapId]/hooks/useGetMarkers"
import useRemoveMarkerMutation from "@/app/guilds/[id]/map/[mapId]/hooks/useRemoveMarkerMutation"
import useRenameMarkerMutation from "@/app/guilds/[id]/map/[mapId]/hooks/useRenameMarkerMutation"
import type { Marker } from "@/lib/markers"

function InlineRename({ guildId, mapId, marker, onDone }: { guildId: string; mapId: string; marker: Marker; onDone: () => void }) {
  const rename = useRenameMarkerMutation(guildId, mapId)
  const [value, setValue] = useState(marker.text || "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const save = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed !== (marker.text || "")) {
      rename.mutate({ uuid: marker.uuid, text: trimmed })
    }
    onDone()
  }, [value, marker.text, marker.uuid, rename, onDone])

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") save()
          if (e.key === "Escape") onDone()
        }}
        className="flex-1 min-w-0 bg-muted/50 border border-border rounded px-1.5 py-0.5 text-sm outline-none focus:border-primary"
      />
      <button onClick={save} className="text-primary hover:text-primary/80 cursor-pointer">
        <Check size={14} />
      </button>
      <button onClick={onDone} className="text-muted-foreground hover:text-foreground cursor-pointer">
        <X size={14} />
      </button>
    </div>
  )
}

const MarkerRow = memo(function MarkerRow({
  guildId,
  mapId,
  marker,
  index,
  isSelected,
  onSelect,
  onDelete,
}: {
  guildId: string
  mapId: string
  marker: Marker
  index: number
  isSelected: boolean
  onSelect: (uuid: string, position: { lat: number; lng: number }) => void
  onDelete: (uuid: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)

  const handleClick = useCallback(() => {
    if (!isEditing && marker.position) {
      onSelect(marker.uuid, marker.position as unknown as { lat: number; lng: number })
    }
  }, [isEditing, marker.uuid, marker.position, onSelect])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }, [])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(marker.uuid)
  }, [onDelete, marker.uuid])

  return (
    <div
      onClick={handleClick}
      className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm group cursor-pointer transition-colors ${
        isSelected
          ? "bg-[rgba(var(--corona-rgb),0.15)] border border-[rgba(var(--corona-rgb),0.3)]"
          : "hover:bg-white/[0.05]"
      }`}
    >
      {isEditing ? (
        <>
          <MapPin size={14} className="shrink-0 text-primary" />
          <InlineRename guildId={guildId} mapId={mapId} marker={marker} onDone={() => setIsEditing(false)} />
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={14} className="shrink-0 text-primary" />
            <span className="truncate">
              {marker.text || (marker.distance === "Start" ? "Start" : `Marker ${index + 1}`)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {marker.distance !== "Start" && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {marker.distance} mi
              </span>
            )}
            <button
              onClick={handleEdit}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  )
})

export function MapMarkersContent() {
  const mapWidget = useMapWidget()

  if (!mapWidget) {
    return (
      <p className="text-sm text-muted-foreground text-center px-3 py-6">
        Open a map to see markers
      </p>
    )
  }

  return <MapMarkersInner {...mapWidget} />
}

function MapMarkersInner({
  guildId,
  mapId,
  selectedMarkerUuid,
  onSelectMarker,
}: {
  guildId: string
  mapId: string
  selectedMarkerUuid: string | null
  onSelectMarker: (uuid: string, position: { lat: number; lng: number }) => void
}) {
  const { data: markers = [] } = useGetMarkers(guildId, mapId)
  const removeMarker = useRemoveMarkerMutation(guildId, mapId)
  const [search, setSearch] = useState("")

  const handleDelete = useCallback((uuid: string) => {
    removeMarker.mutate(uuid)
  }, [removeMarker])

  const filtered = markers.filter((m) => {
    if (!search) return true
    const text = m.text?.toLowerCase() ?? ""
    const dist = String(m.distance).toLowerCase()
    return text.includes(search.toLowerCase()) || dist.includes(search.toLowerCase())
  })

  return (
    <div className="flex flex-col gap-3 px-3 pb-3">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search markers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm bg-white/[0.05] border-white/[0.08]"
        />
      </div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Markers ({markers.length})
      </div>
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {search ? "No matching markers" : "No markers placed yet"}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {filtered.map((marker, idx) => (
              <MarkerRow
                key={marker.uuid}
                guildId={guildId}
                mapId={mapId}
                marker={marker}
                index={idx}
                isSelected={marker.uuid === selectedMarkerUuid}
                onSelect={onSelectMarker}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
