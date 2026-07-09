"use client";

import { useState } from "react";
import Preloader from "@/components/Preloader";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import ChameleonBackground from "@/components/ChameleonBackground";

const SECTION_IDS = ["work", "about", "contact"];

export default function Home() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {!introDone && <Preloader onComplete={() => setIntroDone(true)} />}

      <ChameleonBackground />
      <Navbar active={introDone} />

      <Hero active={introDone} />

      {/* invisible scroll anchors — real content lands here, the chameleon
          background owns the visuals for now */}
      {SECTION_IDS.map((id) => (
        <section key={id} id={id} className="relative h-screen w-full" />
      ))}
    </>
  );
}
