"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  loadTextureSafe,
  getEffectiveTextureTier,
  type ResolutionTier,
} from "./textureManager";
import { useSettingsStore } from "@/store/settings";
import {
  computeGMST,
  computeSunDirectionECI,
  toJulianDate,
  latLonToVector3,
  GROUND_SITES,
} from "@/engine/astro";

export interface EarthProps {
  radius?: number; // In Three.js scene units (default 6.378)
  epochDate?: Date; // Astronomical mission epoch
  sunDirection?: [number, number, number]; // Optional override Sun vector in ECI
  rotationSpeed?: number;
  showClouds?: boolean;
  showAtmosphere?: boolean;
  showGroundSites?: boolean;
  enableCloudShadows?: boolean;
}

// Custom Earth Surface Shader Material
const EarthSurfaceShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform sampler2D uDayMap;
    uniform sampler2D uNightMap;
    uniform sampler2D uCloudsMap;
    uniform sampler2D uNormalMap;
    uniform sampler2D uSpecularMap;
    uniform vec3 uSunDirection;
    uniform float uCloudsRotation;
    uniform bool uEnableCloudShadows;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 L = normalize(uSunDirection);
      vec3 V = normalize(-vViewPosition);

      // Normal relief perturbation from normal map
      vec3 normalSample = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
      vec3 bumpedN = normalize(N + normalSample.x * vec3(1.0, 0.0, 0.0) * 0.05 + normalSample.y * vec3(0.0, 1.0, 0.0) * 0.05);

      float NdotL = dot(bumpedN, L);
      // Soft atmospheric terminator transition
      float dayMix = smoothstep(-0.12, 0.18, NdotL);

      // Sample Day Surface Color
      vec3 dayColor = texture2D(uDayMap, vUv).rgb;

      // Cloud shadow projection on terrain (Medium+ only)
      if (uEnableCloudShadows) {
        vec2 shadowOffset = vec2(L.x, -L.z) * 0.003;
        vec2 cloudUv = vec2(vUv.x + uCloudsRotation, vUv.y) + shadowOffset;
        float shadowAlpha = texture2D(uCloudsMap, cloudUv).r;
        dayColor *= mix(1.0, 0.45, shadowAlpha);
      }

      // Specular Sun Glint on Oceans (Blinn-Phong + Fresnel)
      float specMask = texture2D(uSpecularMap, vUv).r;
      vec3 H = normalize(L + V);
      float NdotH = max(0.0, dot(bumpedN, H));
      float specularGlint = pow(NdotH, 80.0) * specMask;
      float fresnel = pow(1.0 - max(0.0, dot(N, V)), 4.0) * specMask * 0.35;
      vec3 sunSpecular = vec3(1.0, 0.95, 0.85) * (specularGlint * 1.6 + fresnel) * dayMix;

      // Day ambient + direct illumination
      vec3 earthshineAmbient = vec3(0.015, 0.03, 0.06);
      vec3 litDay = (dayColor * max(0.0, NdotL) + earthshineAmbient) + sunSpecular;

      // Night City Lights (attenuated by clouds)
      vec3 nightColor = texture2D(uNightMap, vUv).rgb * 1.4;
      vec2 cloudUvCurrent = vec2(vUv.x + uCloudsRotation, vUv.y);
      float cloudAlpha = texture2D(uCloudsMap, cloudUvCurrent).r;
      nightColor *= (1.0 - cloudAlpha * 0.7);

      // Warm twilight scatter at the terminator band
      float twilight = smoothstep(-0.10, 0.0, NdotL) * smoothstep(0.12, 0.0, NdotL);
      vec3 twilightGlow = vec3(1.0, 0.42, 0.12) * twilight * 0.6;

      // Combined Surface Lighting
      vec3 surfaceColor = mix(nightColor, litDay, dayMix) + twilightGlow;

      // Inner limb atmospheric haze
      float limbFactor = 1.0 - max(0.0, dot(N, V));
      float innerHaze = pow(limbFactor, 3.5) * max(0.0, dot(N, L) * 0.5 + 0.5);
      surfaceColor += vec3(0.25, 0.55, 0.95) * innerHaze * 0.5;

      gl_FragColor = vec4(surfaceColor, 1.0);
    }
  `,
};

// Cloud Layer Shader Material
const EarthCloudsShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    uniform sampler2D uCloudsMap;
    uniform vec3 uSunDirection;
    uniform float uRotation;

    void main() {
      vec2 uv = vec2(vUv.x + uRotation, vUv.y);
      float alpha = texture2D(uCloudsMap, uv).r;
      if (alpha < 0.03) discard;

      vec3 N = normalize(vNormal);
      vec3 L = normalize(uSunDirection);
      float NdotL = max(0.0, dot(N, L));
      float dayMix = smoothstep(-0.08, 0.18, dot(N, L));

      vec3 sunLitClouds = vec3(1.0, 0.98, 0.95) * (NdotL * 0.85 + 0.15);
      vec3 nightClouds = vec3(0.02, 0.03, 0.05);
      vec3 cloudColor = mix(nightClouds, sunLitClouds, dayMix);

      // Rim scattering on clouds
      vec3 V = normalize(-vViewPosition);
      float limb = pow(1.0 - max(0.0, dot(N, V)), 2.5);
      cloudColor += vec3(0.4, 0.7, 1.0) * limb * max(0.0, dot(N, L));

      gl_FragColor = vec4(cloudColor, alpha * 0.85);
    }
  `,
};

// Additive Rayleigh Atmosphere Rim Shader
const AtmosphereShellShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    uniform vec3 uSunDirection;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(-vViewPosition);
      vec3 L = normalize(uSunDirection);

      float rim = 1.0 - max(0.0, dot(N, V));
      float intensity = pow(rim, 3.2);

      // Rayleigh scattering bias towards sunlit side
      float sunFacing = dot(N, L);
      float sunFactor = smoothstep(-0.25, 0.8, sunFacing);

      // Twilight reddening at terminator
      float twilightFactor = smoothstep(-0.2, 0.05, sunFacing) * smoothstep(0.3, 0.0, sunFacing);
      vec3 deepBlue = vec3(0.2, 0.55, 1.0);
      vec3 sunsetOrange = vec3(1.0, 0.45, 0.15);
      vec3 atmosColor = mix(deepBlue, sunsetOrange, twilightFactor * 0.8);

      float alpha = intensity * (sunFactor * 0.85 + 0.15);
      gl_FragColor = vec4(atmosColor * alpha * 1.5, alpha);
    }
  `,
};

export const Earth: React.FC<EarthProps> = ({
  radius = 6.378,
  epochDate = new Date(),
  sunDirection,
  rotationSpeed = 0.02,
  showClouds = true,
  showAtmosphere = true,
  showGroundSites = true,
  enableCloudShadows = true,
}) => {
  const earthRef = useRef<THREE.Group>(null);
  const surfaceMeshRef = useRef<THREE.Mesh>(null);
  const cloudsMeshRef = useRef<THREE.Mesh>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh>(null);

  const graphicsQuality = useSettingsStore((s) => s.graphicsQuality);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const cloudRotationRef = useRef(0);

  // Textures state
  const texturesRef = useRef<{
    day: THREE.Texture | null;
    night: THREE.Texture | null;
    clouds: THREE.Texture | null;
    normal: THREE.Texture | null;
    specular: THREE.Texture | null;
  }>({ day: null, night: null, clouds: null, normal: null, specular: null });

  // Calculate astronomical sun direction and GMST
  const { astronomicalSunDir, initialGmstDeg } = useMemo(() => {
    const jd = toJulianDate(epochDate);
    const sunDir = sunDirection
      ? new THREE.Vector3(sunDirection[0], sunDirection[1], sunDirection[2]).normalize()
      : (() => {
          const s = computeSunDirectionECI(jd);
          return new THREE.Vector3(s.x, s.y, s.z);
        })();
    const gmst = computeGMST(jd);
    return { astronomicalSunDir: sunDir, initialGmstDeg: gmst };
  }, [epochDate, sunDirection]);

  // Load Earth texture suite
  useEffect(() => {
    let isCancelled = false;
    const tier: ResolutionTier = getEffectiveTextureTier(graphicsQuality);

    async function loadSuite() {
      try {
        const [day, night, clouds, normal, specular] = await Promise.all([
          loadTextureSafe("earth", "color", tier),
          loadTextureSafe("earth", "night", tier),
          loadTextureSafe("earth", "clouds", tier),
          loadTextureSafe("earth", "normal", tier),
          loadTextureSafe("earth", "specular", tier),
        ]);

        if (!isCancelled) {
          texturesRef.current = { day, night, clouds, normal, specular };
          setTexturesLoaded(true);
        }
      } catch (e) {
        console.warn("[MoonLander] Error loading Earth textures, relying on procedural fallbacks:", e);
        if (!isCancelled) setTexturesLoaded(true);
      }
    }

    loadSuite();
    return () => {
      isCancelled = true;
    };
  }, [graphicsQuality]);

  // Surface custom shader material
  const surfaceMaterial = useMemo(() => {
    const defaultTex = new THREE.Texture();
    return new THREE.ShaderMaterial({
      vertexShader: EarthSurfaceShader.vertexShader,
      fragmentShader: EarthSurfaceShader.fragmentShader,
      uniforms: {
        uDayMap: { value: defaultTex },
        uNightMap: { value: defaultTex },
        uCloudsMap: { value: defaultTex },
        uNormalMap: { value: defaultTex },
        uSpecularMap: { value: defaultTex },
        uSunDirection: { value: astronomicalSunDir },
        uCloudsRotation: { value: 0 },
        uEnableCloudShadows: { value: enableCloudShadows && graphicsQuality !== "LOW" },
      },
    });
  }, [astronomicalSunDir, enableCloudShadows, graphicsQuality]);

  // Cloud layer shader material
  const cloudsMaterial = useMemo(() => {
    const defaultTex = new THREE.Texture();
    return new THREE.ShaderMaterial({
      vertexShader: EarthCloudsShader.vertexShader,
      fragmentShader: EarthCloudsShader.fragmentShader,
      uniforms: {
        uCloudsMap: { value: defaultTex },
        uSunDirection: { value: astronomicalSunDir },
        uRotation: { value: 0 },
      },
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
  }, [astronomicalSunDir]);

  // Outer Atmosphere Rim glow shader material
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: AtmosphereShellShader.vertexShader,
      fragmentShader: AtmosphereShellShader.fragmentShader,
      uniforms: {
        uSunDirection: { value: astronomicalSunDir },
      },
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, [astronomicalSunDir]);

  // Update uniforms when textures load
  useEffect(() => {
    if (texturesLoaded && texturesRef.current.day) {
      surfaceMaterial.uniforms.uDayMap!.value = texturesRef.current.day;
      surfaceMaterial.uniforms.uNightMap!.value = texturesRef.current.night;
      surfaceMaterial.uniforms.uCloudsMap!.value = texturesRef.current.clouds;
      surfaceMaterial.uniforms.uNormalMap!.value = texturesRef.current.normal;
      surfaceMaterial.uniforms.uSpecularMap!.value = texturesRef.current.specular;
      surfaceMaterial.needsUpdate = true;

      if (texturesRef.current.clouds) {
        cloudsMaterial.uniforms.uCloudsMap!.value = texturesRef.current.clouds;
        cloudsMaterial.needsUpdate = true;
      }
    }
  }, [texturesLoaded, surfaceMaterial, cloudsMaterial]);

  // Dispose custom shader materials on unmount
  useEffect(() => {
    return () => {
      surfaceMaterial.dispose();
      cloudsMaterial.dispose();
      atmosphereMaterial.dispose();
    };
  }, [surfaceMaterial, cloudsMaterial, atmosphereMaterial]);

  // Set initial astronomical rotation
  useEffect(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y = THREE.MathUtils.degToRad(initialGmstDeg);
    }
  }, [initialGmstDeg]);

  // Animation frame loop: Earth rotation + clouds differential motion
  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * rotationSpeed;
    }
    cloudRotationRef.current += delta * (rotationSpeed * 0.12);
    if (surfaceMaterial.uniforms.uCloudsRotation) {
      surfaceMaterial.uniforms.uCloudsRotation.value = cloudRotationRef.current;
    }
    if (cloudsMaterial.uniforms.uRotation) {
      cloudsMaterial.uniforms.uRotation.value = cloudRotationRef.current;
    }
  });

  // Calculate 3D vectors for key ground stations on the Earth surface
  const groundSiteVectors = useMemo(() => {
    return Object.values(GROUND_SITES).map((site) => {
      const pos = latLonToVector3(site.latDeg, site.lonDeg, radius * 1.001);
      return {
        ...site,
        position: [pos.x, pos.y, pos.z] as [number, number, number],
      };
    });
  }, [radius]);

  // High sphere resolution (128 x 64) prevents pole pinching and antimeridian seam
  const sphereSegments: [number, number] =
    graphicsQuality === "LOW" ? [64, 32] : graphicsQuality === "MEDIUM" ? [96, 48] : [128, 64];

  return (
    <group dispose={null}>
      {/* 1. Earth Body Group (Rotates by GMST) */}
      <group ref={earthRef}>
        {/* Solid Earth Sphere with Day/Night PBR Shader */}
        <mesh
          ref={surfaceMeshRef}
          material={surfaceMaterial}
          receiveShadow
          castShadow
        >
          <sphereGeometry args={[radius, sphereSegments[0], sphereSegments[1]]} />
        </mesh>

        {/* Real Ground Sites & Launch Pads */}
        {showGroundSites && (
          <group>
            {groundSiteVectors.map((site) => (
              <mesh key={site.id} position={site.position}>
                <sphereGeometry args={[radius * 0.008, 12, 12]} />
                <meshBasicMaterial
                  color={site.type === "launch_site" ? "#F59E0B" : "#38BDF8"}
                />
              </mesh>
            ))}
          </group>
        )}
      </group>

      {/* 2. Swirling Atmospheric Cloud Layer at 1.003 R */}
      {showClouds && (
        <mesh ref={cloudsMeshRef} material={cloudsMaterial}>
          <sphereGeometry args={[radius * 1.003, sphereSegments[0], sphereSegments[1]]} />
        </mesh>
      )}

      {/* 3. Outer Atmospheric Rayleigh Rim Glow Shell at 1.025 R */}
      {showAtmosphere && (
        <mesh ref={atmosphereMeshRef} material={atmosphereMaterial}>
          <sphereGeometry args={[radius * 1.025, 64, 64]} />
        </mesh>
      )}
    </group>
  );
};
