"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive volumetric smoke — a dark, near-black field of rolling dark-red
 * smoke rendered in a single WebGL fragment shader (fbm noise + domain warp).
 * The whole field parallaxes with the cursor, and the smoke gathers and glows
 * hotter wherever the pointer goes. GPU-driven, so it stays smooth; the global
 * film-grain overlay (z-9999) sits on top and gives it its texture.
 */
export default function SmokeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // target (from the pointer) and eased current position — the lag gives the
  // smoke a smooth trailing / parallax feel
  const mouse = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });

  useEffect(() => {
    // set up on mount and keep rendering — while the intro is up the loader
    // (z-100, opaque) covers this, so it's simply ready the instant it reveals
    const canvas = canvasRef.current;
    if (!canvas) return;

    // alpha:true so that if anything fails, the transparent canvas lets the
    // CSS fallback gradient show through instead of an opaque black rectangle
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false });
    if (!gl) {
      console.warn("[SmokeBackground] WebGL unavailable — using CSS fallback");
      return; // falls back to the CSS background below
    }

    const vertSrc = `
      attribute vec2 p;
      void main() { gl_Position = vec4(p, 0.0, 1.0); }
    `;

    const fragSrc = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;

      // classic sin-based value-noise hash — compiles on every WebGL1 driver
      // (no vector += scalar, which strict ANGLE rejects)
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 x) {
        vec2 i = floor(x);
        vec2 f = fract(x);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p = m * p;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float aspect = u_resolution.x / u_resolution.y;
        vec2 p = (uv - 0.5) * vec2(aspect, 1.0); // centred, aspect-correct
        vec2 m = (u_mouse - 0.5) * vec2(aspect, 1.0);

        float t = u_time * 0.126;

        // billowing volumetric fog that fills the whole screen — domain-warped
        // fbm, animated in real time, with a gentle drift toward the cursor
        vec2 fp = p - m * 0.15;
        vec2 q = vec2(
          fbm(fp * 2.0 + vec2(0.0, t)),
          fbm(fp * 2.0 + vec2(5.2, 1.3) - t)
        );
        float f = fbm(fp * 2.0 + 1.8 * q + vec2(t * 0.4, -t * 0.2));

        // a dark, even red haze fills the whole field — a low base with gentle
        // rolling variation, spread uniformly
        float density = 0.32 + 0.36 * f;

        // MOUSE — the fog just gently thickens around the cursor (no bright glow)
        float md = length(p - m);
        float mouseGlow = smoothstep(1.0, 0.0, md);
        density += mouseGlow * (0.25 + 0.35 * f) * 0.35;

        density = clamp(density, 0.0, 1.0);

        // very gentle vignette so brightness stays even across the field
        float vig = smoothstep(1.8, 0.25, length(p));

        // colour: ghostly white haze fills the field -> brighter white -> pure white,
        // with a hot glow piling up where the fog gathers at the cursor (x-ray aesthetic)
        vec3 col = vec3(0.0);
        col = mix(col, vec3(0.1, 0.1, 0.12), smoothstep(0.0, 0.4, density));
        col = mix(col, vec3(0.35, 0.35, 0.4), smoothstep(0.38, 0.76, density));
        col = mix(col, vec3(0.65, 0.65, 0.7), smoothstep(0.78, 1.0, density));
        col *= mix(0.7, 1.0, vig) * 1.638; // +40% then +17% glow

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // clear to dark grey/black fallback up front so nothing can flash white
    gl.clearColor(0.02, 0.02, 0.02, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const which = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
        console.error(`[SmokeBackground] ${which} compile error:`, gl.getShaderInfoLog(sh) || "(no log)");
      }
      return sh;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[SmokeBackground] link error:", gl.getProgramInfoLog(prog) || "(no log)");
      return;
    }
    gl.useProgram(prog);

    // full-screen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );
    const pLoc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(pLoc);
    gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    // render below native res — fog is soft, so this is a big perf win.
    // size to the canvas's own box so it works scoped inside a section.
    const SCALE = 0.68;
    const resize = () => {
      const cw = canvas.clientWidth || window.innerWidth;
      const ch = canvas.clientHeight || window.innerHeight;
      const w = Math.max(1, Math.floor(cw * SCALE));
      const h = Math.max(1, Math.floor(ch * SCALE));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    resize();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const m = mouse.current;
      m.x += (m.tx - m.x) * 0.05;
      m.y += (m.ty - m.y) * 0.05;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 12.0 : (now - start) / 1000);
      gl.uniform2f(uMouse, m.x, m.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current.tx = (e.clientX - rect.left) / rect.width;
      mouse.current.ty = 1.0 - (e.clientY - rect.top) / rect.height; // flip to GL space
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{
        // fallback shown if WebGL/the shader fails (canvas is transparent then)
        background:
          "radial-gradient(120% 100% at 50% 45%, #1a1a1a 0%, #0a0a0a 55%, #000000 100%)",
      }}
    />
  );
}
