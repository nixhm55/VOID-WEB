export type NavigationSection = 'home' | 'features' | 'discover' | 'experience' | 'library' | 'download' | 'about';

export type AmbientLightingMode = 'champagne-noir' | 'obsidian-silver';

export type SpatialAudioMode = 'Void Spatial' | 'Liquid Studio' | 'Pure Direct';

export interface EclipseVisualConfig {
  fissureAngleDeg: number;
  fissureIntensity: number;
  nebulaHue: string;
  nebulaSecondary: string;
  haloBrightness: number;
  cloudDensity: number;
  baseFreqHz: number;
  chordRatios: [number, number, number, number];
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
  durationFormatted: string;
  defaultElapsedSeconds: number;
  bpm: number;
  keySignature: string;
  spatialFormat: string;
  isFeaturedHero: boolean;
  eclipseConfig: EclipseVisualConfig;
}

export interface PlatformOption {
  id: string;
  name: string;
  subtitle: string;
  architecture: string;
  version: string;
  badge: string;
}

export interface FeatureHighlight {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  metricLabel: string;
  metricValue: string;
}

export interface Transform3DState {
  translateX: number;
  translateY: number;
  translateZ: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  opacity: number;
  specularShiftX: number;
  specularShiftY: number;
}

export interface CoordinatedSceneMotion {
  heroScrollProgress: number;
  pageScrollProgress: number;
  scrollVelocity: number;
  pointerX: number;
  pointerY: number;
  elapsedTime: number;
  reducedMotion: boolean;
  mainPlayer: Transform3DState;
  leftPanel: Transform3DState;
  rightPanel: Transform3DState;
  heroTextOffsetY: number;
  heroTextOpacity: number;
}


