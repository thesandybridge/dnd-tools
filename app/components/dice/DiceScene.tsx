"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier"
import { OrbitControls, Environment, ContactShadows, Sparkles, useTexture } from "@react-three/drei"
import * as THREE from "three"
import Die from "./Die"
import type { DieType } from "./utils"

type DiceSceneProps = {
  dieType: DieType
  rollKey: number
  onResult: (result: number) => void
  dieColor: string
  numberColor: string
}

function WoodTable() {
  const textures = useTexture({
    map: "/textures/wood/color.jpg",
    normalMap: "/textures/wood/normal.jpg",
    roughnessMap: "/textures/wood/roughness.jpg",
  })

  // Tile for a larger surface
  Object.values(textures).forEach(tex => {
    if (tex instanceof THREE.Texture) {
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.RepeatWrapping
      tex.repeat.set(2, 2)
    }
  })

  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]}>
      <CuboidCollider args={[10, 0.5, 10]} />
      <mesh receiveShadow position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial
          {...textures}
          color="#6b4a32"
          roughness={0.9}
          metalness={0.0}
          normalScale={new THREE.Vector2(1.5, 1.5)}
        />
      </mesh>
    </RigidBody>
  )
}

function Walls() {
  return (
    <>
      <RigidBody type="fixed" position={[5, 2, 0]}>
        <CuboidCollider args={[0.5, 4, 10]} />
      </RigidBody>
      <RigidBody type="fixed" position={[-5, 2, 0]}>
        <CuboidCollider args={[0.5, 4, 10]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 2, 5]}>
        <CuboidCollider args={[10, 4, 0.5]} />
      </RigidBody>
      <RigidBody type="fixed" position={[0, 2, -5]}>
        <CuboidCollider args={[10, 4, 0.5]} />
      </RigidBody>
    </>
  )
}

function Scene({ dieType, rollKey, onResult, dieColor, numberColor }: DiceSceneProps) {
  return (
    <Physics gravity={[0, -20, 0]}>
      <WoodTable />
      <Walls />
      <Die dieType={dieType} rollKey={rollKey} onResult={onResult} dieColor={dieColor} numberColor={numberColor} />
    </Physics>
  )
}

export default function DiceScene({ dieType, rollKey, onResult, dieColor, numberColor }: DiceSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 7, 7], fov: 35 }}
      shadows
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, toneMapping: 3 }}
    >
      {/* Warm key light */}
      <directionalLight
        position={[4, 8, 4]}
        intensity={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        color="#ffeedd"
      />
      {/* Cool fill */}
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#aaccff" />
      {/* Themed rim */}
      <pointLight position={[0, 3, -5]} intensity={1.5} color={dieColor} distance={15} />
      {/* Soft ambient so table is visible */}
      <ambientLight intensity={0.3} />

      <Suspense fallback={null}>
        <Environment preset="apartment" environmentIntensity={0.3} />

        <Scene dieType={dieType} rollKey={rollKey} onResult={onResult} dieColor={dieColor} numberColor={numberColor} />

        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.6}
          scale={12}
          blur={2}
          far={4}
          color="#0a0500"
        />

        <Sparkles
          count={30}
          scale={7}
          size={1.5}
          speed={0.2}
          opacity={0.3}
          color={dieColor}
        />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.5}
      />
    </Canvas>
  )
}
