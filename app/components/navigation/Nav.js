import Link from "next/link";
import Image from "next/image";
import SignIn from "./Login";
import SignOut from "./Logout";
import { auth } from "@/auth"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // Import the FontAwesomeIcon component
import { faScrewdriverWrench, faMap, faHome } from "@fortawesome/free-solid-svg-icons";

export default async function Nav() {
  const session = await auth()

  return (
    <nav className="main-nav">
      <Link href="/">
        <FontAwesomeIcon
          className="user-control"
          title={"Home"}
          style={{ fontSize: "25px" }}
          icon={faHome}
        ></FontAwesomeIcon>
      </Link>
      <Link href="/tools">
        <FontAwesomeIcon
          className="user-control"
          title={"Tools/Calculators"}
          style={{ fontSize: "25px" }}
          icon={faScrewdriverWrench}
        ></FontAwesomeIcon>
      </Link>
      {session?.user ? (
        <>
          <Link href="/map">
            <FontAwesomeIcon
              className="user-control"
              title={"Map"}
              style={{ fontSize: "25px" }}
              icon={faMap}
            ></FontAwesomeIcon>
          </Link>
          <Image className="user_profile"
            src={session?.user.image}
            alt="user profile"
            width={50} height={50} />
          <SignOut />
        </>
      ) : (
        <SignIn />
      )}
    </nav>
  )
}
