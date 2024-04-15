"use client"

import {useState, useEffect} from "react"
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
import L from "leaflet";
import CustomControls from "./Controls";
import MarkerButton from "./MarkerButton";

import { calculateDistance } from "./utils";
import RulerButton from "./RulerButton";

const RulerHandler = ({ addRulerPoint, rulerPoints }) => {
    const map = useMap();

    useMapEvents({
        click: async (e) => {
            if (map.getBounds().contains(e.latlng)) {
                addRulerPoint(e.latlng)
            }
        }
    })

    return null;
}

const MarkerHandler = ({ addMarker, markers, lastMarkerId }) => {
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

    const [markerHandler, setMarkerHandler] = useState(false)
    const [rulerHandler, setRulerHandler] = useState(false)
    const [rulerPoints, setRulerPoints] = useState([])

    //const url= "/images/eberron"; // for local development
    const url = "/api/tiles";

    const mapBounds = [
        [19.25, 200],
        [-172.25, -123.5],
    ];


    const toggleMarkers = () => {
        setMarkerHandler(!markerHandler)
    }

    const toggleRuler = () => {
        if (rulerHandler) {
            setRulerPoints([])
        }
        setRulerHandler(!rulerHandler)
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

    const addRulerPoint = (latlng) => {
        setRulerPoints(prevPoints => {
            if (prevPoints.length === 2) {
                return [latlng]
            } else {
                return [...prevPoints, latlng]
            }
        })
    }

    return (
        <MapContainer
            center={[-80,117]}
            className={`mapContainer crosshair`}
            zoom={2}
            minZoom={2}
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
                bounds={mapBounds}
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
                    pathOptions={{ color: 'blue', weight: 2 }}
                >
                    <Tooltip permanent>{`Distance: ${calculateDistance(rulerPoints[0], rulerPoints[1])} miles`}</Tooltip>
                </Polyline>
            )}
            <CustomControls position="topleft" className="custom-controls">
                <MarkerButton onClick={toggleMarkers} isActive={markerHandler}/>
                <RulerButton onClick={toggleRuler} isActive={rulerHandler} />
            </CustomControls>
            {markerHandler && (
                <MarkerHandler
                    addMarker={addMarker}
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
    );
}
