"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  OrbitControls,
  Environment,
  Float,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";

function Model(props: any) {
  // Certifique-se de que o arquivo .glb esteja em public/models/fantasy+fortune+teller+3d+model.glb
  const { scene, animations } = useGLTF(
    "/models/fantasy+fortune+teller+3d+model.glb"
  );
  const modelRef = useRef<THREE.Group>(null);

  // Adiciona uma animação suave de flutuação/respiração se não houver animações no modelo
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
    <div className="w-full h-[400px] md:h-[600px] relative">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />
        <pointLight
          position={[-10, -10, -10]}
          intensity={0.5}
          color="#a855f7"
        />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Model />
        </Float>

        <Sparkles
          count={50}
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

      {/* Loading fallback/overlay could go here */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-purple-300/50 text-sm">Arraste para girar</p>
      </div>
    </div>
  );
}

// Pre-load the model
useGLTF.preload("/models/fantasy+fortune+teller+3d+model.glb");
