# TileForge Integration Design

## Goal

Allow users to connect their TileForge account and browse/select tilesets when creating guild maps, auto-populating PMTiles URL, API key, image dimensions, and zoom levels.

## Architecture

Users link their TileForge API key (`tf_...`) in Account Settings. The key is validated server-side against `api.tileforge.sandybridge.io/api/user` and stored in the `users` table. A server-side proxy route fetches tilesets using the stored key so the key never reaches the client. In the map creation form, an "Import from TileForge" button opens a picker dialog that lists tilesets with thumbnails. Selecting one auto-fills all map fields. The existing tile proxy handles presigned URL resolution and tile serving unchanged.

## Data Flow

1. **Linking** - User enters TileForge API key in Account Settings. Server validates by calling `GET api.tileforge.sandybridge.io/api/user` with Bearer auth. If valid, stores key in `users.tileforge_api_key`.

2. **Browsing** - User clicks "Import from TileForge" in map form. Client calls `GET /api/tileforge/tilesets`. Server reads user's stored key, proxies to TileForge `GET /api/tilesets`, returns list with thumbnails.

3. **Selecting** - User picks a tileset. Dialog auto-fills form:
   - `pmtilesUrl` → `https://api.tileforge.sandybridge.io/api/tilesets/{slug}/pmtiles-url`
   - `pmtilesApiKey` → user's stored TileForge key
   - `imageWidth` → tileset `width`
   - `imageHeight` → tileset `height`
   - `maxZoom` → tileset `max_zoom`

4. **Rendering** - Unchanged. Existing tile proxy resolves presigned URL via Bearer auth and serves tiles.

## Components

### Account Settings - TileForge Section
- API key input field with validate + save button
- Connection status: connected (show key prefix `tf_0123456...` + disconnect button) or not connected
- Validation calls TileForge `/api/user` endpoint

### TileForge Tileset Picker Dialog
- Modal triggered from map creation/edit form
- Grid of user's tilesets with thumbnail, name, dimensions
- Search filtering
- Selecting a tileset closes dialog and populates form fields
- Empty state with link to TileForge if no tilesets

### Map Form Integration
- "Import from TileForge" button in `MapFormFields`, above manual fields
- Hidden if user has no TileForge key linked
- Imported fields are editable (user can tweak zoom, etc.)

### Footer/Branding
- "Powered by TileForge" link in map viewer or creation area

## Database Change

Single new nullable column on `users` table:
- `tileforge_api_key` (String, nullable)

## API Routes

### GET /api/tileforge/tilesets
- Auth: required (session user)
- Reads user's `tileforge_api_key` from DB
- Proxies to `GET https://api.tileforge.sandybridge.io/api/tilesets` with Bearer auth
- Returns tileset list

### PATCH /api/users/[id] (existing)
- Add `tileforgeApiKey` to allowed fields

## Error Handling

- Invalid API key on save → validation error, don't store
- TileForge API unreachable → "Could not reach TileForge" in picker
- Key revoked after linking → error when browsing, prompt to re-link
- No tilesets found → empty state in picker with link to TileForge

## TileForge API Reference

- Base URL: `https://api.tileforge.sandybridge.io`
- Auth: `Authorization: Bearer tf_...` (API key)
- `GET /api/user` - Validate key, returns user info
- `GET /api/tilesets` - List tilesets (paginated, search)
- `GET /api/tilesets/{slug}` - Tileset details
- `GET /api/tilesets/{slug}/pmtiles-url` - Presigned PMTiles URL (10 min TTL)
- Tileset fields: `name`, `slug`, `width`, `height`, `min_zoom`, `max_zoom`, `tile_size`, `public`, `storage_path`
- Thumbnails: `GET /api/tiles/{job_id}/thumbnail` (from `storage_path`)
