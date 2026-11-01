/**
 * VOID MOBILE — PAGE 2: 3D CYLINDRICAL RIBBON RING MODULE
 * (mobile-pages/02-ring/page2-ring.js)
 * - Scales `.cylinder-ring-viewport` (`--mobile-ring-view-scale`) while preserving
 *   the exact Desktop 1280x800 3D perspective frustum (`scale3d(0.5, 0.5, 0.5)`)
 *   so the 3D cylinder renders with zero Z-fighting or strip gaps on mobile!
 */

(() => {
  const desktopRing = window.VoidPage2Ring;
  if (!desktopRing) return;

  let ringViewport = null;
  let cachedIsMobile = false;
  const DESKTOP_RING_VISUAL_SPAN_PX = 920;

  function updateMobileRingScaleOnResize() {
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    cachedIsMobile = vw <= 1024 || vh <= 600;
    if (!cachedIsMobile) return;

    if (!ringViewport) {
      ringViewport = document.getElementById('cylinderRingViewport');
    }
    if (!ringViewport) return;

    let viewScale;
    if (vh >= vw) {
      const targetWidth = vw * 0.86;
      viewScale = Math.max(0.24, Math.min(0.88, targetWidth / DESKTOP_RING_VISUAL_SPAN_PX));
    } else {
      const targetWidth = Math.min(vw * 0.62, vh * 1.18);
      viewScale = Math.max(0.28, Math.min(0.95, targetWidth / DESKTOP_RING_VISUAL_SPAN_PX));
    }
    ringViewport.style.setProperty('--mobile-ring-view-scale', viewScale.toFixed(4));
  }

  const origInit = desktopRing.init;
  const origRender = desktopRing.render;
  const origResize = desktopRing.resize;

  desktopRing.init = function (...args) {
    const res = origInit.apply(this, args);
    ringViewport = document.getElementById('cylinderRingViewport');
    updateMobileRingScaleOnResize();
    window.addEventListener('resize', updateMobileRingScaleOnResize, { passive: true });
    return res;
  };

  desktopRing.resize = function (...args) {
    const res = origResize ? origResize.apply(this, args) : undefined;
    updateMobileRingScaleOnResize();
    return res;
  };

  desktopRing.render = function (
    entryProg,
    dt = 0.016,
    scrollVel = 0,
    mouseX = 0,
    mouseY = 0,
    force = false
  ) {
    if (!cachedIsMobile) {
      return origRender.call(this, entryProg, dt, scrollVel, mouseX, mouseY, force);
    }
    origRender.call(this, entryProg, dt, scrollVel, 0, 0, force);
  };
})();
