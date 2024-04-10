"use client"

import Link from "next/link";

export default function Nav() {
    return (
        <nav className="main-nav">
            <Link href="/">Home</Link>
            <Link href="/tools">Tools</Link>
        </nav>
    )
}
