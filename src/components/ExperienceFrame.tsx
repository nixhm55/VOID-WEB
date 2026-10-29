// FILE 1: src/components/ExperienceFrame.tsx

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

const VOID_LIVE_APP_URL = 'https://void-six-cyan.vercel.app/';
// Matches the sleek widescreen desktop proportions inside the reference frame (0F3C4E49-E0F3-420D-8B95-9B3FB7B67BAE.png)
const NATIVE_APP_WIDTH = 1480;
const NATIVE_APP_HEIGHT = 820;

// High-resolution 3D frame canvas dimensions
const FRAME_CANVAS_W = 1600;
const FRAME_CANVAS_H = 920;
// Inner screen opening inside 1600x920:
// Width = 1600 - 2*86 = 1428, Height = 920 - 2*64 = 792 (1428 / 792 = 1.8030, matching 1480 / 820 = 1.8048)
const SCREEN_PAD_X = 86;
const SCREEN_PAD_Y = 64;
const SCREEN_RADIUS = 30;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Signed distance to a rounded rectangle centered at (0,0) with half-size (bx, by) and corner radius r. */
function sdRoundedBox(px: number, py: number, bx: number, by: number, r: number): number {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  const outX = qx > 0 ? qx : 0;
  const outY = qy > 0 ? qy : 0;
  const outDist = Math.sqrt(outX * outX + outY * outY);
  const inDist = Math.min(Math.max(qx, qy), 0);
  return outDist + inDist - r;
}

/** Distance from point (px, py) to quadratic Bezier curve A -> B -> C, returning [distance, parameter t]. */
function distToQuadraticBezier(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number
): [number, number] {
  let minD2 = 1e12;
  let bestT = 0.5;
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    const x = inv * inv * ax + 2 * inv * t * bx + t * t * cx;
    const y = inv * inv * ay + 2 * inv * t * by + t * t * cy;
    const dx = px - x;
    const dy = py - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < minD2) {
      minD2 = d2;
      bestT = t;
    }
  }
  const dt = 0.06;
  const t0 = Math.max(0, bestT - dt);
  const t1 = Math.min(1, bestT + dt);
  for (let i = 0; i <= 4; i++) {
    const t = t0 + ((t1 - t0) * i) / 4;
    const inv = 1 - t;
    const x = inv * inv * ax + 2 * inv * t * bx + t * t * cx;
    const y = inv * inv * ay + 2 * inv * t * by + t * t * cy;
    const dx = px - x;
    const dy = py - y;
    const d2 = dx * dx + dy * dy;
    if (d2 < minD2) {
      minD2 = d2;
      bestT = t;
    }
  }
  return [Math.sqrt(minD2), bestT];
}

interface ScrollSegment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cx: number;
  cy: number;
  rStart: number;
  rEnd: number;
  heightScale: number;
  serrationFreq: number;
}

function evaluateBaroqueScrollwork(
  uAbs: number,
  v: number,
  segments: ScrollSegment[]
): number {
  let maxH = 0;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const [dist, t] = distToQuadraticBezier(
      uAbs,
      v,
      s.ax,
      s.ay,
      s.bx,
      s.by,
      s.cx,
      s.cy
    );
    const radius = s.rStart + (s.rEnd - s.rStart) * t;
    const lobe =
      s.serrationFreq > 0
        ? 1.0 + 0.16 * Math.sin(t * Math.PI * s.serrationFreq)
        : 1.0;
    const effR = radius * lobe;
    if (dist < effR) {
      const norm = dist / effR;
      const dome = Math.sqrt(Math.max(0, 1.0 - norm * norm));
      const ridge = Math.exp(-norm * norm * 3.8) * 0.42;
      const h = (dome * 0.76 + ridge) * s.heightScale;
      if (h > maxH) maxH = h;
    }
  }
  return maxH;
}

// Fine-scale pierced Baroque acanthus & rocaille scrollwork matching 0F3C4E49-E0F3-420D-8B95-9B3FB7B67BAE.png
const HORIZONTAL_CREST_SEGMENTS: ScrollSegment[] = [
  { ax: 0, ay: 31, bx: 11, by: 29, cx: 15, cy: 11, rStart: 3.4, rEnd: 2.8, heightScale: 1.38, serrationFreq: 3 },
  { ax: 0, ay: 18, bx: 6, by: 16, cx: 10, cy: 5, rStart: 2.8, rEnd: 2.4, heightScale: 1.18, serrationFreq: 0 },
  { ax: 0, ay: 24, bx: 0, by: 31, cx: 0, cy: 36, rStart: 3.2, rEnd: 1.9, heightScale: 1.42, serrationFreq: 0 },
  { ax: 4, ay: 29, bx: 9, by: 34, cx: 13, cy: 27, rStart: 2.5, rEnd: 1.8, heightScale: 1.25, serrationFreq: 0 },
  { ax: 14, ay: 9, bx: 24, by: 31, cx: 42, cy: 21, rStart: 3.2, rEnd: 3.6, heightScale: 1.34, serrationFreq: 4 },
  { ax: 42, ay: 21, bx: 49, by: 13, cx: 39, cy: 9, rStart: 3.4, rEnd: 2.5, heightScale: 1.28, serrationFreq: 0 },
  { ax: 39, ay: 9, bx: 33, by: 11, cx: 36, cy: 16, rStart: 2.4, rEnd: 1.8, heightScale: 1.18, serrationFreq: 0 },
  { ax: 18, ay: 25, bx: 40, by: 33, cx: 64, cy: 15, rStart: 3.3, rEnd: 2.6, heightScale: 1.32, serrationFreq: 6 },
  { ax: 28, ay: 28, bx: 44, by: 24, cx: 56, cy: 11, rStart: 2.6, rEnd: 2.1, heightScale: 1.16, serrationFreq: 4 },
  { ax: 50, ay: 6, bx: 72, by: 24, cx: 98, cy: 11, rStart: 3.4, rEnd: 2.8, heightScale: 1.24, serrationFreq: 5 },
  { ax: 98, ay: 11, bx: 106, by: 6, cx: 96, cy: 3, rStart: 2.7, rEnd: 2.0, heightScale: 1.15, serrationFreq: 0 },
  { ax: 62, ay: 16, bx: 78, by: 19, cx: 90, cy: 8, rStart: 2.5, rEnd: 2.0, heightScale: 1.14, serrationFreq: 3 },
  { ax: 94, ay: 8, bx: 122, by: 14, cx: 152, cy: 1.5, rStart: 3.0, rEnd: 1.5, heightScale: 1.08, serrationFreq: 4 },
  { ax: 0, ay: 2, bx: 74, by: 4.5, cx: 148, cy: 0.5, rStart: 3.8, rEnd: 1.8, heightScale: 0.96, serrationFreq: 0 },
];

// Fine-scale pierced Baroque vertical side clasps matching left/right midpoints of 0F3C4E49-E0F3-420D-8B95-9B3FB7B67BAE.png
const VERTICAL_CLASP_SEGMENTS: ScrollSegment[] = [
  { ax: 0, ay: 28, bx: 10, by: 26, cx: 14, cy: 9, rStart: 3.3, rEnd: 2.7, heightScale: 1.35, serrationFreq: 3 },
  { ax: 0, ay: 16, bx: 5, by: 14, cx: 9, cy: 4, rStart: 2.6, rEnd: 2.2, heightScale: 1.16, serrationFreq: 0 },
  { ax: 0, ay: 21, bx: 0, by: 28, cx: 0, cy: 33, rStart: 3.0, rEnd: 1.8, heightScale: 1.38, serrationFreq: 0 },
  { ax: 13, ay: 8, bx: 26, by: 29, cx: 46, cy: 18, rStart: 3.2, rEnd: 3.5, heightScale: 1.3, serrationFreq: 4 },
  { ax: 46, ay: 18, bx: 53, by: 11, cx: 43, cy: 7, rStart: 3.2, rEnd: 2.4, heightScale: 1.24, serrationFreq: 0 },
  { ax: 43, ay: 7, bx: 37, by: 9, cx: 40, cy: 14, rStart: 2.3, rEnd: 1.7, heightScale: 1.15, serrationFreq: 0 },
  { ax: 18, ay: 23, bx: 44, by: 30, cx: 70, cy: 13, rStart: 3.1, rEnd: 2.5, heightScale: 1.28, serrationFreq: 5 },
  { ax: 54, ay: 6, bx: 80, by: 22, cx: 108, cy: 9, rStart: 3.2, rEnd: 2.6, heightScale: 1.2, serrationFreq: 4 },
  { ax: 108, ay: 9, bx: 115, by: 5, cx: 105, cy: 2.5, rStart: 2.5, rEnd: 1.9, heightScale: 1.12, serrationFreq: 0 },
  { ax: 104, ay: 7, bx: 130, by: 12, cx: 156, cy: 1, rStart: 2.8, rEnd: 1.4, heightScale: 1.04, serrationFreq: 3 },
  { ax: 0, ay: 1.5, bx: 76, by: 4, cx: 152, cy: 0.5, rStart: 3.6, rEnd: 1.6, heightScale: 0.92, serrationFreq: 0 },
];

export const ExperienceFrame: React.FC = React.memo(() => {
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const apertureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.76);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIframeLoaded(true);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = frameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = FRAME_CANVAS_W;
    const H = FRAME_CANVAS_H;
    canvas.width = W;
    canvas.height = H;

    const cx = W * 0.5;
    const cy = H * 0.5;
    const halfScreenW = cx - SCREEN_PAD_X; // 714
    const halfScreenH = cy - SCREEN_PAD_Y; // 396

    const heightMap = new Float32Array(W * H);
    const alphaMap = new Float32Array(W * H);
    const ornMaskMap = new Float32Array(W * H);

    for (let y = 0; y < H; y++) {
      const py = y - cy;
      const absPy = Math.abs(py);
      for (let x = 0; x < W; x++) {
        const px = x - cx;
        const absPx = Math.abs(px);
        const idx = y * W + x;

        const d = sdRoundedBox(px, py, halfScreenW, halfScreenH, SCREEN_RADIUS);

        if (d < -0.5) {
          heightMap[idx] = 0;
          alphaMap[idx] = 0;
          continue;
        }

        // Corner proximity factor for the 4 sculpted Baroque corner sweeps
        const cornerDx = Math.max(0, absPx - (halfScreenW - 120)) / 120;
        const cornerDy = Math.max(0, absPy - (halfScreenH - 120)) / 120;
        const cornerFactor = clamp01(cornerDx * cornerDy * 1.5);
        const cornerAngle = Math.atan2(cornerDy, cornerDx);
        const cornerWave =
          cornerFactor > 0.01
            ? 0.72 + 0.28 * Math.cos((cornerAngle - Math.PI * 0.25) * 6.0)
            : 0;
        const cornerEndCurl =
          cornerFactor > 0.02
            ? Math.exp(-Math.pow(Math.abs(cornerAngle - 0.22) / 0.14, 2)) +
              Math.exp(-Math.pow(Math.abs(cornerAngle - (Math.PI * 0.5 - 0.22)) / 0.14, 2))
            : 0;

        // 1. Sleek 3-Stepped Molded Rails (total straight rail width ~ 25px)
        let railH = 0;
        if (d >= -0.5 && d < 5.0) {
          const t = (d - 2.0) / 2.0;
          if (Math.abs(t) < 1.0) {
            railH = Math.max(railH, Math.sqrt(1.0 - t * t) * 0.52);
          }
        }
        if (d >= 2.0 && d < 25.5) {
          railH = Math.max(railH, 0.14);
        }
        {
          const t = (d - 11.5) / 3.5;
          if (Math.abs(t) < 1.0) {
            railH = Math.max(railH, 0.16 + Math.sqrt(1.0 - t * t) * 0.84);
          }
        }
        {
          const outerCenter = 21.4 + cornerFactor * 2.0;
          const outerHalfW = 4.4 + cornerFactor * 1.1;
          const t = (d - outerCenter) / outerHalfW;
          if (Math.abs(t) < 1.0) {
            railH = Math.max(railH, 0.15 + Math.sqrt(1.0 - t * t) * 1.08);
          }
        }
        // Outer sculpted Baroque corner bracket & double-stepped ear at all 4 corners
        if (cornerFactor > 0.015) {
          const sweepCenter = 29.5 + cornerFactor * 3.8 * cornerWave + cornerEndCurl * 2.2;
          const sweepHalfW = (3.4 + cornerEndCurl * 1.4) * smoothstep(0.015, 0.3, cornerFactor);
          if (sweepHalfW > 0.15) {
            const t = (d - sweepCenter) / sweepHalfW;
            if (Math.abs(t) < 1.0) {
              railH = Math.max(
                railH,
                Math.sqrt(1.0 - t * t) * (1.22 * smoothstep(0.015, 0.35, cornerFactor))
              );
            }
          }
        }

        // 2. Four Cardinal Pierced Baroque Acanthus Scrollwork Cartouches
        let scrollH = 0;
        const outerRailEdge = 24.5;

        if (absPx < 160 && absPy > halfScreenH + 18) {
          const v = absPy - (halfScreenH + outerRailEdge);
          if (v >= -3 && v < 40) {
            scrollH = Math.max(
              scrollH,
              evaluateBaroqueScrollwork(absPx, v, HORIZONTAL_CREST_SEGMENTS)
            );
          }
        }

        if (absPy < 162 && absPx > halfScreenW + 18) {
          const v = absPx - (halfScreenW + outerRailEdge);
          if (v >= -3 && v < 38) {
            scrollH = Math.max(
              scrollH,
              evaluateBaroqueScrollwork(absPy, v, VERTICAL_CLASP_SEGMENTS)
            );
          }
        }

        const totalH = Math.max(railH, scrollH);
        heightMap[idx] = totalH;
        ornMaskMap[idx] = clamp01(scrollH * 0.95 + cornerFactor * 0.9);

        const innerFade = smoothstep(-0.5, 1.0, d);
        if (totalH > 0.04) {
          const edgeA = smoothstep(0.04, 0.2, totalH);
          alphaMap[idx] = innerFade * Math.max(edgeA, 0.96);
        } else {
          const inCrestZone =
            (absPx < 145 && absPy > halfScreenH + 22 && absPy < halfScreenH + 46) ||
            (absPy < 148 && absPx > halfScreenW + 22 && absPx < halfScreenW + 44);
          const maxBaseD = 25.8 + cornerFactor * 9.5;
          const overD = Math.max(0, d - maxBaseD);
          const shadowA = Math.exp(-(overD * overD) / 140.0) * (inCrestZone ? 0.88 : 0.72);
          alphaMap[idx] = innerFade * shadowA;
        }
      }
    }

    // Pass 2: Per-pixel 3D Normal-Mapped Jet-Black Obsidian & Oxblood Shading
    const img = ctx.createImageData(W, H);
    const data = img.data;

    const l1x = -0.2;
    const l1y = -0.8;
    const l1z = 0.566;

    const hRailX = -0.06;
    const hRailY = -0.6;
    const hRailZ = 0.798;

    const hOrn1X = -0.36;
    const hOrn1Y = -0.44;
    const hOrn1Z = 0.822;

    const hOrn2X = 0.38;
    const hOrn2Y = 0.4;
    const hOrn2Z = 0.834;

    const normalScale = 9.4;

    for (let y = 0; y < H; y++) {
      const yPrev = y > 0 ? y - 1 : 0;
      const yNext = y < H - 1 ? y + 1 : H - 1;
      for (let x = 0; x < W; x++) {
        const idx = y * W + x;
        const pIdx = idx * 4;
        const a = alphaMap[idx];

        if (a <= 0.004) {
          data[pIdx + 3] = 0;
          continue;
        }

        const h = heightMap[idx];
        if (h <= 0.04) {
          data[pIdx] = 2;
          data[pIdx + 1] = 1;
          data[pIdx + 2] = 1;
          data[pIdx + 3] = Math.round(a * 255);
          continue;
        }

        const xPrev = x > 0 ? x - 1 : 0;
        const xNext = x < W - 1 ? x + 1 : W - 1;

        const dzdx = (heightMap[y * W + xNext] - heightMap[y * W + xPrev]) * 0.5 * normalScale;
        const dzdy = (heightMap[yNext * W + x] - heightMap[yPrev * W + x]) * 0.5 * normalScale;

        const invLen = 1.0 / Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1.0);
        const nx = -dzdx * invLen;
        const ny = -dzdy * invLen;
        const nz = invLen;

        const ornMix = ornMaskMap[idx];
        const slopeMag = Math.sqrt(dzdx * dzdx + dzdy * dzdy);
        const grazingMask = smoothstep(0.4, 2.4, slopeMag);

        // 1. Deep Jet-Black Obsidian Body
        const diff = Math.max(0, nx * l1x + ny * l1y + nz * l1z);
        const baseR = 4 + diff * 11;
        const baseG = 2 + diff * 4;
        const baseB = 3 + diff * 5;

        // 2. Thin Straight-Rail Specular Line
        const ndotHRail = Math.max(0, nx * hRailX + ny * hRailY + nz * hRailZ);
        const railSpec = Math.pow(ndotHRail, 36) * (1.0 - ornMix * 0.5) * grazingMask;
        const railHairline = Math.pow(ndotHRail, 120) * grazingMask;

        // 3. Carved Baroque Scrollwork & Corner Bracket Specular
        const ndotHOrn1 = Math.max(0, nx * hOrn1X + ny * hOrn1Y + nz * hOrn1Z);
        const ndotHOrn2 = Math.max(0, nx * hOrn2X + ny * hOrn2Y + nz * hOrn2Z);
        const ornOxblood =
          (Math.pow(ndotHOrn1, 14) + Math.pow(ndotHOrn2, 16) * 0.8) *
          (0.3 + 0.7 * ornMix) *
          grazingMask;
        const ornSpecularSpark =
          (Math.pow(ndotHOrn1, 52) + Math.pow(ndotHOrn2, 58) * 0.75) *
          (0.35 + 0.65 * ornMix) *
          grazingMask;

        const r =
          baseR +
          railSpec * 96 +
          railHairline * 155 +
          ornOxblood * 118 +
          ornSpecularSpark * 240;
        const g =
          baseG +
          railSpec * 62 +
          railHairline * 124 +
          ornOxblood * 22 +
          ornSpecularSpark * 152;
        const b =
          baseB +
          railSpec * 66 +
          railHairline * 122 +
          ornOxblood * 30 +
          ornSpecularSpark * 146;

        data[pIdx] = Math.min(255, Math.round(r));
        data[pIdx + 1] = Math.min(255, Math.round(g));
        data[pIdx + 2] = Math.min(255, Math.round(b));
        data[pIdx + 3] = Math.round(a * 255);
      }
    }

    ctx.putImageData(img, 0, 0);
  }, []);

  return (
    <div className="void-exp-stage" data-reveal="scale">
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
            <iframe
              src={VOID_LIVE_APP_URL}
              title="VOID Music Player — Live Experience"
              className={`void-exp-frame__iframe ${iframeLoaded ? 'is-loaded' : ''}`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>

          {/* Subtle Inner Screen Glass Vignette */}
          <div className="void-exp-frame__glass-sheen" aria-hidden="true" />
        </div>

        {/* High-Resolution 3D Normal-Mapped Obsidian & Oxblood Baroque Frame Overlay */}
        <canvas
          ref={frameCanvasRef}
          className="void-exp-frame__canvas"
          aria-hidden="true"
        />
      </div>
    </div>
  );
});
