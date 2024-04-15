import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { createPortal } from 'react-dom';
import L from 'leaflet';

/**
 * @typedef {Object} CustomControlsProps
 * @property {string} [position='topleft'] - The position of the control on the map.
 *   Standard Leaflet control positions include 'topleft', 'topright', 'bottomleft', 'bottomright'.
 * @property {React.ReactNode} children - The React children to be rendered inside the Leaflet control.
 */

/**
 * CustomControls creates a custom control element on a Leaflet map.
 * This component utilizes React portals to render React children into a Leaflet control.
 *
 * @param {CustomControlsProps} props - The props for the component.
 * @returns {React.ReactPortal|null} A portal that renders the children into the Leaflet map control,
 *   or null if the control element is not yet initialized.
 */
const CustomControls = ({ position = 'topleft', children }) => {
    const map = useMap();
    const [controlElement, setControlElement] = useState(null);

    useEffect(() => {
        const controlDiv = L.DomUtil.create('div', 'leaflet-control');

        const control = new L.Control({ position });
        control.onAdd = function() {
            return controlDiv;
        };

        control.addTo(map);

        setControlElement(controlDiv);

        return () => {
            control.remove();
            controlDiv.remove();
        };
    }, [map, position]);

    return controlElement ? createPortal(children, controlElement) : null;
};

export default CustomControls;

