import Link from "next/link";
import Image from "next/image";
import SignIn from "./Login";
import SignOut from "./Logout";
import { auth } from "@/auth"

export default async function Nav() {
    const session = await auth()

    return (
        <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/tools">Tools</Link>
            {session?.user ? (
                <>
                    <Link href="/map">Map</Link>
                    <Image className="user_profile"
                        src={session?.user.image}
                        alt="user profile"
                        width={50} height={50}/>
                    <SignOut/>
                </>
            ) : (
                <SignIn/>
            )}
        </nav>
    )
}
