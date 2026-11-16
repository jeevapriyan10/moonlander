# MoonLander 3D Graphics Quality & Visual Verification Manual

This document provides a systematic verification checklist for the photoreal 3D rendering engine, asset pipeline, astronomical lighting, and procedural fallbacks.

---

## 1. Visual Inspection Checklist

| Checkpoint | Target Behavior | Verification Steps | Pass/Fail |
| :--- | :--- | :--- | :--- |
| **1. Geographic Orientation** | Africa and India are instantly recognizable and **not mirrored**; Greenwich is aligned with texture center ($u = 0.5$). | View Earth in `/mission/[id]?stage=design` in Trajectory view. Confirm Mediterranean Sea is North of Africa, India points South into Indian Ocean, Americas are in Western hemisphere. | PASS |
| **2. Atmospheric Clouds** | Cloud layer floats realistically at $1.003 R$ above terrain, casting subtle shadows onto land and oceans. | In Medium+ quality settings, rotate Earth into sunlight; observe cloud shadows offset along the Sun vector. | PASS |
| **3. Terminator & Night Lights** | City lights appear on the night side ($N \cdot L < 0$); warm orange atmospheric Rayleigh scatter appears in a thin twilight band along the terminator. | Observe the day/night boundary. Verify that city lights fade smoothly under clouds and that oceans have zero night glow. | PASS |
| **4. Ocean Specular Glint** | Oceans exhibit realistic Blinn-Phong specular glint and Fresnel edge reflection when reflecting the Sun; landmasses remain matte. | Move camera so the Sun reflection point lies on the Atlantic/Pacific Ocean. Confirm high-intensity specular gleam on water and none on Sahara or continents. | PASS |
| **5. Additive Rayleigh Atmosphere** | Deep blue Rayleigh limb glow at outer shell ($1.025 R$) with intensity biased toward the sunlit horizon; transitions to sunset orange near the terminator. | Inspect Earth from LEO distance through lunar distance. Confirm atmosphere looks like a deep volumetric gaseous shell, never a flat ring. | PASS |
| **6. Antimeridian & Pole Seams** | Zero visible seams at the $180^\circ$ International Date Line antimeridian and zero pinch distortion at the North/South poles. | High sphere resolution ($128 \times 64$) and clamped `wrapT` eliminate vertex pinching. Orbit camera directly over North Pole and antimeridian to confirm smooth mapping. | PASS |
| **7. Milky Way Skybox** | Inverted equirectangular celestial skybox with brightness scaled below the bloom threshold ($0.9$ luminance). | Pan camera into deep space. Confirm crisp starfield with galactic core dust lane and zero skybox boundary seams. | PASS |
| **8. Saturn & Rings** | Saturn ring geometry has radial UVs showing the Cassini division and dense B-ring; double-sided lighting. | Select Saturn in Solar System View (`/mission/[id]`, mode: Solar System). Confirm ring transparency and concentric division structure. | PASS |
| **9. Solar Photosphere & Granulation** | Animated convective granulation shader with limb darkening and glowing solar corona. | Center camera on the Sun in Solar System View. Observe pulsating cellular convection and corona halo. | PASS |
| **10. Seamless Fallback** | If `public/textures/` is empty or files are deleted, procedural fallbacks activate with one console warning and zero crashes or infinite Suspense. | Delete or rename a texture file; refresh page. The 3D view renders with procedural canvas textures and logs one warning without throwing. | PASS |
| **11. Progressive Tier Swap** | Fast 1k texture displays instantly, followed by smooth background swap to target tier (2k or 4k). | Clear browser cache and load page on 4G throttle. Model renders instantly with 1k texture before swapping cleanly. | PASS |
| **12. Framerate Stability & Auto-Downgrade** | Maintains 60 FPS on desktop and 30+ FPS on mobile. If framerate drops below 30 FPS for 3 consecutive seconds, quality auto-adjusts. | Simulated by throttling CPU in DevTools. HUD toast confirms quality adjustment without interrupting simulation state. | PASS |

---

## 2. Texture Memory Budget by Quality Tier

| Tier | Texture Resolution | Max Anisotropy | Post-Processing | Target Devices | GPU Memory Budget |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **LOW** | 1024 $\times$ 512 (1k) | 1x | Off | Budget smartphones, integrated low-power GPUs | $< 35\text{ MB}$ |
| **MEDIUM** | 2048 $\times$ 1024 (2k) | 4x | Bloom + Vignette | Standard laptops, modern tablets | $< 95\text{ MB}$ |
| **HIGH** | 2048 $\times$ 1024 (2k) | 8x | Bloom + Vignette + SMAA | Dedicated GPUs, modern desktops | $< 180\text{ MB}$ |
| **ULTRA** | 4096 $\times$ 2048 (4k) | 8x | Bloom + Vignette + SMAA + MipmapBlur | High-end gaming PCs, Apple Silicon Pro/Max | $< 380\text{ MB}$ |
