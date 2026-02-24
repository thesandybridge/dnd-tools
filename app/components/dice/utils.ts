import * as THREE from "three"

export type DieType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20"

export const DICE_CONFIG: Record<DieType, { faces: number; label: string }> = {
  d4:  { faces: 4,  label: "D4" },
  d6:  { faces: 6,  label: "D6" },
  d8:  { faces: 8,  label: "D8" },
  d10: { faces: 10, label: "D10" },
  d12: { faces: 12, label: "D12" },
  d20: { faces: 20, label: "D20" },
}

// Plane size for face number labels per die type
export const NUMBER_SCALE: Record<DieType, number> = {
  d4: 0.7,
  d6: 0.7,
  d8: 0.5,
  d10: 0.45,
  d12: 0.45,
  d20: 0.35,
}

export function createNumberTexture(
  number: number,
  size = 128,
  textColor = "#1a1207"
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  // Transparent background — only the number is drawn
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = textColor
  ctx.font = `bold ${size * 0.55}px sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(String(number), size / 2, size / 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// --- Face computation ---

export type FaceInfo = {
  centroid: THREE.Vector3
  normal: THREE.Vector3
  number: number
}

export function computeFaces(geometry: THREE.BufferGeometry, faceCount: number): FaceInfo[] {
  const pos = geometry.getAttribute("position")
  const idx = geometry.getIndex()
  const triCount = idx ? idx.count / 3 : pos.count / 3

  // Per-triangle normals and centroids
  const triNormals: THREE.Vector3[] = []
  const triCentroids: THREE.Vector3[] = []

  for (let i = 0; i < triCount; i++) {
    const a = new THREE.Vector3()
    const b = new THREE.Vector3()
    const c = new THREE.Vector3()
    if (idx) {
      a.fromBufferAttribute(pos, idx.getX(i * 3))
      b.fromBufferAttribute(pos, idx.getX(i * 3 + 1))
      c.fromBufferAttribute(pos, idx.getX(i * 3 + 2))
    } else {
      a.fromBufferAttribute(pos, i * 3)
      b.fromBufferAttribute(pos, i * 3 + 1)
      c.fromBufferAttribute(pos, i * 3 + 2)
    }

    const normal = new THREE.Vector3()
      .crossVectors(
        new THREE.Vector3().subVectors(b, a),
        new THREE.Vector3().subVectors(c, a)
      )
      .normalize()

    const centroid = new THREE.Vector3()
      .add(a).add(b).add(c)
      .divideScalar(3)

    triNormals.push(normal)
    triCentroids.push(centroid)
  }

  // Group coplanar triangles (same face)
  const groups: number[][] = []
  const assigned = new Set<number>()

  for (let i = 0; i < triCount; i++) {
    if (assigned.has(i)) continue
    const group = [i]
    assigned.add(i)
    for (let j = i + 1; j < triCount; j++) {
      if (assigned.has(j)) continue
      if (triNormals[i].dot(triNormals[j]) > 0.99) {
        group.push(j)
        assigned.add(j)
      }
    }
    groups.push(group)
  }

  return groups.slice(0, faceCount).map((group, i) => {
    const centroid = new THREE.Vector3()
    const normal = new THREE.Vector3()
    for (const t of group) {
      centroid.add(triCentroids[t])
      normal.add(triNormals[t])
    }
    centroid.divideScalar(group.length)
    normal.normalize()
    return { centroid, normal, number: i + 1 }
  })
}

// --- Result detection ---

export function getUpFace(quaternion: THREE.Quaternion, dieType: DieType): number {
  const up = new THREE.Vector3(0, 1, 0)

  const geo = buildGeoForType(dieType)
  const faces = computeFaces(geo, DICE_CONFIG[dieType].faces)
  geo.dispose()

  let maxDot = -Infinity
  let bestIdx = 0
  for (let i = 0; i < faces.length; i++) {
    const rotated = faces[i].normal.clone().applyQuaternion(quaternion)
    const dot = rotated.dot(up)
    if (dot > maxDot) {
      maxDot = dot
      bestIdx = i
    }
  }

  return faces[bestIdx].number
}

function buildGeoForType(dieType: DieType): THREE.BufferGeometry {
  switch (dieType) {
    case "d4":  return new THREE.TetrahedronGeometry(1)
    case "d6":  return new THREE.BoxGeometry(1, 1, 1)
    case "d8":  return new THREE.OctahedronGeometry(1)
    case "d10": return new THREE.DodecahedronGeometry(1)
    case "d12": return new THREE.DodecahedronGeometry(1)
    case "d20": return new THREE.IcosahedronGeometry(1)
  }
}
