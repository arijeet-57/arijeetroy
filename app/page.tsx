"use client";

import { useState } from "react";
import Preloader from "@/components/Preloader";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import CinematicBackground from "@/components/CinematicBackground";
import AsciiCurtain from "@/components/AsciiCurtain";

const SECTION_IDS = ["work", "about", "contact"];

export default function Home() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {!introDone && <Preloader onComplete={() => setIntroDone(true)} />}

      <CinematicBackground active={introDone} />
      <Navbar active={introDone} />

      <Hero active={introDone} />

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
