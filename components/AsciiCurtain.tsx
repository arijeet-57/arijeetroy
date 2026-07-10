"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const GLYPHS = "01#@%&*+=-<>/\\|()[]{}?!$:;.·^~░▒▓";
const COUNT = 260;

type Glyph = {
  char: string;
  left: number; // vw
  top: number; // vh
  size: number; // px
  tone: string; // tailwind colour class
};

export default function AsciiCurtain() {
  const root = useRef<HTMLDivElement>(null);
  // random field is generated client-side only — keeps SSR markup stable
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const glyphs = useMemo<Glyph[]>(() => {
    if (!mounted) return [];
    const tones = [
      "text-white/90", // white-hot, like the orb's core
      "text-foreground/45",
      "text-crimson-bright/75",
      "text-crimson/80",
    ];
    return Array.from({ length: COUNT }, () => ({
      char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 10 + Math.random() * 26,
      tone: tones[Math.floor(Math.random() * tones.length)],
    }));
  }, [mounted]);

  useGSAP(
    () => {
      if (!mounted) return;
      const chars = gsap.utils.toArray<HTMLSpanElement>(
        ".ascii-char",
        root.current
      );
      // resolve the hero from the document — a string trigger would be scoped
      // to this component's root by useGSAP and never find #home
      const hero = document.getElementById("home");
      if (!chars.length || !hero) return;

      // shares the hero's pinned scroll segment, so the glyphs rise exactly
      // as the headline dissolves — driven purely by scroll position
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "+=130%",
          scrub: 0.6,
        },
        defaults: { ease: "none" },
      });

      tl
        // every glyph erupts from the bottom-right corner and scatters to its
        // own spot on the screen, each on a random beat
        .fromTo(
          chars,
          {
            x: (_i, t: HTMLElement) =>
              window.innerWidth -
              t.getBoundingClientRect().left +
              gsap.utils.random(-30, 150),
            y: (_i, t: HTMLElement) =>
              window.innerHeight -
              t.getBoundingClientRect().top +
              gsap.utils.random(-30, 150),
            opacity: 0,
            scale: 0.3,
            rotation: () => gsap.utils.random(-150, 150),
          },
          {
            x: 0,
            y: 0,
            opacity: 1,
            scale: 1,
            rotation: () => gsap.utils.random(-18, 18),
            ease: "power2.out",
            duration: 0.5,
            stagger: { each: 0.003, from: "random" },
          },
          0.2
        )
        // …then the whole field merges into a flat, matte dark panel
        .to(
          ".ascii-merge",
          { opacity: 1, duration: 0.65, ease: "power1.inOut" },
          1.35
        )
        // glyphs sink into the black as it takes over
        .to(chars, { opacity: 0, duration: 0.55, ease: "power1.in" }, 1.45);

      // pin spacers from the hero shift positions — recompute once built
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [mounted] }
  );

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 z-30">
      {/* scattered ascii field */}
      {glyphs.map((g, i) => (
        <span
          key={i}
          className={`ascii-char absolute select-none leading-none ${g.tone}`}
          style={{
            left: `${g.left}vw`,
            top: `${g.top}vh`,
            fontSize: `${g.size}px`,
            fontFamily: "var(--font-lactos)",
            opacity: 0,
          }}
        >
          {g.char}
        </span>
      ))}

      {/* the panel the glyphs merge into — a crimson glow bleeding out of a
          near-black field, echoing the reference orb */}
      <div
        className="ascii-merge absolute inset-0 opacity-0"
        style={{
          background:
            "radial-gradient(80% 62% at 50% 42%, rgba(142,18,32,0.42) 0%, rgba(30,7,11,0.9) 38%, #080405 74%)",
          backgroundColor: "#080405",
        }}
      />
    </div>
  );
}
