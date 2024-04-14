"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import the FontAwesomeIcon component
import { faRightFromBracket} from "@fortawesome/free-solid-svg-icons";
import { signOut } from "next-auth/react"

export default function SignOut() {
    return (
        <FontAwesomeIcon
            className="user-control"
            title={"Sign Out"}
            onClick={() => signOut()}
            style={{fontSize:"25px"}}
            icon={faRightFromBracket}
        ></FontAwesomeIcon>
    )
}
