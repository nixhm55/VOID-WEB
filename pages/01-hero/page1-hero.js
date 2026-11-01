/**
 * PAGE 1: HERO SECTION MODULE (page1-hero.js)
 * - Ayla-style Kinetic "void" Wordmark Animation
 * - 5-CD 3D Diagonal Catmull-Rom Spline Engine
 * - Per-CD Soft 2nd-Order Spring Cursor Hover Physics & Parallax
 * - Velocity-Proportional Directional Motion Stretch & Blur
 * - GPU-Optimized Three.js Ambient Optical Depth Layer (with DPR cap & offscreen culling)
 * - Retina 1000x1000 Album Artwork Upgrader
 */

window.VoidPage1Hero = (() => {
  let heroWrapper = null;
  let heroSticky = null;
  let cdStage = null;
  let editorialInfo = null;
  let pressQuotes = null;
  let cdItems = [];
  let cdArts = [];
  let cdShadows = [];
  let lastRenderedShift = -999;
  let lastRenderedMouseX = -999;
  let lastRenderedMouseY = -999;
  let lastRenderedFloat = -999;
  let lastRenderedVel = -999;

  // Per-CD soft 2nd-order spring state for cursor hover
  let cdHoverSprings = [];
  let anyCdHoverActive = false;

  // Three.js WebGL Ambient Depth Layer state
  let threeRenderer = null;
  let threeScene = null;
  let threeCamera = null;
  let threeMesh = null;
  let threeGeometry = null;
  let threeMaterial = null;
  let isHeroVisible = true;
  let visibilityObserver = null;

  const PATH_ANCHORS = [
    { u: -3.0, x: -90.0, y: 98.0, scale: 0.50, rot: -210 },
    { u: -2.0, x: -62.0, y: 86.0, scale: 0.56, rot: -160 },
    { u: -1.0, x: -34.0, y: 76.0, scale: 0.62, rot: -110 },
    { u: 0.0,  x: -7.5,  y: 66.8, scale: 0.71, rot: -42 },
    { u: 1.0,  x: 21.2,  y: 60.8, scale: 0.81, rot: -16 },
    { u: 2.0,  x: 51.5,  y: 50.8, scale: 1.00, rot: 0 },
    { u: 3.0,  x: 88.2,  y: 29.8, scale: 0.95, rot: 22 },
    { u: 4.0,  x: 124.5, y: 7.5,  scale: 0.90, rot: 58 },
  ];

  function evaluateSplineExact(u) {
    const minU = PATH_ANCHORS[0].u;
    const maxU = PATH_ANCHORS[PATH_ANCHORS.length - 1].u;
    const clampedU = u < minU ? minU : u > maxU ? maxU : u;

    let idx = 0;
    for (let i = 0; i < PATH_ANCHORS.length - 1; i++) {
      if (clampedU >= PATH_ANCHORS[i].u && clampedU <= PATH_ANCHORS[i + 1].u) {
        idx = i;
        break;
      }
    }

    const p0 = PATH_ANCHORS[idx > 0 ? idx - 1 : 0];
    const p1 = PATH_ANCHORS[idx];
    const p2 = PATH_ANCHORS[idx + 1];
    const p3 = PATH_ANCHORS[idx + 2 < PATH_ANCHORS.length ? idx + 2 : PATH_ANCHORS.length - 1];

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

  function stepSoftSpring(state, target, stiffness, damping, dt) {
    const force = (target - state.pos) * stiffness - state.vel * damping;
    state.vel += force * dt;
    state.pos += state.vel * dt;
    if (Math.abs(target - state.pos) < 0.0004 && Math.abs(state.vel) < 0.0008) {
      state.pos = target;
      state.vel = 0;
      return false;
    }
    return true;
  }

  function initVoidKineticWordmark() {
    const slotV = document.getElementById('vkSlotV');
    const slotO = document.getElementById('vkSlotO');
    const slotI = document.getElementById('vkSlotI');
    const slotD = document.getElementById('vkSlotD');

    const charV = document.getElementById('vkCharV');
    const charO = document.getElementById('vkCharO');
    const charI = document.getElementById('vkCharI');
    const charD = document.getElementById('vkCharD');

    const symPlay = document.getElementById('vkSymPlay');
    const symPause = document.getElementById('vkSymPause');
    const symGraph = document.getElementById('vkSymGraph');
    const symPrev = document.getElementById('vkSymPrev');

    if (
      !slotV || !slotO || !slotI || !slotD ||
      !charV || !charO || !charI || !charD ||
      !symPlay || !symPause || !symGraph || !symPrev
    ) {
      return;
    }

    const allItems = [
      charV, charO, charI, charD,
      symPlay, symPause, symGraph, symPrev,
    ];

    const WIDTHS = {
      v: 9.2,
      o: 9.6,
      i: 5.0,
      d: 10.0,
      play: 10.0,
      pause: 9.2,
      graph: 10.6,
      prev: 10.6,
    };

    function computeSlotCenters(w0, w1, w2, w3, g01, g12, g23) {
      const total = w0 + g01 + w1 + g12 + w2 + g23 + w3;
      const start = -total * 0.5;
      const c0 = start + w0 * 0.5;
      const c1 = start + w0 + g01 + w1 * 0.5;
      const c2 = start + w0 + g01 + w1 + g12 + w2 * 0.5;
      const c3 = start + w0 + g01 + w1 + g12 + w2 + g23 + w3 * 0.5;
      return [c0, c1, c2, c3];
    }

    const STATES = [
      {
        active: [charV, charO, charI, charD],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.o, WIDTHS.i, WIDTHS.d, -0.5, -0.4, -0.5),
        holdMs: 1450,
      },
      {
        active: [charV, symPlay, charI, charD],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.play, WIDTHS.i, WIDTHS.d, 0.9, 0.8, -0.5),
        holdMs: 1200,
      },
      {
        active: [charV, charO, charI, symPause],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.o, WIDTHS.i, WIDTHS.pause, -0.5, -0.4, 0.9),
        holdMs: 1200,
      },
      {
        active: [charV, charO, symGraph, charD],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.o, WIDTHS.graph, WIDTHS.d, -0.5, 0.9, 0.7),
        holdMs: 1200,
      },
      {
        active: [charV, symPrev, charI, charD],
        centers: computeSlotCenters(WIDTHS.v, WIDTHS.prev, WIDTHS.i, WIDTHS.d, 0.9, 0.9, -0.5),
        holdMs: 1200,
      },
    ];

    function applyState(st) {
      const [xV, xO, xI, xD] = st.centers;
      slotV.style.transform = `translate3d(${xV.toFixed(2)}px, 0px, 0px)`;
      slotO.style.transform = `translate3d(${xO.toFixed(2)}px, 0px, 0px)`;
      slotI.style.transform = `translate3d(${xI.toFixed(2)}px, 0px, 0px)`;
      slotD.style.transform = `translate3d(${xD.toFixed(2)}px, 0px, 0px)`;

      for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        if (st.active.includes(item)) {
          item.classList.add('is-active');
        } else {
          item.classList.remove('is-active');
        }
      }
    }

    let step = 0;
    applyState(STATES[step]);

    function scheduleNext() {
      const delay = STATES[step].holdMs;
      window.setTimeout(() => {
        step = (step + 1) % STATES.length;
        applyState(STATES[step]);
        scheduleNext();
      }, delay);
    }

    scheduleNext();
  }

  /**
   * Three.js GPU-Optimized Ambient Optical Depth Layer
   */
  function initThreeOpticalDepthLayer() {
    if (!window.THREE || !heroSticky) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    try {
      const THREE = window.THREE;
      const existingCanvas = document.getElementById('heroThreeOpticalCanvas');
      if (existingCanvas) existingCanvas.remove();

      const canvas = document.createElement('canvas');
      canvas.id = 'heroThreeOpticalCanvas';
      canvas.className = 'hero-three-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      heroSticky.insertBefore(canvas, heroSticky.firstChild);

      threeRenderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: false,
      });

      const cappedDpr = Math.min(window.devicePixelRatio || 1, 1.75);
      threeRenderer.setPixelRatio(cappedDpr);
      threeRenderer.setSize(window.innerWidth, window.innerHeight, false);
      threeRenderer.setClearColor(0x000000, 0);

      threeScene = new THREE.Scene();
      threeCamera = new THREE.PerspectiveCamera(
        45,
        (window.innerWidth || 1) / (window.innerHeight || 1),
        0.1,
        50
      );
      threeCamera.position.z = 8;

      const count = 36;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 14;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }

      threeGeometry = new THREE.BufferGeometry();
      threeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      threeMaterial = new THREE.PointsMaterial({
        color: 0x141413,
        size: 0.032,
        transparent: true,
        opacity: 0.075,
        depthWrite: false,
      });

      threeMesh = new THREE.Points(threeGeometry, threeMaterial);
      threeScene.add(threeMesh);

      if ('IntersectionObserver' in window) {
        visibilityObserver = new IntersectionObserver(
          (entries) => {
            for (let i = 0; i < entries.length; i++) {
              isHeroVisible = entries[i].isIntersecting;
            }
          },
          { threshold: 0.01 }
        );
        visibilityObserver.observe(heroSticky);
      }

      threeRenderer.render(threeScene, threeCamera);
    } catch (_) {
      disposeThreeLayer();
    }
  }

  function resizeThreeLayer() {
    if (!threeRenderer || !threeCamera) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const cappedDpr = Math.min(window.devicePixelRatio || 1, 1.75);
    threeRenderer.setPixelRatio(cappedDpr);
    threeRenderer.setSize(w, h, false);
    threeCamera.aspect = w / h;
    threeCamera.updateProjectionMatrix();
    if (isHeroVisible && threeScene) {
      threeRenderer.render(threeScene, threeCamera);
    }
  }

  function disposeThreeLayer() {
    if (visibilityObserver) {
      visibilityObserver.disconnect();
      visibilityObserver = null;
    }
    if (threeGeometry) {
      threeGeometry.dispose();
      threeGeometry = null;
    }
    if (threeMaterial) {
      threeMaterial.dispose();
      threeMaterial = null;
    }
    if (threeRenderer) {
      threeRenderer.dispose();
      threeRenderer = null;
    }
    threeScene = null;
    threeCamera = null;
    threeMesh = null;
  }

  function optimizeAndUpgradeTextures() {
    cdArts.forEach((img) => {
      if (img && typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });

    const artImages = Array.from(document.querySelectorAll('.cd-art[data-itunes-id]'));

    artImages.forEach((img) => {
      const itunesId = img.getAttribute('data-itunes-id');
      if (!itunesId) return;

      const cacheKey = `void_art_1000_${itunesId}`;
      try {
        const cachedUrl = sessionStorage.getItem(cacheKey);
        if (cachedUrl) {
          img.src = cachedUrl;
          return;
        }
      } catch (_) {}

      const callbackName = `voidArtCb_${itunesId}_${Math.floor(Math.random() * 1e6)}`;
      const script = document.createElement('script');

      window[callbackName] = (data) => {
        try {
          if (data && data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
            const retinaUrl = data.results[0].artworkUrl100.replace(
              '100x100bb.jpg',
              '1000x1000bb.jpg'
            );
            try {
              sessionStorage.setItem(cacheKey, retinaUrl);
            } catch (_) {}
            const preload = new Image();
            preload.decoding = 'async';
            preload.src = retinaUrl;
            if (typeof preload.decode === 'function') {
              preload
                .decode()
                .then(() => {
                  img.src = retinaUrl;
                })
                .catch(() => {});
            } else {
              preload.onload = () => {
                img.src = retinaUrl;
              };
            }
          }
        } finally {
          delete window[callbackName];
          script.remove();
        }
      };

      script.onerror = () => {
        delete window[callbackName];
        script.remove();
      };

      script.src = `https://itunes.apple.com/lookup?id=${encodeURIComponent(itunesId)}&callback=${callbackName}`;
      document.body.appendChild(script);
    });
  }

  function init() {
    heroWrapper = document.getElementById('heroScrollWrapper');
    heroSticky = document.getElementById('heroSticky');
    cdStage = document.getElementById('cdStage');
    editorialInfo = document.querySelector('.editorial-info');
    pressQuotes = document.querySelector('.press-quotes');
    cdItems = Array.from(document.querySelectorAll('.cd-item'));
    cdArts = cdItems.map((item) => item.querySelector('.cd-art'));
    cdShadows = cdItems.map((item) => item.querySelector('.cd-shadow'));
    lastRenderedShift = -999;
    lastRenderedMouseX = -999;
    lastRenderedMouseY = -999;
    lastRenderedFloat = -999;
    lastRenderedVel = -999;

    cdHoverSprings = cdItems.map(() => ({
      targetHover: 0,
      hover: { pos: 0, vel: 0 },
      targetDx: 0,
      targetDy: 0,
      dx: { pos: 0, vel: 0 },
      dy: { pos: 0, vel: 0 },
      active: false,
    }));

    cdItems.forEach((item, idx) => {
      item.style.pointerEvents = 'auto';
      item.addEventListener(
        'pointerenter',
        (e) => {
          if (e.pointerType === 'touch') return;
          const sp = cdHoverSprings[idx];
          if (!sp) return;
          sp.targetHover = 1;
          sp.active = true;
          anyCdHoverActive = true;
        },
        { passive: true }
      );
      item.addEventListener(
        'pointermove',
        (e) => {
          if (e.pointerType === 'touch') return;
          const sp = cdHoverSprings[idx];
          if (!sp) return;
          const rect = item.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
          const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
          sp.targetHover = 1;
          sp.targetDx = nx * 0.48;
          sp.targetDy = ny * 0.48;
          sp.active = true;
          anyCdHoverActive = true;
        },
        { passive: true }
      );
      item.addEventListener(
        'pointerleave',
        () => {
          const sp = cdHoverSprings[idx];
          if (!sp) return;
          sp.targetHover = 0;
          sp.targetDx = 0;
          sp.targetDy = 0;
          sp.active = true;
          anyCdHoverActive = true;
        },
        { passive: true }
      );
    });

    initVoidKineticWordmark();
    initThreeOpticalDepthLayer();

    if (document.readyState === 'complete') {
      optimizeAndUpgradeTextures();
    } else {
      window.addEventListener('load', optimizeAndUpgradeTextures, { once: true });
    }
  }

  function stepHoverSpring(dt) {
    if (!cdHoverSprings.length) return false;
    const clampedDt = Math.min(0.025, dt);
    const stiffness = 62.0;
    const damping = 10.8;
    let stillMoving = false;

    for (let i = 0; i < cdHoverSprings.length; i++) {
      const sp = cdHoverSprings[i];
      if (!sp.active && sp.targetHover === 0) continue;
      const m1 = stepSoftSpring(sp.hover, sp.targetHover, stiffness, damping, clampedDt);
      const m2 = stepSoftSpring(sp.dx, sp.targetDx, stiffness, damping, clampedDt);
      const m3 = stepSoftSpring(sp.dy, sp.targetDy, stiffness, damping, clampedDt);
      sp.active = m1 || m2 || m3;
      if (sp.active) stillMoving = true;
    }

    anyCdHoverActive = stillMoving;
    return stillMoving;
  }

  function render(
    shift,
    mouseX = 0,
    mouseY = 0,
    floatPhase = 0,
    shiftVelocity = 0,
    force = false
  ) {
    if (!cdItems.length) return;

    const shiftDelta = Math.abs(shift - lastRenderedShift);
    const mouseDelta =
      Math.abs(mouseX - lastRenderedMouseX) + Math.abs(mouseY - lastRenderedMouseY);
    const floatDelta = Math.abs(floatPhase - lastRenderedFloat);
    const velDelta = Math.abs(shiftVelocity - lastRenderedVel);

    if (
      !force &&
      !anyCdHoverActive &&
      shiftDelta <= 0.00001 &&
      mouseDelta <= 0.00015 &&
      floatDelta <= 0.0005 &&
      velDelta <= 0.001
    ) {
      return;
    }

    lastRenderedShift = shift;
    lastRenderedMouseX = mouseX;
    lastRenderedMouseY = mouseY;
    lastRenderedFloat = floatPhase;
    lastRenderedVel = shiftVelocity;

    for (let i = 0; i < cdItems.length; i++) {
      const u = i - shift;
      const pose = evaluateSplineExact(u);
      const sp = cdHoverSprings[i];

      const hPos = sp ? sp.hover.pos : 0;
      const hDx = sp ? sp.dx.pos : 0;
      const hDy = sp ? sp.dy.pos : 0;

      // Subtle depth-weighted mouse parallax + organic floating + soft cursor spring
      const focusWeight = Math.exp(-Math.pow(u - 2.0, 2) * 0.42);
      const depthFactor = 0.35 + 0.65 * focusWeight;
      const floatWaveY = Math.sin(floatPhase * 1.35 + i * 1.15) * (0.22 * depthFactor);
      const floatWaveX = Math.cos(floatPhase * 1.05 + i * 0.9) * (0.12 * depthFactor);

      const parallaxX = mouseX * (0.52 * depthFactor) + floatWaveX + hDx;
      const parallaxY = mouseY * (0.42 * depthFactor) + floatWaveY + hDy - hPos * 0.38;
      const finalX = pose.x + parallaxX;
      const finalY = pose.y + parallaxY;
      const finalScale = pose.scale * (1 + hPos * 0.016);

      cdItems[i].style.transform = `translate3d(${finalX.toFixed(3)}vw, ${finalY.toFixed(3)}vh, 0px) scale3d(${finalScale.toFixed(4)}, ${finalScale.toFixed(4)}, 1)`;

      const art = cdArts[i];
      if (art) {
        const microRot = pose.rot + mouseX * (2.2 * depthFactor) + hDx * 6.5 - shiftVelocity * 3.8;
        art.style.transform = `rotateZ(${microRot.toFixed(3)}deg) translateZ(0)`;
      }

      const shadow = cdShadows[i];
      if (shadow) {
        const shX = -1.2 - mouseX * (0.45 * depthFactor) - hDx * 0.6;
        const shY = 3.8 - mouseY * (0.45 * depthFactor) + hPos * 0.85;
        shadow.style.transform = `translate3d(${shX.toFixed(2)}%, ${shY.toFixed(2)}%, 0) rotateZ(-31deg) scaleY(0.83)`;
      }
    }

    if (editorialInfo) {
      const edX = mouseX * -2.8;
      const edY = mouseY * -2.0;
      editorialInfo.style.transform = `translate3d(${edX.toFixed(2)}px, ${edY.toFixed(2)}px, 0px)`;
    }

    if (pressQuotes) {
      const pqX = mouseX * -2.2;
      const pqY = mouseY * -1.6;
      pressQuotes.style.transform = `translate3d(calc(-50% + ${pqX.toFixed(2)}px), ${pqY.toFixed(2)}px, 0px)`;
    }

    if (threeRenderer && threeScene && threeCamera && threeMesh && isHeroVisible) {
      threeMesh.rotation.y = mouseX * 0.08 + shift * 0.18;
      threeMesh.rotation.x = -mouseY * 0.06 + Math.sin(floatPhase * 0.6) * 0.02;
      threeMesh.position.y = shift * 0.55;
      threeRenderer.render(threeScene, threeCamera);
    }
  }

  function getWrapper() {
    return heroWrapper || document.getElementById('heroScrollWrapper');
  }

  return {
    init,
    render,
    stepHoverSpring,
    resize: resizeThreeLayer,
    dispose: disposeThreeLayer,
    getWrapper,
  };
})();
