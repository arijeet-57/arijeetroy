"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";

/**
 * The welcome gate — the very first thing a visitor sees, before the orb
 * intro. A fullscreen "shader lines" animation (concentric mosaic rings
 * radiating from the centre, adapted from references/shadereffect.txt) with
 * "Welcome to my portfolio" set over it. One click fires onEnter immediately
 * (so the orb intro mounts underneath), then the whole screen fades out and
 * onComplete unmounts it — a straight crossfade into the orb page.
 */

const VERTEX = /* glsl */ `
  void main() {
    gl_Position = vec4( position, 1.0 );
  }
`;

const FRAGMENT = /* glsl */ `
  #define TWO_PI 6.2831853072
  #define PI 3.14159265359

  precision highp float;
  uniform vec2 resolution;
  uniform float time;

  float random (in float x) {
      return fract(sin(x)*1e4);
  }
  float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

    vec2 fMosaicScal = vec2(4.0, 2.0);
    vec2 vScreenSize = vec2(256.0, 256.0);
    uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
    uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);

    float t = time*0.06+random(uv.x)*0.4;
    float lineWidth = 0.0008;

    // the rings, collapsed to a single monochrome channel (the three offset
    // passes are kept so the ring edges stay slightly frayed, not clean)
    float lum = 0.0;
    for(int j = 0; j < 3; j++){
      for(int i=0; i < 5; i++){
        lum += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j)+float(i)*0.01)*1.0 - length(uv));
      }
    }
    lum /= 3.0;

    // crush the highlights — nothing is allowed to bloom to full white
    lum = lum / (1.0 + lum * 1.6);
    lum = min(lum, 0.62);

    // heavy animated film grain, thicker in the shadows
    float g = random(gl_FragCoord.xy + fract(time) * 100.0);
    lum += (g - 0.5) * 0.16;
    lum *= 0.82 + g * 0.18;

    // vignette — pull the frame edges down into black
    float v = smoothstep(1.45, 0.35, length(uv));
    lum *= 0.35 + 0.65 * v;

    // faintly cold grey — noir, not neon
    vec3 color = max(lum, 0.0) * vec3(0.82, 0.84, 0.88);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function WelcomeShader({
  onEnter,
  onComplete,
}: {
  onEnter: () => void;
  onComplete: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;

    document.body.style.overflow = "hidden";

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
    });
    scene.add(new THREE.Mesh(geometry, material));

    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);

    const onResize = () => {
      const rect = host.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      uniforms.resolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height
      );
    };
    onResize();
    window.addEventListener("resize", onResize);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      // NOTE: the scroll lock is deliberately NOT restored here — by the time
      // this unmounts the Preloader has already taken over the lock, and it
      // releases it when the intro finishes.
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <motion.div
      ref={container}
      className="fixed inset-0 z-[110] cursor-pointer overflow-hidden bg-black"
      style={{ pointerEvents: leaving ? "none" : "auto" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => leaving && onComplete()}
      onPointerDown={() => {
        if (leaving) return;
        setLeaving(true);
        onEnter(); // mount the orb intro underneath before the fade begins
      }}
    >
      {/* the shader canvas */}
      <div ref={canvasHost} className="absolute inset-0" />

      {/* centred welcome copy */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col items-center justify-center gap-8 px-6">
        <motion.span
          className="text-[0.65rem] font-bold uppercase tracking-[0.5em] text-white/40"
          style={{ fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          [ 00 / Hello ]
        </motion.span>

        <motion.h1
          className="max-w-4xl text-center text-[clamp(2rem,6vw,4.8rem)] font-bold leading-[1.05] tracking-tight text-white/85"
          style={{ fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          Welcome to my portfolio
        </motion.h1>

        <motion.span
          className="flex items-center gap-3 text-[0.6rem] font-bold uppercase tracking-[0.35em] text-white/45"
          style={{ fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.45, 1] }}
          transition={{ delay: 1.4, duration: 2.2, repeat: Infinity, repeatDelay: 0.4 }}
        >
          [ Click to enter ]
        </motion.span>
      </div>
    </motion.div>
  );
}
