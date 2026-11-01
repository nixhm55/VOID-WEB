import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

// Guarantee Lenis, GSAP, ScrollTrigger, and Three.js are available synchronously on window
// across both Desktop and Mobile UI in Vite Dev (localhost) and Production Builds (Vercel)
if (typeof window !== 'undefined') {
  window.Lenis = Lenis;
  window.gsap = gsap;
  window.ScrollTrigger = ScrollTrigger;
  window.THREE = THREE;
}

import './preloader.js';
import '../desktop-pages/01-hero/page1-hero.js';
import '../desktop-pages/02-ring/page2-ring.js';
import '../desktop-pages/02-cards/page2-cards.js';
import '../desktop-pages/03-showcase/page3-showcase.js';
import '../mobile-pages/01-hero/page1-hero.js';
import '../mobile-pages/02-ring/page2-ring.js';
import '../mobile-pages/02-cards/page2-cards.js';
import '../mobile-pages/03-showcase/page3-showcase.js';
import '../assets/js/script.js';
