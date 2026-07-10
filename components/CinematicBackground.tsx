"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Dust = {
  left: number; // %
  top: number; // %
  size: number; // px, 1–3
  opacity: number;
  warm: boolean; // orange-red vs white
  driftX: number; // px
  driftY: number; // px
  dur: number; // s
  delay: number; // s (negative = pre-rolled)
};

const DUST_COUNT = 32;

/**
 * A single immersive atmospheric canvas — nearly-black deep crimson base with a
 * central volumetric glow, soft anamorphic streaks, faint light leaks, floating
 * dust, and a heavy cinematic vignette.
 *
 * PERFORMANCE: the soft bloom comes entirely from smooth radial gradients — no
 * `filter: blur` on the large layers, since blurring a huge surface every frame
 * is what tanks the compositor. Animations only ever touch `opacity` and
 * `translate` (both GPU-cheap, they reuse the cached raster) — never `scale`,
 * which would force a re-raster. The whole group is isolated + paint-contained
 * so blend compositing never spills onto the rest of the page.
 */
export default function CinematicBackground({ active = true }: { active?: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  // dust field is generated client-side only — keeps SSR markup stable
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dust = useMemo<Dust[]>(() => {
    if (!mounted) return [];
    return Array.from({ length: DUST_COUNT }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      // smaller + dimmer specks read as "further / softer" — depth without blur
      size: 1 + Math.random() * 2,
      opacity: 0.05 + Math.random() * 0.2,
      warm: Math.random() < 0.22,
      driftX: (Math.random() - 0.5) * 70,
      driftY: -(24 + Math.random() * 90), // gentle upward drift
      dur: 26 + Math.random() * 30,
      delay: Math.random() * -50,
    }));
  }, [mounted]);

  useGSAP(
    () => {
      // don't animate while occluded by the preloader — it just competes for
      // the compositor and makes the intro choppy
      if (!mounted || !active) return;
      // respect users who ask for less motion — leave the scene static
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // the main crimson glow slowly breathes in intensity (opacity only —
      // the raster is cached, so this is nearly free)
      gsap.to(".cine-glow", {
        opacity: 1,
        duration: 7.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // the warm core occasionally flickers, then holds calm for seconds —
      // repeatRefresh re-rolls the random values each cycle so it never loops
      gsap
        .timeline({ repeat: -1, repeatRefresh: true })
        .to(".cine-core", {
          opacity: () => gsap.utils.random(0.55, 0.72),
          duration: () => gsap.utils.random(0.05, 0.12),
          ease: "none",
        })
        .to(".cine-core", {
          opacity: () => gsap.utils.random(0.86, 1),
          duration: () => gsap.utils.random(0.08, 0.22),
          ease: "none",
        })
        .to(".cine-core", { opacity: 1, duration: () => gsap.utils.random(2.5, 6) });

      // anamorphic streaks drift horizontally and breathe in intensity
      gsap.utils.toArray<HTMLElement>(".cine-streak").forEach((el, i) => {
        gsap.to(el, {
          x: i % 2 ? 44 : -44,
          opacity: i % 2 ? 0.5 : 0.34,
          duration: 11 + i * 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // light leaks slide and pulse as if passing through the frame
      gsap.utils.toArray<HTMLElement>(".cine-leak").forEach((el, i) => {
        gsap.to(el, {
          x: i % 2 ? -60 : 80,
          opacity: i % 2 ? 0.55 : 0.48,
          duration: 16 + i * 5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });

      // dust drifts on its own slow current and twinkles (translate + opacity)
      gsap.utils.toArray<HTMLElement>(".cine-dust").forEach((el) => {
        const dx = Number(el.dataset.dx);
        const dy = Number(el.dataset.dy);
        const dur = Number(el.dataset.dur);
        const delay = Number(el.dataset.delay);
        const base = Number(el.dataset.op);
        gsap.to(el, {
          x: dx,
          y: dy,
          duration: dur,
          delay,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(el, {
          opacity: base * 0.3,
          duration: dur / 3.2,
          delay,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    },
    { scope: root, dependencies: [mounted, active] }
  );

  return (
    <div
      ref={root}
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        backgroundColor: "#080000",
        // isolate the blend group + contain paint so compositing stays local
        isolation: "isolate",
        contain: "layout paint",
      }}
    >
      {/* deep crimson-black base with a faint radial lift toward the centre */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 100% at 50% 44%, #1b0406 0%, #120001 32%, #0b0001 58%, #080000 100%)",
        }}
      />

      {/* main volumetric crimson glow — soft entirely from the gradient falloff,
          no blur filter. Breathes via opacity only. */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="cine-glow rounded-full"
          style={{
            width: "96vmax",
            height: "96vmax",
            opacity: 0.72,
            mixBlendMode: "screen",
            willChange: "opacity",
            background:
              "radial-gradient(circle, rgba(224,37,64,0.24) 0%, rgba(180,26,44,0.15) 22%, rgba(120,16,30,0.08) 40%, rgba(60,8,14,0.03) 58%, transparent 74%)",
          }}
        />
      </div>

      {/* warm orange-red core bloom — the flickering heart of the light */}
      <div className="absolute inset-0 grid place-items-center">
        <div
          className="cine-core rounded-full"
          style={{
            width: "52vmax",
            height: "52vmax",
            mixBlendMode: "screen",
            willChange: "opacity",
            background:
              "radial-gradient(circle, rgba(255,150,110,0.18) 0%, rgba(224,37,64,0.11) 30%, rgba(160,22,40,0.05) 52%, transparent 72%)",
          }}
        />
      </div>

      {/* anamorphic horizontal streaks — thin, so a tiny blur here is cheap.
          Centred via overhang so GSAP owns the x-drift freely. */}
      <div
        className="cine-streak absolute"
        style={{
          top: "calc(50% - 1px)",
          left: "-25vw",
          width: "150vw",
          height: "2px",
          opacity: 0.45,
          filter: "blur(2px)",
          mixBlendMode: "screen",
          willChange: "transform, opacity",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(224,37,64,0.28) 30%, rgba(255,170,140,0.5) 50%, rgba(224,37,64,0.28) 70%, transparent 100%)",
        }}
      />
      <div
        className="cine-streak absolute"
        style={{
          top: "38%",
          left: "-25vw",
          width: "150vw",
          height: "1px",
          opacity: 0.28,
          filter: "blur(1.5px)",
          mixBlendMode: "screen",
          willChange: "transform, opacity",
          background:
            "linear-gradient(90deg, transparent, rgba(224,37,64,0.22) 40%, rgba(255,150,120,0.3) 50%, rgba(224,37,64,0.22) 60%, transparent)",
        }}
      />

      {/* faint diagonal light leaks — soft from the gradient itself. Their
          raster is cached once, then only translated/faded (cheap). */}
      <div
        className="absolute"
        style={{ top: "-20%", left: "-12%", transform: "rotate(18deg)" }}
      >
        <div
          className="cine-leak"
          style={{
            width: "46vw",
            height: "130vh",
            opacity: 0.5,
            mixBlendMode: "screen",
            willChange: "transform, opacity",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(224,37,64,0.09) 45%, rgba(224,37,64,0.11) 50%, rgba(224,37,64,0.09) 55%, transparent 100%)",
          }}
        />
      </div>
      <div
        className="absolute"
        style={{ top: "-14%", right: "-16%", transform: "rotate(-14deg)" }}
      >
        <div
          className="cine-leak"
          style={{
            width: "40vw",
            height: "130vh",
            opacity: 0.44,
            mixBlendMode: "screen",
            willChange: "transform, opacity",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,110,70,0.07) 48%, rgba(255,110,70,0.09) 50%, rgba(255,110,70,0.07) 52%, transparent 100%)",
          }}
        />
      </div>

      {/* floating dust — sharp tiny points, drifting on slow currents. Depth
          comes from size/opacity variance rather than per-particle blur. */}
      {dust.map((d, i) => (
        <span
          key={i}
          className="cine-dust absolute rounded-full"
          data-dx={d.driftX}
          data-dy={d.driftY}
          data-dur={d.dur}
          data-delay={d.delay}
          data-op={d.opacity}
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
            willChange: "transform, opacity",
            background: d.warm
              ? "rgba(255,178,140,0.9)"
              : "rgba(255,242,238,0.85)",
          }}
        />
      ))}

      {/* strong cinematic vignette — corners fall away into near-black */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 115% at 50% 47%, transparent 38%, rgba(0,0,0,0.35) 68%, rgba(0,0,0,0.72) 86%, #000 100%)",
        }}
      />
    </div>
  );
}
