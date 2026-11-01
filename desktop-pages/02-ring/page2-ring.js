/**
 * PAGE 2 (NEW): 3D CURVED CYLINDRICAL RIBBON RING MODULE (page2-ring.js)
 * - 12 outer artist images from public/ring/outer/ and 12 inner song covers from public/ring/inner/
 * - Replace the numbered JPEG samples with your own images while keeping the same filenames.
 * - 2x Supersampled 4K Retina Rasterization (`R_OUTER = 1040`, `STRIP_HEIGHT_PX = 532`, `scale3d(0.5, 0.5, 0.5)`)
 *   so every artist portrait renders at ultra-crisp 4K sharpness while preserving 100% identical shape, size, and motion!
 */

window.VoidPage2Ring = (() => {
  let ringSection = null;
  let ringViewport = null;
  let tiltRig = null;
  let spinDrum = null;

  let outerStripEls = []; // [slotIdx][subIdx]
  let innerStripEls = []; // [slotIdx][subIdx]

  let isInViewport = true;
  let visibilityObserver = null;
  let spinDeg = 0;

  const SLOT_COUNT = 12;
  const SUB_STRIPS_PER_SLOT = 10; // 12 * 10 = 120 curved facets around 360 deg (3.0 deg per facet)
  const TOTAL_STRIPS = SLOT_COUNT * SUB_STRIPS_PER_SLOT;

  // 2x Supersampled 4K internal dimensions paired with scale3d(0.5, 0.5, 0.5) on tiltRig
  // Visual size on screen is 100% identical (1040 * 0.5 = 520px, 532 * 0.5 = 266px), with 4x pixel density!
  const R_OUTER = 1040;
  const R_INNER = 1039.1;
  const STRIP_HEIGHT_PX = 532;
  const CAMERA_Z_OFFSET = -525;

  // Put artist JPEGs in public/ring/outer/ and list their public paths here.
  // Example: public/ring/outer/6.jpeg is referenced as '/ring/outer/6.jpeg'.
  const DEFAULT_ARTISTS = [
    { title: 'ARTIST 01', sub: 'OUTER JPEG 01', img: '/ring/outer/1.jpeg' },
    { title: 'ARTIST 02', sub: 'OUTER JPEG 02', img: '/ring/outer/2.jpeg' },
    { title: 'ARTIST 03', sub: 'OUTER JPEG 03', img: '/ring/outer/3.jpeg' },
    { title: 'ARTIST 04', sub: 'OUTER JPEG 04', img: '/ring/outer/4.jpeg' },
    { title: 'ARTIST 05', sub: 'OUTER JPEG 05', img: '/ring/outer/5.jpeg' },
    { title: 'ARTIST 06', sub: 'OUTER JPEG 06', img: '/ring/outer/6.jpeg' },
    { title: 'ARTIST 07', sub: 'OUTER JPEG 07', img: '/ring/outer/7.jpeg' },
    { title: 'ARTIST 08', sub: 'OUTER JPEG 08', img: '/ring/outer/8.jpeg' },
    { title: 'ARTIST 09', sub: 'OUTER JPEG 09', img: '/ring/outer/9.jpeg' },
    { title: 'ARTIST 10', sub: 'OUTER JPEG 10', img: '/ring/outer/10.jpeg' },
    { title: 'ARTIST 11', sub: 'OUTER JPEG 11', img: '/ring/outer/11.jpeg' },
    { title: 'ARTIST 12', sub: 'OUTER JPEG 12', img: '/ring/outer/12.jpeg' },
  ];

  // Put song-cover JPEGs in public/ring/inner/ and use their public paths here.
  const DEFAULT_COVERS = [
    { title: 'SONG 01', sub: 'INNER JPEG 01', img: '/ring/inner/1.jpeg' },
    { title: 'SONG 02', sub: 'INNER JPEG 02', img: '/ring/inner/2.jpeg' },
    { title: 'SONG 03', sub: 'INNER JPEG 03', img: '/ring/inner/3.jpeg' },
    { title: 'SONG 04', sub: 'INNER JPEG 04', img: '/ring/inner/4.jpeg' },
    { title: 'SONG 05', sub: 'INNER JPEG 05', img: '/ring/inner/5.jpeg' },
    { title: 'SONG 06', sub: 'INNER JPEG 06', img: '/ring/inner/6.jpeg' },
    { title: 'SONG 07', sub: 'INNER JPEG 07', img: '/ring/inner/7.jpeg' },
    { title: 'SONG 08', sub: 'INNER JPEG 08', img: '/ring/inner/8.jpeg' },
    { title: 'SONG 09', sub: 'INNER JPEG 09', img: '/ring/inner/9.jpeg' },
    { title: 'SONG 10', sub: 'INNER JPEG 10', img: '/ring/inner/10.jpeg' },
    { title: 'SONG 11', sub: 'INNER JPEG 11', img: '/ring/inner/11.jpeg' },
    { title: 'SONG 12', sub: 'INNER JPEG 12', img: '/ring/inner/12.jpeg' },
  ];

  function applySlotImageToSubStrips(stripArray, slotIdx, imageUrl, isInner) {
    const slotStrips = stripArray[slotIdx];
    if (!slotStrips || !imageUrl) return;

    for (let s = 0; s < SUB_STRIPS_PER_SLOT; s++) {
      const faceEl = slotStrips[s];
      if (!faceEl) continue;
      // For inner faces, rotateY(180deg) reverses left-to-right order, so we invert sub-strip index
      const uIndex = isInner ? SUB_STRIPS_PER_SLOT - 1 - s : s;
      const pct = (uIndex / (SUB_STRIPS_PER_SLOT - 1)) * 100;

      if (isInner) {
        // Baked linear-gradient inner shading (zero CSS filter so Safari never flattens preserve-3d)
        faceEl.style.backgroundImage = `linear-gradient(180deg, rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.22)), url("${imageUrl}")`;
      } else {
        faceEl.style.backgroundImage = `url("${imageUrl}")`;
      }
      faceEl.style.backgroundSize = `${SUB_STRIPS_PER_SLOT * 100}% 100%`;
      faceEl.style.backgroundPosition = `${pct.toFixed(4)}% 50%`;
    }
  }

  function preloadRingTextures() {
    [...DEFAULT_ARTISTS, ...DEFAULT_COVERS].forEach((item) => {
      if (!item || !item.img) return;
      const img = new Image();
      img.decoding = 'async';
      img.src = item.img;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    });
  }

  function buildCylinderDOM() {
    if (!spinDrum) return;
    spinDrum.innerHTML = '';
    outerStripEls = Array.from({ length: SLOT_COUNT }, () => []);
    innerStripEls = Array.from({ length: SLOT_COUNT }, () => []);

    const angleStepDeg = 360 / TOTAL_STRIPS; // 3.0 deg per strip (120 strips total)
    const halfAngleRad = (angleStepDeg * Math.PI) / 360;

    // Exact inscribed polygon apothem & chord width so adjacent strips meet cleanly at vertices
    const outerApothem = R_OUTER * Math.cos(halfAngleRad);
    const outerChordWidth = 2 * R_OUTER * Math.sin(halfAngleRad) + 1.1;
    const outerHalfWidth = outerChordWidth * 0.5;

    const innerApothem = R_INNER * Math.cos(halfAngleRad);
    const innerChordWidth = 2 * R_INNER * Math.sin(halfAngleRad) + 1.1;
    const innerHalfWidth = innerChordWidth * 0.5;

    const halfHeight = (STRIP_HEIGHT_PX * 0.5).toFixed(1);
    const frag = document.createDocumentFragment();

    for (let slotIdx = 0; slotIdx < SLOT_COUNT; slotIdx++) {
      for (let subIdx = 0; subIdx < SUB_STRIPS_PER_SLOT; subIdx++) {
        const globalStripIdx = slotIdx * SUB_STRIPS_PER_SLOT + subIdx;
        const thetaDeg = globalStripIdx * angleStepDeg;

        // 1. Outer Face (Artist Slot)
        const outerFace = document.createElement('div');
        outerFace.className = 'cyl-face cyl-face-outer';
        outerFace.style.width = `${outerChordWidth.toFixed(2)}px`;
        outerFace.style.left = `-${outerHalfWidth.toFixed(2)}px`;
        outerFace.style.top = `-${halfHeight}px`;
        outerFace.style.height = `${STRIP_HEIGHT_PX}px`;
        outerFace.style.transform = `rotateY(${thetaDeg.toFixed(2)}deg) translateZ(${outerApothem.toFixed(2)}px)`;

        // 2. Inner Face (Song Cover Slot) — paper-thin radial separation so corners connect seamlessly
        const innerFace = document.createElement('div');
        innerFace.className = 'cyl-face cyl-face-inner';
        innerFace.style.width = `${innerChordWidth.toFixed(2)}px`;
        innerFace.style.left = `-${innerHalfWidth.toFixed(2)}px`;
        innerFace.style.top = `-${halfHeight}px`;
        innerFace.style.height = `${STRIP_HEIGHT_PX}px`;
        innerFace.style.transform = `rotateY(${thetaDeg.toFixed(2)}deg) translateZ(${innerApothem.toFixed(2)}px) rotateY(180deg)`;

        frag.appendChild(outerFace);
        frag.appendChild(innerFace);

        outerStripEls[slotIdx][subIdx] = outerFace;
        innerStripEls[slotIdx][subIdx] = innerFace;
      }
    }

    spinDrum.appendChild(frag);

    // Populate 12 outer artist slots & 12 inner song cover slots
    for (let i = 0; i < SLOT_COUNT; i++) {
      const artistItem = DEFAULT_ARTISTS[i % DEFAULT_ARTISTS.length];
      const coverItem = DEFAULT_COVERS[i % DEFAULT_COVERS.length];
      applySlotImageToSubStrips(outerStripEls, i, artistItem.img, false);
      applySlotImageToSubStrips(innerStripEls, i, coverItem.img, true);
    }

    preloadRingTextures();
  }

  /**
   * Public API to update the 12 Outer Artist photos and 12 Inner Song Covers
   * @param {Object} config - { artists: string[], covers: string[] }
   */
  function setRingMedia(config = {}) {
    if (Array.isArray(config.artists)) {
      config.artists.slice(0, SLOT_COUNT).forEach((url, idx) => {
        if (url) applySlotImageToSubStrips(outerStripEls, idx, url, false);
      });
    }
    if (Array.isArray(config.covers)) {
      config.covers.slice(0, SLOT_COUNT).forEach((url, idx) => {
        if (url) applySlotImageToSubStrips(innerStripEls, idx, url, true);
      });
    }
  }

  function init() {
    ringSection = document.getElementById('cylinderRingSection');
    ringViewport = document.getElementById('cylinderRingViewport');
    tiltRig = document.getElementById('cylinderTiltRig');
    spinDrum = document.getElementById('cylinderSpinDrum');

    buildCylinderDOM();

    if ('IntersectionObserver' in window && ringSection) {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          for (let i = 0; i < entries.length; i++) {
            isInViewport = entries[i].isIntersecting;
          }
        },
        { threshold: 0.01 }
      );
      visibilityObserver.observe(ringSection);
    } else {
      isInViewport = true;
    }
  }

  let lastTiltTransform = '';

  /**
   * Called from master animation loop in script.js.
   * Strictly only rotates when `isInViewport` is true!
   */
  function render(entryProg, dt = 0.016, scrollVel = 0, mouseX = 0, mouseY = 0, force = false) {
    if (!spinDrum || !tiltRig) return;

    // Hard stop when offscreen — zero GPU/CPU usage when user is on other sections!
    if (!isInViewport && !force) {
      return;
    }

    // Continuous smooth rotation (~19.5 deg/sec) with subtle scroll momentum
    const baseSpinDegPerSec = 19.5;
    const scrollBoost = Math.max(-32, Math.min(32, scrollVel * 0.01));
    spinDeg = (spinDeg - (baseSpinDegPerSec + scrollBoost) * dt) % 360;

    spinDrum.style.transform = `rotateY(${spinDeg.toFixed(3)}deg)`;

    // Pushed back in Z (-525px) + tilted 3D cylinder orientation + 0.5x supersampled scale
    const rotZ = -21.5 - mouseX * 1.2;
    const rotX = -24.5 + mouseY * 1.4;
    const nextTiltTransform = `translate3d(0px, 0px, ${CAMERA_Z_OFFSET}px) rotateZ(${rotZ.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) scale3d(0.5, 0.5, 0.5)`;
    if (nextTiltTransform !== lastTiltTransform) {
      tiltRig.style.transform = nextTiltTransform;
      lastTiltTransform = nextTiltTransform;
    }
  }

  function resize() {}

  function getWrapper() {
    return ringSection || document.getElementById('cylinderRingSection');
  }

  function isActiveInViewport() {
    return isInViewport;
  }

  return {
    init,
    render,
    resize,
    setRingMedia,
    getWrapper,
    isActiveInViewport,
  };
})();
