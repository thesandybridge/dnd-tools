# 3D Dice Roll + SpeedDial Auth Fix

**Date:** 2026-02-24
**Status:** Approved

## Part 1: SpeedDial Auth Filtering

SpeedDial reads session via `useSession()` from next-auth/react. Each action gets an `auth?: boolean` flag. When no session, only show actions without `auth: true`.

Actions:
- Create Guild (auth: true)
- Add Marker (auth: true)
- Roll Dice (auth: false) -- triggers dice overlay instead of navigation
- Calculator (auth: false)

## Part 2: 3D Dice Roll

### Stack
- `@react-three/fiber` -- React renderer for Three.js
- `@react-three/drei` -- helpers (Environment, Text, OrbitControls)
- `@react-three/rapier` -- physics engine for realistic rolling

### Dice Types
Standard D&D set: D4, D6, D8, D10, D12, D20.

Geometry mapping:
- D4: TetrahedronGeometry
- D6: BoxGeometry
- D8: OctahedronGeometry
- D10: Custom (pentagonal trapezohedron)
- D12: DodecahedronGeometry
- D20: IcosahedronGeometry

### UX Flow
1. User clicks "Roll Dice" in SpeedDial
2. Fullscreen dark overlay appears (framer-motion, same pattern as SpeedDial backdrop)
3. Dice type selector bar at bottom: D4, D6, D8, D10, D12, D20 toggle buttons
4. 3D canvas fills the overlay with selected die
5. Die receives random impulse (torque + upward force) on mount and on re-roll
6. Physics simulates tumble until die settles (velocity drops below threshold)
7. Result number displays large above the canvas
8. Dismiss: click backdrop, press Escape, or X button
9. Re-roll: click die or "Roll again" button

### Technical Details
- Dynamic import via `next/dynamic` with `ssr: false` (Three.js is browser-only)
- Face numbers rendered via `CanvasTexture` on each face
- Result detection: when angular velocity < threshold, read die rotation matrix to determine upward-facing face
- Theme integration: die body color from `--primary`, number color from `--primary-foreground`
- Ground plane: invisible rigid body for the die to land on
- Lighting: ambient + single directional light, subtle environment map

### Component Structure
```
app/components/dice/
  DiceRoller.tsx        -- main overlay component (dynamic import wrapper)
  DiceScene.tsx         -- R3F Canvas + physics world + lighting
  Die.tsx               -- generic die component (geometry, textures, physics body)
  DiceSelector.tsx      -- bottom bar with D4-D20 toggle buttons
  geometries/           -- custom geometry for D10
  utils.ts              -- face detection, texture generation
```

### State
- `dieType`: which die is selected (d4 | d6 | d8 | d10 | d12 | d20)
- `rolling`: boolean, true while physics is active
- `result`: number | null, set when die settles
- `open`: boolean, controls overlay visibility

Managed in DiceRoller.tsx, passed down as props.
