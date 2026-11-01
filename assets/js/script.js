/**
 * VOID Website — Master Animation, Physics, Lenis 120Hz Smooth Scroll & GPU Orchestrator (script.js)
 * Coordinates:
 * - Page 1: Hero 5-CD 3D Diagonal Spline Stage (`VoidPage1Hero`)
 * - Page 2: 3D Curved Cylindrical Ribbon Ring — 12 Outer Artists + 12 Inner Covers (`VoidPage2Ring`)
 * - Page 3: 7-Card 3D Perspective Carousel (`VoidPage2Cards`)
 * - Page 4: Butterfly & Macintosh Walk-In -> 3D Train Walk-In Download Portal (`VoidPage3Showcase`)
 * - Upgraded Lenis Smooth Scroll Engine (optimal lerp, wheel/touch multipliers, zero overscroll bounce,
 *   preloader lifecycle lock/unlock, ResizeObserver auto-calibration, and strict section culling)
 */

(() => {
  /**
   * 0. Strict Safari / macOS Reload Hero Lock
   */
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  const prefersReducedMotion = Boolean(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const isCoarsePointer = Boolean(
    window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  );

  let userHasInteracted = false;
  let initialLockCompleted = false;
  let lenis = null;

  function forceZeroScrollImmediate() {
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (lenis && typeof lenis.scrollTo === 'function') {
      lenis.scrollTo(0, { immediate: true, force: true });
    }
  }

  forceZeroScrollImmediate();

  function markUserInteracted() {
    if (document.body.classList.contains('is-preloading')) return;
    userHasInteracted = true;
  }

  window.addEventListener('wheel', markUserInteracted, { passive: true });
  window.addEventListener('touchstart', markUserInteracted, { passive: true });
  window.addEventListener('touchmove', markUserInteracted, { passive: true });
  window.addEventListener('pointerdown', markUserInteracted, { passive: true });
  window.addEventListener(
    'keydown',
    (e) => {
      if (document.body.classList.contains('is-preloading')) return;
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === 'PageDown' ||
        e.key === 'PageUp' ||
        e.key === ' ' ||
        e.key === 'Home' ||
        e.key === 'End'
      ) {
        userHasInteracted = true;
      }
    },
    { passive: true }
  );

  /**
   * 1. Initialize Upgraded Lenis Smooth Scroll + GSAP ScrollTrigger 120Hz Synchronization
   */
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = typeof window.ScrollTrigger !== 'undefined';
  if (hasGSAP && hasScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.gsap.ticker.lagSmoothing(0);
  }

  const hasLenis = typeof window.Lenis === 'function';
  lenis = hasLenis
    ? new window.Lenis({
        autoRaf: false,
        lerp: 0.088,
        smoothWheel: true,
        wheelMultiplier: 0.92,
        touchMultiplier: 1.12,
        syncTouch: false,
        autoResize: true,
        anchors: false,
        overscroll: false,
        infinite: false,
        gestureOrientation: 'vertical',
        respectReducedMotion: true,
      })
    : null;

  window.voidLenis = lenis;

  if (lenis && hasScrollTrigger) {
    lenis.on('scroll', window.ScrollTrigger.update);
  }

  forceZeroScrollImmediate();

  /**
   * 2. Responsive 2nd-Order Critically-Damped Spring Constants
   */
  const MAX_SHIFT_UNITS = 2.6;
  const OMEGA_HERO = 24.0;         // Snappy, silky spring for Hero 5-CD spline
  const OMEGA_RING_ENTRY = 18.0;   // Smooth spring for Page 2 3D Cylinder Ring entry
  const OMEGA_ENTRY = 18.0;        // Responsive spring for Page 3 Prism entry unfold
  const OMEGA_CAROUSEL = 12.5;     // Smooth, zero-lag spring for 7-Card Carousel
  const OMEGA_PAGE3 = 20.0;        // Crisp spring for Page 4 Macintosh reveal
  const OMEGA_PAGE3_FLIGHT = 16.5; // Responsive 3D camera flight spring for Macintosh & Train walk-in
  const OMEGA_MOUSE = 9.5;         // Responsive 2nd-order mouse-follow spring

  let heroTopDoc = 0;
  let heroHeightDoc = 1;
  let heroStickyDistance = 1;
  let ringTopDoc = 0;
  let ringHeightDoc = 1;
  let ringStickyDistance = 1;
  let featuresTopDoc = 0;
  let featuresHeightDoc = 1;
  let featuresStickyDistance = 1;
  let page3TopDoc = 0;
  let page3HeightDoc = 1;
  let page3StickyDistance = 1;
  let maxDocScrollY = 1;
  let viewportHeight = window.innerHeight || 800;
  let viewportWidth = window.innerWidth || 1280;

  let currentShift = 0;
  let shiftVel = 0;
  let targetShift = 0;

  let currentRingEntry = 0;
  let ringEntryVel = 0;
  let targetRingEntry = 0;

  let currentEntry = 0;
  let entryVel = 0;
  let targetEntry = 0;

  let currentCarousel = 0;
  let carouselVel = 0;
  let targetCarousel = 0;
  let rawCarouselStep = 0;
  let manualClickOffset = 0;

  let currentPage3 = 0;
  let page3Vel = 0;
  let targetPage3 = 0;

  let currentPage3Flight = 0;
  let page3FlightVel = 0;
  let targetPage3Flight = 0;

  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;
  let mouseVelX = 0;
  let mouseVelY = 0;

  let floatPhase = 0;
  let lastFrameTime = 0;
  let lastScrollY = 0;
  let smoothedScrollVelPx = 0;
  let activeNavSection = 'hero';

  const navLinksMap = {
    hero: document.querySelector('.nav-link[data-nav-target="hero"]'),
    player: document.querySelector('.nav-link[data-nav-target="player"]'),
    download: document.querySelector('.nav-link[data-nav-target="download"]'),
  };
  const activeDotEl = document.querySelector('.active-dot');

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function solveSpring1D(pos, vel, target, omega, dt) {
    if (prefersReducedMotion) {
      return { pos: target, vel: 0 };
    }
    const x0 = pos - target;
    if (Math.abs(x0) < 0.00001 && Math.abs(vel) < 0.00005) {
      return { pos: target, vel: 0 };
    }
    const expTerm = Math.exp(-omega * dt);
    const x1 = (x0 + (vel + omega * x0) * dt) * expTerm;
    const v1 = (vel - (vel + omega * x0) * omega * dt) * expTerm;
    return { pos: target + x1, vel: v1 };
  }

  function getScrollPosition() {
    if (!userHasInteracted) {
      const rawY =
        window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      if (rawY > 0 || (lenis && lenis.scroll > 0)) {
        forceZeroScrollImmediate();
      }
      return 0;
    }
    const raw =
      lenis && typeof lenis.scroll === 'number'
        ? lenis.scroll
        : window.scrollY || window.pageYOffset || 0;
    return clamp(raw, 0, maxDocScrollY);
  }

  function cacheLayoutMetrics() {
    viewportHeight = window.innerHeight || 800;
    viewportWidth = window.innerWidth || 1280;
    const rawScrollY = userHasInteracted ? (window.scrollY || window.pageYOffset || 0) : 0;

    const heroWrapper = window.VoidPage1Hero ? window.VoidPage1Hero.getWrapper() : null;
    if (heroWrapper) {
      const heroRect = heroWrapper.getBoundingClientRect();
      heroTopDoc = heroRect.top + rawScrollY;
      heroHeightDoc = heroWrapper.offsetHeight;
      heroStickyDistance = Math.max(1, heroHeightDoc - viewportHeight);
    }

    const ringWrapper = window.VoidPage2Ring ? window.VoidPage2Ring.getWrapper() : null;
    if (ringWrapper) {
      const ringRect = ringWrapper.getBoundingClientRect();
      ringTopDoc = ringRect.top + rawScrollY;
      ringHeightDoc = ringWrapper.offsetHeight;
      ringStickyDistance = Math.max(1, ringHeightDoc - viewportHeight);
    }

    const featuresWrapper = window.VoidPage2Cards ? window.VoidPage2Cards.getWrapper() : null;
    if (featuresWrapper) {
      const featRect = featuresWrapper.getBoundingClientRect();
      featuresTopDoc = featRect.top + rawScrollY;
      featuresHeightDoc = featuresWrapper.offsetHeight;
      featuresStickyDistance = Math.max(1, featuresHeightDoc - viewportHeight);
    }

    const page3Section = window.VoidPage3Showcase ? window.VoidPage3Showcase.getWrapper() : null;
    if (page3Section) {
      const p3Rect = page3Section.getBoundingClientRect();
      page3TopDoc = p3Rect.top + rawScrollY;
      page3HeightDoc = page3Section.offsetHeight;
      page3StickyDistance = Math.max(1, page3HeightDoc - viewportHeight);
      maxDocScrollY = Math.max(1, page3TopDoc + page3StickyDistance);
    } else {
      maxDocScrollY = Math.max(
        1,
        (document.documentElement.scrollHeight || document.body.scrollHeight || viewportHeight) -
          viewportHeight
      );
    }

    if (lenis && typeof lenis.resize === 'function') {
      lenis.resize();
    }

    if (hasScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }

  window.voidRefreshScrollMetrics = cacheLayoutMetrics;

  /**
   * 3. Desktop Magnetic Button & Interactive Element Spring Controller
   */
  const magneticItems = [];

  function initMagneticInteractiveSystem() {
    if (prefersReducedMotion || isCoarsePointer) return;

    const configs = [
      { selector: '.brand-logo', strengthX: 0.22, strengthY: 0.24, hoverScale: 1.03, pressScale: 0.96, baseY: -2.2 },
      { selector: '.nav-link', strengthX: 0.20, strengthY: 0.22, hoverScale: 1.025, pressScale: 0.97, baseY: 0 },
      { selector: '.pg-select-box', strengthX: 0.05, strengthY: 0.08, hoverScale: 1.008, pressScale: 0.99, baseY: 0 },
      { selector: '.pg-logic-card', strengthX: 0.06, strengthY: 0.09, hoverScale: 1.01, pressScale: 0.99, baseY: 0 },
      { selector: '.pg-grid-tile', strengthX: 0.08, strengthY: 0.10, hoverScale: 1.014, pressScale: 0.985, baseY: 0 },
      { selector: '.pg-pill', strengthX: 0.12, strengthY: 0.15, hoverScale: 1.025, pressScale: 0.97, baseY: 0 },
    ];

    configs.forEach((cfg) => {
      const elements = document.querySelectorAll(cfg.selector);
      elements.forEach((el) => {
        const item = {
          el,
          cfg,
          tx: 0,
          ty: 0,
          ts: 1,
          x: 0,
          y: 0,
          s: 1,
          vx: 0,
          vy: 0,
          vs: 0,
          hovered: false,
          pressed: false,
          sleeping: true,
        };

        el.addEventListener(
          'pointerenter',
          (e) => {
            if (e.pointerType === 'touch') return;
            item.hovered = true;
            item.sleeping = false;
            item.ts = cfg.hoverScale;
          },
          { passive: true }
        );

        el.addEventListener(
          'pointermove',
          (e) => {
            if (e.pointerType === 'touch' || !item.hovered) return;
            const rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const relX = e.clientX - (rect.left + rect.width * 0.5);
            const relY = e.clientY - (rect.top + rect.height * 0.5);
            item.tx = relX * cfg.strengthX;
            item.ty = relY * cfg.strengthY - 0.8;
            item.sleeping = false;
          },
          { passive: true }
        );

        el.addEventListener(
          'pointerdown',
          (e) => {
            if (e.pointerType === 'touch') return;
            item.pressed = true;
            item.ts = cfg.pressScale;
            item.sleeping = false;
          },
          { passive: true }
        );

        el.addEventListener(
          'pointerup',
          () => {
            item.pressed = false;
            item.ts = item.hovered ? cfg.hoverScale : 1;
            item.sleeping = false;
          },
          { passive: true }
        );

        el.addEventListener(
          'pointerleave',
          () => {
            item.hovered = false;
            item.pressed = false;
            item.tx = 0;
            item.ty = 0;
            item.ts = 1;
            item.sleeping = false;
          },
          { passive: true }
        );

        magneticItems.push(item);
      });
    });
  }

  function stepMagneticItems(dt) {
    if (!magneticItems.length) return;
    const omegaPos = 10.5;
    const omegaScale = 12.0;

    for (let i = 0; i < magneticItems.length; i++) {
      const m = magneticItems[i];
      if (m.sleeping) continue;

      const rx = solveSpring1D(m.x, m.vx, m.tx, omegaPos, dt);
      const ry = solveSpring1D(m.y, m.vy, m.ty, omegaPos, dt);
      const rs = solveSpring1D(m.s, m.vs, m.ts, omegaScale, dt);

      m.x = rx.pos;
      m.vx = rx.vel;
      m.y = ry.pos;
      m.vy = ry.vel;
      m.s = rs.pos;
      m.vs = rs.vel;

      const totalY = m.y + m.cfg.baseY;
      m.el.style.transform = `translate3d(${m.x.toFixed(2)}px, ${totalY.toFixed(2)}px, 0px) scale3d(${m.s.toFixed(4)}, ${m.s.toFixed(4)}, 1)`;

      if (
        !m.hovered &&
        !m.pressed &&
        Math.abs(m.x) < 0.015 &&
        Math.abs(m.y) < 0.015 &&
        Math.abs(m.s - 1) < 0.0006 &&
        Math.abs(m.vx) < 0.015 &&
        Math.abs(m.vy) < 0.015
      ) {
        m.x = 0;
        m.y = 0;
        m.s = 1;
        m.vx = 0;
        m.vy = 0;
        m.vs = 0;
        if (m.cfg.baseY !== 0) {
          m.el.style.transform = `translateY(${m.cfg.baseY}px)`;
        } else {
          m.el.style.transform = '';
        }
        m.sleeping = true;
      }
    }
  }

  /**
   * 4. Initialize Page Modules (Page 1 Hero, Page 2 Ring, Page 3 Cards, Page 4 Showcase)
   */
  if (window.VoidPage1Hero) {
    window.VoidPage1Hero.init();
  }

  if (window.VoidPage2Ring) {
    window.VoidPage2Ring.init();
  }

  if (window.VoidPage2Cards) {
    window.VoidPage2Cards.init((clickedIdx, ringCount, wrapDeltaFn) => {
      userHasInteracted = true;
      const d = wrapDeltaFn(clickedIdx - currentCarousel, ringCount);
      if (Math.abs(d) > 0.15 && Math.abs(d) <= 3.5) {
        const stepDelta = Math.round(d);
        manualClickOffset += stepDelta;
        targetCarousel += stepDelta;
      }
    });
  }

  if (window.VoidPage3Showcase) {
    window.VoidPage3Showcase.init();
  }

  initMagneticInteractiveSystem();

  if (!isCoarsePointer && !prefersReducedMotion) {
    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType === 'touch') return;
        const nx = (e.clientX / Math.max(1, viewportWidth)) * 2 - 1;
        const ny = (e.clientY / Math.max(1, viewportHeight)) * 2 - 1;
        targetMouseX = Math.max(-1, Math.min(1, nx));
        targetMouseY = Math.max(-1, Math.min(1, ny));
      },
      { passive: true }
    );

    window.addEventListener(
      'pointerleave',
      () => {
        targetMouseX = 0;
        targetMouseY = 0;
      },
      { passive: true }
    );
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;
      e.preventDefault();
      userHasInteracted = true;
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if (lenis && typeof lenis.scrollTo === 'function') {
        lenis.scrollTo(targetEl, {
          offset: 0,
          duration: 1.2,
          easing: (t) => 1 - Math.pow(1 - t, 4),
        });
      } else {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  function updateActiveNavIndicator(scrollY) {
    let nextSection = 'hero';
    if (scrollY >= page3TopDoc - viewportHeight * 0.45) {
      nextSection = 'download';
    } else if (scrollY >= featuresTopDoc - viewportHeight * 0.45) {
      nextSection = 'player';
    }

    if (nextSection !== activeNavSection) {
      activeNavSection = nextSection;
      Object.keys(navLinksMap).forEach((key) => {
        const link = navLinksMap[key];
        if (!link) return;
        if (key === activeNavSection) {
          link.classList.add('active');
          if (activeDotEl && activeDotEl.parentElement !== link) {
            link.appendChild(activeDotEl);
          }
        } else {
          link.classList.remove('active');
        }
      });
    }
  }

  /**
   * 5. Compute Scroll Targets Across All 4 Pages
   */
  function updateTargetsFromScroll(scrollY) {
    updateActiveNavIndicator(scrollY);

    // 1. Page 1 (Hero CDs)
    const scrolledHero = Math.max(0, scrollY - heroTopDoc);
    const u = scrolledHero / heroStickyDistance;
    let shift;
    const blendZone = 0.18;
    if (u <= 1.0 - blendZone) {
      shift = u;
    } else if (u < 1.0 + blendZone) {
      const t = (u - (1.0 - blendZone)) / (2 * blendZone);
      const slope0 = 1.0;
      const slope1 = 0.48;
      const avgSlope = slope0 + (slope1 - slope0) * (t * t * (3 - 2 * t));
      shift = (1.0 - blendZone) + (u - (1.0 - blendZone)) * (0.5 * (slope0 + avgSlope));
    } else {
      const baseAtEnd = (1.0 - blendZone) + 2 * blendZone * 0.74;
      shift = baseAtEnd + (u - (1.0 + blendZone)) * 0.48;
    }
    targetShift = shift < 0 ? 0 : shift > MAX_SHIFT_UNITS ? MAX_SHIFT_UNITS : shift;

    // 2. Page 2 (3D Curved Cylindrical Ribbon Ring — 12 Artists + 12 Song Covers)
    if (window.VoidPage2Ring && window.VoidPage2Ring.getWrapper()) {
      const ringStart = ringTopDoc - viewportHeight * 0.85;
      const ringEnd = ringTopDoc + viewportHeight * 0.05;
      targetRingEntry = clamp01((scrollY - ringStart) / Math.max(1, ringEnd - ringStart));
    }

    // 3. Page 3 (7-Card 3D Carousel)
    if (window.VoidPage2Cards && window.VoidPage2Cards.getWrapper()) {
      const entryStart = featuresTopDoc - viewportHeight * 0.78;
      const entryEnd = featuresTopDoc + viewportHeight * 0.08;
      targetEntry = clamp01((scrollY - entryStart) / Math.max(1, entryEnd - entryStart));

      const carouselScroll = Math.max(0, scrollY - entryEnd);
      const carouselSpan = Math.max(1, featuresStickyDistance - viewportHeight * 0.14);
      const cardCount = window.VoidPage2Cards.getCardCount();
      rawCarouselStep = (carouselScroll / carouselSpan) * (cardCount - 1);

      const shaped = window.VoidPage2Cards.shapeCarouselStep(rawCarouselStep);
      const nearestInt = Math.round(
        Math.max(0, Math.min(cardCount - 1, rawCarouselStep))
      );

      const absVel = Math.abs(smoothedScrollVelPx / 600);
      const inCarouselZone =
        rawCarouselStep > 0.02 && rawCarouselStep < cardCount - 1 - 0.02;
      const settleFactor = inCarouselZone
        ? clamp01(1.0 - absVel / 1.8) * 0.36
        : 0;

      const settledStep = shaped + (nearestInt - shaped) * settleFactor;
      targetCarousel = settledStep + manualClickOffset;
    }

    // 4. Page 4 (Macintosh Walk-In -> 3D Train Walk-In Download Stage)
    if (window.VoidPage3Showcase && window.VoidPage3Showcase.getWrapper()) {
      const revealStart = page3TopDoc - viewportHeight * 0.95;
      const revealEnd = page3TopDoc;
      targetPage3 = clamp01((scrollY - revealStart) / Math.max(1, revealEnd - revealStart));

      const flightSpan = Math.max(1, page3StickyDistance);
      targetPage3Flight = clamp01((scrollY - page3TopDoc) / flightSpan);
    }
  }

  function renderAllPages(
    shift,
    ringEntryProg,
    entryProg,
    carouselPos,
    page3Prog,
    page3FlightProg,
    mouseX,
    mouseY,
    fPhase,
    sVel,
    cVel,
    p3FlightVel,
    dt,
    force = false
  ) {
    const scrollY = getScrollPosition();

    // 1. Page 1 (Hero CDs) — cull when scrolled past Page 2 Ring
    const isHeroNear = force || scrollY <= heroTopDoc + heroHeightDoc + viewportHeight * 0.15;
    if (window.VoidPage1Hero && isHeroNear) {
      window.VoidPage1Hero.render(shift, mouseX, mouseY, fPhase, sVel, force);
    }

    // 2. Page 2 (3D Cylindrical Ribbon Ring) — strictly only spins & renders when visible in viewport!
    if (window.VoidPage2Ring && (force || window.VoidPage2Ring.isActiveInViewport())) {
      window.VoidPage2Ring.render(
        ringEntryProg,
        dt,
        smoothedScrollVelPx,
        mouseX,
        mouseY,
        force
      );
    }

    // 3. Page 3 (7-Card 3D Carousel) — cull when outside viewport
    const isPage2CardsNear =
      force ||
      (scrollY > featuresTopDoc - viewportHeight * 1.05 && page3FlightProg < 0.05);
    if (window.VoidPage2Cards && isPage2CardsNear) {
      window.VoidPage2Cards.render(entryProg, carouselPos, mouseX, mouseY, fPhase, cVel, force);
    }

    // 4. Page 4 (Macintosh & Train Walk-In Download Portal)
    const isPage3Near = force || page3Prog > 0.0001 || scrollY > page3TopDoc - viewportHeight * 1.1;
    if (window.VoidPage3Showcase && isPage3Near) {
      window.VoidPage3Showcase.render(
        page3Prog,
        page3FlightProg,
        mouseX,
        mouseY,
        fPhase,
        p3FlightVel,
        force
      );
    }
  }

  /**
   * 6. Single Master Frame Step
   */
  function masterFrameStep(nowMs) {
    if (document.hidden) {
      lastFrameTime = nowMs;
      return;
    }

    const dt = lastFrameTime
      ? Math.min(0.033, Math.max(0.001, (nowMs - lastFrameTime) * 0.001))
      : 0.016;
    lastFrameTime = nowMs;

    if (!userHasInteracted) {
      forceZeroScrollImmediate();
    } else if (lenis) {
      lenis.raf(nowMs);
    }

    const scrollY = getScrollPosition();
    const rawVelPx =
      lenis && typeof lenis.velocity === 'number'
        ? lenis.velocity * 60
        : (scrollY - lastScrollY) / Math.max(0.001, dt);
    lastScrollY = scrollY;
    smoothedScrollVelPx += (rawVelPx - smoothedScrollVelPx) * (1.0 - Math.exp(-18.0 * dt));

    updateTargetsFromScroll(scrollY);

    const sShift = solveSpring1D(currentShift, shiftVel, targetShift, OMEGA_HERO, dt);
    currentShift = sShift.pos;
    shiftVel = sShift.vel;

    const sRingEntry = solveSpring1D(
      currentRingEntry,
      ringEntryVel,
      targetRingEntry,
      OMEGA_RING_ENTRY,
      dt
    );
    currentRingEntry = sRingEntry.pos;
    ringEntryVel = sRingEntry.vel;

    const sEntry = solveSpring1D(currentEntry, entryVel, targetEntry, OMEGA_ENTRY, dt);
    currentEntry = sEntry.pos;
    entryVel = sEntry.vel;

    const sCarousel = solveSpring1D(
      currentCarousel,
      carouselVel,
      targetCarousel,
      OMEGA_CAROUSEL,
      dt
    );
    currentCarousel = sCarousel.pos;
    carouselVel = sCarousel.vel;

    const sPage3 = solveSpring1D(currentPage3, page3Vel, targetPage3, OMEGA_PAGE3, dt);
    currentPage3 = sPage3.pos;
    page3Vel = sPage3.vel;

    const sPage3Flight = solveSpring1D(
      currentPage3Flight,
      page3FlightVel,
      targetPage3Flight,
      OMEGA_PAGE3_FLIGHT,
      dt
    );
    currentPage3Flight = sPage3Flight.pos;
    page3FlightVel = sPage3Flight.vel;

    const sMouseX = solveSpring1D(currentMouseX, mouseVelX, targetMouseX, OMEGA_MOUSE, dt);
    currentMouseX = sMouseX.pos;
    mouseVelX = sMouseX.vel;

    const sMouseY = solveSpring1D(currentMouseY, mouseVelY, targetMouseY, OMEGA_MOUSE, dt);
    currentMouseY = sMouseY.pos;
    mouseVelY = sMouseY.vel;

    if (!prefersReducedMotion) {
      floatPhase = (floatPhase + dt * 1.15) % (Math.PI * 200);
    }

    if (window.VoidPage1Hero && typeof window.VoidPage1Hero.stepHoverSpring === 'function') {
      window.VoidPage1Hero.stepHoverSpring(dt);
    }
    if (window.VoidPage2Cards && typeof window.VoidPage2Cards.stepHoverSpring === 'function') {
      window.VoidPage2Cards.stepHoverSpring(dt);
    }

    stepMagneticItems(dt);

    renderAllPages(
      currentShift,
      currentRingEntry,
      currentEntry,
      currentCarousel,
      currentPage3,
      currentPage3Flight,
      currentMouseX,
      currentMouseY,
      floatPhase,
      shiftVel,
      carouselVel,
      page3FlightVel,
      dt,
      false
    );
  }

  function lockToHeroTopIfUninterrupted() {
    if (userHasInteracted && initialLockCompleted) return;
    forceZeroScrollImmediate();
    cacheLayoutMetrics();
    targetShift = 0;
    currentShift = 0;
    shiftVel = 0;
    targetRingEntry = 0;
    currentRingEntry = 0;
    ringEntryVel = 0;
    targetEntry = 0;
    currentEntry = 0;
    entryVel = 0;
    targetCarousel = 0;
    currentCarousel = 0;
    carouselVel = 0;
    manualClickOffset = 0;
    targetPage3 = 0;
    currentPage3 = 0;
    page3Vel = 0;
    targetPage3Flight = 0;
    currentPage3Flight = 0;
    page3FlightVel = 0;
    lastScrollY = 0;
    smoothedScrollVelPx = 0;
    renderAllPages(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.016, true);
    document.documentElement.classList.add('void-ready');
    initialLockCompleted = true;
  }

  window.addEventListener(
    'resize',
    () => {
      if (lenis && typeof lenis.resize === 'function') {
        lenis.resize();
      }
      if (window.VoidPage1Hero && typeof window.VoidPage1Hero.resize === 'function') {
        window.VoidPage1Hero.resize();
      }
      if (window.VoidPage2Ring && typeof window.VoidPage2Ring.resize === 'function') {
        window.VoidPage2Ring.resize();
      }
      cacheLayoutMetrics();
      updateTargetsFromScroll(getScrollPosition());
      renderAllPages(
        currentShift,
        currentRingEntry,
        currentEntry,
        currentCarousel,
        currentPage3,
        currentPage3Flight,
        currentMouseX,
        currentMouseY,
        floatPhase,
        shiftVel,
        carouselVel,
        page3FlightVel,
        0.016,
        true
      );
    },
    { passive: true }
  );

  lockToHeroTopIfUninterrupted();

  if (hasGSAP && window.gsap.ticker) {
    window.gsap.ticker.add((timeSeconds) => {
      masterFrameStep(timeSeconds * 1000);
    });
  } else {
    const fallbackRaf = (now) => {
      masterFrameStep(now);
      window.requestAnimationFrame(fallbackRaf);
    };
    window.requestAnimationFrame(fallbackRaf);
  }

  window.addEventListener('load', () => {
    cacheLayoutMetrics();
    if (!userHasInteracted) {
      lockToHeroTopIfUninterrupted();
    }
  });

  window.addEventListener('pageshow', (e) => {
    if (e.persisted && !userHasInteracted) {
      lockToHeroTopIfUninterrupted();
    }
  });

  window.addEventListener('pagehide', () => {
    if (!userHasInteracted) {
      forceZeroScrollImmediate();
    }
  });
})();
