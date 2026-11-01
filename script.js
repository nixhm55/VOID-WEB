/**
 * VOID Website — Ultra-Smooth 120fps Hero + Unified 7-Card 3D Perspective Fade Carousel
 * - Hero section preserved 100% intact
 * - Section 2:
 *   1. Scroll Entrance: Left cards glide in from left, Right cards glide in from right, Center card unfolds in middle.
 *   2. Continuous 3D Unfolding Carousel: All 7 cards are real 3D surfaces with clean left-cut and gradual right opacity fade,
 *      showing faint dummy UI previews when folded in the side stacks and unfolding to 100% in the center!
 *   3. Subtle Center-Only Ambient Lighting: Smoothly interpolates RGB glow directly behind the center card.
 */

(() => {
  const heroWrapper = document.getElementById('heroScrollWrapper');
  const featuresWrapper = document.getElementById('featuresScrollWrapper');

  const cdItems = Array.from(document.querySelectorAll('.cd-item'));
  const cdArts = cdItems.map((item) => item.querySelector('.cd-art'));

  const prismUnits = Array.from(document.querySelectorAll('.prism-unit'));
  const prismContents = prismUnits.map((u) => u.querySelector('.prism-unit-content'));
  const prismCenterGlow = document.getElementById('prismCenterGlow');

  if (!heroWrapper || cdItems.length === 0) return;

  /**
   * 1. Ayla-Style Single-Symbol Kinetic "void" Wordmark Animation (Untouched)
   */
  function initVoidKineticWordmark() {
    const slotV = document.getElementById('vkSlotV');
    const slotO = document.getElementById('vkSlotO');
    const slotI = document.getElementById('vkSlotI');
    const slotD = document.getElementById('vkSlotD');

    const charV = document.getElementById('vkCharV');
    const charO = document.getElementById('vkCharO');
    const charI = document.getElementById('vkCharI');
    const charD = document.getElementById('vkCharD');

    const symPlay = document.getElementById('vkSymPlay');
    const symPause = document.getElementById('vkSymPause');
    const symGraph = document.getElementById('vkSymGraph');
    const symPrev = document.getElementById('vkSymPrev');

    if (
      !slotV || !slotO || !slotI || !slotD ||
      !charV || !charO || !charI || !charD ||
      !symPlay || !symPause || !symGraph || !symPrev
    ) {
      return;
    }

    const allItems = [
      charV, charO, charI, charD,
      symPlay, symPause, symGraph, symPrev,
    ];

    const WIDTHS = {
      v: 9.2,
      o: 9.6,
      i: 5.0,
      d: 10.0,
      play: 10.0,
      pause: 9.2,
      graph: 10.6,
      prev: 10.6,
    };

    function computeSlotCenters(w0, w1, w2, w3, g01, g12, g23) {
      const total = w0 + g01 + w1 + g12 + w2 + g23 + w3;
      const start = -total * 0.5;
      const c0 = start + w0 * 0.5;
      const c1 = start + w0 + g01 + w1 * 0.5;
      const c2 = start + w0 + g01 + w1 + g12 + w2 * 0.5;
      const c3 = start + w0 + g01 + w1 + g12 + w2 + g23 + w3 * 0.5;
      return [c0, c1, c2, c3];
    }

    const STATES = [
      {
        active: [charV, charO, charI, charD],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.o, WIDTHS.i, WIDTHS.d, -0.5, -0.4, -0.5),
        holdMs: 1450,
      },
      {
        active: [charV, symPlay, charI, charD],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.play, WIDTHS.i, WIDTHS.d, 0.9, 0.8, -0.5),
        holdMs: 1200,
      },
      {
        active: [charV, charO, charI, symPause],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.o, WIDTHS.i, WIDTHS.pause, -0.5, -0.4, 0.9),
        holdMs: 1200,
      },
      {
        active: [charV, charO, symGraph, charD],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.o, WIDTHS.graph, WIDTHS.d, -0.5, 0.9, 0.7),
        holdMs: 1200,
      },
      {
        active: [charV, symPrev, charI, charD],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.prev, WIDTHS.i, WIDTHS.d, 0.9, 0.9, -0.5),
        holdMs: 1200,
      },
    ];

    function applyState(st) {
      const [xV, xO, xI, xD] = st.centers;
      slotV.style.transform = `translate3d(${xV.toFixed(2)}px, 0px, 0px)`;
      slotO.style.transform = `translate3d(${xO.toFixed(2)}px, 0px, 0px)`;
      slotI.style.transform = `translate3d(${xI.toFixed(2)}px, 0px, 0px)`;
      slotD.style.transform = `translate3d(${xD.toFixed(2)}px, 0px, 0px)`;

      for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        if (st.active.includes(item)) {
          item.classList.add('is-active');
        } else {
          item.classList.remove('is-active');
        }
      }
    }

    let step = 0;
    applyState(STATES[step]);

    function scheduleNext() {
      const delay = STATES[step].holdMs;
      window.setTimeout(() => {
        step = (step + 1) % STATES.length;
        applyState(STATES[step]);
        scheduleNext();
      }, delay);
    }

    scheduleNext();
  }

  initVoidKineticWordmark();

  /**
   * 2. Section 2: Unified 7-Card 3D Perspective Fade Carousel Geometry & Ambient RGB Palette
   */
  const CARD_COUNT = prismUnits.length || 7;

  // Ambient center light RGB per card (subtle glow directly behind the Center Card)
  const CARD_AMBIENT_RGB = [
    [242, 88, 22],   // Card 0: Flame Orange
    [188, 38, 112],  // Card 1: Deep Violet-Magenta
    [20, 152, 232],  // Card 2: Cobalt Blue-Cyan
    [232, 62, 30],   // Card 3: Crimson Red-Coral
    [108, 42, 224],  // Card 4: Electric Indigo-Violet
    [210, 56, 82],   // Card 5: Amethyst Rose-Orange
    [244, 108, 24],  // Card 6: Sunset Amber-Orange
  ];

  /**
   * Keyframe anchors for a card's relative slot offset d = cardIndex - carouselPos in [-3.5, +3.5].
   * Notice the intermediate anchors at d = -0.52 and d = +0.52:
   * - At d = +1.0 (R1 slice): x = +358px, scaleX = 0.25, scaleY = 0.68, rotateY = -44deg
   * - At d = +0.52 (Mid-flight blade, matching Frame 00:05 & 00:08 of reference video!):
   *   The incoming card detaches from the right stack as a narrow 3D perspective slice (scaleX = 0.20, rotateY = -50deg)
   *   at x = +168px before unfolding to full width (scaleX = 1.0, rotateY = 0deg) at d = 0.0!
   */
  const PRISM_SLOT_ANCHORS = [
    { d: -3.5, x: -575, sx: 0.21, sy: 0.60, ry: -46, uiOp: 0.12, cardOp: 0.0 },
    { d: -3.0, x: -502, sx: 0.24, sy: 0.63, ry: -44, uiOp: 0.14, cardOp: 0.92 },
    { d: -2.0, x: -430, sx: 0.25, sy: 0.66, ry: -44, uiOp: 0.16, cardOp: 0.96 },
    { d: -1.0, x: -355, sx: 0.26, sy: 0.69, ry: -44, uiOp: 0.20, cardOp: 1.0 },
    { d: -0.48, x: -115, sx: 0.64, sy: 0.88, ry: -24, uiOp: 0.38, cardOp: 1.0 },
    { d:  0.0, x:    0, sx: 1.00, sy: 1.00, ry:   0, uiOp: 1.00, cardOp: 1.0 },
    { d:  0.52, x:  172, sx: 0.21, sy: 0.76, ry: -50, uiOp: 0.22, cardOp: 1.0 },
    { d:  1.0, x:  355, sx: 0.26, sy: 0.69, ry: -44, uiOp: 0.20, cardOp: 1.0 },
    { d:  2.0, x:  430, sx: 0.25, sy: 0.66, ry: -44, uiOp: 0.16, cardOp: 0.96 },
    { d:  3.0, x:  502, sx: 0.24, sy: 0.63, ry: -44, uiOp: 0.14, cardOp: 0.92 },
    { d:  3.5, x:  575, sx: 0.21, sy: 0.60, ry: -46, uiOp: 0.12, cardOp: 0.0 },
  ];

  function samplePrismSlotPose(d) {
    const minD = PRISM_SLOT_ANCHORS[0].d;
    const maxD = PRISM_SLOT_ANCHORS[PRISM_SLOT_ANCHORS.length - 1].d;
    const clamped = d < minD ? minD : d > maxD ? maxD : d;

    for (let i = 0; i < PRISM_SLOT_ANCHORS.length - 1; i++) {
      const a = PRISM_SLOT_ANCHORS[i];
      const b = PRISM_SLOT_ANCHORS[i + 1];
      if (clamped >= a.d && clamped <= b.d) {
        const span = b.d - a.d || 1;
        const rawT = (clamped - a.d) / span;
        // Smoothstep interpolation per segment for fluid unfolding
        const t = rawT * rawT * (3 - 2 * rawT);
        return {
          x: a.x + (b.x - a.x) * t,
          sx: a.sx + (b.sx - a.sx) * t,
          sy: a.sy + (b.sy - a.sy) * t,
          ry: a.ry + (b.ry - a.ry) * t,
          uiOp: a.uiOp + (b.uiOp - a.uiOp) * t,
          cardOp: a.cardOp + (b.cardOp - a.cardOp) * t,
        };
      }
    }

    return PRISM_SLOT_ANCHORS[5];
  }

  function wrapDelta(diff, total) {
    let d = ((diff % total) + total) % total;
    if (d > total * 0.5) d -= total;
    return d;
  }

  /**
   * 3. Continuous Sub-Pixel Float64 Spline Engine for Hero CDs (Untouched)
   */
  const PATH_ANCHORS = [
    { u: -3.0, x: -90.0, y: 98.0, scale: 0.50, rot: -210 },
    { u: -2.0, x: -62.0, y: 86.0, scale: 0.56, rot: -160 },
    { u: -1.0, x: -34.0, y: 76.0, scale: 0.62, rot: -110 },
    { u: 0.0,  x: -7.5,  y: 66.8, scale: 0.71, rot: -42 },
    { u: 1.0,  x: 21.2,  y: 60.8, scale: 0.81, rot: -16 },
    { u: 2.0,  x: 51.5,  y: 50.8, scale: 1.00, rot: 0 },
    { u: 3.0,  x: 88.2,  y: 29.8, scale: 0.95, rot: 22 },
    { u: 4.0,  x: 124.5, y: 7.5,  scale: 0.90, rot: 58 },
  ];

  const MAX_SHIFT_UNITS = 2.6;
  const HERO_SMOOTH_SPEED = 11.5;
  const PRISM_ENTRY_SPEED = 8.5;
  const PRISM_CAROUSEL_SPEED = 7.2;

  function evaluateSplineExact(u) {
    const minU = PATH_ANCHORS[0].u;
    const maxU = PATH_ANCHORS[PATH_ANCHORS.length - 1].u;
    const clampedU = u < minU ? minU : u > maxU ? maxU : u;

    let idx = 0;
    for (let i = 0; i < PATH_ANCHORS.length - 1; i++) {
      if (clampedU >= PATH_ANCHORS[i].u && clampedU <= PATH_ANCHORS[i + 1].u) {
        idx = i;
        break;
      }
    }

    const p0 = PATH_ANCHORS[idx > 0 ? idx - 1 : 0];
    const p1 = PATH_ANCHORS[idx];
    const p2 = PATH_ANCHORS[idx + 1];
    const p3 = PATH_ANCHORS[idx + 2 < PATH_ANCHORS.length ? idx + 2 : PATH_ANCHORS.length - 1];

    const t = (clampedU - p1.u) / (p2.u - p1.u || 1);
    const t2 = t * t;
    const t3 = t2 * t;

    const c0 = -0.5 * t3 + t2 - 0.5 * t;
    const c1 = 1.5 * t3 - 2.5 * t2 + 1.0;
    const c2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
    const c3 = 0.5 * t3 - 0.5 * t2;

    return {
      x: p0.x * c0 + p1.x * c1 + p2.x * c2 + p3.x * c3,
      y: p0.y * c0 + p1.y * c1 + p2.y * c2 + p3.y * c3,
      scale: p0.scale * c0 + p1.scale * c1 + p2.scale * c2 + p3.scale * c3,
      rot: p0.rot * c0 + p1.rot * c1 + p2.rot * c2 + p3.rot * c3,
    };
  }

  let heroTopDoc = 0;
  let heroStickyDistance = 1;
  let featuresTopDoc = 0;
  let featuresStickyDistance = 1;
  let viewportHeight = window.innerHeight || 800;

  function cacheLayoutMetrics() {
    viewportHeight = window.innerHeight || 800;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    const heroRect = heroWrapper.getBoundingClientRect();
    heroTopDoc = heroRect.top + scrollY;
    heroStickyDistance = Math.max(1, heroWrapper.offsetHeight - viewportHeight);

    if (featuresWrapper) {
      const featRect = featuresWrapper.getBoundingClientRect();
      featuresTopDoc = featRect.top + scrollY;
      featuresStickyDistance = Math.max(1, featuresWrapper.offsetHeight - viewportHeight);
    }
  }

  let targetShift = 0;
  let currentShift = 0;

  // Section 2 Scroll Entrance Progress [0 -> 1] (slides cards in from left & right)
  let targetEntry = 0;
  let currentEntry = 0;

  // Section 2 Carousel Card Index Progress [0 -> 6] (steps cleanly through all 7 cards)
  let targetCarousel = 0;
  let currentCarousel = 0;
  let manualClickOffset = 0;

  let rafId = null;
  let lastFrameTime = 0;

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function updateTargetsFromScroll() {
    const scrollY = window.scrollY || window.pageYOffset || 0;

    // A. Hero CD scroll progress
    const scrolledHero = Math.max(0, scrollY - heroTopDoc);
    let shift;
    if (scrolledHero <= heroStickyDistance) {
      shift = scrolledHero / heroStickyDistance;
    } else {
      shift = 1.0 + ((scrolledHero - heroStickyDistance) / heroStickyDistance) * 0.42;
    }
    targetShift = shift < 0 ? 0 : shift > MAX_SHIFT_UNITS ? MAX_SHIFT_UNITS : shift;

    // B. Section 2 Entrance (Left & Right glide-in) + 7-Card Unfolding Carousel
    if (featuresWrapper) {
      // Entrance starts as Section 2 comes into view and locks right as Section 2 reaches top: 0
      const entryStart = featuresTopDoc - viewportHeight * 0.78;
      const entryEnd = featuresTopDoc + viewportHeight * 0.08;
      targetEntry = clamp01((scrollY - entryStart) / Math.max(1, entryEnd - entryStart));

      // Once Section 2 is sticky, scrolling drives the 7 cards one by one (snapped to clean card steps so every transition unfolds completely like the video)
      const carouselScroll = Math.max(0, scrollY - entryEnd);
      const carouselSpan = Math.max(1, featuresStickyDistance - viewportHeight * 0.12);
      const rawStep = (carouselScroll / carouselSpan) * (CARD_COUNT - 1);
      const snappedStep = Math.round(Math.max(0, Math.min(CARD_COUNT - 1, rawStep)));
      targetCarousel = snappedStep + manualClickOffset;
    }
  }

  // Clicking any side slice smoothly advances or rewinds to that card!
  prismUnits.forEach((unitEl, idx) => {
    unitEl.addEventListener('click', () => {
      const d = wrapDelta(idx - Math.round(currentCarousel), CARD_COUNT);
      if (d !== 0) {
        manualClickOffset += d;
        targetCarousel += d;
        if (rafId === null) {
          lastFrameTime = 0;
          rafId = window.requestAnimationFrame(tick);
        }
      }
    });
  });

  function renderFrame(shift, entryProg, carouselPos) {
    // 1. Render Hero CDs
    for (let i = 0; i < cdItems.length; i++) {
      const pose = evaluateSplineExact(i - shift);

      cdItems[i].style.transform = `translate3d(${pose.x.toFixed(4)}vw, ${pose.y.toFixed(4)}vh, 0px) scale3d(${pose.scale.toFixed(5)}, ${pose.scale.toFixed(5)}, 1)`;

      const art = cdArts[i];
      if (art) {
        art.style.transform = `rotateZ(${pose.rot.toFixed(4)}deg) translateZ(0)`;
      }
    }

    // 2. Render Section 2: 7-Card 3D Perspective Fade Carousel
    if (prismUnits.length > 0) {
      const invEntry = 1 - entryProg;
      const easedEntry = 1 - invEntry * invEntry * invEntry;
      const entryRem = 1 - easedEntry;

      for (let i = 0; i < prismUnits.length; i++) {
        const d = wrapDelta(i - carouselPos, CARD_COUNT);
        const pose = samplePrismSlotPose(d);

        // Side-entry animation: left stack slides in from left, right stack slides in from right
        let entryDx = 0;
        let entryDy = 0;
        if (d < -0.25) {
          entryDx = (-360 - Math.abs(d) * 75) * entryRem;
        } else if (d > 0.25) {
          entryDx = (360 + Math.abs(d) * 75) * entryRem;
        } else {
          entryDy = 55 * entryRem;
        }

        const finalX = pose.x + entryDx;
        const finalY = entryDy;
        const finalSx = pose.sx * (0.72 + 0.28 * easedEntry);
        const finalSy = pose.sy * (0.85 + 0.15 * easedEntry);
        const finalRy = pose.ry;
        const finalOp = pose.cardOp * Math.min(1, entryProg * 2.2);

        // Stacking order: Center card highest (30), inner slices (20), outer slices (10)
        const zIndex = Math.round(30 - Math.abs(d) * 5);

        const unit = prismUnits[i];
        unit.style.zIndex = String(zIndex);
        unit.style.opacity = finalOp.toFixed(3);
        unit.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0px) rotateY(${finalRy.toFixed(2)}deg) scale3d(${finalSx.toFixed(4)}, ${finalSy.toFixed(4)}, 1)`;

        const content = prismContents[i];
        if (content) {
          content.style.opacity = pose.uiOp.toFixed(3);
        }
      }

      // 3. Interpolate Center-Only Ambient Lighting Color Smoothly
      if (prismCenterGlow) {
        const normPos = ((carouselPos % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;
        const idx0 = Math.floor(normPos) % CARD_COUNT;
        const idx1 = (idx0 + 1) % CARD_COUNT;
        const frac = normPos - Math.floor(normPos);

        const c0 = CARD_AMBIENT_RGB[idx0];
        const c1 = CARD_AMBIENT_RGB[idx1];

        const r = Math.round(c0[0] + (c1[0] - c0[0]) * frac);
        const g = Math.round(c0[1] + (c1[1] - c0[1]) * frac);
        const b = Math.round(c0[2] + (c1[2] - c0[2]) * frac);

        prismCenterGlow.style.setProperty('--center-glow-rgba', `rgba(${r}, ${g}, ${b}, 0.22)`);
        prismCenterGlow.style.setProperty('--center-glow-Soft', `rgba(${r}, ${g}, ${b}, 0.08)`);
        prismCenterGlow.style.opacity = easedEntry.toFixed(3);
      }
    }
  }

  function tick(now) {
    const dt = lastFrameTime ? Math.min(0.05, (now - lastFrameTime) * 0.001) : 0.016;
    lastFrameTime = now;

    const diffShift = targetShift - currentShift;
    const diffEntry = targetEntry - currentEntry;
    const diffCarousel = targetCarousel - currentCarousel;

    if (
      Math.abs(diffShift) > 0.00002 ||
      Math.abs(diffEntry) > 0.00005 ||
      Math.abs(diffCarousel) > 0.0002
    ) {
      const alphaHero = 1.0 - Math.exp(-HERO_SMOOTH_SPEED * dt);
      const alphaEntry = 1.0 - Math.exp(-PRISM_ENTRY_SPEED * dt);
      const alphaCarousel = 1.0 - Math.exp(-PRISM_CAROUSEL_SPEED * dt);

      currentShift += diffShift * alphaHero;
      currentEntry += diffEntry * alphaEntry;
      currentCarousel += diffCarousel * alphaCarousel;

      renderFrame(currentShift, currentEntry, currentCarousel);
      rafId = window.requestAnimationFrame(tick);
    } else {
      currentShift = targetShift;
      currentEntry = targetEntry;
      currentCarousel = targetCarousel;
      renderFrame(currentShift, currentEntry, currentCarousel);
      rafId = null;
      lastFrameTime = 0;
    }
  }

  function onScroll() {
    updateTargetsFromScroll();
    if (rafId === null) {
      lastFrameTime = 0;
      rafId = window.requestAnimationFrame(tick);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener(
    'resize',
    () => {
      cacheLayoutMetrics();
      updateTargetsFromScroll();
      currentShift = targetShift;
      currentEntry = targetEntry;
      currentCarousel = targetCarousel;
      renderFrame(currentShift, currentEntry, currentCarousel);
    },
    { passive: true }
  );

  cacheLayoutMetrics();
  updateTargetsFromScroll();
  currentShift = targetShift;
  currentEntry = targetEntry;
  currentCarousel = targetCarousel;
  renderFrame(currentShift, currentEntry, currentCarousel);

  function optimizeAndUpgradeTextures() {
    cdArts.forEach((img) => {
      if (img && typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });

    const artImages = Array.from(document.querySelectorAll('.cd-art[data-itunes-id]'));

    artImages.forEach((img) => {
      const itunesId = img.getAttribute('data-itunes-id');
      if (!itunesId) return;

      const cacheKey = `void_art_1000_${itunesId}`;
      try {
        const cachedUrl = sessionStorage.getItem(cacheKey);
        if (cachedUrl) {
          img.src = cachedUrl;
          return;
        }
      } catch (_) {}

      const callbackName = `voidArtCb_${itunesId}_${Math.floor(Math.random() * 1e6)}`;
      const script = document.createElement('script');

      window[callbackName] = (data) => {
        try {
          if (data && data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
            const retinaUrl = data.results[0].artworkUrl100.replace(
              '100x100bb.jpg',
              '1000x1000bb.jpg'
            );
            try {
              sessionStorage.setItem(cacheKey, retinaUrl);
            } catch (_) {}
            const preload = new Image();
            preload.decoding = 'async';
            preload.src = retinaUrl;
            if (typeof preload.decode === 'function') {
              preload
                .decode()
                .then(() => {
                  img.src = retinaUrl;
                })
                .catch(() => {});
            } else {
              preload.onload = () => {
                img.src = retinaUrl;
              };
            }
          }
        } finally {
          delete window[callbackName];
          script.remove();
        }
      };

      script.onerror = () => {
        delete window[callbackName];
        script.remove();
      };

      script.src = `https://itunes.apple.com/lookup?id=${encodeURIComponent(itunesId)}&callback=${callbackName}`;
      document.body.appendChild(script);
    });
  }

  if (document.readyState === 'complete') {
    optimizeAndUpgradeTextures();
  } else {
    window.addEventListener('load', optimizeAndUpgradeTextures, { once: true });
  }
})();
