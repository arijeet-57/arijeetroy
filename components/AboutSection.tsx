"use client";

import Reveal from "./Reveal";

/**
 * About — the first beat after the hero. A red seam runs down the left; a
 * section index sits at the top; then a big Lactos statement, a Lingkawi bio,
 * and a row of neo-brutalist discipline chips. Dark, roomy, cinematic.
 */

const DISCIPLINES = [
  "Creative Dev",
  "WebGL / Shaders",
  "Motion",
  "Interaction",
  "UI Systems",
  "3D / R3F",
];

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative w-full overflow-hidden bg-black px-6 py-32 md:px-16 lg:py-44"
    >
      {/* faint white seam bleeding up the left edge */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-px"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.2) 70%, transparent)",
        }}
      />

      <div className="mx-auto max-w-6xl">
        {/* section index kicker */}
        <Reveal>
          <div className="mb-14 flex items-center gap-4">
            <span
              className="text-[0.7rem] font-bold uppercase tracking-[0.5em] text-white/50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              [ 01 / About ]
            </span>
            <span className="h-px flex-1 border-t border-dashed border-white/20 bg-transparent" />
          </div>
        </Reveal>

        {/* the big statement */}
        <Reveal delay={0.05}>
          <h2
            className="max-w-4xl text-[clamp(1.9rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            I build{" "}
            <span className="text-white opacity-80 mix-blend-screen drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">immersive interfaces</span> that
            feel less like websites and more like{" "}
            <span className="italic">places you step into</span>.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-12 md:grid-cols-[1.3fr_1fr]">
          {/* bio copy — Lingkawi body */}
          <Reveal delay={0.1}>
            <div className="space-y-5 text-[1.02rem] leading-relaxed text-white/70">
              <p>
                I&rsquo;m Arijeet Roy — a creative developer working at the seam
                where design, motion, and code meet. I&rsquo;m drawn to the
                cinematic: volumetric light, deliberate darkness, and interfaces
                that reward curiosity.
              </p>
              <p>
                From WebGL fog and custom shaders to physics-driven motion and
                real-time 3D, I sweat the details that make a screen feel alive —
                the weight of a transition, the drag of a cursor, the moment a
                scene finally breathes.
              </p>
            </div>
          </Reveal>

          {/* discipline chips — neo-brutalist */}
          <Reveal delay={0.15}>
            <div>
              <span
                className="mb-5 block text-[0.62rem] font-bold uppercase tracking-[0.4em] text-white/45"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Disciplines
              </span>
              <div className="flex flex-wrap gap-3">
                {DISCIPLINES.map((d) => (
                  <span
                    key={d}
                    className="border border-white/20 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/80 transition-colors duration-300 hover:bg-white/5"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {">"} {d}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
