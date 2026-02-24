# Dark Fantasy Redesign

**Date**: 2026-02-24
**Status**: Approved
**Goal**: Transform the app from a mechanically-ported shadcn app into an immersive dark fantasy experience with pervasive atmospheric effects, glass-morphism panels, and rethought layouts for every page.

**Reference**: Corona effects, custom cursors, and grain overlay adapted from sandybridge.io portfolio (`~/Dev/projects/apps/sandybridge.io`).

---

## 1. Atmosphere Layer (App-Wide Foundation)

### 1.1 Corona System

SVG noise-displaced glowing borders adapted from sandybridge.io.

**Implementation**:
- Inline SVG filter: `feTurbulence` (fractalNoise, baseFrequency 0.04/0.06, 4 octaves) + `feDisplacementMap` (scale 6)
- Pseudo-elements (`::before`, `::after`) on corona-enabled elements
- `::before`: base corona glow with opacity-varying conic gradient bands + box-shadow
- `::after`: rotating conic gradient sweep via `@property --corona-angle`, 25s linear infinite
- CSS custom property `--corona-rgb` per theme for color control

**Theme corona colors**:
| Theme | Corona RGB | Character |
|-------|-----------|-----------|
| Parchment | `200, 164, 78` | Warm gold embers |
| Shadowfell | `138, 92, 168` | Cold purple wisps |
| Dragonfire | `200, 80, 40` | Hot orange-red flames |
| Feywild | `92, 168, 120` | Ethereal green sparkles |

**Applied to**: sidebar border, glass cards (hover/focus), SpeedDial, floating toolbar, active buttons, result panels.

### 1.2 Custom Cursor

Canvas-based dot + ring cursor with themed particle trails.

**Structure**:
- Canvas element: full viewport, pointer-events none, z-index 9995
- Dot: 6px solid circle, corona-colored
- Ring: 28px border circle, 1.5px stroke
- Glow: 400px radial gradient at cursor position, 0.05 opacity

**Interactions**:
- Hover on interactive elements: dot scales to 0.5, ring expands to 42px
- Click: dot scales to 0.8, ring shrinks to 22px
- Hidden on mobile/touch devices

**Theme particles** (spawned on cursor movement, max ~15, 600ms lifetime, drift upward):
| Theme | Particle | Visual |
|-------|----------|--------|
| Parchment | Embers | Small glowing dots with orange-gold trail |
| Shadowfell | Shadow wisps | Smoky tendrils that dissipate |
| Dragonfire | Flame licks | Flickering flame shapes |
| Feywild | Nature sparkles | Tiny leaf/star shapes |

### 1.3 Grain Overlay

- Fixed position, full viewport, pointer-events none, z-index 9990
- SVG `feTurbulence` fractalNoise texture, 256x256 tiled
- Opacity: 0.03, mix-blend-mode: overlay

### 1.4 Ambient Particles

Canvas-based background particles, always present.

- ~30 particles max, full viewport
- Slow upward drift (0.1-0.3 px/frame) with slight horizontal wander
- Opacity pulses between 0.1-0.4 (sine wave)
- Size: 1-3px, corona-colored, soft glow
- Lifetime: 5-8 seconds, respawn at bottom
- Performance: requestAnimationFrame, canvas compositing

### 1.5 Glass-morphism Base

Shared card/panel style used everywhere:
```
backdrop-blur-md bg-card/80 border border-white/10
```
- Subtle inner shadow for depth: `shadow-inner shadow-white/5`
- Corona glow on hover: border transitions to `border-[rgba(var(--corona-rgb),0.3)]`
- Focus: corona intensifies to 0.5 opacity

### 1.6 Reduced Motion

All atmospheric effects respect `prefers-reduced-motion: reduce`:
- Corona rotation stops (static glow remains)
- Cursor particles disabled (dot + ring remain)
- Ambient particles disabled
- Grain overlay remains (static, no performance impact)

---

## 2. Navigation

### 2.1 Desktop Sidebar

- Glass-morphism background: `backdrop-blur-lg bg-sidebar/90`
- Right edge corona glow border (facing content area)
- Icon hover: subtle glow pulse (box-shadow animation)
- Active item: corona-colored left bar + icon glow aura (replaces flat background highlight)
- Theme toggle: corona ring animation on switch

### 2.2 Mobile Bottom Nav

- Glass-morphism bar: `backdrop-blur-lg bg-card/85`
- Active tab: icon glows with corona color, label turns corona color
- Subtle upward float on active icon (2px translateY)

### 2.3 SpeedDial

- D20 button: slow-pulsing corona ring (subtle, always visible)
- Open state: corona intensifies, radial actions each get mini corona glow
- Action icons: slight magnetic tilt toward center D20

---

## 3. Home Page

### 3.1 Hero Page (Logged Out)

Current design is acceptable. Enhance with:
- Glass-morphism on feature cards
- Corona glow hover on cards
- Castle icon gets a slow corona pulse

### 3.2 Dashboard (Logged In)

Complete redesign from 4 plain cards to a rich activity hub.

**Layout**: responsive grid, max-w-6xl centered

**Panels**:

1. **Welcome Banner** (full width)
   - Glass panel, subtle gradient background
   - "Welcome back, {name}" + current date
   - Clean, not over-designed

2. **Quick Actions** (full width row, 4-5 glass cards)
   - Guilds, Map, Tools, Profile + any frequently-used action
   - Glass cards with corona hover, larger icons (h-8 w-8)
   - Tilt effect on hover (like sandybridge.io TiltCard)

3. **Recent Guild Activity** (left, ~60% width)
   - Glass panel showing latest member joins, guild updates
   - Empty state: "Create your first guild" CTA with dashed border + pulsing corona
   - Max 5 recent items, "View all" link

4. **Quick Calculator** (right, ~40% width)
   - Embedded compact currency converter
   - Glass panel, functional inline (not just a link)

5. **Map Preview** (full width below)
   - Small static map preview or "Last area" thumbnail
   - Recent markers listed
   - "Open Map" CTA
   - Empty state: "Start exploring" CTA

---

## 4. Calculator Pages

Each calculator keeps its own route (`/tools/*`), each redesigned.

### 4.1 Tools Hub (`/tools`)

Grid of glass cards linking to each calculator (existing pattern but glass-morphism + corona hover + tilt effect). Currency converter embedded at the top as a compact widget.

### 4.2 Shared Calculator Layout

- Glass panel container with corona border
- Banner area: thematic image with glass overlay + corona edge glow
- Result display: prominent glass panel, pinned position, animated number transitions
- Form inputs: glass-morphism styled, inner glow on focus
- Back navigation to /tools

### 4.3 Currency Converter

- Compact horizontal layout: amount input + currency select inline
- Results as a row of glass "coin cards" - each with SVG icon, amount, click-to-copy
- Corona glow on source currency card
- Copy feedback: corona flash on the card

### 4.4 Item Calculator

- Desktop: two-column layout
  - Left: rarity select + checkboxes + attribute grid (2x4 glass input cards)
  - Right: live price result (large, prominent glass panel with gold coin SVG + animated counter)
- Mobile: stacked, result panel pinned at bottom
- Reset button in form footer

### 4.5 Mount Calculator

- Similar two-column: form left, results right
- Results show multiple cost breakdowns in glass sub-cards
- Mobile: stacked

### 4.6 Service Calculator

- Same pattern: form left, result summary right

### 4.7 Travel Calculator

- Form left with route options
- Right panel: distance, time, and cost breakdown in glass cards

---

## 5. Map

### 5.1 Layout

Map fills 100% available space (no persistent sidebar).

### 5.2 Floating Toolbar

- Position: bottom-center, above mobile nav on mobile
- Style: glass-morphism pill (`backdrop-blur-lg bg-card/80 rounded-full`)
- Contents: Marker toggle | Ruler toggle | DM toggle | separator | Zoom +/-
- Active buttons: corona glow
- Tooltips on hover (desktop)
- Mobile: same position, larger touch targets (44px min)

### 5.3 Marker Info Cards

- Appear on marker click as floating glass card near the marker
- Content: marker name (editable inline), distance from previous, edit/delete actions
- Corona-glowed border, glass backdrop
- Dismiss: click outside or X button
- Smart positioning: stays within viewport bounds
- Mobile: renders as a bottom sheet instead of floating card

### 5.4 Marker List Panel

- Toggle via button in toolbar or floating pill (top-left)
- Floating overlay: ~280px wide, glass-morphism, positioned over map with offset from edge
- Search bar + scrollable marker list (same items as current)
- Glass-morphism rows with corona glow on selected
- Dismissible, map stays interactive behind it
- Mobile: bottom sheet (existing pattern, restyled)

### 5.5 Ruler Display

- Distance shown as a glass badge floating near the measurement line
- Replaces current Leaflet tooltip

---

## 6. Guild Pages

### 6.1 Guild List (`/guilds`)

- Glass card grid (not a table)
- Each card: guild name, member count, role badge, corona hover glow
- "Create Guild" as dashed-border glass card with pulsing corona CTA

### 6.2 Guild Detail (`/guilds/[id]`)

- Banner: existing image with glass overlay + corona edge
- Tab bar below banner: Members | Settings (glass-morphism tabs)
- Content area: glass panels

### 6.3 Members Tab

- Card grid instead of table (desktop: 3-4 columns)
- Each member card: avatar placeholder, name, role badge
- Admin actions: icon buttons on hover (not a table column)
- "Add Member" as a glass search card at the top of the grid

### 6.4 Settings Tab

- Glass panel for guild settings form
- Separate "Danger Zone" glass panel with destructive corona glow (red-tinted border) for delete action

---

## 7. User Profile Pages

### 7.1 Profile (`/users/[id]`)

Currently null/stub. New design:
- Glass panel: avatar, display name, join date
- Guild memberships as mini glass cards
- Accent color picker (existing, restyled in glass panel)

### 7.2 Settings (`/users/[id]/settings`)

- Theme picker: visual swatches showing corona color preview per theme
- Accent color picker (existing)
- Other preferences

---

## 8. Shared Components to Build

| Component | Purpose |
|-----------|---------|
| `GlassCard` | Reusable glass-morphism card with optional corona border |
| `CoronaGlow` | Wrapper component applying corona effect to children |
| `CoronaSVGFilter` | Inline SVG filter rendered once in layout |
| `CursorGlow` | Custom cursor with themed particles (canvas) |
| `GrainOverlay` | Persistent grain texture |
| `AmbientParticles` | Background floating particles (canvas) |
| `FloatingToolbar` | Glass-morphism pill for map controls |
| `FloatingPanel` | Dismissible overlay panel (map marker list) |
| `FloatingCard` | Positioned card near a target (marker info) |
| `TiltCard` | 3D perspective tilt on hover |
| `AnimatedNumber` | Number counter animation for results |

---

## 9. Performance Considerations

- All canvas effects (cursor, ambient particles) use `requestAnimationFrame`
- Corona CSS animations use `@property` for GPU-accelerated custom property animation
- Glass-morphism `backdrop-blur` is GPU-composited
- Grain overlay is a static tiled SVG (no runtime cost)
- Canvas elements: `willReadFrequently: false`, composite operations only
- All effects disabled under `prefers-reduced-motion: reduce`
- Custom cursor hidden on touch devices (detected via `pointer: coarse` media query)
- Ambient particles: low count (30), simple physics, no collision detection

---

## 10. Theme Integration

Existing theme system (`data-theme` + `data-mode`) extended with:
- `--corona-rgb` custom property per theme (for rgba usage in corona effects)
- `--corona-intensity` (0-1) for per-theme glow strength tuning
- Particle config per theme (shape, color, behavior) defined in cursor component

No changes to existing theme switching mechanism - just adding new CSS custom properties.
