"use client"

import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen, MapPin, Trash2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import useGetMarkers from "../hooks/useGetMarkers"
import useRemoveMarkerMutation from "../hooks/useRemoveMarkerMutation"

function MarkerList({ markers, onDelete, search }) {
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
      {filtered.map((marker, idx) => (
        <div
          key={marker.uuid}
          className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50 group"
        >
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
              onClick={() => onDelete(marker.uuid)}
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

function PanelContent({ markers, onDelete }) {
  const [search, setSearch] = useState("")

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search markers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>
      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        Markers ({markers.length})
      </div>
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        <MarkerList markers={markers} onDelete={onDelete} search={search} />
      </div>
    </div>
  )
}

export default function MapSidePanel() {
  const [collapsed, setCollapsed] = useState(false)
  const { data: markers = [] } = useGetMarkers()
  const removeMarker = useRemoveMarkerMutation()

  const handleDelete = (uuid: string) => {
    removeMarker.mutate(uuid)
  }

  return (
    <>
      {/* Desktop panel */}
      <div
        className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-200 ${collapsed ? "w-0 overflow-hidden" : "w-[280px] p-3"}`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-cinzel text-sm font-semibold">Map Markers</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeftClose size={16} />
          </Button>
        </div>
        <PanelContent markers={markers} onDelete={handleDelete} />
      </div>

      {/* Desktop collapsed toggle */}
      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex absolute top-2 left-2 z-[1000] h-8 w-8 bg-card/80 backdrop-blur-sm border border-border"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeftOpen size={16} />
        </Button>
      )}

      {/* Mobile bottom sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-[1000] gap-1.5 shadow-lg"
          >
            <MapPin size={14} />
            Markers ({markers.length})
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="font-cinzel">Map Markers</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden pt-2">
            <PanelContent markers={markers} onDelete={handleDelete} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
