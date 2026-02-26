"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { DieType } from "./utils"

const vertexShader = `
  varying float vDepth;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mvPos.z;
    gl_Position = projectionMatrix * mvPos;
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uNear;
  uniform float uFar;
  varying float vDepth;
  void main() {
    float t = smoothstep(uNear, uFar, vDepth);
    float alpha = mix(0.9, 0.15, t);
    gl_FragColor = vec4(uColor, alpha);
  }
`

function buildBaseGeometry(dieType: DieType): THREE.BufferGeometry {
  switch (dieType) {
    case "d4":  return new THREE.TetrahedronGeometry(1.2)
    case "d6":  return new THREE.BoxGeometry(1.3, 1.3, 1.3)
    case "d8":  return new THREE.OctahedronGeometry(1.2)
    case "d10": return new THREE.DodecahedronGeometry(1.1)
    case "d12": return new THREE.DodecahedronGeometry(1.2)
    case "d20": return new THREE.IcosahedronGeometry(1.2)
  }
}

function RotatingDie({ dieType, spinning, color }: { dieType: DieType; spinning: boolean; color: string }) {
  const ref = useRef<THREE.Group>(null)

  const edges = useMemo(() => {
    const base = buildBaseGeometry(dieType)
    const geo = new THREE.EdgesGeometry(base, 1)
    base.dispose()
    return geo
  }, [dieType])

  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color() },
      uNear: { value: 2.0 },
      uFar: { value: 5.2 },
    },
    vertexShader,
    fragmentShader,
  }), [])

  useEffect(() => {
    material.uniforms.uColor.value.set(color)
  }, [color, material])

  useEffect(() => () => edges.dispose(), [edges])
  useEffect(() => () => material.dispose(), [material])

  useFrame(({ clock }, delta) => {
    if (!ref.current) return
    const speed = spinning ? 6 : 0.4
    ref.current.rotation.x += delta * speed * 0.7
    ref.current.rotation.y += delta * speed
    ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.06
  })

  return (
    <group ref={ref}>
      <lineSegments geometry={edges} material={material} />
    </group>
  )
}

// --- Themed particle draw functions (matching CursorGlow) ---

type Particle = {
  x: number; y: number; vx: number; vy: number
  size: number; life: number; maxLife: number; phase: number; rotation: number
}

type Rgb = [number, number, number]

function drawEmber(ctx: CanvasRenderingContext2D, p: Particle, alpha: number, rgb: Rgb) {
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
  ctx.fill()
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha * 0.2})`
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

// --- 2D particle emitter around the die ---

function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>, spinningRef: React.RefObject<boolean>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = 160, h = 160
    const dpr = window.devicePixelRatio || 1
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)
    const cx = w / 2, cy = h / 2

    function getRgb(): Rgb {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--corona-rgb").trim()
      const parts = raw.split(",").map(Number)
      return parts.length === 3 && parts.every(n => !isNaN(n)) ? parts as Rgb : [200, 164, 78]
    }

    function getIntensity() {
      return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--corona-intensity")) || 0.5
    }

    function getParticleType() {
      return document.documentElement.getAttribute("data-particle") || "ember"
    }

    let rgb = getRgb()
    let intensity = getIntensity()
    let particleType = getParticleType()

    const observer = new MutationObserver(() => {
      rgb = getRgb()
      intensity = getIntensity()
      particleType = getParticleType()
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-particle", "style"] })

    let particles: Particle[] = []
    let animId = 0
    let lastTime = performance.now()

    function spawn(): Particle {
      return {
        x: cx + (Math.random() - 0.5) * 24,
        y: cy - 12 + Math.random() * 6,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.3 + Math.random() * 0.5),
        size: 0.8 + Math.random() * 1.5,
        life: 0,
        maxLife: 1200 + Math.random() * 1500,
        phase: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI * 2,
      }
    }

    function animate(now: number) {
      const dt = now - lastTime
      lastTime = now
      ctx!.clearRect(0, 0, w, h)

      if (particleType !== "off") {
        const spinning = spinningRef.current
        const maxP = spinning ? 20 : 12
        const spawnChance = spinning ? 0.3 : 0.12
        if (particles.length < maxP && Math.random() < spawnChance) {
          particles.push(spawn())
        }
      }

      const draw = DRAWERS[particleType] || drawEmber

      particles = particles.filter(p => {
        p.life += dt
        if (p.life > p.maxLife) return false
        p.x += p.vx
        p.y += p.vy
        p.vx += (Math.random() - 0.5) * 0.01

        const progress = p.life / p.maxLife
        const fadeIn = Math.min(progress * 4, 1)
        const fadeOut = Math.min((1 - progress) * 3, 1)
        const pulse = 0.6 + 0.4 * Math.sin(p.phase + p.life * 0.003)
        const opacity = fadeIn * fadeOut * pulse * 0.45 * intensity

        draw(ctx!, p, opacity, rgb)

        return true
      })

      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      observer.disconnect()
    }
  }, [canvasRef, spinningRef])
}

export default function WireframeDie({ dieType, spinning, color }: { dieType: DieType; spinning: boolean; color: string }) {
  const particleRef = useRef<HTMLCanvasElement>(null)
  const spinningRef = useRef(spinning)
  spinningRef.current = spinning

  useParticles(particleRef, spinningRef)

  return (
    <div className="relative" style={{ width: 160, height: 160 }}>
      <canvas
        ref={particleRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: 160, height: 160 }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 40 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => { gl.toneMapping = THREE.NoToneMapping }}
          style={{ width: 80, height: 80 }}
        >
          <RotatingDie dieType={dieType} spinning={spinning} color={color} />
        </Canvas>
      </div>
    </div>
  )
}
