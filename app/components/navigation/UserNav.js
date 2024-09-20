'use client'

import Link from "next/link";
import Image from "next/image";
import SignOut from "./Logout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import the FontAwesomeIcon component
import { faMap } from "@fortawesome/free-solid-svg-icons";
import { usePathname } from "next/navigation"

export default function UserNav({user}) {
  const path = usePathname()
  return (
    <>
      <Link href="/map">
        <FontAwesomeIcon
          className={`user-control ${path === '/map' ? 'active' : ''}`}
          title={"Map"}
          style={{ fontSize: "25px" }}
          icon={faMap}
        ></FontAwesomeIcon>
      </Link>
      <Link href={`/user/${user.id}`}>
        <Image className="user_profile"
          src={user.image}
          alt="user profile"
          width={50} height={50} />
      </Link>
      <SignOut />
    </>
  )
}
