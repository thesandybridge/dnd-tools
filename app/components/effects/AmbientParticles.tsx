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
  phase: number
  life: number
  maxLife: number
  rotation: number
}

type Rgb = [number, number, number]

function drawEmber(ctx: CanvasRenderingContext2D, p: Particle, alpha: number, rgb: Rgb) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
  ctx.fill()
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.15})`
  ctx.fill()
}

function drawWisp(ctx: CanvasRenderingContext2D, p: Particle, alpha: number, rgb: Rgb) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation + p.life * 0.005)
  ctx.beginPath()
  ctx.ellipse(0, 0, p.size * 2, p.size * 0.5, 0, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.6})`
  ctx.fill()
  ctx.restore()
}

function drawFlame(ctx: CanvasRenderingContext2D, p: Particle, alpha: number, rgb: Rgb) {
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

function drawSparkle(ctx: CanvasRenderingContext2D, p: Particle, alpha: number, rgb: Rgb) {
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

const DRAWERS: Record<string, typeof drawEmber> = {
  ember: drawEmber, wisp: drawWisp, flame: drawFlame, sparkle: drawSparkle,
}

function getCoronaRgb(): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--corona-rgb").trim()
  const parts = raw.split(",").map(Number)
  if (parts.length === 3 && parts.every((n) => !isNaN(n))) return parts as [number, number, number]
  return [200, 164, 78]
}

export function AmbientParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animId = 0
    let particles: Particle[] = []
    let rgb = getCoronaRgb()
    let coronaIntensity = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--corona-intensity")
    ) || 0.8
    let particleType = document.documentElement.getAttribute("data-particle") || "ember"

    const observer = new MutationObserver(() => {
      rgb = getCoronaRgb()
      coronaIntensity = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--corona-intensity")
      ) || 0.8
      particleType = document.documentElement.getAttribute("data-particle") || "ember"
      if (particleType === "off") { particles = []; return }
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
        rotation: Math.random() * Math.PI * 2,
      }
    }

    let lastTime = performance.now()

    function animate(now: number) {
      const dt = now - lastTime
      lastTime = now
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      if (particleType !== "off") {
        while (particles.length < MAX_PARTICLES) {
          particles.push(spawnParticle())
        }
      }

      const draw = DRAWERS[particleType] || drawEmber

      particles = particles.filter((p) => {
        p.life += dt
        if (p.life > p.maxLife) return false
        p.x += p.vx
        p.y += p.vy
        p.vx += (Math.random() - 0.5) * 0.01

        const progress = p.life / p.maxLife
        const fadeIn = Math.min(progress * 5, 1)
        const fadeOut = Math.min((1 - progress) * 5, 1)
        const pulse = 0.5 + 0.5 * Math.sin(p.phase + p.life * 0.002)
        p.opacity = fadeIn * fadeOut * pulse * 0.35 * coronaIntensity

        draw(ctx!, p, p.opacity, rgb)

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
