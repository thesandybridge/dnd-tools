"use client"

import dynamic from 'next/dynamic'
import MapSidePanel from './components/MapSidePanel'

const MapComponent = dynamic(() => import("./components/map/Map"), { ssr: false })

export default function MapLoader() {
  return (
    <div className="flex relative h-[85dvh]">
      <MapSidePanel />
      <div className="flex-1">
        <MapComponent />
      </div>
    </div>
  )
}
