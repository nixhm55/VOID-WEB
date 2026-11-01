/**
 * VOID MOBILE — PAGE 3: 7-CARD 3D PERSPECTIVE CAROUSEL MODULE
 * (mobile-pages/02-cards/page2-cards.js)
 * - Caches `#prismStage3D` scale on init and resize so zero redundant DOM style
 *   writes or layout queries happen during scroll frames!
 * - Calls 100% untouched Desktop `origRender` so all 7 cards unfold and rotate
 *   smoothly at 120fps with zero glitches.
 */

(() => {
  const desktopCards = window.VoidPage2Cards;
  if (!desktopCards) return;

  let prismStage3D = null;
  let cachedIsMobile = false;
  const DESKTOP_FAN_SPAN_PX = 1072;
  const CARD_HEIGHT_PX = 472;

  function applyResponsiveStageScale() {
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    cachedIsMobile = vw <= 1024 || vh <= 600;

    if (!prismStage3D) {
      prismStage3D = document.getElementById('prismStage3D');
    }
    if (!prismStage3D) return;

    if (!cachedIsMobile) {
      prismStage3D.style.transform = '';
      return;
    }

    if (vh >= vw) {
      const scaleW = (vw * 0.94) / DESKTOP_FAN_SPAN_PX;
      const scaleH = (vh * 0.78) / CARD_HEIGHT_PX;
      const s = Math.max(0.28, Math.min(0.86, Math.min(scaleW, scaleH)));
      prismStage3D.style.transform = `translate3d(0px, 0px, 0px) scale(${s.toFixed(4)})`;
    } else {
      const scaleW = (vw * 0.88) / DESKTOP_FAN_SPAN_PX;
      const scaleH = (vh * 0.80) / CARD_HEIGHT_PX;
      const s = Math.max(0.34, Math.min(1.0, Math.min(scaleW, scaleH)));
      prismStage3D.style.transform = `translate3d(0px, 0px, 0px) scale(${s.toFixed(4)})`;
    }
  }

  const origInit = desktopCards.init;
  const origRender = desktopCards.render;

  desktopCards.init = function (...args) {
    const res = origInit.apply(this, args);
    prismStage3D = document.getElementById('prismStage3D');
    applyResponsiveStageScale();
    window.addEventListener('resize', applyResponsiveStageScale, { passive: true });
    return res;
  };

  desktopCards.render = function (
    entryProg,
    carouselPos,
    mouseX = 0,
    mouseY = 0,
    floatPhase = 0,
    carouselVelocity = 0,
    force = false
  ) {
    if (!cachedIsMobile) {
      return origRender.call(
        this,
        entryProg,
        carouselPos,
        mouseX,
        mouseY,
        floatPhase,
        carouselVelocity,
        force
      );
    }

    origRender.call(
      this,
      entryProg,
      carouselPos,
      0,
      0,
      floatPhase,
      carouselVelocity,
      force
    );
  };
})();
