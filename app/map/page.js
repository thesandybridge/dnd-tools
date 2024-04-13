import dynamic from 'next/dynamic';

export default function Map() {
    const MapComponent = dynamic(() => import("../components/map/Map"), {ssr: false})
    return (
        <MapComponent/>
    );
}
