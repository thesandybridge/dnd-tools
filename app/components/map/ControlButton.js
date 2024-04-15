import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import the FontAwesomeIcon component
import { faMap, faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

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

export default ControlButton
