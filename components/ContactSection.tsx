"use client";

import Reveal from "./Reveal";

/**
 * Contact — the finale. A huge Lactos "Let's talk." with the same solid crimson
 * 3D extrusion the hero wordmark uses (static here), a brutalist email button,
 * a row of socials, and a thin footer rule. Closes the cinematic loop.
 */

const SOCIALS = [
  { label: "GitHub", href: "https://github.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Twitter", href: "https://twitter.com" },
];

const EMAIL = "blakelabs57@gmail.com";

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-black px-6 pb-10 pt-32 md:px-16 lg:pt-44"
    >
      {/* soft white floor-glow, echoing the hero fog */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "radial-gradient(60% 90% at 50% 120%, rgba(255,255,255,0.1), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
        {/* kicker */}
        <Reveal>
          <div className="mb-12 flex items-center gap-4">
            <span
              className="text-[0.7rem] font-bold uppercase tracking-[0.5em] text-white/50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              [ 03 / Contact ]
            </span>
            <span className="h-px flex-1 border-t border-dashed border-white/20 bg-transparent" />
          </div>
        </Reveal>

        {/* the big extruded CTA */}
        <Reveal delay={0.05}>
          <h2
            className="select-none text-[clamp(3rem,13vw,11rem)] font-bold leading-[0.85] tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
            style={{
              fontFamily: "var(--font-display)",
            }}
          >
            Let&rsquo;s talk.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-8 max-w-md text-[1.05rem] leading-relaxed text-white/65">
            Got a project that deserves to feel like something? I&rsquo;m open to
            collaborations, commissions, and the occasional impossible idea.
          </p>
        </Reveal>

        {/* email button + socials */}
        <Reveal delay={0.15}>
          <div className="mt-12 flex flex-wrap items-center gap-6">
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-3 border border-white/60 bg-white px-7 py-4 text-[0.72rem] font-bold uppercase tracking-[0.3em] text-black transition-colors duration-200 ease-out hover:bg-white/80"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Say Hello
              <span aria-hidden>→</span>
            </a>

            <div className="flex flex-wrap items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-white/20 bg-transparent px-5 py-4 text-[0.62rem] font-bold uppercase tracking-[0.25em] text-white/80 transition-colors duration-200 ease-out hover:bg-white/5 hover:text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* footer rule */}
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between border-t border-white/20 pt-6">
        <span
          className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Arijeet&nbsp;Roy
        </span>
        <span
          className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/35"
          style={{ fontFamily: "var(--font-display)" }}
        >
          © 2026 — Built in the dark
        </span>
      </div>
    </section>
  );
}
