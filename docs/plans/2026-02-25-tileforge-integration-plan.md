# TileForge Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to connect their TileForge account and browse/select tilesets when creating guild maps.

**Architecture:** Users store a TileForge API key in their profile. A server-side proxy route fetches tilesets from TileForge. A picker dialog in the map creation form lets users select a tileset, auto-populating PMTiles URL, API key, dimensions, and zoom levels.

**Tech Stack:** Next.js App Router, Prisma, TanStack React Query, shadcn/ui, TileForge REST API

---

### Task 1: Database Migration

**Files:**
- Create: `prisma/migrations/<timestamp>_add_tileforge_api_key/migration.sql`
- Modify: `prisma/schema.prisma`

**Step 1: Add field to Prisma schema**

In `prisma/schema.prisma`, add to the User model after the `timezone` field:

```prisma
  tileforgeApiKey String?  @map("tileforge_api_key")
```

**Step 2: Generate and run migration**

```bash
npx prisma migrate dev --name add_tileforge_api_key
```

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add tileforge_api_key column to users table"
```

---

### Task 2: User API + Serializer Updates

**Files:**
- Modify: `lib/serializers.ts:121-135`
- Modify: `app/api/users/[id]/route.ts:43`
- Modify: `app/users/[id]/providers/UserProvider.tsx:8-20`

**Step 1: Add to serializeUser**

In `lib/serializers.ts`, add to the `serializeUser` return object:

```typescript
tileforge_api_key: u.tileforgeApiKey,
```

**Step 2: Add to PATCH allowed fields**

In `app/api/users/[id]/route.ts`, add `'tileforgeApiKey'` to the `allowed` array:

```typescript
const allowed = ['name', 'bio', 'color', 'themeName', 'themeMode', 'particleEffect', 'coronaIntensity', 'timezone', 'tileforgeApiKey']
```

**Step 3: Add to UserData interface**

In `app/users/[id]/providers/UserProvider.tsx`, add to the `UserData` interface:

```typescript
tileforge_api_key: string | null
```

**Step 4: Verify build**

```bash
npx next build
```

**Step 5: Commit**

```bash
git add lib/serializers.ts app/api/users/[id]/route.ts app/users/[id]/providers/UserProvider.tsx
git commit -m "feat: expose tileforge_api_key in user API and serializer"
```

---

### Task 3: TileForge Proxy API Route

**Files:**
- Create: `app/api/tileforge/tilesets/route.ts`

**Step 1: Create the proxy route**

```typescript
import { auth } from "@/auth"
import prisma from "@/prisma/client"

const TILEFORGE_API = "https://api.tileforge.sandybridge.io"

export const GET = auth(async function GET(request) {
  const userId = request.auth?.user?.id
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tileforgeApiKey: true },
  })

  if (!user?.tileforgeApiKey) {
    return Response.json({ error: "No TileForge API key configured" }, { status: 400 })
  }

  const url = new URL(request.url)
  const search = url.searchParams.get("search") || ""
  const page = url.searchParams.get("page") || "1"

  try {
    const params = new URLSearchParams({ page, per_page: "50" })
    if (search) params.set("search", search)

    const res = await fetch(`${TILEFORGE_API}/api/tilesets?${params}`, {
      headers: { Authorization: `Bearer ${user.tileforgeApiKey}` },
    })

    if (!res.ok) {
      if (res.status === 401) {
        return Response.json({ error: "TileForge API key is invalid or expired" }, { status: 401 })
      }
      return Response.json({ error: "Failed to fetch tilesets from TileForge" }, { status: res.status })
    }

    const tilesets = await res.json()
    return Response.json(tilesets)
  } catch {
    return Response.json({ error: "Could not reach TileForge" }, { status: 502 })
  }
})
```

**Step 2: Verify build**

```bash
npx next build
```

**Step 3: Commit**

```bash
git add app/api/tileforge/tilesets/route.ts
git commit -m "feat: add TileForge tilesets proxy route"
```

---

### Task 4: TileForge Validation API Route

**Files:**
- Create: `app/api/tileforge/validate/route.ts`

This route validates a TileForge API key before storing it.

**Step 1: Create the validation route**

```typescript
import { auth } from "@/auth"

const TILEFORGE_API = "https://api.tileforge.sandybridge.io"

export const POST = auth(async function POST(request) {
  const userId = request.auth?.user?.id
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { apiKey?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const apiKey = body.apiKey?.trim()
  if (!apiKey || !apiKey.startsWith("tf_")) {
    return Response.json({ error: "Invalid API key format. Keys start with tf_" }, { status: 400 })
  }

  try {
    const res = await fetch(`${TILEFORGE_API}/api/user`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!res.ok) {
      return Response.json({ error: "Invalid API key" }, { status: 401 })
    }

    const user = await res.json()
    return Response.json({ valid: true, plan: user.plan || "free" })
  } catch {
    return Response.json({ error: "Could not reach TileForge" }, { status: 502 })
  }
})
```

**Step 2: Verify build**

```bash
npx next build
```

**Step 3: Commit**

```bash
git add app/api/tileforge/validate/route.ts
git commit -m "feat: add TileForge API key validation route"
```

---

### Task 5: Client Library

**Files:**
- Create: `lib/tileforge.ts`

**Step 1: Create the client library**

```typescript
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
```

**Step 2: Verify build**

```bash
npx next build
```

**Step 3: Commit**

```bash
git add lib/tileforge.ts
git commit -m "feat: add TileForge client library"
```

---

### Task 6: Account Settings - TileForge Section

**Files:**
- Modify: `app/users/[id]/components/settings/AccountSettings.tsx`

**Step 1: Add TileForge section to AccountSettings**

Add a new GlassPanel section between the timezone section and the danger zone. The section should:

- Show connection status: if user has `tileforge_api_key`, show the key prefix (first 10 chars + `...`) with a "Disconnect" button
- If not connected: show an Input for pasting the API key and a "Connect" button
- The "Connect" button calls `validateTileForgeKey(key)`, and on success calls `updateUser(userId, { tileforgeApiKey: key })`
- The "Disconnect" button calls `updateUser(userId, { tileforgeApiKey: null })` and invalidates the user query
- Show loading states on buttons during mutations
- Show error messages if validation fails

**Imports to add:**
```typescript
import { validateTileForgeKey } from "@/lib/tileforge"
```

**State:**
```typescript
const [tfKey, setTfKey] = useState('')
```

**Mutations:**
```typescript
const tfConnectMutation = useMutation({
  mutationFn: async () => {
    await validateTileForgeKey(tfKey)
    return updateUser(userId, { tileforgeApiKey: tfKey })
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user', userId] })
    setTfKey('')
  },
})

const tfDisconnectMutation = useMutation({
  mutationFn: () => updateUser(userId, { tileforgeApiKey: null }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId] }),
})
```

**JSX pattern:**

```tsx
<GlassPanel variant="subtle" className="p-5">
  <h3 className="font-cinzel text-sm font-semibold mb-3 text-muted-foreground">TileForge</h3>
  {user.tileforge_api_key ? (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">Connected</span>
        <span className="text-xs text-muted-foreground font-mono">
          {user.tileforge_api_key.slice(0, 10)}...
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={tfDisconnectMutation.isPending}
        onClick={() => tfDisconnectMutation.mutate()}
      >
        {tfDisconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
      </Button>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Connect your TileForge account to import tilesets when creating maps.
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="password"
          placeholder="tf_..."
          value={tfKey}
          onChange={(e) => setTfKey(e.target.value)}
          className="bg-white/[0.05] border-white/[0.08] flex-1"
        />
        <Button
          size="sm"
          disabled={!tfKey.trim().startsWith('tf_') || tfConnectMutation.isPending}
          onClick={() => tfConnectMutation.mutate()}
        >
          {tfConnectMutation.isPending ? 'Connecting...' : 'Connect'}
        </Button>
      </div>
      {tfConnectMutation.isError && (
        <p className="text-xs text-destructive">{tfConnectMutation.error.message}</p>
      )}
    </div>
  )}
</GlassPanel>
```

**Step 2: Verify build**

```bash
npx next build
```

**Step 3: Commit**

```bash
git add app/users/[id]/components/settings/AccountSettings.tsx
git commit -m "feat: add TileForge connection to account settings"
```

---

### Task 7: TileForge Tileset Picker Dialog

**Files:**
- Create: `app/guilds/[id]/map/components/TileForgePickerDialog.tsx`

**Step 1: Create the picker dialog component**

The dialog should:

- Accept props: `open`, `onOpenChange`, `onSelect` (callback with selected tileset)
- Use `useQuery` to fetch tilesets from `/api/tileforge/tilesets`
- Show a search input at the top
- Display tilesets in a grid with thumbnail images (from `getTileForgeThumbnailUrl`), name, and dimensions
- Each card is clickable - clicking calls `onSelect(tileset)` and closes the dialog
- Loading state with skeleton cards
- Error state with message
- Empty state: "No tilesets found" with link to TileForge

```tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/app/hooks/useDebounce'
import { fetchTileForgeTilesets, getTileForgeThumbnailUrl, type TileForgeTileset } from '@/lib/tileforge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { GlassPanel } from '@/app/components/ui/GlassPanel'
import { Search, ImageOff } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (tileset: TileForgeTileset) => void
}

export default function TileForgePickerDialog({ open, onOpenChange, onSelect }: Props) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const { data: tilesets = [], isLoading, error } = useQuery({
    queryKey: ['tileforge-tilesets', debouncedSearch],
    queryFn: () => fetchTileForgeTilesets(debouncedSearch || undefined),
    enabled: open,
  })

  function handleSelect(tileset: TileForgeTileset) {
    onSelect(tileset)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="font-cinzel">Import from TileForge</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tilesets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-white/[0.05] border-white/[0.08]"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col gap-2">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">{(error as Error).message}</p>
            </div>
          ) : tilesets.length === 0 ? (
            <div className="text-center py-8">
              <ImageOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No tilesets found</p>
              <a
                href="https://tileforge.sandybridge.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-1 inline-block"
              >
                Create tilesets on TileForge
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tilesets.map((tileset) => (
                <button
                  key={tileset.id}
                  onClick={() => handleSelect(tileset)}
                  className="text-left cursor-pointer"
                >
                  <GlassPanel
                    coronaHover
                    className="p-3 flex flex-col gap-2 transition-all hover:scale-[1.02]"
                  >
                    <img
                      src={getTileForgeThumbnailUrl(tileset.storage_path)}
                      alt={tileset.name}
                      className="aspect-square w-full rounded-lg object-cover bg-white/[0.03]"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span className="font-cinzel text-sm font-medium truncate">{tileset.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tileset.width && tileset.height
                        ? `${tileset.width} x ${tileset.height} · Zoom 0-${tileset.max_zoom}`
                        : `Zoom 0-${tileset.max_zoom}`}
                    </span>
                  </GlassPanel>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Verify build**

```bash
npx next build
```

**Step 3: Commit**

```bash
git add app/guilds/[id]/map/components/TileForgePickerDialog.tsx
git commit -m "feat: add TileForge tileset picker dialog"
```

---

### Task 8: Map Form Integration

**Files:**
- Modify: `app/guilds/[id]/map/components/MapList.tsx`

**Step 1: Add TileForge import button to MapFormFields**

The `MapFormFields` component needs:

1. A new optional prop `onImportTileForge?: () => void` - when provided, shows an "Import from TileForge" button above the form fields
2. The button is styled as a subtle GlassPanel with the TileForge name

Add before the first Input in MapFormFields:

```tsx
{onImportTileForge && (
  <Button
    type="button"
    variant="outline"
    className="w-full gap-2"
    onClick={onImportTileForge}
  >
    Import from TileForge
  </Button>
)}
```

**Step 2: Wire up the picker in MapList and EditMapDialog**

In the `MapList` component:

1. Add state: `const [showTfPicker, setShowTfPicker] = useState(false)`
2. Add a `useQuery` to check if the current user has a TileForge key linked. Use the session user ID to fetch the user and check `tileforge_api_key`. Alternatively, add a lightweight check: query the user data that's likely already cached from the UserProvider or session.
3. Pass `onImportTileForge={() => setShowTfPicker(true)}` to MapFormFields (only if user has a TF key)
4. Render the `TileForgePickerDialog` with an `onSelect` handler that populates form state:

```tsx
import TileForgePickerDialog from './TileForgePickerDialog'
import { getTileForgepmtilesUrl, type TileForgeTileset } from '@/lib/tileforge'

// In MapList component:
const [showTfPicker, setShowTfPicker] = useState(false)

function handleTileForgeSelect(tileset: TileForgeTileset) {
  setName(tileset.name)
  setPmtilesUrl(getTileForgepmtilesUrl(tileset.slug))
  // pmtilesApiKey is stored server-side, the tile proxy reads it from the user's map record
  if (tileset.width) setImageWidth(tileset.width.toString())
  if (tileset.height) setImageHeight(tileset.height.toString())
  setMaxZoom(tileset.max_zoom.toString())
}
```

5. For the API key: when a tileset is imported from TileForge, the `pmtilesApiKey` field should be auto-filled with the user's stored TileForge key. Fetch it from the user query data or pass it through. The simplest approach: read it from the session user's data if available, or fetch it.

Since the user's `tileforge_api_key` is already in the user query cache (from UserProvider or ThemeProvider), use that:

```tsx
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { fetchUser } from '@/lib/users'

// Inside MapList:
const { data: session } = useSession()
const { data: currentUser } = useQuery({
  queryKey: ['user', session?.user?.id],
  queryFn: () => fetchUser(session?.user?.id),
  enabled: !!session?.user?.id,
  staleTime: 300000,
})
const hasTileForge = !!currentUser?.tileforge_api_key
```

Then in `handleTileForgeSelect`:
```tsx
if (currentUser?.tileforge_api_key) {
  setPmtilesApiKey(currentUser.tileforge_api_key)
}
```

Do the same for `EditMapDialog`.

**Step 3: Verify build**

```bash
npx next build
```

**Step 4: Commit**

```bash
git add app/guilds/[id]/map/components/MapList.tsx
git commit -m "feat: integrate TileForge picker into map creation and edit forms"
```

---

### Task 9: Branding

**Files:**
- Modify: `app/guilds/[id]/map/[mapId]/components/GuildMapLoader.tsx`
- Modify: `app/layout.tsx`

**Step 1: Add "Powered by TileForge" to footer**

In `app/layout.tsx`, add TileForge to the footer links alongside Portfolio and GitHub:

```tsx
<a href="https://tileforge.sandybridge.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
  TileForge
</a>
```

**Step 2: Verify build**

```bash
npx next build
```

**Step 3: Commit**

```bash
git add app/layout.tsx app/guilds/[id]/map/[mapId]/components/GuildMapLoader.tsx
git commit -m "feat: add TileForge branding to footer"
```
