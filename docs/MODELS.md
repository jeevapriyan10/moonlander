# MoonLander 3D Models & Modding Specification

This document defines how to add custom 3D models (`.glb` format) for satellite buses, launch vehicles, and lunar landers to **MoonLander**.

---

## 1. Directory Structure & File Naming Conventions

All custom models reside in the `public/models/` directory:

```
public/
└── models/
    ├── bus-cubesat-12u.glb
    ├── bus-microsat.glb
    ├── bus-smallsat.glb
    ├── bus-midsize.glb
    ├── bus-flagship.glb
    ├── electron.glb
    ├── vega-c.glb
    ├── falcon-9.glb
    ├── atlas-v-551.glb
    ├── falcon-heavy.glb
    └── sls-block-1.glb
```

If a `.glb` file is absent from `public/models/`, MoonLander automatically falls back to its procedural PBR procedural model with zero console errors or render stalls.

---

## 2. Model Authoring Standards (Blender / CAD)

1. **Format:** Binary glTF (`.glb`).
2. **Units:** Standard SI meters ($1.0\text{ unit} = 1.0\text{ meter}$).
3. **Origin & Orientation:**
   - Coordinate Origin $(0, 0, 0)$ should be placed at the center of mass or structural mating ring.
   - Forward flight direction: $+Z$ or $+Y$ (launchers aligned vertically along $+Y$).
4. **Materials & Textures:**
   - Use standard metallic-roughness PBR materials (`pbrMetallicRoughness`).
   - Textures should be embedded directly inside the `.glb` or referenced with relative paths.
   - Base color maps must use sRGB; normal and roughness/metallic maps must use linear color space.
5. **Polycount Targets:**
   - Satellite buses: $10,000\text{ to }40,000$ triangles.
   - Launch vehicles: $15,000\text{ to }50,000$ triangles.
   - Draco compression or meshopt compression is recommended for production delivery.

---

## 3. Subsystem Anchors (Empty Objects / Nodes)

When authoring complex satellite buses, include named empty nodes in the model hierarchy so MoonLander can automatically attach instruments and antennas:

| Node Name | Subsystem Attached |
| :--- | :--- |
| `ANCHOR_SOLAR_LEFT` | Mount point for deployable port solar array wing |
| `ANCHOR_SOLAR_RIGHT`| Mount point for deployable starboard solar array wing |
| `ANCHOR_COMMS_DISH` | High-Gain Antenna (HGA) dish mount point |
| `ANCHOR_PAYLOAD_OPTICAL` | Primary aperture for telescopes, photometers, or imager pods |
| `ANCHOR_THRUSTER` | Engine nozzle bell or Hall electric thruster grid |

If these anchor nodes are not found in the model, MoonLander will anchor attachments to default bounding box positions.
