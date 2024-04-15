import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMap, faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

/**
 * @typedef {Object} ControlButtonProps
 * @property {Function} onClick - Callback function that is called when the button is clicked.
 * @property {boolean} isActive - Flag to indicate if the button is active, which changes the icon displayed.
 */

/**
 * ControlButton renders a button with a dynamic FontAwesome icon based on its active state.
 * This button can be used to toggle map-related functionalities such as setting pins.
 * The icon changes based on whether the button is active or not.
 *
 * @param {ControlButtonProps} props - The props for the component.
 * @returns {JSX.Element} The FontAwesomeIcon wrapped in a div as a button.
 */
const ControlButton = ({onClick, isActive}) => {
    /**
     * Handles click events for the control button. Prevents event propagation to higher components
     * and triggers the onClick callback provided in the props.
     *
     * @param {React.MouseEvent<HTMLDivElement>} e - The React mouse event object.
     */
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

export default ControlButton
