"use client"

import { MapPin, Ruler, Plus, Minus, Map, List, Crosshair, Loader2 } from "lucide-react"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

type FloatingToolbarProps = {
  markerActive: boolean
  rulerActive: boolean
  panelOpen: boolean
  onToggleMarker: () => void
  onToggleRuler: () => void
  onTogglePanel: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onSaveDefaultView: () => void
  isSavingView: boolean
}

export function FloatingToolbar({
  markerActive, rulerActive, panelOpen,
  onToggleMarker, onToggleRuler, onTogglePanel,
  onZoomIn, onZoomOut, onSaveDefaultView, isSavingView,
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
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton icon={Plus} label="Zoom In" onClick={onZoomIn} />
          <ToolbarButton icon={Minus} label="Zoom Out" onClick={onZoomOut} />
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton
            icon={isSavingView ? Loader2 : Crosshair}
            label="Set Default View"
            onClick={onSaveDefaultView}
            spinning={isSavingView}
          />
        </GlassPanel>
      </div>
    </TooltipProvider>
  )
}

function ToolbarButton({
  icon: Icon, label, active, spinning, onClick,
}: {
  icon: typeof MapPin; label: string; active?: boolean; spinning?: boolean; onClick: () => void
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
          disabled={spinning}
        >
          <Icon className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}
