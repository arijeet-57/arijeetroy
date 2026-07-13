"use client";

import Reveal from "./Reveal";

/**
 * Selected Work — the portfolio's core. A grid of neo-brutalist project cards:
 * thick borders, hard offset shadows, a big ghost index number, tag row, and a
 * press-into-shadow hover (the card slides into its own shadow and the crimson
 * fills in). Placeholder projects — swap the data for the real ones.
 */

type Project = {
  index: string;
  title: string;
  blurb: string;
  tags: string[];
  year: string;
};

const PROJECTS: Project[] = [
  {
    index: "01",
    title: "Volumetric",
    blurb:
      "A real-time WebGL fog engine — raymarched red smoke reacting to cursor and audio.",
    tags: ["GLSL", "Three.js", "Audio"],
    year: "2026",
  },
  {
    index: "02",
    title: "Genesis",
    blurb:
      "A procedural R3F scene — a glowing portal, a silhouette, and cinematic post-processing.",
    tags: ["R3F", "Postprocessing", "3D"],
    year: "2026",
  },
  {
    index: "03",
    title: "Kinetic Type",
    blurb:
      "An interactive type playground where letterforms bend, extrude, and chase the pointer.",
    tags: ["GSAP", "Canvas", "Motion"],
    year: "2025",
  },
  {
    index: "04",
    title: "Nightfall UI",
    blurb:
      "A dark, tactile design system built on neo-brutalist primitives and hard light.",
    tags: ["React", "Design System", "Tailwind"],
    year: "2025",
  },
];

function Card({ p, delay }: { p: Project; delay: number }) {
  return (
    <Reveal delay={delay}>
      <article
        className="group relative flex h-full flex-col justify-between overflow-hidden border border-white/20 bg-black p-7 transition-all duration-300 ease-out will-change-transform hover:-translate-y-1 hover:border-white/40 hover:bg-white/[0.02]"
      >
        {/* corner brackets for scanner aesthetic */}
        <div className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l border-t border-white/40 opacity-50 transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r border-t border-white/40 opacity-50 transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b border-l border-white/40 opacity-50 transition-opacity group-hover:opacity-100" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b border-r border-white/40 opacity-50 transition-opacity group-hover:opacity-100" />
        {/* ghost index number in the corner */}
        <span
          className="pointer-events-none absolute -right-2 -top-6 select-none text-[7rem] font-bold leading-none text-white/5 transition-colors duration-300 group-hover:text-white/10"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {p.index}
        </span>

        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <span
              className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-white/50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {p.year}
            </span>
          </div>
          <h3
            className="text-[1.7rem] font-bold leading-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {p.title}
          </h3>
          <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-white/60">
            {p.blurb}
          </p>
        </div>

        <div className="relative mt-8 flex flex-wrap items-center gap-2">
          {p.tags.map((t) => (
            <span
              key={t}
              className="border border-white/20 px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.2em] text-white/60"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t}
            </span>
          ))}
          <span className="ml-auto text-lg text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            ↗
          </span>
        </div>
      </article>
    </Reveal>
  );
}

export default function WorkSection() {
  return (
    <section
      id="work"
      className="relative w-full overflow-hidden bg-black px-6 py-32 md:px-16 lg:py-44"
    >
      <div className="mx-auto max-w-6xl">
        {/* kicker + heading */}
        <Reveal>
          <div className="mb-14 flex items-center gap-4">
            <span
              className="text-[0.7rem] font-bold uppercase tracking-[0.5em] text-white/50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              [ 02 / Work ]
            </span>
            <span className="h-px flex-1 border-t border-dashed border-white/20 bg-transparent" />
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            className="mb-16 text-[clamp(2.2rem,6vw,4.5rem)] font-bold leading-none tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Selected&nbsp;Work
          </h2>
        </Reveal>

        <div className="grid gap-7 sm:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <Card key={p.index} p={p} delay={0.08 * i} />
          ))}
        </div>
      </div>
    </section>
  );
}
