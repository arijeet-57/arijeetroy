"use client";

import { useState } from "react";
import WelcomeShader from "@/components/WelcomeShader";
import Preloader from "@/components/Preloader";
import HeroShaderBackground from "@/components/HeroShaderBackground";
import HeroWordmark from "@/components/HeroWordmark";
import AboutSection from "@/components/AboutSection";
import WorkSection from "@/components/WorkSection";
import ContactSection from "@/components/ContactSection";

export default function Home() {
  // entered: "click to enter" happened — the orb intro mounts underneath the
  // welcome gate while it fades, so the click lands directly on the orb page.
  // welcomeGone: the welcome gate has fully faded and can unmount.
  // introDone: the preloader has fully faded and can unmount. The hero renders
  // underneath the whole time, so it's already there the instant the loader
  // reveals it.
  const [entered, setEntered] = useState(false);
  const [welcomeGone, setWelcomeGone] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  return (
    <>
      {/* the welcome gate — shader lines + "Welcome to my portfolio" */}
      {!welcomeGone && (
        <WelcomeShader
          onEnter={() => setEntered(true)}
          onComplete={() => setWelcomeGone(true)}
        />
      )}

      {/* the orb intro — already running underneath while the gate fades out */}
      {entered && !introDone && (
        <Preloader onReveal={() => {}} onComplete={() => setIntroDone(true)} />
      )}

      {/* hero — Unicorn Studio shader scene as the backdrop */}
      <section
        id="home"
        className="relative h-screen w-full overflow-hidden"
      >
        <HeroShaderBackground />

        {/* intro bio — name, role, status */}
        <HeroWordmark />
      </section>

      {/* the rest of the page — dark, roomy, cinematic */}
      <AboutSection />
      <WorkSection />
      <ContactSection />
    </>
  );
}
