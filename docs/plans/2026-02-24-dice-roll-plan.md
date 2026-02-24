# 3D Dice Roll + SpeedDial Auth Fix — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add auth-gated SpeedDial actions and a 3D dice roller with physics-based rolling for all standard D&D dice.

**Architecture:** SpeedDial gains session awareness via `useSession()` and a callback-based "Roll Dice" action that opens a fullscreen 3D dice overlay. The overlay uses React Three Fiber + Rapier physics. Die geometries are Three.js built-ins (except D10). Face numbers use CanvasTexture. Result detection reads the die's rotation quaternion after physics settles.

**Tech Stack:** @react-three/fiber, @react-three/drei, @react-three/rapier, three, framer-motion (existing)

---

### Task 1: Install Three.js dependencies

**Files:**
- Modify: `package.json`

**Steps:**
1. Run: `npm install three @react-three/fiber @react-three/drei @react-three/rapier`
2. Run: `npm install -D @types/three`
3. Run: `npx next build` — verify no regressions

**Commit:** `chore: add react-three-fiber and rapier deps`

---

### Task 2: SpeedDial auth filtering + dice callback

**Files:**
- Modify: `app/components/navigation/SpeedDial.tsx`

**Steps:**

1. Import `useSession` from `next-auth/react`
2. Add `auth?: boolean` and `action?: () => void` to action definitions:
   ```tsx
   const actions = [
     { label: "Create Guild", icon: Shield, href: "/guilds?create=true", auth: true },
     { label: "Add Marker", icon: MapPin, href: "/map?add=true", auth: true },
     { label: "Roll Dice", icon: Dice6, action: "dice" },
     { label: "Calculator", icon: Calculator, href: "/tools/items" },
   ]
   ```
3. In `SpeedDial()`, call `useSession()` and add `diceOpen` state:
   ```tsx
   const { data: session } = useSession()
   const [diceOpen, setDiceOpen] = useState(false)
   ```
4. Filter actions: `const visibleActions = actions.filter(a => !a.auth || session?.user)`
5. Update `handleAction` to check for `action === "dice"`:
   ```tsx
   function handleAction(action) {
     setOpen(false)
     if (action.action === "dice") {
       setDiceOpen(true)
     } else if (action.href) {
       router.push(action.href)
     }
   }
   ```
6. Render `DiceRoller` overlay (dynamic import) when `diceOpen` is true:
   ```tsx
   const DiceRoller = dynamic(() => import("@/app/components/dice/DiceRoller"), { ssr: false })
   // ... at end of JSX:
   {diceOpen && <DiceRoller onClose={() => setDiceOpen(false)} />}
   ```
7. Run: `npx next build` — will fail because DiceRoller doesn't exist yet. That's OK.

**Commit:** `feat: add auth filtering and dice callback to SpeedDial`

---

### Task 3: Dice utility functions

**Files:**
- Create: `app/components/dice/utils.ts`

**Steps:**

1. Create the dice config map with face counts and geometry types:
   ```ts
   export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20"

   export const DICE_CONFIG: Record<DieType, { faces: number; label: string }> = {
     d4:  { faces: 4,  label: "D4" },
     d6:  { faces: 6,  label: "D6" },
     d8:  { faces: 8,  label: "D8" },
     d10: { faces: 10, label: "D10" },
     d12: { faces: 12, label: "D12" },
     d20: { faces: 20, label: "D20" },
   }
   ```

2. Create `createFaceTexture(number, size, bgColor, textColor)` — draws a number onto a canvas and returns a `CanvasTexture`.

3. Create `getUpFace(quaternion, dieType)` — given the die's quaternion after settling, determine which face number is pointing up. For each die type, define the face normal vectors, transform by quaternion, and find the one with highest Y component.

**Commit:** `feat: add dice utility functions`

---

### Task 4: Die component with physics

**Files:**
- Create: `app/components/dice/Die.tsx`

**Steps:**

1. Create the Die component that accepts `dieType`, `onResult`, and `rollKey` (incremented to trigger re-rolls).
2. Use `@react-three/rapier` `RigidBody` with a convex hull collider.
3. Build geometry based on die type using Three.js built-ins:
   - D4: `TetrahedronGeometry`
   - D6: `BoxGeometry`
   - D8: `OctahedronGeometry`
   - D10: `DodecahedronGeometry` scaled (approximation — close enough visually)
   - D12: `DodecahedronGeometry`
   - D20: `IcosahedronGeometry`
4. Apply face textures using `createFaceTexture` from utils — one material per face using an array of materials.
5. On mount / when `rollKey` changes:
   - Reset position to `[0, 5, 0]`
   - Apply random impulse: `[randFloat(-2,2), randFloat(5,8), randFloat(-2,2)]`
   - Apply random torque: `[randFloat(-15,15), randFloat(-15,15), randFloat(-15,15)]`
6. Use `useFrame` to check if physics has settled (linear + angular velocity both near zero for 30+ frames). When settled, call `getUpFace()` with the body's rotation and pass result to `onResult`.

**Commit:** `feat: add Die component with physics`

---

### Task 5: DiceScene (Canvas + physics world)

**Files:**
- Create: `app/components/dice/DiceScene.tsx`

**Steps:**

1. Create R3F `<Canvas>` with camera positioned at `[0, 8, 8]` looking at origin.
2. Add `<Physics gravity={[0, -20, 0]}>` from Rapier.
3. Add ground plane: `<RigidBody type="fixed">` with a box collider at `y=-1`.
4. Add lighting: `<ambientLight intensity={0.5} />` and `<directionalLight position={[5, 10, 5]} />`
5. Render `<Die>` component with current dieType, rollKey, and onResult callback.
6. Add `<OrbitControls>` from drei for optional camera rotation, with restricted zoom.

Props: `dieType`, `rollKey`, `onResult`

**Commit:** `feat: add DiceScene with physics world`

---

### Task 6: DiceSelector (die type picker)

**Files:**
- Create: `app/components/dice/DiceSelector.tsx`

**Steps:**

1. Render a row of toggle buttons for each die type (D4 through D20).
2. Use shadcn `Button` with `variant="ghost"` for unselected, `variant="default"` for selected.
3. Props: `selected: DieType`, `onSelect: (type: DieType) => void`

**Commit:** `feat: add DiceSelector component`

---

### Task 7: DiceRoller (main overlay)

**Files:**
- Create: `app/components/dice/DiceRoller.tsx`

**Steps:**

1. Create the fullscreen overlay using framer-motion (fade in dark backdrop).
2. Manage state: `dieType` (default "d20"), `rollKey` (number, increment to re-roll), `result` (number | null), `rolling` (boolean).
3. Layout:
   - Fixed overlay `z-[60]` (above SpeedDial's z-50)
   - X close button top-right
   - Result display top-center: large Cinzel font number, fades in when result is set
   - DiceScene fills the center
   - DiceSelector bar at bottom
   - "Roll Again" button below the result
4. Escape key handler to close.
5. When `onResult` fires from DiceScene, set `result` and `rolling = false`.
6. "Roll Again" increments `rollKey` and sets `rolling = true`, `result = null`.

Props: `onClose: () => void`

**Commit:** `feat: add DiceRoller overlay`

---

### Task 8: Build verification + polish

**Steps:**

1. Run: `npx next build` — verify clean build
2. Test in browser:
   - SpeedDial only shows 2 items when logged out
   - SpeedDial shows all 4 items when logged in
   - "Roll Dice" opens fullscreen overlay
   - Die rolls with physics, result appears
   - Die type selector switches between dice
   - "Roll Again" works
   - Escape / X dismisses
3. Fix any visual issues (die scale per type, camera distance, colors)

**Commit:** `fix: dice roller polish`

---

## Notes

- No test suite exists in this project, so verification is build + manual testing
- Three.js must be dynamically imported (no SSR)
- `useSession()` is available because SpeedDial is inside `SessionProvider` in layout.tsx
- D10 geometry is approximated with a DodecahedronGeometry — visually close enough for a fun dice roll
- Theme colors are read from CSS variables at runtime for the die material
