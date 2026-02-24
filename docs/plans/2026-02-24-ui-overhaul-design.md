# UI Overhaul Design — Dungeon Syndrome

**Date:** 2026-02-24
**Status:** Approved

## Overview

Full UI overhaul migrating from MUI + CSS Modules to Tailwind CSS + shadcn/ui + Lucide icons. D&D/gamer aesthetic with polish: "Dark Parchment + Gold" as default theme with multi-theme support.

## Stack Changes

**Add:**
- Tailwind CSS v4
- shadcn/ui (New York variant)
- Lucide React icons
- Inter font (body) + Cinzel font (headings)

**Remove:**
- @mui/material, @mui/icons-material
- @emotion/react, @emotion/styled
- @fortawesome/react-fontawesome + all FA icon packages
- All CSS module files (*.module.css)

**Keep:**
- TanStack React Query, React Table, React Form
- Framer Motion
- Leaflet / react-leaflet
- react-color-palette
- react-toastify (may migrate to shadcn Sonner later)

## Theme System

### Pre-built Themes

| Theme | Background | Surface | Primary | Vibe |
|-------|-----------|---------|---------|------|
| **Parchment** (default) | `#1a1814` | `#242019` | `#c8a44e` (gold) | Classic D&D, warm |
| **Shadowfell** | `#12111a` | `#1a1924` | `#8b5cf6` (purple) | Dark fantasy, Underdark |
| **Dragonfire** | `#1a1212` | `#241919` | `#dc4a4a` (crimson) | Fierce, volcanic |
| **Feywild** | `#121a14` | `#192419` | `#4ade80` (emerald) | Forest, fey magic |

Each theme defines the full set of shadcn CSS variables. Each has a light and dark variant.

### User Accent Color

- Existing user color preference overrides `--accent`
- `--primary` stays theme-controlled (buttons, links, focus rings)
- `--accent` is user-controlled (active nav states, personal highlights)

### Theme Persistence

- Stored in user DB record (theme name + light/dark preference)
- Unauthenticated users default to Parchment dark
- Subtle parchment texture on `--background` via CSS

## Typography

- **Headings:** Cinzel (Google Fonts) — serif/fantasy
- **Body:** Inter (Google Fonts) — clean sans-serif
- **Monospace:** JetBrains Mono (for code/numbers in calculators)

## Navigation

### Desktop — Left Sidebar

- Fixed left sidebar: ~64px collapsed / ~240px expanded
- Logo at top: "Dungeon Syndrome" with D20 icon
- Icon-only when collapsed, icon + label when expanded
- Nav items: Home, Guilds, Tools, Map
- User avatar at bottom with dropdown (Profile, Settings, Sign Out)
- Theme switcher at bottom (4-swatch grid + light/dark toggle)
- Active route: gold left border + highlighted background
- Lucide icons: Home, Shield, Wrench, Map, User

### Mobile — Bottom Tab Bar

- Bottom tab bar: Home, Guilds, Tools, Map, Profile
- Active tab: gold icon + label
- Secondary actions via shadcn Sheet (slide-up bottom sheet)

### Speed Dial

- Bottom-right on desktop, bottom-center (above tab bar) on mobile
- Main button: D20 die icon with gold accent
- Radial expand (framer-motion) with quick actions:
  - Create Guild (Shield+)
  - Add Map Marker (MapPin+)
  - Roll Dice (Dice)
  - Quick Calculator (Calculator)
- Backdrop blur when open

## Pages

### Landing Page (Logged Out)

- Hero section: D20 icon animation, "Your Campaign, Organized" heading (Cinzel)
- Subtitle + "Sign In with Discord" CTA button
- 3-column feature cards: Guilds, Map, Tools
- Subtle animated background (floating particles or faint grid)

### Dashboard (Logged In)

- Welcome message with user name
- Your Guilds: horizontal card scroll with guild name, member count, role
- Quick Tools: icon button grid (Mounts, Items, Services, Travel)
- Recent Map Activity: mini Leaflet preview with recent markers
- Create Guild card at end of guilds row

### Guilds

**List (`/guilds`):**
- Card grid (not table) — name, member count, role badge, themed border
- "Create Guild" card (dashed border, + icon)
- Search/filter bar

**Detail (`/guilds/[id]`):**
- Hero banner with guild name
- shadcn Tabs: Overview | Members | Settings

**Members tab:**
- shadcn DataTable (TanStack Table)
- Columns: Avatar, Name, Role (badge), Joined, Actions
- Role badges: Owner (gold), Admin (silver), Member (bronze)
- Invite via shadcn Command/Combobox
- Bulk actions toolbar on selection

**Settings tab:**
- shadcn form components
- Danger zone card (red border) for delete

### Tools

**Hub (`/tools`):**
- Grid of tool cards: icon, name, description, hover glow

**Calculator pages:**
- Clean form with shadcn Select, Input
- Results in styled card below form
- Keep existing calculator logic, reskin UI

### Map (`/map`)

- Full-viewport Leaflet map
- Collapsible left panel (~300px): marker list, search, filters
- Marker creation: click map -> side panel form
- Custom themed markers (gold pins with icons)
- Styled marker popups (card with distance, notes, edit/delete)
- Custom Leaflet control styling to match theme

**Mobile map:**
- Full-screen map
- Bottom sheet for marker list (drag to expand)
- Speed dial FAB for "Add Marker"
- Marker details in bottom sheet

### User Pages

**Profile (`/users/[id]`):**
- Hero card: avatar, name, accent color stripe
- Stats: guilds joined, markers placed
- Guild membership list

**Settings (`/users/[id]/settings`):**
- Theme picker: visual 4-swatch grid
- Light/dark toggle: shadcn Switch
- Accent color: react-color-palette (styled)
- Account info: connected Discord details
