"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  OrbitControls,
  Environment,
  Float,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = "/models/fantasy+fortune+teller+3d+model.glb";

function Model(props: any) {
  // The .glb file lives in public/models/fantasy+fortune+teller+3d+model.glb
  const { scene } = useGLTF(MODEL_URL);
  const modelRef = useRef<THREE.Group>(null);

  // Gentle "breathing"/soft rotation animation.
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y =
        Math.sin(state.clock.getElapsedTime() * 0.3) * 0.1;
    }
  });

  return (
    <group ref={modelRef} {...props} dispose={null}>
      <primitive object={scene} scale={2} position={[0, -2, 0]} />
    </group>
  );
}

export default function FortuneTeller3D() {
  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        // Cap the device pixel ratio so retina screens are not overloaded.
        dpr={[1, 1.75]}
        className="h-full w-full"
      >
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Model />
        </Float>

        <Sparkles
          count={30}
          scale={6}
          size={4}
          speed={0.4}
          opacity={0.5}
          color="#fbbf24"
        />

        <Environment preset="night" />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>

      {/* Interaction hint — only shown while the 3D is active (desktop). */}
      <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center">
        <p className="text-sm tracking-wide text-gold-300/50">
          Drag to rotate
        </p>
      </div>
    </div>
  );
}

// Preload the model only when this chunk is imported (desktop).
useGLTF.preload(MODEL_URL);
