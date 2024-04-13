import dynamic from 'next/dynamic';
import { auth } from "@/auth"

export default async function Map() {
    const session = await auth()
    if (!session?.user) return null
    const MapComponent = dynamic(() => import("../components/map/Map"), {ssr: false})
    return (
        <MapComponent/>
    );
}
