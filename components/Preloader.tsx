"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const BALL_SIZE = 80;

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // scale needed for the 80px sphere to swallow the whole viewport
      const blastScale =
        (Math.hypot(window.innerWidth, window.innerHeight) / BALL_SIZE) * 1.15;

      document.body.style.overflow = "hidden";

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut", transformOrigin: "50% 50%" },
        onComplete,
      });

      tl
        // loading ring spins for a few seconds
        .to(".loader-ring", { rotation: 1080, duration: 2.8, ease: "power1.inOut" })
        // ring collapses…
        .to(".loader-ring", { opacity: 0, scale: 0.5, duration: 0.35, ease: "power2.in" }, "-=0.5")
        // …and the sphere is born from it
        .fromTo(
          ".sphere",
          { scale: 0, opacity: 1 },
          { scale: 1, duration: 0.6, ease: "back.out(2.5)" },
          "<+0.15"
        )
        // slime jiggle — squash & stretch settling into an elastic wobble
        .to(".sphere", { scaleX: 1.45, scaleY: 0.6, duration: 0.16, ease: "sine.in" }, "+=0.1")
        .to(".sphere", { scaleX: 0.65, scaleY: 1.4, duration: 0.18, ease: "sine.inOut" })
        .to(".sphere", { scaleX: 1.3, scaleY: 0.75, duration: 0.16, ease: "sine.inOut" })
        .to(".sphere", { scaleX: 0.82, scaleY: 1.18, duration: 0.15, ease: "sine.inOut" })
        .to(".sphere", { scaleX: 1, scaleY: 1, duration: 1.0, ease: "elastic.out(1.1, 0.22)" })
        // wind up…
        .to(".sphere", { scale: 0.4, duration: 0.3, ease: "power3.in" }, "+=0.2")
        // …BLAST — sphere engulfs the screen
        .to(".sphere", { scale: blastScale, duration: 0.55, ease: "power4.in" })
        // crimson takes over at the moment of impact
        .set(".crimson-flash", { opacity: 1 })
        .to(".sphere", { opacity: 0, duration: 0.25, ease: "power1.out" })
        // …then the screen settles back to normal
        .to(".crimson-flash", { opacity: 0, duration: 0.9, ease: "power2.inOut" }, "+=0.3")
        .to(container.current, { autoAlpha: 0, duration: 0.6, ease: "power1.out" }, "-=0.35");

      return () => {
        document.body.style.overflow = "";
      };
    },
    { scope: container }
  );

  return (
    <div
      ref={container}
      className="fixed inset-0 z-[100] overflow-hidden bg-background"
    >
      {/* deep red flash layer, revealed at the moment of the blast */}
      <div className="crimson-flash absolute inset-0 z-10 bg-crimson opacity-0" />

      <div className="relative z-20 grid h-full w-full place-items-center">
        <div className="relative" style={{ width: BALL_SIZE, height: BALL_SIZE }}>
          {/* pure white loading ring */}
          <div className="loader-ring absolute inset-0 rounded-full border-[3px] border-white/15 border-t-white" />

          {/* the slime sphere */}
          <div
            className="sphere absolute inset-0 rounded-full opacity-0"
            style={{
              background:
                "radial-gradient(circle at 34% 28%, #ffffff 0%, #f2f2f2 45%, #d9d9d9 75%, #c4c4c4 100%)",
              boxShadow: "0 0 60px rgba(255,255,255,0.25)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
