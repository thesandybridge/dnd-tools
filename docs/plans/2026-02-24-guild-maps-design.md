# Per-Guild Maps with Tileforge Integration — Design

## Goal

Move maps from user-scoped to guild-scoped, with multiple maps per guild (campaigns). Guild owners configure maps by providing a Tileforge tileset slug and API key. Markers become collaborative — all guild members share the same markers on each map.

## Architecture

DnD Tools stores the Tileforge tileset slug and API key per map. A server-side endpoint proxies the presigned PMTiles URL request to Tileforge so the API key never reaches the browser. The client uses the `pmtiles` JS library with a custom Leaflet `GridLayer` to stream only the visible tiles via HTTP range requests. Presigned URLs expire every 10 minutes, so the client refreshes them on an 8-minute interval.

## Data Model

### New: GuildMap

```prisma
model GuildMap {
  id            Int       @id @default(autoincrement())
  mapId         String    @unique @default(uuid())
  guildId       String
  name          String
  tileforgeSlug String
  tileforgeKey  String    // encrypted tf_... API key
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  guild         Guild     @relation(fields: [guildId], references: [guildId], onDelete: Cascade)
  markers       Marker[]

  @@index([guildId])
}
```

### Modified: Marker

- Add `guildMapId String` (FK to GuildMap.mapId) — which map the marker belongs to
- Keep `userId` for attribution (who placed it)
- Drop implicit user-only scoping

### Modified: Guild

- Add `maps GuildMap[]` relation

## Routes

### Pages

| Route | Purpose |
|-------|---------|
| `/guilds/[id]/map` | List maps for guild, create new map |
| `/guilds/[id]/map/[mapId]` | Full-screen map view with markers and toolbar |

### API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/guilds/[guild_id]/maps` | List guild maps |
| POST | `/api/guilds/[guild_id]/maps` | Create map (owner only) |
| GET | `/api/guilds/[guild_id]/maps/[map_id]` | Get single map |
| PATCH | `/api/guilds/[guild_id]/maps/[map_id]` | Update map config (owner only) |
| DELETE | `/api/guilds/[guild_id]/maps/[map_id]` | Delete map (owner only) |
| GET | `/api/guilds/[guild_id]/maps/[map_id]/pmtiles-url` | Proxy presigned URL from Tileforge |
| GET | `/api/guilds/[guild_id]/maps/[map_id]/markers` | List markers for map |
| POST | `/api/guilds/[guild_id]/maps/[map_id]/markers` | Create marker |
| PATCH | `/api/guilds/[guild_id]/maps/[map_id]/markers/[uuid]` | Update marker |
| DELETE | `/api/guilds/[guild_id]/maps/[map_id]/markers/[uuid]` | Delete marker |

## PMTiles Flow

1. Client loads `/guilds/[id]/map/[mapId]`
2. Calls `GET /api/guilds/{gid}/maps/{mid}/pmtiles-url`
3. Server reads `tileforgeSlug` + `tileforgeKey` from DB
4. Server calls `GET {TILEFORGE_API_URL}/api/tilesets/{slug}/pmtiles-url` with `Authorization: Bearer tf_...`
5. Returns presigned URL to client
6. Client creates `PMTiles` instance, renders via custom Leaflet `GridLayer` calling `pm.getZxy(z, x, y)`
7. `setInterval` refreshes URL every 8 minutes

## Map Rendering

- `pmtiles` npm package + custom `L.GridLayer` (same pattern as Tileforge's own preview component)
- CRS: `L.CRS.Simple` for flat projection (default for fantasy maps)
- Bounds computed from PMTiles metadata
- Existing marker, ruler, and toolbar components are relocated from `/app/map/` into the guild map page

## Removals

- `/app/map/` standalone page (components relocated into guild map)
- `/api/eberron/` and `/api/eberron-dm/` tile proxy routes
- `/api/markers/` user-scoped marker routes
- Old user-only marker scoping in Prisma queries

## Environment Variables

- `TILEFORGE_API_URL` — base URL for Tileforge API (e.g., `https://tileforge.app`)
