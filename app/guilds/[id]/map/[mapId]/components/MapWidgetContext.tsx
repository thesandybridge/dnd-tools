"use client"

import { createContext, useContext, type ReactNode } from "react"

type MapWidgetContextValue = {
  guildId: string
  mapId: string
  selectedMarkerUuid: string | null
  onSelectMarker: (uuid: string, position: { lat: number; lng: number }) => void
}

const MapWidgetContext = createContext<MapWidgetContextValue | null>(null)

export function MapWidgetProvider({
  children,
  ...value
}: MapWidgetContextValue & { children: ReactNode }) {
  return (
    <MapWidgetContext.Provider value={value}>
      {children}
    </MapWidgetContext.Provider>
  )
}

export function useMapWidget(): MapWidgetContextValue {
  const ctx = useContext(MapWidgetContext)
  if (!ctx) throw new Error("useMapWidget must be used within a MapWidgetProvider")
  return ctx
}
