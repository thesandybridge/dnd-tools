"use client"

import {useState} from "react"
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from "leaflet";
import CustomControls from "./Controls";
import ControlButton from "./ControlButton";

const MILES_PER_MAP_UNIT = 15.644;

/**
 * @typedef {Object} Coordinates
 * @property {number} lat - Latitude value
 * @property {number} lng - Longitude value
 */

/**
 * Convert map units to total distance in miles
 *
 * @param {number} mapUnits - Map units
 * @returns {number} Map units converted to miles
 */
function calculateDistanceInMiles(mapUnits) {
    return mapUnits * MILES_PER_MAP_UNIT;
}

/**
 * Calculates the distance between two points on the map
 *
 * @param {Coordinates} pointA
 * @param {Coordinates} pointB
 * @returns {number} The distance between pointA and pointB in miles
 */
function calculateDistance(pointA, pointB) {
    const dx = pointB.lng - pointA.lng; // difference in longitude units
    const dy = pointB.lat - pointA.lat; // difference in latitude units
    const distanceInMapUnits = Math.sqrt(dx * dx + dy * dy); // Euclidean distance in map units
    console.log(pointA, pointB)
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

/**
 * Represents a map component using Leaflet. This component manages markers on a map,
 * allowing users to add, view, and delete markers. The map's geographical bounds are
 * predefined, and the component supports toggling additional map interactions.
 *
 * @returns {JSX.Element} The map component rendered with Leaflet.
 */
export default function MapComponent() {
    /**
     * State for managing markers on the map.
     * @type {Array.<L.Marker>}
     */
    const [markers, setMarkers] = useState([])

    /**
     * State to manage additional interaction handlers on the map.
     * @type {boolean}
     */
    const [handler, setHandler] = useState(false)

    const url = "https://dndeberron.s3.amazonaws.com/eberron";
    //const local = "/images/eberron"; // for local development

    /**
    * Represents the geographical bounds of the map area.
    * @type {L.LatLngBounds}
    *
    * The bounds are defined by two corner points:
    * - The southwest corner at latitude 0, longitude 0.
    * - The northeast corner at latitude 9674, longitude 15360.
    */
    const mapBounds = new L.LatLngBounds([0, 0], [9674, 15360]);

    /**
     * Toggles the handler state.
     */
    const toggleHandler = () => {
        setHandler(!handler)
    }

    /**
     * Handles the removal of a marker from the state.
     * @param {L.Marker} markerToRemove - The marker to remove.
     */
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
                url={`${url}/{z}/{x}/{y}.png`}
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
