/**
 * PAGE 3: LOCKED BUTTERFLY & MACINTOSH SHOWCASE + 3D TRAIN WALK-IN DOWNLOAD MODULE (page3-showcase.js)
 * - Stage 1 (z: 0.0 -> 0.54): Macintosh exterior walk-in into the White Screen (100% untouched).
 * - Stage 2 (z: 0.42 -> 0.97): The exact moment the Train & Download Box start becoming faintly
 *   visible through the white screen (z ≈ 0.44), they are ALREADY gently scrolling/gliding forward
 *   using a C2 Hermite curve (non-zero initial velocity -> smooth ramp to normal speed), eliminating
 *   any pause while fading in from white!
 */

window.VoidPage3Showcase = (() => {
  let page3Section = null;
  let page3MediaFrame = null;
  let page3CameraRig = null;
  let page3Photo = null;
  let page3BlurEdge = null;
  let page3TopSunlight = null;
  let page3TopWhiteSeam = null;
  let page3ScreenBloom = null;
  let page3WhitePortal = null;

  // Train & Centered Glass Download Stage Elements
  let page3VisionStage = null;
  let vpEnvironmentBg = null;
  let vpSpatialAssembly = null;
  let visionBgImage = null;
  let visionBgBlur = null;

  let activeObjectUrl = null;
  let activeVisionBgUrl = null;
  let activeMeadowBlurUrl = null;
  let activeTrainBlurUrl = null;

  let lastRenderedPage3 = -999;
  let lastRenderedFlight = -999;
  let lastRenderedVel = -999;
  let lastRenderedMouseX = -999;
  let lastRenderedMouseY = -999;

  // IndexedDB keys where user's uploaded photos are stored in Safari
  const DB_NAME = 'VoidPage3PhotoDB';
  const STORE_NAME = 'photos';
  const PHOTO_KEY = 'page3_custom_user_photo_v2';
  const LEGACY_KEY = 'page3_hero_photo';
  const VISION_BG_KEY = 'page3_vision_pro_env_bg_v1';
  const INITIAL_PUBLIC_BG_SIZE = 8151010;

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function smootherstep01(t) {
    const c = clamp01(t);
    return c * c * c * (c * (c * 6 - 15) + 10);
  }

  /**
   * Cubic Hermite curve with gentle immediate initial velocity (m0 = 0.65) at t = 0
   * that smoothly ramps into normal cruising speed (slope ~1.30) as the train becomes
   * fully visible, then settles softly at t = 1.0.
   * Ensures ZERO pause while fading out of the white Macintosh screen!
   */
  function hermiteImmediateGlide01(t) {
    const c = clamp01(t);
    const c2 = c * c;
    const c3 = c2 * c;
    const m0 = 0.65;
    return m0 * (c3 - 2 * c2 + c) + (3 * c2 - 2 * c3);
  }

  function buildPrebakedRadialBlurTexture(sourceImg, centerXRatio, centerYRatio, callback) {
    if (!sourceImg) return;
    const runBake = () => {
      try {
        const w = 512;
        const h = 320;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.filter = 'blur(10px) saturate(1.12)';
        ctx.drawImage(sourceImg, -16, -16, w + 32, h + 32);
        ctx.filter = 'none';

        ctx.globalCompositeOperation = 'destination-out';
        const cx = w * centerXRatio;
        const cy = h * centerYRatio;
        const maxR = Math.hypot(w, h) * 0.52;
        const grad = ctx.createRadialGradient(cx, cy, maxR * 0.22, cx, cy, maxR * 0.88);
        grad.addColorStop(0.0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.42, 'rgba(0, 0, 0, 0.92)');
        grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.28)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              callback(url);
            }
          },
          'image/png'
        );
      } catch (_) {}
    };

    if (sourceImg.complete && sourceImg.naturalWidth > 0) {
      if (typeof sourceImg.decode === 'function') {
        sourceImg.decode().then(runBake).catch(runBake);
      } else {
        runBake();
      }
    } else {
      sourceImg.addEventListener('load', runBake, { once: true });
    }
  }

  function syncLockedPhotoUrl(url) {
    if (!url || !page3Photo) return;
    page3Photo.src = url;
    buildPrebakedRadialBlurTexture(page3Photo, 0.5, 0.544, (blurUrl) => {
      if (activeMeadowBlurUrl) URL.revokeObjectURL(activeMeadowBlurUrl);
      activeMeadowBlurUrl = blurUrl;
      if (page3BlurEdge) page3BlurEdge.src = blurUrl;
    });
  }

  function applyLockedVisionBgUrl(url) {
    if (!visionBgImage || !url) return;
    visionBgImage.src = url;
    visionBgImage.classList.add('has-custom-bg');
    buildPrebakedRadialBlurTexture(visionBgImage, 0.5, 0.5, (blurUrl) => {
      if (activeTrainBlurUrl) URL.revokeObjectURL(activeTrainBlurUrl);
      activeTrainBlurUrl = blurUrl;
      if (visionBgBlur) visionBgBlur.src = blurUrl;
    });
  }

  function openPhotoDB(callback) {
    try {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = (e) => {
        callback(e.target.result);
      };
    } catch (_) {}
  }

  function initLockedPhotos() {
    if (page3Photo) {
      buildPrebakedRadialBlurTexture(page3Photo, 0.5, 0.544, (blurUrl) => {
        if (!activeMeadowBlurUrl) {
          activeMeadowBlurUrl = blurUrl;
          if (page3BlurEdge) page3BlurEdge.src = blurUrl;
        }
      });
    }
    if (visionBgImage) {
      buildPrebakedRadialBlurTexture(visionBgImage, 0.5, 0.5, (blurUrl) => {
        if (!activeTrainBlurUrl) {
          activeTrainBlurUrl = blurUrl;
          if (visionBgBlur) visionBgBlur.src = blurUrl;
        }
      });
    }

    fetch('public/download-bg.png', { method: 'HEAD', cache: 'no-cache' })
      .then((res) => {
        const len = Number(res.headers.get('content-length') || 0);
        const userReplacedFileInPublic = res.ok && len > 0 && len !== INITIAL_PUBLIC_BG_SIZE;

        openPhotoDB((db) => {
          try {
            if (!db.objectStoreNames.contains(STORE_NAME)) return;
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);

            if (page3Photo) {
              const getPrimary = store.get(PHOTO_KEY);
              getPrimary.onsuccess = () => {
                if (getPrimary.result instanceof Blob) {
                  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
                  activeObjectUrl = URL.createObjectURL(getPrimary.result);
                  syncLockedPhotoUrl(activeObjectUrl);
                } else {
                  const getLegacy = store.get(LEGACY_KEY);
                  getLegacy.onsuccess = () => {
                    if (getLegacy.result instanceof Blob) {
                      if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
                      activeObjectUrl = URL.createObjectURL(getLegacy.result);
                      syncLockedPhotoUrl(activeObjectUrl);
                    }
                  };
                }
              };
            }

            if (visionBgImage && !userReplacedFileInPublic) {
              const getVisionBg = store.get(VISION_BG_KEY);
              getVisionBg.onsuccess = () => {
                if (getVisionBg.result instanceof Blob) {
                  if (activeVisionBgUrl) URL.revokeObjectURL(activeVisionBgUrl);
                  activeVisionBgUrl = URL.createObjectURL(getVisionBg.result);
                  applyLockedVisionBgUrl(activeVisionBgUrl);
                }
              };
            }
          } catch (_) {}
        });
      })
      .catch(() => {});
  }

  const ANDROID_APK_DOWNLOAD_URL =
    'https://github.com/nixhm55/VOID/releases/download/v1.0.0/app-release.apk';

  function initDownloadButtons() {
    const downloadBtns = document.querySelectorAll('.vp-download-btn[data-download-os]');
    downloadBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('is-loading')) return;
        const fillEl = btn.querySelector('.vp-btn-progress-fill');
        if (!fillEl) return;

        const osType = btn.getAttribute('data-download-os') || '';
        const customUrl = btn.getAttribute('data-download-url') || '';
        const targetDownloadUrl =
          customUrl || (osType.toLowerCase().includes('android') ? ANDROID_APK_DOWNLOAD_URL : '');

        // Trigger direct APK download for Android on both Desktop and Mobile
        if (targetDownloadUrl) {
          const link = document.createElement('a');
          link.href = targetDownloadUrl;
          link.setAttribute('download', 'app-release.apk');
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // 1. Hide "Download" text and show the inset rounded progress track
        btn.classList.add('is-loading');
        fillEl.style.transition = 'none';
        fillEl.style.width = '0%';

        // Force layout so the 0% starting width commits before animating to 100%
        void fillEl.offsetWidth;

        // 2. Smoothly animate the thin rounded meadow-green bar across the inset track
        fillEl.style.transition = 'width 1.15s cubic-bezier(0.22, 1, 0.36, 1)';
        fillEl.style.width = '100%';

        // 3. Hold briefly at full, then smoothly restore the normal "Download" button
        setTimeout(() => {
          btn.classList.remove('is-loading');
          setTimeout(() => {
            fillEl.style.transition = 'none';
            fillEl.style.width = '0%';
          }, 260);
        }, 1400);
      });
    });
  }

  function init() {
    page3Section = document.getElementById('pageThreeSection');
    page3MediaFrame = document.getElementById('page3MediaFrame');
    page3CameraRig = document.getElementById('page3CameraRig');
    page3Photo = document.getElementById('page3Photo');
    page3BlurEdge = document.getElementById('page3BlurEdge');
    page3TopSunlight = document.getElementById('page3TopSunlight');
    page3TopWhiteSeam = document.getElementById('page3TopWhiteSeam');
    page3ScreenBloom = document.getElementById('page3ScreenBloom');
    page3WhitePortal = document.getElementById('page3WhitePortal');

    page3VisionStage = document.getElementById('page3VisionStage');
    vpEnvironmentBg = document.getElementById('vpEnvironmentBg');
    vpSpatialAssembly = document.getElementById('vpSpatialAssembly');
    visionBgImage = document.getElementById('visionBgImage');
    visionBgBlur = document.getElementById('visionBgBlur');

    lastRenderedPage3 = -999;
    lastRenderedFlight = -999;
    lastRenderedVel = -999;
    lastRenderedMouseX = -999;
    lastRenderedMouseY = -999;

    initLockedPhotos();
    initDownloadButtons();
  }

  function render(page3Prog, flightProg, mouseX = 0, mouseY = 0, fPhase = 0, flightVel = 0, force = false) {
    if (!page3MediaFrame || !page3CameraRig) return;

    const p3 = clamp01(page3Prog);
    const z = clamp01(flightProg);
    const absVel = Math.min(2.5, Math.abs(flightVel || 0));

    if (
      !force &&
      Math.abs(p3 - lastRenderedPage3) <= 0.0001 &&
      Math.abs(z - lastRenderedFlight) <= 0.00004 &&
      Math.abs(absVel - lastRenderedVel) <= 0.002 &&
      Math.abs(mouseX - lastRenderedMouseX) <= 0.001 &&
      Math.abs(mouseY - lastRenderedMouseY) <= 0.001
    ) {
      return;
    }

    lastRenderedPage3 = p3;
    lastRenderedFlight = z;
    lastRenderedVel = absVel;
    lastRenderedMouseX = mouseX;
    lastRenderedMouseY = mouseY;

    // ========================================================================
    // 1. STRADDLING TOP SEAM SPREAD: WHITE -> GOLDEN-YELLOW SUNLIGHT
    //    - Both spreads sit directly over the y = 0 seam line (-18vh to +34vh)
    //      with ZERO vertical lifting so the seam line is NEVER uncovered!
    //    - From p3 = 0.0 -> 0.52 (up to halfway / upper quarter): Pure White spread
    //    - From p3 = 0.40 -> 0.88: Smoothly morphs from White into Golden-Yellow
    //      Sunlight right over the seam line, completely hiding the line!
    // ========================================================================
    const sunlightIn = smootherstep01((p3 - 0.38) / 0.36);
    const sunlightOverheadFade = 1.0 - smootherstep01(z / 0.32);
    const sunlightOpacity = sunlightIn * sunlightOverheadFade;

    // White spread stays 100% until golden-yellow sunlight is already strong, then crossfades
    const whiteSeamFade = (1.0 - smootherstep01((p3 - 0.54) / 0.38)) * sunlightOverheadFade;

    if (page3TopWhiteSeam) {
      if (whiteSeamFade <= 0.002) {
        if (page3TopWhiteSeam.style.visibility !== 'hidden') {
          page3TopWhiteSeam.style.visibility = 'hidden';
        }
      } else {
        if (page3TopWhiteSeam.style.visibility !== 'visible') {
          page3TopWhiteSeam.style.visibility = 'visible';
        }
        page3TopWhiteSeam.style.opacity = whiteSeamFade.toFixed(3);
        page3TopWhiteSeam.style.transform = 'translate3d(0px, 0px, 0px)';
      }
    }

    if (page3TopSunlight) {
      if (sunlightOpacity <= 0.002) {
        if (page3TopSunlight.style.visibility !== 'hidden') {
          page3TopSunlight.style.visibility = 'hidden';
        }
      } else {
        if (page3TopSunlight.style.visibility !== 'visible') {
          page3TopSunlight.style.visibility = 'visible';
        }
        page3TopSunlight.style.opacity = sunlightOpacity.toFixed(3);
        page3TopSunlight.style.transform = 'translate3d(0px, 0px, 0px)';
      }
    }

    // ========================================================================
    // 2. STAGE 1 (z: 0.0 -> 0.54): WALK ALL THE WAY INTO THE MACINTOSH WHITE SCREEN
    //    (100% Untouched Exterior Macintosh Walk-In)
    // ========================================================================
    const walkNormalized = clamp01(z / 0.54);
    const easedWalk = smootherstep01(walkNormalized);
    const visionReveal = smootherstep01((z - 0.44) / 0.15);

    if (visionReveal >= 0.998) {
      if (page3CameraRig.style.visibility !== 'hidden') {
        page3CameraRig.style.visibility = 'hidden';
      }
    } else {
      if (page3CameraRig.style.visibility !== 'visible') {
        page3CameraRig.style.visibility = 'visible';
      }

      const walkEnvelope = Math.sin(walkNormalized * Math.PI) * (1.0 - smootherstep01((walkNormalized - 0.62) / 0.28));
      const strideBobY = Math.sin(walkNormalized * Math.PI * 3.0) * 0.32 * walkEnvelope;

      const dollyScale = Math.pow(9.2, easedWalk);
      const dollyTranslateY = 2.6 * easedWalk + strideBobY;

      page3CameraRig.style.transform =
        `translate3d(0px, ${dollyTranslateY.toFixed(3)}vh, 0px) ` +
        `scale3d(${dollyScale.toFixed(4)}, ${dollyScale.toFixed(4)}, 1)`;

      // Pre-baked peripheral motion blur during Macintosh walk-in
      if (page3BlurEdge) {
        const walkDepthBlur = Math.sin(clamp01(walkNormalized / 0.95) * Math.PI);
        const velocityBoost = Math.min(1.0, absVel * 0.85);
        const blurOp = clamp01(
          walkDepthBlur * 0.88 + velocityBoost * (walkNormalized > 0.01 && walkNormalized < 0.98 ? 0.55 : 0)
        );
        const blurScale = 1.0 + blurOp * 0.085;
        page3BlurEdge.style.opacity = blurOp.toFixed(3);
        page3BlurEdge.style.transform = `scale3d(${blurScale.toFixed(4)}, ${blurScale.toFixed(4)}, 1)`;
      }
    }

    // ========================================================================
    // 3. CRT WHITE SCREEN BLOOM & WHITE PORTAL ENTRY
    // ========================================================================
    const portalEnter = smootherstep01((z - 0.34) / 0.14);

    if (page3ScreenBloom) {
      const bloomOp = portalEnter * (1.0 - visionReveal * 0.92) * 0.90;
      if (bloomOp <= 0.002) {
        if (page3ScreenBloom.style.visibility !== 'hidden') {
          page3ScreenBloom.style.visibility = 'hidden';
        }
      } else {
        if (page3ScreenBloom.style.visibility !== 'visible') {
          page3ScreenBloom.style.visibility = 'visible';
        }
        const bloomScale = 0.72 + portalEnter * 1.48;
        page3ScreenBloom.style.opacity = bloomOp.toFixed(3);
        page3ScreenBloom.style.transform = `scale3d(${bloomScale.toFixed(3)}, ${bloomScale.toFixed(3)}, 1)`;
      }
    }

    if (page3WhitePortal) {
      const whiteFlash = smootherstep01((z - 0.39) / 0.08) * (1.0 - smootherstep01((z - 0.46) / 0.11));
      if (whiteFlash <= 0.002) {
        if (page3WhitePortal.style.visibility !== 'hidden') {
          page3WhitePortal.style.visibility = 'hidden';
        }
      } else {
        if (page3WhitePortal.style.visibility !== 'visible') {
          page3WhitePortal.style.visibility = 'visible';
        }
        page3WhitePortal.style.opacity = whiteFlash.toFixed(3);
      }
    }

    // ========================================================================
    // 4. STAGE 2 (z: 0.42 -> 0.97): IMMEDIATE GENTLE GLIDE AS SOON AS BARELY VISIBLE
    //    - Train & Download Box start moving gently at z = 0.42 (right as visionReveal
    //      begins fading in from white at z = 0.44), then smoothly ramp to normal speed
    //      as they become fully visible!
    // ========================================================================
    if (page3VisionStage) {
      if (visionReveal <= 0.002) {
        page3VisionStage.classList.remove('is-visible', 'is-interactive');
        page3VisionStage.style.opacity = '0';
      } else {
        page3VisionStage.classList.add('is-visible');
        page3VisionStage.style.opacity = visionReveal.toFixed(3);

        // Starts at z = 0.42 with non-zero velocity (hermiteImmediateGlide01)
        // so the scene is ALREADY gently scrolling while fading in from the white screen!
        const trainWalkRaw = clamp01((z - 0.42) / 0.55);
        const easedTrainWalk = hermiteImmediateGlide01(trainWalkRaw);

        page3VisionStage.classList.toggle('is-interactive', visionReveal > 0.6 && trainWalkRaw > 0.20);

        // A. Train Background glides forward gently as it becomes visible, then normal speed
        if (vpEnvironmentBg) {
          const trainEnvScale = 1.0 + 0.36 * easedTrainWalk;
          const trainBobY = Math.sin(trainWalkRaw * Math.PI * 2.0) * 0.24 * Math.sin(trainWalkRaw * Math.PI);
          vpEnvironmentBg.style.transform =
            `translate3d(0px, ${trainBobY.toFixed(2)}vh, 0px) ` +
            `scale3d(${trainEnvScale.toFixed(4)}, ${trainEnvScale.toFixed(4)}, 1)`;
        }

        // B. Train Peripheral Motion Blur while scrolling forward toward the download box
        if (visionBgBlur) {
          const trainWalkBlur = Math.sin(trainWalkRaw * Math.PI);
          const trainVelBoost = Math.min(1.0, absVel * 0.90) * (trainWalkRaw > 0.01 && trainWalkRaw < 0.99 ? 0.65 : 0);
          const trainBlurOp = clamp01(trainWalkBlur * 0.85 + trainVelBoost);
          const trainBlurScale = 1.0 + trainBlurOp * 0.075;
          visionBgBlur.style.opacity = trainBlurOp.toFixed(3);
          visionBgBlur.style.transform = `scale3d(${trainBlurScale.toFixed(4)}, ${trainBlurScale.toFixed(4)}, 1)`;
        }

        // C. Distant VOID Download Glass Box: Starts moving gently right when barely visible
        //    (scale 0.38 -> 1.00) and smoothly accelerates to normal speed once fully visible!
        if (vpSpatialAssembly) {
          const boxScale = 0.38 + 0.62 * easedTrainWalk;
          const boxLiftY = (1.0 - easedTrainWalk) * -12.0;
          const boxOp = clamp01(0.75 + 0.25 * easedTrainWalk);
          const tiltY = mouseX * 1.5 * easedTrainWalk;
          const tiltX = -mouseY * 1.2 * easedTrainWalk;

          vpSpatialAssembly.style.opacity = boxOp.toFixed(3);
          vpSpatialAssembly.style.transform =
            `perspective(1400px) translate3d(0px, ${boxLiftY.toFixed(2)}px, 0px) ` +
            `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) ` +
            `scale3d(${boxScale.toFixed(4)}, ${boxScale.toFixed(4)}, 1)`;
        }
      }
    }
  }

  function getWrapper() {
    return page3Section || document.getElementById('pageThreeSection');
  }

  return {
    init,
    render,
    getWrapper,
  };
})();
