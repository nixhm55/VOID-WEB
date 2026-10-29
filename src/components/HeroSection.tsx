import React, { useEffect, useRef } from 'react';
import {
  AmbientLightingMode,
  CoordinatedSceneMotion,
  PlatformOption,
  SpatialAudioMode,
  Track,
} from '../types/void';
import { STAGE_DOM_REFS } from '../hooks/useScrollAndMotion';

interface HeroSectionProps {
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  elapsedSeconds: number;
  isShuffle: boolean;
  isRepeat: boolean;
  isMuted: boolean;
  volume: number;
  likedTrackIds: string[];
  spatialMode: SpatialAudioMode;
  lightingMode: AmbientLightingMode;
  selectedPlatform: PlatformOption;
  motion: CoordinatedSceneMotion;
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

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const heroBottomBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    STAGE_DOM_REFS.heroCopyEl = heroCopyRef.current;
    STAGE_DOM_REFS.heroBottomBarEl = heroBottomBarRef.current;
    return () => {
      STAGE_DOM_REFS.heroCopyEl = null;
      STAGE_DOM_REFS.heroBottomBarEl = null;
    };
  }, []);

  const handleScrollDown = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="void-noir-hero-section"
      aria-label="VOID Premium Music Player Hero"
    >
      <div className="void-noir-hero-inner">
        {/* Left Editorial Hero Typography & Scroll Action (Matches 3b683f8b.png 1:1) */}
        <div ref={heroCopyRef} className="void-noir-hero-copy">
          <p className="void-noir-hero-eyebrow">
            P R E M I U M &nbsp; M U S I C &nbsp; P L A Y E R
          </p>

          <h1 className="void-noir-hero-headline">
            <span className="void-noir-hero-line">YOUR MUSIC.</span>
            <span className="void-noir-hero-line">REIMAGINED.</span>
          </h1>

          <p className="void-noir-hero-subcopy">
            VOID is a modern music player built for those
            <br />
            who feel music deeper. Minimal. Powerful. Yours.
          </p>

          <div className="void-noir-hero-scroll-row">
            <button
              type="button"
              className="void-noir-scroll-circle-btn"
              onClick={handleScrollDown}
              aria-label="Scroll to Features and Download"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <polyline points="18 13 12 19 6 13" />
              </svg>
            </button>

            <button
              type="button"
              className="void-noir-scroll-label-btn"
              onClick={handleScrollDown}
            >
              S C R O L L &nbsp; T O &nbsp; D O W N L O A D
            </button>

            <span className="void-noir-scroll-rule" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Bottom 4-Column Feature Strip (Matches 3b683f8b.png bottom-left 1:1) */}
      <div ref={heroBottomBarRef} className="void-noir-hero-bottom-strip">
        <div className="void-noir-feature-mini-item">
          <span className="void-noir-feature-mini-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="12" x2="4" y2="12.01" />
              <line x1="8" y1="8" x2="8" y2="16" />
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="16" y1="8" x2="16" y2="16" />
              <line x1="20" y1="11" x2="20" y2="13" />
            </svg>
          </span>
          <span className="void-noir-feature-mini-label">
            HIGH QUALITY
            <br />
            AUDIO
          </span>
        </div>

        <div className="void-noir-feature-mini-item">
          <span className="void-noir-feature-mini-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="15" y2="7" />
              <line x1="4" y1="12" x2="13" y2="12" />
              <line x1="4" y1="17" x2="11" y2="17" />
              <polygon points="17.5 11.5 18.8 14 21.5 14.4 19.5 16.3 20 19 17.5 17.7 15 19 15.5 16.3 13.5 14.4 16.2 14 17.5 11.5" />
            </svg>
          </span>
          <span className="void-noir-feature-mini-label">
            PERSONALIZED
            <br />
            PLAYLISTS
          </span>
        </div>

        <div className="void-noir-feature-mini-item">
          <span className="void-noir-feature-mini-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              <polyline points="10 13 12 15 14 13" />
              <line x1="12" y1="10" x2="12" y2="15" />
            </svg>
          </span>
          <span className="void-noir-feature-mini-label">
            OFFLINE
            <br />
            LISTENING
          </span>
        </div>

        <div className="void-noir-feature-mini-item">
          <span className="void-noir-feature-mini-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
              <path d="M5 3v4" />
              <path d="M3 5h4" />
            </svg>
          </span>
          <span className="void-noir-feature-mini-label">
            BEAUTIFUL
            <br />
            INTERFACE
          </span>
        </div>
      </div>
    </section>
  );
};
