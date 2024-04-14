"use client"

import {useState} from "react"
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from "leaflet";

const MILES_PER_MAP_UNIT = 15.644; // Miles per each map unit

function calculateDistanceInMiles(mapUnits) {
    return mapUnits * MILES_PER_MAP_UNIT; // Convert map units directly to miles
}

function calculateDistance(pointA, pointB) {
    const dx = pointB.lng - pointA.lng; // difference in longitude units
    const dy = pointB.lat - pointA.lat; // difference in latitude units
    const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy); // Euclidean distance in map units
    return calculateDistanceInMiles(distanceInMapUnits).toFixed(2); // Convert to miles and format
}

function ClickHandler({ setMarkers }) {
    useMapEvents({
        click: (e) => {
            setMarkers((prevMarkers) => [
                ...prevMarkers,
                {
                    position: e.latlng,
                    distance: prevMarkers.length > 0
                        ? calculateDistance(prevMarkers[prevMarkers.length - 1].position, e.latlng)
                        : "Start"
                }
            ]);
        }
    });
    return null;
}

export default function MapComponent() {
    const [markers, setMarkers] = useState([])

    const url = "https://dndeberron.s3.amazonaws.com/eberron";
    const mapBounds = new L.LatLngBounds([0, 0], [9674, 15360]);

    return (
        <MapContainer
            center={[-80,117]}
            className="mapContainer"
            zoom={2}
            minZoom={0}
            maxZoom={5}
            bounds={mapBounds}
            zoomSnap={0.5}
            style={{ height: '85vh', width: '100%' }}
            crs={L.CRS.Simple}
        >
            <TileLayer
                url={`${url}/{z}/{x}/{y}.png`}
                noWrap={true}
                tms={false}
                tileSize={256}
            />
            {markers.map((marker, idx) => (
                <Marker position={marker.position} key={idx}>
                    <Popup>
                        {idx === 0 ? "Starting Point" : `Marker ${idx + 1} - ${marker.distance} miles from last marker`}
                    </Popup>
                </Marker>
            ))}
            {markers.length > 1 && (
                <Polyline
                    positions={markers.map(marker => marker.position)}
                    pathOptions={{ color: 'blue', dashArray: '10, 20' }}
                />
            )}
            <ClickHandler setMarkers={setMarkers} />
        </MapContainer>
    );
}
