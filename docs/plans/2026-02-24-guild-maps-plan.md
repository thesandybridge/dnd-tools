# Per-Guild Maps with Tileforge Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move maps from user-scoped to guild-scoped with PMTiles integration via Tileforge, multiple maps per guild, and collaborative markers.

**Architecture:** New `GuildMap` model links guilds to Tileforge tilesets. Server proxies presigned PMTiles URLs so API keys stay server-side. Client uses `pmtiles` JS library with a custom Leaflet `GridLayer` to stream tiles. Existing map components are relocated from `/app/map/` into `/app/guilds/[id]/map/[mapId]/`. Old standalone map route and user-scoped marker routes are removed.

**Tech Stack:** Next.js 16, Prisma, react-leaflet, pmtiles, Tileforge API

---

### Task 1: Add GuildMap model to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add GuildMap model and update relations**

Add the `GuildMap` model after `GuildMember`, update `Guild` to include a `maps` relation, and update `Marker` to include a `guildMapId` field:

```prisma
model Guild {
  id      Int    @id @default(autoincrement())
  guildId String @unique @default(uuid()) @map("guild_id")
  name    String
  ownerId String @map("owner")

  ownerUser User          @relation("GuildOwner", fields: [ownerId], references: [id])
  members   GuildMember[]
  maps      GuildMap[]

  @@map("guilds")
}

model GuildMap {
  id            Int      @id @default(autoincrement())
  mapId         String   @unique @default(uuid()) @map("map_id")
  guildId       String   @map("guild_id")
  name          String
  tileforgeSlug String   @map("tileforge_slug")
  tileforgeKey  String   @map("tileforge_key")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  guild   Guild    @relation(fields: [guildId], references: [guildId], onDelete: Cascade)
  markers Marker[]

  @@index([guildId])
  @@map("guild_maps")
}

model Marker {
  id         Int      @id @default(autoincrement())
  uuid       String   @unique @default(uuid())
  userId     String   @map("user_id")
  guildMapId String   @map("guild_map_id")
  position   Json
  distance   Float?   @default(0)
  prevMarker String?  @map("prev_marker")
  createdAt  DateTime @default(now()) @map("created_at")
  text       String?

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  guildMap GuildMap  @relation(fields: [guildMapId], references: [mapId], onDelete: Cascade)

  @@index([guildMapId])
  @@map("markers")
}
```

Note: The `User` model's `markers` relation stays as-is (Prisma infers it from the Marker model's `user` relation).

**Step 2: Run migration**

```bash
npx prisma migrate dev --name add-guild-maps
```

If there are existing markers in the database without a `guildMapId`, the migration will fail. In that case, use `npx prisma migrate dev --create-only --name add-guild-maps`, then edit the migration SQL to DROP existing markers before adding the NOT NULL constraint:

```sql
DELETE FROM "markers";
```

Then run `npx prisma migrate dev`.

**Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

**Step 4: Verify build**

```bash
npm run build
```

This will likely fail due to existing marker code referencing the old schema. That's expected — we fix it in subsequent tasks.

**Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add GuildMap model, link markers to guild maps"
```

---

### Task 2: Add lib functions for guild maps and update marker lib

**Files:**
- Create: `lib/guild-maps.ts`
- Modify: `lib/markers.ts`
- Modify: `lib/serializers.ts`

**Step 1: Create `lib/guild-maps.ts`**

```typescript
import { UUID } from "@/utils/types"

export interface GuildMap {
  id: number
  map_id: UUID
  guild_id: UUID
  name: string
  tileforge_slug: string
  created_at?: string
  updated_at?: string
}

export async function fetchGuildMaps(guildId: UUID): Promise<GuildMap[]> {
  const response = await fetch(`/api/guilds/${guildId}/maps`)
  if (!response.ok) throw new Error(`Failed to fetch guild maps`)
  return response.json()
}

export async function fetchGuildMap(guildId: UUID, mapId: UUID): Promise<GuildMap> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}`)
  if (!response.ok) throw new Error(`Failed to fetch guild map`)
  return response.json()
}

export async function createGuildMap(guildId: UUID, data: { name: string; tileforgeSlug: string; tileforgeKey: string }): Promise<GuildMap> {
  const response = await fetch(`/api/guilds/${guildId}/maps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create guild map')
  return response.json()
}

export async function updateGuildMap(guildId: UUID, mapId: UUID, data: { name?: string; tileforgeSlug?: string; tileforgeKey?: string }): Promise<GuildMap> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update guild map')
  return response.json()
}

export async function deleteGuildMap(guildId: UUID, mapId: UUID): Promise<void> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete guild map')
}

export async function fetchPmtilesUrl(guildId: UUID, mapId: UUID): Promise<string> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/pmtiles-url`)
  if (!response.ok) throw new Error('Failed to fetch PMTiles URL')
  const data = await response.json()
  return data.url
}
```

**Step 2: Update `lib/markers.ts`**

All marker functions now take `guildId` and `mapId` parameters for the new API routes:

```typescript
import { UUID } from "@/utils/types"

export interface Position {
  lat: string
  lng: string
}

export interface Marker {
  id: number
  uuid: UUID
  created_at?: string
  user_id?: UUID
  prev_marker?: number | null
  position?: Position
  distance?: string | number
  text?: string
}

export async function fetchMarkers(guildId: UUID, mapId: UUID): Promise<Marker[]> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers`)
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return response.json()
}

export async function addMarker(guildId: UUID, mapId: UUID, marker: Marker): Promise<Marker> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marker),
  })
  if (!response.ok) throw new Error('Failed to add marker')
  return response.json()
}

export async function removeMarker(guildId: UUID, mapId: UUID, markerId: UUID): Promise<Marker> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers/${markerId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to remove marker')
  return response.json()
}

export async function updateMarkerDistance(guildId: UUID, mapId: UUID, markerId: UUID, newDistance: number): Promise<Marker> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers/${markerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ distance: newDistance }),
  })
  if (!response.ok) throw new Error('Failed to update marker distance')
  return response.json()
}

export async function updateMarkerText(guildId: UUID, mapId: UUID, markerUuid: UUID, text: string): Promise<void> {
  const response = await fetch(`/api/guilds/${guildId}/maps/${mapId}/markers/${markerUuid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!response.ok) throw new Error('Failed to update marker text')
}
```

**Step 3: Add serializer for GuildMap in `lib/serializers.ts`**

Add this function to the existing serializers file:

```typescript
import type { Guild, GuildMember, GuildMap, Marker, User } from "@/lib/generated/prisma/client"

// ... existing serializers stay unchanged ...

/** GuildMap → snake_case fields (excludes tileforgeKey) */
export function serializeGuildMap(m: GuildMap) {
  return {
    id: m.id,
    map_id: m.mapId,
    guild_id: m.guildId,
    name: m.name,
    tileforge_slug: m.tileforgeSlug,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  }
}
```

Note: `tileforgeKey` is intentionally excluded from serialization — it must never be sent to the client.

**Step 4: Commit**

```bash
git add lib/guild-maps.ts lib/markers.ts lib/serializers.ts
git commit -m "feat: add guild map lib functions, update marker routes to guild-scoped"
```

---

### Task 3: Create guild map API routes

**Files:**
- Create: `app/api/guilds/[guild_id]/maps/route.ts`
- Create: `app/api/guilds/[guild_id]/maps/[map_id]/route.ts`
- Create: `app/api/guilds/[guild_id]/maps/[map_id]/pmtiles-url/route.ts`

**Step 1: Create `app/api/guilds/[guild_id]/maps/route.ts`** (list + create)

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuildMap } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params

    // Verify user is a member of this guild
    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const maps = await prisma.guildMap.findMany({
      where: { guildId: guild_id },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(maps.map(serializeGuildMap))
  } catch (error) {
    console.error("Failed to fetch guild maps:", (error as Error).message)
    return Response.json({ error: "Failed to fetch guild maps" }, { status: 500 })
  }
})

export const POST = auth(async function POST(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id } = await params

    // Verify user is owner of this guild
    const guild = await prisma.guild.findUnique({ where: { guildId: guild_id } })
    if (!guild || guild.ownerId !== session.user.id) {
      return Response.json({ error: "Only guild owner can create maps" }, { status: 403 })
    }

    const { name, tileforgeSlug, tileforgeKey } = await request.json()

    if (!name || !tileforgeSlug || !tileforgeKey) {
      return Response.json({ error: "name, tileforgeSlug, and tileforgeKey are required" }, { status: 400 })
    }

    const map = await prisma.guildMap.create({
      data: {
        guildId: guild_id,
        name,
        tileforgeSlug,
        tileforgeKey,
      },
    })

    return Response.json(serializeGuildMap(map), { status: 201 })
  } catch (error) {
    console.error("Failed to create guild map:", (error as Error).message)
    return Response.json({ error: "Failed to create guild map" }, { status: 500 })
  }
})
```

**Step 2: Create `app/api/guilds/[guild_id]/maps/[map_id]/route.ts`** (get + update + delete)

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeGuildMap } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const map = await prisma.guildMap.findFirst({
      where: { mapId: map_id, guildId: guild_id },
    })
    if (!map) {
      return Response.json({ error: "Map not found" }, { status: 404 })
    }

    return Response.json(serializeGuildMap(map))
  } catch (error) {
    console.error("Failed to fetch guild map:", (error as Error).message)
    return Response.json({ error: "Failed to fetch guild map" }, { status: 500 })
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const guild = await prisma.guild.findUnique({ where: { guildId: guild_id } })
    if (!guild || guild.ownerId !== session.user.id) {
      return Response.json({ error: "Only guild owner can update maps" }, { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.tileforgeSlug !== undefined) data.tileforgeSlug = body.tileforgeSlug
    if (body.tileforgeKey !== undefined) data.tileforgeKey = body.tileforgeKey

    const map = await prisma.guildMap.update({
      where: { mapId: map_id },
      data,
    })

    return Response.json(serializeGuildMap(map))
  } catch (error) {
    console.error("Failed to update guild map:", (error as Error).message)
    return Response.json({ error: "Failed to update guild map" }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const guild = await prisma.guild.findUnique({ where: { guildId: guild_id } })
    if (!guild || guild.ownerId !== session.user.id) {
      return Response.json({ error: "Only guild owner can delete maps" }, { status: 403 })
    }

    await prisma.guildMap.delete({ where: { mapId: map_id } })

    return Response.json({ message: "Map deleted" })
  } catch (error) {
    console.error("Failed to delete guild map:", (error as Error).message)
    return Response.json({ error: "Failed to delete guild map" }, { status: 500 })
  }
})
```

**Step 3: Create `app/api/guilds/[guild_id]/maps/[map_id]/pmtiles-url/route.ts`**

This proxies the presigned URL request to Tileforge so the API key never reaches the client:

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const TILEFORGE_API_URL = process.env.TILEFORGE_API_URL

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    // Verify membership
    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    // Get map with API key (server-side only)
    const map = await prisma.guildMap.findFirst({
      where: { mapId: map_id, guildId: guild_id },
    })
    if (!map) {
      return Response.json({ error: "Map not found" }, { status: 404 })
    }

    if (!TILEFORGE_API_URL) {
      return Response.json({ error: "Tileforge not configured" }, { status: 500 })
    }

    // Fetch presigned URL from Tileforge
    const tileforgeRes = await fetch(
      `${TILEFORGE_API_URL}/api/tilesets/${encodeURIComponent(map.tileforgeSlug)}/pmtiles-url`,
      {
        headers: { Authorization: `Bearer ${map.tileforgeKey}` },
      }
    )

    if (!tileforgeRes.ok) {
      const text = await tileforgeRes.text()
      console.error("Tileforge error:", tileforgeRes.status, text)
      return Response.json({ error: "Failed to get tiles URL from Tileforge" }, { status: 502 })
    }

    const { url } = await tileforgeRes.json()
    return Response.json({ url })
  } catch (error) {
    console.error("Failed to fetch PMTiles URL:", (error as Error).message)
    return Response.json({ error: "Failed to fetch PMTiles URL" }, { status: 500 })
  }
})
```

**Step 4: Commit**

```bash
git add app/api/guilds/\[guild_id\]/maps/
git commit -m "feat: add guild map CRUD and PMTiles URL proxy API routes"
```

---

### Task 4: Create guild-scoped marker API routes

**Files:**
- Create: `app/api/guilds/[guild_id]/maps/[map_id]/markers/route.ts`
- Create: `app/api/guilds/[guild_id]/maps/[map_id]/markers/[uuid]/route.ts`

**Step 1: Create `app/api/guilds/[guild_id]/maps/[map_id]/markers/route.ts`**

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeMarker } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const markers = await prisma.marker.findMany({
      where: { guildMapId: map_id },
      orderBy: { createdAt: "asc" },
    })

    return Response.json(markers.map(serializeMarker))
  } catch (error) {
    console.error("Failed to fetch markers:", (error as Error).message)
    return Response.json({ error: "Failed to fetch markers" }, { status: 500 })
  }
})

export const POST = auth(async function POST(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, map_id } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const { position, prev_marker, distance, uuid } = await request.json()

    const marker = await prisma.marker.create({
      data: {
        uuid,
        userId: session.user.id!,
        guildMapId: map_id,
        position: position as object,
        distance: distance != null ? Number(distance) : 0,
        prevMarker: prev_marker != null ? String(prev_marker) : null,
      },
    })

    return Response.json(serializeMarker(marker), { status: 201 })
  } catch (error) {
    console.error("Failed to create marker:", (error as Error).message)
    return Response.json({ error: "Failed to create marker" }, { status: 500 })
  }
})
```

**Step 2: Create `app/api/guilds/[guild_id]/maps/[map_id]/markers/[uuid]/route.ts`**

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, uuid } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}
    if (body.distance !== undefined) data.distance = body.distance
    if (body.text !== undefined) data.text = body.text

    await prisma.marker.update({
      where: { uuid: uuid as string },
      data,
    })

    return Response.json(null)
  } catch (error) {
    console.error("Failed to update marker:", (error as Error).message)
    return Response.json({ error: "Failed to update marker" }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { guild_id, uuid } = await params

    const member = await prisma.guildMember.findUnique({
      where: { guildId_userId: { guildId: guild_id, userId: session.user.id! } },
    })
    if (!member) {
      return Response.json({ error: "Not a member of this guild" }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      const marker = await tx.marker.findUniqueOrThrow({
        where: { uuid: uuid as string },
        select: { prevMarker: true },
      })

      await tx.marker.updateMany({
        where: { prevMarker: uuid as string },
        data: { prevMarker: marker.prevMarker },
      })

      await tx.marker.delete({ where: { uuid: uuid as string } })
    })

    return Response.json({ message: "Marker deleted" })
  } catch (error) {
    console.error("Failed to delete marker:", (error as Error).message)
    return Response.json({ error: "Failed to delete marker" }, { status: 500 })
  }
})
```

**Step 3: Commit**

```bash
git add app/api/guilds/\[guild_id\]/maps/\[map_id\]/markers/
git commit -m "feat: add guild-scoped marker API routes"
```

---

### Task 5: Install pmtiles, create PMTiles tile layer component

**Files:**
- Create: `app/guilds/[id]/map/[mapId]/components/PmTilesLayer.tsx`

**Step 1: Install pmtiles**

```bash
npm install pmtiles
```

**Step 2: Create `app/guilds/[id]/map/[mapId]/components/PmTilesLayer.tsx`**

This is a Leaflet component that uses the `pmtiles` library to render tiles. Based on Tileforge's own `pmtiles-preview.tsx` pattern:

```typescript
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
```

**Step 3: Commit**

```bash
git add package.json package-lock.json app/guilds/\[id\]/map/
git commit -m "feat: install pmtiles, create PmTilesLayer component"
```

---

### Task 6: Create guild map hooks

**Files:**
- Create: `app/guilds/[id]/map/[mapId]/hooks/useGetMarkers.ts`
- Create: `app/guilds/[id]/map/[mapId]/hooks/useAddMarkerMutation.ts`
- Create: `app/guilds/[id]/map/[mapId]/hooks/useRemoveMarkerMutation.ts`
- Create: `app/guilds/[id]/map/[mapId]/hooks/useRenameMarkerMutation.ts`
- Create: `app/guilds/[id]/map/[mapId]/hooks/usePmtilesUrl.ts`

**Step 1: Create `usePmtilesUrl.ts`**

Fetches and auto-refreshes the presigned PMTiles URL:

```typescript
import { useQuery } from "@tanstack/react-query"
import { fetchPmtilesUrl } from "@/lib/guild-maps"

export default function usePmtilesUrl(guildId: string, mapId: string) {
  return useQuery({
    queryKey: ["pmtiles-url", guildId, mapId],
    queryFn: () => fetchPmtilesUrl(guildId, mapId),
    refetchInterval: 8 * 60 * 1000, // Refresh every 8 minutes (URLs expire in 10)
    staleTime: 7 * 60 * 1000,
  })
}
```

**Step 2: Create `useGetMarkers.ts`**

```typescript
import { Marker, fetchMarkers } from "@/lib/markers"
import { UseQueryResult, useQuery } from "@tanstack/react-query"

export default function useGetMarkers(guildId: string, mapId: string): UseQueryResult<Marker[]> {
  return useQuery({
    queryKey: ["markers", guildId, mapId],
    queryFn: () => fetchMarkers(guildId, mapId),
  })
}
```

**Step 3: Create `useAddMarkerMutation.ts`**

```typescript
import { Marker, addMarker } from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useAddMarkerMutation(guildId: string, mapId: string) {
  const queryClient = useQueryClient()
  const key = ["markers", guildId, mapId]

  return useMutation({
    mutationFn: (marker: unknown) => addMarker(guildId, mapId, marker as Marker),
    onMutate: async (newMarker) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Marker[]>(key) || []
      queryClient.setQueryData(key, [...previous, newMarker])
      return { previous }
    },
    onSuccess: (saved, variables) => {
      queryClient.setQueryData(key, (old: Marker[] = []) =>
        old.map(m => m.uuid === (variables as Marker).uuid ? { ...m, uuid: saved.uuid } : m)
      )
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(key, context?.previous)
    },
  })
}
```

**Step 4: Create `useRemoveMarkerMutation.ts`**

```typescript
import { Marker, removeMarker } from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useRemoveMarkerMutation(guildId: string, mapId: string) {
  const queryClient = useQueryClient()
  const key = ["markers", guildId, mapId]

  return useMutation({
    mutationFn: (markerId: string) => removeMarker(guildId, mapId, markerId),
    onMutate: async (markerId) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Marker[]>(key)
      if (previous) {
        queryClient.setQueryData(key, previous.filter(m => m.uuid !== markerId))
      }
      return { previous }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(key, context?.previous)
    },
  })
}
```

**Step 5: Create `useRenameMarkerMutation.ts`**

```typescript
import { Marker, updateMarkerText } from "@/lib/markers"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function useRenameMarkerMutation(guildId: string, mapId: string) {
  const queryClient = useQueryClient()
  const key = ["markers", guildId, mapId]

  return useMutation({
    mutationFn: ({ uuid, text }: { uuid: string; text: string }) =>
      updateMarkerText(guildId, mapId, uuid, text),
    onMutate: async ({ uuid, text }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Marker[]>(key)
      queryClient.setQueryData(key, (old: Marker[] = []) =>
        old.map(m => m.uuid === uuid ? { ...m, text } : m)
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(key, context?.previous)
    },
  })
}
```

**Step 6: Commit**

```bash
git add app/guilds/\[id\]/map/
git commit -m "feat: add guild map hooks (markers, PMTiles URL refresh)"
```

---

### Task 7: Create the guild map page and components

**Files:**
- Create: `app/guilds/[id]/map/page.tsx` (map list)
- Create: `app/guilds/[id]/map/[mapId]/page.tsx` (map view)
- Create: `app/guilds/[id]/map/[mapId]/components/GuildMapLoader.tsx`
- Create: `app/guilds/[id]/map/[mapId]/components/GuildMap.tsx`
- Create: `app/guilds/[id]/map/[mapId]/components/FloatingToolbar.tsx` (copy + adapt)
- Create: `app/guilds/[id]/map/[mapId]/components/MapSidePanel.tsx` (copy + adapt)
- Create: `app/guilds/[id]/map/[mapId]/components/MarkerInfoCard.tsx` (copy + adapt)
- Create: `app/guilds/[id]/map/[mapId]/components/utils.ts` (copy)

This is the largest task. The map components are based on the existing `/app/map/` code, adapted to use guild-scoped hooks and PMTiles instead of XYZ TileLayer.

**Step 1: Create `app/guilds/[id]/map/page.tsx`** (map list page)

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import MapList from "./components/MapList"

export default async function GuildMapPage({ params }) {
  const session = await auth()
  if (!session?.user) redirect("/")

  const { id } = await params
  return <MapList guildId={id} userId={session.user.id} />
}
```

**Step 2: Create `app/guilds/[id]/map/components/MapList.tsx`**

```typescript
"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Map, Plus, Trash2 } from "lucide-react"
import { fetchGuildMaps, createGuildMap, deleteGuildMap } from "@/lib/guild-maps"
import { useGuild } from "../../providers/GuildProvider"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MapList({ guildId, userId }: { guildId: string; userId: string }) {
  const queryClient = useQueryClient()
  const { guildData, isAdminOrOwner } = useGuild()
  const isOwner = guildData.owner === userId

  const { data: maps = [], isLoading } = useQuery({
    queryKey: ["guild-maps", guildId],
    queryFn: () => fetchGuildMaps(guildId),
  })

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [apiKey, setApiKey] = useState("")

  const createMutation = useMutation({
    mutationFn: () => createGuildMap(guildId, { name, tileforgeSlug: slug, tileforgeKey: apiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild-maps", guildId] })
      setShowForm(false)
      setName("")
      setSlug("")
      setApiKey("")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (mapId: string) => deleteGuildMap(guildId, mapId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guild-maps", guildId] })
    },
  })

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Loading maps...</p>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-cinzel">Maps</h1>
        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 cursor-pointer"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-4 w-4" />
            Add Map
          </Button>
        )}
      </div>

      {showForm && (
        <GlassPanel className="p-4 flex flex-col gap-3">
          <Input
            placeholder="Map name (e.g., Khorvaire)"
            value={name}
            onChange={e => setName(e.target.value)}
            className="bg-white/[0.05] border-white/[0.08]"
          />
          <Input
            placeholder="Tileforge tileset slug"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            className="bg-white/[0.05] border-white/[0.08]"
          />
          <Input
            placeholder="Tileforge API key (tf_...)"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="bg-white/[0.05] border-white/[0.08]"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!name || !slug || !apiKey || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="cursor-pointer"
            >
              {createMutation.isPending ? "Creating..." : "Create Map"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="cursor-pointer">
              Cancel
            </Button>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-destructive">{createMutation.error.message}</p>
          )}
        </GlassPanel>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {maps.map((map) => (
          <Link key={map.map_id} href={`/guilds/${guildId}/map/${map.map_id}`} className="group">
            <GlassPanel
              coronaHover
              className="relative p-5 h-full flex flex-col gap-2 transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  <h3 className="font-cinzel text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {map.name}
                  </h3>
                </div>
                {isOwner && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      deleteMutation.mutate(map.map_id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {map.tileforge_slug}
              </p>
            </GlassPanel>
          </Link>
        ))}
      </div>

      {maps.length === 0 && !showForm && (
        <p className="text-muted-foreground text-center py-8">
          No maps yet.{isOwner ? " Add one to get started." : ""}
        </p>
      )}
    </div>
  )
}
```

**Step 3: Create `app/guilds/[id]/map/[mapId]/page.tsx`**

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import GuildMapLoader from "./components/GuildMapLoader"

export default async function GuildMapViewPage({ params }) {
  const session = await auth()
  if (!session?.user) redirect("/")

  const { id, mapId } = await params
  return <GuildMapLoader guildId={id} mapId={mapId} />
}
```

**Step 4: Copy `app/map/components/map/utils.ts` to `app/guilds/[id]/map/[mapId]/components/utils.ts`**

Copy the file verbatim — it contains `calculateDistance` which is used by the map.

**Step 5: Create `app/guilds/[id]/map/[mapId]/components/GuildMapLoader.tsx`**

Adapted from `app/map/MapLoader.tsx` — same pattern but uses guild-scoped hooks:

```typescript
"use client"

import { useState, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { FloatingToolbar } from "./FloatingToolbar"
import MapSidePanel from "./MapSidePanel"
import { MarkerInfoCard } from "./MarkerInfoCard"
import useGetMarkers from "../hooks/useGetMarkers"
import usePmtilesUrl from "../hooks/usePmtilesUrl"

const GuildMapComponent = dynamic(() => import("./GuildMap"), { ssr: false })

export type MarkerScreenPosition = { x: number; y: number } | null

export type MapHandle = {
  flyToMarker: (position: { lat: number; lng: number }) => void
  zoomIn: () => void
  zoomOut: () => void
}

type Props = {
  guildId: string
  mapId: string
}

export default function GuildMapLoader({ guildId, mapId }: Props) {
  const [selectedMarkerUuid, setSelectedMarkerUuid] = useState<string | null>(null)
  const [markerScreenPos, setMarkerScreenPos] = useState<MarkerScreenPosition>(null)
  const mapHandleRef = useRef<MapHandle | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: markers = [] } = useGetMarkers(guildId, mapId)
  const { data: pmtilesUrl, isLoading: urlLoading, error: urlError } = usePmtilesUrl(guildId, mapId)

  const [markerActive, setMarkerActive] = useState(false)
  const [rulerActive, setRulerActive] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)

  const handleSelectMarker = useCallback((uuid: string, position: { lat: number; lng: number }) => {
    setSelectedMarkerUuid(uuid)
    mapHandleRef.current?.flyToMarker(position)
  }, [])

  const handleDismissInfoCard = useCallback(() => {
    setSelectedMarkerUuid(null)
    setMarkerScreenPos(null)
  }, [])

  const toggleMarker = useCallback(() => {
    setRulerActive(false)
    setMarkerActive(prev => !prev)
  }, [])

  const toggleRuler = useCallback(() => {
    setMarkerActive(false)
    setRulerActive(prev => !prev)
  }, [])

  const togglePanel = useCallback(() => {
    setPanelOpen(prev => !prev)
  }, [])

  const closePanel = useCallback(() => {
    setPanelOpen(false)
  }, [])

  const handleZoomIn = useCallback(() => {
    mapHandleRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    mapHandleRef.current?.zoomOut()
  }, [])

  const selectedMarker = selectedMarkerUuid
    ? markers.find(m => m.uuid === selectedMarkerUuid) ?? null
    : null

  const containerSize = containerRef.current
    ? { width: containerRef.current.clientWidth, height: containerRef.current.clientHeight }
    : { width: 0, height: 0 }

  if (urlLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-12rem)] text-muted-foreground">
        Loading map...
      </div>
    )
  }

  if (urlError || !pmtilesUrl) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-12rem)] text-destructive">
        Failed to load map tiles. Check Tileforge configuration.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-[calc(100dvh-12rem)] overflow-hidden rounded-xl">
      <GuildMapComponent
        guildId={guildId}
        mapId={mapId}
        pmtilesUrl={pmtilesUrl}
        selectedMarkerUuid={selectedMarkerUuid}
        setSelectedMarkerUuid={setSelectedMarkerUuid}
        mapHandleRef={mapHandleRef}
        markerActive={markerActive}
        rulerActive={rulerActive}
        onMarkerScreenPositionChange={setMarkerScreenPos}
      />
      <MapSidePanel
        guildId={guildId}
        mapId={mapId}
        open={panelOpen}
        onClose={closePanel}
        selectedMarkerUuid={selectedMarkerUuid}
        onSelectMarker={handleSelectMarker}
      />
      {selectedMarker && markerScreenPos && (
        <MarkerInfoCard
          guildId={guildId}
          mapId={mapId}
          marker={selectedMarker}
          screenPosition={markerScreenPos}
          containerSize={containerSize}
          onDismiss={handleDismissInfoCard}
        />
      )}
      <FloatingToolbar
        markerActive={markerActive}
        rulerActive={rulerActive}
        panelOpen={panelOpen}
        onToggleMarker={toggleMarker}
        onToggleRuler={toggleRuler}
        onTogglePanel={togglePanel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />
    </div>
  )
}
```

**Step 6: Create `app/guilds/[id]/map/[mapId]/components/GuildMap.tsx`**

Adapted from `app/map/components/map/Map.tsx` — replaces TileLayer with PmTilesLayer:

```typescript
"use client"

import { memo, useEffect, useMemo, useState, useCallback, type MutableRefObject } from "react"
import { MapContainer, Polyline, Marker, Popup, Tooltip, useMapEvents, useMap } from "react-leaflet"
import L from "leaflet"
import { calculateDistance } from "./utils"
import { useTheme } from "@/app/providers/ThemeProvider"
import useAddMarkerMutation from "../hooks/useAddMarkerMutation"
import useGetMarkers from "../hooks/useGetMarkers"
import { svgToBase64, uuid } from "@/utils/helpers"
import type { MapHandle, MarkerScreenPosition } from "./GuildMapLoader"
import PmTilesLayer from "./PmTilesLayer"

const RulerHandler = memo(({ addRulerPoint }: { addRulerPoint: (latlng: L.LatLng) => void }) => {
  const map = useMap()
  useMapEvents({
    click: (e) => {
      if (map.getBounds().contains(e.latlng)) {
        addRulerPoint(e.latlng)
      }
    }
  })
  return null
})
RulerHandler.displayName = "RulerHandler"

const MarkerHandler = memo(({ markers, lastMarkerId, addMarker }: {
  markers: Array<{ position: L.LatLng; uuid: string; distance: string }>
  lastMarkerId: string | null
  addMarker: (marker: unknown) => void
}) => {
  const map = useMap()
  useMapEvents({
    click: (e) => {
      if (map.getBounds().contains(e.latlng)) {
        const newMarker = {
          uuid: uuid(),
          position: e.latlng,
          distance: markers.length > 0
            ? calculateDistance(markers[markers.length - 1].position, e.latlng)
            : "Start",
          prev_marker: lastMarkerId,
        }
        addMarker(newMarker)
      }
    }
  })
  return null
})
MarkerHandler.displayName = "MarkerHandler"

function MapHandleBridge({ mapHandleRef }: { mapHandleRef: MutableRefObject<MapHandle | null> }) {
  const map = useMap()
  useEffect(() => {
    mapHandleRef.current = {
      flyToMarker: (position) => {
        map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 4), { duration: 0.8 })
      },
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
    }
    return () => { mapHandleRef.current = null }
  }, [map, mapHandleRef])
  return null
}

function SelectedMarkerTracker({
  selectedMarkerUuid, markers, onPositionChange,
}: {
  selectedMarkerUuid: string | null
  markers: Array<{ uuid: string; position?: { lat: string | number; lng: string | number } }>
  onPositionChange: (pos: MarkerScreenPosition) => void
}) {
  const map = useMap()
  const update = useCallback(() => {
    if (!selectedMarkerUuid) { onPositionChange(null); return }
    const marker = markers.find(m => m.uuid === selectedMarkerUuid)
    if (!marker?.position) { onPositionChange(null); return }
    const latlng = L.latLng(Number(marker.position.lat), Number(marker.position.lng))
    const point = map.latLngToContainerPoint(latlng)
    onPositionChange({ x: point.x, y: point.y })
  }, [map, selectedMarkerUuid, markers, onPositionChange])

  useEffect(() => { update() }, [update])
  useMapEvents({ move: update, zoom: update, moveend: update, zoomend: update })
  return null
}

type GuildMapProps = {
  guildId: string
  mapId: string
  pmtilesUrl: string
  selectedMarkerUuid: string | null
  setSelectedMarkerUuid: (uuid: string | null) => void
  mapHandleRef: MutableRefObject<MapHandle | null>
  markerActive: boolean
  rulerActive: boolean
  onMarkerScreenPositionChange: (pos: MarkerScreenPosition) => void
}

export default function GuildMap({
  guildId, mapId, pmtilesUrl,
  selectedMarkerUuid, setSelectedMarkerUuid, mapHandleRef,
  markerActive, rulerActive, onMarkerScreenPositionChange,
}: GuildMapProps) {
  const { theme } = useTheme()
  const mutateAddMarker = useAddMarkerMutation(guildId, mapId)
  const { data: markers = [] } = useGetMarkers(guildId, mapId)

  const [lastMarkerId] = useState(null)
  const [rulerPoints, setRulerPoints] = useState<L.LatLng[]>([])

  const customIcon = useMemo(() => {
    const svgString = `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200px" height="200px" viewBox="0 0 512 512" fill="${theme.primaryColor}">
      <g><path d="M390.54,55.719C353.383,18.578,304.696,0,255.993,0c-48.688,0-97.391,18.578-134.547,55.719 c-59.219,59.219-74.641,149.563-36.094,218.875C129.586,354.109,255.993,512,255.993,512s126.422-157.891,170.656-237.406 C465.195,205.281,449.773,114.938,390.54,55.719z M255.993,305.844c-63.813,0-115.563-51.75-115.563-115.547 c0-63.859,51.75-115.609,115.563-115.609c63.828,0,115.578,51.75,115.578,115.609C371.571,254.094,319.821,305.844,255.993,305.844z"></path></g>
    </svg>`
    return new L.Icon({ iconUrl: svgToBase64(svgString), iconSize: [25, 25], iconAnchor: [11.5, 15] })
  }, [theme.primaryColor])

  const selectedIcon = useMemo(() => {
    const svgString = `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="200px" height="200px" viewBox="0 0 512 512" fill="${theme.primaryColor}">
      <g><path d="M390.54,55.719C353.383,18.578,304.696,0,255.993,0c-48.688,0-97.391,18.578-134.547,55.719 c-59.219,59.219-74.641,149.563-36.094,218.875C129.586,354.109,255.993,512,255.993,512s126.422-157.891,170.656-237.406 C465.195,205.281,449.773,114.938,390.54,55.719z M255.993,305.844c-63.813,0-115.563-51.75-115.563-115.547 c0-63.859,51.75-115.609,115.563-115.609c63.828,0,115.578,51.75,115.578,115.609C371.571,254.094,319.821,305.844,255.993,305.844z"></path></g>
    </svg>`
    return new L.Icon({ iconUrl: svgToBase64(svgString), iconSize: [32, 32], iconAnchor: [16, 20] })
  }, [theme.primaryColor])

  // PMTiles flat projection: bounds from tile size
  const tileSize = 256
  const mapBounds: L.LatLngBoundsExpression = [[-tileSize, 0], [0, tileSize]]

  const addRulerPoint = (latlng: L.LatLng) => {
    setRulerPoints(prev => prev.length === 2 ? [latlng] : [...prev, latlng])
  }

  useEffect(() => { if (!rulerActive) setRulerPoints([]) }, [rulerActive])

  const handleAddMarker = (newMarker: unknown) => {
    if (rulerActive) return
    mutateAddMarker.mutate(newMarker)
  }

  const memoizedMarkers = useMemo(() => markers.map((marker) => (
    <Marker
      position={marker.position}
      key={marker.uuid}
      icon={marker.uuid === selectedMarkerUuid ? selectedIcon : customIcon}
      eventHandlers={{ click: () => setSelectedMarkerUuid(marker.uuid) }}
    />
  )), [markers, customIcon, selectedIcon, selectedMarkerUuid, setSelectedMarkerUuid])

  return (
    <MapContainer
      bounds={mapBounds}
      fadeAnimation={true}
      markerZoomAnimation={true}
      zoomAnimation={true}
      className="mapContainer crosshair"
      zoom={1}
      minZoom={0}
      maxZoom={8}
      zoomSnap={1}
      preferCanvas={true}
      attributionControl={false}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
      crs={L.CRS.Simple}
    >
      <MapHandleBridge mapHandleRef={mapHandleRef} />
      <SelectedMarkerTracker
        selectedMarkerUuid={selectedMarkerUuid}
        markers={markers}
        onPositionChange={onMarkerScreenPositionChange}
      />
      <PmTilesLayer pmtilesUrl={pmtilesUrl} tileSize={tileSize} maxZoom={8} />
      {memoizedMarkers}
      {markers.length > 0 && (
        <Polyline
          positions={markers.map(marker => marker.position)}
          pathOptions={{ color: theme.primaryColor, dashArray: "10, 20", opacity: 0.8, lineCap: "round", lineJoin: "bevel" }}
        />
      )}
      {rulerPoints.map((point, idx) => (
        <Marker position={point} key={idx} icon={customIcon}>
          <Popup>{`Ruler Point ${idx + 1}`}</Popup>
        </Marker>
      ))}
      {rulerPoints.length === 2 && (
        <Polyline positions={rulerPoints} pathOptions={{ color: theme.primaryColor, weight: 2 }}>
          <Tooltip permanent>{`Distance: ${calculateDistance(rulerPoints[0], rulerPoints[1])} miles`}</Tooltip>
        </Polyline>
      )}
      {markerActive && <MarkerHandler addMarker={handleAddMarker} markers={markers} lastMarkerId={lastMarkerId} />}
      {rulerActive && <RulerHandler addRulerPoint={addRulerPoint} />}
    </MapContainer>
  )
}
```

**Step 7: Create FloatingToolbar, MapSidePanel, MarkerInfoCard**

These are copies of the existing components with minor adaptations:

- **FloatingToolbar**: Same as `app/map/components/FloatingToolbar.tsx` but without `dmActive`/`onToggleDM` props (no DM mode for guild maps — there's no DM tile layer).
- **MapSidePanel**: Same as `app/map/components/MapSidePanel.tsx` but hooks take `guildId` and `mapId` params.
- **MarkerInfoCard**: Same as `app/map/components/MarkerInfoCard.tsx` but hooks take `guildId` and `mapId` params.

For each, copy the existing file and update:
1. Import paths for hooks: `../hooks/useGetMarkers` etc.
2. Add `guildId` and `mapId` props where hooks need them
3. Remove DM-mode toggle from FloatingToolbar

**Step 8: Commit**

```bash
git add app/guilds/\[id\]/map/
git commit -m "feat: add guild map pages, map viewer, and adapted components"
```

---

### Task 8: Add Map tab to guild navigation

**Files:**
- Modify: `app/guilds/[id]/components/GuildNav.tsx`

**Step 1: Add map route to GuildNav**

Add the Map route to the `routes` array (no permission restriction — all members can view maps):

```typescript
const routes = [
  { path: '/', label: 'Overview' },
  { path: '/map', label: 'Maps' },
  { path: '/members', label: 'Members' },
  { path: '/settings', label: 'Settings', permission: 'admin' },
]
```

**Step 2: Commit**

```bash
git add app/guilds/\[id\]/components/GuildNav.tsx
git commit -m "feat: add Maps tab to guild navigation"
```

---

### Task 9: Remove standalone map page and old API routes

**Files:**
- Delete: `app/map/` (entire directory)
- Delete: `app/api/markers/` (entire directory)
- Delete: `app/api/eberron/` (entire directory)
- Delete: `app/api/eberron-dm/` (entire directory)
- Modify: `app/components/navigation/DesktopSidebar.tsx` — remove Map from `authRoutes`
- Modify: `app/components/navigation/MobileNav.tsx` — remove Map from `authRoutes`
- Modify: `app/components/navigation/SpeedDial.tsx` — remove "Add Marker" action

**Step 1: Delete old map directory**

```bash
rm -rf app/map/
```

**Step 2: Delete old API routes**

```bash
rm -rf app/api/markers/
rm -rf app/api/eberron/
rm -rf app/api/eberron-dm/
```

**Step 3: Update DesktopSidebar**

Remove the Map entry from `authRoutes`:

```typescript
const authRoutes = [
  { title: "Guilds", path: "/guilds", icon: Shield },
]
```

Also remove the `Map` import from lucide-react (it's no longer needed — Castle, Calculator, Shield are still used).

**Step 4: Update MobileNav**

Same change — remove Map from `authRoutes` and the `Map` import:

```typescript
const authRoutes = [
  { title: "Guilds", path: "/guilds", icon: Shield },
]
```

**Step 5: Update SpeedDial**

Remove the "Add Marker" action:

```typescript
const actions: Action[] = [
  { label: "Create Guild", icon: Shield, href: "/guilds?create=true", auth: true },
  { label: "Roll Dice", icon: Dice6, action: "dice" },
  { label: "Calculator", icon: Calculator, href: "/tools/items" },
]
```

Remove the `MapPin` import from lucide-react.

**Step 6: Verify build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: remove standalone map page and old marker/eberron API routes"
```

---

### Task 10: Add TILEFORGE_API_URL environment variable

**Files:**
- Modify: `.env` or `.env.local` (add `TILEFORGE_API_URL`)

**Step 1: Add env var**

Add to your `.env.local`:

```
TILEFORGE_API_URL=http://localhost:8080
```

(Or whatever URL your Tileforge instance runs on.)

**Step 2: Verify full build passes**

```bash
npm run build
```

**Step 3: Commit env example if applicable**

If there's a `.env.example`, add `TILEFORGE_API_URL=` to it.

```bash
git add .env.example
git commit -m "chore: add TILEFORGE_API_URL to env example"
```

---

### Task 11: End-to-end smoke test

**No files to change — manual verification.**

1. Start the dev server: `npm run dev`
2. Sign in, create a guild (or use existing)
3. Go to guild → Maps tab
4. Click "Add Map", enter:
   - Name: any
   - Tileforge slug: a valid tileset slug from your Tileforge instance
   - API key: your `tf_...` key
5. Click Create Map
6. Click the new map card to open it
7. Verify: tiles load from PMTiles, toolbar works, markers can be placed/renamed/deleted, ruler works, side panel lists markers
8. Open the same map as another guild member (if possible) — verify shared markers
