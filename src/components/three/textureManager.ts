import * as THREE from "three";
import {
  createProceduralEarthTexture,
  createProceduralEarthNightTexture,
  createProceduralEarthCloudsTexture,
  createProceduralMoonTexture,
  createProceduralMarsTexture,
  createProceduralVenusTexture,
  createProceduralJupiterTexture,
  createProceduralSaturnTexture,
  createProceduralSaturnRingAlpha,
  createProceduralSunTexture,
  createProceduralStarsTexture,
  createMliNormalMap,
} from "./proceduralTextures";

export type CelestialBody =
  | "earth"
  | "moon"
  | "mars"
  | "venus"
  | "mercury"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "sun"
  | "stars";

export type TextureMapType =
  | "color"
  | "night"
  | "clouds"
  | "normal"
  | "specular"
  | "displacement"
  | "alpha"
  | "ring_alpha"
  | "milkyway";

export type ResolutionTier = "1k" | "2k" | "4k";
export type GraphicsQuality = "LOW" | "MEDIUM" | "HIGH" | "ULTRA";

/**
 * Static Manifest of verified real NASA / planetary textures in public/textures/
 */
export const TEXTURE_MANIFEST: Record<
  string,
  { ext: "webp" | "png" | "jpg"; tiers: ResolutionTier[] }
> = {
  "earth/color": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "earth/night": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "earth/clouds": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "earth/normal": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "earth/specular": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "moon/color": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "mars/color": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "venus/color": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "mercury/color": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "jupiter/color": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "saturn/color": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "saturn/ring_alpha": { ext: "png", tiers: ["1k", "2k", "4k"] },
  "uranus/color": { ext: "webp", tiers: ["1k", "2k"] },
  "neptune/color": { ext: "webp", tiers: ["1k", "2k"] },
  "sun/color": { ext: "webp", tiers: ["1k", "2k", "4k"] },
  "stars/milkyway": { ext: "webp", tiers: ["1k", "2k", "4k"] },
};

/** Texture in-memory singleton cache to prevent duplicate GPU memory consumption */
const textureCache = new Map<string, THREE.Texture>();

/** Warned fallback flags to avoid spamming the console */
const warnedFallbacks = new Set<string>();

/**
 * Computes target resolution tier based on user quality and client capabilities.
 */
export function getEffectiveTextureTier(
  quality: GraphicsQuality,
  isMobile = false
): ResolutionTier {
  if (quality === "LOW") return "1k";
  if (quality === "MEDIUM") return isMobile ? "1k" : "2k";
  if (quality === "HIGH") return "2k";
  return isMobile ? "2k" : "4k"; // ULTRA
}

/**
 * Checks if running on a mobile / touch handheld device.
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
}

/**
 * Builds the URL for a texture map.
 */
export function getTextureUrl(
  body: CelestialBody,
  map: TextureMapType,
  tier: ResolutionTier
): string | null {
  const key = `${body}/${map}`;
  const manifestEntry = TEXTURE_MANIFEST[key];
  if (!manifestEntry) return null;

  // If requested tier is not in manifest (e.g. 4k on Uranus), fallback to highest available
  const availableTier = manifestEntry.tiers.includes(tier)
    ? tier
    : manifestEntry.tiers[manifestEntry.tiers.length - 1] ?? "1k";

  return `/textures/${body}/${body}_${map}_${availableTier}.${manifestEntry.ext}`;
}

/**
 * Generates an appropriate procedural fallback texture for a given body and map type.
 */
export function getProceduralFallback(body: CelestialBody, map: TextureMapType): THREE.Texture {
  if (body === "earth") {
    if (map === "night") return createProceduralEarthNightTexture();
    if (map === "clouds") return createProceduralEarthCloudsTexture();
    if (map === "normal") return createMliNormalMap();
    return createProceduralEarthTexture();
  }
  if (body === "moon") return createProceduralMoonTexture();
  if (body === "mars") return createProceduralMarsTexture();
  if (body === "venus") return createProceduralVenusTexture();
  if (body === "jupiter") return createProceduralJupiterTexture();
  if (body === "saturn") {
    if (map === "ring_alpha") return createProceduralSaturnRingAlpha();
    return createProceduralSaturnTexture();
  }
  if (body === "sun") return createProceduralSunTexture();
  if (body === "stars") return createProceduralStarsTexture();

  // Generic fallback
  return createProceduralEarthTexture();
}

/**
 * Applies color space, anisotropy, wrapping, and mipmapping according to map semantics.
 */
export function configureTextureProperties(
  texture: THREE.Texture,
  map: TextureMapType,
  maxAnisotropy = 8
): void {
  // Colour maps must be sRGB; normal, specular, alpha must be linear (NoColorSpace)
  if (map === "color" || map === "night" || map === "milkyway") {
    texture.colorSpace = THREE.SRGBColorSpace;
  } else {
    texture.colorSpace = THREE.NoColorSpace;
  }

  // Prevent seam at prime meridian and polar pinching
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  texture.needsUpdate = true;
}

/**
 * Loads a texture with automatic fallback to procedural generation upon error.
 * Guaranteed never to throw or cause unhandled Promise rejections.
 */
export async function loadTextureSafe(
  body: CelestialBody,
  map: TextureMapType,
  tier: ResolutionTier,
  maxAnisotropy = 8
): Promise<THREE.Texture> {
  const cacheKey = `${body}_${map}_${tier}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const url = getTextureUrl(body, map, tier);
  if (!url) {
    const fallback = getProceduralFallback(body, map);
    configureTextureProperties(fallback, map, maxAnisotropy);
    textureCache.set(cacheKey, fallback);
    return fallback;
  }

  const loader = new THREE.TextureLoader();

  return new Promise<THREE.Texture>((resolve) => {
    loader.load(
      url,
      (loadedTexture) => {
        configureTextureProperties(loadedTexture, map, maxAnisotropy);
        textureCache.set(cacheKey, loadedTexture);
        resolve(loadedTexture);
      },
      undefined,
      (err) => {
        const warnKey = `${body}_${map}`;
        if (!warnedFallbacks.has(warnKey)) {
          warnedFallbacks.add(warnKey);
          const errMsg = err instanceof Error ? err.message : "File missing or inaccessible.";
          console.warn(
            `[MoonLander 3D] Failed to load ${url}: ${errMsg}. Activating procedural fallback for ${body}:${map}.`
          );
        }
        const fallback = getProceduralFallback(body, map);
        configureTextureProperties(fallback, map, maxAnisotropy);
        textureCache.set(cacheKey, fallback);
        resolve(fallback);
      }
    );
  });
}

/**
 * Progressively loads a body texture:
 * If tier is 2k or 4k, quickly loads 1k first for immediate rendering,
 * then returns a promise for the higher tier.
 */
export async function loadTextureProgressive(
  body: CelestialBody,
  map: TextureMapType,
  targetTier: ResolutionTier,
  onFastLoaded?: (t1k: THREE.Texture) => void,
  maxAnisotropy = 8
): Promise<THREE.Texture> {
  // If target is 1k, load directly
  if (targetTier === "1k") {
    return loadTextureSafe(body, map, "1k", maxAnisotropy);
  }

  // Load 1k in parallel for immediate display
  const p1k = loadTextureSafe(body, map, "1k", maxAnisotropy);
  p1k.then((t1k) => {
    if (onFastLoaded) onFastLoaded(t1k);
  });

  // Load target tier
  return loadTextureSafe(body, map, targetTier, maxAnisotropy);
}

/**
 * Disposes all cached textures and frees WebGL memory.
 */
export function disposeTextureCache(): void {
  for (const texture of textureCache.values()) {
    texture.dispose();
  }
  textureCache.clear();
}
