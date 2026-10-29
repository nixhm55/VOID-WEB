import React, { useEffect, useRef, useState } from 'react';
import { STAGE_DOM_REFS } from '../hooks/useScrollAndMotion';
import { LEATHER_GRAIN_BASE64, LEATHER_GRAIN_SIZE } from './leatherGrainTexture';

interface LuxuryLeatherBackdropProps {
  isPlaying: boolean;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// Fast deterministic 2D hash for organic hide cells and micro-creases
function hash2(ix: number, iy: number, seed: number): [number, number, number] {
  let n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  n = ((n ^ (n >> 13)) * 1274126177) | 0;
  const h1 = ((n ^ (n >> 16)) >>> 0) / 4294967295;
  n = (n * 1664525 + 1013904223) | 0;
  const h2 = (n >>> 0) / 4294967295;
  n = (n * 22695477 + 1) | 0;
  const h3 = (n >>> 0) / 4294967295;
  return [h1, h2, h3];
}

// Smooth value noise for organic leather micro-wrinkles and hide irregularity
function valueNoise2D(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  const [a] = hash2(ix, iy, seed);
  const [b] = hash2(ix + 1, iy, seed);
  const [c] = hash2(ix, iy + 1, seed);
  const [d] = hash2(ix + 1, iy + 1, seed);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

let leatherGrainCache: Float32Array | null = null;

/**
 * Decodes the reference-derived, seamlessly tileable leather micro-relief (see leatherGrainTexture.ts)
 * and shapes each grain cell into a smooth, polished convex pebble plateau bounded by crisp hairline
 * fissures—eliminating sandy peak noise while sharpening the recessed grain grooves.
 */
function getLeatherGrain(): Float32Array {
  if (leatherGrainCache) return leatherGrainCache;
  const n = LEATHER_GRAIN_SIZE;
  const bin = atob(LEATHER_GRAIN_BASE64);
  const raw = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) {
    raw[i] = (bin.charCodeAt(i) - 128) / 40;
  }

  // Light 3x3 structure-preserving polish kernel on the positive plateau domes so pebble tops
  // reflect clean specular glints instead of pixel-level high-pass chatter, while keeping fissures sharp.
  const tex = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    const ym = (y - 1 + n) % n;
    const yp = (y + 1) % n;
    for (let x = 0; x < n; x++) {
      const xm = (x - 1 + n) % n;
      const xp = (x + 1) % n;
      const c = raw[y * n + x];
      const ringAvg =
        (raw[ym * n + x] +
          raw[yp * n + x] +
          raw[y * n + xm] +
          raw[y * n + xp]) *
          0.18 +
        (raw[ym * n + xm] +
          raw[ym * n + xp] +
          raw[yp * n + xm] +
          raw[yp * n + xp]) *
          0.07;
      // Blend slightly more smoothing on raised pebble crowns (c > 0) than in narrow fissures (c < 0)
      const crownSmoothMix = smoothstep(-0.25, 0.85, c) * 0.44;
      const h = c * (1.0 - crownSmoothMix) + ringAvg * crownSmoothMix;

      // Plateau-and-fissure transfer curve:
      // - Fissures (h < 0.06) carve deep, narrow hairline grooves.
      // - Raised pebbles (h >= 0.06) dome smoothly into polished luxury leather facets.
      if (h < 0.06) {
        const depth = (0.06 - h) / 1.55;
        tex[y * n + x] = -Math.pow(clamp01(depth), 1.32) * 1.48;
      } else {
        const crown = (h - 0.06) * 1.28;
        tex[y * n + x] = (crown / (1.0 + crown * 0.56)) * 1.36;
      }
    }
  }

  leatherGrainCache = tex;
  return tex;
}

/**
 * C2-continuous Quintic Hermite wrap-around sampling of the grain relief at texel coordinates (u, v).
 * Eliminates the piecewise-linear derivative steps of standard bilinear interpolation for 4K normal clarity.
 */
function sampleLeatherGrain(tex: Float32Array, u: number, v: number): number {
  const n = LEATHER_GRAIN_SIZE;
  const fu = Math.floor(u);
  const fv = Math.floor(v);
  const tx = u - fu;
  const ty = v - fv;
  // Quintic C2 smoothstep weights: 6t^5 - 15t^4 + 10t^3
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
  const a = tex[r0 + x0];
  const b = tex[r0 + x1];
  const c = tex[r1 + x0];
  const d = tex[r1 + x1];
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

/** Soft filmic highlight shoulder so intense polished specular peaks roll off smoothly without harsh clipping. */
function leatherToneMap(c: number): number {
  if (c <= 0) return 0;
  const knee = 175;
  if (c <= knee) return c;
  const over = c - knee;
  return knee + (over * 80) / (over + 75);
}

/**
 * Sculpted tubular fold profile with a taut, high-gloss crest ribbon, a smooth convex apron,
 * and a deep tucked shadow crease—matching the 3D draped folds in 2nd.png & 1st.png.
 */
function sculptedFoldTube(
  d: number,
  widthTop: number,
  widthBottom: number
): {
  height: number;
  rimHighlightMask: number;
  tightGlossMask: number;
  shadowTuck: number;
} {
  const w = d < 0 ? widthTop : widthBottom;
  const t = d / w;
  const t2 = t * t;
  // Slightly steeper roll-off keeps deep black valleys crisp and prevents wide muddy red wash
  const height = Math.exp(-t2 * 1.18);
  // Broad satin sheen along the upper-facing fold crown
  const rimShift = (d + widthTop * 0.2) / (widthTop * 0.52);
  const rimHighlightMask = Math.exp(-rimShift * rimShift);
  // Razor-sharp polished clearcoat ribbon right along the taut fold bend
  const glossShift = (d + widthTop * 0.16) / (widthTop * 0.26);
  const tightGlossMask = Math.exp(-glossShift * glossShift);
  // Deep shadow tuck immediately outside the steep fold edge
  const tuckShift = (d + widthTop * 1.02) / (widthTop * 0.52);
  const shadowTuck = Math.exp(-tuckShift * tuckShift);
  return { height, rimHighlightMask, tightGlossMask, shadowTuck };
}

/**
 * Evaluates the continuous 2-screen (HOME + FEATURES) 3D draped burgundy leather folds
 * matching 2nd.png (top half ny = 0..0.5) and 1st.png (bottom half ny = 0.5..1.0).
 * Preserves the exact fold positions and composition while adding `clearcoatRibbon` and `pebbleReliefMix`
 * so taut fold edges gleam smoothly and embossed pebble zones render with 4K crispness.
 */
function evaluateLeatherDrapery(nx: number, ny: number): {
  elevation: number;
  satinRim: number;
  clearcoatRibbon: number;
  ambientOcclusion: number;
  dofSharpness: number;
  pebbleReliefMix: number;
  flowAngle: number;
} {
  // ---- SCREEN 1 (HOME: ny = 0.0 .. 0.52) matched to 2nd.png ----
  // H1: Upper-right draped fold rising behind the vinyl platter
  const dH1 = ny - (0.21 - (nx - 0.64) * 0.62 + 0.025 * Math.sin(nx * 6.5));
  const fH1 = sculptedFoldTube(dH1, 0.036, 0.086);
  const wH1 = smoothstep(0.46, 0.7, nx) * smoothstep(0.46, 0.06, ny);

  // H2: Mid-center pinched diagonal fold ridge emerging below "SCROLL TO DOWNLOAD"
  // Tighter upper edge (0.026) creates the crisp, pinched leather ridge seen in 2nd.png
  const dH2 = ny - (0.34 - (nx - 0.37) * 0.42 + 0.018 * Math.cos(nx * 5.5));
  const fH2 = sculptedFoldTube(dH2, 0.026, 0.078);
  const wH2 =
    smoothstep(0.18, 0.34, nx) *
    smoothstep(0.64, 0.44, nx) *
    smoothstep(0.16, 0.26, ny) *
    smoothstep(0.48, 0.34, ny);

  // H3: Lower-left sleek glossy fold above the 4-icon strip
  const dH3 = ny - (0.39 + (nx - 0.18) * 0.08 + 0.022 * Math.sin(nx * 5.8));
  const fH3 = sculptedFoldTube(dH3, 0.026, 0.064);
  const wH3 = smoothstep(0.68, 0.34, nx);

  // H4: Lower-left sweeping foreground fold with strong liquid-glossy top ribbon above the 4-icon strip
  const dH4 = ny - (0.46 + (nx - 0.24) * 0.14 + 0.02 * Math.cos(nx * 6.2));
  const fH4 = sculptedFoldTube(dH4, 0.028, 0.076);
  const wH4 = smoothstep(0.82, 0.4, nx);

  // ---- SCREEN 2 (FEATURES: ny = 0.48 .. 1.0) matched to 1st.png ----
  // F1: Steep upper-right diagonal leather fold ascending to top-right corner of FEATURES
  const dF1 = ny - (0.64 - (nx - 0.62) * 0.82 + 0.024 * Math.sin(ny * 9.0));
  const fF1 = sculptedFoldTube(dF1, 0.033, 0.088);
  const wF1 =
    smoothstep(0.42, 0.64, nx) *
    smoothstep(0.38, 0.54, ny) *
    smoothstep(0.84, 0.64, ny);

  // F2: Soft background folds in upper-left/center-left of FEATURES (recessed DOF)
  const dF2 = ny - (0.61 + (nx - 0.22) * 0.18 + 0.03 * Math.sin(nx * 5.2));
  const fF2 = sculptedFoldTube(dF2, 0.048, 0.088);
  const wF2 = smoothstep(0.68, 0.32, nx) * smoothstep(0.44, 0.56, ny);

  // F3: THE MAIN CENTRAL-RIGHT BILLOWING S-CURVE FOLD & CONVEX BELLY
  const sCrestY =
    0.685 -
    0.058 * Math.exp(-Math.pow((nx - 0.53) / 0.145, 2)) +
    0.024 * Math.exp(-Math.pow((nx - 0.72) / 0.12, 2)) -
    (nx - 0.55) * 0.195;
  const dF3 = ny - sCrestY;
  const fF3 = sculptedFoldTube(dF3, 0.031, 0.132);
  const wF3 = smoothstep(0.24, 0.42, nx) * smoothstep(0.48, 0.58, ny);

  // F4: THE PROMINENT FOREGROUND DIAGONAL FOLD sweeping from player card right edge down to bottom-right
  const fgCrestY =
    0.775 + (nx - 0.34) * 0.365 + 0.015 * Math.sin((nx - 0.34) * 6.5);
  const dF4 = ny - fgCrestY;
  const fF4 = sculptedFoldTube(dF4, 0.029, 0.106);
  const wF4 = smoothstep(0.14, 0.33, nx) * smoothstep(0.96, 0.78, nx);

  // F5: Lower-left & bottom-center fold beneath the player card in FEATURES
  const dF5 = ny - (0.885 + (nx - 0.2) * 0.25 + 0.018 * Math.cos(nx * 6.0));
  const fF5 = sculptedFoldTube(dF5, 0.033, 0.084);
  const wF5 = smoothstep(0.7, 0.26, nx);

  // F6: Bottom-right lip fold at the very bottom edge of FEATURES
  const dF6 = ny - (0.985 - 0.025 * Math.exp(-Math.pow((nx - 0.78) / 0.18, 2)));
  const fF6 = sculptedFoldTube(dF6, 0.026, 0.062);
  const wF6 = smoothstep(0.48, 0.68, nx);

  // Combine elevations
  const elevation =
    fH1.height * wH1 * 0.9 +
    fH2.height * wH2 * 0.74 +
    fH3.height * wH3 * 0.82 +
    fH4.height * wH4 * 0.88 +
    fF1.height * wF1 * 0.98 +
    fF2.height * wF2 * 0.52 +
    fF3.height * wF3 * 1.26 +
    fF4.height * wF4 * 1.2 +
    fF5.height * wF5 * 0.86 +
    fF6.height * wF6 * 0.78;

  // Grazing satin rim highlight along the fold crests
  const satinRim =
    fH1.rimHighlightMask * wH1 * 0.84 +
    fH2.rimHighlightMask * wH2 * 0.72 +
    fH3.rimHighlightMask * wH3 * 0.82 +
    fH4.rimHighlightMask * wH4 * 0.92 +
    fF1.rimHighlightMask * wF1 * 0.96 +
    fF3.rimHighlightMask * wF3 * 1.32 +
    fF4.rimHighlightMask * wF4 * 1.26 +
    fF5.rimHighlightMask * wF5 * 0.76 +
    fF6.rimHighlightMask * wF6 * 0.7;

  // High-gloss polished clearcoat ribbon concentrated along the taut fold bends (matches 2nd.png)
  const clearcoatRibbon =
    fH1.tightGlossMask * wH1 * 0.88 +
    fH2.tightGlossMask * wH2 * 0.86 +
    fH3.tightGlossMask * wH3 * 0.96 +
    fH4.tightGlossMask * wH4 * 1.15 +
    fF1.tightGlossMask * wF1 * 0.92 +
    fF3.tightGlossMask * wF3 * 1.18 +
    fF4.tightGlossMask * wF4 * 1.14 +
    fF5.tightGlossMask * wF5 * 0.78 +
    fF6.tightGlossMask * wF6 * 0.72;

  // Deep crease shadow tucks between folds
  const shadowTuckTotal =
    fH1.shadowTuck * wH1 * 0.72 +
    fH2.shadowTuck * wH2 * 0.62 +
    fH3.shadowTuck * wH3 * 0.68 +
    fH4.shadowTuck * wH4 * 0.74 +
    fF1.shadowTuck * wF1 * 0.78 +
    fF3.shadowTuck * wF3 * 0.94 +
    fF4.shadowTuck * wF4 * 0.96 +
    fF5.shadowTuck * wF5 * 0.72;

  const ambientOcclusion = clamp01(
    (1.0 - shadowTuckTotal * 0.82) * smoothstep(0.03, 0.52, elevation)
  );

  // Depth-of-field sharpness: foreground/midground crests have crisp 4K tactile grain;
  // recessed background valleys soften naturally.
  const dofSharpness = clamp01(
    0.18 +
      0.82 *
        clamp01(
          fF3.height * wF3 * 1.18 +
            fF4.height * wF4 * 1.18 +
            fF1.height * wF1 * 0.88 +
            fF5.height * wF5 * 0.82 +
            fH1.height * wH1 * 0.94 +
            fH2.height * wH2 * 0.88 +
            fH3.height * wH3 * 0.84 +
            fH4.height * wH4 * 0.88
        )
  );

  // Controls where the hide is taut/smooth over a sharp bend vs. richly pebbled on broader slopes
  // In 2nd.png, H3 & H4 lower-left ribbons are taut and liquid-glossy, while H2's right apron,
  // H1's right flank, and F3/F4's broad bellies display intricate, high-definition pebble relief.
  const tautRibbonSuppression = clamp01(
    (fH3.tightGlossMask * wH3 + fH4.tightGlossMask * wH4) * 0.52 +
      fH1.tightGlossMask * wH1 * 0.28
  );
  const pebbleReliefMix = clamp01(dofSharpness * (1.0 - tautRibbonSuppression));

  const flowAngle =
    (wF3 * -0.32 + wF4 * 0.36 + wF1 * -0.68 + wH1 * -0.58) /
    Math.max(0.001, wF3 + wF4 + wF1 + wH1 + 0.35);

  return {
    elevation,
    satinRim,
    clearcoatRibbon,
    ambientOcclusion,
    dofSharpness,
    pebbleReliefMix,
    flowAngle,
  };
}

export const LuxuryLeatherBackdrop: React.FC<LuxuryLeatherBackdropProps> = React.memo(
  ({ isPlaying }) => {
    const heroFeaturesCanvasRef = useRef<HTMLCanvasElement>(null);
    const vinylDiscCanvasRef = useRef<HTMLCanvasElement>(null);
    const vinylAssemblyRef = useRef<HTMLDivElement>(null);
    const leatherScrollStageRef = useRef<HTMLDivElement>(null);
    const [tileDataUrl, setTileDataUrl] = useState<string>('');

    useEffect(() => {
      STAGE_DOM_REFS.vinylPlatterEl = vinylAssemblyRef.current;
      STAGE_DOM_REFS.leatherStageEl = leatherScrollStageRef.current;
      STAGE_DOM_REFS.leatherCanvasEl = heroFeaturesCanvasRef.current;
      return () => {
        STAGE_DOM_REFS.vinylPlatterEl = null;
        STAGE_DOM_REFS.leatherStageEl = null;
        STAGE_DOM_REFS.leatherCanvasEl = null;
      };
    }, []);

    // TASK 1: Render the high-resolution 4K-quality polished 3D draped burgundy leather folds & micro-relief
    useEffect(() => {
      const canvas = heroFeaturesCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Upgraded 1600x2400 render resolution (preserving exact 2:3 aspect ratio and object-fit: cover behavior)
      // so fine hairline fissures, pebble plateaus, and specular micro-glints resolve with 4K clarity.
      const w = 1600;
      const h = 2400;
      canvas.width = w;
      canvas.height = h;

      // Coarser macro grid (800x1200 + 2 guard cells) for smooth drapery fields
      const mw = 800;
      const mh = 1200;
      const gw = mw + 2;
      const gh = mh + 2;
      const gN = gw * gh;
      const fE = new Float32Array(gN); // fold elevation
      const fRim = new Float32Array(gN); // satin crest highlight
      const fCoat = new Float32Array(gN); // tight clearcoat gloss ribbon
      const fOcc = new Float32Array(gN); // crease occlusion
      const fDof = new Float32Array(gN); // foreground sharpness
      const fPeb = new Float32Array(gN); // pebble relief modulation
      const fP = new Float32Array(gN); // macro surface slope dz/dx
      const fQ = new Float32Array(gN); // macro surface slope dz/dy
      const fU = new Float32Array(gN); // grain texture coordinates that follow the folds
      const fV = new Float32Array(gN);

      for (let cy = 0; cy < gh; cy++) {
        const ny = cy / mh;
        for (let cx = 0; cx < gw; cx++) {
          const d = evaluateLeatherDrapery(cx / mw, ny);
          const i = cy * gw + cx;
          fE[i] = d.elevation;
          fRim[i] = d.satinRim;
          fCoat[i] = d.clearcoatRibbon;
          fOcc[i] = d.ambientOcclusion;
          fDof[i] = d.dofSharpness;
          fPeb[i] = d.pebbleReliefMix;
        }
      }

      // Macro slopes and fold-following arc-length grain coordinates
      const slopeGain = 38 * (mw / 840);
      const leak = 0.004;
      const vExtra = new Float32Array(gw);
      for (let cy = 0; cy < gh; cy++) {
        const ym = cy > 0 ? cy - 1 : 0;
        const yp = cy < gh - 1 ? cy + 1 : gh - 1;
        const ny = cy / mh;
        let uExtra = 0;
        for (let cx = 0; cx < gw; cx++) {
          const xm = cx > 0 ? cx - 1 : 0;
          const xp = cx < gw - 1 ? cx + 1 : gw - 1;
          const i = cy * gw + cx;
          const p = ((fE[cy * gw + xp] - fE[cy * gw + xm]) * slopeGain * 2) / (xp - xm);
          const q = ((fE[yp * gw + cx] - fE[ym * gw + cx]) * slopeGain * 2) / (yp - ym);
          fP[i] = p;
          fQ[i] = q;

          uExtra = uExtra * (1 - leak) + (Math.sqrt(1 + p * p) - 1);
          vExtra[cx] = vExtra[cx] * (1 - leak) + (Math.sqrt(1 + q * q) - 1);

          // Low-frequency organic bend so the grain network never reads as a rigid lattice
          const nx = cx / mw;
          const warp1 = valueNoise2D(nx * 18.0, ny * 26.0, 101) - 0.5;
          const warp2 = valueNoise2D(nx * 38.0 + 7.1, ny * 54.0 + 3.3, 202) - 0.5;
          fU[i] = (cx + uExtra + warp1 * 15.0 + warp2 * 4.5) * (600 / mw);
          fV[i] = (cy + vExtra[cx] + warp1 * 11.0 - warp2 * 3.8) * (900 / mh);
        }
      }

      const grainTex = getLeatherGrain();
      const stepX = mw / w;
      const stepY = mh / h;
      const colI = new Int32Array(w);
      const colF = new Float32Array(w);
      for (let px = 0; px < w; px++) {
        const c = px * stepX;
        const ci = Math.floor(c);
        colI[px] = ci;
        colF[px] = c - ci;
      }
      const bil = (a: Float32Array, i: number, fx: number, fy: number): number =>
        a[i] * (1 - fx) * (1 - fy) +
        a[i + 1] * fx * (1 - fy) +
        a[i + gw] * (1 - fx) * fy +
        a[i + gw + 1] * fx * fy;

      // Multi-scale C2-interpolated leather hide relief:
      // - g1: Primary reference scale/pebble pattern
      // - g2: Rotated secondary mesoscale hide undulation (breaks up periodicity)
      // - hairlineGroove: Fine hairline fissure network between secondary cells
      const texelsPerMacroPx = 1.62;
      const rotC = Math.cos(0.92);
      const rotS = Math.sin(0.92);
      const grainH = new Float32Array(w * h);
      for (let py = 0; py < h; py++) {
        const cyf = py * stepY;
        const ri = Math.floor(cyf);
        const fy = cyf - ri;
        for (let px = 0; px < w; px++) {
          const i = ri * gw + colI[px];
          const fx = colF[px];
          const tu = bil(fU, i, fx, fy) * texelsPerMacroPx;
          const tv = bil(fV, i, fx, fy) * texelsPerMacroPx;
          const g1 = sampleLeatherGrain(grainTex, tu, tv);
          const g2 = sampleLeatherGrain(
            grainTex,
            (tu * rotC - tv * rotS) * 0.48 + 61.7,
            (tu * rotS + tv * rotC) * 0.48 + 23.1
          );
          // Sharp hairline micro-fissure where primary and secondary grain cells intersect
          const diffG = Math.abs(g1 * 0.65 - g2 * 0.55);
          const hairlineGroove = -Math.exp(-diffG * diffG * 18.0) * 0.28;
          grainH[py * w + px] = g1 * 0.86 + g2 * 0.46 + hairlineGroove;
        }
      }

      const img = ctx.createImageData(w, h);
      const data = img.data;

      // Studio lighting vectors matched to 2nd.png & 1st.png
      const l1x = -0.28;
      const l1y = -0.74;
      const l1z = 0.61;

      const l2x = 0.42;
      const l2y = -0.58;
      const l2z = 0.69;

      // Primary half-vector for crisp per-scale specular glints & polished clearcoat
      const hx = -0.14;
      const hy = -0.44;
      const hz = 0.887;

      // Secondary grazing half-vector for warm crimson-oxblood sheen roll-off
      const h2x = 0.16;
      const h2y = -0.52;
      const h2z = 0.839;

      const reliefGain = 0.94;

      for (let py = 0; py < h; py++) {
        const cyf = py * stepY;
        const ri = Math.floor(cyf);
        const fy = cyf - ri;
        const yPrev = py > 0 ? py - 1 : 0;
        const yNext = py < h - 1 ? py + 1 : h - 1;

        for (let px = 0; px < w; px++) {
          const idx = py * w + px;
          const pIdx = idx * 4;
          const i = ri * gw + colI[px];
          const fx = colF[px];

          const occ = bil(fOcc, i, fx, fy);
          if (occ < 0.002) {
            data[pIdx] = 3;
            data[pIdx + 1] = 1;
            data[pIdx + 2] = 2;
            data[pIdx + 3] = 255;
            continue;
          }

          const xPrev = px > 0 ? px - 1 : 0;
          const xNext = px < w - 1 ? px + 1 : w - 1;

          const mH = bil(fE, i, fx, fy);
          const rim = bil(fRim, i, fx, fy);
          const coat = bil(fCoat, i, fx, fy);
          const dof = bil(fDof, i, fx, fy);
          const pebMix = bil(fPeb, i, fx, fy);
          const P = bil(fP, i, fx, fy);
          const Q = bil(fQ, i, fx, fy);

          const gHere = grainH[idx];
          // Scale relief with pixel density (w / 1200) and pebbleReliefMix so taut fold bends
          // have a sleek polished surface while embossed pebble zones have deep tactile definition.
          const relief = reliefGain * (w / 1200) * (0.24 + 0.76 * pebMix);
          const qx = (grainH[py * w + xNext] - grainH[py * w + xPrev]) * 0.5 * relief;
          const qy = (grainH[yNext * w + px] - grainH[yPrev * w + px]) * 0.5 * relief;

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

          // Clearcoat normal blends macro fold normal with 38% of the micro-grain normal,
          // simulating a real polished wax/lacquer finish over the embossed hide.
          const cSx = P + qx * 0.38;
          const cSy = Q + qy * 0.38;
          const cInv = 1.0 / Math.sqrt(cSx * cSx + cSy * cSy + 1.0);
          const cNx = -cSx * cInv;
          const cNy = -cSy * cInv;
          const cNz = cInv;

          const macroDiff = Math.max(0, mNx * l1x + mNy * l1y + mNz * l1z);
          const microDiff1 = Math.max(0, nx * l1x + ny * l1y + nz * l1z);
          const microDiff2 = Math.max(0, nx * l2x + ny * l2y + nz * l2z);

          // Crisp fissure cavity mask: hairline grooves between raised pebbles stay deep obsidian black,
          // creating unmistakable 4K separation between raised pebble plateaus and recessed lines.
          const cav = smoothstep(-1.15, 0.28, gHere);
          const cavity = 1.0 - (0.86 * (0.3 + 0.7 * dof)) * (1.0 - cav);

          // 1. Ultra-deep, thick dark oxblood / black-cherry leather body (#180204 -> #3E050A)
          const diffuse = microDiff1 * 0.72 + microDiff2 * 0.28;
          const bodyIllum =
            Math.pow(diffuse, 1.65) * cavity * occ * clamp01(mH * 0.88);

          // 2. Deep, heavy burgundy-mahogany roll-off along the upper fold contours (#4E070D -> #6E0C15)
          const cNdotH2 = Math.max(0, cNx * h2x + cNy * h2y + cNz * h2z);
          const satinRollOff =
            Math.pow(clamp01(rim * (0.48 + 0.52 * macroDiff)), 1.85) *
            (0.6 + 0.4 * Math.pow(cNdotH2, 8)) *
            occ *
            (0.35 + 0.65 * cavity);

          // 3. Tight, controlled polished clearcoat along the fold edge (prevents wide bright-red bloom)
          const cNdotH = Math.max(0, cNx * hx + cNy * hy + cNz * hz);
          const c2 = cNdotH * cNdotH;
          const c4 = c2 * c2;
          const c8 = c4 * c4;
          const c16 = c8 * c8;
          const c32 = c16 * c16;
          const clearcoatGloss =
            (c16 * 0.58 + clamp01(coat) * Math.pow(cNdotH, 8) * 0.68) *
            (0.3 + 0.7 * cavity) *
            occ *
            clamp01(mH * 1.1);
          const clearcoatMirrorCore =
            c32 * clamp01(coat * 1.1) * (0.45 + 0.55 * cavity) * occ;

          // 4. Crisp 4K per-pebble specular glints & warm rose-champagne micro-sparks on raised grain facets
          const ndoth = Math.max(0, nx * hx + ny * hy + nz * hz);
          const ridgeZone = clamp01(rim * 0.86 + macroDiff * 0.42) * occ;
          const n2 = ndoth * ndoth;
          const n4 = n2 * n2;
          const n8 = n4 * n4;
          const n16 = n8 * n8;
          const n24 = n16 * n8;
          const n64 = n16 * n16 * n16 * n16;

          const raisedCrownMask = smoothstep(0.06, 0.84, gHere);
          const pebbleGlint =
            n24 * cavity * (0.34 + 0.66 * raisedCrownMask) * ridgeZone * (0.35 + 0.65 * dof);
          const hotPebbleSpark =
            n64 * raisedCrownMask * cavity * ridgeZone * dof;
          const bumpRimHighlight =
            smoothstep(0.58, 1.48, gHere) *
            ridgeZone *
            ridgeZone *
            (0.24 + 0.76 * n4) *
            dof;

          // Exact 49ea525e.png Deep Oxblood-Burgundy Palette:
          // - Midtones stay thick, dark oxblood (#240306 -> #520810), NEVER bright cherry red.
          // - Specular ridges transition from deep wine (#7A111B) to warm champagne-rose (#EAB0A6 / #F6D5CE).
          const r =
            3 +
            bodyIllum * 52 +
            satinRollOff * 78 +
            clearcoatGloss * 138 +
            clearcoatMirrorCore * 145 +
            pebbleGlint * 135 +
            hotPebbleSpark * 245 +
            bumpRimHighlight * 82;
          const g =
            1 +
            bodyIllum * 4 +
            satinRollOff * 10 +
            clearcoatGloss * 44 +
            clearcoatMirrorCore * 112 +
            pebbleGlint * 56 +
            hotPebbleSpark * 172 +
            bumpRimHighlight * 28;
          const b =
            1 +
            bodyIllum * 6 +
            satinRollOff * 14 +
            clearcoatGloss * 42 +
            clearcoatMirrorCore * 106 +
            pebbleGlint * 52 +
            hotPebbleSpark * 162 +
            bumpRimHighlight * 26;

          data[pIdx] = Math.round(leatherToneMap(r));
          data[pIdx + 1] = Math.round(leatherToneMap(g));
          data[pIdx + 2] = Math.round(leatherToneMap(b));
          data[pIdx + 3] = 255;
        }
      }

      ctx.putImageData(img, 0, 0);

      // Base tile for lower sections (Preview, Experience, Download, FAQ):
      // Upgraded to 352x352 (exact 2x multiple of LEATHER_GRAIN_SIZE = 176) with C2 Quintic sampling
      // and polished pebble-and-fissure shading for seamless 4K continuity.
      const tileSize = 352;
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileSize;
      tileCanvas.height = tileSize;
      const tCtx = tileCanvas.getContext('2d');
      if (tCtx) {
        const tH = new Float32Array(tileSize * tileSize);
        const tG = new Float32Array(tileSize * tileSize);
        const rate1 = (LEATHER_GRAIN_SIZE * 2) / tileSize;
        const rate2 = LEATHER_GRAIN_SIZE / tileSize;

        for (let y = 0; y < tileSize; y++) {
          const ny = y / tileSize;
          for (let x = 0; x < tileSize; x++) {
            const nx = x / tileSize;
            const swell =
              0.5 +
              0.5 *
                Math.sin(nx * Math.PI * 2 + ny * Math.PI * 2) *
                Math.cos(nx * Math.PI * 2 - ny * Math.PI * 2);
            tH[y * tileSize + x] = swell * 0.42;
            const g1 = sampleLeatherGrain(grainTex, x * rate1, y * rate1);
            const g2 = sampleLeatherGrain(grainTex, x * rate2 + 61.7, y * rate2 + 23.1);
            const diffG = Math.abs(g1 * 0.65 - g2 * 0.55);
            const hairline = -Math.exp(-diffG * diffG * 18.0) * 0.24;
            tG[y * tileSize + x] = g1 * 0.85 + g2 * 0.45 + hairline;
          }
        }

        const tImg = tCtx.createImageData(tileSize, tileSize);
        const tData = tImg.data;
        for (let y = 0; y < tileSize; y++) {
          const yP = (y - 1 + tileSize) % tileSize;
          const yN = (y + 1) % tileSize;
          for (let x = 0; x < tileSize; x++) {
            const xP = (x - 1 + tileSize) % tileSize;
            const xN = (x + 1) % tileSize;
            const dx =
              (tH[y * tileSize + xN] - tH[y * tileSize + xP]) * 18.0 +
              (tG[y * tileSize + xN] - tG[y * tileSize + xP]) * 0.58;
            const dy =
              (tH[yN * tileSize + x] - tH[yP * tileSize + x]) * 18.0 +
              (tG[yN * tileSize + x] - tG[yP * tileSize + x]) * 0.58;
            const inv = 1.0 / Math.sqrt(dx * dx + dy * dy + 1.0);
            const nx = -dx * inv;
            const ny = -dy * inv;
            const nz = inv;

            const diff = Math.max(0, nx * l1x + ny * l1y + nz * l1z);
            const ndoth = Math.max(0, nx * hx + ny * hy + nz * hz);
            const n2 = ndoth * ndoth;
            const n4 = n2 * n2;
            const n8 = n4 * n4;
            const n24 = n8 * n8 * n8;
            const gVal = tG[y * tileSize + x];
            const cav = smoothstep(-1.15, 0.28, gVal);
            const cavity = 1.0 - 0.82 * (1.0 - cav);
            const idx = (y * tileSize + x) * 4;

            tData[idx] = Math.min(
              255,
              Math.round(3 + diff * cavity * 22 + n24 * cavity * 54)
            );
            tData[idx + 1] = Math.min(
              255,
              Math.round(1 + diff * cavity * 2 + n24 * cavity * 18)
            );
            tData[idx + 2] = Math.min(
              255,
              Math.round(1 + diff * cavity * 4 + n24 * cavity * 18)
            );
            tData[idx + 3] = 255;
          }
        }
        tCtx.putImageData(tImg, 0, 0);
        setTileDataUrl(tileCanvas.toDataURL('image/png'));
      }
    }, []);

    // TASK 2: Render high-realism physical vinyl/CD micro-grooves & radial track bands on canvas (preserved untouched)
    useEffect(() => {
      const discCanvas = vinylDiscCanvasRef.current;
      if (!discCanvas) return;
      const ctx = discCanvas.getContext('2d');
      if (!ctx) return;

      const size = 640;
      discCanvas.width = size;
      discCanvas.height = size;
      const cx = size * 0.5;
      const cy = size * 0.5;
      const maxR = size * 0.5;

      const img = ctx.createImageData(size, size);
      const data = img.data;

      for (let y = 0; y < size; y++) {
        const dy = y - cy;
        for (let x = 0; x < size; x++) {
          const dx = x - cx;
          const r = Math.sqrt(dx * dx + dy * dy) / maxR; // 0 .. 1
          const pIdx = (y * size + x) * 4;

          if (r > 1.0 || r < 0.32) {
            data[pIdx + 3] = 0;
            continue;
          }

          const theta = Math.atan2(dy, dx); // -PI .. PI

          // Physical audio track bands (lead-in rim, 4 distinct mastered song bands with narrow track gaps, lead-out ring)
          const trackGap1 = Math.exp(-Math.pow((r - 0.82) / 0.006, 2));
          const trackGap2 = Math.exp(-Math.pow((r - 0.67) / 0.0055, 2));
          const trackGap3 = Math.exp(-Math.pow((r - 0.52) / 0.005, 2));
          const leadOutRing = smoothstep(0.41, 0.36, r);
          const outerLand = smoothstep(0.955, 0.985, r);

          // High-frequency concentric micro-grooves + fine angular brushed variation
          const grooveFreq1 = Math.sin(r * 1180.0);
          const grooveFreq2 = Math.sin(r * 460.0 + Math.sin(r * 92.0) * 1.8);
          const grooveFreq3 = Math.cos(r * 2150.0 + Math.cos(theta * 3.0) * 0.5);
          const angularMicroScratch =
            Math.sin(theta * 24.0 + r * 45.0) * 0.15 +
            Math.cos(theta * 68.0 - r * 120.0) * 0.1;

          // Groove reflectivity modulation
          const grooveMod =
            (grooveFreq1 * 0.45 + grooveFreq2 * 0.35 + grooveFreq3 * 0.2) *
            (1.0 - trackGap1 * 0.72 - trackGap2 * 0.68 - trackGap3 * 0.68) *
            (1.0 - leadOutRing * 0.55) *
            (1.0 - outerLand * 0.65);

          // Rotating subtle optical sheen variation so the spinning motion is physically perceptible
          const rotatingHarmonic =
            0.5 +
            0.5 * Math.sin(theta * 2.0 + 0.8) +
            0.22 * Math.cos(theta * 4.0 - 1.1) +
            angularMicroScratch;

          // Outer machined step bevel near r = 0.965 and inner label recess step near r = 0.355
          const outerBevelSpec = Math.exp(-Math.pow((r - 0.968) / 0.007, 2)) * 0.85;
          const innerStepSpec = Math.exp(-Math.pow((r - 0.356) / 0.006, 2)) * 0.75;

          const ridgeVal = clamp01(
            0.38 + grooveMod * 0.42 + rotatingHarmonic * 0.18 + outerBevelSpec + innerStepSpec
          );

          // Neutral-warm optical groove transmission that interacts with the studio light layer
          const red = Math.round(12 + ridgeVal * 155 + outerBevelSpec * 75);
          const green = Math.round(4 + ridgeVal * 62 + outerBevelSpec * 45);
          const blue = Math.round(6 + ridgeVal * 68 + outerBevelSpec * 42);
          const alpha = Math.round(
            clamp01(0.42 + Math.abs(grooveMod) * 0.46 + outerBevelSpec + innerStepSpec) * 255
          );

          data[pIdx] = Math.min(255, red);
          data[pIdx + 1] = Math.min(255, green);
          data[pIdx + 2] = Math.min(255, blue);
          data[pIdx + 3] = alpha;
        }
      }

      ctx.putImageData(img, 0, 0);
    }, []);

    return (
      <div className="void-continuous-leather-world" aria-hidden="true">
        {/* Base Full-Page Dark Burgundy Pebble-Leather Hide */}
        <div
          className="void-leather-base-hide"
          style={
            tileDataUrl ? { backgroundImage: `url(${tileDataUrl})` } : undefined
          }
        />

        {/* Continuous Scroll-Linked 2-Screen Sculpted Burgundy Leather Folds + Single Spinning Vinyl Platter */}
        <div ref={leatherScrollStageRef} className="void-leather-scroll-stage">
          <canvas
            ref={heroFeaturesCanvasRef}
            className="void-continuous-leather-canvas"
          />

          {/* Single Photorealistic Spinning Vinyl Record / Turntable Platter (8739bb8f.png & cd1d6483.png) */}
          <div
            ref={vinylAssemblyRef}
            className={`void-vinyl-turntable-assembly ${
              isPlaying ? 'is-spinning-active' : 'is-spinning-ambient'
            }`}
          >
            {/* Outer Dark Bronze & Burgundy Double-Beveled Turntable Platter Base */}
            <div className="void-vinyl-platter-base">
              {/* Fixed World-Space Anisotropic Studio Reflection Cones (Stays oriented to studio lights!) */}
              <div className="void-vinyl-world-anisotropic-light" />

              {/* Rotating Physical Grooved Disc + Center Label */}
              <div className="void-vinyl-spinning-disc">
                <canvas
                  ref={vinylDiscCanvasRef}
                  className="void-vinyl-grooves-canvas"
                />

                {/* Recessed Deep-Burgundy Brushed Metallic Center Label ("VOID / MUSIC LIVES HERE") */}
                <div className="void-vinyl-center-label">
                  <div className="void-vinyl-label-patina" />
                  <div className="void-vinyl-spindle-pin" />
                  <div className="void-vinyl-label-text-group">
                    <span className="void-vinyl-label-brand">V O I D</span>
                    <span className="void-vinyl-label-sub">
                      M U S I C &nbsp; L I V E S &nbsp; H E R E
                    </span>
                  </div>
                </div>
              </div>

              {/* Specular Rim Catchlight Arc & Upper-Right Tonearm Assembly */}
              <div className="void-vinyl-rim-specular-arc" />
              <div className="void-vinyl-tonearm" />
            </div>
          </div>
        </div>

        {/* Soft Cinematic Obsidian Vignette */}
        <div className="void-leather-cinematic-vignette" />
      </div>
    );
  }
);
