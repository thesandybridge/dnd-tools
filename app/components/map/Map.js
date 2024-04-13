"use client"

import { MapContainer, TileLayer } from 'react-leaflet'
import L from "leaflet";

export default function MapComponent() {

    const url = "https://dndeberron.s3.amazonaws.com/eberron";

    return (
        <MapContainer
            center={[-80,117]}
            className="mapContainer"
            zoom={2}
            minZoom={0}
            maxZoom={5}
            style={{ height: '85vh', width: '100%' }}
            crs={L.CRS.Simple}
        >
            <TileLayer
                url={`${url}/{z}/{x}/{y}.png`}
                noWrap={true}
                tms={false}
                tileSize={256}
            />
        </MapContainer>
    );
}
