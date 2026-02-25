# TileForge Branding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bold TileForge cross-promotion across the app to drive discovery and signups.

**Architecture:** Pure UI changes across 4 existing files. No new routes, no schema changes. Each task modifies one file. A shared constants object keeps URLs and copy DRY.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, shadcn/ui, lucide-react, GlassPanel design system

---

### Task 1: TileForge Constants

**Files:**
- Modify: `lib/tileforge.ts` (add to end of file)

**Step 1: Add constants block**

Add to the end of `lib/tileforge.ts`:

```typescript
export const TILEFORGE_URLS = {
  home: "https://tileforge.sandybridge.io",
  signup: "https://tileforge.sandybridge.io/signup",
} as const

export const TILEFORGE_COPY = {
  tagline: "Upload any image. Get a zoomable map.",
  pitch: "Turn any image into a zoomable PMTiles tileset. Free tier lets you generate tiles and self-host. Paid plans include hosted tile serving.",
  ctaSignup: "Sign up on TileForge",
  ctaLearnMore: "Learn more",
  ctaGetStarted: "Get Started on TileForge",
  poweredBy: "Powered by TileForge",
  formPromo: "Don't have tilesets yet? Create zoomable map tiles from any image with TileForge \u2014 free tier available.",
} as const
```

**Step 2: Commit**

```bash
git add lib/tileforge.ts
git commit -m "feat: add TileForge branding constants"
```

---

### Task 2: Footer Branding

**Files:**
- Modify: `app/layout.tsx:60-64`

**Step 1: Replace the plain TileForge text link**

In `app/layout.tsx`, replace lines 60-64 (the separator span and TileForge anchor):

```tsx
<span className="text-white/10">|</span>
<a href="https://tileforge.sandybridge.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
  TileForge
</a>
```

With a badge-style treatment that stands apart from the other links:

```tsx
<span className="text-white/10">|</span>
<a
  href="https://tileforge.sandybridge.io"
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all text-xs font-medium"
>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
  Powered by TileForge
</a>
```

**Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: upgrade TileForge footer to branded badge"
```

---

### Task 3: Picker Dialog Branding

**Files:**
- Modify: `app/guilds/[id]/map/components/TileForgePickerDialog.tsx:39-41`

**Step 1: Add branding to dialog header**

Replace the DialogHeader block (lines 39-41):

```tsx
<DialogHeader>
  <DialogTitle className="font-cinzel">Select Tileset</DialogTitle>
</DialogHeader>
```

With:

```tsx
<DialogHeader>
  <DialogTitle className="font-cinzel">Import from TileForge</DialogTitle>
  <a
    href="https://tileforge.sandybridge.io"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors w-fit"
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
    Powered by TileForge
  </a>
</DialogHeader>
```

**Step 2: Commit**

```bash
git add app/guilds/\[id\]/map/components/TileForgePickerDialog.tsx
git commit -m "feat: add TileForge branding to picker dialog header"
```

---

### Task 4: Map Page Empty State

**Files:**
- Modify: `app/guilds/[id]/map/components/MapList.tsx:374-379`

**Step 1: Replace the minimal empty state**

Replace lines 374-379 (the empty state block):

```tsx
{maps.length === 0 && !showForm && (
  <GlassPanel variant="subtle" className="p-8 text-center">
    <Map className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
    <p className="text-sm text-muted-foreground">No maps yet</p>
  </GlassPanel>
)}
```

With a TileForge promo card. Import `ExternalLink` from lucide-react (add to existing import on line 7). Import `TILEFORGE_URLS` and `TILEFORGE_COPY` from `@/lib/tileforge` (add to existing import on line 30).

```tsx
{maps.length === 0 && !showForm && (
  <GlassPanel variant="default" corona className="p-8 text-center max-w-lg mx-auto">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Map className="h-6 w-6 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="font-cinzel text-lg font-semibold">Bring your world to life</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {TILEFORGE_COPY.pitch}
        </p>
      </div>
      {canManageMaps && (
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {hasTileForge ? (
            <Button className="w-full sm:w-auto gap-2" onClick={() => { setShowForm(true); setShowTfPicker(true) }}>
              Import from TileForge
            </Button>
          ) : (
            <Button className="w-full sm:w-auto gap-2" asChild>
              <a href={TILEFORGE_URLS.signup} target="_blank" rel="noopener noreferrer">
                {TILEFORGE_COPY.ctaGetStarted}
                <ExternalLink size={14} />
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            onClick={() => setShowForm(true)}
          >
            Add Map Manually
          </Button>
        </div>
      )}
    </div>
  </GlassPanel>
)}
```

**Step 2: Commit**

```bash
git add app/guilds/\[id\]/map/components/MapList.tsx
git commit -m "feat: replace empty map state with TileForge promo"
```

---

### Task 5: Map Form TileForge Promo (Unconnected Users)

**Files:**
- Modify: `app/guilds/[id]/map/components/MapList.tsx:55-64` (MapFormFields component)

**Step 1: Add promo for unconnected users**

Add a new prop `showTileForgePromo?: boolean` to `MapFormFields`. In the props type (line 51), add:

```typescript
onImportTileForge?: () => void
showTileForgePromo?: boolean
```

Replace the existing TileForge button block (lines 55-64):

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

With logic that shows either the import button (connected) or a promo (not connected). Import `ExternalLink` from lucide-react and `TILEFORGE_URLS, TILEFORGE_COPY` from `@/lib/tileforge` (already imported in this file from Task 4):

```tsx
{onImportTileForge ? (
  <Button
    type="button"
    variant="outline"
    className="w-full gap-2"
    onClick={onImportTileForge}
  >
    Import from TileForge
  </Button>
) : showTileForgePromo ? (
  <div className="rounded-lg border border-primary/10 bg-primary/[0.03] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
    <p className="text-xs text-muted-foreground flex-1">
      {TILEFORGE_COPY.formPromo}
    </p>
    <a
      href={TILEFORGE_URLS.home}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-primary hover:underline whitespace-nowrap"
    >
      {TILEFORGE_COPY.ctaLearnMore} &rarr;
    </a>
  </div>
) : null}
```

**Step 2: Pass `showTileForgePromo` from both form usages**

In MapList's create form (around line 354), add the prop:

```tsx
onImportTileForge={hasTileForge ? () => setShowTfPicker(true) : undefined}
showTileForgePromo={!hasTileForge}
```

In EditMapDialog's form (around line 196), add the prop:

```tsx
onImportTileForge={hasTileForge ? () => setShowTfPicker(true) : undefined}
showTileForgePromo={!hasTileForge}
```

**Step 3: Commit**

```bash
git add app/guilds/\[id\]/map/components/MapList.tsx
git commit -m "feat: add TileForge promo banner in map form for unconnected users"
```

---

### Task 6: Account Settings Richer Section

**Files:**
- Modify: `app/users/[id]/components/settings/AccountSettings.tsx:137-165`

**Step 1: Upgrade the disconnected state**

Import `TILEFORGE_URLS, TILEFORGE_COPY` from `@/lib/tileforge` and `ExternalLink` from `lucide-react` at the top of the file.

Replace the disconnected branch (lines 137-165, the `else` block inside the TileForge GlassPanel):

```tsx
) : (
  <div className="flex flex-col gap-3">
    <p className="text-sm text-muted-foreground">
      Connect your TileForge account to import tilesets when creating maps.
    </p>
    <div className="flex gap-2">
      ...
```

With:

```tsx
) : (
  <div className="flex flex-col gap-4">
    <div className="rounded-lg border border-primary/10 bg-primary/[0.03] p-4 space-y-3">
      <p className="font-cinzel text-sm font-semibold text-foreground">
        {TILEFORGE_COPY.tagline}
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {TILEFORGE_COPY.pitch}
      </p>
      <a
        href={TILEFORGE_URLS.signup}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
      >
        {TILEFORGE_COPY.ctaSignup}
        <ExternalLink size={14} />
      </a>
    </div>
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Already have an account? Paste your API key to connect.
      </p>
      <div className="flex gap-2">
        <Input
          type="password"
          placeholder="tf_..."
          value={tfKey}
          onChange={(e) => setTfKey(e.target.value)}
          className="max-w-xs"
        />
        <Button
          size="sm"
          disabled={!tfKey.startsWith('tf_') || tfConnectMutation.isPending}
          onClick={() => tfConnectMutation.mutate()}
        >
          {tfConnectMutation.isPending ? 'Connecting...' : 'Connect'}
        </Button>
      </div>
      {tfConnectMutation.isError && (
        <p className="text-sm text-destructive">
          {tfConnectMutation.error instanceof Error
            ? tfConnectMutation.error.message
            : 'Failed to connect'}
        </p>
      )}
    </div>
  </div>
```

**Step 2: Commit**

```bash
git add app/users/\[id\]/components/settings/AccountSettings.tsx
git commit -m "feat: upgrade account settings TileForge section with pitch and signup link"
```
