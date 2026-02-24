"use client"

import { useState, useCallback, useRef } from "react"
import dynamic from 'next/dynamic'
import { FloatingToolbar } from './components/FloatingToolbar'
import MapSidePanel from './components/MapSidePanel'
import { MarkerInfoCard } from './components/MarkerInfoCard'
import useGetMarkers from './hooks/useGetMarkers'

const MapComponent = dynamic(() => import("./components/map/Map"), { ssr: false })

export type MarkerScreenPosition = { x: number; y: number } | null

export type MapHandle = {
  flyToMarker: (position: { lat: number; lng: number }) => void
  zoomIn: () => void
  zoomOut: () => void
}

export default function MapLoader() {
  const [selectedMarkerUuid, setSelectedMarkerUuid] = useState<string | null>(null)
  const [markerScreenPos, setMarkerScreenPos] = useState<MarkerScreenPosition>(null)
  const mapHandleRef = useRef<MapHandle | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: markers = [] } = useGetMarkers()

  // Map tool toggle state
  const [markerActive, setMarkerActive] = useState(false)
  const [rulerActive, setRulerActive] = useState(false)
  const [dmActive, setDmActive] = useState(false)
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

  const toggleDM = useCallback(() => {
    setDmActive(prev => !prev)
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
    <div ref={containerRef} className="relative h-[calc(100dvh-4rem)] md:h-dvh">
      <MapComponent
        selectedMarkerUuid={selectedMarkerUuid}
        setSelectedMarkerUuid={setSelectedMarkerUuid}
        mapHandleRef={mapHandleRef}
        markerActive={markerActive}
        rulerActive={rulerActive}
        dmActive={dmActive}
        onMarkerScreenPositionChange={setMarkerScreenPos}
      />
      <MapSidePanel
        open={panelOpen}
        onClose={closePanel}
        selectedMarkerUuid={selectedMarkerUuid}
        onSelectMarker={handleSelectMarker}
      />
      {selectedMarker && markerScreenPos && (
        <MarkerInfoCard
          marker={selectedMarker}
          screenPosition={markerScreenPos}
          containerSize={containerSize}
          onDismiss={handleDismissInfoCard}
        />
      )}
      <FloatingToolbar
        markerActive={markerActive}
        rulerActive={rulerActive}
        dmActive={dmActive}
        panelOpen={panelOpen}
        onToggleMarker={toggleMarker}
        onToggleRuler={toggleRuler}
        onToggleDM={toggleDM}
        onTogglePanel={togglePanel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  )
}
