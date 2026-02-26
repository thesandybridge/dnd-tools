export interface TileForgeTileset {
  id: string
  name: string
  slug: string
  width: number | null
  height: number | null
  min_zoom: number
  max_zoom: number
  tile_size: number
  public: boolean
  storage_path: string
  created_at: string
}

export async function validateTileForgeKey(apiKey: string): Promise<{ valid: boolean; plan?: string }> {
  const res = await fetch("/api/tileforge/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Validation failed" }))
    throw new Error(err.error)
  }
  return res.json()
}

export async function fetchTileForgeTilesets(search?: string, page?: number): Promise<TileForgeTileset[]> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (page) params.set("page", page.toString())
  const res = await fetch(`/api/tileforge/tilesets?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to fetch tilesets" }))
    throw new Error(err.error)
  }
  return res.json()
}

const TILEFORGE_API = "https://api.tileforge.sandybridge.io"

export function getTileForgepmtilesUrl(slug: string): string {
  return `${TILEFORGE_API}/api/tilesets/${slug}/pmtiles-url`
}

export function getTileForgeThumbnailUrl(storagePath: string): string {
  const jobId = storagePath.replace("tiles/", "")
  return `${TILEFORGE_API}/api/tiles/${jobId}/thumbnail`
}

export const TILEFORGE_URLS = {
  home: "https://tileforge.sandybridge.io",
  signup: "https://tileforge.sandybridge.io/signin",
} as const

export const TILEFORGE_COPY = {
  tagline: "Upload any image. Get a zoomable map.",
  pitch: "Turn any image into a zoomable PMTiles tileset. Free tier lets you generate tiles and self-host. Paid plans include hosted tile serving.",
  ctaSignup: "Sign up on TileForge",
  ctaLearnMore: "Learn more",
  ctaGetStarted: "Get Started on TileForge",
  poweredBy: "Powered by TileForge",
  formPromo: "Don\u2019t have tilesets yet? Create zoomable map tiles from any image with TileForge \u2014 free tier available.",
} as const
