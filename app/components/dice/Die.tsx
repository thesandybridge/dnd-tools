"use client"

import { useRef, useEffect, useCallback, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { RoundedBox } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import type { RapierRigidBody } from "@react-three/rapier"
import * as THREE from "three"
import { mergeVertices, toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import {
  computeFaces,
  getUpFace,
  DICE_CONFIG,
  NUMBER_SCALE,
  type DieType,
} from "./utils"
import { createEngravedNumber } from "./textures"

function buildGeometry(dieType: DieType): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry
  switch (dieType) {
    case "d4":  geo = new THREE.TetrahedronGeometry(1.2); break
    case "d6":  geo = new THREE.BoxGeometry(1.4, 1.4, 1.4); break
    case "d8":  geo = new THREE.OctahedronGeometry(1.2); break
    case "d10": geo = new THREE.DodecahedronGeometry(1.1); break
    case "d12": geo = new THREE.DodecahedronGeometry(1.2); break
    case "d20": geo = new THREE.IcosahedronGeometry(1.2); break
  }

  // Soften edges with creased normals (skip d6 — uses RoundedBox)
  if (dieType !== "d6") {
    const merged = mergeVertices(geo, 0.001)
    return toCreasedNormals(merged, Math.PI * 0.2)
  }

  return geo
}

function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min
}

type FaceLabelData = {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  colorTex: THREE.CanvasTexture
  bumpTex: THREE.CanvasTexture
}

function prepareFaceLabels(dieType: DieType, numberColor?: string): FaceLabelData[] {
  // Always compute faces from the original sharp geometry for accurate centroids/normals
  let geo: THREE.BufferGeometry
  switch (dieType) {
    case "d4":  geo = new THREE.TetrahedronGeometry(1.2); break
    case "d6":  geo = new THREE.BoxGeometry(1.4, 1.4, 1.4); break
    case "d8":  geo = new THREE.OctahedronGeometry(1.2); break
    case "d10": geo = new THREE.DodecahedronGeometry(1.1); break
    case "d12": geo = new THREE.DodecahedronGeometry(1.2); break
    case "d20": geo = new THREE.IcosahedronGeometry(1.2); break
  }

  const faceCount = DICE_CONFIG[dieType].faces
  const faces = computeFaces(geo, faceCount)
  geo.dispose()

  return faces.map(face => {
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal)
    const { colorTex, bumpTex } = createEngravedNumber(face.number, 256, numberColor)
    return {
      position: face.centroid.clone().add(face.normal.clone().multiplyScalar(0.03)),
      quaternion: q,
      colorTex,
      bumpTex,
    }
  })
}

// Derive a darker shade for sheen from the die color
function makeResinMaterial(dieColor: string) {
  const base = new THREE.Color(dieColor)
  const sheen = base.clone().multiplyScalar(0.6)
  return {
    color: dieColor,
    roughness: 0.45,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    sheen: 0.2,
    sheenRoughness: 0.5,
    sheenColor: sheen,
  }
}

type DieProps = {
  dieType: DieType
  rollKey: number
  onResult: (result: number) => void
  dieColor: string
  numberColor: string
}

export default function Die({ dieType, rollKey, onResult, dieColor, numberColor }: DieProps) {
  const bodyRef = useRef<RapierRigidBody>(null)
  const labelsRef = useRef<THREE.Group>(null)
  const settledFrames = useRef(0)
  const hasReported = useRef(false)

  const geometry = useMemo(() => buildGeometry(dieType), [dieType])
  const faceLabels = useMemo(() => prepareFaceLabels(dieType, numberColor), [dieType, numberColor])
  const resinMaterial = useMemo(() => makeResinMaterial(dieColor), [dieColor])
  const scale = NUMBER_SCALE[dieType]

  const doRoll = useCallback(() => {
    const body = bodyRef.current
    if (!body) return

    settledFrames.current = 0
    hasReported.current = false

    body.setTranslation({ x: 0, y: 5, z: 0 }, true)
    body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)

    body.applyImpulse(
      { x: randFloat(-3, 3), y: randFloat(5, 8), z: randFloat(-3, 3) },
      true
    )
    body.applyTorqueImpulse(
      { x: randFloat(-15, 15), y: randFloat(-15, 15), z: randFloat(-15, 15) },
      true
    )
  }, [])

  useEffect(() => {
    const timer = setTimeout(doRoll, 150)
    return () => clearTimeout(timer)
  }, [rollKey, doRoll])

  useFrame(() => {
    const body = bodyRef.current
    if (!body) return

    const labels = labelsRef.current
    if (labels) {
      const pos = body.translation()
      const rot = body.rotation()
      labels.position.set(pos.x, pos.y, pos.z)
      labels.quaternion.set(rot.x, rot.y, rot.z, rot.w)
    }

    if (hasReported.current) return

    const linvel = body.linvel()
    const angvel = body.angvel()
    const linSpeed = Math.sqrt(linvel.x ** 2 + linvel.y ** 2 + linvel.z ** 2)
    const angSpeed = Math.sqrt(angvel.x ** 2 + angvel.y ** 2 + angvel.z ** 2)

    if (linSpeed < 0.05 && angSpeed < 0.05) {
      settledFrames.current++
      if (settledFrames.current > 30) {
        hasReported.current = true
        const rot = body.rotation()
        const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w)
        const result = getUpFace(quat, dieType)
        onResult(result)
      }
    } else {
      settledFrames.current = 0
    }
  })

  return (
    <>
      <RigidBody
        ref={bodyRef}
        colliders="hull"
        restitution={0.3}
        friction={0.8}
        linearDamping={0.5}
        angularDamping={0.3}
        position={[0, 5, 0]}
      >
        {dieType === "d6" ? (
          <RoundedBox args={[1.4, 1.4, 1.4]} radius={0.1} smoothness={4} castShadow receiveShadow>
            <meshPhysicalMaterial {...resinMaterial} />
          </RoundedBox>
        ) : (
          <mesh geometry={geometry} castShadow receiveShadow>
            <meshPhysicalMaterial {...resinMaterial} />
          </mesh>
        )}
      </RigidBody>

      {/* Engraved number labels — synced to rigid body, outside collider */}
      <group ref={labelsRef}>
        {faceLabels.map((face, i) => (
          <mesh key={i} position={face.position} quaternion={face.quaternion}>
            <planeGeometry args={[scale, scale]} />
            <meshStandardMaterial
              map={face.colorTex}
              bumpMap={face.bumpTex}
              bumpScale={1.5}
              transparent
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-2}
              side={THREE.DoubleSide}
              roughness={0.8}
              metalness={0.1}
            />
          </mesh>
        ))}
      </group>
    </>
  )
}
