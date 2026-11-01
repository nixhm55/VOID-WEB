/**
 * VOID MOBILE — PAGE 4: BUTTERFLY MACINTOSH SHOWCASE + 3D TRAIN DOWNLOAD PORTAL
 * (mobile-pages/03-showcase/page3-showcase.js)
 * - Caches viewport metrics on resize so zero layout queries happen during scroll frames.
 * - Only updates `#vpSpatialAssembly` transform when `origRender` actually mutates it,
 *   preventing redundant DOM style writes when idle.
 */

(() => {
  const desktopShowcase = window.VoidPage3Showcase;
  if (!desktopShowcase) return;

  let vpSpatialAssembly = null;
  const DESKTOP_WINDOW_WIDTH_PX = 860;
  const DESKTOP_WINDOW_HEIGHT_PX = 330;

  let cachedIsMobile = false;
  let cachedFitScale = 1.0;
  let lastScaledTransform = '';

  function updateCachedViewportMetrics() {
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    cachedIsMobile = vw <= 1024 || vh <= 600;

    if (vh >= vw) {
      const scaleW = (vw * 0.94) / DESKTOP_WINDOW_WIDTH_PX;
      const scaleH = (vh * 0.78) / DESKTOP_WINDOW_HEIGHT_PX;
      cachedFitScale = Math.max(0.32, Math.min(0.92, Math.min(scaleW, scaleH)));
    } else {
      const scaleW = (vw * 0.86) / DESKTOP_WINDOW_WIDTH_PX;
      const scaleH = (vh * 0.82) / DESKTOP_WINDOW_HEIGHT_PX;
      cachedFitScale = Math.max(0.38, Math.min(1.0, Math.min(scaleW, scaleH)));
    }
    lastScaledTransform = '';
  }

  updateCachedViewportMetrics();
  window.addEventListener('resize', updateCachedViewportMetrics, { passive: true });

  const origInit = desktopShowcase.init;
  const origRender = desktopShowcase.render;

  desktopShowcase.init = function (...args) {
    const res = origInit.apply(this, args);
    vpSpatialAssembly = document.getElementById('vpSpatialAssembly');
    updateCachedViewportMetrics();
    return res;
  };

  desktopShowcase.render = function (
    page3Prog,
    flightProg,
    mouseX = 0,
    mouseY = 0,
    fPhase = 0,
    flightVel = 0,
    force = false
  ) {
    if (!cachedIsMobile) {
      return origRender.call(
        this,
        page3Prog,
        flightProg,
        mouseX,
        mouseY,
        fPhase,
        flightVel,
        force
      );
    }

    origRender.call(this, page3Prog, flightProg, 0, 0, fPhase, flightVel, force);

    if (!vpSpatialAssembly) {
      vpSpatialAssembly = document.getElementById('vpSpatialAssembly');
    }
    if (vpSpatialAssembly) {
      const tf = vpSpatialAssembly.style.transform;
      if (tf && tf !== lastScaledTransform) {
        const scaleIdx = tf.indexOf('scale3d(');
        if (scaleIdx !== -1) {
          const closeIdx = tf.indexOf(')', scaleIdx);
          if (closeIdx !== -1) {
            const parts = tf.slice(scaleIdx + 8, closeIdx).split(',');
            const baseScale = parseFloat(parts[0]);
            if (!Number.isNaN(baseScale)) {
              const finalScale = (baseScale * cachedFitScale).toFixed(4);
              const nextTf =
                tf.slice(0, scaleIdx) +
                `scale3d(${finalScale}, ${finalScale}, 1)` +
                tf.slice(closeIdx + 1);
              vpSpatialAssembly.style.transform = nextTf;
              lastScaledTransform = nextTf;
            }
          }
        }
      }
    }
  };
})();
