"use client"

import { MapPin, Ruler, Eye, Plus, Minus, Map, List } from "lucide-react"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

type FloatingToolbarProps = {
  markerActive: boolean
  rulerActive: boolean
  dmActive: boolean
  panelOpen: boolean
  onToggleMarker: () => void
  onToggleRuler: () => void
  onToggleDM: () => void
  onTogglePanel: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export function FloatingToolbar({
  markerActive, rulerActive, dmActive, panelOpen,
  onToggleMarker, onToggleRuler, onToggleDM, onTogglePanel,
  onZoomIn, onZoomOut,
}: FloatingToolbarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="absolute bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <GlassPanel variant="strong" className="flex items-center gap-1 px-2 py-1.5 rounded-full">
          <ToolbarButton icon={List} label="Marker List" active={panelOpen} onClick={onTogglePanel} />
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton
            icon={markerActive ? MapPin : Map}
            label={markerActive ? "Stop Placing" : "Place Markers"}
            active={markerActive}
            onClick={onToggleMarker}
          />
          <ToolbarButton icon={Ruler} label="Measure Distance" active={rulerActive} onClick={onToggleRuler} />
          <ToolbarButton icon={Eye} label="DM View" active={dmActive} onClick={onToggleDM} />
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton icon={Plus} label="Zoom In" onClick={onZoomIn} />
          <ToolbarButton icon={Minus} label="Zoom Out" onClick={onZoomOut} />
        </GlassPanel>
      </div>
    </TooltipProvider>
  )
}

function ToolbarButton({
  icon: Icon, label, active, onClick,
}: {
  icon: typeof MapPin; label: string; active?: boolean; onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-full cursor-pointer ${
            active
              ? "bg-primary/20 text-primary shadow-[0_0_12px_-3px_rgba(var(--corona-rgb),0.5)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}
