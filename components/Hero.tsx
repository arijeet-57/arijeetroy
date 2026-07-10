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
  const veil = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!active) return;

      const tl = gsap.timeline({ delay: 0.15 });

      tl
        // the crimson glow breathes in behind everything first
        .fromTo(
          ".hero-glow",
          { opacity: 0, scale: 0.82 },
          { opacity: 1, scale: 1, duration: 2.2, ease: "power2.out" },
          0
        )
        // the headline slowly emerges, letter by letter. The fog is ONE blur
        // resolving on the whole line — per-letter filters would put 17
        // separately-blurred surfaces on the GPU at once and chug the entrance
        .fromTo(
          ".name-char",
          { opacity: 0, y: 46 },
          {
            opacity: 1,
            y: 0,
            duration: 1.7,
            stagger: 0.07,
            ease: "power3.out",
          },
          0.35
        )
        .fromTo(
          ".hero-title",
          { filter: "blur(16px)" },
          {
            filter: "blur(0px)",
            duration: 1.9,
            ease: "power2.out",
            // leave no filter behind — it'd cost a repaint of the whole
            // headline on every scrubbed frame later
            clearProps: "filter",
          },
          0.35
        )
        // the smaller line drifts in beneath it
        .fromTo(
          ".subline",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 1.4, ease: "power2.out" },
          "-=1.1"
        )
        // the scroll instruction arrives last — once there's something to read
        .fromTo(
          ".scroll-cue",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 1, ease: "power2.out" },
          "-=0.8"
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
        // the visible background sinks into a darker shade as the text goes,
        // then eases back out near the end so the CinematicBackground takes
        // the handoff cleanly
        .fromTo(
          veil.current,
          { opacity: 0 },
          { opacity: 0.55, duration: 0.5, ease: "power1.in" },
          0
        )
        .to(veil.current, { opacity: 0, duration: 0.4, ease: "power1.out" }, 0.65)
        // scroll cue vanishes immediately
        .to(".scroll-cue", { opacity: 0, duration: 0.15 }, 0)
        // the crimson glow dissolves along with the text
        .to(".hero-glow", { opacity: 0, scale: 1.1, duration: 0.5, ease: "power1.in" }, 0.05)
        // letters fade away in place, left to right — no movement, and no
        // scrubbed blur: re-filtering the huge headline every scrolled frame
        // is what made the dissolve stutter
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
        // the subline follows, fading in place
        .to(
          ".subline",
          { opacity: 0, duration: 0.4, ease: "power1.in" },
          0.25
        );

      // pinning added spacer height — recalc every trigger (incl. navbar's)
      ScrollTrigger.refresh();
    },
    { dependencies: [active], scope: container }
  );

  const words = HEADLINE.split(" ");

  return (
    <>
      {/* page-level darkening layer — fixed, and behind every bit of content
          (-z-5, above the CinematicBackground at -z-10). It can only ever
          darken the background, never the text. */}
      <div
        ref={veil}
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5] bg-black"
        style={{ opacity: 0 }}
      />

      <section
        id="home"
        ref={container}
        className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden"
      >
      {/* crimson glow behind the headline — the reference's red bleed on a dark
          field. Sits above the CinematicBackground/veil but behind the text. */}
      <div
        className="hero-glow pointer-events-none absolute left-1/2 top-1/2 -z-[1] h-[125vmin] w-[125vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
        style={{
          // soft entirely from the gradient falloff — a blur filter here would
          // re-rasterise a 125vmin surface on every frame of the scale tween
          background:
            "radial-gradient(circle, rgba(224,37,64,0.3) 0%, rgba(142,18,32,0.18) 28%, rgba(142,18,32,0.06) 48%, transparent 66%)",
        }}
      />

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
    </>
  );
}
