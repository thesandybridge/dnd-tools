"use client"

import { useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { useQuery } from "@tanstack/react-query"
import { FloatingToolbar } from "./FloatingToolbar"
import MapSidePanel from "./MapSidePanel"
import { MarkerInfoCard } from "./MarkerInfoCard"
import useGetMarkers from "../hooks/useGetMarkers"
import usePmtilesUrl from "../hooks/usePmtilesUrl"
import { fetchGuildMap } from "@/lib/guild-maps"

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

  const pmtilesUrl = usePmtilesUrl(guildId, mapId)
  const { data: markers = [] } = useGetMarkers(guildId, mapId)
  const { data: mapData } = useQuery({
    queryKey: ["guild-map", guildId, mapId],
    queryFn: () => fetchGuildMap(guildId, mapId),
  })

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

  const selectedMarker = selectedMarkerUuid
    ? markers.find(m => m.uuid === selectedMarkerUuid) ?? null
    : null

  const containerSize = containerRef.current
    ? { width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }
    : { width: 0, height: 0 }

  return (
    <div ref={containerRef} className="relative left-1/2 -translate-x-1/2 w-screen md:w-[calc(100vw-4rem)] h-[calc(100dvh-12rem)] overflow-hidden">
      <GuildMap
        guildId={guildId}
        mapId={mapId}
        pmtilesUrl={pmtilesUrl}
        imageWidth={mapData?.image_width ?? null}
        imageHeight={mapData?.image_height ?? null}
        maxZoom={mapData?.max_zoom ?? 5}
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
