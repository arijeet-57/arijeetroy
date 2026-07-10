"use client";

import { useState } from "react";
import Preloader from "@/components/Preloader";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import CinematicBackground from "@/components/CinematicBackground";
import AsciiCurtain from "@/components/AsciiCurtain";

const SECTION_IDS = ["work", "about", "contact"];

export default function Home() {
  // revealed: the blast has whited the screen out — the page below starts its
  // entrance behind the fading flash, so there's no dead gap at the handoff.
  // introDone: the preloader has fully faded and can unmount.
  const [revealed, setRevealed] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {!introDone && (
        <Preloader
          onReveal={() => setRevealed(true)}
          onComplete={() => setIntroDone(true)}
        />
      )}

      <CinematicBackground active={revealed} />
      <Navbar active={revealed} />

      <Hero active={revealed} />

      {/* ascii glyphs erupt from the corner and merge to matte black as the
          hero text dissolves on scroll */}
      <AsciiCurtain />

      {/* invisible scroll anchors — real content lands here, the chameleon
          background owns the visuals for now */}
      {SECTION_IDS.map((id) => (
        <section key={id} id={id} className="relative h-screen w-full" />
      ))}
    </>
  );
}
