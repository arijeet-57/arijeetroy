"use client";

import { useEffect, useState } from "react";
import { UnicornScene } from "unicornstudio-react/next";

/**
 * Hero backdrop — the Unicorn Studio "rainbow matrix" scene from effect2.txt,
 * stretched over the whole hero. The hero is always 100vw × 100vh, so the
 * scene is sized to the viewport and re-measured on resize. Rendered only
 * after mount (the SDK needs the browser).
 */
export default function HeroShaderBackground() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const measure = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {size.width > 0 && (
        <UnicornScene
          production
          projectId="jYxrWzSRtsXNqZADHnVH"
          width={size.width}
          height={size.height}
        />
      )}
    </div>
  );
}
