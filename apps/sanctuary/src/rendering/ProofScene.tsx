/**
 * File: apps/sanctuary/src/rendering/ProofScene.tsx
 * Description: Renders one small procedural Three.js scene inside the optional visual viewport.
 * Purpose: Proves local Canvas initialization, lighting, camera, resizing, and restrained animation.
 * Notes: The scene uses no remote assets, textures, models, audio, physics, or journey content.
 */

// Import only the R3F frame hook and React ref required for the small rotating primitive.
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

// Describe the single visitor-preference input that controls optional proof-scene motion.
interface ProofSceneProps {
  readonly reducedMotion: boolean;
}

// Render a low-complexity local scene whose animation stops completely for reduced-motion visitors.
export function ProofScene({ reducedMotion }: ProofSceneProps) {
  const formRef = useRef<Mesh>(null);

  useFrame((_state, delta) => {
    if (!reducedMotion && formRef.current !== null) {
      formRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <>
      <color attach="background" args={["#10231d"]} />
      <ambientLight intensity={0.55} color="#dcebc9" />
      <directionalLight color="#e9d7a5" intensity={1.4} position={[3, 4, 5]} />
      <pointLight color="#8ac59e" intensity={0.7} position={[-3, -1, 2]} />
      <mesh ref={formRef} rotation={[0.2, 0, 0]}>
        <icosahedronGeometry args={[1.35, 2]} />
        <meshStandardMaterial color="#5d9d79" metalness={0.08} roughness={0.72} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
        <circleGeometry args={[4.8, 48]} />
        <meshStandardMaterial color="#173a2e" metalness={0} roughness={1} />
      </mesh>
    </>
  );
}
