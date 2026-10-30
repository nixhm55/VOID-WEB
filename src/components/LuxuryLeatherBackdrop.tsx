import React, { useEffect, useRef } from 'react';
import { STAGE_DOM_REFS } from '../hooks/useScrollAndMotion';

interface LuxuryLeatherBackdropProps {
  isPlaying: boolean;
}

/**
 * Ultra-fast hardware-accelerated Luxury Leather & Turntable Backdrop.
 * Uses pre-rendered static PNG textures (/assets/hero-leather.png, /assets/leather-tile.png, /assets/vinyl-disc.png)
 * decoded directly by the browser's C++/GPU image pipeline with ZERO main-thread CPU loops on reload.
 */
export const LuxuryLeatherBackdrop: React.FC<LuxuryLeatherBackdropProps> = React.memo(
  ({ isPlaying }) => {
    const heroFeaturesImgRef = useRef<HTMLImageElement>(null);
    const vinylSpinningDiscRef = useRef<HTMLDivElement>(null);
    const vinylAssemblyRef = useRef<HTMLDivElement>(null);
    const leatherScrollStageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      STAGE_DOM_REFS.vinylPlatterEl = vinylAssemblyRef.current;
      STAGE_DOM_REFS.vinylSpinningDiscEl = vinylSpinningDiscRef.current;
      STAGE_DOM_REFS.leatherStageEl = leatherScrollStageRef.current;
      STAGE_DOM_REFS.leatherCanvasEl = heroFeaturesImgRef.current;
      return () => {
        STAGE_DOM_REFS.vinylPlatterEl = null;
        STAGE_DOM_REFS.vinylSpinningDiscEl = null;
        STAGE_DOM_REFS.leatherStageEl = null;
        STAGE_DOM_REFS.leatherCanvasEl = null;
      };
    }, []);

    return (
      <div className="void-continuous-leather-world" aria-hidden="true">
        {/* Base Full-Page Dark Burgundy Pebble-Leather Hide */}
        <div
          className="void-leather-base-hide"
          style={{ backgroundImage: "url('/assets/leather-tile.png')" }}
        />

        {/* Continuous Scroll-Linked 2-Screen Sculpted Burgundy Leather Folds + Single Spinning Vinyl Platter */}
        <div ref={leatherScrollStageRef} className="void-leather-scroll-stage">
          <img
            ref={heroFeaturesImgRef}
            src="/assets/hero-leather.png"
            alt=""
            decoding="sync"
            fetchPriority="high"
            draggable={false}
            className="void-continuous-leather-canvas"
          />

          {/* Single Photorealistic Spinning Vinyl Record / Turntable Platter */}
          <div
            ref={vinylAssemblyRef}
            className={`void-vinyl-turntable-assembly ${
              isPlaying ? 'is-spinning-active' : 'is-spinning-ambient'
            }`}
          >
            {/* Outer Dark Bronze & Burgundy Double-Beveled Turntable Platter Base */}
            <div className="void-vinyl-platter-base">
              {/* Oiled Glossy Studio Illumination & Rim Sheen */}
              <div className="void-vinyl-world-anisotropic-light" />

              {/* Rotating Physical Oiled Leather-Velvet Grooved Disc + 4-Cardinal VOID Center Label */}
              <div ref={vinylSpinningDiscRef} className="void-vinyl-spinning-disc">
                <img
                  src="/assets/vinyl-disc.png"
                  alt=""
                  decoding="sync"
                  fetchPriority="high"
                  draggable={false}
                  className="void-vinyl-grooves-canvas"
                />

                {/* Recessed Center Label with V (Left), O (Top), I (Right), D (Bottom) around Center Hole */}
                <div className="void-vinyl-center-label">
                  <div className="void-vinyl-label-patina" />
                  <div className="void-vinyl-label-engraving" />
                  <div className="void-vinyl-label-ring-letters" aria-label="VOID">
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

              {/* Gleaming Oiled Circumference Rim Catchlight & 3D Pioneer PA-1000 Tonearm */}
              <div className="void-vinyl-rim-specular-arc" />
              <img
                src="/assets/tonearm.png"
                alt=""
                decoding="sync"
                fetchPriority="high"
                draggable={false}
                className="void-vinyl-tonearm-assembly"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Soft Cinematic Obsidian Vignette */}
        <div className="void-leather-cinematic-vignette" />
      </div>
    );
  }
);
