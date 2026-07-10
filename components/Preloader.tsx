"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const BALL_SIZE = 80;
const TAPS_NEEDED = 5; // the 5th tap launches it

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // ricochet anchors — offsets from the centred ball to just inside each
      // wall, so it cracks off the edges like a pinball
      const pad = BALL_SIZE / 2 + 16;
      const rightX = w / 2 - pad;
      const leftX = -(w / 2 - pad);
      const topY = -(h / 2 - pad);

      // where the orb comes to rest on the ground (offset down from centre)
      const groundY = h / 2 - (BALL_SIZE / 2 + 70);
      // the contact line on the floor, at the base of the orb
      const floorY = groundY + BALL_SIZE / 2;

      // scale needed for the 80px sphere to swallow the whole viewport
      const blastScale = (Math.hypot(w, h) / BALL_SIZE) * 1.15;

      document.body.style.overflow = "hidden";

      let taps = 0;
      let ready = false;
      let launched = false;
      let activeBounce: gsap.core.Timeline | null = null;

      // ---------------------------------------------------------------------
      // THE REST OF THE SHOW — launch → ricochet → grow → blast → reveal.
      // Untouched from before; just held paused until the final tap fires it.
      // ---------------------------------------------------------------------
      const rest = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.inOut", transformOrigin: "50% 50%" },
        onComplete,
      });

      rest
        // whatever charge glow gathered on the ground releases as it launches;
        // the floor pool spreads thin and dies as the orb leaves the ground
        .to(".halo", { opacity: 0, duration: 0.2 }, 0)
        .to(".floor-pool", { scaleX: 2.4, scaleY: 2, opacity: 0, duration: 0.5, ease: "power2.out" }, 0)
        .to(".floor-reflection", { opacity: 0, duration: 0.4, ease: "power2.out" }, 0)
        // LAUNCH — the orb is flung up toward the right wall, stretched along
        // its arc
        .to(".sphere", {
          x: rightX,
          y: topY * 0.45,
          scaleX: 1.3,
          scaleY: 0.74,
          rotation: 220,
          duration: 0.5,
          ease: "power3.out",
        })
        // CRACK off the right wall — hard horizontal squash against it
        .to(".sphere", { scaleX: 0.58, scaleY: 1.4, duration: 0.09, ease: "power2.out" })
        // ZING down-left toward the left wall, spin whipping the other way
        .to(".sphere", {
          x: leftX,
          y: h * 0.16,
          rotation: 90,
          scaleX: 1.28,
          scaleY: 0.78,
          duration: 0.5,
          ease: "power1.inOut",
        })
        // CRACK off the left wall
        .to(".sphere", { scaleX: 0.6, scaleY: 1.36, duration: 0.09, ease: "power2.out" })
        // LOB up toward the top-centre, arcing over…
        .to(".sphere", {
          x: 120,
          y: topY * 0.8,
          rotation: 340,
          scaleX: 1.18,
          scaleY: 0.84,
          duration: 0.44,
          ease: "power2.out",
        })
        // …then PLUNGE dead-centre, accelerating into the impact
        .to(".sphere", {
          x: 0,
          y: 0,
          rotation: 360,
          scaleX: 1.24,
          scaleY: 0.76,
          duration: 0.32,
          ease: "power3.in",
        })
        // heavy splat on landing, then an elastic wobble to rest
        .to(".sphere", { scaleX: 1.55, scaleY: 0.48, duration: 0.1, ease: "power2.out" })
        .to(".sphere", { scaleX: 0.74, scaleY: 1.28, duration: 0.16, ease: "sine.inOut" })
        .to(".sphere", { scaleX: 1.14, scaleY: 0.9, duration: 0.13, ease: "sine.inOut" })
        .to(".sphere", { scaleX: 1, scaleY: 1, duration: 0.85, ease: "elastic.out(1.1, 0.3)" })
        // the crimson halo slides to centre and blooms out of the settled orb
        .to(".halo", { x: 0, y: 0, opacity: 1, scale: 1.15, duration: 0.7, ease: "power2.out" }, "<0.15")
        // wind up…
        .to(".sphere", { scale: 0.4, duration: 0.3, ease: "power3.in" }, "+=0.15")
        .to(".halo", { scale: 0.72, opacity: 0.7, duration: 0.3, ease: "power3.in" }, "<")
        // …BLAST — sphere engulfs the screen, halo flaring with it
        .to(".sphere", { scale: blastScale, duration: 0.55, ease: "power4.in" })
        .to(".halo", { scale: blastScale * 0.7, opacity: 1, duration: 0.55, ease: "power4.in" }, "<")
        // crimson takes over at the moment of impact
        .set(".crimson-flash", { opacity: 1 })
        .to(".sphere", { opacity: 0, duration: 0.25, ease: "power1.out" })
        .to(".halo", { opacity: 0, duration: 0.25, ease: "power1.out" }, "<")
        // …then the screen settles back to normal
        .to(".crimson-flash", { opacity: 0, duration: 0.9, ease: "power2.inOut" }, "+=0.3")
        .to(container.current, { autoAlpha: 0, duration: 0.6, ease: "power1.out" }, "-=0.35");

      // ---------------------------------------------------------------------
      // helpers
      // ---------------------------------------------------------------------

      // a single tap bounce on the ground — springs up, falls, squashes, settles.
      // Each successive tap jumps noticeably higher AND leaves behind a stronger
      // crimson charge aura (the halo, which rides along with the orb), so the
      // built-up kinetic energy is visible right up until it's released.
      function bounce(i: number) {
        // never let taps stack — the previous bounce is killed so overlapping
        // timelines can't fight over the orb and leave it stuck mid-air
        activeBounce?.kill();
        const jump = Math.min(70 + i * 48, h * 0.5);
        // the charge level this bounce settles at — grows with every tap
        const chargeOpacity = Math.min(0.14 + i * 0.11, 0.64);
        const chargeScale = 0.3 + i * 0.09;
        activeBounce = gsap
          .timeline({ defaults: { transformOrigin: "50% 50%" } })
          // springs up — orb, its charge aura, and the floor light all react
          .to(".sphere", { y: groundY - jump, scaleX: 0.9, scaleY: 1.14, duration: 0.34, ease: "power2.out" })
          .to(".halo", { y: groundY - jump, opacity: chargeOpacity * 0.75, scale: chargeScale * 0.9, duration: 0.34, ease: "power2.out" }, "<")
          .to(".floor-pool", { scaleX: 1.7, scaleY: 1.5, opacity: 0.26, duration: 0.34, ease: "power2.out" }, "<")
          .to(".floor-reflection", { scaleY: 1.35, opacity: 0.12, duration: 0.34, ease: "power2.out" }, "<")
          .to(".sphere", { scaleX: 1.03, scaleY: 0.97, duration: 0.12, ease: "sine.inOut" }, ">-0.06")
          // falls back toward the floor
          .to(".sphere", { y: groundY, duration: 0.32, ease: "power2.in" })
          .to(".halo", { y: groundY, duration: 0.32, ease: "power2.in" }, "<")
          .to(".floor-pool", { scaleX: 1, scaleY: 1, opacity: 0.9, duration: 0.32, ease: "power2.in" }, "<")
          .to(".floor-reflection", { scaleY: 1, opacity: 0.4, duration: 0.32, ease: "power2.in" }, "<")
          // impact — orb squashes, floor splashes, and the charge aura flares up
          // to its new, higher level and stays there (energy retained)
          .to(".sphere", { scaleX: 1.34, scaleY: 0.64, duration: 0.08, ease: "power2.out" })
          .to(".floor-pool", { scaleX: 1.32, scaleY: 0.85, opacity: 1, duration: 0.08, ease: "power2.out" }, "<")
          .to(".halo", { opacity: chargeOpacity, scale: chargeScale, duration: 0.18, ease: "power2.out" }, "<")
          .to(".sphere", { scaleX: 0.86, scaleY: 1.14, duration: 0.12, ease: "sine.inOut" })
          .to(".floor-pool", { scaleX: 1, scaleY: 1, opacity: 0.85, duration: 0.5, ease: "power2.out" }, "<")
          .to(".sphere", { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1.1, 0.35)" });
        return activeBounce;
      }

      // a ring of light pings outward from the orb on every tap
      function ripple() {
        gsap.fromTo(
          ".tap-ripple",
          { opacity: 0.5, scale: 0.5 },
          { opacity: 0, scale: 1.9, duration: 0.62, ease: "power2.out", overwrite: true }
        );
      }

      // the height the final kick throws the orb to — clearly up in the air
      const kickY = -(h * 0.06);

      // the final tap: hide the prompt and fire the rest of the show
      const safety = gsap.delayedCall(22, launch).pause();
      function launch() {
        if (launched) return;
        launched = true;
        safety.kill();
        gsap.to(".tap-hint", { opacity: 0, duration: 0.25, ease: "power1.out" });
        // cancel any bounce still in flight so the orb never touches back down
        gsap.killTweensOf([".sphere", ".halo", ".floor-pool", ".floor-reflection"]);
        // the built-up energy releases — the orb shoots up off the ground, then
        // the rest of the show carries straight on from there, mid-air
        gsap
          .timeline({ onComplete: () => rest.play(0) })
          .to(".sphere", { y: kickY, scaleX: 0.82, scaleY: 1.26, duration: 0.34, ease: "power2.out" })
          .to(".halo", { y: kickY, opacity: 0.6, scale: 0.85, duration: 0.34, ease: "power2.out" }, "<")
          .to(".floor-pool", { opacity: 0.05, scaleX: 2.2, scaleY: 1.8, duration: 0.34, ease: "power2.out" }, "<")
          .to(".floor-reflection", { opacity: 0, duration: 0.3, ease: "power2.out" }, "<");
      }

      function onTap() {
        if (!ready || launched) return;
        taps += 1;
        ripple();
        safety.restart(true);
        if (taps >= TAPS_NEEDED) {
          // final tap: all that built-up energy releases — the orb is flung
          // straight up into the air and the rest of the show takes over
          launch();
        } else {
          // each tap bounces higher than the last — energy building toward launch
          bounce(taps);
        }
      }

      // ---------------------------------------------------------------------
      // EMERGENCE — the rift tears open, the orb is born and settles on the
      // ground, then the tap prompt invites the user in.
      // ---------------------------------------------------------------------
      gsap
        .timeline({ defaults: { ease: "power2.inOut", transformOrigin: "50% 50%" } })
        // seed everything at the ground — the rift opens right at the floor line
        .set(".rift", { xPercent: -50, yPercent: -50, x: 0, y: floorY, scaleX: 0.05, scaleY: 0.5, opacity: 0 })
        .set(".sphere", { x: 0, y: floorY, scale: 0.26, rotation: 0, opacity: 0 })
        .set(".halo", { xPercent: -50, yPercent: -50, x: 0, y: groundY, scale: 0.4, opacity: 0 })
        .set(".tap-ripple", { xPercent: -50, yPercent: -50, x: 0, y: groundY, scale: 0.5, opacity: 0 })
        .set(".floor-pool", { xPercent: -50, yPercent: -50, x: 0, y: floorY, scaleX: 1, scaleY: 1, opacity: 0 })
        .set(".floor-reflection", { xPercent: -50, yPercent: -50, x: 0, y: floorY + 48, scaleX: 1, scaleY: 1, opacity: 0 })
        // THE RIFT TEARS OPEN — a horizontal seam of light splits the black,
        // spilling a first faint pool of light across the floor
        .to(".rift", { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.5, ease: "power2.out" })
        .to(".halo", { opacity: 0.35, scale: 0.7, duration: 0.5, ease: "sine.out" }, "<")
        .to(".floor-pool", { opacity: 0.4, scaleX: 1.2, duration: 0.5, ease: "sine.out" }, "<")
        // THE ORB PUSHES THROUGH — squeezed up out of the seam, stretched thin,
        // the floor pool spreading and dimming as the light source lifts away
        .to(".sphere", { opacity: 1, y: groundY - 66, scaleX: 0.58, scaleY: 1.02, duration: 0.34, ease: "power2.out" }, "-=0.2")
        .to(".floor-pool", { opacity: 0.28, scaleX: 1.6, scaleY: 1.4, duration: 0.34, ease: "power2.out" }, "<")
        // the rift flares and seals behind it
        .to(".rift", { scaleX: 1.45, opacity: 0, duration: 0.42, ease: "power2.in" }, "<")
        .to(".halo", { opacity: 0, scale: 0.5, duration: 0.5 }, "<")
        // it falls back down and lands on the ground — the floor pool tightens
        // and flares on impact — squashing then settling
        .to(".sphere", { y: groundY, duration: 0.34, ease: "power2.in" })
        .to(".floor-pool", { opacity: 0.9, scaleX: 1, scaleY: 1, duration: 0.34, ease: "power2.in" }, "<")
        .to(".floor-reflection", { opacity: 0.4, duration: 0.34, ease: "power2.in" }, "<")
        .to(".sphere", { scaleX: 1.34, scaleY: 0.64, duration: 0.08, ease: "power2.out" })
        .to(".floor-pool", { scaleX: 1.32, scaleY: 0.85, opacity: 1, duration: 0.08, ease: "power2.out" }, "<")
        .to(".sphere", { scaleX: 0.9, scaleY: 1.1, duration: 0.12, ease: "sine.inOut" })
        .to(".floor-pool", { scaleX: 1, scaleY: 1, opacity: 0.85, duration: 0.5, ease: "power2.out" }, "<")
        .to(".sphere", { scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1.1, 0.4)" })
        // invite the tap — the prompt fades in on the left
        .call(() => {
          ready = true;
          safety.restart(true);
          gsap.to(".tap-hint", { opacity: 1, duration: 0.6, ease: "power2.out" });
        });

      const el = container.current;
      el?.addEventListener("pointerdown", onTap);

      return () => {
        document.body.style.overflow = "";
        el?.removeEventListener("pointerdown", onTap);
      };
    },
    { scope: container }
  );

  return (
    <div
      ref={container}
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-[#080000]"
    >
      {/* the blast flash — a white-hot core bleeding into crimson then dark,
          mirroring the reference orb; revealed at the moment of impact */}
      <div
        className="crimson-flash absolute inset-0 z-10 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #fff6f4 0%, #e02540 22%, #8e1220 46%, #2a0509 78%, #0a0203 100%)",
        }}
      />

      <div className="relative z-20 grid h-full w-full place-items-center">
        <div className="relative" style={{ width: BALL_SIZE, height: BALL_SIZE }}>
          {/* a faint reflection of the orb on the lit floor beneath it */}
          <div
            className="floor-reflection absolute left-1/2 top-1/2 rounded-[50%] opacity-0"
            style={{
              width: 96,
              height: 128,
              mixBlendMode: "screen",
              willChange: "transform, opacity",
              background:
                "radial-gradient(50% 42% at 50% 30%, rgba(255,205,185,0.5) 0%, rgba(224,37,64,0.26) 38%, transparent 70%)",
            }}
          />

          {/* the pool of light the orb casts on the floor — brightest and
              tightest when it rests, spreading and dimming as it lifts away */}
          <div
            className="floor-pool absolute left-1/2 top-1/2 rounded-[50%] opacity-0"
            style={{
              width: 320,
              height: 96,
              mixBlendMode: "screen",
              willChange: "transform, opacity",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(255,240,235,0.9) 0%, rgba(255,120,80,0.55) 22%, rgba(224,37,64,0.38) 42%, rgba(142,18,32,0.16) 62%, transparent 78%)",
            }}
          />

          {/* crimson halo — the reference's red glow bleeding out of the orb.
              Gathers faintly as the orb emerges, then blooms at centre later. */}
          <div
            className="halo absolute left-1/2 top-1/2 rounded-full opacity-0"
            style={{
              width: 520,
              height: 520,
              willChange: "transform, opacity",
              background:
                "radial-gradient(circle, rgba(224,37,64,0.72) 0%, rgba(142,18,32,0.55) 24%, rgba(142,18,32,0.2) 46%, rgba(142,18,32,0) 68%)",
            }}
          />

          {/* a ring that pings outward on each tap */}
          <div
            className="tap-ripple absolute left-1/2 top-1/2 rounded-full opacity-0"
            style={{
              width: 132,
              height: 132,
              border: "1.5px solid rgba(255,185,155,0.7)",
            }}
          />

          {/* the rift of light — a horizontal seam that tears open in the dark
              and the orb is squeezed up through, then seals shut behind it.
              Centred via left/top-50%; GSAP owns its scale/opacity/position. */}
          <div
            className="rift absolute left-1/2 top-1/2 opacity-0"
            style={{
              width: 300,
              height: 82,
              filter: "blur(5px)",
              mixBlendMode: "screen",
              background:
                "radial-gradient(58% 50% at 50% 50%, rgba(255,244,240,0.95) 0%, rgba(255,120,80,0.7) 26%, rgba(224,37,64,0.5) 46%, rgba(142,18,32,0.2) 64%, transparent 80%)",
            }}
          />

          {/* the white-hot orb — pure-white core with a warm crimson rim and a
              layered white→crimson glow that travels with it through the flight */}
          <div
            className="sphere absolute inset-0 rounded-full opacity-0"
            style={{
              willChange: "transform, opacity",
              background:
                "radial-gradient(circle at 36% 30%, #ffffff 0%, #fff4f2 42%, #ffd7d1 70%, #f0b0a9 100%)",
              boxShadow:
                "0 0 28px 4px rgba(255,240,235,0.7), 0 0 90px 16px rgba(224,37,64,0.55), 0 0 180px 56px rgba(142,18,32,0.42)",
            }}
          />
        </div>
      </div>

      {/* the tap prompt, off on the left side of the screen */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-30 flex items-center pl-[6vw]">
        <span
          className="tap-hint select-none text-[0.7rem] uppercase tracking-[0.4em] text-foreground/70 opacity-0"
          style={{ fontFamily: "var(--font-lactos)" }}
        >
          tap the orb
        </span>
      </div>
    </div>
  );
}
