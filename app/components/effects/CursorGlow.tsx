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

function getParticleType(): string {
  return document.documentElement.getAttribute("data-particle") || "ember"
}

function drawEmber(ctx: CanvasRenderingContext2D, p: CursorParticle, alpha: number, rgb: [number, number, number]) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
  ctx.fill()
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
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
  ctx.fill()
  ctx.restore()
}

const PARTICLE_DRAWERS: Record<string, typeof drawEmber> = {
  ember: drawEmber,
  wisp: drawWisp,
  flame: drawFlame,
  sparkle: drawSparkle,
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
    if (window.matchMedia("(pointer: coarse)").matches) return

    const canvas = canvasRef.current
    const dot = dotRef.current
    const ring = ringRef.current
    const glow = glowRef.current
    if (!canvas || !dot || !ring || !glow) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let rgb = getCoronaRgb()
    let particleType = getParticleType()
    let animId = 0

    const observer = new MutationObserver(() => {
      rgb = getCoronaRgb()
      particleType = getParticleType()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-mode", "data-particle"],
    })

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    dot.style.opacity = "1"
    ring.style.opacity = "0.6"

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
      dot.style.left = e.clientX + "px"
      dot.style.top = e.clientY + "px"
      glow.style.left = e.clientX + "px"
      glow.style.top = e.clientY + "px"

      const target = e.target as HTMLElement
      const hoverable = target.closest("a, button, [role='button'], input, select, textarea, [data-tilt], label")
      isHoveringRef.current = !!hoverable
      updateHoverState()

      moveCountRef.current++
      if (particleType !== "off" && moveCountRef.current % 3 === 0 && particlesRef.current.length < MAX_PARTICLES) {
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

    const onMouseDown = () => { isDownRef.current = true; updateHoverState() }
    const onMouseUp = () => { isDownRef.current = false; updateHoverState() }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)

    let lastTime = performance.now()

    function animate(now: number) {
      const dt = now - lastTime
      lastTime = now

      ringPosRef.current.x += (mouseRef.current.x - ringPosRef.current.x) * 0.15
      ringPosRef.current.y += (mouseRef.current.y - ringPosRef.current.y) * 0.15
      ring!.style.left = ringPosRef.current.x + "px"
      ring!.style.top = ringPosRef.current.y + "px"

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      const drawFn = PARTICLE_DRAWERS[particleType] || drawEmber

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= dt
        if (p.life <= 0) return false
        p.x += p.vx
        p.y += p.vy
        p.vy -= 0.01
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
