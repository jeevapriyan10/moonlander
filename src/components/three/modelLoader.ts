import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Cache of loaded GLTF scenes and missing status
const modelCache = new Map<string, THREE.Group | null>();
const warnedMissingModels = new Set<string>();

export interface LoadedModelResult {
  scene: THREE.Group | null;
  isCustomModel: boolean;
}

/**
 * Loads a GLTF/GLB model from public/models/<id>.glb with graceful procedural fallback.
 * Guaranteed never to crash if the model is absent.
 */
export async function loadGltfModelSafe(
  modelId: string,
  targetHeight = 2.0
): Promise<LoadedModelResult> {
  if (typeof window === "undefined") {
    return { scene: null, isCustomModel: false };
  }

  const cacheKey = modelId;
  if (modelCache.has(cacheKey)) {
    const cached = modelCache.get(cacheKey);
    return {
      scene: cached ? cached.clone() : null,
      isCustomModel: cached !== null,
    };
  }

  const url = `/models/${modelId}.glb`;
  const loader = new GLTFLoader();

  return new Promise<LoadedModelResult>((resolve) => {
    loader.load(
      url,
      (gltf) => {
        const root = gltf.scene;

        // Compute bounding box and normalize scale
        const box = new THREE.Box3().setFromObject(root);
        const size = new THREE.Vector3();
        box.getSize(size);

        if (size.y > 0) {
          const scale = targetHeight / size.y;
          root.scale.set(scale, scale, scale);
        }

        // Center model origin
        const center = new THREE.Vector3();
        box.getCenter(center);
        root.position.sub(center);

        // Enable shadows and sRGB color space on model materials
        root.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const mat of materials) {
              if (mat && "map" in mat) {
                const tex = (mat as { map?: THREE.Texture | null }).map;
                if (tex) tex.colorSpace = THREE.SRGBColorSpace;
              }
            }
          }
        });

        modelCache.set(cacheKey, root);
        resolve({ scene: root.clone(), isCustomModel: true });
      },
      undefined,
      () => {
        // Model file does not exist in public/models/
        if (!warnedMissingModels.has(modelId)) {
          warnedMissingModels.add(modelId);
          // Note: purely informational, procedural fallback takes over smoothly
        }
        modelCache.set(cacheKey, null);
        resolve({ scene: null, isCustomModel: false });
      }
    );
  });
}
