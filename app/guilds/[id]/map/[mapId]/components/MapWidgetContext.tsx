"use client"

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react"

type MapWidgetValues = {
  guildId: string
  mapId: string
  selectedMarkerUuid: string | null
  onSelectMarker: (uuid: string, position: { lat: number; lng: number }) => void
}

// Split into two contexts so the registerer (GuildMapLoader) doesn't re-render
// when values change — it only needs the stable setter.
const SetterContext = createContext<((v: MapWidgetValues | null) => void) | null>(null)
const ValuesContext = createContext<MapWidgetValues | null>(null)

export function MapWidgetProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<MapWidgetValues | null>(null)
  const setMapContext = useCallback((v: MapWidgetValues | null) => setValues(v), [])

  return (
    <SetterContext.Provider value={setMapContext}>
      <ValuesContext.Provider value={values}>
        {children}
      </ValuesContext.Provider>
    </SetterContext.Provider>
  )
}

export function useMapWidget(): MapWidgetValues | null {
  return useContext(ValuesContext)
}

export function useRegisterMapWidget(
  guildId: string,
  mapId: string,
  selectedMarkerUuid: string | null,
  onSelectMarker: (uuid: string, position: { lat: number; lng: number }) => void,
) {
  const setMapContext = useContext(SetterContext)

  useEffect(() => {
    setMapContext?.({ guildId, mapId, selectedMarkerUuid, onSelectMarker })
  }, [setMapContext, guildId, mapId, selectedMarkerUuid, onSelectMarker])

  useEffect(() => {
    return () => setMapContext?.(null)
  }, [setMapContext])
}
