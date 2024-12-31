"use client"

import { memo, useEffect, useMemo, useState } from "react"
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
import { useTheme } from "@/app/providers/ThemeProvider"
import DMButton from "./DMButton"
import useRemoveMarkerMutation from "../../hooks/useRemoveMarkerMutation"
import useAddMarkerMutation from "../../hooks/useAddMarkerMutation"
import { svgToBase64, uuid } from "@/utils/helpers"
import useGetMarkers from "../../hooks/useGetMarkers"

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

const DebugLogger = () => {
  const map = useMap();

  useEffect(() => {
    const logMapDetails = () => {
      console.log("Center:", map.getCenter());
      console.log("Bounds:", map.getBounds());
      console.log("Zoom:", map.getZoom());
    };

    // Log initial state
    logMapDetails();

    // Add event listeners
    map.on('move', logMapDetails); // Log on pan/zoom
    map.on('zoomend', logMapDetails);

    map.on('tileerror', (error) => {
      console.log("Tile Load Error:", error.coords);
    });

    // Cleanup listeners on unmount
    return () => {
      map.off('move', logMapDetails);
      map.off('zoomend', logMapDetails);
      map.off('tileerror');
    };
  }, [map]);

  return null;
};

MarkerHandler.displayName = 'MarkerHandler'

export default function MapComponent() {
  const { theme } = useTheme()

  const mutateAddMarker = useAddMarkerMutation();
  const mutateRemoveMarker = useRemoveMarkerMutation();
  const { data: markers = [] } = useGetMarkers();

  const standard_map_tiles_path = "/api/eberron"
  const dm_map_tiles_path = "/api/eberron-dm"

  const [lastMarkerId] = useState(null)
  const [rulerHandler, setRulerHandler] = useState(false)
  const [markerHandler, setMarkerHandler] = useState(false)
  const [dmHandler, setDMHandler] = useState(false)
  const [rulerPoints, setRulerPoints] = useState([])
  const [url, setUrl] = useState(standard_map_tiles_path)

  const customIcon = useMemo(() => {
    const svgString = `
    <svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200px" height="200px" viewBox="0 0 512 512" xml:space="preserve" fill="${theme.primaryColor}">
      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <style type="text/css">.st0{fill:${theme.primaryColor};}</style>
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

  const mapBounds = [
    [-9674, 0],
    [0, 15360],
  ];

  const mapCenter = [-75, 125];

  const toggleMarkers = () => {
    if (rulerHandler) {
      setRulerHandler(false)
      setRulerPoints([])
    }

    setMarkerHandler(prev => !prev)
  }

  const toggleDM = () => {
    setDMHandler(prev => !prev)
  }

  const toggleRuler = () => {
    if (markerHandler) {
      setMarkerHandler(false)
    }

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
    if (rulerHandler) {
      return
    }

    mutateAddMarker.mutate(newMarker)
  }

  useEffect(() => {
    if (dmHandler) {
      setUrl(dm_map_tiles_path)
    } else {
      setUrl(standard_map_tiles_path)
    }
  }, [dmHandler])

  const memoizedMarkers = useMemo(() => markers.map((marker) => (
    <Marker
      position={marker.position}
      key={marker.uuid}
      icon={customIcon}
    >
      <Popup>
        <div className="popupContent">
          {marker.distance === "Start" ? "Starting Point" : `Marker - ${marker.distance} miles from last marker`}
          <button onClick={(e) => {
            e.stopPropagation()
            mutateRemoveMarker.mutate(marker.uuid)
          }}>
            Delete Marker
          </button>
        </div>
      </Popup>
    </Marker>
  )), [markers, customIcon, mutateRemoveMarker])

  return (
    <MapContainer
      bounds={mapBounds}
      center={mapCenter}
      fadeAnimation={true}
      markerZoomAnimation={true}
      zoomAnimation={true}
      className={`mapContainer crosshair`}
      zoom={3}
      minZoom={2}
      maxZoom={5}
      zoomSnap={1}
      preferCanvas={true}
      attributionControl={false}
      style={{
        height: '85dvh',
        width: '100%',
      }}
      crs={L.CRS.Simple}
    >
      <TileLayer
        url={`${url}/{z}/{x}/{y}.png`}
        noWrap={true}
        tileSize={256}
        bounds={mapBounds}
        tms={false}
        maxNativeZoom={5}
        minNativeZoom={0}
      />
      {memoizedMarkers}
      {markers && (
        <Polyline
          positions={markers.map(marker => marker.position)}
          pathOptions={{
            color: theme.primaryColor,
            dashArray: '10, 20',
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
        <DMButton onClick={toggleDM} isActive={dmHandler} />
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
