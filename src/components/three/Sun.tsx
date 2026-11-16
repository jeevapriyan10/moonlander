"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface SunProps {
  radius?: number; // In Three.js units (default ~10.0)
  position?: [number, number, number];
}

const SunGranulationShader = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    uniform float uTime;

    // Fast 2D procedural noise for solar granulation
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = p * 2.0 + vec2(100.0);
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv * 8.0;
      // Solar convection cell flow
      float n1 = fbm(uv + vec2(uTime * 0.05, uTime * 0.02));
      float n2 = fbm(uv * 2.0 - vec2(uTime * 0.03, -uTime * 0.04));
      float granulation = (n1 + n2) * 0.5;

      vec3 coreWhite = vec3(1.0, 0.98, 0.85);
      vec3 flareGold = vec3(1.0, 0.65, 0.1);
      vec3 deepOrange = vec3(0.85, 0.25, 0.02);

      vec3 sunColor = mix(deepOrange, flareGold, smoothstep(0.3, 0.7, granulation));
      sunColor = mix(sunColor, coreWhite, smoothstep(0.65, 0.95, granulation));

      // Limb darkening effect (Eddington approximation)
      vec3 V = normalize(-vWorldPosition);
      float mu = max(0.0, dot(vNormal, V));
      float limbDarkening = 0.4 + 0.6 * mu;
      sunColor *= limbDarkening;

      gl_FragColor = vec4(sunColor * 1.8, 1.0); // Boosted for bloom threshold
    }
  `,
};

export const Sun: React.FC<SunProps> = ({ radius = 10.0, position = [0, 0, 0] }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);

  const sunMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: SunGranulationShader.vertexShader,
      fragmentShader: SunGranulationShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
    });
  }, []);

  const coronaMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
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
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(-vViewPosition);
          float rim = pow(1.0 - max(0.0, dot(N, V)), 2.5);
          vec3 coronaGold = vec3(1.0, 0.7, 0.2);
          gl_FragColor = vec4(coronaGold * rim * 2.0, rim * 0.6);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, []);

  useFrame((_, delta) => {
    if (sunMaterial.uniforms.uTime) {
      sunMaterial.uniforms.uTime.value += delta;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.01;
    }
  });

  return (
    <group position={position} dispose={null}>
      {/* 1. Core Granulating Sun Photosphere */}
      <mesh ref={meshRef} material={sunMaterial}>
        <sphereGeometry args={[radius, 64, 64]} />
      </mesh>

      {/* 2. Outer Corona Atmosphere Halo */}
      <mesh ref={coronaRef} material={coronaMaterial}>
        <sphereGeometry args={[radius * 1.15, 48, 48]} />
      </mesh>

      {/* 3. High-Intensity Omnidirectional Solar Light */}
      <pointLight intensity={3.5} distance={5000} decay={0.5} color="#FFF8E7" />
    </group>
  );
};
