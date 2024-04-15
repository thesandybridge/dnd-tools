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

const ClickHandler = ({ addMarker, markers, lastMarkerId }) => {
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

                await addMarker(newMarker)

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

const updateMarkerDistance = async (markerId, newDistance) => {
    try {
        const response = await fetch(`/api/markers/${markerId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ distance: newDistance })
        });
        if (!response.ok) throw new Error('Failed to update marker distance');
        console.log("Distance update successful");
    } catch (error) {
        console.error("Failed to update marker distance:", error.message);
    }
};

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

    //const url= "/images/eberron"; // for local development
    const url = "/api/tiles";

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

    const handleRemoveMarker = async (markerId) => {
        const markerToRemove = markers.find(marker => marker.id === markerId);
        const affectedMarker = markers.find(marker => marker.prev_marker === markerId);

        let newMarkers = markers.filter(marker => marker.id !== markerId);

        if (affectedMarker && markerToRemove) {
            const newPrevMarker = markers.find(marker => marker.id === markerToRemove.prev_marker);
            const updatedDistance = newPrevMarker ? calculateDistance(newPrevMarker.position, affectedMarker.position) : "Start";

            newMarkers = newMarkers.map(marker => {
                if (marker.id === affectedMarker.id) {
                    return { ...marker, prev_marker: markerToRemove.prev_marker, distance: updatedDistance };
                }
                return marker;
            });

            updateMarkerDistance(affectedMarker.id, updatedDistance);
        }

        setMarkers(newMarkers);

        try {
            const response = await fetch(`/api/markers/${markerId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            console.log("Delete successful");
        } catch (error) {
            console.error("Failed to delete marker:", error.message);
            setMarkers(markers);
        }
    };

    const addMarker = async (newMarkerData) => {
        const optimisticNewMarker = { ...newMarkerData, id: Date.now() };
        setMarkers([...markers, optimisticNewMarker]);

        try {
            const response = await fetch('/api/markers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMarkerData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error('Network response was not ok');
            setLastMarkerId(data[0].id)
            setMarkers(prevMarkers => prevMarkers.map(marker =>
                marker.id === optimisticNewMarker.id ? { ...marker, id: data[0].id } : marker
            ));
            console.log("New marker successfully added")
        } catch (error) {
            console.error('Error adding marker:', error.message);
            setMarkers(markers.filter(marker => marker.id !== optimisticNewMarker.id));  // Revert if failed
        }
    };

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
                                handleRemoveMarker(marker.id);
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
                    addMarker={addMarker}
                    markers={markers}
                    lastMarkerId={lastMarkerId}
                />
            )}
        </MapContainer>
    );
}
