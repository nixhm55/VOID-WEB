const preloader = document.getElementById('sitePreloader');
const label = document.getElementById('sitePreloaderLabel');
const progress = document.getElementById('sitePreloaderProgress');
const interactiveMounts = [
  document.getElementById('page1HeroMount'),
  document.getElementById('page2RingMount'),
  document.getElementById('page2CardsMount'),
  document.getElementById('page3ShowcaseMount'),
].filter((mount) => mount instanceof HTMLElement);

interactiveMounts.forEach((mount) => {
  mount.inert = true;
});

const ringImages = ['outer', 'inner'].flatMap((side) =>
  Array.from({ length: 12 }, (_, index) => `/ring/${side}/${index + 1}.jpeg`)
);
const showcaseImages = ['page3Photo', 'visionBgImage']
  .map((id) => document.getElementById(id))
  .filter((image) => image instanceof HTMLImageElement)
  .map((image) => image.currentSrc || image.src);
const imageSources = [...ringImages, ...showcaseImages];
let loadedCount = 0;

function preloadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      try {
        await image.decode();
      } catch (error) {
        console.warn(`[preloader] Could not decode ${src}`, error);
      }
      resolve();
    };
    image.onerror = () => {
      console.warn(`[preloader] Could not load ${src}`);
      resolve();
    };
    image.src = src;
  }).then(() => {
    loadedCount += 1;
    if (label) label.textContent = `Preparing visuals ${loadedCount} / ${imageSources.length}`;
    if (progress) progress.style.transform = `scaleX(${loadedCount / imageSources.length})`;
  });
}

await Promise.all(imageSources.map(preloadImage));

interactiveMounts.forEach((mount) => {
  mount.inert = false;
});
document.body.setAttribute('aria-busy', 'false');
document.body.classList.remove('is-preloading');
if (label) label.textContent = 'Ready';

window.setTimeout(() => {
  preloader?.remove();
}, 350);
