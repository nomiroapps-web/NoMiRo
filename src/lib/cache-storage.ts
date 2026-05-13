/**
 * Cache Storage API Service
 * 
 * Provides programmatic control over the Cache Storage API
 * for offline-first network resource caching.
 */

const APP_CACHE = "nomiro-app-v1";
const API_CACHE = "nomiro-api-v1";
const IMAGE_CACHE = "nomiro-images-v1";

/**
 * Pre-cache essential app shell resources.
 */
export async function precacheAppShell(): Promise<void> {
  const cache = await caches.open(APP_CACHE);
  const essentialUrls = [
    "/",
    "/index.html",
    "/favicon.ico",
    "/icon-192.png",
    "/icon-512.png",
  ];

  try {
    await cache.addAll(essentialUrls);
  } catch (err) {
    console.warn("[CacheStorage] Failed to precache some resources:", err);
  }
}

/**
 * Cache an API response.
 */
export async function cacheApiResponse(url: string, response: Response): Promise<void> {
  const cache = await caches.open(API_CACHE);
  await cache.put(url, response.clone());
}

/**
 * Get a cached API response.
 */
export async function getCachedApiResponse(url: string): Promise<Response | undefined> {
  const cache = await caches.open(API_CACHE);
  return cache.match(url);
}

/**
 * Cache an image.
 */
export async function cacheImage(url: string, response: Response): Promise<void> {
  const cache = await caches.open(IMAGE_CACHE);
  await cache.put(url, response.clone());
}

/**
 * Get a cached image.
 */
export async function getCachedImage(url: string): Promise<Response | undefined> {
  const cache = await caches.open(IMAGE_CACHE);
  return cache.match(url);
}

/**
 * Network-first fetch with cache fallback.
 */
export async function fetchWithCache(
  url: string,
  options?: RequestInit,
  cacheName: string = API_CACHE
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(url, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(url);
    if (cached) return cached;
    throw new Error(`Network request failed and no cache available for: ${url}`);
  }
}

/**
 * Clear all app caches.
 */
export async function clearAllCaches(): Promise<void> {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((n) => n.startsWith("nomiro-"))
      .map((n) => caches.delete(n))
  );
}

/**
 * Get cache storage usage estimate.
 */
export async function getCacheStats(): Promise<{ usage: number; quota: number } | null> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return null;
}
