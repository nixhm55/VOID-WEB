/**
 * VOID MOBILE — PAGE 3: 7-CARD 3D PERSPECTIVE CAROUSEL MODULE
 * (mobile-pages/02-cards/page2-cards.js)
 * - Cleanly separates the center card and side card stacks on mobile with
 *   generous breathing gaps between every card and spreads the side cards
 *   all the way out to the left and right edges of the phone screen!
 * - Always applies the mobile transform in sync with `origRender` (including
 *   when scrolling stops) so cards never vanish or bunch up.
 */

(() => {
  const desktopCards = window.VoidPage2Cards;
  if (!desktopCards) return;

  let prismStage3D = null;
  let prismUnits = [];
  let cachedIsMobile = false;
  let cachedIsPortrait = false;
  let cachedPosScale = 1.0;
  let cachedCardScale = 1.0;
  let cachedSideOutwardOffsetPx = 0;
  let cachedSideStepExpand = 1.0;

  const DESKTOP_FAN_SPAN_PX = 1040;
  const CARD_WIDTH_PX = 468;
  const CARD_HEIGHT_PX = 472;

  function updateMobileCardScales() {
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    cachedIsMobile = vw <= 1024 || vh <= 600;
    cachedIsPortrait = vh >= vw && vw <= 1024;

    if (!prismStage3D) {
      prismStage3D = document.getElementById('prismStage3D');
    }
    if (prismStage3D) {
      prismStage3D.style.transform = '';
    }

    if (!cachedIsMobile) {
      cachedPosScale = 1.0;
      cachedCardScale = 1.0;
      cachedSideOutwardOffsetPx = 0;
      cachedSideStepExpand = 1.0;
      return;
    }

    if (cachedIsPortrait) {
      // Portrait phone/tablet:
      // 1. Proportional center card scale (~0.34 on 412px width -> 159px wide center card)
      //    so there is a wide, clean gap between the center card and the side card stacks!
      // 2. Push side cards outward toward the left/right screen edges with wider spacing between slices.
      const baseScale = (vw * 0.96) / DESKTOP_FAN_SPAN_PX;
      const cardFitW = (vw * 0.375) / CARD_WIDTH_PX;
      const cardFitH = (vh * 0.56) / CARD_HEIGHT_PX;
      cachedCardScale = Math.max(0.28, Math.min(0.66, Math.min(cardFitW, cardFitH)));
      cachedPosScale = Math.max(0.30, Math.min(0.78, baseScale));
      cachedSideOutwardOffsetPx = vw * 0.032;
      cachedSideStepExpand = 1.24;
    } else {
      // Landscape phone/tablet
      const spanScale = (vw * 0.90) / DESKTOP_FAN_SPAN_PX;
      const cardFitH = (vh * 0.76) / CARD_HEIGHT_PX;
      const s = Math.max(0.36, Math.min(0.95, Math.min(spanScale, cardFitH)));
      cachedCardScale = s;
      cachedPosScale = s;
      cachedSideOutwardOffsetPx = vw * 0.015;
      cachedSideStepExpand = 1.10;
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

    // Pass force=true to origRender so desktop base coordinates are always fresh,
    // then immediately apply mobile spacing & scaling in the same frame!
    origRender.call(
      this,
      entryProg,
      carouselPos,
      0,
      0,
      floatPhase,
      carouselVelocity,
      true
    );

    if (!prismUnits.length) {
      prismUnits = Array.from(document.querySelectorAll('.prism-unit'));
    }

    for (let i = 0; i < prismUnits.length; i++) {
      const unit = prismUnits[i];
      if (!unit || unit.style.visibility === 'hidden') continue;
      const tf = unit.style.transform;
      if (!tf) continue;

      const m = tf.match(
        /translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*([-\d.]+)px\)\s*rotateY\(([-\d.]+)deg\)\s*rotateX\(([-\d.]+)deg\)\s*scale3d\(([-\d.]+),\s*([-\d.]+),\s*1\)/
      );
      if (m) {
        const rawX = parseFloat(m[1]);
        const rawY = parseFloat(m[2]);
        const rawZ = parseFloat(m[3]);
        const ry = m[4];
        const rx = m[5];
        const rawSx = parseFloat(m[6]);
        const rawSy = parseFloat(m[7]);

        // Smoothly expand horizontal gap for side cards (|rawX| > 40px) so side cards
        // spread cleanly out toward the left/right edges with clear gaps between them!
        const absRawX = Math.abs(rawX);
        const signX = rawX < 0 ? -1 : rawX > 0 ? 1 : 0;
        const sideFactor = Math.min(1, absRawX / 300);
        const extraBeyondFirst = Math.max(0, absRawX - 344) * (cachedSideStepExpand - 1.0);
        const adjustedRawX = signX * (absRawX + extraBeyondFirst);

        const x = adjustedRawX * cachedPosScale + signX * sideFactor * cachedSideOutwardOffsetPx;
        const y = rawY * cachedCardScale;
        const z = rawZ * cachedPosScale;
        // Slightly slimmer side slice width on portrait so adjacent side cards never touch
        const sideWidthFactor = cachedIsPortrait ? 1.0 - 0.14 * sideFactor : 1.0;
        const sx = rawSx * cachedCardScale * sideWidthFactor;
        const sy = rawSy * cachedCardScale;

        unit.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${ry}deg) rotateX(${rx}deg) scale3d(${sx.toFixed(4)}, ${sy.toFixed(4)}, 1)`;
      }
    }
  };
})();
