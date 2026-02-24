"use client"

import { useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"
import { FloatingToolbar } from "./FloatingToolbar"
import MapSidePanel from "./MapSidePanel"
import { MarkerInfoCard } from "./MarkerInfoCard"
import useGetMarkers from "../hooks/useGetMarkers"
import usePmtilesUrl from "../hooks/usePmtilesUrl"

const GuildMap = dynamic(() => import("./GuildMap"), { ssr: false })

export type MarkerScreenPosition = { x: number; y: number } | null

export type MapHandle = {
  flyToMarker: (position: { lat: number; lng: number }) => void
  zoomIn: () => void
  zoomOut: () => void
}

export default function GuildMapLoader({ guildId, mapId }: { guildId: string; mapId: string }) {
  const [selectedMarkerUuid, setSelectedMarkerUuid] = useState<string | null>(null)
  const [markerScreenPos, setMarkerScreenPos] = useState<MarkerScreenPosition>(null)
  const mapHandleRef = useRef<MapHandle | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: pmtilesUrl, isLoading: pmLoading, error: pmError } = usePmtilesUrl(guildId, mapId)
  const { data: markers = [] } = useGetMarkers(guildId, mapId)

  const [markerActive, setMarkerActive] = useState(false)
  const [rulerActive, setRulerActive] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const handleSelectMarker = useCallback((uuid: string, position: { lat: number; lng: number }) => {
    setSelectedMarkerUuid(uuid)
    mapHandleRef.current?.flyToMarker(position)
  }, [])

  const handleDismissInfoCard = useCallback(() => {
    setSelectedMarkerUuid(null)
    setMarkerScreenPos(null)
  }, [])

  const toggleMarker = useCallback(() => {
    setRulerActive(false)
    setMarkerActive(prev => !prev)
  }, [])

  const toggleRuler = useCallback(() => {
    setMarkerActive(false)
    setRulerActive(prev => !prev)
  }, [])

  const togglePanel = useCallback(() => {
    setPanelOpen(prev => !prev)
  }, [])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const handleZoomIn = useCallback(() => {
    mapHandleRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    mapHandleRef.current?.zoomOut()
  }, [])

  if (pmLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-12rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (pmError || !pmtilesUrl) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-12rem)]">
        <p className="text-sm text-destructive">Failed to load map tiles</p>
      </div>
    )
  }

  const selectedMarker = selectedMarkerUuid
    ? markers.find(m => m.uuid === selectedMarkerUuid) ?? null
    : null

  const containerSize = containerRef.current
    ? { width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }
    : { width: 0, height: 0 }

  return (
    <div ref={containerRef} className="relative h-[calc(100dvh-12rem)] overflow-hidden rounded-xl">
      <GuildMap
        guildId={guildId}
        mapId={mapId}
        pmtilesUrl={pmtilesUrl}
        selectedMarkerUuid={selectedMarkerUuid}
        setSelectedMarkerUuid={setSelectedMarkerUuid}
        mapHandleRef={mapHandleRef}
        markerActive={markerActive}
        rulerActive={rulerActive}
        onMarkerScreenPositionChange={setMarkerScreenPos}
      />
      <MapSidePanel
        guildId={guildId}
        mapId={mapId}
        open={panelOpen}
        onClose={closePanel}
        selectedMarkerUuid={selectedMarkerUuid}
        onSelectMarker={handleSelectMarker}
      />
      {selectedMarker && markerScreenPos && (
        <MarkerInfoCard
          guildId={guildId}
          mapId={mapId}
          marker={selectedMarker}
          screenPosition={markerScreenPos}
          containerSize={containerSize}
          onDismiss={handleDismissInfoCard}
        />
      )}
      <FloatingToolbar
        markerActive={markerActive}
        rulerActive={rulerActive}
        panelOpen={panelOpen}
        onToggleMarker={toggleMarker}
        onToggleRuler={toggleRuler}
        onTogglePanel={togglePanel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  )
}
