# User Profile Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the user profile into a personal dashboard with deep theme customization, character identity cards, and proper settings organization.

**Architecture:** Extend the User model with theme/profile fields persisted to DB (replacing localStorage). Add a Character model for identity cards. Decouple particle effects from theme names via a `data-particle` HTML attribute. Build a custom canvas HSL color wheel. Add `/characters` as a top-level route following the Guilds pattern.

**Tech Stack:** Next.js 16, Prisma (PostgreSQL), TanStack Query, shadcn/ui, Tailwind CSS, Canvas API (color wheel), Framer Motion

---

### Task 1: Database Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_user_profile_overhaul/migration.sql`

**Step 1: Update Prisma schema**

Add to User model (after `color` field):

```prisma
  bio             String?
  themeName       String   @default("parchment") @map("theme_name")
  themeMode       String   @default("dark") @map("theme_mode")
  particleEffect  String   @default("auto") @map("particle_effect")
  coronaIntensity Float    @default(0.8) @map("corona_intensity")
```

Add `characters Character[]` relation to User model.

Add new Character model:

```prisma
model Character {
  id        Int      @id @default(autoincrement())
  userId    String   @map("user_id")
  name      String
  race      String?
  charClass String?  @map("char_class")
  subclass  String?
  level     Int      @default(1)
  backstory String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("characters")
}
```

**Step 2: Write migration SQL**

```sql
-- Add new columns to users table
ALTER TABLE "users" ADD COLUMN "bio" TEXT;
ALTER TABLE "users" ADD COLUMN "theme_name" TEXT NOT NULL DEFAULT 'parchment';
ALTER TABLE "users" ADD COLUMN "theme_mode" TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE "users" ADD COLUMN "particle_effect" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE "users" ADD COLUMN "corona_intensity" DOUBLE PRECISION NOT NULL DEFAULT 0.8;

-- Create characters table
CREATE TABLE "characters" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "race" TEXT,
    "char_class" TEXT,
    "subclass" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "backstory" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- Add foreign key
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**Step 3: Run migration and generate client**

```bash
npx prisma migrate dev --name user_profile_overhaul
npx prisma generate
```

**Step 4: Verify build**

```bash
npx next build
```

**Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: add user profile fields and character model"
```

---

### Task 2: Serializers & Lib Functions

**Files:**
- Modify: `lib/serializers.ts`
- Modify: `lib/users.ts`
- Create: `lib/characters.ts`

**Step 1: Add serializers**

Add to `lib/serializers.ts`:

```typescript
/** User → public profile fields */
export function serializeUser(u: User) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    color: u.color,
    bio: u.bio,
    theme_name: u.themeName,
    theme_mode: u.themeMode,
    particle_effect: u.particleEffect,
    corona_intensity: u.coronaIntensity,
  }
}

/** Character → snake_case fields */
export function serializeCharacter(c: Character) {
  return {
    id: c.id,
    user_id: c.userId,
    name: c.name,
    race: c.race,
    char_class: c.charClass,
    subclass: c.subclass,
    level: c.level,
    backstory: c.backstory,
    avatar_url: c.avatarUrl,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  }
}
```

Add `Character` to the import from `@/lib/generated/prisma/client`.

**Step 2: Update `lib/users.ts`**

Replace the `updateUser` function to accept a flat settings object instead of `{ userData }` wrapper:

```typescript
export async function updateUser(userId: string, data: Record<string, unknown>) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update user')
  return response.json()
}

export async function deleteUser(userId: string) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to delete account')
  return response.json()
}
```

Keep all other functions as-is.

**Step 3: Create `lib/characters.ts`**

```typescript
export async function fetchCharacters() {
  const response = await fetch('/api/characters')
  if (!response.ok) throw new Error('Failed to fetch characters')
  return response.json()
}

export async function fetchCharacter(id: number) {
  const response = await fetch(`/api/characters/${id}`)
  if (!response.ok) throw new Error('Failed to fetch character')
  return response.json()
}

export async function createCharacter(data: {
  name: string
  race?: string
  charClass?: string
  subclass?: string
  level?: number
  backstory?: string
}) {
  const response = await fetch('/api/characters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create character')
  return response.json()
}

export async function updateCharacter(id: number, data: Record<string, unknown>) {
  const response = await fetch(`/api/characters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to update character')
  return response.json()
}

export async function deleteCharacter(id: number) {
  const response = await fetch(`/api/characters/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) throw new Error('Failed to delete character')
  return response.json()
}
```

**Step 4: Verify build, commit**

```bash
npx next build
git add lib/serializers.ts lib/users.ts lib/characters.ts
git commit -m "feat: add user/character serializers and lib functions"
```

---

### Task 3: API Routes — User PATCH/DELETE & Guilds Fix

**Files:**
- Modify: `app/api/users/[id]/route.ts`
- Modify: `app/api/users/[id]/guilds/route.ts`

**Step 1: Rewrite PATCH to accept all profile fields**

The PATCH handler should accept a flat JSON body (not wrapped in `{ userData }`):

```typescript
export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    if (session.user.id !== id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Allowlist of updatable fields
    const allowed = ['name', 'bio', 'color', 'themeName', 'themeMode', 'particleEffect', 'coronaIntensity']
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    })

    return Response.json(serializeUser(user))
  } catch (error) {
    console.error('Failed to update user:', (error as Error).message)
    return Response.json({ error: 'Failed to update user' }, { status: 500 })
  }
})
```

Import `serializeUser` from `@/lib/serializers`.

**Step 2: Add DELETE handler with ownership transfer**

```typescript
export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    if (session.user.id !== id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      // Find guilds owned by this user
      const ownedGuilds = await tx.guild.findMany({
        where: { ownerId: id },
        include: {
          members: {
            where: { userId: { not: id } },
            include: { role: true },
            orderBy: { role: { position: 'asc' } },
          },
        },
      })

      for (const guild of ownedGuilds) {
        if (guild.members.length > 0) {
          // Transfer to highest-ranked member
          const newOwner = guild.members[0]
          const ownerRole = await tx.guildRole.findFirst({
            where: { guildId: guild.guildId, position: 0 },
          })
          await tx.guild.update({
            where: { id: guild.id },
            data: { ownerId: newOwner.userId },
          })
          if (ownerRole) {
            await tx.guildMember.update({
              where: { guildId_userId: { guildId: guild.guildId, userId: newOwner.userId } },
              data: { roleId: ownerRole.id },
            })
          }
        } else {
          // No other members — delete guild (cascades maps, markers, roles, members)
          await tx.guild.delete({ where: { id: guild.id } })
        }
      }

      // Remove user's guild memberships
      await tx.guildMember.deleteMany({ where: { userId: id } })

      // Delete user (cascades characters, markers, accounts, sessions)
      await tx.user.delete({ where: { id } })
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete user:', (error as Error).message)
    return Response.json({ error: 'Failed to delete account' }, { status: 500 })
  }
})
```

**Step 3: Fix guilds route to return all memberships**

Replace `app/api/users/[id]/guilds/route.ts`:

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params

    const memberships = await prisma.guildMember.findMany({
      where: { userId: id },
      include: {
        guild: {
          include: {
            _count: { select: { members: true } },
          },
        },
        role: true,
      },
    })

    const result = memberships.map((m) => ({
      guild_id: m.guild.guildId,
      name: m.guild.name,
      owner: m.guild.ownerId,
      is_owner: m.guild.ownerId === id,
      member_count: m.guild._count.members,
      role: {
        id: m.role.id,
        name: m.role.name,
        color: m.role.color,
        position: m.role.position,
      },
    }))

    return Response.json(result)
  } catch (error) {
    console.error('Failed to fetch user guilds:', (error as Error).message)
    return Response.json({ error: 'Failed to fetch user guilds' }, { status: 500 })
  }
})
```

**Step 4: Verify build, commit**

```bash
npx next build
git add app/api/users/
git commit -m "feat: extend user API with profile fields, delete, and guild memberships"
```

---

### Task 4: API Routes — Characters CRUD

**Files:**
- Create: `app/api/characters/route.ts`
- Create: `app/api/characters/[id]/route.ts`

**Step 1: Create list/create route**

`app/api/characters/route.ts`:

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeCharacter } from "@/lib/serializers"

export const GET = auth(async function GET(request) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const characters = await prisma.character.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(characters.map(serializeCharacter))
  } catch (error) {
    console.error('Failed to fetch characters:', (error as Error).message)
    return Response.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
})

export const POST = auth(async function POST(request) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    // Enforce max 20 characters
    const count = await prisma.character.count({
      where: { userId: session.user.id },
    })
    if (count >= 20) {
      return Response.json({ error: 'Maximum 20 characters allowed' }, { status: 400 })
    }

    const body = await request.json()
    const character = await prisma.character.create({
      data: {
        userId: session.user.id,
        name: body.name,
        race: body.race || null,
        charClass: body.charClass || null,
        subclass: body.subclass || null,
        level: body.level || 1,
        backstory: body.backstory || null,
      },
    })

    return Response.json(serializeCharacter(character), { status: 201 })
  } catch (error) {
    console.error('Failed to create character:', (error as Error).message)
    return Response.json({ error: 'Failed to create character' }, { status: 500 })
  }
})
```

**Step 2: Create single character route**

`app/api/characters/[id]/route.ts`:

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { serializeCharacter } from "@/lib/serializers"

export const GET = auth(async function GET(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    const character = await prisma.character.findUniqueOrThrow({
      where: { id: parseInt(id, 10) },
    })

    if (character.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json(serializeCharacter(character))
  } catch (error) {
    console.error('Failed to fetch character:', (error as Error).message)
    return Response.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
})

export const PATCH = auth(async function PATCH(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    const existing = await prisma.character.findUniqueOrThrow({
      where: { id: parseInt(id, 10) },
    })

    if (existing.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowed = ['name', 'race', 'charClass', 'subclass', 'level', 'backstory', 'avatarUrl']
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const character = await prisma.character.update({
      where: { id: parseInt(id, 10) },
      data,
    })

    return Response.json(serializeCharacter(character))
  } catch (error) {
    console.error('Failed to update character:', (error as Error).message)
    return Response.json({ error: 'Failed to update character' }, { status: 500 })
  }
})

export const DELETE = auth(async function DELETE(request, { params }) {
  const session = request.auth
  if (!session?.user) {
    return new Response(null, { status: 302, headers: { Location: '/' } })
  }

  try {
    const { id } = await params
    const existing = await prisma.character.findUniqueOrThrow({
      where: { id: parseInt(id, 10) },
    })

    if (existing.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.character.delete({ where: { id: parseInt(id, 10) } })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Failed to delete character:', (error as Error).message)
    return Response.json({ error: 'Failed to delete character' }, { status: 500 })
  }
})
```

**Step 3: Verify build, commit**

```bash
npx next build
git add app/api/characters/
git commit -m "feat: add characters CRUD API routes"
```

---

### Task 5: ThemeProvider Overhaul

**Files:**
- Modify: `app/providers/ThemeProvider.tsx`

**Step 1: Rewrite ThemeProvider**

The provider should load all settings from the user DB record. Add `data-particle` attribute and `--corona-intensity` CSS variable. Expose `updateSettings()` for the settings page.

Key changes from current implementation:
- Remove localStorage reads for themeName/themeMode
- Load all theme fields from user query (already fetched)
- Add `particleEffect` and `coronaIntensity` to state
- Set `data-particle` attribute on `<html>` (resolve "auto" to theme-matched value)
- Set `--corona-intensity` CSS variable
- Add `updateSettings(partial)` that applies changes live
- Add `saveSettings()` that persists to DB via mutation
- Keep localStorage as fallback only for unauthenticated users

Particle auto-mapping:
```typescript
const AUTO_PARTICLES: Record<string, string> = {
  parchment: 'ember',
  shadowfell: 'wisp',
  dragonfire: 'flame',
  feywild: 'sparkle',
}
```

The resolved particle value (after auto-mapping) should be set as `data-particle` on the HTML element. If particle is "off", set `data-particle="off"`.

**Step 2: Verify build, commit**

```bash
npx next build
git add app/providers/ThemeProvider.tsx
git commit -m "feat: overhaul ThemeProvider to persist settings to DB"
```

---

### Task 6: Decouple Particles from Theme

**Files:**
- Modify: `app/components/effects/CursorGlow.tsx`
- Modify: `app/components/effects/AmbientParticles.tsx`

**Step 1: Update CursorGlow**

Change `getThemeName()` to `getParticleType()`:

```typescript
function getParticleType(): string {
  return document.documentElement.getAttribute("data-particle") || "ember"
}
```

Update the MutationObserver to watch `data-particle` instead of (or in addition to) `data-theme`:

```typescript
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme", "data-mode", "data-particle"]
})
```

In the observer callback:
```typescript
const newParticle = document.documentElement.getAttribute("data-particle") || "ember"
particleType = newParticle
```

In the `animate` function, use `particleType` instead of `themeName`:
```typescript
const drawFn = THEME_DRAWERS[particleType] || drawEmber
```

If `data-particle="off"`, skip spawning particles entirely (don't push to `particlesRef`).

Rename `THEME_DRAWERS` to `PARTICLE_DRAWERS`:
```typescript
const PARTICLE_DRAWERS: Record<string, typeof drawEmber> = {
  ember: drawEmber,
  wisp: drawWisp,
  flame: drawFlame,
  sparkle: drawSparkle,
}
```

**Step 2: Update AmbientParticles**

Read `--corona-intensity` and use it as an opacity multiplier. Also respect `data-particle="off"` to disable ambient particles.

Add to the effect setup:
```typescript
let coronaIntensity = parseFloat(
  getComputedStyle(document.documentElement).getPropertyValue("--corona-intensity")
) || 0.8
```

Update the observer to also read intensity on change:
```typescript
const observer = new MutationObserver(() => {
  rgb = getCoronaRgb()
  coronaIntensity = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--corona-intensity")
  ) || 0.8
  const particle = document.documentElement.getAttribute("data-particle")
  if (particle === "off") { particles = []; return }
})
```

Multiply particle opacity by `coronaIntensity`:
```typescript
p.opacity = fadeIn * fadeOut * pulse * 0.35 * coronaIntensity
```

**Step 3: Verify build, commit**

```bash
npx next build
git add app/components/effects/
git commit -m "feat: decouple particle effects from theme, add corona intensity"
```

---

### Task 7: Color Wheel Component

**Files:**
- Create: `app/users/[id]/components/settings/ColorWheel.tsx`

**Step 1: Build HSL color wheel**

Create a custom canvas-based HSL color wheel component. The component renders:
1. A circular hue ring (outer ring showing all hues)
2. A square saturation/lightness picker in the center

Props:
```typescript
interface ColorWheelProps {
  color: string        // hex
  onChange: (hex: string) => void
}
```

Implementation approach:
- Use a single canvas element
- Draw the hue ring using `ctx.arc()` with HSL stops
- Draw the SL square using imageData pixel manipulation
- Handle mouse/touch events for both ring and square dragging
- Convert between HSL and hex using utility functions

Utility functions needed (inline in the component file):
```typescript
function hslToHex(h: number, s: number, l: number): string
function hexToHsl(hex: string): [number, number, number]
```

The component should display:
- The canvas (hue ring + SL square)
- A hex input below for direct entry
- A preview swatch showing the current color

Size: responsive, about 200-250px square on desktop.

**Step 2: Verify build, commit**

```bash
npx next build
git add app/users/[id]/components/settings/ColorWheel.tsx
git commit -m "feat: add custom HSL color wheel component"
```

---

### Task 8: Settings — Appearance Section

**Files:**
- Create: `app/users/[id]/components/settings/AppearanceSettings.tsx`

**Step 1: Build the appearance settings panel**

This component replaces the old ColorPicker. It contains:

1. **Theme presets** — 4 buttons (Parchment, Shadowfell, Dragonfire, Feywild) with color swatches. Selecting one updates all controls below with that theme's defaults.

2. **Primary color** — The ColorWheel component from Task 7. onChange updates the live preview.

3. **Particle effect** — Grid of 5 cards: Ember, Wisp, Flame, Sparkle, Off. Each card has an icon/label. "Auto" option that maps to theme default. Use radio-button-like selection.

4. **Corona intensity** — Range input (slider) from 0 to 1 with 0.1 steps. Label shows current value.

5. **Dark/Light mode** — Switch toggle.

6. **Save button** — Calls `saveSettings()` from ThemeProvider. Disabled when no unsaved changes.

All controls update the live preview immediately via `updateSettings()` from ThemeProvider.

Theme preset defaults:
```typescript
const THEME_DEFAULTS = {
  parchment:  { color: '#c8a44e', particle: 'auto', intensity: 0.8 },
  shadowfell: { color: '#8b5cf6', particle: 'auto', intensity: 0.7 },
  dragonfire: { color: '#dc4a4a', particle: 'auto', intensity: 0.8 },
  feywild:    { color: '#4ade80', particle: 'auto', intensity: 0.6 },
}
```

**Step 2: Verify build, commit**

```bash
npx next build
git add app/users/[id]/components/settings/AppearanceSettings.tsx
git commit -m "feat: add appearance settings with color wheel and particle picker"
```

---

### Task 9: Settings — Profile & Account Sections

**Files:**
- Create: `app/users/[id]/components/settings/ProfileSettings.tsx`
- Create: `app/users/[id]/components/settings/AccountSettings.tsx`
- Modify: `app/users/[id]/settings/page.tsx`

**Step 1: Profile settings**

`ProfileSettings.tsx` — A GlassPanel with:
- Display name input (text, max 50 chars, defaultValue from user data)
- Bio textarea (max 280 chars, character counter, defaultValue from user data)
- Avatar display (read-only Image from user.image)
- Save button that calls `updateUser(userId, { name, bio })`

**Step 2: Account settings**

`AccountSettings.tsx` — A GlassPanel with:
- Email display (read-only)
- Connected account display (show provider from Account relation — may need to fetch separately or include in user query. For now, just show "Discord" since that's the only provider.)
- Danger zone: Delete account button (red variant)
- Delete confirmation dialog (using shadcn AlertDialog):
  - Lists what will happen (guild transfers, deletions)
  - Requires typing "DELETE" to confirm
  - Calls `deleteUser(userId)` then `signOut()`

**Step 3: Update settings page**

Replace `app/users/[id]/settings/page.tsx` to render all three sections:

```typescript
import AppearanceSettings from "../components/settings/AppearanceSettings"
import ProfileSettings from "../components/settings/ProfileSettings"
import AccountSettings from "../components/settings/AccountSettings"

export default async function Settings({ params }) {
  const { id } = await params
  return (
    <div className="flex flex-col gap-6 w-full">
      <AppearanceSettings userId={id} />
      <ProfileSettings userId={id} />
      <AccountSettings userId={id} />
    </div>
  )
}
```

**Step 4: Delete old ColorPicker component**

Remove `app/users/[id]/components/settings/ColorPicker.tsx` and uninstall `react-color-palette`:

```bash
npm uninstall react-color-palette
```

**Step 5: Verify build, commit**

```bash
npx next build
git add app/users/[id]/components/settings/ app/users/[id]/settings/page.tsx package.json package-lock.json
git commit -m "feat: add profile and account settings, replace color picker"
```

---

### Task 10: Profile Dashboard Overhaul

**Files:**
- Modify: `app/users/[id]/components/user/UserComponent.tsx`
- Modify: `app/users/[id]/components/user/UserProfile.tsx`
- Modify: `app/users/[id]/page.tsx`

**Step 1: Update UserComponent to show bio**

Add bio text below the name in the header:

```typescript
<div>
  <h1 className="font-cinzel text-2xl">{user.name}</h1>
  {user.bio && (
    <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
  )}
</div>
```

**Step 2: Rewrite UserProfile as dashboard**

The profile page becomes a dashboard with three sections:

1. **Character Roster** — Horizontal scroll of character cards. Fetch via `fetchCharacters()`. Each card shows name, race/class, level. "Add Character" card at end links to `/characters`.

2. **Guild Memberships** — Grid of guild cards with role badges. Uses the fixed `fetchGuildsByUser()` that now returns memberships with roles.

3. **Recent Activity** — Placeholder GlassPanel.

**Step 3: Verify build, commit**

```bash
npx next build
git add app/users/[id]/
git commit -m "feat: overhaul profile dashboard with character roster and guilds"
```

---

### Task 11: Characters Pages

**Files:**
- Create: `app/characters/page.tsx`
- Create: `app/characters/layout.tsx`
- Create: `app/characters/components/CharacterCard.tsx`
- Create: `app/characters/components/CharacterForm.tsx`
- Create: `app/characters/[id]/page.tsx`
- Create: `app/characters/[id]/layout.tsx`
- Create: `app/characters/[id]/components/CharacterBanner.tsx`
- Create: `app/characters/[id]/components/CharacterNav.tsx`

**Step 1: Character list page**

`app/characters/layout.tsx` — Simple layout wrapper with padding and max-width (match guilds pattern).

`app/characters/page.tsx` — Auth-gated page that:
- Fetches characters via React Query
- Renders a grid of CharacterCard components
- Has a "Create Character" card that opens CharacterForm dialog

**Step 2: CharacterCard component**

A GlassPanel card showing:
- Character name (font-cinzel)
- Race + Class on one line
- Level badge
- Links to `/characters/[id]`

**Step 3: CharacterForm component**

A Dialog/Sheet containing a form with:
- Name (required text input)
- Race (text input)
- Class (text input)
- Subclass (text input, shown only when class is filled)
- Level (number input, 1-20, with preventNonNumeric)
- Backstory (textarea)
- Submit creates via mutation, invalidates query

Use for both create and edit (pass optional `character` prop for edit mode).

**Step 4: Character detail page**

`app/characters/[id]/layout.tsx` — Fetches character, provides via context or passes to children.

`app/characters/[id]/page.tsx` — Shows:
- CharacterBanner (name, race, class, level, large display)
- Backstory section
- Edit button that opens CharacterForm in edit mode
- Delete button with confirmation

`CharacterNav.tsx` — Tab nav with just "Overview" for Wave 1. Placeholder for Wave 2 tabs (Stats, Spells, Inventory).

**Step 5: Verify build, commit**

```bash
npx next build
git add app/characters/
git commit -m "feat: add characters list and detail pages"
```

---

### Task 12: Navigation Update

**Files:**
- Modify: `app/components/navigation/DesktopSidebar.tsx`
- Modify: `app/components/navigation/MobileNav.tsx`

**Step 1: Add Characters to sidebar**

Add to `authRoutes` in both files:

```typescript
import { Shield, Sword } from "lucide-react"

const authRoutes = [
  { title: "Guilds", path: "/guilds", icon: Shield },
  { title: "Characters", path: "/characters", icon: Sword },
]
```

Use the `Sword` icon from lucide-react for characters (thematic for D&D).

**Step 2: Verify build, commit**

```bash
npx next build
git add app/components/navigation/
git commit -m "feat: add Characters to sidebar navigation"
```

---

### Task 13: Guilds Tab Fix

**Files:**
- Modify: `app/users/[id]/guilds/page.tsx`

**Step 1: Rewrite guilds tab**

Replace the current implementation that uses `GuildsTable` with a dedicated view showing all memberships with role badges:

```typescript
"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { useUser } from "../providers/UserProvider"
import { fetchGuildsByUser } from "@/lib/users"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Shield, Crown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function Guilds() {
  const user = useUser()

  const { data: guilds = [], isLoading } = useQuery({
    queryKey: ['userGuilds', user.id],
    queryFn: () => fetchGuildsByUser(user.id),
  })

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading guilds...</p>

  if (guilds.length === 0) {
    return (
      <GlassPanel variant="subtle" className="w-full p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">No guild memberships yet</p>
        <Link href="/guilds" className="text-sm text-primary hover:underline">Browse guilds</Link>
      </GlassPanel>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {guilds.map((guild) => (
        <Link key={guild.guild_id} href={`/guilds/${guild.guild_id}`}>
          <GlassPanel coronaHover className="p-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors">
            <Shield className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{guild.name}</p>
                {guild.is_owner && <Crown className="h-3.5 w-3.5 text-primary shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: guild.role.color, color: guild.role.color }}
                >
                  {guild.role.name}
                </Badge>
                <span className="text-xs text-muted-foreground">{guild.member_count} members</span>
              </div>
            </div>
          </GlassPanel>
        </Link>
      ))}
    </div>
  )
}
```

This is now a client component (needs `useQuery`), so change it from a server component page to a client component. The page file itself can remain simple:

```typescript
import GuildsView from "../components/GuildsView"

export default async function Guilds() {
  return <GuildsView />
}
```

Or just make the page itself the client component directly.

**Step 2: Verify build, commit**

```bash
npx next build
git add app/users/[id]/guilds/
git commit -m "feat: fix guilds tab to show all memberships with role badges"
```

---

### Task 14: Final Integration & Cleanup

**Files:**
- Modify: `app/users/[id]/components/nav/UserNav.tsx` (remove Characters tab if it was never there — it lives at /characters not under /users)
- Modify: `app/users/[id]/providers/UserProvider.tsx` (ensure it returns serialized user data consistently)

**Step 1: Update UserProvider**

The user provider should use `serializeUser` format. Since the API now returns serialized data, just ensure the provider types match:

```typescript
'use client'

import { createContext, useContext } from "react"
import { fetchUser } from "@/lib/users"
import { useQuery } from "@tanstack/react-query"

interface UserData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  color: string | null
  bio: string | null
  theme_name: string
  theme_mode: string
  particle_effect: string
  corona_intensity: number
}

const UserContext = createContext<UserData | null>(null)

export function UserProvider({ userId, children }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  })

  if (isLoading) return <div>Loading user data...</div>
  if (error) throw new Error(`Error: ${error.message}`)

  return (
    <UserContext.Provider value={data}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserData {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
```

**Step 2: Fix ThemeProvider user data consumption**

The current ThemeProvider reads `user[0].color` because the old API returned `[data]`. Since we changed the API to return `serializeUser(user)` (a single object), update ThemeProvider to read `user.color`, `user.theme_name`, etc. directly.

**Step 3: Run full build verification**

```bash
npx next build
```

**Step 4: Final commit**

```bash
git add .
git commit -m "feat: integrate user profile overhaul and fix data flow"
```

---

## Dependency Graph

```
Task 1 (DB migration)
  └─► Task 2 (serializers + lib)
       ├─► Task 3 (user API)
       │    └─► Task 5 (ThemeProvider)
       │         ├─► Task 6 (effects)
       │         └─► Task 8 (appearance settings)
       │              └─► Task 9 (profile + account settings)
       ├─► Task 4 (characters API)
       │    └─► Task 11 (characters pages)
       │         └─► Task 12 (navigation)
       └─► Task 10 (profile dashboard) [depends on Tasks 4 + 3]
            └─► Task 13 (guilds tab)
                 └─► Task 14 (integration)
```

Tasks 4-6 and 7-8 can run in parallel after Task 3 completes.

## File Summary

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add User fields + Character model |
| `prisma/migrations/*/migration.sql` | New columns + characters table |
| `lib/serializers.ts` | Add serializeUser, serializeCharacter |
| `lib/users.ts` | Extend updateUser, add deleteUser |
| `lib/characters.ts` | **New** — CRUD fetch wrappers |
| `app/api/users/[id]/route.ts` | Extend PATCH, add DELETE |
| `app/api/users/[id]/guilds/route.ts` | Return memberships with roles |
| `app/api/characters/route.ts` | **New** — GET/POST |
| `app/api/characters/[id]/route.ts` | **New** — GET/PATCH/DELETE |
| `app/providers/ThemeProvider.tsx` | DB-backed settings, data-particle |
| `app/components/effects/CursorGlow.tsx` | Read data-particle |
| `app/components/effects/AmbientParticles.tsx` | Read corona intensity |
| `app/users/[id]/settings/page.tsx` | Render 3 settings sections |
| `app/users/[id]/components/settings/ColorWheel.tsx` | **New** — HSL canvas wheel |
| `app/users/[id]/components/settings/AppearanceSettings.tsx` | **New** — full appearance UI |
| `app/users/[id]/components/settings/ProfileSettings.tsx` | **New** — name/bio form |
| `app/users/[id]/components/settings/AccountSettings.tsx` | **New** — account + delete |
| `app/users/[id]/components/settings/ColorPicker.tsx` | **Delete** |
| `app/users/[id]/components/user/UserComponent.tsx` | Show bio |
| `app/users/[id]/components/user/UserProfile.tsx` | Dashboard with roster + guilds |
| `app/users/[id]/guilds/page.tsx` | Memberships with role badges |
| `app/users/[id]/providers/UserProvider.tsx` | Typed user data |
| `app/characters/page.tsx` | **New** — character list |
| `app/characters/layout.tsx` | **New** — layout wrapper |
| `app/characters/[id]/page.tsx` | **New** — character detail |
| `app/characters/[id]/layout.tsx` | **New** — detail layout |
| `app/characters/components/CharacterCard.tsx` | **New** |
| `app/characters/components/CharacterForm.tsx` | **New** |
| `app/characters/[id]/components/CharacterBanner.tsx` | **New** |
| `app/characters/[id]/components/CharacterNav.tsx` | **New** |
| `app/components/navigation/DesktopSidebar.tsx` | Add Characters route |
| `app/components/navigation/MobileNav.tsx` | Add Characters route |
