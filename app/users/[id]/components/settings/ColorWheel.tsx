'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface ColorWheelProps {
  color: string
  onChange: (hex: string) => void
}

// --- Color conversion utilities ---

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const sN = s / 100
  const vN = v / 100
  const c = vN * sN
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = vN - c
  let r = 0, g = 0, b = 0

  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

function hsvToHex(h: number, s: number, v: number): string {
  const [r, g, b] = hsvToRgb(h, s, v)
  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  )
}

function hexToHsv(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16) / 255
  const g = parseInt(cleaned.substring(2, 4), 16) / 255
  const b = parseInt(cleaned.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  const s = max === 0 ? 0 : d / max
  return [Math.round(h * 360), Math.round(s * 100), Math.round(max * 100)]
}

// --- Component ---

export default function ColorWheel({ color, onChange }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragMode = useRef<'hue' | 'sv' | null>(null)

  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(color))
  const [hexInput, setHexInput] = useState(color)
  const [canvasSize, setCanvasSize] = useState(220)

  const [hue, sat, val] = hsv

  // Sync from parent color prop
  useEffect(() => {
    const newHsv = hexToHsv(color)
    setHsv(newHsv)
    setHexInput(color)
  }, [color])

  // Observe container width for responsive sizing
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setCanvasSize(Math.min(Math.max(width, 160), 280))
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Geometry calculations
  const ringWidth = 20
  const center = canvasSize / 2
  const outerRadius = canvasSize / 2 - 1
  const innerRadius = outerRadius - ringWidth
  // SV square inscribed in the inner circle
  const squareHalf = (innerRadius - 4) / Math.SQRT2
  const squareLeft = center - squareHalf
  const squareTop = center - squareHalf
  const squareSize = squareHalf * 2

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize * dpr
    canvas.height = canvasSize * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, canvasSize, canvasSize)

    // --- Draw hue ring ---
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180
      const endAngle = ((angle + 1) * Math.PI) / 180
      ctx.beginPath()
      ctx.arc(center, center, outerRadius - ringWidth / 2, startAngle, endAngle)
      ctx.lineWidth = ringWidth
      ctx.strokeStyle = `hsl(${(angle + 90) % 360}, 100%, 50%)`
      ctx.stroke()
    }

    // --- Draw SV square ---
    // putImageData ignores canvas transform, so scale coordinates/size by DPR
    const scaledSize = Math.ceil(squareSize * dpr)
    const imgData = ctx.createImageData(scaledSize, scaledSize)
    for (let y = 0; y < scaledSize; y++) {
      for (let x = 0; x < scaledSize; x++) {
        const s = (x / scaledSize) * 100
        const v = 100 - (y / scaledSize) * 100
        const [r, g, b] = hsvToRgb(hue, s, v)
        const idx = (y * scaledSize + x) * 4
        imgData.data[idx] = r
        imgData.data[idx + 1] = g
        imgData.data[idx + 2] = b
        imgData.data[idx + 3] = 255
      }
    }
    ctx.putImageData(imgData, Math.round(squareLeft * dpr), Math.round(squareTop * dpr))

    // Border around SV square
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.strokeRect(squareLeft, squareTop, squareSize, squareSize)

    // --- Hue ring indicator ---
    const hueAngle = ((hue - 90) * Math.PI) / 180
    const hueIndicatorR = outerRadius - ringWidth / 2
    const hx = center + hueIndicatorR * Math.cos(hueAngle)
    const hy = center + hueIndicatorR * Math.sin(hueAngle)
    ctx.beginPath()
    ctx.arc(hx, hy, ringWidth / 2 + 1, 0, Math.PI * 2)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(hx, hy, ringWidth / 2 + 1, 0, Math.PI * 2)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()

    // --- SV crosshair indicator ---
    const svX = squareLeft + (sat / 100) * squareSize
    const svY = squareTop + ((100 - val) / 100) * squareSize
    ctx.beginPath()
    ctx.arc(svX, svY, 6, 0, Math.PI * 2)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(svX, svY, 6, 0, Math.PI * 2)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()
  }, [hue, sat, val, canvasSize, center, outerRadius, innerRadius, squareHalf, squareLeft, squareTop, squareSize, ringWidth])

  const updateColor = useCallback(
    (h: number, s: number, v: number) => {
      setHsv([h, s, v])
      const hex = hsvToHex(h, s, v)
      setHexInput(hex)
      onChange(hex)
    },
    [onChange]
  )

  const getCanvasPosition = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      }
    },
    []
  )

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const pos = getCanvasPosition(e)
      if (!pos) return
      const dx = pos.x - center
      const dy = pos.y - center
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist >= innerRadius && dist <= outerRadius) {
        dragMode.current = 'hue'
        const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360
        updateColor(Math.round(angle), sat, val)
      } else if (
        pos.x >= squareLeft &&
        pos.x <= squareLeft + squareSize &&
        pos.y >= squareTop &&
        pos.y <= squareTop + squareSize
      ) {
        dragMode.current = 'sv'
        const s = Math.round(Math.min(100, Math.max(0, ((pos.x - squareLeft) / squareSize) * 100)))
        const v = Math.round(Math.min(100, Math.max(0, 100 - ((pos.y - squareTop) / squareSize) * 100)))
        updateColor(hue, s, v)
      }
    },
    [center, innerRadius, outerRadius, squareLeft, squareTop, squareSize, hue, sat, val, updateColor, getCanvasPosition]
  )

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!dragMode.current) return
      const pos = getCanvasPosition(e)
      if (!pos) return

      if (dragMode.current === 'hue') {
        const dx = pos.x - center
        const dy = pos.y - center
        const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360
        updateColor(Math.round(angle), sat, val)
      } else if (dragMode.current === 'sv') {
        const s = Math.round(Math.min(100, Math.max(0, ((pos.x - squareLeft) / squareSize) * 100)))
        const v = Math.round(Math.min(100, Math.max(0, 100 - ((pos.y - squareTop) / squareSize) * 100)))
        updateColor(hue, s, v)
      }
    },
    [center, squareLeft, squareTop, squareSize, hue, sat, val, updateColor, getCanvasPosition]
  )

  const handlePointerUp = useCallback(() => {
    dragMode.current = null
  }, [])

  // Global mouseup/touchend to catch release outside canvas
  useEffect(() => {
    const up = () => { dragMode.current = null }
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchend', up)
    }
  }, [])

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHexInput(value)
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      const [h, s, v] = hexToHsv(value)
      setHsv([h, s, v])
      onChange(value)
    }
  }

  const currentHex = hsvToHex(hue, sat, val)

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3 w-full max-w-[280px]">
      <div className="rounded-lg">
        <canvas
          ref={canvasRef}
          style={{ width: canvasSize, height: canvasSize, touchAction: 'none' }}
          className="cursor-crosshair"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
      </div>
      <div className="flex items-center gap-3 w-full">
        <div
          className="w-9 h-9 rounded-md border border-white/10 shrink-0"
          style={{ backgroundColor: currentHex }}
        />
        <Input
          value={hexInput}
          onChange={handleHexChange}
          maxLength={7}
          className="font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}
