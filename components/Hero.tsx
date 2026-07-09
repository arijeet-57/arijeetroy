"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HEADLINE = "Welcome to my Realm";
const SUBLINE = "where design, code and motion collide";

export default function Hero({ active }: { active: boolean }) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!active) return;

      const tl = gsap.timeline({ delay: 0.15 });

      tl
        // scroll instruction comes in first
        .fromTo(
          ".scroll-cue",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
        )
        // then the headline slowly emerges, letter by letter
        .fromTo(
          ".name-char",
          { opacity: 0, y: 46, filter: "blur(16px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.7,
            stagger: 0.07,
            ease: "power3.out",
            // leave no per-letter filters behind — they'd cost a repaint
            // per span on every scrubbed frame later
            clearProps: "filter",
          },
          "-=0.5"
        )
        // and the smaller line drifts in beneath it
        .fromTo(
          ".subline",
          { opacity: 0, y: 18, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 1.4,
            ease: "power2.out",
          },
          "-=1.2"
        );

      // gently pulsing scroll line, forever
      gsap.to(".scroll-cue-line", {
        scaleY: 0,
        transformOrigin: "top center",
        duration: 1.1,
        ease: "power2.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1,
      });

      // scroll-driven exit: screen pins while the text dissolves like fog,
      // then the background sinks into a darker shade
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          end: "+=130%",
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
        },
        defaults: { ease: "none" },
      });

      scrollTl
        // scroll cue vanishes immediately
        .to(".scroll-cue", { opacity: 0, duration: 0.15 }, 0)
        // letters fade away in place, left to right — no movement at all
        .to(
          ".name-char",
          {
            opacity: 0,
            duration: 0.45,
            stagger: { each: 0.035, from: "start" },
            ease: "power1.in",
          },
          0.05
        )
        // a soft stationary blur over the whole headline as it thins out
        .to(
          ".hero-title",
          { filter: "blur(14px)", duration: 0.6, ease: "power1.in" },
          0.1
        )
        // the subline follows, fading in place
        .to(
          ".subline",
          { opacity: 0, filter: "blur(10px)", duration: 0.4, ease: "power1.in" },
          0.25
        );

      // pinning added spacer height — recalc every trigger (incl. navbar's)
      ScrollTrigger.refresh();
    },
    { dependencies: [active], scope: container }
  );

  const words = HEADLINE.split(" ");

  return (
    <section
      id="home"
      ref={container}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
    >
      <h1
        aria-label={HEADLINE}
        className="hero-title relative z-10 select-none text-center text-[clamp(2.5rem,9vw,8rem)] leading-none tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-lingkawi)" }}
      >
        {words.map((word, wi) => (
          <span key={wi} aria-hidden className="inline-block whitespace-nowrap">
            {word.split("").map((char, ci) => (
              <span key={ci} className="name-char inline-block opacity-0">
                {char}
              </span>
            ))}
            {wi < words.length - 1 && <span>&nbsp;</span>}
          </span>
        ))}
      </h1>

      <p
        className="subline relative z-10 mt-6 select-none text-center text-[clamp(0.8rem,1.6vw,1.1rem)] uppercase tracking-[0.45em] text-foreground/55 opacity-0"
        style={{ fontFamily: "var(--font-lactos)" }}
      >
        {SUBLINE}
      </p>

      <div className="scroll-cue absolute bottom-10 z-10 flex flex-col items-center gap-3 opacity-0">
        <span
          className="text-[0.65rem] uppercase tracking-[0.35em] text-foreground/50"
          style={{ fontFamily: "var(--font-lactos)" }}
        >
          scroll to continue
        </span>
        <span className="scroll-cue-line block h-10 w-px bg-foreground/40" />
      </div>
    </section>
  );
}
