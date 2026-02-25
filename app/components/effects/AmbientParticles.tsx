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

    const observer = new MutationObserver(() => {
      rgb = getCoronaRgb()
      coronaIntensity = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--corona-intensity")
      ) || 0.8
      const particle = document.documentElement.getAttribute("data-particle")
      if (particle === "off") { particles = []; return }
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
      }
    }

    let lastTime = performance.now()

    function animate(now: number) {
      const dt = now - lastTime
      lastTime = now
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)

      const particle = document.documentElement.getAttribute("data-particle")
      if (particle !== "off") {
        while (particles.length < MAX_PARTICLES) {
          particles.push(spawnParticle())
        }
      }

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

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${p.opacity})`
        ctx!.fill()

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
