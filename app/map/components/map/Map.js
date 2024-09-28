"use client"

import { memo, useMemo, useState } from "react"
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  Tooltip,
  useMapEvents,
  useMap
} from 'react-leaflet'
import L from "leaflet"
import CustomControls from "./Controls"
import MarkerButton from "./MarkerButton"
import RulerButton from "./RulerButton"
import { calculateDistance } from "./utils"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchMarkers, addMarker, removeMarker, updateMarkerDistance } from '@/lib/markers'
import { useTheme } from "@/app/providers/ThemeProvider"

const RulerHandler = memo(({ addRulerPoint }) => {
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

RulerHandler.displayName = 'RulerHandler'

const MarkerHandler = memo(({ markers, lastMarkerId, addMarker }) => {
  const map = useMap()

  useMapEvents({
    click: (e) => {
      if (map.getBounds().contains(e.latlng)) {
        const newMarker = {
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

MarkerHandler.displayName = 'MarkerHandler'

export default function MapComponent({ user_id }) {
  const queryClient = useQueryClient()

  const [lastMarkerId, _] = useState(null)
  const [rulerHandler, setRulerHandler] = useState(false)
  const [markerHandler, setMarkerHandler] = useState(false)
  const [rulerPoints, setRulerPoints] = useState([])
  const { theme } = useTheme()

  function svgToBase64(svgString) {
    return `data:image/svg+xmlbase64,${btoa(svgString)}`
  }

  const customIcon = useMemo(() => {
    const svgString = `
    <svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200px" height="200px" viewBox="0 0 512 512" xml:space="preserve" fill="${theme.primaryColor}">
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <style type="text/css">.st0{fill:${theme.primaryColor}}</style>
        <g>
          <path class="st0" d="M390.54,55.719C353.383,18.578,304.696,0,255.993,0c-48.688,0-97.391,18.578-134.547,55.719 c-59.219,59.219-74.641,149.563-36.094,218.875C129.586,354.109,255.993,512,255.993,512s126.422-157.891,170.656-237.406 C465.195,205.281,449.773,114.938,390.54,55.719z M255.993,305.844c-63.813,0-115.563-51.75-115.563-115.547 c0-63.859,51.75-115.609,115.563-115.609c63.828,0,115.578,51.75,115.578,115.609C371.571,254.094,319.821,305.844,255.993,305.844 z"></path>
        </g>
      </g>
    </svg>`

    const base64Svg = svgToBase64(svgString)

    return new L.Icon({
      iconUrl: base64Svg,
      iconSize: [25, 25],
      iconAnchor: [11.5, 15],
    })
  }, [theme.primaryColor])

  const { data: markers = [] } = useQuery({
    queryKey: ['markers'],
    queryFn: fetchMarkers,
  })

  //const url= "/images/eberron" // for local development
  const url = "/api/tiles"

  const mapBounds = [
    [19.25, 200],
    [-172.25, -123.5],
  ]

  const mutateAddMarker = useMutation({
    mutationFn: addMarker,
    onMutate: async (newMarker) => {
      await queryClient.cancelQueries(['markers'])

      const previousMarkers = queryClient.getQueryData(['markers'])

      const optimisticNewMarker = { ...newMarker, id: Date.now() }
      queryClient.setQueryData(['markers'], (oldMarkers = []) => [...oldMarkers, optimisticNewMarker])

      return { previousMarkers }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['markers'], context.previousMarkers)
      console.error("Failed to add marker:", err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries(['markers'])
    }
  })

  const mutateRemoveMarker = useMutation({
    mutationFn: removeMarker,
    onMutate: async (markerId) => {
      await queryClient.cancelQueries(['markers'])

      const previousMarkers = queryClient.getQueryData(['markers'])

      // Optimistically update the markers by removing the deleted marker
      const updatedMarkers = previousMarkers.filter(marker => marker.id !== markerId)

      // Check if we need to update the marker relationships (prev_marker, distance)
      const markerToRemove = previousMarkers.find(marker => marker.id === markerId)
      const affectedMarker = previousMarkers.find(marker => marker.prev_marker === markerId)

      if (affectedMarker && markerToRemove) {
        const newPrevMarker = previousMarkers.find(marker => marker.id === markerToRemove.prev_marker)

        // Update the affected marker's distance and prev_marker
        const updatedDistance = newPrevMarker
          ? calculateDistance(newPrevMarker.position, affectedMarker.position)
          : "Start"

        // Update the affected marker
        queryClient.setQueryData(['markers'], updatedMarkers.map(marker =>
          marker.id === affectedMarker.id
            ? { ...marker, prev_marker: markerToRemove.prev_marker, distance: updatedDistance }
            : marker
        ))

        updateMarkerDistance(affectedMarker.id, updatedDistance)
      } else {
        queryClient.setQueryData(['markers'], updatedMarkers)
      }

      return { previousMarkers }
    },
    onError: (err, markerId, context) => {
      queryClient.setQueryData(['markers'], context.previousMarkers)
      console.error(`Failed to remove marker: ${markerId}`, err.message)
    },
    onSettled: () => {
      queryClient.invalidateQueries(['markers'])
    }
  })

  const toggleMarkers = () => {
    setMarkerHandler(prev => !prev)
  }

  const toggleRuler = () => {
    if (rulerHandler) {
      setRulerPoints([])
    }
    setRulerHandler(prev => !prev)
  }

  const addRulerPoint = (latlng) => {
    setRulerPoints(prevPoints => {
      if (prevPoints.length === 2) {
        return [latlng]
      } else {
        return [...prevPoints, latlng]
      }
    })
  }

  const handleAddMarker = (newMarker) => {
    mutateAddMarker.mutate(newMarker)
  }

  const memoizedMarkers = useMemo(() => markers.map((marker, idx) => (
    <Marker
      position={marker.position}
      key={idx}
      icon={customIcon}
    >
      <Popup>
        <div className="popupContent">
          {idx === 0 ? "Starting Point" : `Marker ${idx + 1} - ${marker.distance} miles from last marker`}
          <button onClick={(e) => {
            e.stopPropagation()
            mutateRemoveMarker.mutate(marker.id)
          }}>
            Delete Marker
          </button>
        </div>
      </Popup>
    </Marker>
  )), [markers, customIcon, mutateRemoveMarker])

  return (
    <MapContainer
      center={[-80, 117]}
      className={`mapContainer crosshair`}
      zoom={2}
      minZoom={2}
      maxZoom={5}
      bounds={mapBounds}
      zoomSnap={0.5}
      style={{
        height: '85vh',
        width: '100%',
      }}
      crs={L.CRS.Simple}
    >
      <TileLayer
        url={`${url}/{z}/{x}/{y}.png`}
        noWrap={true}
        tms={false}
        tileSize={256}
        bounds={mapBounds}
      />
      {memoizedMarkers}
      {markers && (
        <Polyline
          positions={markers.map(marker => marker.position)}
          pathOptions={{
            color: theme.primaryColor,
            dashArray: '10, 20' ,
            opacity: '0.8',
            lineCap: 'round',
            lineJoin: 'bevel',
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
      <CustomControls position="topleft" className="custom-controls">
        <MarkerButton onClick={toggleMarkers} isActive={markerHandler} />
        <RulerButton onClick={toggleRuler} isActive={rulerHandler} />
      </CustomControls>
      {markerHandler && (
        <MarkerHandler
          addMarker={handleAddMarker}
          markers={markers}
          lastMarkerId={lastMarkerId}
        />
      )}
      {rulerHandler && (
        <RulerHandler
          addRulerPoint={addRulerPoint}
          rulerPoints={rulerPoints}
        />
      )}
    </MapContainer>
  )
}
