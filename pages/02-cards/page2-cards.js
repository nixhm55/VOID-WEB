/**
 * PAGE 2: 7-CARD 3D PERSPECTIVE FADE CAROUSEL MODULE (page2-cards.js)
 * - 14-Unit Zero-Teleport Virtual Ring
 * - Extra-Smooth C2-Continuous Quintic-Hermite Unfolding Curve
 * - Per-Unit Soft Under-Damped 2nd-Order Spring Hover Physics (Zero Snapping)
 * - Pure GPU Transform + Opacity Compositing (Zero per-frame CSS filter repaints in Safari)
 * - Ambient Center Glow Interpolation
 */

window.VoidPage2Cards = (() => {
  let featuresWrapper = null;
  let prismStage3D = null;
  let prismCenterGlow = null;
  let prismUnits = [];
  let prismContents = [];
  let cardCount = 7;
  let ringCount = 14;
  let lastRenderedCarousel = -999;
  let lastRenderedEntry = -999;
  let lastRenderedMouseX = -999;
  let lastRenderedMouseY = -999;
  let lastRenderedVel = -999;

  // Per-unit independent 2nd-order under-damped spring state so switching cards never snaps
  let unitHoverSprings = [];
  let anyHoverSpringActive = false;

  const CARD_AMBIENT_RGB = [
    [242, 88, 22],   // Card 0: Flame Orange
    [188, 38, 112],  // Card 1: Deep Violet-Magenta
    [20, 152, 232],  // Card 2: Cobalt Blue-Cyan
    [232, 62, 30],   // Card 3: Crimson Red-Coral
    [108, 42, 224],  // Card 4: Electric Indigo-Violet
    [210, 56, 82],   // Card 5: Amethyst Rose-Orange
    [244, 108, 24],  // Card 6: Sunset Amber-Orange
  ];

  const PRISM_SLOT_ANCHORS = [
    { d: -4.0, x: -555, sx: 0.22, sy: 0.64, ry: -42, cardOp: 0.0 },
    { d: -3.0, x: -494, sx: 0.24, sy: 0.66, ry: -42, cardOp: 0.96 },
    { d: -2.0, x: -420, sx: 0.25, sy: 0.68, ry: -42, cardOp: 0.98 },
    { d: -1.0, x: -344, sx: 0.26, sy: 0.70, ry: -42, cardOp: 1.0 },
    { d:  0.0, x:    0, sx: 1.00, sy: 1.00, ry:   0, cardOp: 1.0 },
    { d:  1.0, x:  344, sx: 0.26, sy: 0.70, ry: -42, cardOp: 1.0 },
    { d:  2.0, x:  420, sx: 0.25, sy: 0.68, ry: -42, cardOp: 0.98 },
    { d:  3.0, x:  494, sx: 0.24, sy: 0.66, ry: -42, cardOp: 0.96 },
    { d:  4.0, x:  555, sx: 0.22, sy: 0.64, ry: -42, cardOp: 0.0 },
  ];

  function smootherstep01(t) {
    const c = t < 0 ? 0 : t > 1 ? 1 : t;
    return c * c * c * (c * (c * 6 - 15) + 10);
  }

  function wrapDelta(diff, total) {
    let d = ((diff % total) + total) % total;
    if (d > total * 0.5) d -= total;
    return d;
  }

  function samplePrismSlotPose(d) {
    const minD = PRISM_SLOT_ANCHORS[0].d;
    const maxD = PRISM_SLOT_ANCHORS[PRISM_SLOT_ANCHORS.length - 1].d;
    const clamped = d < minD ? minD : d > maxD ? maxD : d;
    const absD = Math.abs(clamped);

    if (absD <= 1.0) {
      const sign = clamped < 0 ? -1 : 1;
      const u = 1.0 - absD;
      const easeUnfold = smootherstep01(u);
      const easeX = 1.0 - (0.62 * absD + 0.38 * (1.0 - easeUnfold));

      const x = sign * 344 * (1.0 - easeX);
      const sx = 0.26 + (1.00 - 0.26) * easeUnfold;
      const sy = 0.70 + (1.00 - 0.70) * easeUnfold;
      const ry = -42 + (0 - -42) * easeUnfold;

      let uiOp = 0;
      if (absD < 0.62) {
        uiOp = smootherstep01(1.0 - absD / 0.62);
      }

      return { x, sx, sy, ry, uiOp, cardOp: 1.0 };
    }

    for (let i = 0; i < PRISM_SLOT_ANCHORS.length - 1; i++) {
      const a = PRISM_SLOT_ANCHORS[i];
      const b = PRISM_SLOT_ANCHORS[i + 1];
      if (clamped >= a.d && clamped <= b.d) {
        const span = b.d - a.d || 1;
        const t = (clamped - a.d) / span;
        const smoothOpT = smootherstep01(t);

        return {
          x: a.x + (b.x - a.x) * t,
          sx: a.sx + (b.sx - a.sx) * t,
          sy: a.sy + (b.sy - a.sy) * t,
          ry: a.ry + (b.ry - a.ry) * t,
          uiOp: 0,
          cardOp: a.cardOp + (b.cardOp - a.cardOp) * smoothOpT,
        };
      }
    }

    return { x: 0, sx: 1, sy: 1, ry: 0, uiOp: 1, cardOp: 1 };
  }

  function shapeCarouselStep(rawStep) {
    const clamped = Math.max(0, Math.min(cardCount - 1, rawStep));
    const base = Math.floor(clamped);
    const frac = clamped - base;
    const shapedFrac = smootherstep01(frac);
    return base + (shapedFrac * 0.72 + frac * 0.28);
  }

  function stepSoftSpring(state, target, stiffness, damping, dt) {
    const force = (target - state.pos) * stiffness - state.vel * damping;
    state.vel += force * dt;
    state.pos += state.vel * dt;
    if (Math.abs(target - state.pos) < 0.0004 && Math.abs(state.vel) < 0.0008) {
      state.pos = target;
      state.vel = 0;
      return false;
    }
    return true;
  }

  function init(onCardStepClick, onHoverActivity) {
    featuresWrapper = document.getElementById('featuresScrollWrapper');
    prismStage3D = document.getElementById('prismStage3D');
    prismCenterGlow = document.getElementById('prismCenterGlow');

    const basePrismUnits = Array.from(document.querySelectorAll('.prism-unit:not([data-cloned="true"])'));
    cardCount = basePrismUnits.length || 7;

    if (prismStage3D && basePrismUnits.length === 7 && document.querySelectorAll('.prism-unit').length === 7) {
      basePrismUnits.forEach((unit) => {
        const clone = unit.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('data-cloned', 'true');
        prismStage3D.appendChild(clone);
      });
    }

    prismUnits = Array.from(document.querySelectorAll('.prism-unit'));
    prismContents = prismUnits.map((u) => u.querySelector('.prism-unit-content'));
    ringCount = prismUnits.length;
    lastRenderedCarousel = -999;
    lastRenderedEntry = -999;
    lastRenderedMouseX = -999;
    lastRenderedMouseY = -999;
    lastRenderedVel = -999;

    unitHoverSprings = prismUnits.map(() => ({
      targetHover: 0,
      hover: { pos: 0, vel: 0 },
      targetRx: 0,
      targetRy: 0,
      targetDx: 0,
      targetDy: 0,
      rx: { pos: 0, vel: 0 },
      ry: { pos: 0, vel: 0 },
      dx: { pos: 0, vel: 0 },
      dy: { pos: 0, vel: 0 },
      active: false,
    }));

    prismUnits.forEach((unitEl, idx) => {
      if (typeof onCardStepClick === 'function') {
        unitEl.addEventListener('click', () => {
          onCardStepClick(idx, ringCount, wrapDelta);
        });
      }

      unitEl.addEventListener(
        'pointerenter',
        (e) => {
          if (e.pointerType === 'touch') return;
          const sp = unitHoverSprings[idx];
          if (!sp) return;
          sp.targetHover = 1;
          sp.active = true;
          anyHoverSpringActive = true;
          if (typeof onHoverActivity === 'function') onHoverActivity();
        },
        { passive: true }
      );

      unitEl.addEventListener(
        'pointermove',
        (e) => {
          if (e.pointerType === 'touch') return;
          const sp = unitHoverSprings[idx];
          if (!sp) return;
          const rect = unitEl.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
          const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
          sp.targetHover = 1;
          sp.targetRy = nx * 3.0;
          sp.targetRx = -ny * 2.4;
          sp.targetDx = nx * 4.2;
          sp.targetDy = ny * 3.0;
          sp.active = true;
          anyHoverSpringActive = true;
        },
        { passive: true }
      );

      unitEl.addEventListener(
        'pointerleave',
        () => {
          const sp = unitHoverSprings[idx];
          if (!sp) return;
          sp.targetHover = 0;
          sp.targetRx = 0;
          sp.targetRy = 0;
          sp.targetDx = 0;
          sp.targetDy = 0;
          sp.active = true;
          anyHoverSpringActive = true;
          if (typeof onHoverActivity === 'function') onHoverActivity();
        },
        { passive: true }
      );
    });
  }

  function stepHoverSpring(dt) {
    if (!unitHoverSprings.length) return false;
    const clampedDt = Math.min(0.025, dt);
    const stiffness = 68.0;
    const damping = 11.2;
    let stillMoving = false;

    for (let i = 0; i < unitHoverSprings.length; i++) {
      const sp = unitHoverSprings[i];
      if (!sp.active && sp.targetHover === 0) continue;

      const m1 = stepSoftSpring(sp.hover, sp.targetHover, stiffness, damping, clampedDt);
      const m2 = stepSoftSpring(sp.rx, sp.targetRx, stiffness, damping, clampedDt);
      const m3 = stepSoftSpring(sp.ry, sp.targetRy, stiffness, damping, clampedDt);
      const m4 = stepSoftSpring(sp.dx, sp.targetDx, stiffness, damping, clampedDt);
      const m5 = stepSoftSpring(sp.dy, sp.targetDy, stiffness, damping, clampedDt);

      sp.active = m1 || m2 || m3 || m4 || m5;
      if (sp.active) stillMoving = true;
    }

    anyHoverSpringActive = stillMoving;
    return stillMoving;
  }

  function render(
    entryProg,
    carouselPos,
    mouseX = 0,
    mouseY = 0,
    floatPhase = 0,
    carouselVelocity = 0,
    force = false
  ) {
    if (!prismUnits.length) return;

    const carouselDelta = Math.abs(carouselPos - lastRenderedCarousel);
    const entryDelta = Math.abs(entryProg - lastRenderedEntry);
    const mouseDelta =
      Math.abs(mouseX - lastRenderedMouseX) + Math.abs(mouseY - lastRenderedMouseY);
    const velDelta = Math.abs(carouselVelocity - lastRenderedVel);

    if (
      !force &&
      !anyHoverSpringActive &&
      carouselDelta <= 0.00004 &&
      entryDelta <= 0.00004 &&
      mouseDelta <= 0.0002 &&
      velDelta <= 0.001
    ) {
      return;
    }

    lastRenderedCarousel = carouselPos;
    lastRenderedEntry = entryProg;
    lastRenderedMouseX = mouseX;
    lastRenderedMouseY = mouseY;
    lastRenderedVel = carouselVelocity;

    const easedEntry = smootherstep01(entryProg);
    const entryRem = 1 - easedEntry;
    const entryVisibilityFactor = Math.min(1, entryProg * 2.2);

    // Pure GPU velocity stretch & tilt (no DOM filter:blur mutation = zero Safari repaint lag)
    const absCarouselVel = Math.abs(carouselVelocity);
    const clampedVel = Math.max(-4.5, Math.min(4.5, carouselVelocity));
    const motionStretchX = 1 + Math.min(0.042, absCarouselVel * 0.011);

    for (let i = 0; i < prismUnits.length; i++) {
      const d = wrapDelta(i - carouselPos, ringCount);
      const unit = prismUnits[i];

      if (Math.abs(d) >= 3.98 || entryVisibilityFactor <= 0.002) {
        if (unit.style.visibility !== 'hidden') {
          unit.style.visibility = 'hidden';
          unit.style.pointerEvents = 'none';
        }
        continue;
      }

      if (unit.style.visibility !== 'visible') {
        unit.style.visibility = 'visible';
        unit.style.pointerEvents = 'auto';
      }

      const pose = samplePrismSlotPose(d);
      const sp = unitHoverSprings[i];

      const sideBlend = Math.tanh(d * 2.4);
      const centerBlend = Math.exp(-d * d * 4.5);
      const sideSliceFactor = 1 - centerBlend;
      const entryDx = sideBlend * (340 + Math.abs(d) * 65) * entryRem;
      const entryDy = centerBlend * 44 * entryRem;

      const hPos = sp ? sp.hover.pos : 0;
      const hRx = sp ? sp.rx.pos : 0;
      const hRy = sp ? sp.ry.pos : 0;
      const hDx = sp ? sp.dx.pos : 0;
      const hDy = sp ? sp.dy.pos : 0;

      const floatY = Math.sin(floatPhase * 1.3 + i * 0.7) * 1.8 * centerBlend * easedEntry;
      const springX =
        hDx * (0.85 * centerBlend + 0.45 * sideSliceFactor) -
        Math.sign(d || 0) * hPos * 4.2 * sideSliceFactor;
      const springY =
        -3.2 * hPos * centerBlend -
        2.2 * hPos * sideSliceFactor +
        hDy * (0.75 * centerBlend + 0.35 * sideSliceFactor);
      const springZ = 8.5 * hPos * centerBlend + 5.5 * hPos * sideSliceFactor;

      const springRy =
        hRy * centerBlend +
        (d < 0 ? 3.2 : -3.2) * hPos * sideSliceFactor +
        mouseX * 1.8 * centerBlend * easedEntry;
      const springRx =
        hRx * (0.85 * centerBlend + 0.35 * sideSliceFactor) -
        mouseY * 1.4 * centerBlend * easedEntry;

      const hoverScaleX = 1 + 0.008 * hPos * centerBlend + 0.022 * hPos * sideSliceFactor;
      const hoverScaleY = 1 + 0.008 * hPos * centerBlend + 0.012 * hPos * sideSliceFactor;

      const finalX = pose.x + entryDx + springX + mouseX * 2.4 * centerBlend * easedEntry;
      const finalY = entryDy + floatY + springY + mouseY * 1.8 * centerBlend * easedEntry;
      const finalZ = springZ;
      const finalSx = pose.sx * (0.78 + 0.22 * easedEntry) * hoverScaleX * motionStretchX;
      const finalSy = pose.sy * (0.86 + 0.14 * easedEntry) * hoverScaleY;
      const finalRy = pose.ry + springRy - clampedVel * 1.4 * centerBlend;
      const finalRx = springRx;
      const finalOp = pose.cardOp * entryVisibilityFactor;

      const zIndex = Math.round(40 - Math.abs(d) * 6);

      unit.style.zIndex = String(zIndex);
      unit.style.opacity = finalOp.toFixed(3);
      unit.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, ${finalZ.toFixed(2)}px) rotateY(${finalRy.toFixed(2)}deg) rotateX(${finalRx.toFixed(2)}deg) scale3d(${finalSx.toFixed(4)}, ${finalSy.toFixed(4)}, 1)`;

      const content = prismContents[i];
      if (content) {
        if (pose.uiOp <= 0.004) {
          if (content.style.visibility !== 'hidden') {
            content.style.visibility = 'hidden';
            content.style.opacity = '0';
          }
        } else {
          if (content.style.visibility !== 'visible') {
            content.style.visibility = 'visible';
          }
          content.style.opacity = pose.uiOp.toFixed(3);
        }
      }
    }

    if (prismCenterGlow) {
      const normPos = ((carouselPos % cardCount) + cardCount) % cardCount;
      const idx0 = Math.floor(normPos) % cardCount;
      const idx1 = (idx0 + 1) % cardCount;
      const frac = smootherstep01(normPos - Math.floor(normPos));

      const c0 = CARD_AMBIENT_RGB[idx0];
      const c1 = CARD_AMBIENT_RGB[idx1];

      const r = Math.round(c0[0] + (c1[0] - c0[0]) * frac);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * frac);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * frac);

      prismCenterGlow.style.setProperty('--center-glow-rgba', `rgba(${r}, ${g}, ${b}, 0.24)`);
      prismCenterGlow.style.setProperty('--center-glow-Soft', `rgba(${r}, ${g}, ${b}, 0.09)`);
      prismCenterGlow.style.opacity = easedEntry.toFixed(3);
      const glowX = mouseX * 12 * easedEntry;
      const glowY = mouseY * 9 * easedEntry;
      prismCenterGlow.style.transform = `translate3d(calc(-44% + ${glowX.toFixed(1)}px), calc(-50% + ${glowY.toFixed(1)}px), 0)`;
    }
  }

  function getWrapper() {
    return featuresWrapper || document.getElementById('featuresScrollWrapper');
  }

  function getCardCount() {
    return cardCount;
  }

  return {
    init,
    render,
    stepHoverSpring,
    shapeCarouselStep,
    getWrapper,
    getCardCount,
  };
})();
