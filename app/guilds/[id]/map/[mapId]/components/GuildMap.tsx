"use client"

import { memo, useEffect, useMemo, useState, useCallback, type MutableRefObject } from "react"
import {
  MapContainer,
  Polyline,
  Marker,
  Popup,
  Tooltip,
  useMapEvents,
  useMap
} from "react-leaflet"
import L from "leaflet"
import { calculateDistance } from "./utils"
import { useTheme } from "@/app/providers/ThemeProvider"
import useAddMarkerMutation from "../hooks/useAddMarkerMutation"
import { svgToBase64, uuid } from "@/utils/helpers"
import useGetMarkers from "../hooks/useGetMarkers"
import PmTilesLayer from "./PmTilesLayer"
import type { MapHandle, MarkerScreenPosition } from "./GuildMapLoader"

const RulerHandler = memo(({ addRulerPoint }: { addRulerPoint: (latlng: L.LatLng) => void }) => {
  const map = useMap()
  useMapEvents({
    click: (e) => {
      if (map.getBounds().contains(e.latlng)) {
        addRulerPoint(e.latlng)
      }
    }
  })
  return null
})

RulerHandler.displayName = "RulerHandler"

const MarkerHandler = memo(({ markers, lastMarkerId, addMarker }: {
  markers: Array<{ position: L.LatLng; uuid: string; distance: string }>
  lastMarkerId: string | null
  addMarker: (marker: unknown) => void
}) => {
  const map = useMap()

  useMapEvents({
    click: (e) => {
      if (map.getBounds().contains(e.latlng)) {
        const newMarker = {
          uuid: uuid(),
          position: e.latlng,
          distance: markers.length > 0
            ? calculateDistance(markers[markers.length - 1].position, e.latlng)
            : "Start",
          prev_marker: lastMarkerId
        }

        addMarker(newMarker)
      }
    }
  })

  return null
})

MarkerHandler.displayName = "MarkerHandler"

function MapHandleBridge({ mapHandleRef }: { mapHandleRef: MutableRefObject<MapHandle | null> }) {
  const map = useMap()

  useEffect(() => {
    mapHandleRef.current = {
      flyToMarker: (position) => {
        map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 4), {
          duration: 0.8,
        })
      },
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
    }
    return () => { mapHandleRef.current = null }
  }, [map, mapHandleRef])

  return null
}

function SelectedMarkerTracker({
  selectedMarkerUuid,
  markers,
  onPositionChange,
}: {
  selectedMarkerUuid: string | null
  markers: Array<{ uuid: string; position?: { lat: string | number; lng: string | number } }>
  onPositionChange: (pos: MarkerScreenPosition) => void
}) {
  const map = useMap()

  const update = useCallback(() => {
    if (!selectedMarkerUuid) {
      onPositionChange(null)
      return
    }
    const marker = markers.find(m => m.uuid === selectedMarkerUuid)
    if (!marker?.position) {
      onPositionChange(null)
      return
    }
    const latlng = L.latLng(Number(marker.position.lat), Number(marker.position.lng))
    const point = map.latLngToContainerPoint(latlng)
    onPositionChange({ x: point.x, y: point.y })
  }, [map, selectedMarkerUuid, markers, onPositionChange])

  useEffect(() => {
    update()
  }, [update])

  useMapEvents({
    move: update,
    zoom: update,
    moveend: update,
    zoomend: update,
  })

  return null
}

type GuildMapProps = {
  guildId: string
  mapId: string
  pmtilesUrl: string
  imageWidth: number | null
  imageHeight: number | null
  maxZoom: number
  selectedMarkerUuid: string | null
  setSelectedMarkerUuid: (uuid: string | null) => void
  mapHandleRef: MutableRefObject<MapHandle | null>
  markerActive: boolean
  rulerActive: boolean
  onMarkerScreenPositionChange: (pos: MarkerScreenPosition) => void
}

export default function GuildMap({
  guildId, mapId, pmtilesUrl,
  imageWidth, imageHeight, maxZoom,
  selectedMarkerUuid, setSelectedMarkerUuid, mapHandleRef,
  markerActive, rulerActive,
  onMarkerScreenPositionChange,
}: GuildMapProps) {
  const { theme } = useTheme()

  const mutateAddMarker = useAddMarkerMutation(guildId, mapId)
  const { data: markers = [] } = useGetMarkers(guildId, mapId)

  const [lastMarkerId] = useState(null)
  const [rulerPoints, setRulerPoints] = useState<L.LatLng[]>([])

  const tileSize = 256
  const mapBounds: L.LatLngBoundsLiteral = useMemo(() => {
    if (imageWidth && imageHeight) {
      const maxDim = Math.max(imageWidth, imageHeight)
      const mapW = (imageWidth / maxDim) * tileSize
      const mapH = (imageHeight / maxDim) * tileSize
      return [[-mapH, 0], [0, mapW]]
    }
    return [[-tileSize, 0], [0, tileSize]]
  }, [imageWidth, imageHeight])
  const mapCenter: L.LatLngExpression = [mapBounds[0][0] / 2, mapBounds[1][1] / 2]

  const customIcon = useMemo(() => {
    const svgString = `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200px" height="200px" viewBox="0 0 512 512" fill="${theme.primaryColor}">
      <g>
        <path d="M390.54,55.719C353.383,18.578,304.696,0,255.993,0c-48.688,0-97.391,18.578-134.547,55.719 c-59.219,59.219-74.641,149.563-36.094,218.875C129.586,354.109,255.993,512,255.993,512s126.422-157.891,170.656-237.406 C465.195,205.281,449.773,114.938,390.54,55.719z M255.993,305.844c-63.813,0-115.563-51.75-115.563-115.547 c0-63.859,51.75-115.609,115.563-115.609c63.828,0,115.578,51.75,115.578,115.609C371.571,254.094,319.821,305.844,255.993,305.844z"></path>
      </g>
    </svg>`

    return new L.Icon({
      iconUrl: svgToBase64(svgString),
      iconSize: [25, 25],
      iconAnchor: [11.5, 15],
    })
  }, [theme.primaryColor])

  const selectedIcon = useMemo(() => {
    const svgString = `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200px" height="200px" viewBox="0 0 512 512" fill="${theme.primaryColor}">
      <g>
        <path d="M390.54,55.719C353.383,18.578,304.696,0,255.993,0c-48.688,0-97.391,18.578-134.547,55.719 c-59.219,59.219-74.641,149.563-36.094,218.875C129.586,354.109,255.993,512,255.993,512s126.422-157.891,170.656-237.406 C465.195,205.281,449.773,114.938,390.54,55.719z M255.993,305.844c-63.813,0-115.563-51.75-115.563-115.547 c0-63.859,51.75-115.609,115.563-115.609c63.828,0,115.578,51.75,115.578,115.609C371.571,254.094,319.821,305.844,255.993,305.844z"></path>
      </g>
    </svg>`

    return new L.Icon({
      iconUrl: svgToBase64(svgString),
      iconSize: [32, 32],
      iconAnchor: [16, 20],
    })
  }, [theme.primaryColor])

  const addRulerPoint = (latlng: L.LatLng) => {
    setRulerPoints(prevPoints => {
      if (prevPoints.length === 2) {
        return [latlng]
      } else {
        return [...prevPoints, latlng]
      }
    })
  }

  useEffect(() => {
    if (!rulerActive) {
      setRulerPoints([])
    }
  }, [rulerActive])

  const handleAddMarker = (newMarker: unknown) => {
    if (rulerActive) return
    mutateAddMarker.mutate(newMarker)
  }

  const memoizedMarkers = useMemo(() => markers.map((marker) => (
    <Marker
      position={marker.position}
      key={marker.uuid}
      icon={marker.uuid === selectedMarkerUuid ? selectedIcon : customIcon}
      eventHandlers={{
        click: () => setSelectedMarkerUuid(marker.uuid),
      }}
    />
  )), [markers, customIcon, selectedIcon, selectedMarkerUuid, setSelectedMarkerUuid])

  return (
    <MapContainer
      bounds={mapBounds}
      center={mapCenter}
      fadeAnimation={true}
      markerZoomAnimation={true}
      zoomAnimation={true}
      className="mapContainer crosshair"
      zoom={1}
      minZoom={0}
      maxZoom={maxZoom}
      zoomSnap={1}
      preferCanvas={true}
      attributionControl={false}
      zoomControl={false}
      style={{
        height: "100%",
        width: "100%",
      }}
      crs={L.CRS.Simple}
    >
      <MapHandleBridge mapHandleRef={mapHandleRef} />
      <SelectedMarkerTracker
        selectedMarkerUuid={selectedMarkerUuid}
        markers={markers}
        onPositionChange={onMarkerScreenPositionChange}
      />
      <PmTilesLayer pmtilesUrl={pmtilesUrl} tileSize={tileSize} maxZoom={maxZoom} />
      {memoizedMarkers}
      {markers && (
        <Polyline
          positions={markers.map(marker => marker.position)}
          pathOptions={{
            color: theme.primaryColor,
            dashArray: "10, 20",
            opacity: '0.8',
            lineCap: "round",
            lineJoin: "bevel",
          }}
        />
      )}
      {rulerPoints.map((point, idx) => (
        <Marker
          position={point}
          key={idx}
          icon={customIcon}
        >
          <Popup>{`Ruler Point ${idx + 1}`}</Popup>
        </Marker>
      ))}
      {rulerPoints.length === 2 && (
        <Polyline
          positions={rulerPoints}
          pathOptions={{ color: theme.primaryColor, weight: 2 }}
        >
          <Tooltip permanent>{`Distance: ${calculateDistance(rulerPoints[0], rulerPoints[1])} miles`}</Tooltip>
        </Polyline>
      )}
      {markerActive && (
        <MarkerHandler
          addMarker={handleAddMarker}
          markers={markers}
          lastMarkerId={lastMarkerId}
        />
      )}
      {rulerActive && (
        <RulerHandler
          addRulerPoint={addRulerPoint}
        />
      )}
    </MapContainer>
  )
}
