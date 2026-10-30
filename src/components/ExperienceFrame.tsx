import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const VOID_LIVE_APP_URL = 'https://void-six-cyan.vercel.app/';
// Matches the sleek widescreen desktop proportions inside the reference frame (0F3C4E49-E0F3-420D-8B95-9B3FB7B67BAE.png)
const NATIVE_APP_WIDTH = 1480;
const NATIVE_APP_HEIGHT = 820;

// Reveal canvas internal resolution (matches 1480:820 aspect ratio for smooth 60fps organic mask rendering)
const REVEAL_CANVAS_W = 1120;
const REVEAL_CANVAS_H = 620;
// Steady cinematic duration (2400ms) with uniform speed and consistent wave form from start to finish
const REVEAL_DURATION_MS = 2400;

type RevealPhase = 'concealed' | 'revealing' | 'revealed';

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Evaluates a consistent, sculptural asymmetric organic wave contour for angle `theta`.
 * Keeps the exact same organic form from start to finish (zero shape-snapping or distortion jumps).
 */
const NUM_CONTOUR_STEPS = 160;
const UNIT_WAVE_POINTS: Array<[number, number]> = Array.from(
  { length: NUM_CONTOUR_STEPS + 1 },
  (_, i) => {
    const theta = (i / NUM_CONTOUR_STEPS) * Math.PI * 2;
    const ridge1 = Math.sin(theta * 1.0 + 0.42) * 0.14;
    const ridge2 = Math.cos(theta * 2.0 - 0.85) * 0.17;
    const ridge3 = Math.sin(theta * 3.0 + 1.64) * 0.11;
    const undul5 = Math.cos(theta * 5.0 - 1.08) * 0.055;
    const undul7 = Math.sin(theta * 7.0 + 2.18) * 0.028;

    const aspectStretchX = 1.14;
    const aspectStretchY = 0.88;

    const radialMod = Math.max(
      0.52,
      1.0 + ridge1 + ridge2 + ridge3 + undul5 + undul7
    );

    const ux = Math.cos(theta) * radialMod * aspectStretchX;
    const uy = Math.sin(theta) * radialMod * aspectStretchY;
    return [ux, uy];
  }
);

export const ExperienceFrame: React.FC = React.memo(() => {
  const stageRef = useRef<HTMLDivElement>(null);
  const apertureRef = useRef<HTMLDivElement>(null);
  const revealCanvasRef = useRef<HTMLCanvasElement>(null);
  const blurVeilRef = useRef<HTMLDivElement>(null);
  const triggerWrapRef = useRef<HTMLDivElement>(null);
  const cachedGlassCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [scale, setScale] = useState<number>(0.76);
  const [iframeSrc, setIframeSrc] = useState<string>('');
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [revealPhase, setRevealPhase] = useState<RevealPhase>('concealed');

  const revealRafRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = apertureRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width > 0) {
        const nextScale = Number((width / NATIVE_APP_WIDTH).toFixed(5));
        setScale((prev) => (Math.abs(prev - nextScale) > 0.0002 ? nextScale : prev));
      }
    };

    updateScale();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateScale();
      });
      ro.observe(el);
    }

    window.addEventListener('resize', updateScale, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Start preloading the live player iframe right after initial paint (120ms)
  // so reload is 0ms instant, and the live player UI is already rendered behind
  // the soft blur before the user even reaches the Experience section.
  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      setIframeSrc(VOID_LIVE_APP_URL);
    }, 120);
    const fallbackTimer = window.setTimeout(() => {
      setIframeLoaded(true);
    }, 2400);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  /**
   * Renders a light, crystal-clear smoked-glass base tint into an offscreen canvas
   * so the live player shines through the soft blur (with ZERO white corner blobs or lines).
   */
  const getOrCreateCachedGlassCanvas = useCallback((w: number, h: number): HTMLCanvasElement => {
    if (
      cachedGlassCanvasRef.current &&
      cachedGlassCanvasRef.current.width === w &&
      cachedGlassCanvasRef.current.height === h
    ) {
      return cachedGlassCanvasRef.current;
    }

    const offscreen = document.createElement('canvas');
    offscreen.width = w;
    offscreen.height = h;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return offscreen;

    // Light, translucent smoked glass tint so the soft-blurred live player UI is clearly visible
    const baseGrad = ctx.createLinearGradient(0, 0, w, h);
    baseGrad.addColorStop(0, 'rgba(12, 3, 6, 0.18)');
    baseGrad.addColorStop(0.5, 'rgba(8, 2, 4, 0.22)');
    baseGrad.addColorStop(1, 'rgba(14, 3, 6, 0.18)');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, w, h);

    cachedGlassCanvasRef.current = offscreen;
    return offscreen;
  }, []);

  useEffect(() => {
    if (revealPhase !== 'concealed') return;
    const rCanvas = revealCanvasRef.current;
    if (!rCanvas) return;
    rCanvas.width = REVEAL_CANVAS_W;
    rCanvas.height = REVEAL_CANVAS_H;
    const ctx = rCanvas.getContext('2d');
    if (!ctx) return;
    const cached = getOrCreateCachedGlassCanvas(REVEAL_CANVAS_W, REVEAL_CANVAS_H);
    ctx.clearRect(0, 0, REVEAL_CANVAS_W, REVEAL_CANVAS_H);
    ctx.drawImage(cached, 0, 0);
  }, [revealPhase, getOrCreateCachedGlassCanvas]);

  const handleActivatePreview = useCallback(() => {
    if (revealPhase !== 'concealed') return;
    setIframeSrc(VOID_LIVE_APP_URL);

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setRevealPhase('revealed');
      return;
    }

    setRevealPhase('revealing');

    const rCanvas = revealCanvasRef.current;
    const blurVeil = blurVeilRef.current;
    const triggerWrap = triggerWrapRef.current;

    if (!rCanvas) {
      setRevealPhase('revealed');
      return;
    }

    rCanvas.width = REVEAL_CANVAS_W;
    rCanvas.height = REVEAL_CANVAS_H;
    const ctx = rCanvas.getContext('2d');
    if (!ctx) {
      setRevealPhase('revealed');
      return;
    }

    const w = REVEAL_CANVAS_W;
    const h = REVEAL_CANVAS_H;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxCornerDist = Math.hypot(cx, cy) * 1.42;
    const cachedGlass = getOrCreateCachedGlassCanvas(w, h);
    const startTime = performance.now();

    const buildSameFormWavePath = (targetCtx: CanvasRenderingContext2D, radius: number) => {
      targetCtx.beginPath();
      for (let i = 0; i <= NUM_CONTOUR_STEPS; i++) {
        const [ux, uy] = UNIT_WAVE_POINTS[i];
        const px = cx + ux * radius;
        const py = cy + uy * radius;
        if (i === 0) {
          targetCtx.moveTo(px, py);
        } else {
          targetCtx.lineTo(px, py);
        }
      }
      targetCtx.closePath();
    };

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawT = clamp01(elapsed / REVEAL_DURATION_MS);

      const uniformProgress = rawT;
      const currentRadius = 4 + uniformProgress * maxCornerDist;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(cachedGlass, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const featherLayers = 6;
      for (let layer = featherLayers - 1; layer >= 0; layer--) {
        const scaleLayer = 1 + layer * 0.042;
        const layerAlpha = layer === 0 ? 1.0 : 0.32 / layer;
        ctx.fillStyle = `rgba(0, 0, 0, ${layerAlpha.toFixed(3)})`;
        buildSameFormWavePath(ctx, currentRadius * scaleLayer);
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      const edgeFade =
        smoothstep(0.0, 0.08, rawT) * (1.0 - smoothstep(0.84, 1.0, rawT));

      if (edgeFade > 0.01) {
        buildSameFormWavePath(ctx, currentRadius * 1.022);
        ctx.strokeStyle = `rgba(176, 38, 56, ${(0.54 * edgeFade).toFixed(3)})`;
        ctx.lineWidth = 4.2;
        ctx.stroke();

        buildSameFormWavePath(ctx, currentRadius * 0.996);
        ctx.strokeStyle = `rgba(252, 224, 218, ${(0.42 * edgeFade).toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
      ctx.restore();

      if (blurVeil) {
        const veilOpacity = 1 - uniformProgress;
        blurVeil.style.opacity = `${veilOpacity.toFixed(3)}`;
      }

      if (triggerWrap) {
        const trigFade = 1 - smoothstep(0.0, 0.22, rawT);
        triggerWrap.style.opacity = `${trigFade.toFixed(3)}`;
      }

      if (rawT < 1) {
        revealRafRef.current = window.requestAnimationFrame(tick);
      } else {
        revealRafRef.current = null;
        setRevealPhase('revealed');
      }
    };

    revealRafRef.current = window.requestAnimationFrame(tick);
  }, [revealPhase, getOrCreateCachedGlassCanvas]);

  useEffect(() => {
    return () => {
      if (revealRafRef.current !== null) {
        window.cancelAnimationFrame(revealRafRef.current);
      }
    };
  }, []);

  return (
    <div ref={stageRef} className="void-exp-stage" data-reveal="scale">
      <div className="void-exp-frame">
        {/* Inner Screen Aperture Positioned Precisely Inside the 3D Frame Opening */}
        <div ref={apertureRef} className="void-exp-frame__aperture">
          <div
            className="void-exp-frame__app-scaler"
            style={{
              width: `${NATIVE_APP_WIDTH}px`,
              height: `${NATIVE_APP_HEIGHT}px`,
              transform: `scale(${scale})`,
            }}
          >
            {iframeSrc && (
              <iframe
                src={iframeSrc}
                title="VOID Music Player — Live Experience"
                className={`void-exp-frame__iframe ${iframeLoaded ? 'is-loaded' : ''} ${
                  revealPhase === 'revealed' ? 'is-interactive' : ''
                }`}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                onLoad={() => setIframeLoaded(true)}
              />
            )}
          </div>

          {/* Clean Smoked-Glass Overlay with Centered PREVIEW Text Only (Zero Corner White Lights, Zero Lines) */}
          {revealPhase !== 'revealed' && (
            <div
              className={`void-exp-reveal-overlay ${
                revealPhase === 'revealing' ? 'is-revealing' : ''
              }`}
              onClick={handleActivatePreview}
            >
              <div
                ref={blurVeilRef}
                className="void-exp-reveal-blur-veil"
                aria-hidden="true"
              />

              <canvas
                ref={revealCanvasRef}
                className="void-exp-reveal-canvas"
                aria-hidden="true"
              />

              <div ref={triggerWrapRef} className="void-exp-preview-center">
                <button
                  type="button"
                  className="void-exp-preview-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleActivatePreview();
                  }}
                  disabled={revealPhase === 'revealing'}
                  aria-label="Preview live VOID music player"
                >
                  <span className="void-exp-preview-label">PREVIEW</span>
                </button>
              </div>
            </div>
          )}

          {/* Subtle Inner Screen Glass Vignette */}
          <div className="void-exp-frame__glass-sheen" aria-hidden="true" />
        </div>

        {/* Pre-Baked High-Resolution 3D Normal-Mapped Obsidian & Oxblood Baroque Frame Overlay */}
        <img
          src="/assets/baroque-frame.png"
          alt=""
          decoding="async"
          draggable={false}
          className="void-exp-frame__canvas"
          aria-hidden="true"
        />
      </div>
    </div>
  );
});
