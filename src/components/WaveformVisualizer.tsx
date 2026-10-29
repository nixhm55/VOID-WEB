import React, { useEffect, useMemo, useRef } from 'react';
import { voidAmbientEngine } from '../utils/audioEngine';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  reducedMotion: boolean;
}

const BAR_COUNT = 46;

function getBarColor(index: number, total: number): string {
  const t = index / Math.max(1, total - 1);
  if (t < 0.22) return 'rgba(118, 28, 48, 0.86)';
  if (t < 0.38) return 'rgba(141, 38, 56, 0.92)';
  if (t < 0.54) return 'rgba(243, 233, 228, 0.88)';
  if (t < 0.72) return 'rgba(141, 38, 56, 0.85)';
  if (t < 0.86) return 'rgba(212, 199, 197, 0.68)';
  return 'rgba(164, 151, 149, 0.44)';
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  reducedMotion,
}) => {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const initialBars = useMemo(
    () => voidAmbientEngine.sampleWaveform(BAR_COUNT, 1.4, false),
    []
  );

  useEffect(() => {
    const applySample = (timeSec: number, active: boolean) => {
      const sample = voidAmbientEngine.sampleWaveform(BAR_COUNT, timeSec, active);
      for (let i = 0; i < BAR_COUNT; i++) {
        const el = barRefs.current[i];
        if (el) {
          const scale = (0.12 + sample[i] * 0.86).toFixed(3);
          el.style.transform = `scaleY(${scale})`;
        }
      }
    };

    if (reducedMotion || !isPlaying) {
      applySample(1.4, false);
      return;
    }

    let rafId = 0;
    let lastUpdate = 0;
    const start = performance.now();

    const tick = (now: number) => {
      if (now - lastUpdate >= 32) {
        lastUpdate = now;
        const t = (now - start) * 0.001;
        applySample(t, true);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isPlaying, reducedMotion]);

  return (
    <div className="void-waveform-container" aria-label="Audio frequency spectrum">
      <div className="void-waveform-axis" />
      <div className="void-waveform-bars">
        {initialBars.map((val, idx) => {
          const initialScale = (0.12 + val * 0.86).toFixed(3);
          return (
            <span
              key={idx}
              ref={(el) => {
                barRefs.current[idx] = el;
              }}
              className="void-waveform-bar"
              style={{
                height: '100%',
                transform: `scaleY(${initialScale})`,
                background: getBarColor(idx, BAR_COUNT),
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
