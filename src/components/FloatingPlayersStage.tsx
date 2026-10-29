import React, { useRef, useState } from 'react';
import {
  CoordinatedSceneMotion,
  SpatialAudioMode,
  Track,
} from '../types/void';
import { formatSeconds } from '../data/musicData';
import { STAGE_DOM_REFS } from '../hooks/useScrollAndMotion';
import { EclipseArtwork } from './EclipseArtwork';
import { WaveformVisualizer } from './WaveformVisualizer';
import { LiquidButton } from './LiquidButton';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseCrossIcon,
  HeartIcon,
  PauseBarsIcon,
  PlayTriangleIcon,
  PlaylistQueueIcon,
  RepeatIcon,
  ShuffleIcon,
  SkipNextIcon,
  SkipPrevIcon,
  VolumeSpeakerIcon,
  WindowFrameIcon,
  WindowHookIcon,
} from './icons/VoidIcons';

interface FloatingPlayersStageProps {
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
}

export const FloatingPlayersStage: React.FC<FloatingPlayersStageProps> = React.memo(({
  tracks,
  currentTrack,
  isPlaying,
  elapsedSeconds,
  isShuffle,
  isRepeat,
  isMuted,
  volume,
  likedTrackIds,
  spatialMode,
  motion,
  onTogglePlay,
  onSelectTrack,
  onPrevTrack,
  onNextTrack,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleMute,
  onChangeVolume,
  onCycleSpatialMode,
}) => {
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const [highlightQueue, setHighlightQueue] = useState(false);
  const [showSpatialBadge, setShowSpatialBadge] = useState(false);

  const progressRatio = Math.max(
    0,
    Math.min(1, elapsedSeconds / Math.max(1, currentTrack.durationSeconds))
  );
  const progressPercent = (progressRatio * 100).toFixed(2);
  const isLiked = likedTrackIds.includes(currentTrack.id);

  const handleSeekInteraction = (clientX: number) => {
    const bar = progressTrackRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    onSeek(Math.round(ratio * currentTrack.durationSeconds));
  };

  const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSeek(Math.min(currentTrack.durationSeconds, elapsedSeconds + 5));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSeek(Math.max(0, elapsedSeconds - 5));
    }
  };

  return (
    <div
      className="void-players-3d-stage"
      aria-label="Interactive VOID Music Player Suite"
    >
      <div className="void-studio-pedestal-aura" aria-hidden="true" />

      {/* ============================================================
          LEFT MODULE: RECENTLY PLAYED QUEUE
          ============================================================ */}
      <aside
        ref={(el) => {
          STAGE_DOM_REFS.leftPanelEl = el;
        }}
        className={`void-floating-panel void-left-recently-panel ${
          highlightQueue ? 'void-panel-pulse-highlight' : ''
        }`}
        aria-label="Recently Played Tracks"
      >
        <div className="void-panel-inner">
          <header className="void-recently-header">
            <span className="void-recently-title">Recently Played</span>
            <button
              type="button"
              className="void-recently-chevron-btn"
              onClick={onNextTrack}
              aria-label="Cycle recently played track"
              title="Next track"
            >
              <ChevronRightIcon size={12} />
            </button>
          </header>

          <ul className="void-recently-list" role="listbox" aria-label="Track list">
            {tracks.slice(0, 4).map((track) => {
              const active = track.id === currentTrack.id;
              return (
                <li key={track.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    className={`void-recently-item ${active ? 'is-active' : ''}`}
                    onClick={() => onSelectTrack(track)}
                  >
                    <div className="void-recently-thumb-wrap">
                      <EclipseArtwork
                        config={track.eclipseConfig}
                        isPlaying={active && isPlaying}
                        size="thumb"
                      />
                    </div>
                    <div className="void-recently-meta">
                      <span className="void-recently-track-name">{track.title}</span>
                      <span className="void-recently-track-artist">{track.artist}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* ============================================================
          CENTER MODULE: MAIN INTERACTIVE VOID PLAYER
          ============================================================ */}
      <section
        ref={(el) => {
          STAGE_DOM_REFS.mainPlayerEl = el;
        }}
        className="void-floating-panel void-main-glass-player"
        aria-label="Main VOID Music Player"
      >
        <div className="void-main-chassis-back" aria-hidden="true" />
        <div className="void-main-chassis-edge" aria-hidden="true" />
        <div className="void-main-top-speaker" aria-hidden="true" />

        <div className="void-main-screen">
          <header className="void-main-topbar">
            <button
              type="button"
              className="void-main-icon-btn"
              onClick={onPrevTrack}
              aria-label="Previous track"
            >
              <ChevronLeftIcon size={13} />
            </button>

            <span className="void-main-brand-title">V O I D</span>

            <div className="void-main-window-actions">
              <button
                type="button"
                className="void-main-icon-btn"
                onClick={onCycleSpatialMode}
                aria-label={`Spatial mode: ${spatialMode}`}
                title={`Audio Mode: ${spatialMode}`}
              >
                <WindowHookIcon size={11} />
              </button>
              <button
                type="button"
                className="void-main-icon-btn"
                onClick={() => {
                  const dl = document.getElementById('download');
                  dl?.scrollIntoView({ behavior: 'smooth' });
                }}
                aria-label="Scroll to Download"
                title="Acquire VOID"
              >
                <WindowFrameIcon size={12} />
              </button>
            </div>
          </header>

          <div className="void-main-artwork-stage" onClick={onTogglePlay}>
            <EclipseArtwork
              config={currentTrack.eclipseConfig}
              isPlaying={isPlaying}
              size="hero"
            />
          </div>

          <div className="void-main-track-info-row">
            <div className="void-main-track-titles">
              <h2 className="void-main-song-title">{currentTrack.title}</h2>
              <p className="void-main-song-artist">{currentTrack.artist}</p>
            </div>
            <span className="void-main-top-duration">{currentTrack.durationFormatted}</span>
          </div>

          <div className="void-main-progress-section">
            <div
              ref={progressTrackRef}
              className="void-main-progress-bar-hit"
              role="slider"
              tabIndex={0}
              aria-label="Seek playback position"
              aria-valuemin={0}
              aria-valuemax={currentTrack.durationSeconds}
              aria-valuenow={elapsedSeconds}
              onClick={(e) => handleSeekInteraction(e.clientX)}
              onKeyDown={handleProgressKeyDown}
            >
              <div className="void-main-progress-rail">
                <div
                  className="void-main-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="void-main-progress-thumb"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="void-main-timestamps">
              <span>{formatSeconds(elapsedSeconds)}</span>
              <span>{currentTrack.durationFormatted}</span>
            </div>
          </div>

          <div className="void-main-controls-row">
            <button
              type="button"
              className={`void-transport-btn void-transport-secondary ${
                isShuffle ? 'is-active' : ''
              }`}
              onClick={onToggleShuffle}
              aria-label="Toggle shuffle"
              aria-pressed={isShuffle}
            >
              <ShuffleIcon size={15} />
            </button>

            <button
              type="button"
              className="void-transport-btn"
              onClick={onPrevTrack}
              aria-label="Previous track"
            >
              <SkipPrevIcon size={16} />
            </button>

            <LiquidButton
              variant="icon"
              active={isPlaying}
              className="void-transport-liquid-play"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseBarsIcon size={17} /> : <PlayTriangleIcon size={16} />}
            </LiquidButton>

            <button
              type="button"
              className="void-transport-btn"
              onClick={onNextTrack}
              aria-label="Next track"
            >
              <SkipNextIcon size={16} />
            </button>

            <button
              type="button"
              className={`void-transport-btn void-transport-secondary ${
                isRepeat ? 'is-active' : ''
              }`}
              onClick={onToggleRepeat}
              aria-label="Toggle repeat"
              aria-pressed={isRepeat}
            >
              <RepeatIcon size={15} />
            </button>
          </div>

          <footer className="void-main-bottom-dock">
            <div className="void-dock-cell">
              <button
                type="button"
                className={`void-dock-btn ${isLiked ? 'is-liked' : ''}`}
                onClick={() => onToggleLike(currentTrack.id)}
                aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isLiked}
              >
                <HeartIcon size={15} filled={isLiked} />
              </button>
            </div>

            <div className="void-dock-cell">
              <button
                type="button"
                className={`void-dock-btn ${highlightQueue ? 'is-active' : ''}`}
                onClick={() => {
                  setHighlightQueue(true);
                  window.setTimeout(() => setHighlightQueue(false), 1100);
                }}
                aria-label="Highlight recently played queue"
              >
                <PlaylistQueueIcon size={15} />
              </button>
            </div>

            <div className="void-dock-cell void-dock-volume-cell">
              <button
                type="button"
                className="void-dock-btn"
                onClick={() => setShowVolumePopover((prev) => !prev)}
                onDoubleClick={onToggleMute}
                aria-label="Adjust volume or mute"
              >
                <VolumeSpeakerIcon size={15} muted={isMuted || volume === 0} />
              </button>

              {showVolumePopover && (
                <div className="void-volume-popover" role="dialog" aria-label="Volume control">
                  <button
                    type="button"
                    className="void-mute-mini-btn"
                    onClick={onToggleMute}
                  >
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                    className="void-volume-slider"
                    aria-label="Volume level"
                  />
                </div>
              )}
            </div>
          </footer>

          <div className="void-main-home-indicator" aria-hidden="true" />
        </div>
      </section>

      {/* ============================================================
          RIGHT MODULE: SPATIAL TELEMETRY
          ============================================================ */}
      <aside
        ref={(el) => {
          STAGE_DOM_REFS.rightPanelEl = el;
        }}
        className="void-floating-panel void-right-feature-panel"
        aria-label="Your Music Your Way Spatial Telemetry"
      >
        <div className="void-right-panel-inner">
          <button
            type="button"
            className="void-right-close-btn"
            onClick={() => setShowSpatialBadge((prev) => !prev)}
            aria-label="Toggle spatial telemetry details"
          >
            <CloseCrossIcon size={11} />
          </button>

          <div className="void-right-copy">
            <span className="void-right-kicker">DSP ENGINE</span>
            <h3 className="void-right-heading">
              Your Music
              <br />
              Your Way
            </h3>
            <p className="void-right-subcopy">
              Seamless. Beautiful.
              <br />
              Powerful.
            </p>
          </div>

          {showSpatialBadge && (
            <div className="void-right-spatial-pill">
              <span>{spatialMode}</span>
              <span>• {currentTrack.bpm} BPM</span>
            </div>
          )}

          <WaveformVisualizer isPlaying={isPlaying} reducedMotion={motion.reducedMotion} />

          <div className="void-right-footer">
            <LiquidButton
              variant="icon"
              onClick={onCycleSpatialMode}
              className="void-right-liquid-trigger"
              aria-label={`Switch spatial mode (current: ${spatialMode})`}
              title={`Current Engine: ${spatialMode} — Click to switch`}
            >
              <ArrowRightIcon size={13} />
            </LiquidButton>
            <span className="void-right-mode-caption">{spatialMode}</span>
          </div>
        </div>
      </aside>
    </div>
  );
});
