"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* the shades the page slowly melts through, top to bottom */
const SHADES = [
  "#1c1c1c", // matte gray — hero
  "#0a0a0a", // blackish — the smoke clears into darkness
  "#1b0e13", // deep wine — work
  "#0e1414", // dark moss — about
  "#131020", // midnight violet — contact
];

export default function ChameleonBackground() {
  const bg = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
      defaults: { ease: "none" },
    });

    SHADES.slice(1).forEach((color) => {
      tl.to(bg.current, { backgroundColor: color, duration: 1 });
    });
  });

  return (
    <div
      ref={bg}
      aria-hidden
      className="fixed inset-0 -z-10"
      style={{ backgroundColor: SHADES[0] }}
    />
  );
}
