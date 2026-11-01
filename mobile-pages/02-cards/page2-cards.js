/**
 * VOID MOBILE — PAGE 3: 7-CARD 3D PERSPECTIVE CAROUSEL MODULE
 * (mobile-pages/02-cards/page2-cards.js)
 * - Larger, highly legible Center Card on Mobile (`cardFitW = vw * 0.475`)
 * - Side cards placed closer together (`cachedSideStepExpand = 0.80`) and
 *   snug next to the Center Card with a clean non-overlapping gap!
 * - Desktop (`> 1024px`) remains 100% untouched.
 */

(() => {
  const desktopCards = window.VoidPage2Cards;
  if (!desktopCards) return;

  let prismStage3D = null;
  let prismUnits = [];
  let cachedIsMobile = false;
  let cachedIsPortrait = false;
  let cachedCardScale = 1.0;
  let cachedFirstSideX = 122;
  let cachedSideStepPx = 22;

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
      cachedCardScale = 1.0;
      return;
    }

    if (cachedIsPortrait) {
      // Portrait phone/tablet:
      // 1. Larger Center Card (~48% of viewport width -> ~198px on 412px phone)
      //    so text and UI inside the card are large and clearly readable!
      const cardFitW = (vw * 0.48) / CARD_WIDTH_PX;
      const cardFitH = (vh * 0.62) / CARD_HEIGHT_PX;
      cachedCardScale = Math.max(0.36, Math.min(0.74, Math.min(cardFitW, cardFitH)));

      // 2. Place Side Card 1 close to the Center Card without overlapping:
      //    Center card visible half-width is ~(CARD_WIDTH_PX * 0.43 * cachedCardScale).
      //    Side Card 1 projected half-width is ~(CARD_WIDTH_PX * 0.26 * cachedCardScale * 0.38).
      const centerHalfW = CARD_WIDTH_PX * 0.43 * cachedCardScale;
      const sideHalfW = CARD_WIDTH_PX * 0.10 * cachedCardScale;
      const gapToCenterPx = Math.max(10, vw * 0.028);
      cachedFirstSideX = centerHalfW + sideHalfW + gapToCenterPx;

      // 3. Keep the 3 side cards compactly grouped together (small, clean step between d=1, 2, 3)
      const remainingToEdge = Math.max(36, vw * 0.465 - cachedFirstSideX);
      cachedSideStepPx = Math.min(24, remainingToEdge * 0.46);
    } else {
      // Landscape phone/tablet
      const cardFitW = (vw * 0.36) / CARD_WIDTH_PX;
      const cardFitH = (vh * 0.78) / CARD_HEIGHT_PX;
      cachedCardScale = Math.max(0.42, Math.min(0.95, Math.min(cardFitW, cardFitH)));
      const centerHalfW = CARD_WIDTH_PX * 0.43 * cachedCardScale;
      const sideHalfW = CARD_WIDTH_PX * 0.10 * cachedCardScale;
      cachedFirstSideX = centerHalfW + sideHalfW + Math.max(14, vw * 0.025);
      cachedSideStepPx = Math.max(22, vw * 0.042);
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

        // Map Desktop X (0 -> 344 -> 420 -> 494 -> 555) smoothly onto Mobile X:
        // - Inside [0, 344] (center card unfolding to/from First Side Card): scales linearly to `cachedFirstSideX`
        // - Beyond 344 (Side Cards d = 1 -> 2 -> 3): steps compactly by `cachedSideStepPx` per side card!
        const absRawX = Math.abs(rawX);
        const signX = rawX < 0 ? -1 : rawX > 0 ? 1 : 0;
        let mobileAbsX;
        if (absRawX <= 344) {
          mobileAbsX = (absRawX / 344) * cachedFirstSideX;
        } else {
          const extraSlots = (absRawX - 344) / 75;
          mobileAbsX = cachedFirstSideX + extraSlots * cachedSideStepPx;
        }

        const x = signX * mobileAbsX;
        const y = rawY * cachedCardScale;
        const z = rawZ * cachedCardScale;
        const sx = rawSx * cachedCardScale;
        const sy = rawSy * cachedCardScale;

        unit.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${ry}deg) rotateX(${rx}deg) scale3d(${sx.toFixed(4)}, ${sy.toFixed(4)}, 1)`;
      }
    }
  };
})();
