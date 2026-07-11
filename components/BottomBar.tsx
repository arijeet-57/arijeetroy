"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";

/**
 * The single, continuous bottom navigator — neo-brutalist. One bordered bar
 * with hard offset shadow; inside, joined segments divided by thick rules:
 * a solid crimson brand block, the section links (active one ignites crimson
 * and follows your scroll), then the quick social links. Sharp, loud, welded
 * into one piece rather than floating chips.
 */

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "genesis", label: "Genesis" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

const SOCIALS = [
  { label: "GitHub", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Email", href: "#" },
];

export default function BottomBar() {
  const [active, setActive] = useState("home");
  const lenis = useLenis();

  // light up whichever section owns the middle of the viewport
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    if (lenis) lenis.scrollTo(`#${id}`, { duration: 1.4 });
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  // shared segment shape; each segment after the first carries the divider rule
  const seg =
    "flex items-center px-5 py-3 text-[0.62rem] font-bold uppercase tracking-[0.3em] transition-colors duration-150";
  const divider = "border-l-[2.5px] border-[#e02540]";

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      style={{ fontFamily: "var(--font-lactos)" }}
    >
      <div className="flex items-stretch border-[2.5px] border-[#e02540] bg-[#120306] shadow-[6px_6px_0_0_#8e1220]">
        {/* brand — solid crimson end-cap */}
        <span className="flex items-center bg-[#e02540] px-5 text-[0.62rem] font-bold uppercase tracking-[0.3em] text-[#180207]">
          Arijeet&nbsp;Roy
        </span>

        {/* section links — active one fills crimson */}
        {SECTIONS.map((s) => {
          const on = active === s.id;
          return (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              aria-current={on ? "page" : undefined}
              className={`${seg} ${divider} ${
                on
                  ? "bg-[#e02540] text-[#180207]"
                  : "text-[#f2e4e0]/85 hover:bg-[#1d0509]"
              }`}
            >
              {s.label}
            </button>
          );
        })}

        {/* quick social links — dimmer, trailing the section nav */}
        {SOCIALS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className={`${seg} ${divider} text-[#f2e4e0]/60 hover:bg-[#1d0509] hover:text-[#f2e4e0]/90`}
          >
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
