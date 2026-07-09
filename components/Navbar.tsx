"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const LINKS = [
  { id: "home", label: "home" },
  { id: "work", label: "work" },
  { id: "about", label: "about" },
  { id: "contact", label: "contact" },
];

export default function Navbar({ active }: { active: boolean }) {
  const nav = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState("home");

  // Lenis instance for smooth scrollTo (ScrollTrigger sync lives in SmoothScroll)
  const lenis = useLenis();

  useGSAP(
    () => {
      if (!active) return;

      gsap.fromTo(
        nav.current,
        { y: 90, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "back.out(1.6)", delay: 0.8 }
      );

      LINKS.forEach(({ id }) => {
        // resolve from the document — selector strings inside a scoped
        // useGSAP context would be looked up inside the nav element only
        const el = document.getElementById(id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setCurrent(id),
        });
      });
    },
    { dependencies: [active], scope: nav }
  );

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { y: -3, duration: 0.35, ease: "power2.out" });
    gsap.to(e.currentTarget.querySelector(".nav-dot"), {
      scale: 1,
      opacity: 1,
      duration: 0.35,
      ease: "back.out(3)",
    });
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, { y: 0, duration: 0.45, ease: "power2.out" });
    gsap.to(e.currentTarget.querySelector(".nav-dot"), {
      scale: 0,
      opacity: 0,
      duration: 0.25,
      ease: "power2.in",
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    const el = e.currentTarget;
    gsap
      .timeline()
      .to(el, { scale: 0.82, duration: 0.1, ease: "power2.in" })
      .to(el, { scale: 1, duration: 0.6, ease: "elastic.out(1.2, 0.4)" });
    lenis?.scrollTo(`#${id}`, { duration: 1.4 });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <nav
        ref={nav}
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 opacity-0 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md"
        style={{ fontFamily: "var(--font-lactos)" }}
      >
        {LINKS.map(({ id, label }) => (
          <button
            key={id}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onClick={(e) => handleClick(e, id)}
            className={`relative cursor-pointer px-4 py-2.5 text-[0.62rem] uppercase tracking-[0.25em] transition-colors duration-500 ${
              current === id ? "text-crimson-bright" : "text-foreground/55 hover:text-foreground/90"
            }`}
          >
            {label}
            <span className="nav-dot absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 scale-0 rounded-full bg-crimson-bright opacity-0" />
          </button>
        ))}
      </nav>
    </div>
  );
}
