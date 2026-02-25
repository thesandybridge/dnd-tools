# Guild Visibility & Join Requests Design

## Summary

Add public/private guild visibility, a guild discovery page, a join request system with configurable expiry, and restructure the guilds hub and members page. Guilds are private by default. Public guilds appear in a Discover tab for all signed-in users. Users can request to join with a message. Guild managers approve/deny requests in a Pending tab on the Members page. Approved members receive the guild's configured default role.

## Data Model

### Guild -- New Fields

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `visibility` | String | `"private"` | `"private"` or `"public"` |
| `description` | String? | null | Shown on Discover cards |
| `defaultRoleId` | Int? → GuildRole | null | Role assigned on approval. Falls back to lowest-position role if null. Set to Adventurer role during guild creation. |
| `requestExpiryDays` | Int? | 7 | Days before pending requests expire. Null = no expiry. |

### New Model: JoinRequest

| Field | Type | Notes |
|-------|------|-------|
| `id` | Int (auto) | Primary key |
| `guildId` | String → Guild | FK |
| `userId` | String → User | FK (the requester) |
| `message` | String? | Message from the requester |
| `status` | String | `"pending"`, `"approved"`, `"denied"`, `"expired"` |
| `reviewedBy` | String? → User | Who approved/denied |
| `reviewedAt` | DateTime? | When reviewed |
| `expiresAt` | DateTime? | Computed: `createdAt + guild.requestExpiryDays`. Null if guild has no expiry. |
| `createdAt` | DateTime | Request submission time |

- Unique constraint: one pending request per user per guild (enforced at application level before insert)
- Index on `(guildId, status)` for efficient pending queries

### User -- New Field

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `timezone` | String | `"UTC"` | IANA timezone identifier (e.g. `"America/New_York"`) |

Auto-detected from browser on first login via `Intl.DateTimeFormat().resolvedOptions().timeZone`.

### GuildMember -- No Changes

Members are always real members. Join requests are a separate model.

## API Design

### Guild Changes

- `PATCH /api/guilds/{guild_id}` -- accepts: `visibility`, `description`, `defaultRoleId`, `requestExpiryDays`
- `GET /api/guilds` -- returns user's guilds only (existing behavior)
- `GET /api/guilds/discover` -- new. Returns public guilds user is NOT a member of. Includes member count, owner name. Paginated.

### Join Request Routes

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| POST | `/api/guilds/{guild_id}/requests` | Submit join request | Any signed-in user |
| GET | `/api/guilds/{guild_id}/requests` | List requests | `manage_members` |
| PATCH | `/api/guilds/{guild_id}/requests/{request_id}` | Approve or deny | `manage_members` |

#### POST Validation
- Guild must be public
- User must not already be a member
- No existing pending request for this user+guild

#### PATCH Approve Flow (transactional)
1. Create GuildMember with `guild.defaultRoleId` (or fallback to lowest role)
2. Set request `status = "approved"`, `reviewedBy`, `reviewedAt`

#### PATCH Deny Flow
1. Set request `status = "denied"`, `reviewedBy`, `reviewedAt`

#### Expiry on Read
- GET endpoint checks pending requests where `expiresAt < now()`
- Bulk-updates those to `status = "expired"` before returning

### User Timezone
- Handled by existing `PATCH /api/users/{id}` -- add `timezone` to accepted fields

## Page Architecture

### /guilds -- Guild Hub (Redesigned)

Tabbed hub with pill nav:

- **Overview** (`/guilds`): Dashboard with activity feed, user's guilds summary (top 3-4 with "See all"), placeholder sections for trending guilds / upcoming events (future features).
- **My Guilds** (`/guilds/my`): Full list of user's guilds. Create guild button. Current `/guilds` page content moves here.
- **Discover** (`/guilds/discover`): Grid of public guild cards. Each card: name, description, member count, owner name. "Request to Join" button. Search/filter bar.

### /guilds/{id}/members -- Members Page (Redesigned)

Tabbed with pill nav:

- **Members tab**: Grouped by role. Role headers with color badge, member cards underneath. Sorted by role position (highest rank first).
- **Pending tab**: Pending join request cards. Shows: user name/avatar, message, submitted time, expires in X days. Approve/Deny buttons. Only visible to `manage_members` permission holders. Badge count on tab.

### Guild Settings Additions

New "Membership" section:
- Visibility toggle (public/private)
- Description textarea
- Default join role selector (dropdown of guild roles)
- Request expiry period input (days, or "No expiry")

### User Settings Addition

- Timezone selector (searchable dropdown of IANA timezones)
- Auto-detected on first visit, user can override

## Key Flows

### User Requests to Join

1. Browse `/guilds/discover`, find guild
2. Click "Request to Join" -- dialog with message textarea
3. POST `/api/guilds/{guild_id}/requests` with `{ message }`
4. `expiresAt` computed server-side: `now() + guild.requestExpiryDays`
5. Button becomes "Request Pending" (disabled)

### Manager Approves

1. Visit Members page, see badge count on Pending tab
2. See request cards: user info, message, time remaining
3. Click "Approve" -- PATCH `{ status: "approved" }`
4. Transaction: create GuildMember + mark approved + set reviewedBy
5. Card removed, member appears in Members tab

### Manager Denies

1. Click "Deny" -- PATCH `{ status: "denied" }`
2. Sets reviewedBy/reviewedAt, card removed

### Request Expiry

1. GET requests endpoint checks pending where `expiresAt < now()`
2. Bulk-update to `status = "expired"`
3. User's button resets so they can re-request

### Visibility Toggle

- Private to public: guild appears in Discover
- Public to private: guild disappears from Discover, pending requests remain for managers to act on

### Timezone Auto-detect

1. Client reads `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. If user's stored timezone is `"UTC"` and detected differs, silently update
3. All date displays formatted client-side using user's timezone

## Scope Boundaries

**In scope:**
- Guild visibility (public/private)
- Guild description field
- Join request model and full CRUD
- Configurable request expiry
- Guilds hub redesign (Overview, My Guilds, Discover tabs)
- Members page redesign (Members grouped by role, Pending tab)
- Guild settings for membership config
- User timezone field + auto-detect
- Default join role setting

**Out of scope (future features):**
- Full notification system (Redis-backed, bell icon, notification list)
- Guild branding (logo, banner, color palette)
- Trending guilds algorithm
- Upcoming events
- Invite links/codes
