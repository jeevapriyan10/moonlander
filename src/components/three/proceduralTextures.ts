import * as THREE from "three";

/**
 * Creates a procedural Gold Multi-Layer Insulation (MLI) foil canvas texture.
 */
export function createGoldMliTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Base gold gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#E6A817");
    grad.addColorStop(0.3, "#FAD02C");
    grad.addColorStop(0.5, "#D49410");
    grad.addColorStop(0.8, "#FFDF65");
    grad.addColorStop(1, "#C2820A");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Embossed wrinkle / quilting pattern
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 1.5;
    const step = 32;

    for (let x = 0; x < size; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + step * 0.5, size);
      ctx.stroke();
    }

    for (let y = 0; y < size; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + step * 0.5);
      ctx.stroke();
    }

    // High frequency specular sparkles
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * size;
      const ry = Math.random() * size;
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
 * Creates a procedural Solar Panel photovoltaic cell canvas texture.
 */
export function createSolarCellTexture(isGaAs = true): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Photovoltaic cell background (deep indigo blue for GaAs, navy for Si)
    ctx.fillStyle = isGaAs ? "#0B1536" : "#081024";
    ctx.fillRect(0, 0, size, size);

    // Silicon wafer cell borders (grid of individual wafer squares)
    const cellCount = 4;
    const cellSize = size / cellCount;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;

    for (let i = 0; i <= cellCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
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
      ctx.lineTo(x1, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, size);
      ctx.stroke();
    }

    // Fine grid fingers (horizontal wires)
    ctx.strokeStyle = "rgba(180, 200, 240, 0.3)";
    ctx.lineWidth = 0.8;
    const fingerStep = 8;
    for (let y = 0; y < size; y += fingerStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
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
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    // Deep ocean blue gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
    oceanGrad.addColorStop(0, "#081b3a");
    oceanGrad.addColorStop(0.5, "#0b2545");
    oceanGrad.addColorStop(1, "#081b3a");
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, width, height);

    // Procedural landmass shapes
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

      // Mountain / terrain shading
      ctx.fillStyle = "#2d6a4f";
      ctx.beginPath();
      ctx.ellipse(c.x - 10, c.y - 10, c.rx * 0.6, c.ry * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Swirling cloud wisps
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    for (let i = 0; i < 50; i++) {
      const cx = (i * 23) % width;
      const cy = 60 + ((i * 37) % (height - 120));
      ctx.beginPath();
      ctx.ellipse(cx, cy, 60 + (i % 30), 12 + (i % 10), (i * 0.2) % Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return new THREE.CanvasTexture(canvas);
}
