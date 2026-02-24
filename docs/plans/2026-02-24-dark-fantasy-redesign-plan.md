# Dark Fantasy Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform dnd-tools from a generic shadcn app into an immersive dark fantasy experience with corona effects, custom cursors, glass-morphism panels, ambient particles, and rethought layouts for every page.

**Architecture:** Atmosphere effects (corona, cursor, grain, particles) are app-wide components rendered in root layout. Glass-morphism is achieved via a reusable `GlassPanel` component. Each page section (calculators, map, guilds, home) gets a layout overhaul using these primitives. Effects adapted from sandybridge.io portfolio at `~/Dev/projects/apps/sandybridge.io`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Framer Motion, Canvas API (cursor/particles)

**Reference:** Design doc at `docs/plans/2026-02-24-dark-fantasy-redesign-design.md`

---

## Phase 1: Atmosphere Foundation

### Task 1: Add Corona CSS Custom Properties and SVG Filter

Add `--corona-rgb` and `--corona-intensity` to each theme block in globals.css. Add the SVG filter to root layout.

**Files:**
- Modify: `app/globals.css` — add `--corona-rgb` and `--corona-intensity` to all 8 theme blocks (4 themes × 2 modes)
- Modify: `app/layout.tsx` — add inline SVG filter element

**Step 1: Add corona variables to globals.css**

Add `--corona-rgb` and `--corona-intensity` to each theme block. Values:

```
Parchment dark:   --corona-rgb: 200, 164, 78;  --corona-intensity: 0.8;
Parchment light:  --corona-rgb: 139, 109, 31;  --corona-intensity: 0.5;
Shadowfell dark:  --corona-rgb: 139, 92, 246;  --corona-intensity: 0.8;
Shadowfell light: --corona-rgb: 109, 40, 217;  --corona-intensity: 0.5;
Dragonfire dark:  --corona-rgb: 220, 74, 74;   --corona-intensity: 0.8;
Dragonfire light: --corona-rgb: 185, 28, 28;   --corona-intensity: 0.5;
Feywild dark:     --corona-rgb: 74, 222, 128;  --corona-intensity: 0.8;
Feywild light:    --corona-rgb: 22, 163, 74;   --corona-intensity: 0.5;
```

Add these two lines after the `--sidebar-ring` line in each theme block.

**Step 2: Add corona @property and keyframes to globals.css**

After the theme blocks but before global base styles, add:

```css
/* ===================================================================
   Corona Effect System
   =================================================================== */

@property --corona-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

@keyframes corona-drift {
  to { --corona-angle: 360deg; }
}

@keyframes corona-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
```

**Step 3: Add corona utility classes to globals.css**

After the keyframes, add reusable corona classes:

```css
/* Corona border glow - apply to positioned elements */
.corona-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  z-index: -1;
  background: conic-gradient(
    from 0deg,
    transparent 0%,
    rgba(var(--corona-rgb), 0.25) 5%,
    rgba(var(--corona-rgb), 0.12) 10%,
    transparent 20%,
    rgba(var(--corona-rgb), 0.06) 40%,
    transparent 50%,
    rgba(var(--corona-rgb), 0.18) 55%,
    rgba(var(--corona-rgb), 0.08) 60%,
    transparent 70%,
    transparent 100%
  );
  box-shadow: 0 0 8px 2px rgba(var(--corona-rgb), 0.12),
              0 0 3px 1px rgba(var(--corona-rgb), 0.08);
  filter: url(#corona-filter);
  pointer-events: none;
}

/* Rotating corona sweep */
.corona-border::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  z-index: -1;
  background: conic-gradient(
    from var(--corona-angle),
    transparent 0%,
    rgba(var(--corona-rgb), 0.35) 5%,
    rgba(var(--corona-rgb), 0.22) 12%,
    rgba(var(--corona-rgb), 0.08) 22%,
    transparent 32%,
    transparent 100%
  );
  animation: corona-drift 25s linear infinite;
  pointer-events: none;
}

/* Hover-only corona */
.corona-hover {
  position: relative;
}
.corona-hover::before,
.corona-hover::after {
  opacity: 0;
  transition: opacity 0.3s ease;
}
.corona-hover:hover::before,
.corona-hover:hover::after,
.corona-hover:focus-within::before,
.corona-hover:focus-within::after {
  opacity: 1;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .corona-border::after {
    animation: none;
  }
}
```

**Step 4: Add SVG filter to layout.tsx**

In `app/layout.tsx`, add the SVG filter inside `<body>` as the first child (before SessionProvider):

```tsx
<svg width="0" height="0" aria-hidden="true" className="absolute">
  <filter id="corona-filter">
    <feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves={4} seed="3" result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale={6} xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>
```

**Step 5: Verify**

Run: `npm run dev` — check that the app builds and loads without errors. The corona classes won't be visible yet since nothing uses them.

**Step 6: Commit**

```
feat: add corona effect system (CSS + SVG filter)
```

---

### Task 2: Create GlassPanel Component

Reusable glass-morphism panel with optional corona border.

**Files:**
- Create: `app/components/ui/GlassPanel.tsx`

**Step 1: Create the component**

```tsx
"use client"

import { forwardRef, type HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  corona?: boolean        // Show corona glow (default: false)
  coronaHover?: boolean   // Show corona only on hover (default: false)
  variant?: "default" | "subtle" | "strong"
}

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, corona = false, coronaHover = false, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "backdrop-blur-md bg-card/80 border border-white/[0.08] shadow-inner shadow-white/[0.03]",
      subtle: "backdrop-blur-sm bg-card/60 border border-white/[0.05]",
      strong: "backdrop-blur-lg bg-card/90 border border-white/[0.12] shadow-inner shadow-white/[0.05]",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl",
          variants[variant],
          corona && "corona-border",
          coronaHover && "corona-border corona-hover",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassPanel.displayName = "GlassPanel"

export { GlassPanel }
```

**Step 2: Verify**

Import and render a `<GlassPanel corona>test</GlassPanel>` temporarily in the home page to confirm the corona effect renders correctly. Then remove the test.

**Step 3: Commit**

```
feat: add GlassPanel component with glass-morphism + corona
```

---

### Task 3: Create Grain Overlay

Static grain texture overlay rendered once in root layout.

**Files:**
- Create: `app/components/effects/GrainOverlay.tsx`
- Modify: `app/layout.tsx` — add GrainOverlay

**Step 1: Create the component**

```tsx
export function GrainOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9990] opacity-[0.03] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  )
}
```

**Step 2: Add to layout.tsx**

Import and render `<GrainOverlay />` inside `<body>`, after the SVG filter, before SessionProvider.

**Step 3: Verify**

Run dev server — look for a very subtle noise texture over the entire page. It should be barely visible (0.03 opacity).

**Step 4: Commit**

```
feat: add grain overlay texture effect
```

---

### Task 4: Create Ambient Particles

Canvas-based floating particles that drift upward.

**Files:**
- Create: `app/components/effects/AmbientParticles.tsx`
- Modify: `app/layout.tsx` — add AmbientParticles

**Step 1: Create the component**

```tsx
"use client"

import { useEffect, useRef } from "react"

const MAX_PARTICLES = 30
const PARTICLE_LIFETIME = [5000, 8000] // ms

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  phase: number // for sine wave pulsing
  life: number
  maxLife: number
}

function getCoronaRgb(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--corona-rgb").trim()
  const parts = raw.split(",").map(Number)
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) return parts as [number, number, number]
  return [200, 164, 78] // fallback parchment gold
}

export function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return
    // Skip reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId = 0
    let particles: Particle[] = []
    let rgb = getCoronaRgb()

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      rgb = getCoronaRgb()
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-mode"] })

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    function spawnParticle(): Particle {
      return {
        x: Math.random() * canvas!.width,
        y: canvas!.height + Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.1 + Math.random() * 0.2),
        size: 1 + Math.random() * 2,
        opacity: 0,
        phase: Math.random() * Math.PI * 2,
        life: 0,
        maxLife: PARTICLE_LIFETIME[0] + Math.random() * (PARTICLE_LIFETIME[1] - PARTICLE_LIFETIME[0]),
      }
    }

    let lastTime = performance.now()

    function animate(now: number) {
      const dt = now - lastTime
      lastTime = now

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      // Spawn particles
      while (particles.length < MAX_PARTICLES) {
        particles.push(spawnParticle())
      }

      // Update and draw
      particles = particles.filter((p) => {
        p.life += dt
        if (p.life > p.maxLife) return false

        p.x += p.vx
        p.y += p.vy
        p.vx += (Math.random() - 0.5) * 0.01 // gentle wander

        // Opacity: fade in, pulse, fade out
        const progress = p.life / p.maxLife
        const fadeIn = Math.min(progress * 5, 1)
        const fadeOut = Math.min((1 - progress) * 5, 1)
        const pulse = 0.5 + 0.5 * Math.sin(p.phase + p.life * 0.002)
        p.opacity = fadeIn * fadeOut * pulse * 0.35

        // Draw
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${p.opacity})`
        ctx!.fill()

        // Soft glow
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${p.opacity * 0.15})`
        ctx!.fill()

        return true
      })

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      aria-hidden="true"
    />
  )
}
```

**Step 2: Add to layout.tsx**

Import and render `<AmbientParticles />` after GrainOverlay.

**Step 3: Verify**

Dev server — look for faint glowing dots drifting upward. They should be corona-colored and very subtle.

**Step 4: Commit**

```
feat: add ambient floating particles effect
```

---

### Task 5: Create Custom Cursor

Canvas-based dot + ring cursor with themed particle trails.

**Files:**
- Create: `app/components/effects/CursorGlow.tsx`
- Modify: `app/globals.css` — add cursor styles
- Modify: `app/layout.tsx` — add CursorGlow

**Step 1: Add cursor CSS to globals.css**

In the global base styles section:

```css
/* Custom cursor */
@media (pointer: fine) {
  * {
    cursor: none !important;
  }
}

.cursor-dot {
  position: fixed;
  width: 6px;
  height: 6px;
  background: rgb(var(--corona-rgb));
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: transform 0.15s ease, opacity 0.3s ease;
}

.cursor-ring {
  position: fixed;
  width: 28px;
  height: 28px;
  border: 1.5px solid rgb(var(--corona-rgb));
  border-radius: 50%;
  pointer-events: none;
  z-index: 9998;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: transform 0.15s ease, width 0.15s ease, height 0.15s ease, opacity 0.3s ease;
}

.cursor-hover .cursor-dot {
  transform: translate(-50%, -50%) scale(0.5);
}

.cursor-hover .cursor-ring {
  width: 42px;
  height: 42px;
}

.cursor-down .cursor-dot {
  transform: translate(-50%, -50%) scale(0.8);
}

.cursor-down .cursor-ring {
  width: 22px;
  height: 22px;
}
```

**Step 2: Create the CursorGlow component**

This is the largest single component. It handles:
- Dot + ring following the cursor (ring with easing)
- Canvas particle spawning on mouse move
- Theme-specific particle shapes (ember, wisp, flame, sparkle)
- Hover/down state detection
- Hidden on touch devices

```tsx
"use client"

import { useEffect, useRef, useCallback } from "react"

const MAX_PARTICLES = 15
const PARTICLE_LIFE = 600

interface CursorParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  rotation: number
}

function getCoronaRgb(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--corona-rgb").trim()
  const parts = raw.split(",").map(Number)
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) return parts as [number, number, number]
  return [200, 164, 78]
}

function getThemeName(): string {
  return document.documentElement.getAttribute("data-theme") || "parchment"
}

function drawEmber(ctx: CanvasRenderingContext2D, p: CursorParticle, alpha: number, rgb: [number, number, number]) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
  ctx.fill()
  // glow
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.2})`
  ctx.fill()
}

function drawWisp(ctx: CanvasRenderingContext2D, p: CursorParticle, alpha: number, rgb: [number, number, number]) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation + p.life * 0.005)
  ctx.beginPath()
  ctx.ellipse(0, 0, p.size * 2, p.size * 0.5, 0, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.6})`
  ctx.fill()
  ctx.restore()
}

function drawFlame(ctx: CanvasRenderingContext2D, p: CursorParticle, alpha: number, rgb: [number, number, number]) {
  ctx.save()
  ctx.translate(p.x, p.y)
  const flicker = Math.sin(p.life * 0.015) * 0.3
  ctx.scale(1 + flicker, 1 - flicker * 0.5)
  ctx.beginPath()
  ctx.moveTo(0, -p.size * 1.5)
  ctx.quadraticCurveTo(p.size, 0, 0, p.size)
  ctx.quadraticCurveTo(-p.size, 0, 0, -p.size * 1.5)
  ctx.fillStyle = `rgba(${rgb[0]}, ${Math.min(rgb[1] + 30, 255)}, ${rgb[2]}, ${alpha})`
  ctx.fill()
  ctx.restore()
}

function drawSparkle(ctx: CanvasRenderingContext2D, p: CursorParticle, alpha: number, rgb: [number, number, number]) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation + p.life * 0.008)
  const s = p.size
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2
    ctx.moveTo(0, 0)
    ctx.lineTo(Math.cos(angle) * s * 2, Math.sin(angle) * s * 2)
  }
  ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
  ctx.lineWidth = 1
  ctx.stroke()
  // center dot
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
  ctx.fill()
  ctx.restore()
}

const THEME_DRAWERS: Record<string, typeof drawEmber> = {
  parchment: drawEmber,
  shadowfell: drawWisp,
  dragonfire: drawFlame,
  feywild: drawSparkle,
}

export function CursorGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const ringPosRef = useRef({ x: 0, y: 0 })
  const particlesRef = useRef<CursorParticle[]>([])
  const moveCountRef = useRef(0)

  const isHoveringRef = useRef(false)
  const isDownRef = useRef(false)

  const updateHoverState = useCallback(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return
    const hovering = isHoveringRef.current
    const down = isDownRef.current
    dot.classList.toggle("cursor-hover", hovering && !down)
    ring.classList.toggle("cursor-hover", hovering && !down)
    dot.classList.toggle("cursor-down", down)
    ring.classList.toggle("cursor-down", down)
  }, [])

  useEffect(() => {
    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Still show dot+ring, just no particles
    }

    const canvas = canvasRef.current
    const dot = dotRef.current
    const ring = ringRef.current
    const glow = glowRef.current
    if (!canvas || !dot || !ring || !glow) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rgb = getCoronaRgb()
    let themeName = getThemeName()
    let animId = 0

    const observer = new MutationObserver(() => {
      rgb = getCoronaRgb()
      themeName = getThemeName()
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-mode"] })

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Show cursor elements
    dot.style.opacity = "1"
    ring.style.opacity = "0.6"

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY

      dot.style.left = e.clientX + "px"
      dot.style.top = e.clientY + "px"
      glow.style.left = e.clientX + "px"
      glow.style.top = e.clientY + "px"

      // Check hover
      const target = e.target as HTMLElement
      const hoverable = target.closest("a, button, [role='button'], input, select, textarea, [data-tilt], label")
      isHoveringRef.current = !!hoverable
      updateHoverState()

      // Spawn particle (every 3rd move)
      moveCountRef.current++
      if (moveCountRef.current % 3 === 0 && particlesRef.current.length < MAX_PARTICLES) {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          particlesRef.current.push({
            x: e.clientX,
            y: e.clientY,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            life: PARTICLE_LIFE,
            size: 2 + Math.random() * 2,
            rotation: Math.random() * Math.PI * 2,
          })
        }
      }
    }

    const onMouseDown = () => {
      isDownRef.current = true
      updateHoverState()
    }

    const onMouseUp = () => {
      isDownRef.current = false
      updateHoverState()
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)

    let lastTime = performance.now()

    function animate(now: number) {
      const dt = now - lastTime
      lastTime = now

      // Smooth ring follow
      ringPosRef.current.x += (mouseRef.current.x - ringPosRef.current.x) * 0.15
      ringPosRef.current.y += (mouseRef.current.y - ringPosRef.current.y) * 0.15
      ring!.style.left = ringPosRef.current.x + "px"
      ring!.style.top = ringPosRef.current.y + "px"

      // Draw particles
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      const drawFn = THEME_DRAWERS[themeName] || drawEmber

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= dt
        if (p.life <= 0) return false

        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.01 // drift upward

        const alpha = Math.max(0, p.life / PARTICLE_LIFE) * 0.8
        drawFn(ctx!, p, alpha, rgb)
        return true
      })

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mousedown", onMouseDown)
      window.removeEventListener("mouseup", onMouseUp)
      observer.disconnect()
      dot.style.opacity = "0"
      ring.style.opacity = "0"
    }
  }, [updateHoverState])

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[9995]" aria-hidden="true" />
      <div ref={dotRef} className="cursor-dot" />
      <div
        ref={glowRef}
        className="fixed pointer-events-none z-[9996] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(var(--corona-rgb), 0.05) 0%, transparent 70%)",
          opacity: 0.5,
        }}
      />
      <div ref={ringRef} className="cursor-ring" />
    </>
  )
}
```

**Step 3: Add to layout.tsx**

Import and render `<CursorGlow />` after AmbientParticles.

**Step 4: Verify**

Dev server — custom dot+ring cursor visible, particles spawn on movement, ring smoothly follows. Default OS cursor should be hidden on desktop (fine pointer).

**Step 5: Commit**

```
feat: add custom cursor with themed particle trails
```

---

## Phase 2: Navigation Overhaul

### Task 6: Update Desktop Sidebar with Glass + Corona

**Files:**
- Modify: `app/components/navigation/DesktopSidebar.tsx`

**Step 1: Apply glass-morphism and corona to sidebar**

Update the `<aside>` className:
- Replace `bg-sidebar` with `backdrop-blur-lg bg-sidebar/90`
- Add `corona-border` class
- Active nav item: replace the `before:` pseudo-element approach with a glow style

Update active link classes to use glow:
```
active: "bg-primary/15 text-primary shadow-[inset_-2px_0_0_0_rgb(var(--corona-rgb)),0_0_12px_-3px_rgba(var(--corona-rgb),0.4)]"
```

Update icon hover to include subtle glow:
```
hover: "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_8px_-2px_rgba(var(--corona-rgb),0.2)]"
```

**Step 2: Verify**

Sidebar should have a glass effect, right border has corona glow, active items glow.

**Step 3: Commit**

```
feat: update sidebar with glass-morphism and corona glow
```

---

### Task 7: Update Mobile Nav with Glass

**Files:**
- Modify: `app/components/navigation/MobileNav.tsx`

**Step 1: Read the current file and update**

Apply glass-morphism to the bottom bar container. Update active tab to use corona glow color instead of plain text color.

**Step 2: Commit**

```
feat: update mobile nav with glass-morphism
```

---

### Task 8: Update SpeedDial with Corona Pulse

**Files:**
- Modify: `app/components/navigation/SpeedDial.tsx`

**Step 1: Add corona pulse to the D20 button**

Add `corona-border` class and a subtle `animate-[corona-pulse_3s_ease-in-out_infinite]` to the main FAB button. When open, intensify the corona opacity.

**Step 2: Add mini corona to radial action buttons**

Each action button gets a subtle `shadow-[0_0_8px_-2px_rgba(var(--corona-rgb),0.3)]` on hover.

**Step 3: Commit**

```
feat: add corona pulse to SpeedDial
```

---

## Phase 3: Home Page Redesign

### Task 9: Redesign Home Dashboard (Logged In)

**Files:**
- Modify: `app/page.tsx`

**Step 1: Update HeroPage with glass cards**

Replace Card components with GlassPanel for the feature cards. Add `coronaHover` prop. The hero section itself stays clean.

**Step 2: Redesign Dashboard function**

New layout with rich panels:

```tsx
function Dashboard({ userName, userId }: { userName: string; userId?: string }) {
  return (
    <div className="flex flex-col gap-6 px-4 py-8 md:px-8 max-w-6xl mx-auto w-full">
      {/* Welcome */}
      <GlassPanel className="p-6">
        <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {userName}</h1>
        <p className="text-muted-foreground mt-1">What would you like to do today?</p>
      </GlassPanel>

      {/* Quick Actions - glass cards with corona hover */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {features.map(feature => (
          <Link key={feature.title} href={feature.href}>
            <GlassPanel coronaHover className="h-full p-6 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-accent/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">{feature.title}</span>
            </GlassPanel>
          </Link>
        ))}
        {/* Profile card */}
        <Link href={`/users/${userId}`}>
          <GlassPanel coronaHover className="h-full p-6 flex flex-col items-center justify-center gap-3 border-dashed">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Castle className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">Profile</span>
          </GlassPanel>
        </Link>
      </div>

      {/* Activity + Calculator row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Recent Activity (placeholder) */}
        <GlassPanel className="md:col-span-3 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-muted-foreground text-sm">Guild activity will appear here.</p>
        </GlassPanel>

        {/* Quick Calculator */}
        <GlassPanel className="md:col-span-2 p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Convert</h2>
          {/* Embed a compact currency converter later */}
          <p className="text-muted-foreground text-sm">Currency converter coming soon.</p>
        </GlassPanel>
      </div>
    </div>
  )
}
```

**Step 3: Verify**

Check both logged-in and logged-out views. Glass panels should render with blur and corona hover on the quick action cards.

**Step 4: Commit**

```
feat: redesign home page with glass panels and rich dashboard
```

---

## Phase 4: Calculator Redesign

### Task 10: Redesign Tools Layout and Hub

**Files:**
- Modify: `app/tools/layout.tsx`
- Modify: `app/components/navigation/Tools.tsx`

**Step 1: Update tools layout**

The tools layout wraps all calculator pages. Make the currency converter more compact and the overall layout use glass panels:

```tsx
import Calculator from "./components/calculator/Calculator"
import { CurrencyProvider } from "./providers/CurrencyContext"

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
        <Calculator />
        {children}
      </div>
    </CurrencyProvider>
  )
}
```

**Step 2: Update Tools.tsx (hub page)**

Read the current Tools.tsx and redesign the tool cards as GlassPanel cards with coronaHover.

**Step 3: Commit**

```
feat: redesign tools layout and hub with glass panels
```

---

### Task 11: Redesign Currency Converter

**Files:**
- Modify: `app/tools/components/calculator/Calculator.tsx`

**Step 1: Redesign to compact horizontal glass layout**

Wrap in GlassPanel. Make it a compact horizontal row: input + select inline, results as a row of glass "coin cards" below.

The result cards should each be a mini glass panel with the SVG icon, amount, and click-to-copy. The selected/source currency gets a corona glow.

**Step 2: Commit**

```
feat: redesign currency converter as compact glass widget
```

---

### Task 12: Redesign Item Calculator

**Files:**
- Modify: `app/tools/components/calculator/ItemCalculator.tsx`

**Step 1: Two-column glass layout**

Left column: rarity select, checkboxes, and attribute inputs in a 2×4 grid of glass input groups. Right column: large price result in a GlassPanel with corona border showing the animated total.

On mobile: stack vertically, result pinned at bottom.

Remove the Banner component usage — replace with a clean GlassPanel header.

**Step 2: Commit**

```
feat: redesign item calculator with two-column glass layout
```

---

### Task 13: Redesign Mount Calculator

**Files:**
- Modify: `app/tools/components/calculator/MountCalculator.tsx`

**Step 1: Read current file, apply same two-column glass pattern**

Form on left in GlassPanel, results on right in GlassPanel with corona. Mobile: stacked.

**Step 2: Commit**

```
feat: redesign mount calculator with glass panels
```

---

### Task 14: Redesign Service Calculator

**Files:**
- Modify: `app/tools/components/calculator/ServiceCalculator.tsx`

**Step 1: Same pattern as mount calculator**

**Step 2: Commit**

```
feat: redesign service calculator with glass panels
```

---

### Task 15: Redesign Travel Calculator

**Files:**
- Modify: `app/tools/components/calculator/TravelCalculator.tsx`

**Step 1: Same pattern as mount/service calculators**

**Step 2: Commit**

```
feat: redesign travel calculator with glass panels
```

---

## Phase 5: Map Redesign

### Task 16: Redesign Map Layout — Remove Side Panel, Add Floating Toolbar

**Files:**
- Modify: `app/map/MapLoader.tsx`
- Modify: `app/map/components/map/Map.tsx`
- Create: `app/map/components/FloatingToolbar.tsx`
- Modify: `app/map/components/map/Controls.tsx` (or replace)

**Step 1: Create FloatingToolbar component**

Glass-morphism pill at bottom-center of map with: Marker toggle, Ruler toggle, DM toggle, separator, zoom +/-.

```tsx
"use client"

import { MapPin, Ruler, Eye, Plus, Minus } from "lucide-react"
import { GlassPanel } from "@/app/components/ui/GlassPanel"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

type FloatingToolbarProps = {
  markerActive: boolean
  rulerActive: boolean
  dmActive: boolean
  onToggleMarker: () => void
  onToggleRuler: () => void
  onToggleDM: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}

export function FloatingToolbar({
  markerActive, rulerActive, dmActive,
  onToggleMarker, onToggleRuler, onToggleDM,
  onZoomIn, onZoomOut,
}: FloatingToolbarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] md:bottom-6 bottom-20">
        <GlassPanel variant="strong" className="flex items-center gap-1 px-2 py-1.5 rounded-full">
          <ToolbarButton icon={MapPin} label="Place Markers" active={markerActive} onClick={onToggleMarker} />
          <ToolbarButton icon={Ruler} label="Measure Distance" active={rulerActive} onClick={onToggleRuler} />
          <ToolbarButton icon={Eye} label="DM View" active={dmActive} onClick={onToggleDM} />
          <Separator orientation="vertical" className="h-6 mx-1" />
          <ToolbarButton icon={Plus} label="Zoom In" onClick={onZoomIn} />
          <ToolbarButton icon={Minus} label="Zoom Out" onClick={onZoomOut} />
        </GlassPanel>
      </div>
    </TooltipProvider>
  )
}

function ToolbarButton({
  icon: Icon, label, active, onClick,
}: {
  icon: typeof MapPin; label: string; active?: boolean; onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`h-9 w-9 rounded-full ${
            active
              ? "bg-primary/20 text-primary shadow-[0_0_12px_-3px_rgba(var(--corona-rgb),0.5)]"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
```

**Step 2: Update Map.tsx**

- Remove the old CustomControls/MarkerButton/RulerButton/DMButton rendering from inside MapContainer
- Instead, expose the toggle functions and active states via props or lift state to MapLoader
- Add zoom functions via `useMap()` ref exposed to parent

**Step 3: Update MapLoader.tsx**

- Remove MapSidePanel from the default layout (or make it a floating toggle)
- Add FloatingToolbar
- Map fills 100% of space

**Step 4: Verify**

Map should fill viewport with a floating glass pill toolbar at bottom-center. Marker, ruler, and DM toggles work. Old controls panel is removed.

**Step 5: Commit**

```
feat: replace map side panel with floating glass toolbar
```

---

### Task 17: Add Floating Marker List Panel

**Files:**
- Modify: `app/map/components/MapSidePanel.tsx` — refactor as floating overlay
- Modify: `app/map/MapLoader.tsx` — add toggle

**Step 1: Refactor MapSidePanel as floating overlay**

Instead of a sidebar, make it a floating panel that overlays the map. Glass-morphism, ~280px wide, positioned top-left with an offset. Togglable via a button in the floating toolbar or its own floating pill.

Keep the existing PanelContent (search + marker list) but wrap it in a GlassPanel.

**Step 2: Verify**

Marker list slides in as floating panel over the map. Can be dismissed. Map stays interactive behind it.

**Step 3: Commit**

```
feat: convert map marker list to floating glass panel
```

---

### Task 18: Add Floating Marker Info Cards

**Files:**
- Create: `app/map/components/MarkerInfoCard.tsx`
- Modify: `app/map/components/map/Map.tsx`

**Step 1: Create MarkerInfoCard**

A floating glass card that appears when a marker is clicked. Shows marker name, distance, edit/delete buttons. Positioned near the marker (use Leaflet's latLngToContainerPoint for positioning).

**Step 2: Integrate into Map.tsx**

Replace the Leaflet `<Popup>` with the floating MarkerInfoCard. When a marker is selected, show the card positioned near it.

**Step 3: Verify**

Click a marker — floating glass card appears near it with marker info. Click outside or X dismisses it.

**Step 4: Commit**

```
feat: add floating glass marker info cards
```

---

## Phase 6: Guild Pages Redesign

### Task 19: Redesign Guild List Page

**Files:**
- Modify: `app/guilds/page.tsx`
- Modify: `app/guilds/components/GuildsTable.tsx`
- Modify: `app/guilds/components/CreateGuild.tsx`

**Step 1: Read current guild list components**

**Step 2: Replace table with glass card grid**

Each guild as a GlassPanel card with coronaHover: guild name, member count, role badge. "Create Guild" as a dashed-border GlassPanel with corona pulse CTA.

**Step 3: Commit**

```
feat: redesign guild list as glass card grid
```

---

### Task 20: Redesign Guild Detail Layout

**Files:**
- Modify: `app/guilds/[id]/layout.tsx`
- Modify: `app/guilds/[id]/components/GuildBanner.tsx`
- Modify: `app/guilds/[id]/components/GuildNav.tsx`

**Step 1: Read current files**

**Step 2: Update layout with glass panels**

Banner gets glass overlay + corona edge. Tab navigation becomes glass-morphism tabs.

**Step 3: Commit**

```
feat: redesign guild detail layout with glass panels
```

---

### Task 21: Redesign Guild Members

**Files:**
- Modify: `app/guilds/[id]/components/GuildMembers.tsx`
- Modify: `app/guilds/[id]/components/GuildAddMember.tsx`

**Step 1: Replace table with card grid**

Member cards in a responsive grid (2-3 columns). Each card: GlassPanel with name, role badge. Admin actions as hover icon buttons. "Add Member" as a search card at the top.

**Step 2: Commit**

```
feat: redesign guild members as glass card grid
```

---

### Task 22: Redesign Guild Settings

**Files:**
- Modify: `app/guilds/[id]/components/GuildSettings.tsx`

**Step 1: Wrap in GlassPanel**

Settings form in a GlassPanel. Danger zone (delete guild) in a separate GlassPanel with red-tinted corona (override `--corona-rgb` locally with destructive color).

**Step 2: Commit**

```
feat: redesign guild settings with glass panels
```

---

## Phase 7: User Profile Pages

### Task 23: Build User Profile Page

**Files:**
- Modify: `app/users/[id]/page.tsx` (currently returns null)
- Modify: `app/users/[id]/layout.tsx`

**Step 1: Read current layout and provider**

**Step 2: Build profile page**

GlassPanel with user avatar, display name, join date. Below: grid of guild membership cards (mini GlassPanels).

**Step 3: Commit**

```
feat: build user profile page with glass panels
```

---

### Task 24: Redesign User Settings

**Files:**
- Modify: `app/users/[id]/settings/page.tsx`
- Modify: `app/users/[id]/components/settings/ColorPicker.tsx`

**Step 1: Read current files**

**Step 2: Wrap in glass panels**

Theme picker with visual swatches. Color picker in GlassPanel. Each theme swatch shows a mini preview of its corona color.

**Step 3: Commit**

```
feat: redesign user settings with glass panels and theme swatches
```

---

## Phase 8: Polish and Cleanup

### Task 25: Update Leaflet Map Styles

**Files:**
- Modify: `app/globals.css` — update Leaflet overrides

**Step 1: Update map CSS**

Replace the old Leaflet control styles with glass-morphism overrides. Remove the `.leaflet-top.leaflet-left` background-color (controls are now floating, not in that container). Update `.leaflet-bar a` styles to match the glass theme.

Remove `cursor: crosshair` override since we have a custom cursor now.

**Step 2: Commit**

```
feat: update Leaflet map styles for glass-morphism theme
```

---

### Task 26: Remove Old Banner Component

**Files:**
- Check if `app/tools/components/Banner.tsx` is still used after calculator redesign
- If unused, delete it and any associated image references that are no longer needed

**Step 1: Search for Banner imports**

If no remaining imports, delete the file.

**Step 2: Commit**

```
chore: remove unused Banner component
```

---

### Task 27: Final Visual Audit

**Step 1: Run the app and check every page**

- Home (logged out): hero + glass feature cards
- Home (logged in): rich dashboard with glass panels
- Tools hub: glass card grid
- Each calculator: two-column glass layout with results
- Map: full viewport, floating toolbar, floating panels
- Guilds list: glass card grid
- Guild detail: glass banner + tabs + members/settings
- User profile: glass panels
- User settings: theme swatches + glass panels

**Step 2: Check all 4 themes × 2 modes**

Corona color should change per theme. Particles should be theme-colored.

**Step 3: Check mobile**

Bottom nav glass, no custom cursor on touch, proper stacking.

**Step 4: Check reduced motion**

Corona rotation stops. Particles disabled. Cursor dot+ring still work.

**Step 5: Fix any issues found, commit**

```
fix: visual audit corrections
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-5 | Atmosphere foundation: corona CSS, GlassPanel, grain, particles, cursor |
| 2 | 6-8 | Navigation: sidebar glass+corona, mobile glass, SpeedDial pulse |
| 3 | 9 | Home page: rich dashboard with glass panels |
| 4 | 10-15 | Calculators: tools hub, currency, item, mount, service, travel |
| 5 | 16-18 | Map: floating toolbar, floating marker list, info cards |
| 6 | 19-22 | Guilds: list grid, detail layout, members grid, settings |
| 7 | 23-24 | User profile + settings |
| 8 | 25-27 | Polish: Leaflet styles, cleanup, visual audit |
