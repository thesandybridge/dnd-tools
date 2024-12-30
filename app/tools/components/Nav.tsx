import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faBackward } from "@fortawesome/free-solid-svg-icons"
export default function Nav () {
  return (
    <Link className="back" style={{alignSelf: 'flex-start'}} href="/tools">
      <FontAwesomeIcon
        icon={faBackward}
      /> Back
    </Link>
  )
}
