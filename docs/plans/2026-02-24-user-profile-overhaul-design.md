# User Profile Overhaul — Design Document

## Goal

Transform the user profile area from a bare-bones settings page into a personal dashboard hub with deep theme customization, profile identity, character management, and proper settings organization.

## Scope

**Wave 1 (this project):** Theme customization, profile identity, settings organization, character identity cards, guilds tab fix, `/characters` top-level route.

**Wave 2 (future):** Full D&D 5e character sheet (ability scores, HP, AC, spells, inventory, features, etc.) built on the extensible schema from Wave 1.

---

## Architecture

### Navigation

Characters become a top-level sidebar route following the same pattern as Guilds:

- `/characters` — List + create (auth-only, in sidebar)
- `/characters/[id]` — Character detail with tab nav
- Profile overview still shows a character roster preview

User profile tabs:

| Tab | Route | Content |
|-----|-------|---------|
| Overview | `/users/[id]` | Character roster, guild memberships, activity placeholder |
| Guilds | `/users/[id]/guilds` | All guild memberships (owned + member), role badges |
| Settings | `/users/[id]/settings` | Appearance, Profile, Account sections |

### Database Changes

**Extend User model:**

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  color         String?
  bio           String?
  themeName     String    @default("parchment") @map("theme_name")
  themeMode     String    @default("dark") @map("theme_mode")
  particleEffect String   @default("auto") @map("particle_effect")
  coronaIntensity Float   @default(0.8) @map("corona_intensity")

  accounts      Account[]
  sessions      Session[]
  guilds        Guild[]       @relation("GuildOwner")
  guildMembers  GuildMember[]
  markers       Marker[]
  characters    Character[]
}
```

New fields: `bio`, `theme_name`, `theme_mode`, `particle_effect` (ember/wisp/flame/sparkle/off/auto), `corona_intensity` (0-1 float).

**New Character model:**

```prisma
model Character {
  id         Int      @id @default(autoincrement())
  userId     String   @map("user_id")
  name       String
  race       String?
  class      String?  @map("char_class")
  subclass   String?
  level      Int      @default(1)
  backstory  String?
  avatarUrl  String?  @map("avatar_url")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("characters")
}
```

Deliberately flat for Wave 1. Wave 2 adds stats, spells, inventory as additional fields or related models.

---

## Settings — Appearance

Three subsections, each in its own GlassPanel.

### Theme Presets

Keep the 4 themes (Parchment, Shadowfell, Dragonfire, Feywild) as quick-start presets. Selecting a preset populates all controls below with sensible defaults for that theme. User can then customize further.

### Primary Color

Full HSL color wheel built with canvas (no library). A hue ring around the outside, saturation/lightness square in the center. The selected color drives `--corona-rgb`, `--alt`, and `--primary` CSS variables.

### Particle Effect

Visual picker with 5 options: Ember, Wisp, Flame, Sparkle, Off. Plus "Auto" which matches the theme preset (current behavior). Each option is a labeled card. Selecting one sets `data-particle` attribute on `<html>`, which CursorGlow reads instead of `data-theme`.

### Corona Intensity

Slider from 0 to 1, updates `--corona-intensity` CSS variable. Default varies by theme (0.6-0.8).

### Dark/Light Mode

Toggle switch. Already exists, just persists to DB now instead of only localStorage.

### Behavior

All changes apply live as the user adjusts (immediate CSS variable updates). A save button commits everything to the database in one PATCH request. Unsaved changes show a visual indicator.

---

## Settings — Profile

- **Display name** — Editable text input, max 50 chars
- **Bio** — Textarea, max 280 chars. Shown on profile dashboard header.
- **Avatar** — Display current OAuth avatar (read-only for now)

---

## Settings — Account

- **Email** — Display only (from OAuth)
- **Connected accounts** — Show linked OAuth provider
- **Danger zone** — Delete account with confirmation dialog

### Account Deletion Behavior

When a user deletes their account:

1. For each guild they own:
   - If other members exist: transfer ownership to the highest-ranked member (lowest role position). Update `guild.ownerId` and assign the owner role.
   - If no other members: delete the guild (cascades to maps, markers, roles, members).
2. Delete all their characters (cascade).
3. Remove their guild memberships.
4. Delete the user account.

The confirmation dialog lists exactly what will happen: "N guilds transferred, M guilds deleted, K characters deleted."

---

## Profile Dashboard (Overview Tab)

**Header:** Avatar, display name, bio (extend existing `UserComponent`).

**Character roster:** Horizontal scrollable row of character identity cards. Each shows name, race, class, level. "Add Character" card at the end. Cards link to `/characters/[id]`.

**Guild memberships:** Grid of guild cards showing guild name, role badge (colored from role system), member count, owner crown if applicable. Cards link to `/guilds/[id]`.

**Recent activity:** Placeholder GlassPanel — "Activity feed coming soon."

---

## Characters Feature

### /characters (List Page)

- Grid of character cards (same identity card style)
- "Create Character" card
- Max 20 characters per user

### /characters/[id] (Detail Page)

- Character banner (name, race, class, level, portrait area)
- Tab nav (Overview only for Wave 1, expandable for Wave 2)
- Overview: backstory, basic info, edit button
- Edit mode: inline form or dialog for all identity fields

### API Routes

- `GET /api/characters` — List current user's characters
- `POST /api/characters` — Create character
- `GET /api/characters/[id]` — Get single character
- `PATCH /api/characters/[id]` — Update character
- `DELETE /api/characters/[id]` — Delete character

All routes verify ownership (character.userId === session.user.id).

---

## Guilds Tab Fix

The `/users/[id]/guilds` tab currently only shows owned guilds. Fix to show all guild memberships by querying through the `GuildMember` relation with guild + role included. Display role badge with color, member count, owner indicator.

---

## Decouple Particles from Theme

Currently CursorGlow uses a MutationObserver on `data-theme` to select the particle drawer function. Change to:

- New `data-particle` attribute on `<html>` (values: ember, wisp, flame, sparkle, off)
- ThemeProvider sets `data-particle` based on user preference
- "auto" maps: parchment->ember, shadowfell->wisp, dragonfire->flame, feywild->sparkle
- CursorGlow and AmbientParticles read `data-particle` instead of `data-theme`

---

## API Changes

### PATCH /api/users/[id]

Extend to accept all new fields:

```typescript
{
  name?: string
  bio?: string
  color?: string
  themeName?: string
  themeMode?: string
  particleEffect?: string
  coronaIntensity?: number
}
```

### DELETE /api/users/[id]

New endpoint. Handles ownership transfer logic described above. Requires confirmation token or password.

### GET /api/users/[id]/guilds

Fix to return all guild memberships (not just owned guilds). Include role relation.

---

## ThemeProvider Changes

- On mount, load all theme settings from user DB record (not localStorage)
- Remove localStorage reads for themeName/themeMode
- Keep localStorage as fallback for unauthenticated state only
- Set `data-theme`, `data-mode`, `data-particle` attributes on `<html>`
- Set `--corona-intensity` CSS variable from user preference
- Expose `updateTheme(settings)` that applies changes live and provides a `save()` to persist

---

## File Summary

| Area | Files |
|------|-------|
| Database | `prisma/schema.prisma`, new migration |
| API | `app/api/users/[id]/route.ts`, `app/api/users/[id]/guilds/route.ts`, `app/api/characters/` (new CRUD) |
| Lib | `lib/users.ts` (extend), `lib/characters.ts` (new) |
| Provider | `app/providers/ThemeProvider.tsx` (DB-backed settings) |
| Effects | `app/components/effects/CursorGlow.tsx`, `AmbientParticles.tsx` (read data-particle) |
| Settings | `app/users/[id]/settings/page.tsx`, new components: ColorWheel, ParticlePicker, CoronaSlider, ProfileForm, AccountSection |
| Profile | `app/users/[id]/page.tsx`, `app/users/[id]/components/UserProfile.tsx`, `UserComponent.tsx` |
| Guilds tab | `app/users/[id]/guilds/page.tsx` |
| Characters | `app/characters/` (new pages), `app/characters/[id]/` (new detail) |
| Navigation | `app/components/navigation/DesktopSidebar.tsx`, `MobileNav.tsx`, `SpeedDial.tsx` |
