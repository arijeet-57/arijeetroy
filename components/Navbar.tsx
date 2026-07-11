"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";

const LINKS = [
  { id: "home", label: "Home" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

/**
 * Floating right-edge navigator — neo-brutalist. Sharp-cornered blocks, thick
 * high-contrast borders, hard offset shadows (no blur), loud uppercase labels.
 * The active section is a solid crimson block; every button presses down into
 * its shadow on hover. Palette stays in the site's crimson/black world.
 */
export default function Navbar() {
  const [active, setActive] = useState("home");
  const lenis = useLenis();

  // track which section owns the middle of the viewport
  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(
      Boolean
    ) as HTMLElement[];
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    if (lenis) lenis.scrollTo(`#${id}`, { duration: 1.4 });
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // shared brutalist button shape; hover presses the block into its shadow
  const base =
    "flex w-full items-center justify-between gap-4 border-[2.5px] px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.3em] transition-all duration-150 hover:translate-x-[3px] hover:translate-y-[3px]";

  return (
    <nav
      aria-label="Primary"
      className="fixed right-6 top-1/2 z-50 -translate-y-1/2"
      style={{ fontFamily: "var(--font-lactos)" }}
    >
      <div className="flex w-[168px] flex-col gap-3">
        {LINKS.map((l) => {
          const on = active === l.id;
          return (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              aria-current={on ? "page" : undefined}
              className={`${base} ${
                on
                  ? "border-[#f2e4e0] bg-[#e02540] text-[#180207] shadow-[4px_4px_0_0_#f2e4e0] hover:shadow-[1px_1px_0_0_#f2e4e0]"
                  : "border-[#e02540] bg-[#120306] text-[#f2e4e0]/85 shadow-[4px_4px_0_0_#8e1220] hover:bg-[#1d0509] hover:shadow-[1px_1px_0_0_#8e1220]"
              }`}
            >
              <span>{l.label}</span>
              {/* blocky index marker — filled on the active block */}
              <span
                className="h-2.5 w-2.5 shrink-0 border-[2px]"
                style={{
                  borderColor: on ? "#180207" : "#e02540",
                  background: on ? "#180207" : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
