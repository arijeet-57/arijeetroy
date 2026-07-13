/**
 * Static grainy backdrop for the hero — replaces the animated fog. A dark
 * grey base lit softly from the upper-centre (so the pitch-black portrait
 * reads against it), a film-grain turbulence layer, and a vignette that
 * pulls the corners down to black.
 */
export default function GrainBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {/* base — dark grey with a soft light pool where the content sits */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 42% 32%, #2a2a2a 0%, #171717 45%, #060606 100%)",
        }}
      />

      {/* grain — static turbulence tile, stronger than the global film grain */}
      <div
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 240 240' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* vignette — keeps the frame edges cinematic-dark */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(90% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </div>
  );
}
