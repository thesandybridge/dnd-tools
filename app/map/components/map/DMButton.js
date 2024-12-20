import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faHatWizard } from "@fortawesome/free-solid-svg-icons"

const DMButton = ({ onClick, isActive }) => {

  const handleClick = (e) => {
    e.stopPropagation()
    onClick()
  }
  return (
    <div className={`map-btn ${isActive ? 'active-markers' : ''}`}>
      <FontAwesomeIcon
        title={"DM Map"}
        onClick={handleClick}
        style={{ fontSize: "25px" }}
        icon={faHatWizard}
      ></FontAwesomeIcon>
    </div>
  )
}

export default DMButton
