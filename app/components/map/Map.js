"use client"
import { MapContainer, TileLayer } from 'react-leaflet'

export default function MapComponent() {
    const bounds = [
        [0, -75], // Southwest coordinates
        [0, 85]    // Northeast coordinates
    ];

    return (
        <MapContainer minZoom={0} bounds={bounds} zoom={3} maxZoom={5} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                url="/images/eberron/{z}/{x}/{y}.png"
            />
        </MapContainer>
    );
}
