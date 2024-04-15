"use client"

import {useState, useEffect} from "react"
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
    return calculateDistanceInMiles(distanceInMapUnits).toFixed(2); // Convert to miles and format
}

const ClickHandler = ({ setMarkers, markers, setLastMarkerId, lastMarkerId }) => {
    const map = useMap();

    useMapEvents({
        click: async (e) => {
            if (map.getBounds().contains(e.latlng)) {
                const newMarker = {
                    position: e.latlng,
                    distance: markers.length > 0
                        ? calculateDistance(markers[markers.length - 1].position, e.latlng)
                        : "Start",
                    prev_marker: lastMarkerId
                };

                console.log("New marker created:", newMarker);

                setMarkers([...markers, newMarker]);

                fetch('/api/markers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        position: newMarker.position,
                        prev_marker: newMarker.prev_marker,
                        distance: newMarker.distance
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        setLastMarkerId(data[0].id);
                        const updatedMarker = { ...newMarker, id: data[0].id };
                        setMarkers(prevMarkers => [...prevMarkers.filter(m => !m.temp), updatedMarker]);
                        console.log('Marker added successfully:', data);
                    })
                    .catch(error => {
                        console.error('Error adding marker:', error.message);
                        setMarkers(markers => markers.filter(m => !m.temp));
                    });
            } else {
                console.log("Outside the bounds of the map");
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

function handleRemoveMarker(setMarkers, markerId) {
    // Send a DELETE request to the backend
    fetch(`/api/markers/${markerId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        setMarkers(currentMarkers => currentMarkers.filter(marker => marker.id !== markerId));
        return response.json();  // Assuming the server sends back some JSON response
    })
    .then(data => {
        console.log("Delete successful:", data);
        // Remove the marker from the state
        setMarkers(currentMarkers => currentMarkers.filter(marker => marker.id !== markerId));
    })
    .catch(error => {
        console.error("Failed to delete marker:", error.message);
    });
}

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

    const [lastMarkerId, setLastMarkerId] = useState(null);

    /**
     * State to manage additional interaction handlers on the map.
     * @type {boolean}
     */
    const [handler, setHandler] = useState(false)

    const url= "/images/eberron"; // for local development
    //const url = "/api/tiles";

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

    useEffect(() => {
        async function fetchMarkers() {
            try {
                const response = await fetch('/api/markers');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setMarkers(data || []);
            } catch (error) {
                console.error("Failed to load markers:", error.message);
                // Optionally, implement a retry logic or display a message to the user
            }
        }
        fetchMarkers();
    }, []);

    useEffect(() => {
        async function fetchMarkers() {
            try {
                const response = await fetch('/api/markers');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setMarkers(data || []);
                const lastMarker = data.length > 1 ? data[data.length - 1] : null;
                if (lastMarker) {
                    setLastMarkerId(lastMarker.id);
                }
            } catch (error) {
                console.error("Failed to load markers:", error.message);
            }
        }
        fetchMarkers();
    }, []);

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
                                handleRemoveMarker(setMarkers, marker.id);
                            }}>
                                Delete Marker
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
            {markers && (
                <Polyline
                    positions={markers.map(marker => marker.position)}
                    pathOptions={{ color: '#fabd2f', dashArray: '10, 20' }}
                />
            )}
            <CustomControls position="topleft">
                <ControlButton onClick={toggleHandler} isActive={handler}/>
            </CustomControls>
            {handler && (
                <ClickHandler
                    setMarkers={setMarkers}
                    markers={markers}
                    setLastMarkerId={setLastMarkerId}
                    lastMarkerId={lastMarkerId}
                />
            )}
        </MapContainer>
    );
}
