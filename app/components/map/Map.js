"use client"

import {useState} from "react"
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from "leaflet";

const calculateDistance = (pointA, pointB) => {
    return pointA.distanceTo(pointB) / 1000;
};

function ClickHandler({ setMarkers }) {
    useMapEvents({
        click: (e) => {
            setMarkers((prevMarkers) => [
                ...prevMarkers,
                {
                    position: e.latlng,
                    distance: prevMarkers.length > 0
                        ? calculateDistance(prevMarkers[prevMarkers.length - 1].position, e.latlng).toFixed(2)
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
                        {idx === 0 ? "Starting Point" : `Marker ${idx + 1} - ${marker.distance} km from last marker`}
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
