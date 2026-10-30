/**
 * Persistent GPU Texture & DataURL Cache across Browser Reloads.
 * Stores deterministic procedural canvas renders in the browser's CacheStorage
 * and decodes them off the main thread via createImageBitmap() in < 5ms on reload.
 */

const CACHE_NAME = 'void-gpu-textures-v2';
const memoryBitmapCache = new Map<string, ImageBitmap>();
const memoryDataUrlCache = new Map<string, string>();

export async function getCachedCanvasBitmap(key: string): Promise<ImageBitmap | null> {
  if (typeof window === 'undefined' || typeof createImageBitmap === 'undefined') {
    return null;
  }

  const mem = memoryBitmapCache.get(key);
  if (mem) return mem;

  if (typeof caches === 'undefined') return null;

  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(`https://void.local/textures/${key}`);
    if (!response) return null;
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    memoryBitmapCache.set(key, bitmap);
    return bitmap;
  } catch {
    return null;
  }
}

export function saveCanvasToCache(key: string, canvas: HTMLCanvasElement): void {
  if (typeof window === 'undefined') return;

  if (typeof createImageBitmap !== 'undefined' && !memoryBitmapCache.has(key)) {
    createImageBitmap(canvas)
      .then((bmp) => {
        memoryBitmapCache.set(key, bmp);
      })
      .catch(() => {});
  }

  if (typeof caches === 'undefined' || !canvas.toBlob) return;

  const schedule =
    typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback
      : (cb: () => void) => window.setTimeout(cb, 120);

  schedule(() => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(
            `https://void.local/textures/${key}`,
            new Response(blob, {
              headers: { 'Content-Type': 'image/png' },
            })
          );
        } catch {
          // Ignore quota or private-browsing cache errors
        }
      },
      'image/png'
    );
  });
}

export function getCachedDataUrl(key: string): string | null {
  const mem = memoryDataUrlCache.get(key);
  if (mem) return mem;
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.sessionStorage.getItem(`void_tex_${key}`);
    if (stored) {
      memoryDataUrlCache.set(key, stored);
      return stored;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

export function saveCachedDataUrl(key: string, dataUrl: string): void {
  memoryDataUrlCache.set(key, dataUrl);
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`void_tex_${key}`, dataUrl);
  } catch {
    // Ignore storage quota errors
  }
}
