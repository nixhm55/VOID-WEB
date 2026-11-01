/**
 * VOID MOBILE — PAGE 2: 3D CYLINDRICAL RIBBON RING MODULE
 * (mobile-pages/02-ring/page2-ring.js)
 * - Updates `--mobile-ring-scale` ONLY on init and resize so `#cylinderTiltRig`
 *   never undergoes double transform mutations during scroll frames!
 */

(() => {
  const desktopRing = window.VoidPage2Ring;
  if (!desktopRing) return;

  let tiltRig = null;
  let cachedIsMobile = false;
  const BASE_RING_SPAN_PX = 1680;

  function updateMobileRingScaleOnResize() {
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    cachedIsMobile = vw <= 1024 || vh <= 600;
    if (!cachedIsMobile) return;

    if (!tiltRig) {
      tiltRig = document.getElementById('cylinderTiltRig');
    }
    if (!tiltRig) return;

    let scale;
    if (vh >= vw) {
      const targetWidth = vw * 0.84;
      scale = Math.max(0.11, Math.min(0.46, targetWidth / BASE_RING_SPAN_PX));
    } else {
      const targetWidth = Math.min(vw * 0.58, vh * 1.14);
      scale = Math.max(0.12, Math.min(0.50, targetWidth / BASE_RING_SPAN_PX));
    }
    tiltRig.style.setProperty('--mobile-ring-scale', scale.toFixed(4));
  }

  const origInit = desktopRing.init;
  const origRender = desktopRing.render;
  const origResize = desktopRing.resize;

  desktopRing.init = function (...args) {
    const res = origInit.apply(this, args);
    tiltRig = document.getElementById('cylinderTiltRig');
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
