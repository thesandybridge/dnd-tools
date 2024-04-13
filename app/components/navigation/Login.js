"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import the FontAwesomeIcon component
import { faRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { signIn } from "next-auth/react"

export default function SignIn() {
    return (
        <FontAwesomeIcon className={"user-control"} title={"Sign In"} onClick={() => signIn("discord")} style={{fontSize:"25px"}} icon={faRightToBracket}></FontAwesomeIcon>
    )
}
