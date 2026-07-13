"use client";

import { useEffect, useRef } from "react";

/**
 * The hero portrait — a pitch-black profile pinned to the LEFT of the hero,
 * overlaid on top of everything in the section. The photo's light backdrop is
 * blown out to pure white and multiplied away, so only the black figure
 * survives — no rectangular edge against the grain. Two stacked multiply
 * copies deepen the figure to near-solid black. A tiny pointer parallax keeps
 * it feeling alive.
 */
export default function HeroPortrait() {
  const inner = useRef<HTMLDivElement>(null);

  // subtle whole-figure parallax — drifts a few px toward the cursor
  useEffect(() => {
    const DRIFT = 6; // px — kept small on purpose
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const paint = () => {
      raf = 0;
      if (inner.current)
        inner.current.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2 * DRIFT;
      ty = (e.clientY / window.innerHeight - 0.5) * 2 * DRIFT;
      if (!raf) raf = requestAnimationFrame(paint);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // blow the photo's grey backdrop past white so multiply erases it; the
  // figure's darks stay and multiply down to pitch black
  const silhouette: React.CSSProperties = {
    filter: "grayscale(1) brightness(1.25) contrast(1.4)",
    mixBlendMode: "multiply",
  };

  const img =
    "absolute inset-0 h-full w-full select-none object-contain object-left-bottom";

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-[40] w-[52%] max-w-[640px]">
      <div
        ref={inner}
        className="absolute inset-0"
        style={{ transition: "transform 0.4s ease-out", willChange: "transform" }}
      >
        <img src="/hero.png" alt="" draggable={false} className={img} style={silhouette} />
        {/* second multiply pass — squares the darks so the figure goes solid black */}
        <img src="/hero.png" alt="" draggable={false} className={img} style={silhouette} aria-hidden />
      </div>
    </div>
  );
}
