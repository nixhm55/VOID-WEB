import { Track, PlatformOption, FeatureHighlight } from '../types/void';

export const HERO_TRACKS: Track[] = [
  {
    id: 'lucid-dreams',
    title: 'Dreamcatcher',
    artist: '_nixhm_',
    album: 'Obsidian Noir',
    durationSeconds: 236, // 3:56 (matches reference 320e4f31.png)
    durationFormatted: '3:56',
    defaultElapsedSeconds: 84, // 1:24 (matches reference 320e4f31.png)
    bpm: 84,
    keySignature: 'D Minor',
    spatialFormat: '96kHz / 24-bit Void Spatial',
    isFeaturedHero: true,
    eclipseConfig: {
      fissureAngleDeg: 5,
      fissureIntensity: 1.0,
      nebulaHue: 'rgba(141, 38, 56, 0.54)',
      nebulaSecondary: 'rgba(243, 233, 228, 0.24)',
      haloBrightness: 0.92,
      cloudDensity: 0.88,
      baseFreqHz: 73.42,
      chordRatios: [1, 1.5, 1.78, 2.0],
    },
  },
  {
    id: 'midnight-flow',
    title: 'Midnight Flow',
    artist: '_nixhm_',
    album: 'Singularity I',
    durationSeconds: 236,
    durationFormatted: '3:56',
    defaultElapsedSeconds: 102,
    bpm: 84,
    keySignature: 'D Minor',
    spatialFormat: '96kHz / 24-bit Void Spatial',
    isFeaturedHero: true,
    eclipseConfig: {
      fissureAngleDeg: 8,
      fissureIntensity: 0.92,
      nebulaHue: 'rgba(118, 28, 48, 0.48)',
      nebulaSecondary: 'rgba(243, 233, 228, 0.22)',
      haloBrightness: 0.85,
      cloudDensity: 0.78,
      baseFreqHz: 92.5,
      chordRatios: [1, 1.2, 1.5, 2.25],
    },
  },
  {
    id: 'echoes',
    title: 'Echoes',
    artist: 'Void',
    album: 'Singularity I',
    durationSeconds: 258,
    durationFormatted: '4:18',
    defaultElapsedSeconds: 64,
    bpm: 76,
    keySignature: 'F# Minor',
    spatialFormat: '96kHz / 24-bit Void Spatial',
    isFeaturedHero: true,
    eclipseConfig: {
      fissureAngleDeg: 3,
      fissureIntensity: 0.95,
      nebulaHue: 'rgba(88, 17, 38, 0.56)',
      nebulaSecondary: 'rgba(186, 152, 146, 0.26)',
      haloBrightness: 0.9,
      cloudDensity: 0.82,
      baseFreqHz: 110.0,
      chordRatios: [1, 1.2, 1.498, 1.8],
    },
  },
  {
    id: 'closer',
    title: 'Closer',
    artist: 'Void',
    album: 'Obsidian Horizons',
    durationSeconds: 224,
    durationFormatted: '3:44',
    defaultElapsedSeconds: 88,
    bpm: 92,
    keySignature: 'A Minor',
    spatialFormat: '192kHz / 24-bit Pure Direct',
    isFeaturedHero: true,
    eclipseConfig: {
      fissureAngleDeg: 6,
      fissureIntensity: 0.88,
      nebulaHue: 'rgba(141, 38, 56, 0.46)',
      nebulaSecondary: 'rgba(164, 151, 149, 0.28)',
      haloBrightness: 0.86,
      cloudDensity: 0.9,
      baseFreqHz: 65.41,
      chordRatios: [1, 1.5, 1.88, 2.4],
    },
  },
];

export const EXTENDED_LIBRARY_TRACKS: Track[] = [
  ...HERO_TRACKS,
  {
    id: 'progress',
    title: 'Progress',
    artist: 'Void',
    album: 'Obsidian Horizons',
    durationSeconds: 292,
    durationFormatted: '4:52',
    defaultElapsedSeconds: 118,
    bpm: 88,
    keySignature: 'C Minor',
    spatialFormat: '96kHz / 24-bit Liquid Studio',
    isFeaturedHero: false,
    eclipseConfig: {
      fissureAngleDeg: -4,
      fissureIntensity: 0.9,
      nebulaHue: 'rgba(118, 28, 48, 0.48)',
      nebulaSecondary: 'rgba(212, 199, 197, 0.24)',
      haloBrightness: 0.84,
      cloudDensity: 0.76,
      baseFreqHz: 82.41,
      chordRatios: [1, 1.33, 1.5, 2.0],
    },
  },
];

export const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    id: 'macos',
    name: 'macOS',
    subtitle: 'Desktop installer (.dmg)',
    architecture: 'macOS (.dmg)',
    version: 'v1.4.2',
    badge: 'macOS',
  },
  {
    id: 'windows',
    name: 'Windows',
    subtitle: 'Desktop installer (64-bit .exe)',
    architecture: 'Windows (.exe)',
    version: 'v1.4.2',
    badge: 'Windows',
  },
  {
    id: 'android',
    name: 'Android',
    subtitle: 'Mobile package (.apk)',
    architecture: 'Android (.apk)',
    version: 'v1.4.2',
    badge: 'Android',
  },
];

export const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    id: 'high-quality-audio',
    eyebrow: '01 / HIGH QUALITY AUDIO',
    title: 'Bit-Perfect Acoustic Depth',
    description:
      'Every instrument occupies a dedicated three-dimensional coordinate inside an obsidian acoustic chamber, preserving micro-dynamics without compression.',
    metricLabel: 'SIGNAL PATH',
    metricValue: '64-Bit Float DSP',
  },
  {
    id: 'personalized-playlists',
    eyebrow: '02 / PERSONALIZED PLAYLISTS',
    title: 'Intelligent Nocturnal Curation',
    description:
      'Adaptive playlists organize your library by harmonic key, tempo, and mood—ready whenever you enter the Void.',
    metricLabel: 'CURATION',
    metricValue: 'Harmonic Match',
  },
  {
    id: 'offline-listening',
    eyebrow: '03 / OFFLINE LISTENING',
    title: 'Uninterrupted Anywhere',
    description:
      'Cache master-grade lossless audio locally on macOS, Windows, and Android for zero-latency playback offline.',
    metricLabel: 'LATENCY FLOOR',
    metricValue: '< 1.8ms Buffer',
  },
];

export function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
