"use client";

/**
 * Hero overlay — the intro bio, anchored to the bottom-left of the hero over
 * the shader backdrop. Name set huge in the display mono, a bracket kicker
 * above it, and a short bio + status line beneath.
 */
export default function HeroWordmark() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-6 pb-24 md:px-16 md:pb-20">
      <div className="max-w-3xl">
        {/* kicker */}
        <div className="mb-5 flex items-center gap-4">
          <span
            className="text-[0.65rem] font-bold uppercase tracking-[0.5em] text-white/60"
            style={{ fontFamily: "var(--font-display)" }}
          >
            [ Creative Developer ]
          </span>
          <span className="h-px w-24 border-t border-dashed border-white/25" />
        </div>

        {/* the name */}
        <h1
          className="select-none text-[clamp(2.8rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-tight text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Arijeet&nbsp;Roy
        </h1>

        {/* short bio */}
        <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-white/65">
          I build cinematic, immersive interfaces — WebGL, motion, and
          real-time 3D — where design and code meet in the dark.
        </p>

        {/* status line */}
        <div
          className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/45"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span>Based in India</span>
          <span aria-hidden className="text-white/25">
            //
          </span>
          <span>Open to collaborations</span>
          <span aria-hidden className="text-white/25">
            //
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse bg-white" />
            Available for work
          </span>
        </div>
      </div>
    </div>
  );
}
