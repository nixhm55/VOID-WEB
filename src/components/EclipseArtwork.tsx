import React, { useEffect, useRef } from 'react';
import { EclipseVisualConfig } from '../types/void';
import { LEATHER_GRAIN_BASE64, LEATHER_GRAIN_SIZE } from './leatherGrainTexture';

interface EclipseArtworkProps {
  config: EclipseVisualConfig;
  isPlaying?: boolean;
  size?: 'hero' | 'thumb' | 'card';
  className?: string;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

let coverGrainCache: Float32Array | null = null;
let masterCoverCanvas: HTMLCanvasElement | null = null;

function getCoverLeatherGrain(): Float32Array {
  if (coverGrainCache) return coverGrainCache;
  const n = LEATHER_GRAIN_SIZE;
  const bin = atob(LEATHER_GRAIN_BASE64);
  const raw = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) {
    raw[i] = (bin.charCodeAt(i) - 128) / 40;
  }
  const tex = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    const ym = (y - 1 + n) % n;
    const yp = (y + 1) % n;
    for (let x = 0; x < n; x++) {
      const xm = (x - 1 + n) % n;
      const xp = (x + 1) % n;
      const c = raw[y * n + x];
      const avg =
        (raw[ym * n + x] + raw[yp * n + x] + raw[y * n + xm] + raw[y * n + xp]) * 0.25;
      const h = c * 0.68 + avg * 0.32;
      if (h < 0.05) {
        const d = (0.05 - h) / 1.5;
        tex[y * n + x] = -Math.pow(clamp01(d), 1.35) * 1.55;
      } else {
        const cr = (h - 0.05) * 1.35;
        tex[y * n + x] = (cr / (1.0 + cr * 0.52)) * 1.42;
      }
    }
  }
  coverGrainCache = tex;
  return tex;
}

function sampleCoverGrain(tex: Float32Array, u: number, v: number): number {
  const n = LEATHER_GRAIN_SIZE;
  const fu = Math.floor(u);
  const fv = Math.floor(v);
  const tx = u - fu;
  const ty = v - fv;
  const ux = tx * tx * tx * (tx * (tx * 6.0 - 15.0) + 10.0);
  const uy = ty * ty * ty * (ty * (ty * 6.0 - 15.0) + 10.0);
  let x0 = fu % n;
  if (x0 < 0) x0 += n;
  let y0 = fv % n;
  if (y0 < 0) y0 += n;
  const x1 = x0 + 1 === n ? 0 : x0 + 1;
  const y1 = y0 + 1 === n ? 0 : y0 + 1;
  const r0 = y0 * n;
  const r1 = y1 * n;
  return (
    tex[r0 + x0] * (1 - ux) * (1 - uy) +
    tex[r0 + x1] * ux * (1 - uy) +
    tex[r1 + x0] * (1 - ux) * uy +
    tex[r1 + x1] * ux * uy
  );
}

function foldTube(d: number, wTop: number, wBot: number): {
  h: number;
  rim: number;
  gloss: number;
  tuck: number;
} {
  const w = d < 0 ? wTop : wBot;
  const t = d / w;
  const h = Math.exp(-t * t * 1.15);
  const rShift = (d + wTop * 0.22) / (wTop * 0.52);
  const rim = Math.exp(-rShift * rShift);
  const gShift = (d + wTop * 0.16) / (wTop * 0.25);
  const gloss = Math.exp(-gShift * gShift);
  const tShift = (d + wTop * 1.02) / (wTop * 0.5);
  const tuck = Math.exp(-tShift * tShift);
  return { h, rim, gloss, tuck };
}

/**
 * Generates and caches the 420x420 high-gloss 3D pinched burgundy leather album cover
 * matching the "Lucid Dreams" artwork in 1st.png so every song cover across the app uses it identically.
 */
function getMasterLeatherCoverCanvas(): HTMLCanvasElement | null {
  if (masterCoverCanvas) return masterCoverCanvas;
  if (typeof document === 'undefined') return null;

  const dim = 420;
  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const N = dim * dim;
  const fE = new Float32Array(N);
  const fRim = new Float32Array(N);
  const fGloss = new Float32Array(N);
  const fOcc = new Float32Array(N);
  const grainH = new Float32Array(N);
  const grainTex = getCoverLeatherGrain();

  for (let py = 0; py < dim; py++) {
    const ny = py / dim;
    for (let px = 0; px < dim; px++) {
      const nx = px / dim;
      const idx = py * dim + px;

      // 1. Upper-left pinched vertical-diagonal fold (brightly lit pebble ridge in top-left of 1st.png cover)
      const dUL = nx - (0.24 + ny * 0.36 - 0.04 * Math.sin(ny * 6.0));
      const fUL = foldTube(-dUL, 0.09, 0.24);
      const wUL = smoothstep(0.58, 0.18, ny) * smoothstep(0.68, 0.24, nx);

      // 2. Upper-right steep diagonal fold sweeping down-left to the central pinch apex (0.44, 0.45)
      const dUR = ny - (0.46 - (nx - 0.42) * 0.62 + 0.025 * Math.cos(nx * 5.5));
      const fUR = foldTube(dUR, 0.075, 0.22);
      const wUR = smoothstep(0.22, 0.48, nx) * smoothstep(0.64, 0.34, ny);

      // 3. Primary central-to-bottom-right billowing S-fold with glossy ridge & pebbled belly (hero feature of 1st.png cover)
      const sCurveY =
        0.44 +
        (nx - 0.42) * 0.88 -
        0.065 * Math.sin((nx - 0.38) * 5.2);
      const dLR = ny - sCurveY;
      const fLR = foldTube(-dLR, 0.068, 0.26);
      const wLR = smoothstep(0.24, 0.44, nx) * smoothstep(0.32, 0.46, ny);

      // 4. Lower-left draped fold rolling beneath the central pinch
      const dLL = ny - (0.48 - (nx - 0.38) * 0.52 + 0.03 * Math.sin(nx * 6.0));
      const fLL = foldTube(dLL, 0.07, 0.24);
      const wLL = smoothstep(0.54, 0.28, nx) * smoothstep(0.34, 0.52, ny);

      // 5. Bottom-left secondary fold near (nx = 0.0..0.42, ny = 0.78..1.0)
      const dBL = ny - (0.84 + (nx - 0.22) * 0.38);
      const fBL = foldTube(dBL, 0.075, 0.18);
      const wBL = smoothstep(0.52, 0.18, nx) * smoothstep(0.62, 0.78, ny);

      const elev =
        fUL.h * wUL * 1.15 +
        fUR.h * wUR * 1.08 +
        fLR.h * wLR * 1.32 +
        fLL.h * wLL * 0.96 +
        fBL.h * wBL * 0.84;

      const rim =
        fUL.rim * wUL * 1.18 +
        fUR.rim * wUR * 1.12 +
        fLR.rim * wLR * 1.38 +
        fLL.rim * wLL * 0.88 +
        fBL.rim * wBL * 0.78;

      const gloss =
        fUL.gloss * wUL * 1.25 +
        fUR.gloss * wUR * 1.05 +
        fLR.gloss * wLR * 1.45 +
        fLL.gloss * wLL * 0.75;

      const tuck =
        fUL.tuck * wUL * 0.85 +
        fUR.tuck * wUR * 0.92 +
        fLR.tuck * wLR * 0.96 +
        fLL.tuck * wLL * 0.82;

      fE[idx] = elev;
      fRim[idx] = rim;
      fGloss[idx] = gloss;
      fOcc[idx] = clamp01((1.0 - tuck * 0.84) * smoothstep(0.02, 0.48, elev));

      // Sample reference reptile/pebble hide grain warped along the folds
      const u = (nx * 195 + elev * 14.0) % LEATHER_GRAIN_SIZE;
      const v = (ny * 195 - elev * 11.0) % LEATHER_GRAIN_SIZE;
      const g1 = sampleCoverGrain(grainTex, u, v);
      const g2 = sampleCoverGrain(grainTex, u * 0.52 + 41.3, v * 0.52 + 19.7);
      const diffG = Math.abs(g1 * 0.65 - g2 * 0.55);
      const hairline = -Math.exp(-diffG * diffG * 18.0) * 0.28;
      grainH[idx] = g1 * 0.9 + g2 * 0.45 + hairline;
    }
  }

  const img = ctx.createImageData(dim, dim);
  const data = img.data;

  const l1x = -0.32;
  const l1y = -0.68;
  const l1z = 0.655;

  const hx = -0.18;
  const hy = -0.46;
  const hz = 0.869;

  for (let py = 0; py < dim; py++) {
    const yPrev = py > 0 ? py - 1 : 0;
    const yNext = py < dim - 1 ? py + 1 : dim - 1;
    for (let px = 0; px < dim; px++) {
      const xPrev = px > 0 ? px - 1 : 0;
      const xNext = px < dim - 1 ? px + 1 : dim - 1;
      const idx = py * dim + px;
      const pIdx = idx * 4;

      const occ = fOcc[idx];
      if (occ <= 0.003) {
        data[pIdx] = 3;
        data[pIdx + 1] = 1;
        data[pIdx + 2] = 2;
        data[pIdx + 3] = 255;
        continue;
      }

      const P = (fE[py * dim + xNext] - fE[py * dim + xPrev]) * 22.0;
      const Q = (fE[yNext * dim + px] - fE[yPrev * dim + px]) * 22.0;

      const qx = (grainH[py * dim + xNext] - grainH[py * dim + xPrev]) * 0.82;
      const qy = (grainH[yNext * dim + px] - grainH[yPrev * dim + px]) * 0.82;

      const mInv = 1.0 / Math.sqrt(P * P + Q * Q + 1.0);
      const mNx = -P * mInv;
      const mNy = -Q * mInv;
      const mNz = mInv;

      const sx = P + qx;
      const sy = Q + qy;
      const tInv = 1.0 / Math.sqrt(sx * sx + sy * sy + 1.0);
      const nx = -sx * tInv;
      const ny = -sy * tInv;
      const nz = tInv;

      const cSx = P + qx * 0.36;
      const cSy = Q + qy * 0.36;
      const cInv = 1.0 / Math.sqrt(cSx * cSx + cSy * cSy + 1.0);
      const cNx = -cSx * cInv;
      const cNy = -cSy * cInv;
      const cNz = cInv;

      const gHere = grainH[idx];
      const cav = smoothstep(-1.1, 0.26, gHere);
      const cavity = 1.0 - 0.86 * (1.0 - cav);

      const macroDiff = Math.max(0, mNx * l1x + mNy * l1y + mNz * l1z);
      const microDiff = Math.max(0, nx * l1x + ny * l1y + nz * l1z);

      const rim = fRim[idx];
      const glossRibbon = fGloss[idx];
      const mH = fE[idx];

      const bodyIllum = Math.pow(microDiff, 1.65) * cavity * occ * clamp01(mH * 0.88);
      const satinRollOff =
        Math.pow(clamp01(rim * (0.48 + 0.52 * macroDiff)), 1.8) *
        occ *
        (0.36 + 0.64 * cavity);

      const cNdotH = Math.max(0, cNx * hx + cNy * hy + cNz * hz);
      const clearcoat =
        (Math.pow(cNdotH, 16) * 0.62 + clamp01(glossRibbon) * Math.pow(cNdotH, 8) * 0.72) *
        (0.3 + 0.7 * cavity) *
        occ;

      const ndoth = Math.max(0, nx * hx + ny * hy + nz * hz);
      const ridgeZone = clamp01(rim * 0.86 + macroDiff * 0.42) * occ;
      const raisedMask = smoothstep(0.06, 0.84, gHere);
      const pebbleGlint = Math.pow(ndoth, 24) * cavity * (0.34 + 0.66 * raisedMask) * ridgeZone;
      const hotSpark = Math.pow(ndoth, 60) * raisedMask * cavity * ridgeZone;

      const mirrorCore = Math.pow(cNdotH, 36) * clamp01(glossRibbon * 1.1) * (0.45 + 0.55 * cavity) * occ;
      const r =
        3 +
        bodyIllum * 54 +
        satinRollOff * 80 +
        clearcoat * 140 +
        mirrorCore * 148 +
        pebbleGlint * 138 +
        hotSpark * 248;
      const g =
        1 +
        bodyIllum * 4 +
        satinRollOff * 10 +
        clearcoat * 45 +
        mirrorCore * 114 +
        pebbleGlint * 58 +
        hotSpark * 174;
      const b =
        1 +
        bodyIllum * 6 +
        satinRollOff * 14 +
        clearcoat * 43 +
        mirrorCore * 108 +
        pebbleGlint * 54 +
        hotSpark * 164;

      data[pIdx] = Math.min(255, Math.round(r));
      data[pIdx + 1] = Math.min(255, Math.round(g));
      data[pIdx + 2] = Math.min(255, Math.round(b));
      data[pIdx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  masterCoverCanvas = canvas;
  return canvas;
}

export const EclipseArtwork: React.FC<EclipseArtworkProps> = React.memo(({
  isPlaying = false,
  size = 'hero',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dim = size === 'hero' ? 360 : size === 'card' ? 240 : 112;
    canvas.width = dim;
    canvas.height = dim;

    const master = getMasterLeatherCoverCanvas();
    if (master) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(master, 0, 0, dim, dim);
    }
  }, [size]);

  return (
    <div
      className={`void-eclipse-artwork void-eclipse-${size} ${
        isPlaying ? 'is-playing-pulse' : ''
      } ${className}`}
    >
      <canvas ref={canvasRef} className="void-eclipse-canvas" />
      <div className="void-eclipse-glass-sheen" aria-hidden="true" />
    </div>
  );
});
