'use client'

import Link from "next/link"
import Image from "next/image"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMap, faDragon } from "@fortawesome/free-solid-svg-icons"
import { usePathname } from "next/navigation"
import SignOut from "./Logout"

export default function UserNav({user}) {
  const path = usePathname()
  return (
    <>
      <Link href="/guilds">
        <FontAwesomeIcon
          className={`user-control ${path === '/guilds' ? 'active' : ''}`}
          title={"Guild"}
          style={{ fontSize: "25px" }}
          icon={faDragon}
        />
      </Link>
      <Link href="/map">
        <FontAwesomeIcon
          className={`user-control ${path === '/map' ? 'active' : ''}`}
          title={"Map"}
          style={{ fontSize: "25px" }}
          icon={faMap}
        />
      </Link>
      <Link href={`/users/${user.id}`}>
        <Image className="user_profile"
          src={user.image}
          alt="user profile"
          width={50} height={50} />
      </Link>
      <SignOut />
    </>
  )
}
