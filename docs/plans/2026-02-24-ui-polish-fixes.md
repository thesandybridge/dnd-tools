# UI Polish Fixes

**Date:** 2026-02-24
**Status:** Approved

## Problems

1. **Global CSS reset fights shadcn** -- `* { padding: 0; margin: 0 }` and `h2 { text-align: center; text-shadow }` break component spacing
2. **Dark mode inputs unstyled** -- `dark:bg-input/30` doesn't resolve because shadcn uses `.dark` but we use `data-mode="dark"`
3. **SpeedDial clips off-screen** -- radial fan angles push items below viewport on mobile
4. **Tools hub needs redesign** -- large background-image buttons replaced with icon card grid

## Fixes

### 1. globals.css cleanup
- Remove `* { padding: 0; margin: 0 }` (Tailwind preflight handles resets)
- Remove `h2 { text-align: center; text-shadow }` global rule
- Add `.calculator-heading` utility for calculator h2s that need the text-shadow

### 2. Dark mode variant
- Verify `@custom-variant dark` resolves for all `dark:` utilities
- If needed, add explicit styles to Input/Select components

### 3. SpeedDial fix
- Change fan direction: items spread upward only (angles -180 to -90)
- Reduce radius from 72 to 64
- Ensure all items stay within viewport bounds

### 4. Tools hub redesign
- Replace `Tools.tsx` with icon card grid (2x2 on desktop, stacked on mobile)
- Use shadcn Card with Lucide icons: Horse, Beer, Compass, Hammer
- Icon + name + short description per card
- Hover: border-primary transition, slight scale
- Consistent with dashboard card style from page.tsx
