import * as THREE from "three"

// Engraved number texture — dark number with depth shadow on transparent bg

export function createEngravedNumber(number: number, size = 256, textColor = "#080400") {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!

  ctx.clearRect(0, 0, size, size)

  const text = String(number)
  ctx.font = `bold ${size * 0.5}px serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // Shadow for engraved depth
  ctx.shadowColor = "rgba(0,0,0,0.9)"
  ctx.shadowBlur = size * 0.04
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = size * 0.015

  ctx.fillStyle = textColor
  ctx.fillText(text, size / 2, size / 2)

  // Lighter pass on top to simulate concave surface catching light
  ctx.shadowColor = "transparent"
  ctx.globalCompositeOperation = "source-atop"
  ctx.fillStyle = "rgba(100,80,40,0.35)"
  ctx.fillText(text, size / 2, size / 2 - size * 0.01)
  ctx.globalCompositeOperation = "source-over"

  const colorTex = new THREE.CanvasTexture(canvas)
  colorTex.colorSpace = THREE.SRGBColorSpace

  // Bump map — number area recessed (darker = lower)
  const bumpCanvas = document.createElement("canvas")
  bumpCanvas.width = size
  bumpCanvas.height = size
  const bCtx = bumpCanvas.getContext("2d")!

  bCtx.fillStyle = "#808080"
  bCtx.fillRect(0, 0, size, size)

  bCtx.font = `bold ${size * 0.5}px serif`
  bCtx.textAlign = "center"
  bCtx.textBaseline = "middle"
  bCtx.fillStyle = "#383838"
  bCtx.fillText(text, size / 2, size / 2)

  const bumpTex = new THREE.CanvasTexture(bumpCanvas)

  return { colorTex, bumpTex }
}
