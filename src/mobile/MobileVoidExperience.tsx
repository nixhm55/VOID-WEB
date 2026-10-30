import React, { useEffect, useRef, useState } from 'react';
import {
  EXTENDED_LIBRARY_TRACKS,
  HERO_TRACKS,
  PLATFORM_OPTIONS,
  formatSeconds,
} from '../data/musicData';
import {
  NavigationSection,
  PlatformOption,
  SpatialAudioMode,
  Track,
} from '../types/void';
import {
  ChevronDownIcon,
  PauseBarsIcon,
  PlayTriangleIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
  VolumeSpeakerIcon,
} from '../components/icons/VoidIcons';
import { EclipseArtwork } from '../components/EclipseArtwork';

export interface MobileVoidExperienceProps {
  currentTrack: Track;
  isPlaying: boolean;
  elapsedSeconds: number;
  isShuffle: boolean;
  isRepeat: boolean;
  isMuted: boolean;
  volume: number;
  likedTrackIds: string[];
  spatialMode: SpatialAudioMode;
  selectedPlatform: PlatformOption;
  activeSection: NavigationSection;
  onSelectSection: (section: NavigationSection) => void;
  onTogglePlay: () => void;
  onSelectTrack: (track: Track) => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (trackId: string) => void;
  onToggleMute: () => void;
  onChangeVolume: (val: number) => void;
  onCycleSpatialMode: () => void;
  onSelectPlatform: (platform: PlatformOption) => void;
}

/**
 * 6 Architectural Feature Cards in the 3D Overlapping Slanted Stack
 * - Stacked one over another ("ഒന്നിന്റെ മേലെ ഒന്ന് ഒന്നിന്റെ മേലെ ഒന്ന്") like the Hero 3D deck
 * - Clicking any of the 6 cards brings that card forward to the front ("ഒന്ന് ക്ലിക്ക് ചെയ്യുമ്പോൾ അതിങ്ങനെ മുന്നിലോട്ട് വരണം")
 * - Below the stack: Dedicated panel displays the selected feature's heading & description
 */
const BENT_ARC_FEATURES = [
  {
    num: '01',
    topName: 'AUDIO',
    title: 'High-Res Audio',
    featureHeading: 'Lossless 96kHz / 24-Bit Acoustic Engine',
    body: 'Micro-dynamics and harmonic warmth preserved across your entire library with zero compression or digital harshness.',
    imgSrc: '/assets/hero-leather.png',
    imgClass: 'vm-fcard-img--1',
  },
  {
    num: '02',
    topName: 'CURATION',
    title: 'Smart Playlists',
    featureHeading: 'Nocturnal Mood & Key-Signature Curation',
    body: 'Intelligent sessions automatically arranged by harmonic key, tempo flow, and late-night atmospheric depth.',
    imgSrc: '/assets/eclipse-cover.png',
    imgClass: 'vm-fcard-img--2',
  },
  {
    num: '03',
    topName: 'OFFLINE',
    title: 'Offline Mode',
    featureHeading: 'Uninterrupted Local Vault Playback',
    body: 'Instantaneous local library access and bit-perfect playback anywhere with zero network dependency.',
    imgSrc: '/assets/vinyl-disc.png',
    imgClass: 'vm-fcard-img--3',
  },
  {
    num: '04',
    topName: 'SPATIAL',
    title: '3D Soundstage',
    featureHeading: 'Head-Tracked Binaural Room Acoustics',
    body: 'Immersive dimensional soundstage that places every instrument around you with studio-grade depth.',
    imgSrc: '/assets/eclipse-cover.png',
    imgClass: 'vm-fcard-img--4',
  },
  {
    num: '05',
    topName: 'ANALOG',
    title: 'Velvet Warmth',
    featureHeading: 'Pure Direct Harmonic Saturation',
    body: 'Subtle analog vinyl warmth and rich low-end weight sculpted for fatigue-free midnight listening.',
    imgSrc: '/assets/vinyl-disc.png',
    imgClass: 'vm-fcard-img--5',
  },
  {
    num: '06',
    topName: 'ECOSYSTEM',
    title: 'Cross-Platform',
    featureHeading: 'Unified Obsidian Architecture',
    body: 'A seamless, ultra-low-latency listening sanctuary engineered natively for macOS, Windows, and Android.',
    imgSrc: '/assets/hero-leather.png',
    imgClass: 'vm-fcard-img--6',
  },
];

/**
 * 4 Overlapping Curved Vinyl Records & Minimal Feature Callouts
 * (Follows the sweeping C-curve overlapping layout of E8F4AF8E-6C06-4798-9157-FAC7C58B9C29.png:
 *  Top-Left -> Upper-Center-Right -> Lower-Right -> Bottom-Center-Left,
 *  descending and rotating smoothly as the user scrolls!)
 */
const CURVED_VINYL_FEATURES = [
  {
    id: 'vinyl-feat-01',
    stepClass: 'vm-curve-step--1',
    calloutSide: 'right' as const,
    label: 'SPATIAL STAGE',
    detail: '3D head-tracked room acoustics',
    tintClass: 'vm-cascade-vinyl--oxblood',
    eclipseConfig: HERO_TRACKS[0].eclipseConfig,
  },
  {
    id: 'vinyl-feat-02',
    stepClass: 'vm-curve-step--2',
    calloutSide: 'right' as const,
    label: 'PURE DIRECT',
    detail: 'Bit-perfect hardware signal path',
    tintClass: 'vm-cascade-vinyl--crimson',
    eclipseConfig: HERO_TRACKS[1]?.eclipseConfig || HERO_TRACKS[0].eclipseConfig,
  },
  {
    id: 'vinyl-feat-03',
    stepClass: 'vm-curve-step--3',
    calloutSide: 'left' as const,
    label: 'LIQUID STUDIO',
    detail: 'Real-time harmonic warmth',
    tintClass: 'vm-cascade-vinyl--rosewine',
    eclipseConfig: HERO_TRACKS[2]?.eclipseConfig || HERO_TRACKS[0].eclipseConfig,
  },
  {
    id: 'vinyl-feat-04',
    stepClass: 'vm-curve-step--4',
    calloutSide: 'right' as const,
    label: 'INSTANT VAULT',
    detail: 'Zero-latency offline library',
    tintClass: 'vm-cascade-vinyl--obsidian',
    eclipseConfig: HERO_TRACKS[3]?.eclipseConfig || HERO_TRACKS[0].eclipseConfig,
  },
];

export const MobileVoidExperience: React.FC<MobileVoidExperienceProps> = ({
  currentTrack,
  spatialMode,
  selectedPlatform,
  onCycleSpatialMode,
  onSelectPlatform,
}) => {
  // Hero 5-Card 3D Deck Fan-Out Animation State (matches Screen Recording 2026-10-30 at 11.56.30 AM.mov:
  // opens as a center stack, then immediately scatters/fans out into the 3D slanted row!)
  const [heroDeckFanned, setHeroDeckFanned] = useState<boolean>(false);
  const deckReplayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const fanTimer = window.setTimeout(() => {
      setHeroDeckFanned(true);
    }, 420);
    return () => {
      window.clearTimeout(fanTimer);
      if (deckReplayTimerRef.current !== null) {
        window.clearTimeout(deckReplayTimerRef.current);
      }
    };
  }, []);

  const handleReplayHeroDeck = () => {
    if (deckReplayTimerRef.current !== null) {
      window.clearTimeout(deckReplayTimerRef.current);
    }
    setHeroDeckFanned(false);
    deckReplayTimerRef.current = window.setTimeout(() => {
      setHeroDeckFanned(true);
    }, 520);
  };

  // Dummy UI state for the mobile player card (visual only, zero audio playback)
  const [dummyTrackIndex, setDummyTrackIndex] = useState<number>(0);
  const [dummyPlaying, setDummyPlaying] = useState<boolean>(false);
  const [dummyElapsed, setDummyElapsed] = useState<number>(
    currentTrack.defaultElapsedSeconds || 84
  );
  const [dummyShuffle, setDummyShuffle] = useState<boolean>(false);
  const [dummyRepeat, setDummyRepeat] = useState<boolean>(false);
  const [dummyMuted, setDummyMuted] = useState<boolean>(false);
  const [dummyVolume, setDummyVolume] = useState<number>(0.48);
  const [activeArcIndex, setActiveArcIndex] = useState<number>(0);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const activeDummyTrack: Track =
    EXTENDED_LIBRARY_TRACKS[dummyTrackIndex] || currentTrack;

  const leatherStageRef = useRef<HTMLDivElement | null>(null);
  const featuresProgressRef = useRef<HTMLDivElement | null>(null);
  const featuresVolumeRef = useRef<HTMLDivElement | null>(null);
  const arcDragStartXRef = useRef<number | null>(null);
  const arcDidDragRef = useRef<boolean>(false);
  const arcWheelCooldownRef = useRef<number>(0);
  const cascadeSectionRef = useRef<HTMLElement | null>(null);
  const cascadeRowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cascadeVinylRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cascadeCalloutRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Advance dummy visual timer when dummyPlaying is toggled on (visual only, zero audio)
  useEffect(() => {
    if (!dummyPlaying) return;
    const timer = window.setInterval(() => {
      setDummyElapsed((prev) => {
        if (prev + 1 >= activeDummyTrack.durationSeconds) {
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [dummyPlaying, activeDummyTrack.durationSeconds]);

  // Automatically detect suitable platform (macOS / Windows / Android) on initial mount
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    let detectedId = 'macos';
    if (ua.includes('android')) {
      detectedId = 'android';
    } else if (ua.includes('win')) {
      detectedId = 'windows';
    } else if (ua.includes('mac')) {
      detectedId = 'macos';
    }
    const match = PLATFORM_OPTIONS.find((p) => p.id === detectedId);
    if (match && match.id !== selectedPlatform.id) {
      onSelectPlatform(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Damped scroll-physics loop so the 4 curved overlapping vinyls visibly descend,
  // fan out along the curve, and spin smoothly as the user scrolls!
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId = 0;
    let isRunning = false;
    const smoothedProgress = [0, 0, 0, 0];

    // Curve horizontal X offsets (in px) for the 4 overlapping vinyls along the C-curve:
    // Step 1: Left (-18px), Step 2: Center-Right (+54px), Step 3: Far-Right (+92px), Step 4: Center-Left (+12px)
    const curveTargetX = [-18, 54, 92, 12];
    const curveStartX = [-24, -18, 54, 92]; // Each vinyl starts tucked behind the previous vinyl's X position!

    const tick = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const vh = Math.max(window.innerHeight, 640);

      // 1. Leather backdrop parallax
      if (leatherStageRef.current) {
        const maxFoldShift = vh * 1.15;
        const shiftY = Math.min(scrollY * 0.36, maxFoldShift);
        leatherStageRef.current.style.transform = `translate3d(0, ${-shiftY.toFixed(1)}px, 0)`;
      }

      // 2. Curved Overlapping Vinyl Cascade — Active Scroll-Descending Animation
      let needsMoreFrames = false;

      for (let i = 0; i < CURVED_VINYL_FEATURES.length; i++) {
        const rowEl = cascadeRowRefs.current[i];
        const vinylEl = cascadeVinylRefs.current[i];
        const calloutEl = cascadeCalloutRefs.current[i];
        if (!rowEl || !vinylEl) continue;

        const rect = rowEl.getBoundingClientRect();
        // Progress goes from 0 (when row enters bottom of screen at 95% vh)
        // to 1 (when row reaches upper-middle of screen at 32% vh)
        const rawP = (vh * 0.95 - rect.top) / (vh * 0.63);
        const targetP = Math.max(0, Math.min(1.25, rawP));

        const diff = targetP - smoothedProgress[i];
        if (Math.abs(diff) > 0.002) {
          smoothedProgress[i] += diff * 0.16;
          needsMoreFrames = true;
        } else {
          smoothedProgress[i] = targetP;
        }

        const p = smoothedProgress[i];
        const clampedP = Math.min(1, p);
        // Smooth cubic ease-out for the descending cascade motion
        const easeOut = 1 - Math.pow(1 - clampedP, 2.6);

        // When p=0, vinyl starts slightly higher up and descends smoothly into its spot
        // without riding up into the FEATURES card above the section
        const startX = curveStartX[i];
        const endX = curveTargetX[i];
        const currentX = startX + (endX - startX) * easeOut;
        const initialLift = i === 0 ? -36 : -72;
        const descendY = (1 - easeOut) * initialLift + easeOut * 22 + Math.max(0, p - 1) * 28;
        const scale = 0.76 + 0.24 * easeOut;
        const spinDeg = (p * 165 + i * 38) * (i % 2 === 0 ? 1 : -1);
        const opacity = Math.max(0.12, Math.min(1, p * 1.65));

        vinylEl.style.transform = `translate3d(${currentX.toFixed(
          1
        )}px, ${descendY.toFixed(1)}px, 0) scale(${scale.toFixed(
          3
        )}) rotate(${spinDeg.toFixed(1)}deg)`;
        vinylEl.style.opacity = opacity.toFixed(3);

        if (calloutEl) {
          const calloutP = Math.max(0, Math.min(1, (p - 0.22) * 1.45));
          const calloutEase = 1 - Math.pow(1 - calloutP, 2.4);
          const calloutY = (1 - calloutEase) * -42;
          const calloutX = (1 - calloutEase) * (CURVED_VINYL_FEATURES[i].calloutSide === 'right' ? -18 : 18);
          calloutEl.style.transform = `translate3d(${calloutX.toFixed(
            1
          )}px, ${calloutY.toFixed(1)}px, 0)`;
          calloutEl.style.opacity = calloutEase.toFixed(3);
        }
      }

      if (needsMoreFrames) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        isRunning = false;
      }
    };

    const wake = () => {
      if (!isRunning) {
        isRunning = true;
        rafId = window.requestAnimationFrame(tick);
      }
    };

    wake();
    window.addEventListener('scroll', wake, { passive: true });
    window.addEventListener('resize', wake, { passive: true });
    return () => {
      window.removeEventListener('scroll', wake);
      window.removeEventListener('resize', wake);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Section reveal observer
  useEffect(() => {
    const revealNodes = document.querySelectorAll<HTMLElement>('[data-m-reveal]');
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -4% 0px' }
    );
    revealNodes.forEach((el) => revealObs.observe(el));

    return () => {
      revealObs.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const duration = Math.max(1, activeDummyTrack.durationSeconds);
  const progressRatio = Math.max(0, Math.min(1, dummyElapsed / duration));
  const progressPercent = (progressRatio * 100).toFixed(2);
  const effectiveVolume = dummyMuted ? 0 : dummyVolume;
  const volumePercent = (effectiveVolume * 100).toFixed(1);

  const handleDummyPrev = () => {
    const nextIdx =
      (dummyTrackIndex - 1 + EXTENDED_LIBRARY_TRACKS.length) %
      EXTENDED_LIBRARY_TRACKS.length;
    setDummyTrackIndex(nextIdx);
    setDummyElapsed(EXTENDED_LIBRARY_TRACKS[nextIdx]?.defaultElapsedSeconds || 42);
  };

  const handleDummyNext = () => {
    const nextIdx = (dummyTrackIndex + 1) % EXTENDED_LIBRARY_TRACKS.length;
    setDummyTrackIndex(nextIdx);
    setDummyElapsed(EXTENDED_LIBRARY_TRACKS[nextIdx]?.defaultElapsedSeconds || 42);
  };

  const handleSeekFromRef = (
    ref: React.RefObject<HTMLDivElement | null>,
    clientX: number
  ) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
    );
    setDummyElapsed(Math.round(ratio * duration));
  };

  const handleVolumeFromRef = (clientX: number) => {
    if (!featuresVolumeRef.current) return;
    const rect = featuresVolumeRef.current.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
    );
    const nextVol = Number(ratio.toFixed(2));
    setDummyVolume(nextVol);
    setDummyMuted(nextVol === 0);
  };

  const handleTriggerDownload = (platform: PlatformOption) => {
    setDownloadStatus(
      `Direct installer endpoint for ${platform.name} (${platform.architecture}) is not configured in this local build.`
    );
    window.setTimeout(() => setDownloadStatus(null), 5000);
  };

  const selectedArcFeature = BENT_ARC_FEATURES[activeArcIndex] || BENT_ARC_FEATURES[0];

  return (
    <div className="void-mobile-world">
      {/* ====================================================================
          ORIGINAL VOID LEATHER & ATMOSPHERIC VISUAL LAYERS (Adapted for Mobile)
          ==================================================================== */}
      <div className="vm-leather-backdrop" aria-hidden="true">
        <div
          className="vm-leather-base-hide"
          style={{ backgroundImage: "url('/assets/leather-tile.png')" }}
        />
        <div ref={leatherStageRef} className="vm-leather-scroll-stage">
          <img
            src="/assets/hero-leather.png"
            alt=""
            decoding="sync"
            fetchPriority="high"
            draggable={false}
            className="vm-leather-drape-img"
          />
          <div className="vm-leather-crimson-bloom" />
        </div>
        <div className="vm-leather-vignette" />
      </div>

      {/* ====================================================================
          TOP BRAND HEADER — ONLY "V O I D"
          Anchored at the top of the document (scrolls up naturally, no overlay)
          ==================================================================== */}
      <header className="vm-navbar">
        <div className="vm-navbar__inner">
          <a
            href="#m-home"
            className="vm-navbar__brand"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('m-home');
            }}
          >
            V O I D
          </a>
        </div>
      </header>

      <main className="vm-main-content">
        {/* ====================================================================
            SECTION 1 — MOBILE HERO (Full 100dvh First Screen — Zero Features Leakage)
            1. Top: "YOUR MUSIC. REIMAGINED." + Subcopy
            2. Center: 5-Card 3D Stack-to-Fan Deck Animation centered in the Hero space
            3. Bottom: "SCROLL TO DOWNLOAD" + 4-Item Architectural Strip
            ==================================================================== */}
        <section
          id="m-home"
          className="vm-hero-section"
          aria-label="VOID Hero"
        >
          {/* Top Hero Headline & Subcopy */}
          <div className="vm-hero-top-copy" data-m-reveal>
            <h1 className="vm-hero-headline">
              <span className="vm-hero-line">YOUR MUSIC.</span>
              <span className="vm-hero-line">REIMAGINED.</span>
            </h1>

            <p className="vm-hero-subcopy">
              VOID is a modern music player built for those who feel music deeper.
              Minimal. Powerful. Yours.
            </p>
          </div>

          {/* Center 5-Card 3D Stack-to-Fan Scatter Stage */}
          <div
            className={`vm-hero-deck-stage ${
              heroDeckFanned ? 'is-fanned' : 'is-stacked'
            }`}
            onClick={handleReplayHeroDeck}
            role="button"
            tabIndex={0}
            aria-label="Replay VOID 3D card fan animation"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleReplayHeroDeck();
              }
            }}
          >
            <div className="vm-hero-deck-ambient" aria-hidden="true" />
            <div className="vm-hero-deck-3d">
              {/* Card 1 (Far Left when fanned) */}
              <div
                className="vm-hero-deck-card vm-hero-deck-card--0"
                style={
                  {
                    '--deck-offset': -2,
                    '--deck-index': 0,
                  } as React.CSSProperties
                }
              >
                <div className="vm-hero-deck-card__inner">
                  <img
                    src="/assets/hero-leather.png"
                    alt=""
                    draggable={false}
                    className="vm-hero-deck-card__img vm-hero-deck-card__img--1"
                  />
                  <div className="vm-hero-deck-card__shade" />
                  <span className="vm-hero-deck-card__tag">96KHZ / 24-BIT</span>
                  <span className="vm-hero-deck-card__caption">PURE DIRECT</span>
                </div>
              </div>

              {/* Card 2 (Mid Left when fanned) */}
              <div
                className="vm-hero-deck-card vm-hero-deck-card--1"
                style={
                  {
                    '--deck-offset': -1,
                    '--deck-index': 1,
                  } as React.CSSProperties
                }
              >
                <div className="vm-hero-deck-card__inner">
                  <img
                    src="/assets/eclipse-cover.png"
                    alt=""
                    draggable={false}
                    className="vm-hero-deck-card__img vm-hero-deck-card__img--2"
                  />
                  <div className="vm-hero-deck-card__shade" />
                  <span className="vm-hero-deck-card__tag">SPATIAL</span>
                  <span className="vm-hero-deck-card__caption">3D STAGE</span>
                </div>
              </div>

              {/* Card 3 (Center Device Card — highlighted mobile player frame) */}
              <div
                className="vm-hero-deck-card vm-hero-deck-card--2 is-center-device"
                style={
                  {
                    '--deck-offset': 0,
                    '--deck-index': 2,
                  } as React.CSSProperties
                }
              >
                <div className="vm-hero-deck-card__inner">
                  <div className="vm-hero-deck-card__notch" aria-hidden="true" />
                  <img
                    src="/assets/eclipse-cover.png"
                    alt=""
                    draggable={false}
                    className="vm-hero-deck-card__img vm-hero-deck-card__img--3"
                  />
                  <div className="vm-hero-deck-card__shade" />
                  <span className="vm-hero-deck-card__tag">V O I D</span>
                  <span className="vm-hero-deck-card__caption">OBSIDIAN EDITION</span>
                </div>
              </div>

              {/* Card 4 (Mid Right when fanned) */}
              <div
                className="vm-hero-deck-card vm-hero-deck-card--3"
                style={
                  {
                    '--deck-offset': 1,
                    '--deck-index': 3,
                  } as React.CSSProperties
                }
              >
                <div className="vm-hero-deck-card__inner">
                  <img
                    src="/assets/vinyl-disc.png"
                    alt=""
                    draggable={false}
                    className="vm-hero-deck-card__img vm-hero-deck-card__img--4"
                  />
                  <div className="vm-hero-deck-card__shade" />
                  <span className="vm-hero-deck-card__tag">VELVET</span>
                  <span className="vm-hero-deck-card__caption">ANALOG WARMTH</span>
                </div>
              </div>

              {/* Card 5 (Far Right when fanned) */}
              <div
                className="vm-hero-deck-card vm-hero-deck-card--4"
                style={
                  {
                    '--deck-offset': 2,
                    '--deck-index': 4,
                  } as React.CSSProperties
                }
              >
                <div className="vm-hero-deck-card__inner">
                  <img
                    src="/assets/hero-leather.png"
                    alt=""
                    draggable={false}
                    className="vm-hero-deck-card__img vm-hero-deck-card__img--5"
                  />
                  <div className="vm-hero-deck-card__shade" />
                  <span className="vm-hero-deck-card__tag">VAULT</span>
                  <span className="vm-hero-deck-card__caption">OFFLINE CORE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Hero Footer: Scroll Cue + 4-Item Architectural Strip */}
          <div className="vm-hero-bottom-block" data-m-reveal>
            <button
              type="button"
              className="vm-hero-scroll-cue"
              onClick={() => scrollToSection('m-download')}
            >
              <span className="vm-hero-scroll-arrow" aria-hidden="true">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="18 13 12 19 6 13" />
                </svg>
              </span>
              <span className="vm-hero-scroll-text">
                S C R O L L &nbsp; T O &nbsp; D O W N L O A D
              </span>
              <span className="vm-hero-scroll-rule" aria-hidden="true" />
            </button>

            {/* Bottom 4-Item Architectural Strip */}
            <div className="vm-hero-feature-strip">
            <div className="vm-hero-feature-item">
              <span className="vm-hero-feature-icon" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <line x1="4" y1="12" x2="4" y2="12.01" />
                  <line x1="8" y1="8" x2="8" y2="16" />
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="16" y1="8" x2="16" y2="16" />
                  <line x1="20" y1="11" x2="20" y2="13" />
                </svg>
              </span>
              <span className="vm-hero-feature-label">
                HIGH QUALITY
                <br />
                AUDIO
              </span>
            </div>

            <div className="vm-hero-feature-item">
              <span className="vm-hero-feature-icon" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="7" x2="15" y2="7" />
                  <line x1="4" y1="12" x2="13" y2="12" />
                  <line x1="4" y1="17" x2="11" y2="17" />
                  <polygon points="17.5 11.5 18.8 14 21.5 14.4 19.5 16.3 20 19 17.5 17.7 15 19 15.5 16.3 13.5 14.4 16.2 14 17.5 11.5" />
                </svg>
              </span>
              <span className="vm-hero-feature-label">
                PERSONALIZED
                <br />
                PLAYLISTS
              </span>
            </div>

            <div className="vm-hero-feature-item">
              <span className="vm-hero-feature-icon" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  <polyline points="10 13 12 15 14 13" />
                  <line x1="12" y1="10" x2="12" y2="15" />
                </svg>
              </span>
              <span className="vm-hero-feature-label">
                OFFLINE
                <br />
                LISTENING
              </span>
            </div>

            <div className="vm-hero-feature-item">
              <span className="vm-hero-feature-icon" aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
                  <path d="M5 3v4" />
                  <path d="M3 5h4" />
                </svg>
              </span>
              <span className="vm-hero-feature-label">
                BEAUTIFUL
                <br />
                INTERFACE
              </span>
            </div>
          </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 2 — FEATURES
            1. Luxury Crystal-Glass Expanded Player Card (Dummy Playback Only)
            2. 3D Curved / Bent Panoramic Feature Arc:
               - Inside each card: ONLY top short name + bottom feature title
               - 100% reliable click/tap on all 4 cards (left, center, right)
               - Below the arc: Dedicated Feature Description Panel
            ==================================================================== */}
        <section
          id="m-features"
          className="vm-section vm-features-section"
          aria-labelledby="vm-features-heading"
        >
          <div className="vm-section-header" data-m-reveal>
            <p className="void-noir-eyebrow">F E A T U R E S</p>
            <h2 id="vm-features-heading" className="vm-section-title">
              CRAFTED FOR DEPTH.
            </h2>
            <p className="vm-section-sub">
              Every surface and signal path is tuned for calm, high-resolution nocturnal listening.
            </p>
          </div>

          {/* Luxury Crystal-Frosted Burgundy Glass Player Card (Dummy Playback Only) */}
          <article
            className="void-noir-glass-player-card vm-glass-card-mobile"
            data-m-reveal
            aria-label="VOID Glass Music Player"
          >
            <div className="vm-glass-card-specular-meniscus" aria-hidden="true" />
            <div className="void-noir-card-rim-glow" aria-hidden="true" />

            <header className="void-noir-card-topbar">
              <button
                type="button"
                className="void-noir-card-top-btn"
                onClick={() => scrollToSection('m-preview')}
                aria-label="Scroll to vinyl curve"
              >
                <ChevronDownIcon size={16} />
              </button>

              <span className="vm-glass-card-mode-pill">{spatialMode}</span>

              <button
                type="button"
                className="void-noir-card-top-btn"
                onClick={onCycleSpatialMode}
                aria-label={`Audio mode: ${spatialMode}`}
                title={`Audio Mode: ${spatialMode}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="6" cy="12" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="18" cy="12" r="1.6" />
                </svg>
              </button>
            </header>

            <div
              className="void-noir-card-artwork-box vm-card-artwork-mobile"
              onClick={() => setDummyPlaying((prev) => !prev)}
              role="button"
              tabIndex={0}
              aria-label="Toggle dummy playback state"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDummyPlaying((prev) => !prev);
                }
              }}
            >
              <EclipseArtwork
                config={activeDummyTrack.eclipseConfig}
                isPlaying={dummyPlaying}
                size="hero"
              />
            </div>

            <div className="void-noir-card-meta">
              <h3 className="void-noir-card-title">{activeDummyTrack.title}</h3>
              <p className="void-noir-card-artist">{activeDummyTrack.artist}</p>
            </div>

            <div className="void-noir-card-progress-wrap">
              <div
                ref={featuresProgressRef}
                className="void-noir-card-progress-hit"
                role="slider"
                tabIndex={0}
                aria-label="Seek track position"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={dummyElapsed}
                onClick={(e) => handleSeekFromRef(featuresProgressRef, e.clientX)}
              >
                <div className="void-noir-card-progress-rail">
                  <div
                    className="void-noir-card-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div
                    className="void-noir-card-progress-thumb"
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="void-noir-card-timestamps">
                <span>{formatSeconds(dummyElapsed)}</span>
                <span>{activeDummyTrack.durationFormatted}</span>
              </div>
            </div>

            {/* Transport Controls: Clean Standard Play/Pause Icon Only (No Circle Orb, Dummy Only) */}
            <div className="void-noir-card-controls">
              <button
                type="button"
                className={`void-noir-card-ctrl-btn ${dummyShuffle ? 'is-active' : ''}`}
                onClick={() => setDummyShuffle((prev) => !prev)}
                aria-label="Toggle shuffle"
              >
                <ShuffleIcon size={15} />
              </button>

              <button
                type="button"
                className="void-noir-card-ctrl-btn"
                onClick={handleDummyPrev}
                aria-label="Previous track"
              >
                <SkipPrevIcon size={17} />
              </button>

              <button
                type="button"
                className={`vm-standard-play-btn ${dummyPlaying ? 'is-playing' : ''}`}
                onClick={() => setDummyPlaying((prev) => !prev)}
                aria-label={dummyPlaying ? 'Pause' : 'Play'}
              >
                {dummyPlaying ? (
                  <PauseBarsIcon size={22} />
                ) : (
                  <PlayTriangleIcon size={22} />
                )}
              </button>

              <button
                type="button"
                className="void-noir-card-ctrl-btn"
                onClick={handleDummyNext}
                aria-label="Next track"
              >
                <SkipNextIcon size={17} />
              </button>

              <button
                type="button"
                className={`void-noir-card-ctrl-btn ${dummyRepeat ? 'is-active' : ''}`}
                onClick={() => setDummyRepeat((prev) => !prev)}
                aria-label="Toggle repeat"
              >
                <RepeatIcon size={15} />
              </button>
            </div>

            <div className="void-noir-card-bottom-row">
              <button
                type="button"
                className="void-noir-card-vol-btn"
                onClick={() => setDummyMuted((prev) => !prev)}
                aria-label={dummyMuted ? 'Unmute' : 'Mute'}
              >
                <VolumeSpeakerIcon size={15} muted={dummyMuted || dummyVolume === 0} />
              </button>

              <div
                ref={featuresVolumeRef}
                className="void-noir-card-vol-hit"
                role="slider"
                tabIndex={0}
                aria-label="Volume level"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(effectiveVolume * 100)}
                onClick={(e) => handleVolumeFromRef(e.clientX)}
              >
                <div className="void-noir-card-vol-rail">
                  <div
                    className="void-noir-card-vol-fill"
                    style={{ width: `${volumePercent}%` }}
                  />
                  <div
                    className="void-noir-card-vol-thumb"
                    style={{ left: `${volumePercent}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="void-noir-card-vol-btn"
                onClick={onCycleSpatialMode}
                aria-label="Spatial audio output"
                title={`Output: ${spatialMode}`}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
                  <polygon points="12 15 17 21 7 21 12 15" />
                </svg>
              </button>
            </div>
          </article>

          {/* ==================================================================
              6-CARD 3D CONCAVE U-BEND / V-BEND REVOLVING CAROUSEL
              - Center of the U-bend recedes back while left & right wings curve forward
              - Scrolling/swiping or clicking any card rotates it into the center
                and steps it forward while the remaining cards stay visible in the back U-bend
              ================================================================== */}
          <div
            className="vm-bent-arc-section"
            data-m-reveal
            aria-label="VOID 6-Feature 3D U-Bend Carousel"
          >
            <div
              className="vm-feature-stack-stage"
              role="tablist"
              aria-label="Select or swipe VOID Feature"
              onPointerDown={(e) => {
                arcDragStartXRef.current = e.clientX;
                arcDidDragRef.current = false;
              }}
              onPointerMove={(e) => {
                if (arcDragStartXRef.current === null) return;
                const deltaX = e.clientX - arcDragStartXRef.current;
                const stepThreshold = 36;
                if (Math.abs(deltaX) >= stepThreshold) {
                  arcDidDragRef.current = true;
                  const total = BENT_ARC_FEATURES.length;
                  if (deltaX < 0) {
                    setActiveArcIndex((prev) => (prev + 1) % total);
                  } else {
                    setActiveArcIndex((prev) => (prev - 1 + total) % total);
                  }
                  arcDragStartXRef.current = e.clientX;
                }
              }}
              onPointerUp={() => {
                arcDragStartXRef.current = null;
              }}
              onPointerCancel={() => {
                arcDragStartXRef.current = null;
              }}
              onPointerLeave={() => {
                arcDragStartXRef.current = null;
              }}
              onWheel={(e) => {
                if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 10) {
                  return;
                }
                const now = performance.now();
                if (now - arcWheelCooldownRef.current < 220) return;
                arcWheelCooldownRef.current = now;
                const total = BENT_ARC_FEATURES.length;
                if (e.deltaX > 0) {
                  setActiveArcIndex((prev) => (prev + 1) % total);
                } else {
                  setActiveArcIndex((prev) => (prev - 1 + total) % total);
                }
              }}
            >
              {BENT_ARC_FEATURES.map((item, idx) => {
                const total = BENT_ARC_FEATURES.length;
                let relStep = (idx - activeArcIndex) % total;
                if (relStep < 0) relStep += total;
                // Map circular steps (0..5) to (-2, -1, 0, +1, +2, +3):
                // 0 = selected center-front card
                // -1, +1 = inner U-bend cards (recessed back)
                // -2, +2 = outer U-bend wing cards (curving forward toward viewer)
                // 3 = deepest back-center card of the U-bend
                const signedStep = relStep > 3 ? relStep - total : relStep;
                const isFocused = signedStep === 0;
                return (
                  <button
                    key={item.num}
                    type="button"
                    role="tab"
                    aria-selected={isFocused}
                    data-u-step={signedStep}
                    className={`vm-feature-stack-card vm-feature-stack-card--${idx} ${
                      isFocused ? 'is-focused' : ''
                    }`}
                    onClick={() => {
                      if (arcDidDragRef.current) {
                        arcDidDragRef.current = false;
                        return;
                      }
                      setActiveArcIndex(idx);
                    }}
                  >
                    <div className="vm-feature-stack-card__inner">
                      <img
                        src={item.imgSrc}
                        alt=""
                        draggable={false}
                        className={`vm-feature-stack-card__img ${item.imgClass}`}
                      />
                      <div className="vm-feature-stack-card__shade" aria-hidden="true" />
                      <div className="vm-feature-stack-card__light-slit" aria-hidden="true" />

                      <div className="vm-feature-stack-card__content">
                        <div className="vm-feature-stack-card__top">
                          <span className="vm-feature-stack-card__num">{item.num}</span>
                          <span className="vm-feature-stack-card__top-name">
                            {item.topName}
                          </span>
                        </div>

                        <div className="vm-feature-stack-card__bottom">
                          <span className="vm-feature-stack-card__title">
                            {item.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dedicated Feature Description Space Below the 6-Card 3D Overlapping Stack */}
            <div
              key={selectedArcFeature.num}
              className="vm-bent-feature-detail"
              role="tabpanel"
            >
              <div className="vm-bent-feature-detail__kicker">
                <span>F E A T U R E S</span>
                <span className="vm-bent-feature-detail__dot" aria-hidden="true">
                  ·
                </span>
                <span>
                  {selectedArcFeature.num} — {selectedArcFeature.title.toUpperCase()}
                </span>
              </div>
              <h3 className="vm-bent-feature-detail__heading">
                {selectedArcFeature.featureHeading}
              </h3>
              <p className="vm-bent-feature-detail__body">
                {selectedArcFeature.body}
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================================
            SECTION 3 — CURVED OVERLAPPING VINYL CASCADE (Matches E8F4AF8E-6C06-4798-9157-FAC7C58B9C29.png)
            - No "THE VINYL ARCHIVE" text header about vinyls
            - 4 VOID Vinyls arranged in an overlapping C-curve (one overlapping on top
              of the next along a curve) that actively descend & rotate on scroll
            - Minimal pointer line + small VOID artwork square + feature callout
            ==================================================================== */}
        <section
          id="m-preview"
          ref={cascadeSectionRef}
          className="vm-section vm-vinyl-curve-section"
          aria-label="VOID Acoustic Architecture Curve"
        >
          <div className="vm-vinyl-curve-stage">
            {CURVED_VINYL_FEATURES.map((item, index) => {
              const isCalloutRight = item.calloutSide === 'right';
              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    cascadeRowRefs.current[index] = el;
                  }}
                  className={`vm-curve-row ${item.stepClass}`}
                   style={{ zIndex: index + 2 }}
                >
                  {/* Overlapping Curved VOID Vinyl Disc (Descends & Rotates on Scroll) */}
                  <div
                    ref={(el) => {
                      cascadeVinylRefs.current[index] = el;
                    }}
                    className={`vm-cascade-vinyl-disc ${item.tintClass}`}
                  >
                    <div className="void-vinyl-platter-base vm-cascade-platter">
                      <div className="void-vinyl-world-anisotropic-light" />

                      <div className="void-vinyl-spinning-disc vm-cascade-static-disc">
                        <img
                          src="/assets/vinyl-disc.png"
                          alt=""
                          decoding="async"
                          draggable={false}
                          className="void-vinyl-grooves-canvas"
                        />

                        {/* Recessed Center Label with Small Desktop-Matching 4-Cardinal V-O-I-D */}
                        <div className="void-vinyl-center-label vm-cascade-center-label">
                          <div className="void-vinyl-label-patina" />
                          <div className="void-vinyl-label-engraving" />
                          <div
                            className="void-vinyl-label-ring-letters"
                            aria-label="VOID"
                          >
                            <span className="void-vinyl-cardinal-char void-vinyl-cardinal-char--left">
                              V
                            </span>
                            <span className="void-vinyl-cardinal-char void-vinyl-cardinal-char--top">
                              O
                            </span>
                            <span className="void-vinyl-cardinal-char void-vinyl-cardinal-char--right">
                              I
                            </span>
                            <span className="void-vinyl-cardinal-char void-vinyl-cardinal-char--bottom">
                              D
                            </span>
                          </div>
                          <div className="void-vinyl-spindle-pin" />
                        </div>
                      </div>

                      <div className="void-vinyl-rim-specular-arc" />
                    </div>
                  </div>

                  {/* Minimal Editorial Pointer Line & Feature Callout (Matches E8F4AF8E-6C06-4798-9157-FAC7C58B9C29.png) */}
                  <div
                    ref={(el) => {
                      cascadeCalloutRefs.current[index] = el;
                    }}
                    className={`vm-curve-callout ${
                      isCalloutRight
                        ? 'vm-curve-callout--right'
                        : 'vm-curve-callout--left'
                    }`}
                  >
                    <div className="vm-curve-callout__line" aria-hidden="true" />
                    <div className="vm-curve-callout__info">
                      <div className="vm-curve-callout__thumb">
                        <EclipseArtwork
                          config={item.eclipseConfig}
                          isPlaying={false}
                          size="thumb"
                        />
                      </div>
                      <div className="vm-curve-callout__copy">
                        <span className="vm-curve-callout__label">
                          {item.label}
                        </span>
                        <span className="vm-curve-callout__detail">
                          {item.detail}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ====================================================================
            SECTION 4 — DOWNLOAD (Pure Colorless Crystal Glass Button)
            ==================================================================== */}
        <section
          id="m-download"
          className="vm-section vm-download-section"
          aria-labelledby="vm-download-heading"
        >
          <div className="vm-download-centered" data-m-reveal>
            <div className="vm-section-header">
              <p className="void-noir-eyebrow">D O W N L O A D</p>
              <h2 id="vm-download-heading" className="vm-section-title">
                ACQUIRE VOID.
              </h2>
              <p className="vm-section-sub">
                Select your platform below to reveal its dedicated build.
              </p>
            </div>

            <div
              className="void-noir-platform-segmented vm-platform-segmented"
              role="tablist"
              aria-label="Choose platform"
            >
              {PLATFORM_OPTIONS.map((plat) => {
                const isSelected = selectedPlatform.id === plat.id;
                return (
                  <button
                    key={plat.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`void-noir-platform-tab vm-platform-tab ${
                      isSelected ? 'is-active' : ''
                    }`}
                    onClick={() => {
                      onSelectPlatform(plat);
                      setDownloadStatus(null);
                    }}
                  >
                    {plat.name}
                  </button>
                );
              })}
            </div>

            <div
              key={selectedPlatform.id}
              className="void-noir-active-download-card vm-download-card"
              role="tabpanel"
            >
              <h3 className="void-noir-download-plat-title">
                {selectedPlatform.name}
              </h3>
              <p className="void-noir-download-plat-meta">
                <span>{selectedPlatform.subtitle}</span>
                <span className="void-noir-download-meta-sep" aria-hidden="true">
                  ·
                </span>
                <span>{selectedPlatform.version}</span>
              </p>

              <div className="void-noir-download-cta-wrap">
                <button
                  type="button"
                  className="void-noir-download-btn vm-pure-glass-download-btn"
                  onClick={() => handleTriggerDownload(selectedPlatform)}
                >
                  <span>Download for {selectedPlatform.name}</span>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M8 2.75v7.5" />
                    <path d="M4.75 7.25 8 10.5l3.25-3.25" />
                    <path d="M3.25 13.25h9.5" />
                  </svg>
                </button>
              </div>

              {downloadStatus && (
                <p className="void-noir-download-notice" role="status">
                  {downloadStatus}
                </p>
              )}
            </div>

            <div className="vm-corner-mark" aria-label="Brand copyright">
              <span className="void-noir-corner-mark__brand">V O I D</span>
              <span className="void-noir-corner-mark__sep" aria-hidden="true">
                ·
              </span>
              <span className="void-noir-corner-mark__year">© 2024 EDITION</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
