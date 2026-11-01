/**
 * VOID MOBILE — PAGE 1: HERO SECTION MODULE (mobile-pages/01-hero/page1-hero.js)
 * - Caches viewport orientation/dimensions on resize for zero per-frame layout queries.
 * - Eliminates redundant per-frame DOM writes on `.press-quotes` and `.editorial-info`.
 * - Automatically syncs `script.js` layout metrics (`cacheLayoutMetrics`) via `ResizeObserver`
 *   whenever mobile CSS section heights apply so sticky scroll triggers are 100% exact.
 */

(() => {
  // 1. Activate mobile-pages stylesheets across all mobile & tablet portrait/landscape viewports
  const MOBILE_MEDIA_QUERY = '(max-width: 1024px), (max-height: 600px)';
  document.querySelectorAll('link[href*="mobile-pages/"]').forEach((link) => {
    link.setAttribute('media', MOBILE_MEDIA_QUERY);
  });

  // 2. Enforce light color-scheme meta so mobile browsers never force-invert the #f1f1ef background
  if (!document.querySelector('meta[name="color-scheme"]')) {
    const meta = document.createElement('meta');
    meta.name = 'color-scheme';
    meta.content = 'only light';
    document.head.appendChild(meta);
  }

  let cachedIsPortrait = false;
  let cachedIsMobile = false;

  function updateViewportFlags() {
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    cachedIsMobile = vw <= 1024 || vh <= 600;
    cachedIsPortrait = vh >= vw && vw <= 1024;
  }

  updateViewportFlags();
  window.addEventListener('resize', updateViewportFlags, { passive: true });

  // 3. Ensure `script.js` recalculates exact section offsets (`heroTopDoc`, `ringTopDoc`,
  //    `featuresTopDoc`, `page3TopDoc`) as soon as mobile CSS heights apply.
  let lastBodyHeight = 0;
  function syncLayoutMetricsWithScript() {
    updateViewportFlags();
    window.dispatchEvent(new Event('resize'));
  }

  if ('ResizeObserver' in window && document.body) {
    const ro = new ResizeObserver(() => {
      const h = document.body.offsetHeight;
      if (Math.abs(h - lastBodyHeight) > 4) {
        lastBodyHeight = h;
        syncLayoutMetricsWithScript();
      }
    });
    ro.observe(document.body);
  }

  window.addEventListener('load', () => {
    syncLayoutMetricsWithScript();
    setTimeout(syncLayoutMetricsWithScript, 120);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(syncLayoutMetricsWithScript, 80);
  });

  const desktopHero = window.VoidPage1Hero;
  if (!desktopHero) return;

  let cdItems = [];
  let cdArts = [];
  let pressQuotesEl = null;
  let editorialInfoEl = null;
  let lastMobileShift = -999;
  let lastOrientationPortrait = null;

  // Portrait spline anchors — centered cleanly between top-left editorial info and bottom quotes
  const PORTRAIT_PATH_ANCHORS = [
    { u: -3.0, x: -84.0, y: 92.0, scale: 0.54, rot: -210 },
    { u: -2.0, x: -56.0, y: 82.0, scale: 0.60, rot: -160 },
    { u: -1.0, x: -29.0, y: 73.5, scale: 0.67, rot: -110 },
    { u: 0.0,  x: -3.5,  y: 65.5, scale: 0.75, rot: -42 },
    { u: 1.0,  x: 23.0,  y: 58.5, scale: 0.85, rot: -16 },
    { u: 2.0,  x: 50.0,  y: 49.5, scale: 1.00, rot: 0 },
    { u: 3.0,  x: 83.5,  y: 33.0, scale: 0.94, rot: 22 },
    { u: 4.0,  x: 118.0, y: 14.0, scale: 0.88, rot: 58 },
  ];

  function evaluatePortraitSpline(u) {
    const minU = PORTRAIT_PATH_ANCHORS[0].u;
    const maxU = PORTRAIT_PATH_ANCHORS[PORTRAIT_PATH_ANCHORS.length - 1].u;
    const clampedU = u < minU ? minU : u > maxU ? maxU : u;

    let idx = 0;
    for (let i = 0; i < PORTRAIT_PATH_ANCHORS.length - 1; i++) {
      if (clampedU >= PORTRAIT_PATH_ANCHORS[i].u && clampedU <= PORTRAIT_PATH_ANCHORS[i + 1].u) {
        idx = i;
        break;
      }
    }

    const p0 = PORTRAIT_PATH_ANCHORS[idx > 0 ? idx - 1 : 0];
    const p1 = PORTRAIT_PATH_ANCHORS[idx];
    const p2 = PORTRAIT_PATH_ANCHORS[idx + 1];
    const p3 =
      PORTRAIT_PATH_ANCHORS[
        idx + 2 < PORTRAIT_PATH_ANCHORS.length ? idx + 2 : PORTRAIT_PATH_ANCHORS.length - 1
      ];

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

  const origInit = desktopHero.init;
  const origRender = desktopHero.render;

  desktopHero.init = function (...args) {
    const res = origInit.apply(this, args);
    cdItems = Array.from(document.querySelectorAll('.cd-item'));
    cdArts = cdItems.map((item) => item.querySelector('.cd-art'));
    pressQuotesEl = document.querySelector('.press-quotes');
    editorialInfoEl = document.querySelector('.editorial-info');
    lastMobileShift = -999;
    updateViewportFlags();

    // Dispose redundant background Three.js particle layer on mobile/tablet for zero GPU lag
    if (cachedIsMobile && typeof desktopHero.dispose === 'function') {
      desktopHero.dispose();
    }
    return res;
  };

  desktopHero.render = function (
    shift,
    mouseX = 0,
    mouseY = 0,
    floatPhase = 0,
    shiftVelocity = 0,
    force = false
  ) {
    const portrait = cachedIsPortrait;
    if (portrait !== lastOrientationPortrait) {
      lastOrientationPortrait = portrait;
      force = true;
      if (portrait) {
        if (pressQuotesEl) pressQuotesEl.style.transform = 'translate3d(-50%, 0px, 0px)';
        if (editorialInfoEl) editorialInfoEl.style.transform = 'translate3d(0px, 0px, 0px)';
      }
    }

    // In Landscape mode (phone/tablet landscape) OR Desktop (> 1024px), run the exact Laptop/Desktop spline!
    if (!portrait) {
      return origRender.call(
        this,
        shift,
        cachedIsMobile ? 0 : mouseX,
        cachedIsMobile ? 0 : mouseY,
        floatPhase,
        shiftVelocity,
        force
      );
    }

    if (!cdItems.length) return;
    if (!force && Math.abs(shift - lastMobileShift) <= 0.00003 && Math.abs(shiftVelocity) <= 0.0015) {
      return;
    }
    lastMobileShift = shift;

    for (let i = 0; i < cdItems.length; i++) {
      const u = i - shift;
      const pose = evaluatePortraitSpline(u);
      const focusWeight = Math.exp(-Math.pow(u - 2.0, 2) * 0.42);
      const depthFactor = 0.35 + 0.65 * focusWeight;
      const floatWaveY = Math.sin(floatPhase * 1.35 + i * 1.15) * (0.16 * depthFactor);

      const finalX = pose.x;
      const finalY = pose.y + floatWaveY;

      cdItems[i].style.transform = `translate3d(${finalX.toFixed(3)}vw, ${finalY.toFixed(3)}vh, 0px) scale3d(${pose.scale.toFixed(4)}, ${pose.scale.toFixed(4)}, 1)`;

      const art = cdArts[i];
      if (art) {
        const microRot = pose.rot - shiftVelocity * 3.0;
        art.style.transform = `rotateZ(${microRot.toFixed(3)}deg) translateZ(0)`;
      }
    }
  };
})();
