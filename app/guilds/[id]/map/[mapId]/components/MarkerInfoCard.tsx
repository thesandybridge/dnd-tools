"use client"

import { useState, useRef, useEffect } from "react"
import { X, Trash2, Pencil, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import useRemoveMarkerMutation from "../hooks/useRemoveMarkerMutation"
import useRenameMarkerMutation from "../hooks/useRenameMarkerMutation"
import type { Marker } from "@/lib/markers"

type MarkerInfoCardProps = {
  guildId: string
  mapId: string
  marker: Marker
  screenPosition: { x: number; y: number }
  containerSize: { width: number; height: number }
  onDismiss: () => void
}

function InlineEdit({ guildId, mapId, marker, onDone }: { guildId: string; mapId: string; marker: Marker; onDone: () => void }) {
  const rename = useRenameMarkerMutation(guildId, mapId)
  const [value, setValue] = useState(marker.text || "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function save() {
    const trimmed = value.trim()
    if (trimmed !== (marker.text || "")) {
      rename.mutate({ uuid: marker.uuid, text: trimmed })
    }
    onDone()
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") save()
          if (e.key === "Escape") onDone()
        }}
        className="flex-1 min-w-0 bg-white/[0.05] border border-white/[0.1] rounded px-2 py-1 text-sm outline-none focus:border-[rgba(var(--corona-rgb),0.5)]"
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

const CARD_WIDTH = 240
const CARD_OFFSET_Y = 15

export function MarkerInfoCard({ guildId, mapId, marker, screenPosition, containerSize, onDismiss }: MarkerInfoCardProps) {
  const [editing, setEditing] = useState(false)
  const removeMarker = useRemoveMarkerMutation(guildId, mapId)

  const markerName = marker.text || (marker.distance === "Start" ? "Starting Point" : "Marker")

  let left = screenPosition.x - CARD_WIDTH / 2
  let top = screenPosition.y - CARD_OFFSET_Y

  if (left < 8) left = 8
  if (left + CARD_WIDTH > containerSize.width - 8) left = containerSize.width - CARD_WIDTH - 8

  const showBelow = top < 120
  if (showBelow) {
    top = screenPosition.y + 30
  }

  return (
    <div
      className="absolute z-[1001] transition-opacity duration-150"
      style={{
        left,
        top: showBelow ? top : undefined,
        bottom: showBelow ? undefined : containerSize.height - top,
        width: CARD_WIDTH,
      }}
    >
      <GlassPanel variant="strong" corona className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          {editing ? (
            <div className="flex-1 min-w-0">
              <InlineEdit guildId={guildId} mapId={mapId} marker={marker} onDone={() => setEditing(false)} />
            </div>
          ) : (
            <h4 className="text-sm font-semibold truncate flex-1">{markerName}</h4>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
          >
            <X size={14} />
          </Button>
        </div>

        {marker.distance && marker.distance !== "Start" && (
          <p className="text-xs text-muted-foreground mb-3">
            {marker.distance} miles from previous marker
          </p>
        )}
        {marker.distance === "Start" && (
          <p className="text-xs text-muted-foreground mb-3">
            Route starting point
          </p>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => setEditing(true)}
          >
            <Pencil size={12} />
            Rename
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 cursor-pointer text-destructive hover:text-destructive/80"
            disabled={removeMarker.isPending}
            onClick={() => {
              removeMarker.mutate(marker.uuid)
              onDismiss()
            }}
          >
            <Trash2 size={12} />
            {removeMarker.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
