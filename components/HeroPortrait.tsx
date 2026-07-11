"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * The rim-lit portrait on the left of the hero. It sits on top of the fog,
 * heavily darkened by default so only a faint silhouette shows — then on hover
 * a soft "flashlight" follows the cursor and reveals the facial detail beneath.
 * While over the figure the real cursor is hidden and replaced by a hollow ring
 * that grows in and trails the pointer.
 */
export default function HeroPortrait() {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLImageElement>(null);
  const ringPos = useRef<HTMLDivElement>(null);
  const ringInner = useRef<HTMLDivElement>(null);

  // the ring is portalled to <body>, which only exists on the client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // subtle whole-hero parallax — the portrait drifts a few px toward the cursor
  useEffect(() => {
    const DRIFT = 6; // px — kept small on purpose ("not too much")
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

  const move = (e: React.PointerEvent) => {
    const box = wrap.current;
    const img = reveal.current;
    if (box && img) {
      const r = box.getBoundingClientRect();
      img.style.setProperty("--fx", `${e.clientX - r.left}px`);
      img.style.setProperty("--fy", `${e.clientY - r.top}px`);
    }
    // ring follows the pointer instantly (position isn't transitioned)
    if (ringPos.current) {
      ringPos.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
  };
  const show = () => {
    if (reveal.current) reveal.current.style.opacity = "1";
    if (ringInner.current) {
      ringInner.current.style.opacity = "1";
      ringInner.current.style.transform = "translate(-50%, -50%) scale(1)";
    }
  };
  const hide = () => {
    if (reveal.current) reveal.current.style.opacity = "0";
    if (ringInner.current) {
      ringInner.current.style.opacity = "0";
      ringInner.current.style.transform = "translate(-50%, -50%) scale(0.2)";
    }
  };

  // the flashlight: opaque (image visible) in a soft circle at the cursor,
  // transparent (image hidden) everywhere else
  const flashlight =
    "radial-gradient(circle 180px at var(--fx, 50%) var(--fy, 50%), #000 0%, #000 32%, transparent 72%)";

  // the figure stays solid (fog sits behind it, never through it) — only a thin
  // soft border is feathered so there's no hard rectangle against the fog
  const feather =
    "linear-gradient(to right, #000 0%, #000 82%, transparent 100%), linear-gradient(to bottom, transparent 0%, #000 5%, #000 100%)";

  const cover =
    "absolute inset-0 h-full w-full select-none object-cover [pointer-events:none]";

  return (
    <>
      <div
        ref={wrap}
        onPointerMove={move}
        onPointerEnter={show}
        onPointerLeave={hide}
        className="absolute inset-y-0 left-0 z-20 w-[51%] max-w-[720px]"
        style={{
          transform: "translateX(-20%)", // shifted right — ~20% bleeds off the left
          cursor: "none", // hide the OS cursor; the ring stands in for it
          WebkitMaskImage: feather,
          WebkitMaskComposite: "source-in",
          maskImage: feather,
          maskComposite: "intersect",
        }}
      >
        {/* inner drift layer — carries the whole portrait for the subtle parallax */}
        <div
          ref={inner}
          className="absolute inset-0"
          style={{ transition: "transform 0.4s ease-out", willChange: "transform" }}
        >
          {/* crimson backlight — hints at the figure and ties its halo to the fog */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              mixBlendMode: "screen",
              background:
                "radial-gradient(52% 46% at 55% 40%, rgba(224,37,64,0.26) 0%, rgba(142,18,32,0.12) 42%, transparent 72%)",
              filter: "blur(30px)",
            }}
          />

          {/* the dark layer — the portrait dimmed to near-black, a faint silhouette */}
          <img
            src="/hero.png"
            alt=""
            draggable={false}
            className={cover}
            style={{ objectPosition: "60% 35%", filter: "brightness(0.06)" }}
          />

          {/* the flashlight reveal — full-detail portrait, shown only in the circle
              under the cursor, fading in on hover */}
          <img
            ref={reveal}
            src="/hero.png"
            alt=""
            draggable={false}
            className={cover}
            style={{
              objectPosition: "60% 35%",
              opacity: 0,
              transition: "opacity 0.3s ease",
              WebkitMaskImage: flashlight,
              maskImage: flashlight,
            }}
          />
        </div>
      </div>

      {/* custom hollow-circle cursor — portalled to <body> so the wrapper's
          transform/mask can't distort it. Outer div tracks the pointer;
          inner div grows in on enter. */}
      {mounted &&
        createPortal(
          <div
            ref={ringPos}
            aria-hidden
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 9998,
              pointerEvents: "none",
              willChange: "transform",
            }}
          >
            <div
              ref={ringInner}
              style={{
                width: 76,
                height: 76,
                borderRadius: "9999px",
                border: "1.5px solid rgba(242, 190, 184, 0.85)",
                boxShadow: "0 0 18px rgba(224, 37, 64, 0.25)",
                opacity: 0,
                transform: "translate(-50%, -50%) scale(0.2)",
                transition:
                  "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
                willChange: "transform, opacity",
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}
