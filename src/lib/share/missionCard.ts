"use client";

/**
 * Tactical Mission Debrief Card Generator (PNG)
 * 
 * Generates an export-ready 1200x630px mission certificate card directly via HTML5 Canvas.
 * No external image APIs or server dependencies needed.
 */

export interface MissionCardData {
  missionName: string;
  scenarioTitle: string;
  difficulty: string;
  seed: string;
  callsign: string;
  rank: string;
  score: number;
  grade: "S" | "A" | "B" | "C" | "D";
  costM: number;
  massKg: number;
  deltaVKmS: number;
  scienceReturnPercent: number;
  orbitName: string;
  launcherName: string;
  completedDate: string;
}

export async function generateMissionCardBlob(data: MissionCardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not acquire 2D canvas context");

  // 1. Deep Space Background
  ctx.fillStyle = "#05070D";
  ctx.fillRect(0, 0, 1200, 630);

  // 2. Tactical Grid Pattern
  ctx.strokeStyle = "rgba(27, 36, 64, 0.4)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < 1200; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 630);
    ctx.stroke();
  }
  for (let y = 0; y < 630; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();
  }

  // 3. Aerospace Outer Frame
  ctx.strokeStyle = "rgba(255, 176, 0, 0.5)"; // Telemetry amber border
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, 1140, 570);

  // Corner brackets
  ctx.fillStyle = "#FFB000";
  const cornerSize = 16;
  const c: [number, number][] = [
    [30, 30],
    [1170 - cornerSize, 30],
    [30, 600 - cornerSize],
    [1170 - cornerSize, 600 - cornerSize],
  ];
  c.forEach(([cx, cy]) => {
    ctx.fillRect(cx, cy, cornerSize, cornerSize);
  });

  // 4. Header Bar
  ctx.fillStyle = "#FFB000";
  ctx.font = "bold 20px monospace";
  ctx.fillText("MOONLANDER // FLIGHT MISSION CERTIFICATION", 60, 75);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "14px monospace";
  ctx.fillText(`SEED: ${data.seed}  |  DATE: ${data.completedDate}`, 60, 100);

  // 5. Pilot & Station Dossier
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText(data.missionName.toUpperCase(), 60, 160);

  ctx.fillStyle = "#00F0FF";
  ctx.font = "bold 16px monospace";
  ctx.fillText(
    `PILOT: ${data.callsign.toUpperCase()} (${data.rank.toUpperCase()})  |  SCENARIO: ${data.scenarioTitle.toUpperCase()}`,
    60,
    190
  );

  // 6. Big Score Block
  const scoreBoxX = 850;
  const scoreBoxY = 70;
  const scoreBoxW = 290;
  const scoreBoxH = 150;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);
  ctx.strokeStyle = data.grade === "S" ? "#00F0FF" : data.grade === "A" ? "#10B981" : "#FFB000";
  ctx.lineWidth = 2;
  ctx.strokeRect(scoreBoxX, scoreBoxY, scoreBoxW, scoreBoxH);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "12px monospace";
  ctx.fillText("FLIGHT EVALUATION", scoreBoxX + 20, scoreBoxY + 30);

  ctx.fillStyle = data.grade === "S" ? "#00F0FF" : data.grade === "A" ? "#10B981" : "#FFB000";
  ctx.font = "bold 48px monospace";
  ctx.fillText(`${data.score}`, scoreBoxX + 20, scoreBoxY + 85);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 20px monospace";
  ctx.fillText(`GRADE: ${data.grade}`, scoreBoxX + 20, scoreBoxY + 125);

  // 7. Telemetry Grid Stat Blocks (6 Blocks)
  const stats = [
    { label: "PAYLOAD SCIENCE", value: `${data.scienceReturnPercent}%`, unit: "RETURN" },
    { label: "BUDGET CAP COST", value: `$${data.costM.toFixed(1)}M`, unit: "TOTAL" },
    { label: "DELTA-V BUDGET", value: `${data.deltaVKmS.toFixed(2)}`, unit: "KM/S" },
    { label: "WET LAUNCH MASS", value: `${data.massKg.toFixed(0)}`, unit: "KG" },
    { label: "TARGET ORBIT", value: data.orbitName.slice(0, 16), unit: "REGIME" },
    { label: "LAUNCH SERVICES", value: data.launcherName.slice(0, 16), unit: "VEHICLE" },
  ];

  const startY = 260;
  const cardW = 340;
  const cardH = 95;
  const gapX = 35;
  const gapY = 20;

  stats.forEach((stat, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 60 + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    // Box
    ctx.fillStyle = "rgba(10, 15, 30, 0.8)";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.strokeRect(x, y, cardW, cardH);

    // Label
    ctx.fillStyle = "#94A3B8";
    ctx.font = "11px monospace";
    ctx.fillText(stat.label, x + 15, y + 25);

    // Value
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px monospace";
    ctx.fillText(stat.value, x + 15, y + 60);

    // Unit
    ctx.fillStyle = "#FFB000";
    ctx.font = "10px monospace";
    ctx.fillText(stat.unit, x + 15, y + 80);
  });

  // 8. Security & Cryptographic Watermark
  ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
  ctx.font = "11px monospace";
  ctx.fillText("CERTIFIED AUTHENTIC // DETERMINISTIC SEED VERIFIED // MOONLANDER.SPACE", 60, 570);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas blob conversion failed"));
    }, "image/png");
  });
}

export function downloadBlobAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) {
    return false;
  }
  try {
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (err) {
    console.warn("[MissionCard] Clipboard write failed:", err);
    return false;
  }
}
