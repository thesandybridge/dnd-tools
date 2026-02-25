# TileForge Branding Design

**Goal:** Bold cross-promotion of TileForge across the app to drive discovery and signups from both new and existing users.

**Tone:** Bold promo - eye-catching banners/cards with strong CTAs, treats TileForge as a first-class feature.

**Key selling points:**
- Upload any image, get a zoomable map tileset
- Free tier available (self-host your own PMTiles)
- Works with PMTiles format
- Paid plans include hosted tile serving

**Links:**
- Homepage (general awareness): `https://tileforge.sandybridge.io`
- Signup (CTAs): `https://tileforge.sandybridge.io/signup`

---

## 1. Map Page Empty State

When a guild has no maps and the user can manage maps, replace the minimal "No maps yet" card with a TileForge promo.

- GlassPanel with corona effect
- Headline: "Bring your world to life"
- Body: "Upload any image and turn it into a zoomable map tileset with TileForge. Free tier available — host your own PMTiles, or let TileForge handle it."
- Two CTAs:
  - If user has TileForge connected: "Import from TileForge" (primary, opens picker) + "Add Map Manually" (secondary, opens form)
  - If not connected: "Get Started on TileForge" (primary, links to signup) + "Add Map Manually" (secondary, opens form)

## 2. Map Creation Form - Unconnected Users

When `hasTileForge` is false, show a promo banner where the "Import from TileForge" button would be.

- Subtle GlassPanel inline in the form
- Copy: "Don't have tilesets yet? Create zoomable map tiles from any image with TileForge — free tier available."
- Small "Learn more" link to homepage

## 3. Account Settings - Richer Section

Upgrade the disconnected state with a pitch before the API key input.

- Value prop: "Turn any image into a zoomable PMTiles tileset. Free tier lets you generate tiles and self-host. Paid plans include hosted tile serving."
- "Sign up on TileForge" link to signup page
- Then the existing API key input below

## 4. Footer

Upgrade from plain text link to a "Powered by TileForge" badge-style treatment that stands out from the other footer links.

## 5. Picker Dialog

Add a small "Powered by TileForge" line in the dialog header area, linked to homepage.
