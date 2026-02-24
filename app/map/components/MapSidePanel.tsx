"use client"

import { useState, useRef, useEffect } from "react"
import { X, MapPin, Trash2, Search, Pencil, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import useGetMarkers from "../hooks/useGetMarkers"
import useRemoveMarkerMutation from "../hooks/useRemoveMarkerMutation"
import useRenameMarkerMutation from "../hooks/useRenameMarkerMutation"
import type { Marker } from "@/lib/markers"

type MapSidePanelProps = {
  open: boolean
  onClose: () => void
  selectedMarkerUuid: string | null
  onSelectMarker: (uuid: string, position: { lat: number; lng: number }) => void
}

function InlineRename({ marker, onDone }: { marker: Marker; onDone: () => void }) {
  const rename = useRenameMarkerMutation()
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

function MarkerList({
  markers,
  onDelete,
  onSelect,
  selectedUuid,
  search,
}: {
  markers: Marker[]
  onDelete: (uuid: string) => void
  onSelect: (uuid: string, position: { lat: number; lng: number }) => void
  selectedUuid: string | null
  search: string
}) {
  const [editingUuid, setEditingUuid] = useState<string | null>(null)

  const filtered = markers.filter((m) => {
    if (!search) return true
    const text = m.text?.toLowerCase() ?? ""
    const dist = String(m.distance).toLowerCase()
    return text.includes(search.toLowerCase()) || dist.includes(search.toLowerCase())
  })

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {search ? "No matching markers" : "No markers placed yet"}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {filtered.map((marker, idx) => {
        const isSelected = marker.uuid === selectedUuid
        const isEditing = marker.uuid === editingUuid

        return (
          <div
            key={marker.uuid}
            onClick={() => {
              if (!isEditing && marker.position) {
                onSelect(marker.uuid, marker.position as { lat: number; lng: number })
              }
            }}
            className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm group cursor-pointer transition-colors ${
              isSelected
                ? "bg-[rgba(var(--corona-rgb),0.15)] border border-[rgba(var(--corona-rgb),0.3)]"
                : "hover:bg-white/[0.05]"
            }`}
          >
            {isEditing ? (
              <>
                <MapPin size={14} className="shrink-0 text-primary" />
                <InlineRename marker={marker} onDone={() => setEditingUuid(null)} />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={14} className="shrink-0 text-primary" />
                  <span className="truncate">
                    {marker.text || (marker.distance === "Start" ? "Start" : `Marker ${idx + 1}`)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {marker.distance !== "Start" && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {marker.distance} mi
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingUuid(marker.uuid)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity cursor-pointer"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(marker.uuid)
                    }}
                    className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PanelContent({
  markers,
  onDelete,
  onSelect,
  selectedUuid,
}: {
  markers: Marker[]
  onDelete: (uuid: string) => void
  onSelect: (uuid: string, position: { lat: number; lng: number }) => void
  selectedUuid: string | null
}) {
  const [search, setSearch] = useState("")

  return (
    <div className="flex flex-col gap-3 h-full">
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
        <MarkerList
          markers={markers}
          onDelete={onDelete}
          onSelect={onSelect}
          selectedUuid={selectedUuid}
          search={search}
        />
      </div>
    </div>
  )
}

export default function MapSidePanel({ open, onClose, selectedMarkerUuid, onSelectMarker }: MapSidePanelProps) {
  const { data: markers = [] } = useGetMarkers()
  const removeMarker = useRemoveMarkerMutation()

  const handleDelete = (uuid: string) => {
    removeMarker.mutate(uuid)
  }

  return (
    <>
      {/* Desktop: floating glass overlay */}
      {open && (
        <GlassPanel
          variant="default"
          corona
          className="hidden md:flex flex-col absolute top-4 left-4 z-[1000] w-[280px] max-h-[calc(100%-2rem)] p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-cinzel text-sm font-semibold">Map Markers</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </div>
          <PanelContent
            markers={markers}
            onDelete={handleDelete}
            onSelect={onSelectMarker}
            selectedUuid={selectedMarkerUuid}
          />
        </GlassPanel>
      )}

      {/* Mobile: bottom sheet */}
      <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
        <SheetContent side="bottom" className="md:hidden h-[60vh] rounded-t-xl backdrop-blur-lg bg-card/90 border-t border-white/[0.08]">
          <SheetHeader>
            <SheetTitle className="font-cinzel">Map Markers</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden pt-2">
            <PanelContent
              markers={markers}
              onDelete={handleDelete}
              onSelect={onSelectMarker}
              selectedUuid={selectedMarkerUuid}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
