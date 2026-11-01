/**
 * VOID MOBILE — PAGE 3: 7-CARD 3D PERSPECTIVE CAROUSEL MODULE
 * (mobile-pages/02-cards/page2-cards.js)
 * - CRITICAL ANDROID / S24 ULTRA FIX:
 *   Never sets `transform: scale(...)` on `#prismStage3D` (which shrank the 3D
 *   perspective frustum and caused Chrome Android to clip `.prism-stage-3d` into
 *   a horizontal band when scrolling!).
 * - Instead, keeps `#prismStage3D` unscaled (`transform: none`) and scales each
 *   `.prism-unit`'s 3D `translate3d` and `scale3d` coordinates directly!
 */

(() => {
  const desktopCards = window.VoidPage2Cards;
  if (!desktopCards) return;

  let prismStage3D = null;
  let prismUnits = [];
  let cachedIsMobile = false;
  let cachedPosScale = 1.0;
  let cachedCardScale = 1.0;

  const DESKTOP_FAN_SPAN_PX = 1060;
  const CARD_WIDTH_PX = 468;
  const CARD_HEIGHT_PX = 472;

  function updateMobileCardScales() {
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    cachedIsMobile = vw <= 1024 || vh <= 600;

    if (!prismStage3D) {
      prismStage3D = document.getElementById('prismStage3D');
    }
    if (prismStage3D) {
      prismStage3D.style.transform = '';
    }

    if (!cachedIsMobile) {
      cachedPosScale = 1.0;
      cachedCardScale = 1.0;
      return;
    }

    if (vh >= vw) {
      // Portrait phone/tablet: size active card generously while keeping side stack within viewport
      const spanScale = (vw * 0.92) / DESKTOP_FAN_SPAN_PX;
      const cardFitW = (vw * 0.56) / CARD_WIDTH_PX;
      const cardFitH = (vh * 0.68) / CARD_HEIGHT_PX;
      cachedCardScale = Math.max(0.36, Math.min(0.84, Math.min(cardFitW, cardFitH)));
      cachedPosScale = Math.max(0.32, Math.min(0.84, spanScale));
    } else {
      // Landscape phone/tablet
      const spanScale = (vw * 0.88) / DESKTOP_FAN_SPAN_PX;
      const cardFitH = (vh * 0.78) / CARD_HEIGHT_PX;
      const s = Math.max(0.38, Math.min(1.0, Math.min(spanScale, cardFitH)));
      cachedCardScale = s;
      cachedPosScale = s;
    }
  }

  const origInit = desktopCards.init;
  const origRender = desktopCards.render;

  desktopCards.init = function (...args) {
    const res = origInit.apply(this, args);
    prismStage3D = document.getElementById('prismStage3D');
    prismUnits = Array.from(document.querySelectorAll('.prism-unit'));
    updateMobileCardScales();
    window.addEventListener('resize', updateMobileCardScales, { passive: true });
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

    if (!prismUnits.length) {
      prismUnits = Array.from(document.querySelectorAll('.prism-unit'));
    }

    // Scale each visible .prism-unit's translate3d X/Y and scale3d SX/SY directly
    // so #prismStage3D remains a true full-viewport 3D stage with zero tile clipping!
    for (let i = 0; i < prismUnits.length; i++) {
      const unit = prismUnits[i];
      if (!unit || unit.style.visibility === 'hidden') continue;
      const tf = unit.style.transform;
      if (!tf || unit.dataset.lastBaseTf === tf) continue;

      // Parse: translate3d(Xpx, Ypx, Zpx) rotateY(RYdeg) rotateX(RXdeg) scale3d(SX, SY, 1)
      const m = tf.match(
        /translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*([-\d.]+)px\)\s*rotateY\(([-\d.]+)deg\)\s*rotateX\(([-\d.]+)deg\)\s*scale3d\(([-\d.]+),\s*([-\d.]+),\s*1\)/
      );
      if (m) {
        const x = parseFloat(m[1]) * cachedPosScale;
        const y = parseFloat(m[2]) * cachedCardScale;
        const z = parseFloat(m[3]) * cachedPosScale;
        const ry = m[4];
        const rx = m[5];
        const sx = parseFloat(m[6]) * cachedCardScale;
        const sy = parseFloat(m[7]) * cachedCardScale;

        const mobileTf = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${ry}deg) rotateX(${rx}deg) scale3d(${sx.toFixed(4)}, ${sy.toFixed(4)}, 1)`;
        unit.style.transform = mobileTf;
        unit.dataset.lastBaseTf = mobileTf;
      }
    }
  };
})();
