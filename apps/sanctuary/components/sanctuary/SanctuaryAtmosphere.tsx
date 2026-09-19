// File: apps/sanctuary/components/sanctuary/SanctuaryAtmosphere.tsx
// Description: Recreates lightweight, anchor-bound runtime atmosphere.
// Purpose: Adds candle light, smoke, dust, and sunlight without altering source geometry.
// Notes: Every emitter originates from an exported Blender runtime anchor.

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, PointLight, Points } from "three";
import { anchorByRole, point, runtimeAnchors, sourceObjectCenter } from "../../lib/sanctuary/runtime";

const byRole = (role: string) => runtimeAnchors.filter((anchor) => anchor.role === role);

function particleGeometry(points: readonly number[][], spread: [number, number, number], count: number, seed: number) {
  const values = new Float32Array(points.length * count * 3);
  let index = 0;
  for (const [x, y, z] of points) for (let item = 0; item < count; item++) {
    const phase = seed + item * 1.618;
    values[index++] = x + Math.sin(phase * 3.1) * spread[0];
    values[index++] = y + ((item / Math.max(count - 1, 1)) - .5) * spread[1];
    values[index++] = z + Math.cos(phase * 2.3) * spread[2];
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(values, 3));
  return geometry;
}

function ParticleField({ points, spread, count, color, size, opacity, reducedMotion, seed }: { points: readonly number[][]; spread: [number, number, number]; count: number; color: string; size: number; opacity: number; reducedMotion: boolean; seed: number }) {
  const geometry = useMemo(() => particleGeometry(points, spread, count, seed), [points, spread, count, seed]);
  const particles = useRef<Points>(null);
  useFrame((state) => {
    if (!particles.current || reducedMotion) return;
    particles.current.rotation.y = Math.sin(state.clock.elapsedTime * .09 + seed) * .018;
    particles.current.position.y = Math.sin(state.clock.elapsedTime * .13 + seed) * .025;
  });
  return <points ref={particles} geometry={geometry} frustumCulled={false}>
    <pointsMaterial color={color} size={size} transparent opacity={opacity} depthWrite={false} blending={AdditiveBlending} />
  </points>;
}

function CandleLights({ reducedMotion }: { reducedMotion: boolean }) {
  const lights = useRef<PointLight[]>([]);
  const anchors = byRole("CANDLE_LIGHT_ANCHOR");
  useFrame((state) => {
    if (reducedMotion) return;
    lights.current.forEach((light, index) => { light.intensity = .42 + Math.sin(state.clock.elapsedTime * (2.1 + index * .13) + index) * .055; });
  });
  return <>{anchors.map((anchor, index) => <pointLight key={anchor.name} position={point(anchor.position)} color="#ffbf72" intensity={.42} distance={3.6} decay={2} ref={(light) => { if (light) lights.current[index] = light; }} />)}</>;
}

function Sunlight() {
  const sun = anchorByRole("SUNLIGHT_PRIMARY");
  return <directionalLight
    castShadow
    position={point(sun.direction.map((value) => -value * 12))}
    intensity={(sun.detail.energy ?? 1) * .82}
    color="#ffe1b6"
    shadow-mapSize={[1024, 1024]}
    shadow-camera-near={.5}
    shadow-camera-far={30}
    shadow-camera-left={-7}
    shadow-camera-right={7}
    shadow-camera-top={7}
    shadow-camera-bottom={-7}
    shadow-bias={-.00015}
  />;
}

function CeilingCrossLight() {
  const [x, y, z] = sourceObjectCenter("ROG_V2_CeilingCross_CLEAN");
  return <pointLight position={[x, y - .26, z]} color="#f6ce82" intensity={.62} distance={2.3} decay={2} />;
}

export function SanctuaryAtmosphere({ reducedMotion }: { reducedMotion: boolean }) {
  const smoke = byRole("CANDLE_SMOKE_ANCHOR").map((anchor) => anchor.position);
  const dust = anchorByRole("DUST_VOLUME");
  const sunBanks = byRole("SUNRAY_SOURCE_BANK");
  return <>
    <hemisphereLight args={["#e7edf2", "#5b4031", .58]} />
    <Sunlight />
    <CeilingCrossLight />
    {sunBanks.map((anchor) => <spotLight key={anchor.name} position={point(anchor.position)} color="#e7edf2" intensity={.22} angle={.48} penumbra={1} distance={12} decay={1.4} />)}
    <CandleLights reducedMotion={reducedMotion} />
    <ParticleField points={smoke} spread={[.035, .24, .035]} count={12} color="#cfc0ac" size={.045} opacity={.12} reducedMotion={reducedMotion} seed={2} />
    <ParticleField points={[dust.position]} spread={[2.05, 1.75, 2.25]} count={88} color="#f7ddb1" size={.026} opacity={.15} reducedMotion={reducedMotion} seed={7} />
  </>;
}
