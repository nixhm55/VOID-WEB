import React, { useEffect, useRef, useState } from 'react';
import {
  CoordinatedSceneMotion,
  PlatformOption,
  SpatialAudioMode,
  Track,
} from '../types/void';
import {
  HERO_TRACKS,
  PLATFORM_OPTIONS,
  formatSeconds,
} from '../data/musicData';
import { EclipseArtwork } from './EclipseArtwork';
import { FloatingPlayersStage } from './FloatingPlayersStage';
import { ExperienceFrame } from './ExperienceFrame';
import { LiquidButton } from './LiquidButton';
import {
  ChevronDownIcon,
  PauseBarsIcon,
  PlayTriangleIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
  VolumeSpeakerIcon,
} from './icons/VoidIcons';

interface SupportingSectionsProps {
  tracks?: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  spatialMode: SpatialAudioMode;
  likedTrackIds: string[];
  selectedPlatform: PlatformOption;
  elapsedSeconds?: number;
  isShuffle?: boolean;
  isRepeat?: boolean;
  isMuted?: boolean;
  volume?: number;
  motion?: CoordinatedSceneMotion;
  onSelectTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleLike: (trackId: string) => void;
  onCycleSpatialMode: () => void;
  onSelectPlatform: (platform: PlatformOption) => void;
  onPrevTrack?: () => void;
  onNextTrack?: () => void;
  onSeek?: (seconds: number) => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  onToggleMute?: () => void;
  onChangeVolume?: (val: number) => void;
}

const SupportingSectionsComponent: React.FC<SupportingSectionsProps> = ({
  tracks = HERO_TRACKS,
  currentTrack,
  isPlaying,
  spatialMode,
  likedTrackIds,
  selectedPlatform,
  elapsedSeconds = currentTrack.defaultElapsedSeconds,
  isShuffle = false,
  isRepeat = false,
  isMuted = false,
  volume = 0.78,
  motion,
  onSelectTrack,
  onTogglePlay,
  onToggleLike,
  onCycleSpatialMode,
  onSelectPlatform,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleMute,
  onChangeVolume,
}) => {
  const featuresProgressRef = useRef<HTMLDivElement>(null);
  const featuresVolumeRef = useRef<HTMLDivElement>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

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

  const progressRatio = Math.max(
    0,
    Math.min(1, elapsedSeconds / Math.max(1, currentTrack.durationSeconds))
  );
  const progressPercent = (progressRatio * 100).toFixed(2);
  const effectiveVolume = isMuted ? 0 : volume;
  const volumePercent = (effectiveVolume * 100).toFixed(1);

  const handleSeekBarClick = (clientX: number) => {
    if (!featuresProgressRef.current || !onSeek) return;
    const rect = featuresProgressRef.current.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
    );
    onSeek(Math.round(ratio * currentTrack.durationSeconds));
  };

  const handleVolumeBarClick = (clientX: number) => {
    if (!featuresVolumeRef.current || !onChangeVolume) return;
    const rect = featuresVolumeRef.current.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / Math.max(1, rect.width))
    );
    onChangeVolume(Number(ratio.toFixed(2)));
  };

  const handleTriggerDownload = (platform: PlatformOption) => {
    setDownloadStatus(
      `Direct installer endpoint for ${platform.name} (${platform.architecture}) is not configured in this local build.`
    );
    window.setTimeout(() => setDownloadStatus(null), 5000);
  };

  const fallbackMotion: CoordinatedSceneMotion = motion ?? {
    heroScrollProgress: 0,
    pageScrollProgress: 0,
    scrollVelocity: 0,
    pointerX: 0,
    pointerY: 0,
    elapsedTime: 0,
    reducedMotion: false,
    mainPlayer: {
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
    },
    leftPanel: {
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
    },
    rightPanel: {
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
    },
    heroTextOffsetY: 0,
    heroTextOpacity: 1,
  };

  return (
    <div className="void-noir-sections-wrapper">
      {/* ====================================================================
          SECTION 2 — FEATURES (Matches Reference 320e4f31.png / 1st.png 1:1)
          Connected seamlessly to HERO leather folds & single spinning vinyl CD.
          Artist text "The Weeknd" replaced with "_nixhm_".
          ==================================================================== */}
      <section
        id="features"
        className="void-noir-section void-noir-features-section"
        aria-label="FEATURES"
      >
        <div className="void-noir-features-stage">
          {/* Compact Frosted Burgundy Glass Player Card on the Left (320e4f31.png) */}
          <article
            className="void-noir-glass-player-card"
            data-reveal="left"
            aria-label="VOID Compact Music Player"
          >
            {/* Top Rim Specular Glows */}
            <div className="void-noir-card-rim-glow" aria-hidden="true" />

            {/* Top Bar: Down Chevron (left) & Three Dots (right) */}
            <header className="void-noir-card-topbar">
              <button
                type="button"
                className="void-noir-card-top-btn"
                onClick={() => {
                  const previewEl = document.getElementById('preview');
                  previewEl?.scrollIntoView({ behavior: 'smooth' });
                }}
                aria-label="Expand to full preview"
              >
                <ChevronDownIcon size={16} />
              </button>

              <button
                type="button"
                className="void-noir-card-top-btn"
                onClick={onCycleSpatialMode}
                aria-label={`Audio mode: ${spatialMode}`}
                title={`Audio Mode: ${spatialMode}`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <circle cx="6" cy="12" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="18" cy="12" r="1.6" />
                </svg>
              </button>
            </header>

            {/* Square Sculpted Burgundy Leather Album Artwork */}
            <div
              className="void-noir-card-artwork-box"
              onClick={onTogglePlay}
              role="button"
              tabIndex={0}
              aria-label="Toggle playback"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTogglePlay();
                }
              }}
            >
              <EclipseArtwork
                config={currentTrack.eclipseConfig}
                isPlaying={isPlaying}
                size="hero"
              />
            </div>

            {/* Track Title ("Dreamcatcher") & Artist ("_nixhm_") */}
            <div className="void-noir-card-meta">
              <h2 className="void-noir-card-title">{currentTrack.title}</h2>
              <p className="void-noir-card-artist">{currentTrack.artist}</p>
            </div>

            {/* Scrubbable Progress Bar (1:24 — 3:56) */}
            <div className="void-noir-card-progress-wrap">
              <div
                ref={featuresProgressRef}
                className="void-noir-card-progress-hit"
                role="slider"
                tabIndex={0}
                aria-label="Seek track position"
                aria-valuemin={0}
                aria-valuemax={currentTrack.durationSeconds}
                aria-valuenow={elapsedSeconds}
                onClick={(e) => handleSeekBarClick(e.clientX)}
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
                <span>{formatSeconds(elapsedSeconds)}</span>
                <span>{currentTrack.durationFormatted}</span>
              </div>
            </div>

            {/* Transport Controls Row: Shuffle | Prev | Burgundy Liquid Pause/Play | Next | Repeat */}
            <div className="void-noir-card-controls">
              <button
                type="button"
                className={`void-noir-card-ctrl-btn ${
                  isShuffle ? 'is-active' : ''
                }`}
                onClick={onToggleShuffle}
                aria-label="Toggle shuffle"
              >
                <ShuffleIcon size={15} />
              </button>

              <button
                type="button"
                className="void-noir-card-ctrl-btn"
                onClick={onPrevTrack}
                aria-label="Previous track"
              >
                <SkipPrevIcon size={16} />
              </button>

              <LiquidButton
                variant="icon"
                active={isPlaying}
                className="void-noir-card-play-orb"
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <PauseBarsIcon size={18} />
                ) : (
                  <PlayTriangleIcon size={17} />
                )}
              </LiquidButton>

              <button
                type="button"
                className="void-noir-card-ctrl-btn"
                onClick={onNextTrack}
                aria-label="Next track"
              >
                <SkipNextIcon size={16} />
              </button>

              <button
                type="button"
                className={`void-noir-card-ctrl-btn ${
                  isRepeat ? 'is-active' : ''
                }`}
                onClick={onToggleRepeat}
                aria-label="Toggle repeat"
              >
                <RepeatIcon size={15} />
              </button>
            </div>

            {/* Bottom Volume Slider & AirPlay / Output Row */}
            <div className="void-noir-card-bottom-row">
              <button
                type="button"
                className="void-noir-card-vol-btn"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                <VolumeSpeakerIcon size={15} muted={isMuted || volume === 0} />
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
                onClick={(e) => handleVolumeBarClick(e.clientX)}
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
                aria-label="Wireless spatial output"
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
        </div>
      </section>

      {/* ====================================================================
          SECTION 3 — PREVIEW (Real Interactive VOID Music Player in Luxury Frame)
          Reuses existing player components, state, and playback logic (Section 7)
          ==================================================================== */}
      <section
        id="preview"
        className="void-noir-section void-noir-preview-section"
        aria-labelledby="preview-heading"
      >
        <div className="void-noir-container">
          <div className="void-noir-section-header" data-reveal="up">
            <p className="void-noir-eyebrow">P R E V I E W</p>
            <h2 id="preview-heading" className="void-noir-section-title">
              THE INTERACTIVE STUDIO SUITE.
            </h2>
            <p className="void-noir-section-sub">
              Experience the live VOID interface. Select tracks, scrub the
              timeline, switch spatial modes, and adjust output in real time.
            </p>
          </div>

          <div className="void-noir-preview-frame" data-reveal="scale">
            <FloatingPlayersStage
              tracks={tracks}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              elapsedSeconds={elapsedSeconds}
              isShuffle={isShuffle}
              isRepeat={isRepeat}
              isMuted={isMuted}
              volume={volume}
              likedTrackIds={likedTrackIds}
              spatialMode={spatialMode}
              motion={fallbackMotion}
              onTogglePlay={onTogglePlay}
              onSelectTrack={onSelectTrack}
              onPrevTrack={onPrevTrack ?? (() => {})}
              onNextTrack={onNextTrack ?? (() => {})}
              onSeek={onSeek ?? (() => {})}
              onToggleShuffle={onToggleShuffle ?? (() => {})}
              onToggleRepeat={onToggleRepeat ?? (() => {})}
              onToggleLike={onToggleLike}
              onToggleMute={onToggleMute ?? (() => {})}
              onChangeVolume={onChangeVolume ?? (() => {})}
              onCycleSpatialMode={onCycleSpatialMode}
            />
          </div>
        </div>
      </section>

            {/* ====================================================================
          SECTION 4 — EXPERIENCE (Real VOID Music Player in Realistic Luxury Frame)
          Positioned between PREVIEW and DOWNLOAD
          ==================================================================== */}
      <section
        id="experience"
        className="void-noir-section void-noir-experience-section"
        aria-labelledby="experience-heading"
      >
        <div className="void-noir-container">
          <div className="void-noir-section-header" data-reveal="up">
            <p className="void-noir-eyebrow">E X P E R I E N C E</p>
            <h2 id="experience-heading" className="void-noir-section-title">
              THE VOID EXPERIENCE
            </h2>
            <p className="void-noir-section-sub">
              Step inside the live VOID sanctuary. Explore your library, curate
              moods, and command playback inside the full desktop environment.
            </p>
          </div>

          <ExperienceFrame />
        </div>
      </section>

      {/* ====================================================================
          SECTION 4 — DOWNLOAD (Single Centered Platform Selector: macOS / Windows / Android)
          Shows ONLY the selected platform's download option (Section 8)
          ==================================================================== */}
      <section
        id="download"
        className="void-noir-section void-noir-download-section"
        aria-labelledby="download-heading"
      >
        <div className="void-noir-container void-noir-download-centered">
          <div className="void-noir-section-header" data-reveal="up">
            <p className="void-noir-eyebrow">D O W N L O A D</p>
            <h2 id="download-heading" className="void-noir-section-title">
              ACQUIRE VOID.
            </h2>
            <p className="void-noir-section-sub">
              Select your platform below to reveal its dedicated build.
            </p>
          </div>

          {/* Single Centered Platform Selector (macOS | Windows | Android) */}
          <div
            className="void-noir-platform-segmented"
            role="tablist"
            aria-label="Choose platform"
            data-reveal="up"
          >
            {PLATFORM_OPTIONS.map((plat) => {
              const isSelected = selectedPlatform.id === plat.id;
              return (
                <button
                  key={plat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`void-noir-platform-tab ${
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

          {/* Single Active Platform Download Card (Only the selected platform is shown) */}
          <div
            key={selectedPlatform.id}
            className="void-noir-active-download-card"
            role="tabpanel"
            data-reveal="scale"
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
                className="void-noir-download-btn"
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
        </div>

        {/* Subtle Luxury Corner Brand Inscription (No Banner, No Border) */}
        <div className="void-noir-corner-mark" aria-label="Brand copyright">
          <span className="void-noir-corner-mark__brand">V O I D</span>
          <span className="void-noir-corner-mark__sep" aria-hidden="true">·</span>
          <span className="void-noir-corner-mark__year">© 2024 EDITION</span>
        </div>
      </section>
    </div>
  );
};

export const SupportingSections = React.memo(SupportingSectionsComponent);
