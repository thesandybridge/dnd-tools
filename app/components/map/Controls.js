import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { createPortal } from 'react-dom';
import L from 'leaflet';

const CustomControls = ({ position = 'topleft', children }) => {
    const map = useMap();
    const [controlElement, setControlElement] = useState(null);

    useEffect(() => {
        // Create a div to serve as the control container
        const controlDiv = L.DomUtil.create('div', 'leaflet-control');

        // Define a new Leaflet control with the specified position
        const control = new L.Control({ position });
        control.onAdd = function() {
            return controlDiv;
        };

        // Add the control to the map
        control.addTo(map);

        // Set the control element state to the created div
        setControlElement(controlDiv);

        return () => {
            control.remove();
            // Clean up the div element
            controlDiv.remove();
        };
    }, [map, position]); // Re-run this effect if map or position changes

    // Render the children inside the control element via a React portal
    // Only render the portal when controlElement is not null
    return controlElement ? createPortal(children, controlElement) : null;
};

export default CustomControls;

