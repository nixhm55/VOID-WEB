import React, { useRef, useState } from 'react';

export type LiquidButtonVariant = 'primary' | 'secondary' | 'compact' | 'icon';

export interface LiquidButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: LiquidButtonVariant;
  active?: boolean;
  magneticStrength?: number;
  children: React.ReactNode;
}

/**
 * VOID — OBSIDIAN NOIR Signature Burgundy-Tinted Liquid-Glass Button.
 * Used exclusively for buttons and compact interactive controls.
 */
export const LiquidButton: React.FC<LiquidButtonProps> = ({
  variant = 'primary',
  active = false,
  magneticStrength = 4.0,
  className = '',
  disabled = false,
  children,
  onMouseMove,
  onMouseLeave,
  ...rest
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const el = btnRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / Math.max(1, rect.width);
      const py = (e.clientY - rect.top) / Math.max(1, rect.height);
      const dx = (px - 0.5) * magneticStrength * 2;
      const dy = (py - 0.5) * magneticStrength * 2;

      el.style.setProperty('--lq-x', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--lq-y', `${(py * 100).toFixed(1)}%`);
      el.style.setProperty('--lq-tx', `${dx.toFixed(2)}px`);
      el.style.setProperty('--lq-ty', `${dy.toFixed(2)}px`);
    }
    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const handlePointerEnter = () => {
    if (!disabled) {
      setIsHovered(true);
    }
  };

  const handlePointerLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    const el = btnRef.current;
    if (el) {
      el.style.setProperty('--lq-x', '50%');
      el.style.setProperty('--lq-y', '26%');
      el.style.setProperty('--lq-tx', '0px');
      el.style.setProperty('--lq-ty', '0px');
    }
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  return (
    <button
      ref={btnRef}
      type="button"
      disabled={disabled}
      className={`void-liquid-btn void-liquid-btn--${variant} ${
        active ? 'is-active' : ''
      } ${isHovered ? 'is-hovered' : ''} ${className}`}
      onMouseEnter={handlePointerEnter}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      {...rest}
    >
      <span className="void-liquid-btn__vessel" aria-hidden="true">
        <span className="void-liquid-btn__water-core" />
        <span className="void-liquid-btn__caustic-wave" />
        <span className="void-liquid-btn__meniscus-top" />
        <span className="void-liquid-btn__meniscus-bottom" />
      </span>
      <span className="void-liquid-btn__content">{children}</span>
    </button>
  );
};
