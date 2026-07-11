"use client";

import { useEffect, useRef } from "react";

/**
 * The hero wordmark — big lowercase "arro" set in DX Lactos, SLANTED, sitting in
 * the empty right-centre of the hero. Neo-brutalist solid 3D extrusion (stacked
 * zero-blur offsets, shaded front→back). Everything reacts to the pointer, but
 * gently:
 *   • the extrusion swings to follow the mouse direction
 *   • the word itself drifts a little toward the mouse (parallax float)
 * A brutalist "scroll down" cue sits at the bottom of the hero.
 */
export default function HeroWordmark() {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const LAYERS = 18; // depth of the extrusion
    const STEP = 2.6; // px between stacked layers
    const SLANT = -7; // deg — the fixed slant of the word
    const FLOAT = 14; // px — how far the word drifts toward the mouse (subtle)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    // shaded solid extrusion: lit crimson front face → near-black back
    const front = [126, 18, 32];
    const back = [24, 4, 9];

    const buildShadow = (dx: number, dy: number) => {
      const parts: string[] = [];
      for (let i = 1; i <= LAYERS; i++) {
        const t = i / LAYERS;
        const r = Math.round(lerp(front[0], back[0], t));
        const g = Math.round(lerp(front[1], back[1], t));
        const b = Math.round(lerp(front[2], back[2], t));
        const ox = (dx * i * STEP).toFixed(1);
        const oy = (dy * i * STEP).toFixed(1);
        parts.push(`${ox}px ${oy}px 0 rgb(${r},${g},${b})`);
      }
      return parts.join(", ");
    };

    // resting state — extrusion down-right, no drift
    let dirX = 0.72;
    let dirY = 0.72;
    let tx = 0;
    let ty = 0;
    const paint = () => {
      raf = 0;
      el.style.textShadow = buildShadow(dirX, dirY);
      el.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${SLANT}deg)`;
    };
    el.style.transform = `translate(0px, 0px) rotate(${SLANT}deg)`;
    el.style.textShadow = buildShadow(dirX, dirY);

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      // shadow direction: from the word toward the cursor
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const len = Math.hypot(dx, dy) || 1;
      dirX = dx / len;
      dirY = dy / len;
      // float: nudge the word toward the cursor, relative to viewport centre
      tx = (e.clientX / window.innerWidth - 0.5) * 2 * FLOAT;
      ty = (e.clientY / window.innerHeight - 0.5) * 2 * FLOAT;
      if (!raf) raf = requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* the slanted wordmark, in the right-centre negative space */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-30 flex w-[62%] items-center justify-center">
        <span
          ref={textRef}
          className="select-none lowercase leading-[0.8] text-[clamp(4.5rem,16vw,14rem)] will-change-transform"
          style={{
            fontFamily: "var(--font-lactos)",
            color: "#f4e8e4",
            transition: "transform 0.35s ease-out", // smooth float; shadow is redrawn per-frame
            // seeded so there's no flash of un-shadowed text before JS runs
            transform: "rotate(-7deg)",
            textShadow:
              "1.9px 1.9px 0 rgb(126,18,32), 4px 4px 0 rgb(80,12,22)",
          }}
        >
          arro
        </span>
      </div>

      {/* neo-brutalist scroll cue, pinned to the bottom of the hero */}
      <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2">
        <div className="flex items-center gap-3 border-[2.5px] border-[#f2e4e0] bg-[#120306] px-5 py-2.5 shadow-[4px_4px_0_0_#8e1220]">
          <span
            className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-[#f2e4e0]"
            style={{ fontFamily: "var(--font-lactos)" }}
          >
            Scroll Down
          </span>
          <span className="animate-bounce text-sm leading-none text-[#e02540]">
            ↓
          </span>
        </div>
      </div>
    </>
  );
}
