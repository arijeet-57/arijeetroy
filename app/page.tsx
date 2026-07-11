"use client";

import { useState } from "react";
import Preloader from "@/components/Preloader";
import SmokeBackground from "@/components/SmokeBackground";
import HeroPortrait from "@/components/HeroPortrait";
import HeroWordmark from "@/components/HeroWordmark";

const SECTION_IDS = ["work", "about", "contact"];

export default function Home() {
  // introDone: the preloader has fully faded and can unmount. The smoke
  // background renders underneath the whole time, so it's already there the
  // instant the loader reveals it.
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {!introDone && (
        <Preloader onReveal={() => {}} onComplete={() => setIntroDone(true)} />
      )}

      {/* hero — the volumetric red fog lives only here */}
      <section
        id="home"
        className="relative h-screen w-full overflow-hidden"
      >
        <SmokeBackground />

        {/* rim-lit portrait on the left — dark until you sweep the flashlight */}
        <HeroPortrait />

        {/* big "arro" wordmark (right) + brutalist scroll cue */}
        <HeroWordmark />
      </section>

      {/* the rest of the page (no fog) — dark, roomy sections; neo-brutalist
          label blocks so they match the rest of the site's language */}
      {SECTION_IDS.map((id) => (
        <section
          key={id}
          id={id}
          className="relative flex h-screen w-full items-center justify-center bg-[#080000]"
        >
          <div className="border-[2.5px] border-[#e02540] bg-[#120306] px-8 py-4 shadow-[6px_6px_0_0_#8e1220]">
            <span
              className="select-none text-[0.8rem] font-bold uppercase tracking-[0.4em] text-[#f2e4e0]/90"
              style={{ fontFamily: "var(--font-lactos)" }}
            >
              {id}
            </span>
          </div>
        </section>
      ))}
    </>
  );
}
