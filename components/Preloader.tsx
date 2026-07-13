"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const BALL_SIZE = 80;
const TAPS_NEEDED = 5; // the 5th tap launches it

export default function Preloader({
  onReveal,
  onComplete,
}: {
  onReveal: () => void;
  onComplete: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

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
      let airborne = false; // true while a bounce is in flight — blocks taps
      let activeBounce: gsap.core.Timeline | null = null;

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
        airborne = true; // no more taps until it lands again — no double jumps
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
          // back on the ground — taps are allowed again (even during the wobble)
          .call(() => {
            airborne = false;
          })
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

      // the final tap: the orb is flung up and, while still rising, ignites —
      // swelling in one continuous move until it engulfs the whole page in
      // red, which then clears to the matte-black scene beneath. No ricochet,
      // no mid-air handoff, so there is never a stalled frame.
      const safety = gsap.delayedCall(22, launch).pause();
      function launch() {
        if (launched) return;
        launched = true;
        safety.kill();
        gsap.to(".tap-hint", { opacity: 0, duration: 0.25, ease: "power1.out" });
        // cancel any bounce still in flight so nothing fights over the orb
        activeBounce?.kill();
        gsap.killTweensOf([".sphere", ".halo", ".floor-pool", ".floor-reflection"]);

        gsap
          .timeline({ defaults: { transformOrigin: "50% 50%" }, onComplete })
          // the built-up energy releases — the orb shoots up off the ground
          // and the floor light spreads thin and dies beneath it
          .to(".sphere", { y: kickY, duration: 0.34, ease: "power2.out" }, 0)
          .to(".halo", { y: kickY, duration: 0.34, ease: "power2.out" }, 0)
          .to(".floor-pool", { opacity: 0, scaleX: 2.4, scaleY: 2, duration: 0.4, ease: "power2.out" }, 0)
          .to(".floor-reflection", { opacity: 0, duration: 0.3, ease: "power2.out" }, 0)
          // while the orb is STILL rising the swell begins — the growth is
          // already accelerating when the jump crests, so the apex never reads
          // as a stuck frame
          .to(".sphere", { scale: blastScale, duration: 0.8, ease: "power2.in" }, 0.12)
          .to(".halo", { scale: blastScale * 0.75, opacity: 1, duration: 0.8, ease: "power2.in" }, 0.12)
          // red owns the whole page at the moment of engulfment; the opaque
          // backdrop drops away so the hero is already breathing in underneath
          .set(".crimson-flash", { opacity: 1 }, 0.92)
          .set(container.current, { backgroundColor: "transparent", pointerEvents: "none" }, 0.92)
          .call(onReveal, undefined, 0.92)
          .to(".sphere", { opacity: 0, duration: 0.2, ease: "power1.out" }, 0.92)
          .to(".halo", { opacity: 0, duration: 0.2, ease: "power1.out" }, 0.92)
          // …then the red clears fast — we drop straight into the hero with no
          // lingering fade between the blast and the scene beneath
          .to(".crimson-flash", { opacity: 0, duration: 0.4, ease: "power2.in" }, 1.0)
          .to(container.current, { autoAlpha: 0, duration: 0.28, ease: "power1.out" }, 1.08);
      }

      function onTap() {
        // ignore taps while the orb is still in the air — one jump per landing
        if (!ready || launched || airborne) return;
        taps += 1;
        ripple();
        safety.restart(true);
        if (taps >= TAPS_NEEDED) {
          // final tap: all that built-up energy releases — the orb is flung
          // up and spreads red across the whole page
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
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-black"
    >
      {/* the blast flash — a white-hot core bleeding into crimson then dark,
          mirroring the reference orb; revealed at the moment of impact */}
      <div
        className="crimson-flash absolute inset-0 z-10 opacity-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, #ffffff 0%, #dcdcdc 22%, #a0a0a0 46%, #333333 78%, #000000 100%)",
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
              willChange: "transform, opacity",
              background:
                "radial-gradient(50% 42% at 50% 30%, rgba(255,255,255,0.5) 0%, rgba(200,255,255,0.2) 38%, transparent 70%)",
            }}
          />

          {/* the pool of light the orb casts on the floor — brightest and
              tightest when it rests, spreading and dimming as it lifts away */}
          <div
            className="floor-pool absolute left-1/2 top-1/2 rounded-[50%] opacity-0"
            style={{
              width: 320,
              height: 96,
              willChange: "transform, opacity",
              background:
                "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(220,220,220,0.55) 22%, rgba(180,180,180,0.38) 42%, rgba(100,100,100,0.16) 62%, transparent 78%)",
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
                "radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(200,200,200,0.4) 24%, rgba(150,150,150,0.15) 46%, rgba(100,100,100,0) 68%)",
            }}
          />

          {/* a ring that pings outward on each tap */}
          <div
            className="tap-ripple absolute left-1/2 top-1/2 rounded-full opacity-0"
            style={{
              width: 132,
              height: 132,
              border: "1px solid rgba(255,255,255,0.7)",
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
              background:
                "radial-gradient(58% 50% at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(220,220,220,0.7) 26%, rgba(180,180,180,0.5) 46%, rgba(100,100,100,0.2) 64%, transparent 80%)",
            }}
          />

          {/* the white-hot orb — pure-white core with a warm crimson rim and a
              layered white→crimson glow that travels with it through the flight */}
          <div
            className="sphere absolute inset-0 rounded-full opacity-0"
            style={{
              willChange: "transform, opacity",
              background:
                "radial-gradient(circle at 36% 30%, #ffffff 0%, #eaeaea 42%, #d0d0d0 70%, #a0a0a0 100%)",
              boxShadow:
                "0 0 28px 4px rgba(255,255,255,0.7), 0 0 90px 16px rgba(200,200,200,0.5), 0 0 180px 56px rgba(150,150,150,0.3)",
            }}
          />
        </div>
      </div>

      {/* the tap prompt, off on the left side of the screen */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-30 flex items-center pl-[6vw]">
          <span
            className="tap-hint select-none text-[0.7rem] uppercase tracking-[0.4em] text-white/70 opacity-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            [ tap to initialize ]
          </span>
      </div>
    </div>
  );
}
