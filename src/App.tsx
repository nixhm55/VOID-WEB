import React, { useEffect, useState, useCallback } from 'react';
import {
  EXTENDED_LIBRARY_TRACKS,
  HERO_TRACKS,
  PLATFORM_OPTIONS,
  formatSeconds,
} from './data/musicData';
import {
  AmbientLightingMode,
  NavigationSection,
  PlatformOption,
  SpatialAudioMode,
  Track,
} from './types/void';
import { useScrollAndMotion } from './hooks/useScrollAndMotion';
import { voidAmbientEngine } from './utils/audioEngine';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SupportingSections } from './components/SupportingSections';
import { EclipseArtwork } from './components/EclipseArtwork';
import { LiquidButton } from './components/LiquidButton';
import { LuxuryLeatherBackdrop } from './components/LuxuryLeatherBackdrop';
import { MobileVoidExperience } from './mobile/MobileVoidExperience';
import {
  PauseBarsIcon,
  PlayTriangleIcon,
  SkipNextIcon,
  SkipPrevIcon,
} from './components/icons/VoidIcons';

const SPATIAL_MODES: SpatialAudioMode[] = ['Void Spatial', 'Liquid Studio', 'Pure Direct'];

export const App: React.FC = () => {
  const [currentTrack, setCurrentTrack] = useState<Track>(HERO_TRACKS[0]); // Dreamcatcher — _nixhm_
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(
    HERO_TRACKS[0].defaultElapsedSeconds // 84s = 1:24 (matches reference 320e4f31.png)
  );
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.42);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(['lucid-dreams']);
  const [spatialMode, setSpatialMode] = useState<SpatialAudioMode>('Void Spatial');
  const [lightingMode, setLightingMode] = useState<AmbientLightingMode>('champagne-noir');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformOption>(PLATFORM_OPTIONS[0]);
  const [activeSection, setActiveSection] = useState<NavigationSection>('home');
  const [, setShowFloatingMiniBar] = useState<boolean>(false);
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(max-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobileViewport(e.matches);
    setIsMobileViewport(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const handleThresholdChange = useCallback(
    (nextSection: NavigationSection, nextMiniDock: boolean) => {
      setActiveSection(nextSection);
      setShowFloatingMiniBar(nextMiniDock);
    },
    []
  );

  const motion = useScrollAndMotion(isPlaying, handleThresholdChange);

  // Advance playback timer when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev + 1 >= currentTrack.durationSeconds) {
          if (isRepeat) {
            return 0;
          }
          const currentIndex = EXTENDED_LIBRARY_TRACKS.findIndex(
            (t) => t.id === currentTrack.id
          );
          const nextIndex = (currentIndex + 1) % EXTENDED_LIBRARY_TRACKS.length;
          const nextTrack = EXTENDED_LIBRARY_TRACKS[nextIndex];
          setCurrentTrack(nextTrack);
          voidAmbientEngine.startTrack(nextTrack);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isPlaying, currentTrack, isRepeat]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const nextState = !prev;
      if (nextState) {
        voidAmbientEngine.startTrack(currentTrack);
      } else {
        voidAmbientEngine.pause();
      }
      return nextState;
    });
  }, [currentTrack]);

  const handleSelectTrack = useCallback(
    (track: Track) => {
      const isSame = track.id === currentTrack.id;
      setCurrentTrack(track);
      if (!isSame) {
        setElapsedSeconds(track.defaultElapsedSeconds || 0);
      }
      setIsPlaying(true);
      voidAmbientEngine.startTrack(track);
    },
    [currentTrack.id]
  );

  const handlePrevTrack = useCallback(() => {
    const idx = EXTENDED_LIBRARY_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIdx =
      (idx - 1 + EXTENDED_LIBRARY_TRACKS.length) % EXTENDED_LIBRARY_TRACKS.length;
    const prevTrack = EXTENDED_LIBRARY_TRACKS[prevIdx];
    setCurrentTrack(prevTrack);
    setElapsedSeconds(prevTrack.defaultElapsedSeconds || 0);
    if (isPlaying) {
      voidAmbientEngine.startTrack(prevTrack);
    }
  }, [currentTrack.id, isPlaying]);

  const handleNextTrack = useCallback(() => {
    let nextTrack: Track;
    if (isShuffle) {
      const candidates = EXTENDED_LIBRARY_TRACKS.filter((t) => t.id !== currentTrack.id);
      nextTrack = candidates[Math.floor(Math.random() * candidates.length)] || HERO_TRACKS[0];
    } else {
      const idx = EXTENDED_LIBRARY_TRACKS.findIndex((t) => t.id === currentTrack.id);
      const nextIdx = (idx + 1) % EXTENDED_LIBRARY_TRACKS.length;
      nextTrack = EXTENDED_LIBRARY_TRACKS[nextIdx];
    }
    setCurrentTrack(nextTrack);
    setElapsedSeconds(nextTrack.defaultElapsedSeconds || 0);
    if (isPlaying) {
      voidAmbientEngine.startTrack(nextTrack);
    }
  }, [currentTrack.id, isPlaying, isShuffle]);

  const handleSeek = useCallback((seconds: number) => {
    setElapsedSeconds(seconds);
  }, []);

  const handleToggleLike = useCallback((trackId: string) => {
    setLikedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      voidAmbientEngine.setVolume(volume, nextMuted);
      return nextMuted;
    });
  }, [volume]);

  const handleChangeVolume = useCallback((nextVal: number) => {
    setVolume(nextVal);
    setIsMuted(nextVal === 0);
    voidAmbientEngine.setVolume(nextVal, nextVal === 0);
  }, []);

  const handleCycleSpatialMode = useCallback(() => {
    setSpatialMode((prev) => {
      const idx = SPATIAL_MODES.indexOf(prev);
      return SPATIAL_MODES[(idx + 1) % SPATIAL_MODES.length];
    });
  }, []);

  const handleToggleLightingMode = useCallback(() => {
    setLightingMode((prev) =>
      prev === 'champagne-noir' ? 'obsidian-silver' : 'champagne-noir'
    );
  }, []);

  if (isMobileViewport) {
    return (
      <MobileVoidExperience
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        elapsedSeconds={elapsedSeconds}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        isMuted={isMuted}
        volume={volume}
        likedTrackIds={likedTrackIds}
        spatialMode={spatialMode}
        selectedPlatform={selectedPlatform}
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onTogglePlay={handleTogglePlay}
        onSelectTrack={handleSelectTrack}
        onPrevTrack={handlePrevTrack}
        onNextTrack={handleNextTrack}
        onSeek={handleSeek}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        onToggleRepeat={() => setIsRepeat((prev) => !prev)}
        onToggleLike={handleToggleLike}
        onToggleMute={handleToggleMute}
        onChangeVolume={handleChangeVolume}
        onCycleSpatialMode={handleCycleSpatialMode}
        onSelectPlatform={setSelectedPlatform}
      />
    );
  }

  return (
    <div className={`void-app-root lighting-${lightingMode}`}>
      {/* Continuous Flowing Burgundy Pebble-Leather Folds & Single Spinning Vinyl Stage */}
      <LuxuryLeatherBackdrop isPlaying={isPlaying} />

      <Navbar
        activeSection={activeSection}
        lightingMode={lightingMode}
        onSelectSection={setActiveSection}
        onToggleLightingMode={handleToggleLightingMode}
      />

      <main className="void-main-content">
        <HeroSection
          tracks={HERO_TRACKS}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          elapsedSeconds={elapsedSeconds}
          isShuffle={isShuffle}
          isRepeat={isRepeat}
          isMuted={isMuted}
          volume={volume}
          likedTrackIds={likedTrackIds}
          spatialMode={spatialMode}
          lightingMode={lightingMode}
          selectedPlatform={selectedPlatform}
          motion={motion}
          onTogglePlay={handleTogglePlay}
          onSelectTrack={handleSelectTrack}
          onPrevTrack={handlePrevTrack}
          onNextTrack={handleNextTrack}
          onSeek={handleSeek}
          onToggleShuffle={() => setIsShuffle((prev) => !prev)}
          onToggleRepeat={() => setIsRepeat((prev) => !prev)}
          onToggleLike={handleToggleLike}
          onToggleMute={handleToggleMute}
          onChangeVolume={handleChangeVolume}
          onCycleSpatialMode={handleCycleSpatialMode}
          onSelectPlatform={setSelectedPlatform}
        />

        <SupportingSections
          tracks={HERO_TRACKS}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          spatialMode={spatialMode}
          likedTrackIds={likedTrackIds}
          selectedPlatform={selectedPlatform}
          elapsedSeconds={elapsedSeconds}
          isShuffle={isShuffle}
          isRepeat={isRepeat}
          isMuted={isMuted}
          volume={volume}
          motion={motion}
          onSelectTrack={handleSelectTrack}
          onTogglePlay={handleTogglePlay}
          onToggleLike={handleToggleLike}
          onCycleSpatialMode={handleCycleSpatialMode}
          onSelectPlatform={setSelectedPlatform}
          onPrevTrack={handlePrevTrack}
          onNextTrack={handleNextTrack}
          onSeek={handleSeek}
          onToggleShuffle={() => setIsShuffle((prev) => !prev)}
          onToggleRepeat={() => setIsRepeat((prev) => !prev)}
          onToggleMute={handleToggleMute}
          onChangeVolume={handleChangeVolume}
        />
      </main>

          </div>
  );
};
