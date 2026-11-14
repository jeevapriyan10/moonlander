"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createProceduralEarthTexture } from "./proceduralTextures";

export interface EarthProps {
  radius?: number;
  rotationSpeed?: number;
  showClouds?: boolean;
}

export const Earth: React.FC<EarthProps> = ({
  radius = 6.378, // in scaled units (1 unit = 1000 km)
  rotationSpeed = 0.03,
  showClouds = true,
}) => {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  // Generate guaranteed procedural fallback texture
  const fallbackTexture = useMemo(() => createProceduralEarthTexture(), []);
  const [earthTexture, setEarthTexture] = useState<THREE.Texture>(fallbackTexture);

  // Safely probe if user added custom NASA Blue Marble textures in /public/textures
  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      "/textures/earth_day.jpg",
      (loadedTexture) => {
        if (active) {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          setEarthTexture(loadedTexture);
        }
      },
      undefined,
      () => {
        // Fallback active, no error thrown
      }
    );
    return () => {
      active = false;
    };
  }, [fallbackTexture]);

  // Atmospheric Fresnel Glow Shader
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.75, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
  }, []);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * rotationSpeed;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * (rotationSpeed * 1.15);
    }
  });

  return (
    <group dispose={null}>
      {/* 1. Solid Earth Sphere with Day/Night Terminator */}
      <mesh ref={earthRef} receiveShadow castShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* 2. Swirling Atmospheric Cloud Layer */}
      {showClouds && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[radius * 1.015, 48, 48]} />
          <meshStandardMaterial
            color="#FFFFFF"
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            roughness={1.0}
          />
        </mesh>
      )}

      {/* 3. Outer Atmospheric Fresnel Rim Glow Shell */}
      <mesh material={atmosphereMaterial}>
        <sphereGeometry args={[radius * 1.06, 48, 48]} />
      </mesh>
    </group>
  );
};
