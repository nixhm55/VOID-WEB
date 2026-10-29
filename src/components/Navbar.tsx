import React, { useState } from 'react';
import { AmbientLightingMode, NavigationSection } from '../types/void';
import { HERO_TRACKS } from '../data/musicData';
import {
  HamburgerThreeLinesIcon,
  SearchMagnifierIcon,
} from './icons/VoidIcons';

interface NavbarProps {
  activeSection: NavigationSection;
  lightingMode: AmbientLightingMode;
  onSelectSection: (section: NavigationSection) => void;
  onToggleLightingMode: () => void;
}

const NAV_ITEMS: { id: NavigationSection; label: string; targetId: string }[] = [
  { id: 'home', label: 'HOME', targetId: 'home' },
  { id: 'features', label: 'FEATURES', targetId: 'features' },
  { id: 'discover', label: 'PREVIEW', targetId: 'preview' },
  { id: 'experience', label: 'EXPERIENCE', targetId: 'experience' },
  { id: 'download', label: 'DOWNLOAD', targetId: 'download' },
];

export const Navbar: React.FC<NavbarProps> = React.memo(({
  activeSection,
  onSelectSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavClick = (section: NavigationSection, targetId: string) => {
    onSelectSection(section);
    setMobileMenuOpen(false);

    if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredTracks = HERO_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="void-noir-navbar" role="banner">
      <div className="void-noir-navbar__inner">
        {/* Left: Spaced Editorial Serif VOID Wordmark */}
        <a
          href="#home"
          className="void-noir-brand"
          aria-label="VOID Music Player Home"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home', 'home');
          }}
        >
          V O I D
        </a>

        {/* Center: HOME, FEATURES, PREVIEW, EXPERIENCE, DOWNLOAD, FAQ with Warm Rose-Gold Active Underline */}
        <nav className="void-noir-nav" aria-label="Primary Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`void-noir-nav__link ${isActive ? 'is-active' : ''}`}
                onClick={() => handleNavClick(item.id, item.targetId)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{item.label}</span>
                <span className="void-noir-nav__underline" aria-hidden="true" />
              </button>
            );
          })}
        </nav>

        {/* Right: Minimalist Search & Hamburger Menu Icons */}
        <div className="void-noir-navbar__actions">
          <button
            type="button"
            className={`void-noir-icon-btn ${searchOpen ? 'is-active' : ''}`}
            onClick={() => {
              setSearchOpen((prev) => !prev);
              setMobileMenuOpen(false);
            }}
            aria-label="Search tracks"
            title="Search tracks"
          >
            <SearchMagnifierIcon size={18} />
          </button>

          <button
            type="button"
            className={`void-noir-icon-btn ${mobileMenuOpen ? 'is-active' : ''}`}
            onClick={() => {
              setMobileMenuOpen((prev) => !prev);
              setSearchOpen(false);
            }}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <HamburgerThreeLinesIcon size={20} />
          </button>
        </div>
      </div>

      {/* Quick Track Search Popover */}
      {searchOpen && (
        <div className="void-noir-popover" role="dialog" aria-label="Search tracks">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Lucid Dreams, _nixhm_, Midnight Flow..."
            className="void-noir-popover__input"
            autoFocus
          />
          <div className="void-noir-popover__list">
            {filteredTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                className="void-noir-popover__item"
                onClick={() => {
                  setSearchOpen(false);
                  handleNavClick('features', 'features');
                }}
              >
                <span>{track.title}</span>
                <span className="void-noir-popover__meta">
                  {track.artist} · {track.durationFormatted}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="void-noir-popover void-noir-popover--drawer" role="menu">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className={`void-noir-popover__item ${
                activeSection === item.id ? 'is-active' : ''
              }`}
              onClick={() => handleNavClick(item.id, item.targetId)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
});
