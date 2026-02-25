# Guild Visibility & Join Requests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add public/private guild visibility, a discovery page, a join request system with configurable expiry, restructure the guilds hub into a tabbed layout, redesign the members page with role grouping and pending requests, and add user timezone support.

**Architecture:** Hybrid approach -- `JoinRequest` is a separate model from `GuildMember`. Requests live independently; approval creates a `GuildMember` in a transaction. Guild visibility is a simple string field. The `/guilds` page becomes a tabbed hub (Overview / My Guilds / Discover). The members page gets tabs (Members / Pending) with role-grouped member lists.

**Tech Stack:** Next.js, Prisma, PostgreSQL, TanStack React Query, Tailwind CSS, shadcn/ui, GlassPanel components.

---

## Task 1: Schema Changes -- Guild Fields

**Files:**
- Modify: `prisma/schema.prisma` (Guild model, lines 77-89)
- Modify: `lib/serializers.ts:63-77` (serializeGuild, serializeGuildWithOwner)
- Modify: `lib/guilds.ts` (Guild interface)

**Step 1: Add new fields to Guild model in schema.prisma**

Add these fields to the Guild model, before the relations:

```prisma
  description     String?
  visibility      String   @default("private")
  defaultRoleId   Int?     @map("default_role_id")
  requestExpiryDays Int?   @default(7) @map("request_expiry_days")
```

**Step 2: Add the JoinRequest model to schema.prisma**

Add after the GuildMap model:

```prisma
model JoinRequest {
  id         Int       @id @default(autoincrement())
  guildId    String    @map("guild_id")
  userId     String    @map("user_id")
  message    String?
  status     String    @default("pending")
  reviewedBy String?   @map("reviewed_by")
  reviewedAt DateTime? @map("reviewed_at")
  expiresAt  DateTime? @map("expires_at")
  createdAt  DateTime  @default(now()) @map("created_at")

  guild    Guild @relation(fields: [guildId], references: [guildId], onDelete: Cascade)
  user     User  @relation("JoinRequestUser", fields: [userId], references: [id], onDelete: Cascade)
  reviewer User? @relation("JoinRequestReviewer", fields: [reviewedBy], references: [id])

  @@index([guildId, status])
  @@map("join_requests")
}
```

Add the relation arrays to the Guild model:

```prisma
  joinRequests JoinRequest[]
```

Add the relation arrays to the User model:

```prisma
  joinRequests         JoinRequest[] @relation("JoinRequestUser")
  reviewedJoinRequests JoinRequest[] @relation("JoinRequestReviewer")
```

**Step 3: Add timezone field to User model in schema.prisma**

Add to the User model alongside the other settings fields:

```prisma
  timezone        String   @default("UTC")
```

**Step 4: Run migration**

```bash
npx prisma migrate dev --name add_guild_visibility_join_requests
```

**Step 5: Update serializeGuild in lib/serializers.ts**

Update both `serializeGuild` and `serializeGuildWithOwner` to include the new fields:

```typescript
export function serializeGuild(g: Guild) {
  return {
    id: g.id,
    guild_id: g.guildId,
    name: g.name,
    owner: g.ownerId,
    description: g.description,
    visibility: g.visibility,
    default_role_id: g.defaultRoleId,
    request_expiry_days: g.requestExpiryDays,
  }
}

export function serializeGuildWithOwner(g: Guild & { ownerUser: { name: string | null } }) {
  return {
    id: g.id,
    guild_id: g.guildId,
    name: g.name,
    owner: { name: g.ownerUser.name },
    description: g.description,
    visibility: g.visibility,
    default_role_id: g.defaultRoleId,
    request_expiry_days: g.requestExpiryDays,
  }
}
```

Add a new serializer for JoinRequest:

```typescript
export function serializeJoinRequest(r: JoinRequest & { user: Pick<User, "id" | "name" | "image"> }) {
  return {
    id: r.id,
    guild_id: r.guildId,
    user_id: r.userId,
    user: { id: r.user.id, name: r.user.name, image: r.user.image },
    message: r.message,
    status: r.status,
    reviewed_by: r.reviewedBy,
    reviewed_at: r.reviewedAt,
    expires_at: r.expiresAt,
    created_at: r.createdAt,
  }
}
```

Add `JoinRequest` to the import at the top of the file.

Also add `timezone` to the `serializeUser` function return:

```typescript
timezone: u.timezone,
```

**Step 6: Update Guild interface in lib/guilds.ts**

Add new fields to the Guild interface:

```typescript
export interface Guild {
  id: number
  timestamp?: string
  owner?: UUID
  name: string
  guild_id?: UUID
  description?: string | null
  visibility?: string
  default_role_id?: number | null
  request_expiry_days?: number | null
}
```

**Step 7: Update guild creation to set defaultRoleId**

In `app/api/guilds/route.ts`, after creating the Adventurer role in the transaction, save the Adventurer role and set it as the default:

```typescript
const adventurer = await tx.guildRole.create({
  data: {
    guildId: newGuild.guildId,
    name: "Adventurer",
    // ... existing fields
  },
})

// After creating the member, update guild with default role
await tx.guild.update({
  where: { id: newGuild.id },
  data: { defaultRoleId: adventurer.id },
})
```

**Step 8: Commit**

```bash
git add prisma/ lib/serializers.ts lib/guilds.ts app/api/guilds/route.ts
git commit -m "feat: add guild visibility, join request model, and user timezone schema"
```

---

## Task 2: Guild API Updates

**Files:**
- Modify: `app/api/guilds/route.ts` (GET -- filter to user's guilds)
- Modify: `app/api/guilds/[guild_id]/route.ts` (PATCH -- accept new fields)
- Create: `app/api/guilds/discover/route.ts`
- Modify: `lib/guilds.ts` (add updateGuild params, add fetchDiscoverGuilds)

**Step 1: Update GET /api/guilds to return only user's guilds**

In `app/api/guilds/route.ts`, change the GET handler:

```typescript
const guilds = await prisma.guild.findMany({
  where: {
    members: {
      some: { userId: session.user.id },
    },
  },
})
```

**Step 2: Update PATCH /api/guilds/{guild_id} to accept new fields**

In `app/api/guilds/[guild_id]/route.ts`, update the PATCH handler to accept and apply the new fields (`description`, `visibility`, `defaultRoleId`, `requestExpiryDays`) using the same spread pattern already used.

**Step 3: Create GET /api/guilds/discover**

Create `app/api/guilds/discover/route.ts`:

```typescript
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const GET = auth(async function GET(request) {
  const session = request.auth
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const page = parseInt(url.searchParams.get("page") || "1")
    const limit = 12

    const where = {
      visibility: "public",
      members: { none: { userId: session.user.id! } },
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [guilds, total] = await Promise.all([
      prisma.guild.findMany({
        where,
        include: {
          ownerUser: { select: { name: true } },
          _count: { select: { members: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { members: { _count: "desc" } },
      }),
      prisma.guild.count({ where }),
    ])

    // Check if user has a pending request for any of these guilds
    const pendingRequests = await prisma.joinRequest.findMany({
      where: {
        userId: session.user.id!,
        guildId: { in: guilds.map(g => g.guildId) },
        status: "pending",
      },
      select: { guildId: true },
    })
    const pendingSet = new Set(pendingRequests.map(r => r.guildId))

    return Response.json({
      guilds: guilds.map(g => ({
        id: g.id,
        guild_id: g.guildId,
        name: g.name,
        description: g.description,
        owner: { name: g.ownerUser.name },
        member_count: g._count.members,
        has_pending_request: pendingSet.has(g.guildId),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Failed to fetch discover guilds:", (error as Error).message)
    return Response.json({ error: "Failed to fetch guilds" }, { status: 500 })
  }
})
```

**Step 4: Add client functions in lib/guilds.ts**

```typescript
export async function fetchDiscoverGuilds(search = "", page = 1) {
  const params = new URLSearchParams({ search, page: String(page) })
  const response = await fetch(`/api/guilds/discover?${params}`)
  if (!response.ok) throw new Error("Failed to fetch discover guilds")
  return response.json()
}
```

Also update `updateGuild` parameter type to accept the new fields:

```typescript
export async function updateGuild(guildId: UUID, guildData: {
  name?: string; description?: string; visibility?: string;
  defaultRoleId?: number | null; requestExpiryDays?: number | null;
}) {
```

**Step 5: Commit**

```bash
git add app/api/guilds/ lib/guilds.ts
git commit -m "feat: add discover endpoint, filter guilds to user's guilds"
```

---

## Task 3: Join Request API

**Files:**
- Create: `app/api/guilds/[guild_id]/requests/route.ts`
- Create: `app/api/guilds/[guild_id]/requests/[request_id]/route.ts`
- Create: `lib/join-requests.ts`

**Step 1: Create POST + GET for /api/guilds/{guild_id}/requests**

Create `app/api/guilds/[guild_id]/requests/route.ts`:

POST handler:
- Auth required
- Validate guild exists and is public
- Validate user is not already a member
- Validate no pending request exists for this user+guild
- Compute `expiresAt` from `guild.requestExpiryDays` (null if no expiry)
- Create JoinRequest with status "pending"
- Return serialized request

GET handler:
- Auth required + `manage_members` permission
- Query pending requests with user info (name, image)
- Before returning: bulk-update any expired requests (`expiresAt < now()` AND status still `pending`) to `status: "expired"`
- Return serialized requests with optional `status` query param filter

**Step 2: Create PATCH for /api/guilds/{guild_id}/requests/{request_id}**

Create `app/api/guilds/[guild_id]/requests/[request_id]/route.ts`:

PATCH handler:
- Auth required + `manage_members` permission
- Accept `{ status: "approved" | "denied" }`
- If approving: transaction -- create GuildMember with `guild.defaultRoleId` (fallback: highest-position role), set request status/reviewedBy/reviewedAt
- If denying: set status/reviewedBy/reviewedAt
- Return serialized request

**Step 3: Create client library lib/join-requests.ts**

```typescript
import { UUID } from "@/utils/types"

export interface JoinRequest {
  id: number
  guild_id: UUID
  user_id: UUID
  user: { id: string; name: string | null; image: string | null }
  message: string | null
  status: string
  reviewed_by: string | null
  reviewed_at: string | null
  expires_at: string | null
  created_at: string
}

export async function submitJoinRequest(guildId: UUID, message?: string) {
  const response = await fetch(`/api/guilds/${guildId}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || "Failed to submit request")
  }
  return response.json()
}

export async function fetchJoinRequests(guildId: UUID, status?: string) {
  const params = status ? `?status=${status}` : ""
  const response = await fetch(`/api/guilds/${guildId}/requests${params}`)
  if (!response.ok) throw new Error("Failed to fetch requests")
  return response.json() as Promise<JoinRequest[]>
}

export async function reviewJoinRequest(guildId: UUID, requestId: number, status: "approved" | "denied") {
  const response = await fetch(`/api/guilds/${guildId}/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error("Failed to review request")
  return response.json()
}
```

**Step 4: Commit**

```bash
git add app/api/guilds/[guild_id]/requests/ lib/join-requests.ts
git commit -m "feat: add join request API routes and client library"
```

---

## Task 4: User Timezone

**Files:**
- Modify: `app/api/users/[id]/route.ts:43` (add timezone to allowed fields)
- Modify: `lib/users.ts` (add timezone to UserData type if exists)
- Modify: `app/users/[id]/components/settings/AccountSettings.tsx` (add timezone selector)
- Create: `app/hooks/useTimezoneSync.ts` (auto-detect hook)
- Modify: `app/layout.tsx` (mount timezone sync)

**Step 1: Add timezone to user PATCH whitelist**

In `app/api/users/[id]/route.ts`, add `'timezone'` to the `allowed` array on line 43.

**Step 2: Create timezone auto-detect hook**

Create `app/hooks/useTimezoneSync.ts`:

```typescript
"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { updateUser } from "@/lib/users"

export function useTimezoneSync() {
  const { data: session } = useSession()

  useEffect(() => {
    if (!session?.user?.id) return
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected && detected !== "UTC") {
      updateUser(session.user.id, { timezone: detected }).catch(() => {})
    }
  }, [session?.user?.id])
}
```

**Step 3: Mount timezone sync in a client wrapper**

Create a small client component `app/components/TimezoneSync.tsx`:

```typescript
"use client"

import { useTimezoneSync } from "@/app/hooks/useTimezoneSync"

export function TimezoneSync() {
  useTimezoneSync()
  return null
}
```

Add `<TimezoneSync />` inside the `<SessionProvider>` in `app/layout.tsx`.

**Step 4: Add timezone selector to AccountSettings**

In `app/users/[id]/components/settings/AccountSettings.tsx`, add a timezone section between the account info and the danger zone. Use a searchable `<Select>` with common IANA timezones. Persist via `updateUser(userId, { timezone })`.

Use `Intl.supportedValuesOf('timeZone')` to get the full list of IANA timezones (supported in modern browsers and Node 18+).

**Step 5: Commit**

```bash
git add app/api/users/ app/hooks/ app/components/TimezoneSync.tsx app/layout.tsx app/users/
git commit -m "feat: add user timezone with auto-detect and settings selector"
```

---

## Task 5: Guilds Hub Redesign -- Page Structure

**Files:**
- Modify: `app/guilds/page.tsx` (becomes hub with tabs)
- Create: `app/guilds/my/page.tsx` (My Guilds tab content)
- Create: `app/guilds/discover/page.tsx` (Discover tab content)
- Create: `app/guilds/components/GuildsNav.tsx` (tab navigation)
- Create: `app/guilds/layout.tsx` (shared layout with nav)

**Step 1: Create GuildsNav component**

Create `app/guilds/components/GuildsNav.tsx` -- a pill nav following the same pattern as `app/guilds/[id]/components/GuildNav.tsx` and `app/users/[id]/components/nav/UserNav.tsx`:

```typescript
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { GlassPanel } from "@/app/components/ui/GlassPanel"

const routes = [
  { path: "/guilds", label: "Overview", exact: true },
  { path: "/guilds/my", label: "My Guilds" },
  { path: "/guilds/discover", label: "Discover" },
]

export default function GuildsNav() {
  const pathname = usePathname()

  function isActive(route: typeof routes[0]) {
    if (route.exact) return pathname === route.path
    return pathname.startsWith(route.path)
  }

  return (
    <GlassPanel variant="subtle" className="w-full rounded-full p-1.5">
      <nav className="flex gap-1 justify-center">
        {routes.map((route) => {
          const active = isActive(route)
          return (
            <Link
              key={route.path}
              className={`px-3 py-2 sm:px-4 text-sm font-medium rounded-full transition-all whitespace-nowrap
                ${active
                  ? "bg-white/[0.08] text-primary shadow-[0_0_12px_rgba(var(--corona-rgb),0.4)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              href={route.path}
            >
              {route.label}
            </Link>
          )
        })}
      </nav>
    </GlassPanel>
  )
}
```

**Step 2: Create guilds layout**

Create `app/guilds/layout.tsx`:

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import GuildsNav from "./components/GuildsNav"

export default async function GuildsLayout({ children }) {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <div className="flex justify-center p-4 overflow-x-hidden">
      <div className="max-w-5xl w-full min-w-0 flex flex-col gap-4">
        <h1 className="font-cinzel text-3xl text-foreground tracking-wide">Guilds</h1>
        <GuildsNav />
        {children}
      </div>
    </div>
  )
}
```

**Step 3: Rewrite /guilds overview page**

Rewrite `app/guilds/page.tsx` as the Overview tab -- dashboard with activity feed, user's guilds summary (top 3-4 with "See all" link), and placeholder sections:

- Use server component, get session
- Pass userId to client components
- Show: Welcome section, top guilds (GuildsTable with limit), activity feed, placeholder for trending/events
- Follow the same GlassPanel card pattern as the home dashboard (`app/page.tsx`)

Remove the CreateGuild and full GuildsTable from this page.

**Step 4: Create /guilds/my page**

Create `app/guilds/my/page.tsx`:

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CreateGuild from "../components/CreateGuild"
import GuildsTable from "../components/GuildsTable"

export default async function MyGuilds() {
  const session = await auth()
  if (!session?.user) redirect("/")

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CreateGuild userId={session.user.id} />
        <GuildsTable userId={session.user.id} />
      </div>
    </div>
  )
}
```

**Step 5: Commit**

```bash
git add app/guilds/
git commit -m "feat: restructure guilds hub with tabbed layout (overview, my guilds)"
```

---

## Task 6: Discover Page

**Files:**
- Create: `app/guilds/discover/page.tsx`
- Create: `app/guilds/discover/components/DiscoverGrid.tsx`
- Create: `app/guilds/discover/components/JoinRequestDialog.tsx`

**Step 1: Create DiscoverGrid component**

Client component using React Query to fetch from `/api/guilds/discover`. Displays a grid of GlassPanel cards. Each card shows: guild name, description (truncated), member count, owner name. Shows "Request to Join" button or "Request Pending" disabled state based on `has_pending_request`. Includes a search Input at the top.

**Step 2: Create JoinRequestDialog**

Dialog component (using the existing Dialog from `components/ui/dialog.tsx`):
- Opens when "Request to Join" is clicked
- Shows guild name
- Textarea for optional message
- Submit button calling `submitJoinRequest(guildId, message)`
- On success: close dialog, invalidate discover query to update button state

**Step 3: Create the discover page**

Create `app/guilds/discover/page.tsx` as a server component that renders `<DiscoverGrid />`.

**Step 4: Commit**

```bash
git add app/guilds/discover/
git commit -m "feat: add guild discover page with search and join request dialog"
```

---

## Task 7: Members Page Redesign

**Files:**
- Modify: `app/guilds/[id]/members/page.tsx`
- Create: `app/guilds/[id]/members/components/MembersTab.tsx`
- Create: `app/guilds/[id]/members/components/PendingTab.tsx`
- Create: `app/guilds/[id]/members/components/MembersNav.tsx`
- Modify: `app/guilds/[id]/components/GuildMembers.tsx` (refactor into role-grouped layout)

**Step 1: Create MembersNav**

Pill nav with "Members" and "Pending" tabs. "Pending" tab shows a badge count of pending requests. Only show "Pending" to users with `manage_members` permission. Use the `useGuild()` context for permission checks.

Pattern: Follow `GuildNav.tsx` style. Use query params or nested routes -- recommend nested routes: `/guilds/{id}/members` and `/guilds/{id}/members/pending`.

**Step 2: Redesign MembersTab with role grouping**

Refactor `GuildMembers.tsx` to group members by role:
- Sort roles by position (lowest first = highest rank)
- For each role that has members, render a section with:
  - Role header: color dot + role name + member count
  - Grid of member cards underneath (existing card style)
- Use the `rolesData` and `membersData` from `useGuild()`

**Step 3: Create PendingTab**

Create `app/guilds/[id]/members/components/PendingTab.tsx`:
- Fetch pending requests via `fetchJoinRequests(guildId, "pending")`
- Display request cards: user avatar, name, message (if any), submitted time (relative), expires in X days
- Approve/Deny buttons on each card
- Use `reviewJoinRequest()` mutations with React Query
- On approve: invalidate both requests and members queries
- Empty state: "No pending requests"

**Step 4: Update members page**

Modify `app/guilds/[id]/members/page.tsx` to include MembersNav and render the appropriate tab content. Could use a client-side tab state or nested routes.

Recommended approach: Client-side tabs (simpler, no extra routes):

```typescript
"use client"
import { useState } from "react"
import MembersNav from "./components/MembersNav"
import MembersTab from "./components/MembersTab"
import PendingTab from "./components/PendingTab"
import { useGuild } from "../providers/GuildProvider"

export default function MembersPage({ params }) {
  const [tab, setTab] = useState<"members" | "pending">("members")
  // ... render MembersNav + active tab
}
```

**Step 5: Commit**

```bash
git add app/guilds/[id]/members/ app/guilds/[id]/components/GuildMembers.tsx
git commit -m "feat: redesign members page with role grouping and pending requests tab"
```

---

## Task 8: Guild Settings -- Membership Section

**Files:**
- Modify: `app/guilds/[id]/components/GuildSettings.tsx`

**Step 1: Add Membership section to GuildSettings**

Add a new GlassPanel section between "General" and "Roles" with:

1. **Visibility toggle**: Switch component (public/private). Calls `updateGuild(guildId, { visibility })`.
2. **Description**: Textarea for guild description. Save button. Calls `updateGuild(guildId, { description })`.
3. **Default Join Role**: Select dropdown populated from `rolesData`. Shows role name + color. Calls `updateGuild(guildId, { defaultRoleId })`.
4. **Request Expiry**: Number input for days (min 1, or empty/null for no expiry). Calls `updateGuild(guildId, { requestExpiryDays })`.

Use the same mutation pattern as the existing rename mutation. Can use a single form or individual save buttons per field -- recommend individual saves for better UX (no lost state).

Initialize state from `guildData` context (which now includes the new fields from the updated serializer).

**Step 2: Update GuildProvider to expose new guild fields**

In `app/guilds/[id]/providers/GuildProvider.tsx`, ensure the `guildData` from the query includes the new fields. No code changes needed since the serializer already returns them and the provider passes the full response.

**Step 3: Commit**

```bash
git add app/guilds/[id]/components/GuildSettings.tsx
git commit -m "feat: add membership settings (visibility, description, default role, expiry)"
```

---

## Task 9: Integration & Polish

**Files:**
- Modify: `app/guilds/[id]/components/GuildNav.tsx` (pending badge)
- Modify: `app/guilds/components/GuildsTable.tsx` (add description display)
- Various component touch-ups

**Step 1: Add pending count badge to guild Members nav**

In `GuildNav.tsx`, for the "Members" route, add a small badge showing pending request count. Fetch count via a lightweight query or expose from GuildProvider.

**Step 2: Update GuildsTable to show description**

In `GuildsTable.tsx`, display `guild.description` (truncated) below the owner info if it exists.

**Step 3: Update the guilds overview page**

Wire up the overview page with:
- User's guild summary (limit to 3-4, link to "My Guilds" tab)
- Activity feed (reuse existing `ActivityFeed` component)
- Placeholder sections for future features (trending guilds, upcoming events)

**Step 4: Build and verify**

```bash
npx next build
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: polish guild visibility integration, badges, and overview page"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Schema changes (Guild fields, JoinRequest model, User timezone) | None |
| 2 | Guild API updates (discover endpoint, PATCH updates) | Task 1 |
| 3 | Join Request API (POST/GET/PATCH routes, client lib) | Task 1 |
| 4 | User timezone (API whitelist, auto-detect, settings UI) | Task 1 |
| 5 | Guilds hub restructure (layout, nav, overview/my pages) | Task 2 |
| 6 | Discover page (grid, search, join dialog) | Tasks 2, 3 |
| 7 | Members page redesign (role grouping, pending tab) | Task 3 |
| 8 | Guild settings -- membership section | Task 2 |
| 9 | Integration and polish | Tasks 5-8 |

Tasks 2, 3, and 4 can run in parallel after Task 1.
Tasks 5 and 8 can run in parallel after Task 2.
Tasks 6 and 7 can run in parallel after Task 3.
