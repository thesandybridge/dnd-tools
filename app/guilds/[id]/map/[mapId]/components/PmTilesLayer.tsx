"use client"

import { useEffect, useRef } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import { PMTiles } from "pmtiles"

interface PmTilesLayerProps {
  pmtilesUrl: string
  tileSize?: number
  maxZoom?: number
}

export default function PmTilesLayer({ pmtilesUrl, tileSize = 256, maxZoom = 5 }: PmTilesLayerProps) {
  const map = useMap()
  const layerRef = useRef<L.GridLayer | null>(null)
  const pmRef = useRef<PMTiles | null>(null)

  useEffect(() => {
    const blobUrls: string[] = []
    const pm = new PMTiles(pmtilesUrl)
    pmRef.current = pm

    function addLayer() {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
      }

      const PmLayer = L.GridLayer.extend({
        createTile(coords: L.Coords, done: (err: Error | null, tile: HTMLElement) => void) {
          const tile = L.DomUtil.create("img", "leaflet-tile") as HTMLImageElement
          tile.width = tileSize
          tile.height = tileSize

          pm.getZxy(coords.z, coords.x, coords.y)
            .then((result) => {
              if (result?.data) {
                const blob = new Blob([result.data], { type: "image/png" })
                const url = URL.createObjectURL(blob)
                blobUrls.push(url)
                tile.src = url
              }
              done(null, tile)
            })
            .catch(() => {
              done(null, tile)
            })

          return tile
        },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer = new (PmLayer as any)({
        tileSize,
        noWrap: true,
        maxNativeZoom: maxZoom,
        minNativeZoom: 0,
        bounds: [[-tileSize, 0], [0, tileSize]],
      })

      layer.addTo(map)
      layerRef.current = layer
    }

    map.whenReady(addLayer)

    return () => {
      if (layerRef.current) {
        try { map.removeLayer(layerRef.current) } catch { /* map may already be torn down */ }
        layerRef.current = null
      }
      for (const url of blobUrls) {
        URL.revokeObjectURL(url)
      }
      pmRef.current = null
    }
  }, [map, pmtilesUrl, tileSize, maxZoom])

  return null
}
