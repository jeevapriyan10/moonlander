import * as THREE from "three";

/** Helper to create standard canvas with 2D context */
function createCanvas(w = 512, h = 256): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
  if (typeof document === "undefined") {
    // SSR safe dummy canvas
    return { canvas: {} as HTMLCanvasElement, ctx: null };
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

/**
 * Creates a procedural Gold Multi-Layer Insulation (MLI) foil canvas texture.
 */
export function createGoldMliTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 512);

  if (ctx) {
    // Base gold gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, "#E6A817");
    grad.addColorStop(0.3, "#FAD02C");
    grad.addColorStop(0.5, "#D49410");
    grad.addColorStop(0.8, "#FFDF65");
    grad.addColorStop(1, "#C2820A");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Embossed wrinkle / quilting pattern
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1.5;
    const step = 32;

    for (let x = 0; x < 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + step * 0.5, 512);
      ctx.stroke();
    }

    for (let y = 0; y < 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y + step * 0.5);
      ctx.stroke();
    }

    // High frequency specular sparkles
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const r = Math.random() * 2;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates procedural MLI Normal Map for crinkled foil micro-relief.
 */
export function createMliNormalMap(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 512);
  if (ctx) {
    // Base normal vector pointing out (RGB: 128, 128, 255)
    ctx.fillStyle = "#8080FF";
    ctx.fillRect(0, 0, 512, 512);

    // Embossed wrinkles in tangent space
    for (let i = 0; i < 60; i++) {
      const x = (i * 37) % 512;
      const y = (i * 43) % 512;
      ctx.fillStyle = i % 2 === 0 ? "#7090FF" : "#9070FF";
      ctx.fillRect(x, y, 64, 4);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

/**
 * Creates a procedural Solar Panel photovoltaic cell canvas texture.
 */
export function createSolarCellTexture(isGaAs = true): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 512);

  if (ctx) {
    // Photovoltaic cell background (deep indigo blue for GaAs, navy for Si)
    ctx.fillStyle = isGaAs ? "#0B1536" : "#081024";
    ctx.fillRect(0, 0, 512, 512);

    const cellCount = 4;
    const cellSize = 512 / cellCount;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;

    for (let i = 0; i <= cellCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(512, i * cellSize);
      ctx.stroke();
    }

    // Silver busbars running vertically through each cell
    ctx.strokeStyle = "rgba(210, 225, 255, 0.75)";
    ctx.lineWidth = 2.5;

    for (let i = 0; i < cellCount; i++) {
      const x1 = i * cellSize + cellSize * 0.33;
      const x2 = i * cellSize + cellSize * 0.67;

      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, 512);
      ctx.stroke();
    }

    // Fine grid fingers (horizontal wires)
    ctx.strokeStyle = "rgba(180, 200, 240, 0.3)";
    ctx.lineWidth = 0.8;
    for (let y = 0; y < 512; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/**
 * Creates procedural Earth fallback map (continents + oceans + atmosphere).
 */
export function createProceduralEarthTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(1024, 512);

  if (ctx) {
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
    oceanGrad.addColorStop(0, "#081b3a");
    oceanGrad.addColorStop(0.5, "#0b2545");
    oceanGrad.addColorStop(1, "#081b3a");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = "#1b4d3e";
    const continents = [
      { x: 220, y: 180, rx: 110, ry: 70 }, // North America
      { x: 300, y: 320, rx: 70, ry: 100 }, // South America
      { x: 520, y: 160, rx: 90, ry: 60 }, // Europe
      { x: 530, y: 280, rx: 80, ry: 90 }, // Africa
      { x: 720, y: 170, rx: 160, ry: 80 }, // Asia
      { x: 820, y: 340, rx: 70, ry: 50 }, // Australia
    ];

    for (const c of continents) {
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2d6a4f";
      ctx.beginPath();
      ctx.ellipse(c.x - 10, c.y - 10, c.rx * 0.6, c.ry * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Earth Night Lights map fallback.
 */
export function createProceduralEarthNightTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(1024, 512);
  if (ctx) {
    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, 1024, 512);

    // City clusters on major populated regions
    const clusters = [
      { x: 220, y: 180, count: 60 }, // NA
      { x: 520, y: 160, count: 80 }, // Europe
      { x: 720, y: 200, count: 90 }, // East Asia
      { x: 670, y: 220, count: 60 }, // South Asia (India)
      { x: 300, y: 340, count: 30 }, // South America
    ];

    for (const cluster of clusters) {
      for (let i = 0; i < cluster.count; i++) {
        const cx = cluster.x + (Math.random() - 0.5) * 80;
        const cy = cluster.y + (Math.random() - 0.5) * 50;
        const radius = Math.random() * 2 + 0.5;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 2);
        grad.addColorStop(0, "#FFE082");
        grad.addColorStop(0.5, "#FFB300");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Earth Clouds fallback texture.
 */
export function createProceduralEarthCloudsTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(1024, 512);
  if (ctx) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, 1024, 512);

    // Cloud swirls
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 90; i++) {
      const cx = (i * 29) % 1024;
      const cy = 40 + ((i * 47) % (512 - 80));
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70 + (i % 35), 15 + (i % 12), (i * 0.3) % Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Moon cratered texture fallback.
 */
export function createProceduralMoonTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 256);
  if (ctx) {
    // Lunar regolith grey background
    ctx.fillStyle = "#737373";
    ctx.fillRect(0, 0, 512, 256);

    // Maria (dark basaltic plains)
    ctx.fillStyle = "#4a4a4a";
    const maria = [
      { x: 180, y: 100, r: 45 }, // Mare Imbrium
      { x: 250, y: 110, r: 35 }, // Mare Serenitatis
      { x: 290, y: 130, r: 30 }, // Mare Tranquillitatis
    ];
    for (const m of maria) {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Impact craters with rim highlights
    for (let i = 0; i < 80; i++) {
      const cx = (i * 37) % 512;
      const cy = (i * 29) % 256;
      const cr = (i % 8) + 2;

      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(20, 20, 20, 0.3)";
      ctx.beginPath();
      ctx.arc(cx - 0.5, cy - 0.5, cr * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Mars rust-colored terrain fallback.
 */
export function createProceduralMarsTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 256);
  if (ctx) {
    // Red-orange oxidized iron surface
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#FFFFFF"); // North polar ice cap
    grad.addColorStop(0.08, "#B45309");
    grad.addColorStop(0.5, "#C2410C");
    grad.addColorStop(0.92, "#B45309");
    grad.addColorStop(1, "#FFFFFF"); // South polar ice cap
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Dark volcanic provinces (Syrtis Major, Valles Marineris)
    ctx.fillStyle = "#7C2D12";
    ctx.beginPath();
    ctx.ellipse(280, 130, 90, 25, -0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Venus cloud atmosphere fallback.
 */
export function createProceduralVenusTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 256);
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#EAB308");
    grad.addColorStop(0.3, "#FDE047");
    grad.addColorStop(0.7, "#FEF08A");
    grad.addColorStop(1, "#EAB308");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Subtle equatorial chevron bands
    ctx.fillStyle = "rgba(217, 119, 6, 0.15)";
    for (let y = 40; y < 220; y += 20) {
      ctx.fillRect(0, y, 512, 8);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Jupiter banded gas giant fallback.
 */
export function createProceduralJupiterTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 256);
  if (ctx) {
    // Alternating brown belts and light cream zones
    const bands = [
      "#451A03", "#78350F", "#B45309", "#D97706", "#FDE68A",
      "#B45309", "#FDE68A", "#D97706", "#78350F", "#451A03",
    ];
    const h = 256 / bands.length;
    for (let i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i]!;
      ctx.fillRect(0, i * h, 512, h);
    }

    // Great Red Spot
    ctx.fillStyle = "#991B1B";
    ctx.beginPath();
    ctx.ellipse(320, 160, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Saturn golden atmospheric bands fallback.
 */
export function createProceduralSaturnTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 256);
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#78350F");
    grad.addColorStop(0.2, "#D97706");
    grad.addColorStop(0.5, "#FDE68A");
    grad.addColorStop(0.8, "#D97706");
    grad.addColorStop(1, "#78350F");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Saturn Ring Alpha Texture.
 */
export function createProceduralSaturnRingAlpha(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(256, 1);
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0, "rgba(255, 255, 255, 0)"); // Inner D ring gap
    grad.addColorStop(0.2, "rgba(255, 255, 255, 0.7)"); // C ring
    grad.addColorStop(0.4, "rgba(255, 255, 255, 0.95)"); // B ring (dense)
    grad.addColorStop(0.68, "rgba(255, 255, 255, 0.05)"); // Cassini Division
    grad.addColorStop(0.72, "rgba(255, 255, 255, 0.75)"); // A ring
    grad.addColorStop(0.95, "rgba(255, 255, 255, 0.4)"); // Encke gap & outer ring
    grad.addColorStop(1, "rgba(255, 255, 255, 0)"); // Outer edge
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Sun granulation fallback.
 */
export function createProceduralSunTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(512, 256);
  if (ctx) {
    const grad = ctx.createRadialGradient(256, 128, 10, 256, 128, 256);
    grad.addColorStop(0, "#FEF08A");
    grad.addColorStop(0.5, "#F59E0B");
    grad.addColorStop(1, "#DC2626");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Milky Way starfield skybox fallback.
 */
export function createProceduralStarsTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = createCanvas(1024, 512);
  if (ctx) {
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, 1024, 512);

    // Galactic dust lane
    const dust = ctx.createLinearGradient(0, 200, 1024, 312);
    dust.addColorStop(0, "rgba(30, 41, 59, 0.3)");
    dust.addColorStop(0.5, "rgba(71, 85, 105, 0.6)");
    dust.addColorStop(1, "rgba(30, 41, 59, 0.3)");
    ctx.fillStyle = dust;
    ctx.fillRect(0, 180, 1024, 150);

    // Point stars
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 512;
      const brightness = Math.random() * 0.8 + 0.2;
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.fillRect(x, y, Math.random() < 0.1 ? 1.5 : 1, Math.random() < 0.1 ? 1.5 : 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
