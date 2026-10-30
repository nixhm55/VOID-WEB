import React from 'react';
import { EclipseVisualConfig } from '../types/void';

interface EclipseArtworkProps {
  config: EclipseVisualConfig;
  isPlaying?: boolean;
  size?: 'hero' | 'thumb' | 'card';
  className?: string;
}

/**
 * Hardware-accelerated 3D Pinched Burgundy Leather Album Cover.
 * Uses pre-baked /assets/eclipse-cover.png for 0ms instant rendering across all player cards.
 */
export const EclipseArtwork: React.FC<EclipseArtworkProps> = React.memo(({
  isPlaying = false,
  size = 'hero',
  className = '',
}) => {
  return (
    <div
      className={`void-eclipse-artwork void-eclipse-${size} ${
        isPlaying ? 'is-playing-pulse' : ''
      } ${className}`}
    >
      <img
        src="/assets/eclipse-cover.png"
        alt=""
        decoding="async"
        draggable={false}
        className="void-eclipse-canvas"
      />
      <div className="void-eclipse-glass-sheen" aria-hidden="true" />
    </div>
  );
});
