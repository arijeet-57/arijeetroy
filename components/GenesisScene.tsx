"use client";

/* ---------------------------------------------------------------------------
 * GenesisScene — a procedural, self-contained R3F background for the "Genesis"
 * section. No external assets: ground texture, light beam, dust, figures, glass
 * portal and glow are all generated in code.
 *
 * Requires (already added to package.json):
 *   npm i three @react-three/fiber @react-three/drei @react-three/postprocessing
 *
 * CAMERA CHOICE: a STATIC elevated perspective camera (looking slightly down at
 * the platform, matching the reference) with *damped positional* mouse parallax
 * (a few tenths of a unit, eased). For a hero *background* this beats Orbit
 * controls: the composition (figure left, portal right, beam from upper-left)
 * must stay readable behind the section's text, so we never rotate the framing
 * — we only nudge the camera for a subtle sense of depth/parallax.
 * ------------------------------------------------------------------------- */

import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

/* ------------------------------- procedural textures -------------------- */

// fBm value-noise → grayscale DataTexture, reused as roughness + bump for a
// worn-concrete ground. DataTexture needs no DOM, so it's SSR-safe.
function makeNoiseTexture(size = 256) {
  const data = new Uint8Array(size * size * 4);
  const rand = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const lerp = THREE.MathUtils.lerp;
  const vnoise = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = smooth(xf);
    const v = smooth(yf);
    const tl = rand(xi, yi);
    const tr = rand(xi + 1, yi);
    const bl = rand(xi, yi + 1);
    const br = rand(xi + 1, yi + 1);
    return lerp(lerp(tl, tr, u), lerp(bl, br, u), v);
  };
  const fbm = (x: number, y: number) => {
    let a = 0.5;
    let f = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < 5; i++) {
      sum += a * vnoise(x * f, y * f);
      norm += a;
      a *= 0.5;
      f *= 2;
    }
    return sum / norm;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const n = fbm((x / size) * 10, (y / size) * 10);
      const v = Math.max(0, Math.min(255, Math.floor(n * 255)));
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
}

// soft radial white→transparent sprite, tinted per-material — used for the
// portal figure's glow halo and the floor reflection patch.
function makeGlowTexture(size = 128) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

/* --------------------------------- ground ------------------------------- */

function Ground() {
  const noise = useMemo(() => makeNoiseTexture(256), []);
  return (
    <group>
      {/* main worn-concrete disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[16, 64]} />
        <meshPhysicalMaterial
          color="#0a0403"
          roughness={0.82}
          metalness={0}
          roughnessMap={noise}
          bumpMap={noise}
          bumpScale={0.04}
          reflectivity={0.18}
          clearcoat={0.35}
          clearcoatRoughness={0.7}
        />
      </mesh>
      {/* two low tiers echoing the platform steps in the reference */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[13, 13, 0.16, 64]} />
        <meshStandardMaterial color="#080302" roughness={0.9} metalness={0} />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[15.5, 15.5, 0.18, 64]} />
        <meshStandardMaterial color="#060202" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

/* ---------------------------- volumetric beam --------------------------- */

const BEAM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const BEAM_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    // bright down the centre, fading to the sides
    float hx = 1.0 - abs(vUv.x - 0.5) * 2.0;
    hx = pow(clamp(hx, 0.0, 1.0), 1.7);
    // brightest near the source (top), dying out before the floor (bottom)
    float ly = smoothstep(0.0, 0.4, vUv.y) * mix(0.55, 1.0, vUv.y);
    // slow flicker + a little stepped noise so it feels like a real lamp
    float fl = 0.86 + 0.14 * sin(uTime * 6.0) + 0.06 * hash(floor(uTime * 11.0));
    float a = hx * ly * fl * 0.5;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

function Beam() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#ff2418") },
    }),
    []
  );
  useFrame((_, dt) => {
    if (mat.current) mat.current.uniforms.uTime.value += dt;
  });
  return (
    <group>
      {/* the shaft — a camera-ish-facing quad slanting from the upper-left */}
      <mesh position={[-1.7, 3.1, -0.4]} rotation={[0, 0.34, 0.5]}>
        <planeGeometry args={[4.6, 9]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={BEAM_VERT}
          fragmentShader={BEAM_FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------- figures -------------------------------- */

// a simple capsule/sphere humanoid (~1.78 units tall, feet at y=0)
function Figure({
  material,
  ...props
}: { material: THREE.Material } & ThreeElements["group"]) {
  return (
    <group {...props}>
      <mesh position={[0, 1.62, 0]} material={material}>
        <sphereGeometry args={[0.16, 16, 16]} />
      </mesh>
      <mesh position={[0, 1.15, 0]} material={material}>
        <capsuleGeometry args={[0.19, 0.5, 4, 12]} />
      </mesh>
      <mesh position={[-0.28, 1.16, 0]} rotation={[0, 0, 0.16]} material={material}>
        <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
      </mesh>
      <mesh position={[0.28, 1.16, 0]} rotation={[0, 0, -0.16]} material={material}>
        <capsuleGeometry args={[0.07, 0.55, 4, 8]} />
      </mesh>
      <mesh position={[-0.1, 0.45, 0]} material={material}>
        <capsuleGeometry args={[0.09, 0.72, 4, 8]} />
      </mesh>
      <mesh position={[0.1, 0.45, 0]} material={material}>
        <capsuleGeometry args={[0.09, 0.72, 4, 8]} />
      </mesh>
    </group>
  );
}

/* ------------------------------ the portal ------------------------------ */

function Portal() {
  const group = useRef<THREE.Group>(null);
  const figure = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Mesh>(null);

  const glowTex = useMemo(() => makeGlowTexture(), []);
  // fully-black, fog-lit silhouette for the *real* figure elsewhere; here the
  // glowing one is unlit + emissive so Bloom bleeds light off it.
  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff6a52"),
        toneMapped: false,
        fog: false,
      }),
    []
  );
  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0c0505",
        roughness: 0.4,
        metalness: 0.7,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // the figure "breathes" — subtle scale pulse + bob to feel alive
    if (figure.current) {
      const s = 0.92 + Math.sin(t * 1.5) * 0.02;
      figure.current.scale.setScalar(s);
      figure.current.position.y = Math.sin(t * 1.1) * 0.03;
    }
    if (glow.current) {
      const m = glow.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.7 + Math.sin(t * 1.5) * 0.12;
    }
  });

  return (
    <group ref={group} position={[1.5, 0, -0.4]} rotation={[0, -0.16, 0]}>
      {/* the ghostly glowing humanoid, sitting just behind the glass */}
      <group position={[0, 0, -0.16]}>
        <group ref={figure}>
          <Figure material={glowMat} />
        </group>
        {/* soft halo behind it — Bloom + this sell the "portal light" */}
        <mesh ref={glow} position={[0, 1.2, -0.25]}>
          <planeGeometry args={[1.5, 2.8]} />
          <meshBasicMaterial
            map={glowTex}
            color="#ff2a18"
            transparent
            opacity={0.7}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* the thin glass panel */}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[1.8, 2.6, 0.05]} />
        <MeshTransmissionMaterial
          transmission={0.92}
          roughness={0.05}
          thickness={0.6}
          ior={1.5}
          chromaticAberration={0.04}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.3}
          temporalDistortion={0.05}
          color="#ffd9d4"
          attenuationColor="#ff6a5a"
          attenuationDistance={2.5}
          resolution={256}
          samples={4}
          backside={false}
        />
      </mesh>

      {/* dark frame + stand */}
      <mesh position={[-0.92, 1.35, 0]} material={frameMat}>
        <boxGeometry args={[0.05, 2.72, 0.09]} />
      </mesh>
      <mesh position={[0.92, 1.35, 0]} material={frameMat}>
        <boxGeometry args={[0.05, 2.72, 0.09]} />
      </mesh>
      <mesh position={[0, 2.68, 0]} material={frameMat}>
        <boxGeometry args={[1.9, 0.06, 0.09]} />
      </mesh>
      <mesh position={[0, 0.06, 0.28]} material={frameMat}>
        <boxGeometry args={[1.9, 0.1, 0.7]} />
      </mesh>

      {/* soft red reflection/spill on the wet floor in front of the panel */}
      <mesh
        position={[0, 0.02, 0.9]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[2.2, 3.2]} />
        <meshBasicMaterial
          map={glowTex}
          color="#ff2a16"
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ----------------------------- real figure ------------------------------ */

function RealFigure() {
  // pure-black basic material, still touched by the red FogExp2 → a silhouette
  // with the faint red fog/rim bleed seen in the reference.
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#000000" }),
    []
  );
  // facing away from camera (into the scene) — camera sits at +z
  return <Figure material={mat} position={[-0.7, 0, 1.15]} />;
}

/* ------------------------------- camera rig ----------------------------- */

function Rig() {
  const { camera, pointer } = useThree();
  const base = useMemo(() => new THREE.Vector3(0, 3.2, 7), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    // damped positional parallax — small, so the framing never really moves
    target.set(base.x + pointer.x * 0.5, base.y + pointer.y * 0.28, base.z);
    camera.position.lerp(target, 0.05);
    camera.lookAt(0, 1.1, 0.2);
  });
  return null;
}

/* --------------------------------- scene -------------------------------- */

function SceneContents() {
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), []);
  return (
    <>
      <color attach="background" args={["#000000"]} />
      {/* deep-red exponential fog — the whole room glows red into black */}
      <fogExp2 attach="fog" args={["#1a0000", 0.05]} />

      {/* only two deep-red lights, no ambient → near-black scene */}
      {/* main light motivating the beam, grazing the platform from upper-left */}
      <spotLight
        position={[-6, 9, 3]}
        target-position={[-1, 0, 1]}
        angle={0.6}
        penumbra={0.8}
        intensity={90}
        distance={30}
        decay={1.5}
        color="#7a0d0a"
      />
      {/* red rim behind the real figure, catching its silhouette edge */}
      <pointLight
        position={[-0.7, 1.5, -1.4]}
        intensity={9}
        distance={7}
        decay={2}
        color="#ff2a1a"
      />

      <Ground />
      <Beam />
      <RealFigure />
      <Portal />
      <Rig />

      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          radius={0.8}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={caOffset}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.28} darkness={0.95} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.09} />
      </EffectComposer>
    </>
  );
}

/* --------------------------- exported wrapper --------------------------- */

export default function GenesisScene() {
  // gate the WebGL canvas to the client — no SSR of three.js
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="absolute inset-0 bg-black" />;

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]} // cap pixel ratio — this is a background layer
        frameloop="always" // beam flicker, dust, pulse + parallax animate every frame
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 3.2, 7], fov: 42, near: 0.1, far: 100 }}
      >
        <SceneContents />
      </Canvas>
    </div>
  );
}
