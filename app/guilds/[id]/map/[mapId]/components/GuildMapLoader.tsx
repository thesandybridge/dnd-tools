"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FloatingToolbar } from "./FloatingToolbar"
import { MapWidgetProvider } from "./MapWidgetContext"
import { MarkerInfoCard } from "./MarkerInfoCard"
import { useWidgets } from "@/app/components/widgets/WidgetProvider"
import useGetMarkers from "../hooks/useGetMarkers"
import usePmtilesUrl from "../hooks/usePmtilesUrl"
import { fetchGuildMap, updateGuildMap } from "@/lib/guild-maps"

const GuildMap = dynamic(() => import("./GuildMap"), { ssr: false })

export type MarkerScreenPosition = { x: number; y: number } | null

export type MapHandle = {
  flyToMarker: (position: { lat: number; lng: number }) => void
  zoomIn: () => void
  zoomOut: () => void
  getView: () => { zoom: number; center: { lat: number; lng: number } }
}

export default function GuildMapLoader({ guildId, mapId }: { guildId: string; mapId: string }) {
  const { registerScope, unregisterScope } = useWidgets()

  useEffect(() => {
    registerScope("map")
    return () => unregisterScope("map")
  }, [registerScope, unregisterScope])

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

  const queryClient = useQueryClient()
  const [markerActive, setMarkerActive] = useState(false)
  const [rulerActive, setRulerActive] = useState(false)
  const saveViewMutation = useMutation({
    mutationFn: (view: { zoom: number; center: { lat: number; lng: number } }) =>
      updateGuildMap(guildId, mapId, {
        defaultZoom: view.zoom,
        defaultCenterLat: view.center.lat,
        defaultCenterLng: view.center.lng,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild-map", guildId, mapId] })
    },
  })

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

  const handleZoomIn = useCallback(() => {
    mapHandleRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    mapHandleRef.current?.zoomOut()
  }, [])

  const handleSaveDefaultView = useCallback(() => {
    const view = mapHandleRef.current?.getView()
    if (view) saveViewMutation.mutate(view)
  }, [saveViewMutation])

  const selectedMarker = selectedMarkerUuid
    ? markers.find(m => m.uuid === selectedMarkerUuid) ?? null
    : null

  const containerSize = containerRef.current
    ? { width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }
    : { width: 0, height: 0 }

  return (
    <MapWidgetProvider
      guildId={guildId}
      mapId={mapId}
      selectedMarkerUuid={selectedMarkerUuid}
      onSelectMarker={handleSelectMarker}
    >
      <div ref={containerRef} className="relative left-1/2 -translate-x-1/2 w-screen md:w-[calc(100vw-4rem)] h-[calc(100dvh-12rem)] overflow-hidden">
        <GuildMap
          guildId={guildId}
          mapId={mapId}
          pmtilesUrl={pmtilesUrl}
          imageWidth={mapData?.image_width ?? null}
          imageHeight={mapData?.image_height ?? null}
          maxZoom={mapData?.max_zoom ?? 5}
          defaultZoom={mapData?.default_zoom ?? null}
          defaultCenterLat={mapData?.default_center_lat ?? null}
          defaultCenterLng={mapData?.default_center_lng ?? null}
          selectedMarkerUuid={selectedMarkerUuid}
          setSelectedMarkerUuid={setSelectedMarkerUuid}
          mapHandleRef={mapHandleRef}
          markerActive={markerActive}
          rulerActive={rulerActive}
          onMarkerScreenPositionChange={setMarkerScreenPos}
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
          onToggleMarker={toggleMarker}
          onToggleRuler={toggleRuler}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onSaveDefaultView={handleSaveDefaultView}
          isSavingView={saveViewMutation.isPending}
        />
      </div>
    </MapWidgetProvider>
  )
}
