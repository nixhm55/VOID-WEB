import { useEffect, useState } from 'react';
import { CoordinatedSceneMotion, NavigationSection, Transform3DState } from '../types/void';

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  const diff = target - current;
  if (Math.abs(diff) < 0.08) return target;
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function detectWebGLAvailable(): boolean {
  return true;
}

const INITIAL_TRANSFORM: Transform3DState = {
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scale: 1,
  opacity: 1,
  specularShiftX: 50,
  specularShiftY: 50,
};

export const WATER_SURFACE_WORLD_Y = -0.92;

export const SHARED_SCENE_STATE = {
  heroScrollProgress: 0,
  pageScrollProgress: 0,
  submersionProgress: 0,
  cameraWorldY: 0.22,
  waterLevelY: WATER_SURFACE_WORLD_Y,
  scrollVelocity: 0,
  pointerX: 0,
  pointerY: 0,
  elapsedTime: 0,
  reducedMotion: false,
  isPlaying: false,
  audioIntensity: 0.35,
  webglDrivenLoop: false,
  targetScrollY: 0,
  currentScrollY: 0,
  prevScrollY: 0,
  targetPointerX: 0,
  targetPointerY: 0,
  currentPointerX: 0,
  currentPointerY: 0,
  viewportH: 800,
  docH: 3600,
  sectionOffsets: {
    features: 800,
    preview: 1600,
    experience: 2500,
    download: 3400,
  },
  lastSection: 'home' as NavigationSection,
  lastMiniDock: false,
  // Cached DOM write state to prevent redundant style mutations & GPU layer thrashing
  lastHeroOpacity: -1,
  lastStripOpacity: -1,
  lastStageVh: -999,
  lastStageX: -999,
  lastStageOpacity: -1,
  lastExperienceLift: -1,
  lastDownloadArrival: -1,
  lastVinylX: -999,
  lastVinylY: -999,
  lastVinylOpacity: -1,
  vinylHidden: false,
  onThresholdCallback: undefined as
    | ((section: NavigationSection, showMiniDock: boolean) => void)
    | undefined,
};

export const STAGE_DOM_REFS: {
  mainPlayerEl: HTMLElement | null;
  mainSpecularEl: HTMLElement | null;
  leftPanelEl: HTMLElement | null;
  rightPanelEl: HTMLElement | null;
  heroCopyEl: HTMLElement | null;
  heroBottomBarEl: HTMLElement | null;
  vinylPlatterEl: HTMLElement | null;
  vinylSpinningDiscEl: HTMLElement | null;
  leatherStageEl: HTMLElement | null;
  leatherCanvasEl: HTMLElement | null;
  downloadSectionEl: HTMLElement | null;
} = {
  mainPlayerEl: null,
  mainSpecularEl: null,
  leftPanelEl: null,
  rightPanelEl: null,
  heroCopyEl: null,
  heroBottomBarEl: null,
  vinylPlatterEl: null,
  vinylSpinningDiscEl: null,
  leatherStageEl: null,
  leatherCanvasEl: null,
  downloadSectionEl: null,
};

export function stepUnifiedSceneMotion(rawDeltaSeconds: number): boolean {
  if (typeof document !== 'undefined' && document.hidden) return false;

  const dt = clamp(rawDeltaSeconds, 0.001, 0.05);
  const reducedMotion = SHARED_SCENE_STATE.reducedMotion;
  // Tight, fluid scroll lambda (18.5) so background parallax flows like water with native scrolling
  const scrollLambda = reducedMotion ? 32.0 : 18.5;
  const pointerLambda = 9.0;

  SHARED_SCENE_STATE.elapsedTime += dt;

  SHARED_SCENE_STATE.currentScrollY = damp(
    SHARED_SCENE_STATE.currentScrollY,
    SHARED_SCENE_STATE.targetScrollY,
    scrollLambda,
    dt
  );
  const rawVelocity = SHARED_SCENE_STATE.currentScrollY - SHARED_SCENE_STATE.prevScrollY;
  SHARED_SCENE_STATE.prevScrollY = SHARED_SCENE_STATE.currentScrollY;

  SHARED_SCENE_STATE.currentPointerX = damp(
    SHARED_SCENE_STATE.currentPointerX,
    SHARED_SCENE_STATE.targetPointerX,
    pointerLambda,
    dt
  );
  SHARED_SCENE_STATE.currentPointerY = damp(
    SHARED_SCENE_STATE.currentPointerY,
    SHARED_SCENE_STATE.targetPointerY,
    pointerLambda,
    dt
  );

  const vh = Math.max(600, SHARED_SCENE_STATE.viewportH);
  const scrollY = SHARED_SCENE_STATE.currentScrollY;
  const scrollScreens = scrollY / vh;
  const heroProgress = clamp(scrollScreens, 0, 1);
  const pageProgress = clamp(
    scrollY / Math.max(1, SHARED_SCENE_STATE.docH),
    0,
    1
  );

  const px = reducedMotion ? 0 : SHARED_SCENE_STATE.currentPointerX;
  const py = reducedMotion ? 0 : SHARED_SCENE_STATE.currentPointerY;

  SHARED_SCENE_STATE.heroScrollProgress = heroProgress;
  SHARED_SCENE_STATE.pageScrollProgress = pageProgress;
  SHARED_SCENE_STATE.scrollVelocity = clamp(rawVelocity / 40, -1, 1);
  SHARED_SCENE_STATE.pointerX = px;
  SHARED_SCENE_STATE.pointerY = py;

  // Section detection for HOME -> FEATURES -> PREVIEW -> EXPERIENCE -> DOWNLOAD
  const probeY = scrollY + vh * 0.45;
  const offsets = SHARED_SCENE_STATE.sectionOffsets;
  let nextSection: NavigationSection = 'home';
  if (probeY >= offsets.download) {
    nextSection = 'download';
  } else if (probeY >= offsets.experience) {
    nextSection = 'experience';
  } else if (probeY >= offsets.preview) {
    nextSection = 'discover';
  } else if (probeY >= offsets.features) {
    nextSection = 'features';
  } else {
    nextSection = 'home';
  }

  const nextMiniDock = scrollScreens > 1.65;
  if (
    (nextSection !== SHARED_SCENE_STATE.lastSection ||
      nextMiniDock !== SHARED_SCENE_STATE.lastMiniDock) &&
    SHARED_SCENE_STATE.onThresholdCallback
  ) {
    SHARED_SCENE_STATE.lastSection = nextSection;
    SHARED_SCENE_STATE.lastMiniDock = nextMiniDock;
    SHARED_SCENE_STATE.onThresholdCallback(nextSection, nextMiniDock);
  }

  // 1. Hero Left Copy & Bottom 4-Icon Strip Fade-Out on Scroll
  const heroCopyFade = 1 - smoothstep(0.05, 0.58, heroProgress);
  if (
    STAGE_DOM_REFS.heroCopyEl &&
    Math.abs(heroCopyFade - SHARED_SCENE_STATE.lastHeroOpacity) > 0.0005
  ) {
    SHARED_SCENE_STATE.lastHeroOpacity = heroCopyFade;
    const heroLiftY = -smoothstep(0, 1, heroProgress) * 76;
    STAGE_DOM_REFS.heroCopyEl.style.transform = `translate3d(0, ${heroLiftY.toFixed(1)}px, 0)`;
    STAGE_DOM_REFS.heroCopyEl.style.opacity = heroCopyFade.toFixed(3);
    STAGE_DOM_REFS.heroCopyEl.style.pointerEvents = heroCopyFade < 0.06 ? 'none' : 'auto';
  }

  const stripFade = 1 - smoothstep(0.03, 0.46, heroProgress);
  if (
    STAGE_DOM_REFS.heroBottomBarEl &&
    Math.abs(stripFade - SHARED_SCENE_STATE.lastStripOpacity) > 0.0005
  ) {
    SHARED_SCENE_STATE.lastStripOpacity = stripFade;
    const stripLiftY = -smoothstep(0, 1, heroProgress) * 44;
    STAGE_DOM_REFS.heroBottomBarEl.style.transform = `translate3d(0, ${stripLiftY.toFixed(1)}px, 0)`;
    STAGE_DOM_REFS.heroBottomBarEl.style.opacity = stripFade.toFixed(3);
    STAGE_DOM_REFS.heroBottomBarEl.style.pointerEvents = stripFade < 0.06 ? 'none' : 'auto';
  }

  // Experience & Download scroll progression anchored to real section offsets (#experience and #download)
  const expEnterStart = Math.max(vh * 1.95, offsets.experience - vh * 0.85);
  const expEnterEnd = Math.max(expEnterStart + 1, offsets.experience - vh * 0.08);
  const expHoldEnd = Math.max(expEnterEnd + 1, offsets.download - vh * 0.55);
  const expSettleEnd = Math.max(expHoldEnd + 1, offsets.download + vh * 0.15);
  const expEnter = smoothstep(expEnterStart, expEnterEnd, scrollY);
  const expToDownload = smoothstep(expHoldEnd, expSettleEnd, scrollY);
  const experienceLift = clamp(expEnter * (1 - expToDownload * 0.5), 0, 1);

  const dlStartY = Math.max(offsets.experience + vh * 0.15, offsets.download - vh * 0.85);
  const dlEndY = Math.max(dlStartY + 1, offsets.download - vh * 0.08);
  const downloadArrival = reducedMotion ? 1 : smoothstep(dlStartY, dlEndY, scrollY);

  // 2. Continuous Burgundy Leather Canvas Scroll Continuity (HOME -> FEATURES -> PREVIEW -> EXPERIENCE -> DOWNLOAD)
  if (STAGE_DOM_REFS.leatherStageEl) {
    const clampedTwoScreen = clamp(scrollScreens, 0, 1.45);
    const twoScreenEndY = vh * 1.45;
    const downloadTargetY = Math.max(twoScreenEndY + vh, offsets.download);
    const extendedScrollProgress = smoothstep(
      twoScreenEndY,
      downloadTargetY + vh * 0.15,
      scrollY
    );
    const stageTranslateVh = -clampedTwoScreen * 46 - extendedScrollProgress * 33.0;
    const stageX = px * -8;

    const stageFadeAfterFeatures = 1 - smoothstep(1.35, 2.05, scrollScreens);
    const postPreviewFoldPresence = clamp(
      expEnter * (1 - downloadArrival * 0.16),
      0,
      1
    );
    const combinedFoldPresence = clamp(
      Math.max(stageFadeAfterFeatures, postPreviewFoldPresence * 0.96),
      0,
      1
    );
    const targetStageOpacity = 0.32 + 0.68 * combinedFoldPresence;

    if (
      Math.abs(stageTranslateVh - SHARED_SCENE_STATE.lastStageVh) > 0.005 ||
      Math.abs(stageX - SHARED_SCENE_STATE.lastStageX) > 0.05
    ) {
      SHARED_SCENE_STATE.lastStageVh = stageTranslateVh;
      SHARED_SCENE_STATE.lastStageX = stageX;
      STAGE_DOM_REFS.leatherStageEl.style.transform = `translate3d(${stageX.toFixed(
        1
      )}px, ${stageTranslateVh.toFixed(2)}vh, 0)`;
    }

    const opacityTargetEl =
      STAGE_DOM_REFS.leatherCanvasEl || STAGE_DOM_REFS.leatherStageEl;
    if (Math.abs(targetStageOpacity - SHARED_SCENE_STATE.lastStageOpacity) > 0.001) {
      SHARED_SCENE_STATE.lastStageOpacity = targetStageOpacity;
      opacityTargetEl.style.opacity = targetStageOpacity.toFixed(3);
    }
  }

  if (Math.abs(experienceLift - SHARED_SCENE_STATE.lastExperienceLift) > 0.002) {
    SHARED_SCENE_STATE.lastExperienceLift = experienceLift;
    document.documentElement.style.setProperty(
      '--void-experience-lift',
      experienceLift.toFixed(3)
    );
  }

  if (Math.abs(downloadArrival - SHARED_SCENE_STATE.lastDownloadArrival) > 0.002) {
    SHARED_SCENE_STATE.lastDownloadArrival = downloadArrival;
    const dlEl =
      STAGE_DOM_REFS.downloadSectionEl ||
      (STAGE_DOM_REFS.downloadSectionEl = document.getElementById('download'));
    if (dlEl) {
      dlEl.style.setProperty('--void-download-arrival', downloadArrival.toFixed(3));
    }
    document.documentElement.style.setProperty(
      '--void-download-arrival',
      downloadArrival.toFixed(3)
    );
  }

  // 3. Single Spinning Vinyl Platter Transition:
  // Preserves exact Hero -> Features -> Preview timing & path, and pauses offscreen GPU spin once faded out.
  if (STAGE_DOM_REFS.vinylPlatterEl) {
    const toFeatures = smoothstep(0.0, 0.95, scrollScreens);
    const pastFeatures = smoothstep(1.18, 1.85, scrollScreens);
    const vinylOpacity = 1.0 - pastFeatures;

    if (vinylOpacity <= 0.003) {
      if (!SHARED_SCENE_STATE.vinylHidden) {
        SHARED_SCENE_STATE.vinylHidden = true;
        SHARED_SCENE_STATE.lastVinylOpacity = 0;
        STAGE_DOM_REFS.vinylPlatterEl.style.opacity = '0';
        STAGE_DOM_REFS.vinylPlatterEl.style.visibility = 'hidden';
        if (STAGE_DOM_REFS.vinylSpinningDiscEl) {
          STAGE_DOM_REFS.vinylSpinningDiscEl.style.animationPlayState = 'paused';
        }
      }
    } else {
      if (SHARED_SCENE_STATE.vinylHidden) {
        SHARED_SCENE_STATE.vinylHidden = false;
        STAGE_DOM_REFS.vinylPlatterEl.style.visibility = 'visible';
        if (STAGE_DOM_REFS.vinylSpinningDiscEl) {
          STAGE_DOM_REFS.vinylSpinningDiscEl.style.animationPlayState = 'running';
        }
      }

      const vinylX = toFeatures * 34 + pastFeatures * 22 + px * -10;
      const vinylY = toFeatures * 54 + pastFeatures * 18 + py * -6;
      const vinylScale = 1.0 - toFeatures * 0.14;

      if (
        Math.abs(vinylX - SHARED_SCENE_STATE.lastVinylX) > 0.01 ||
        Math.abs(vinylY - SHARED_SCENE_STATE.lastVinylY) > 0.01 ||
        Math.abs(vinylOpacity - SHARED_SCENE_STATE.lastVinylOpacity) > 0.001
      ) {
        SHARED_SCENE_STATE.lastVinylX = vinylX;
        SHARED_SCENE_STATE.lastVinylY = vinylY;
        SHARED_SCENE_STATE.lastVinylOpacity = vinylOpacity;

        STAGE_DOM_REFS.vinylPlatterEl.style.transform = `translate3d(${vinylX.toFixed(
          2
        )}%, ${vinylY.toFixed(2)}%, 0) scale(${vinylScale.toFixed(3)})`;
        STAGE_DOM_REFS.vinylPlatterEl.style.opacity = vinylOpacity.toFixed(3);
      }
    }
  }

  // Return true if still animating toward target, false if settled (so RAF loop can sleep at 0% CPU!)
  const scrollRemaining = Math.abs(
    SHARED_SCENE_STATE.targetScrollY - SHARED_SCENE_STATE.currentScrollY
  );
  const pointerRemaining =
    Math.abs(SHARED_SCENE_STATE.targetPointerX - SHARED_SCENE_STATE.currentPointerX) +
    Math.abs(SHARED_SCENE_STATE.targetPointerY - SHARED_SCENE_STATE.currentPointerY);

  return scrollRemaining > 0.08 || pointerRemaining > 0.002;
}

export function useScrollAndMotion(
  isPlaying: boolean,
  onSectionThreshold?: (section: NavigationSection, showMiniDock: boolean) => void
): CoordinatedSceneMotion {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [motionState] = useState<CoordinatedSceneMotion>(() => ({
    heroScrollProgress: 0,
    pageScrollProgress: 0,
    scrollVelocity: 0,
    pointerX: 0,
    pointerY: 0,
    elapsedTime: 0,
    reducedMotion: false,
    mainPlayer: { ...INITIAL_TRANSFORM },
    leftPanel: { ...INITIAL_TRANSFORM },
    rightPanel: { ...INITIAL_TRANSFORM },
    heroTextOffsetY: 0,
    heroTextOpacity: 1,
  }));

  useEffect(() => {
    SHARED_SCENE_STATE.onThresholdCallback = onSectionThreshold;
  }, [onSectionThreshold]);

  useEffect(() => {
    SHARED_SCENE_STATE.isPlaying = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      SHARED_SCENE_STATE.reducedMotion = e.matches;
    };
    SHARED_SCENE_STATE.reducedMotion = mediaQuery.matches;
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    STAGE_DOM_REFS.downloadSectionEl = document.getElementById('download');

    const revealElements = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]')
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            target.classList.add('is-revealed');
            target.classList.remove('is-exited-top');
          } else {
            const rect = entry.boundingClientRect;
            const vh = SHARED_SCENE_STATE.viewportH || 800;
            if (rect.top > vh * 0.9) {
              target.classList.remove('is-revealed', 'is-exited-top');
            } else if (rect.bottom < vh * 0.08) {
              target.classList.add('is-exited-top');
            }
          }
        });
      },
      {
        threshold: [0.08, 0.2],
        rootMargin: '0px 0px -36px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      STAGE_DOM_REFS.downloadSectionEl = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId = 0;
    let isLoopRunning = false;
    let prevTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - prevTime) * 0.001;
      prevTime = now;
      const shouldContinue = stepUnifiedSceneMotion(dt);
      if (shouldContinue) {
        rafId = window.requestAnimationFrame(loop);
      } else {
        isLoopRunning = false;
      }
    };

    const wakeLoop = () => {
      if (!isLoopRunning) {
        isLoopRunning = true;
        prevTime = performance.now();
        rafId = window.requestAnimationFrame(loop);
      }
    };

    const updateDimensions = () => {
      const vh = Math.max(600, window.innerHeight);
      SHARED_SCENE_STATE.viewportH = vh;
      SHARED_SCENE_STATE.docH = Math.max(
        1,
        document.documentElement.scrollHeight - vh
      );
      const scrollTopNow = window.scrollY || window.pageYOffset || 0;
      const getTop = (id: string, fallback: number) => {
        const el = document.getElementById(id);
        if (!el) return fallback;
        const rect = el.getBoundingClientRect();
        return rect.top + scrollTopNow;
      };
      SHARED_SCENE_STATE.sectionOffsets = {
        features: getTop('features', vh * 0.9),
        preview: getTop('preview', vh * 1.9),
        experience: getTop('experience', vh * 2.9),
        download: getTop('download', vh * 3.9),
      };
      wakeLoop();
    };

    let lastRawScrollY = window.scrollY || window.pageYOffset || 0;
    let navbarHidden = false;
    let navbarEl = document.querySelector<HTMLElement>('.void-noir-navbar');

    // High-frequency scroll listener reads window.scrollY, updates navbar visibility, and wakes the RAF loop
    const handleScroll = () => {
      const currentRawY = window.scrollY || window.pageYOffset || 0;
      const deltaY = currentRawY - lastRawScrollY;

      if (!navbarEl) {
        navbarEl = document.querySelector<HTMLElement>('.void-noir-navbar');
      }

      if (navbarEl) {
        if (currentRawY <= 36 || deltaY < -1.2) {
          if (navbarHidden) {
            navbarHidden = false;
            navbarEl.classList.remove('is-hidden');
          }
        } else if (deltaY > 3.5 && currentRawY > 56) {
          if (!navbarHidden) {
            navbarHidden = true;
            navbarEl.classList.add('is-hidden');
          }
        }
      }

      lastRawScrollY = currentRawY;
      SHARED_SCENE_STATE.targetScrollY = currentRawY;
      wakeLoop();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      SHARED_SCENE_STATE.targetPointerX = clamp(nx, -1, 1);
      SHARED_SCENE_STATE.targetPointerY = clamp(ny, -1, 1);
      wakeLoop();
    };

    const initialY = window.scrollY || window.pageYOffset || 0;
    SHARED_SCENE_STATE.targetScrollY = initialY;
    SHARED_SCENE_STATE.currentScrollY = initialY;
    SHARED_SCENE_STATE.prevScrollY = initialY;

    updateDimensions();
    stepUnifiedSceneMotion(0.016);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(document.body);
    }

    window.addEventListener('resize', updateDimensions, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return {
    ...motionState,
    reducedMotion,
  };
}
