"use client"

import {useState} from "react"
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from "leaflet";
import CustomControls from "./Controls";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import the FontAwesomeIcon component
import { faMap, faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

const MILES_PER_MAP_UNIT = 15.644;

function calculateDistanceInMiles(mapUnits) {
    return mapUnits * MILES_PER_MAP_UNIT;
}

function calculateDistance(pointA, pointB) {
    const dx = pointB.lng - pointA.lng; // difference in longitude units
    const dy = pointB.lat - pointA.lat; // difference in latitude units
    const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy); // Euclidean distance in map units
    return calculateDistanceInMiles(distanceInMapUnits).toFixed(2); // Convert to miles and format
}

function ClickHandler({ setMarkers }) {
    const map = useMap();
    useMapEvents({
        click: (e) => {
            if (map.getBounds().contains(e.latlng)) {
                setMarkers((prevMarkers) => [
                    ...prevMarkers,
                    {
                        position: e.latlng,
                        distance: prevMarkers.length > 0
                            ? calculateDistance(prevMarkers[prevMarkers.length - 1].position, e.latlng)
                            : "Start"
                    }
                ]);
            } else {
                console.log("Outside the bounds of the map")
            }
        }
    });
    return null;
}

const customIcon = new L.Icon({
    iconUrl: '/images/maps-and-flags.png',
    iconSize: [25, 25],
    iconAnchor: [11.5, 15],
});

const ControlButton = ({onClick, isActive}) => {
    const handleClick = (e) => {
        e.stopPropagation();
        onClick();
    };
    return (
        <div className={`map-btn ${isActive ? 'active-markers' : ''}`}>
            <FontAwesomeIcon
                title={"Set pins"}
                onClick={handleClick}
                style={{fontSize:"25px"}}
                icon={isActive ? faMapLocationDot : faMap}
            ></FontAwesomeIcon>
        </div>
    )
}

export default function MapComponent() {
    const [markers, setMarkers] = useState([])
    const [handler, setHandler] = useState(false)

    const url = "https://dndeberron.s3.amazonaws.com/eberron";
    const local = "/images/eberron";
    const mapBounds = new L.LatLngBounds([0, 0], [9674, 15360]);

    const toggleHandler = () => {
        setHandler(!handler)
    }

    function handleClickMarker(markerToRemove) {
        setMarkers((currentMarkers) => currentMarkers.filter(marker => marker !== markerToRemove));
    }

    return (
        <MapContainer
            center={[-80,117]}
            className={`mapContainer crosshair`}
            zoom={2}
            minZoom={0}
            maxZoom={5}
            bounds={mapBounds}
            zoomSnap={0.5}
            style={{ height: '85vh', width: '100%' }}
            crs={L.CRS.Simple}
        >
            <TileLayer
                url={`${local}/{z}/{x}/{y}.png`}
                noWrap={true}
                tms={false}
                tileSize={256}
            />
            {markers.map((marker, idx) => (
                <Marker
                    position={marker.position}
                    key={idx}
                    icon={customIcon}
                >
                    <Popup>
                        <div className="popupContent">
                            {idx === 0 ? "Starting Point" : `Marker ${idx + 1} - ${marker.distance} miles from last marker`}
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleClickMarker(marker);
                            }}>
                                Delete Marker
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
            {markers.length > 1 && (
                <Polyline
                    positions={markers.map(marker => marker.position)}
                    pathOptions={{ color: '#fabd2f', dashArray: '10, 20' }}
                />
            )}
            <CustomControls position="topleft">
                <ControlButton onClick={toggleHandler} isActive={handler}/>
            </CustomControls>
            {handler && (
                <ClickHandler setMarkers={setMarkers} />
            )}
        </MapContainer>
    );
}
