"use client"

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import("./components/map/Map"), { ssr: false })

export default function MapLoader({ user_id }: { user_id: string }) {
  return <MapComponent user_id={user_id} />
}
