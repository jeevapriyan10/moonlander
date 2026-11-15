"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Rocket,
  Compass,
  Zap,
  Radio,
  Flame,
  Layers,
  Award,
  ChevronRight,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";
import { useMissionStore } from "@/store/mission";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { Wordmark } from "@/components/ui/Wordmark";

interface LessonDef {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  concept: string;
  badgeName: string;
  unlockedPartName: string;
  icon: React.ReactNode;
}

const LESSONS: LessonDef[] = [
  {
    id: "lesson-1",
    number: 1,
    title: "What is a Spacecraft?",
    subtitle: "The Anatomy of a Satellite Bus",
    concept: "Discover the critical subsystems required to keep a machine alive in space.",
    badgeName: "Spacecraft Architect",
    unlockedPartName: "Gold Foil MLI Blanket (Sandbox)",
    icon: <Layers className="w-4 h-4 text-telemetry-amber" />,
  },
  {
    id: "lesson-2",
    number: 2,
    title: "Orbits 101",
    subtitle: "Altitude, Speed & Kepler's Laws",
    concept: "How altitude dictates orbital speed, period, and ground coverage footprint.",
    badgeName: "Keplerian Navigator",
    unlockedPartName: "High-Altitude Magnetometer",
    icon: <Compass className="w-4 h-4 text-telemetry-cyan" />,
  },
  {
    id: "lesson-3",
    number: 3,
    title: "Sunlight & Power",
    subtitle: "Eclipses, Solar Angles & Battery Sizing",
    concept: "Surviving the brutal 35-minute planetary shadow passes on battery reserve.",
    badgeName: "Power Systems Engineer",
    unlockedPartName: "Origami GaAs Solar Wing",
    icon: <Zap className="w-4 h-4 text-telemetry-amber" />,
  },
  {
    id: "lesson-4",
    number: 4,
    title: "Getting Data Home",
    subtitle: "Ground Passes, Link Margins & Storage Buffers",
    concept: "Downlinking gigabits of science imagery during brief 10-minute horizon passes.",
    badgeName: "Deep Space Comms Officer",
    unlockedPartName: "Quantum Optical Laser Comm",
    icon: <Radio className="w-4 h-4 text-telemetry-green" />,
  },
  {
    id: "lesson-5",
    number: 5,
    title: "Rockets & Mass",
    subtitle: "The Tyranny of the Rocket Equation",
    concept: "Why fuel makes rockets heavier and how Isp unlocks the solar system.",
    badgeName: "Propulsion Specialist",
    unlockedPartName: "Miniature Xenon Ion Thruster",
    icon: <Flame className="w-4 h-4 text-telemetry-red" />,
  },
  {
    id: "lesson-6",
    number: 6,
    title: "Your First Mission",
    subtitle: "Guided Earth-Observation Build & Launch",
    concept: "Put everything together: architect, balance, and launch your first certified satellite.",
    badgeName: "Certified Flight Director",
    unlockedPartName: "Advanced Planetary Sensor Suite",
    icon: <Rocket className="w-4 h-4 text-telemetry-purple" />,
  },
];

export default function AcademyPage() {
  const router = useRouter();
  const { completedLessons, completeLesson, unlockPart, unlockedParts } = useSettingsStore();
  const { loadMission } = useMissionStore();
  const [activeLessonId, setActiveLessonId] = useState<string>("lesson-1");

  // Lesson 1 Interactive State: Subsystem Health Toggles
  const [l1Systems, setL1Systems] = useState({
    power: true,
    adcs: true,
    comms: true,
    thermal: true,
    computer: true,
    payload: true,
  });

  // Lesson 2 Interactive State: Orbit Sliders
  const [l2AltitudeKm, setL2AltitudeKm] = useState(700);
  const [l2Eccentricity, setL2Eccentricity] = useState(0.0);

  // Lesson 3 Interactive State: Power Simulator
  const [l3ArrayArea, setL3ArrayArea] = useState(2.0);
  const [l3BatteryWh, setL3BatteryWh] = useState(250);
  const [l3InEclipse, setL3InEclipse] = useState(false);

  // Lesson 4 Interactive State: Comms Simulator
  const [l4DownlinkMbps, setL4DownlinkMbps] = useState(50);
  const [l4ContactMinutes, setL4ContactMinutes] = useState(40);

  // Lesson 5 Interactive State: Rocket Equation
  const [l5DryMass, setL5DryMass] = useState(500);
  const [l5PropellantMass, setL5PropellantMass] = useState(300);
  const [l5Isp, setL5Isp] = useState(220); // 70=cold gas, 220=hydrazine, 310=biprop, 1600=ion

  // Lesson 6 Interactive State: Guided Steps
  const [l6Step, setL6Step] = useState(1);
  const [l6Launched, setL6Launched] = useState(false);

  const activeLesson = LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0]!;
  const isLessonComplete = (id: string) => completedLessons.includes(id);

  const handleFinishLesson = (lessonId: string, partId: string) => {
    completeLesson(lessonId);
    unlockPart(partId);
  };

  // Calculations for Lesson 2
  const mu = 398600.4418;
  const re = 6378.137;
  const l2R = re + l2AltitudeKm;
  const l2V = Math.sqrt(mu / l2R);
  const l2PeriodMin = (2 * Math.PI * Math.sqrt(Math.pow(l2R, 3) / mu)) / 60;
  const l2OrbitsPerDay = 1440 / l2PeriodMin;

  // Calculations for Lesson 3
  const l3GenWatts = l3InEclipse ? 0 : l3ArrayArea * 190;
  const l3LoadWatts = 180;
  const l3NetWatts = l3GenWatts - l3LoadWatts;
  const l3EclipseHours = 0.58; // 35 min
  const l3EnergyUsedWh = l3LoadWatts * l3EclipseHours;
  const l3DOD = Math.min(100, Math.round((l3EnergyUsedWh / Math.max(1, l3BatteryWh)) * 100));

  // Calculations for Lesson 4
  const l4GenGbPerDay = 45; // 45 GB per day generated by instruments
  const l4DownlinkGbPerDay = ((l4DownlinkMbps * 60 * l4ContactMinutes) / 8) / 1000;
  const l4ReturnPercent = Math.min(100, Math.round((l4DownlinkGbPerDay / l4GenGbPerDay) * 100));

  // Calculations for Lesson 5
  const l5WetMass = l5DryMass + l5PropellantMass;
  const l5DeltaV = Math.round(l5Isp * 9.80665 * Math.log(l5WetMass / Math.max(1, l5DryMass)));

  return (
    <div className="min-h-screen bg-space-bg flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto pb-6 border-b border-space-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors p-1.5 rounded hover:bg-space-panel"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO FLIGHT OPS</span>
          </Link>
          <span className="text-space-border">/</span>
          <Wordmark size="sm" asLink={false} />
          <span className="text-space-border">/</span>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-telemetry-amber" />
            <h1 className="font-heading uppercase tracking-widest text-lg text-white">
              SPACE ACADEMY
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <Badge variant="amber" size="sm">
            GRADUATION PROGRESS: {completedLessons.length} / {LESSONS.length}
          </Badge>
          <Link href="/codex">
            <Button size="sm" variant="outline">
              Space Codex
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl w-full mx-auto my-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Navigation: Lesson List (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-2.5">
          <div className="text-xs font-heading uppercase tracking-wider text-slate-400 px-1 mb-1">
            Flight Training Curriculum
          </div>

          {LESSONS.map((lesson) => {
            const isCompleted = isLessonComplete(lesson.id);
            const isSelected = activeLessonId === lesson.id;

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setActiveLessonId(lesson.id)}
                className={`flex items-start gap-3 p-3 rounded text-left transition-all border ${
                  isSelected
                    ? "bg-space-panel border-telemetry-amber shadow-glow-amber/10"
                    : "bg-black/40 border-space-border hover:bg-space-panel/60 hover:border-slate-500"
                }`}
              >
                <div
                  className={`p-2 rounded shrink-0 border ${
                    isCompleted
                      ? "bg-telemetry-green/10 border-telemetry-green/30 text-telemetry-green"
                      : isSelected
                      ? "bg-telemetry-amber/10 border-telemetry-amber/30 text-telemetry-amber"
                      : "bg-space-panel border-space-border text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : lesson.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-heading uppercase text-xs tracking-wider text-slate-300 font-bold truncate">
                      Lesson {lesson.number}: {lesson.title}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] font-mono text-telemetry-green font-bold shrink-0">
                        DONE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {lesson.subtitle}
                  </p>
                </div>
              </button>
            );
          })}

          {/* Quick-Start 5 Min Button */}
          <div className="mt-4 p-3 rounded bg-telemetry-amber/10 border border-telemetry-amber/30">
            <div className="flex items-center gap-1.5 text-telemetry-amber font-heading uppercase text-xs font-bold mb-1">
              <Rocket className="w-3.5 h-3.5" />
              <span>In a Hurry?</span>
            </div>
            <p className="text-[11px] font-mono text-slate-300 leading-relaxed mb-2.5">
              Jump straight to Lesson 6 for a 5-minute guided build and launch of your first cubesat.
            </p>
            <Button
              size="sm"
              variant="primary"
              className="w-full text-xs font-heading"
              onClick={() => setActiveLessonId("lesson-6")}
            >
              Start Quick Mission (5 min)
            </Button>
          </div>
        </div>

        {/* Right Area: Interactive Playable Lesson Widget (8 cols) */}
        <div className="lg:col-span-8 flex flex-col">
          <Panel className="flex-1 p-6 flex flex-col justify-between">
            {/* Lesson Header */}
            <div>
              <div className="flex items-center justify-between border-b border-space-border pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="amber" size="sm">
                      LESSON {activeLesson.number} OF 6
                    </Badge>
                    <span className="font-mono text-xs text-slate-400">
                      EST. TIME: 2-3 MIN
                    </span>
                  </div>
                  <h2 className="font-heading uppercase tracking-wider text-xl text-white font-bold">
                    {activeLesson.title}
                  </h2>
                  <p className="font-mono text-xs text-telemetry-cyan mt-0.5">
                    {activeLesson.subtitle}
                  </p>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-mono text-slate-400">UNLOCKABLE REWARD:</div>
                  <div className="text-xs font-heading uppercase text-telemetry-amber font-semibold">
                    {activeLesson.unlockedPartName}
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm font-body text-slate-200 leading-relaxed mb-6">
                {activeLesson.concept}
              </p>

              {/* ==================== INTERACTIVE LESSON 1 ==================== */}
              {activeLesson.id === "lesson-1" && (
                <div className="flex flex-col gap-4">
                  <div className="p-3 rounded bg-black/40 border border-space-border text-xs font-mono text-slate-300">
                    Click any subsystem below to toggle its online/offline status and observe how the spacecraft reacts.
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: "power", label: "Electrical Power", desc: "Solar Panels & Batteries" },
                      { key: "adcs", label: "ADCS Steering", desc: "Reaction Wheels & Thrusters" },
                      { key: "comms", label: "Communications", desc: "Transceiver & Antennas" },
                      { key: "thermal", label: "Thermal Control", desc: "MLI Blankets & Radiators" },
                      { key: "computer", label: "Flight Computer", desc: "Command & Telemetry Avionics" },
                      { key: "payload", label: "Science Payload", desc: "Optical Telescopes & Sensors" },
                    ].map((sys) => {
                      const isOnline = l1Systems[sys.key as keyof typeof l1Systems];
                      return (
                        <button
                          key={sys.key}
                          type="button"
                          onClick={() =>
                            setL1Systems((prev) => ({
                              ...prev,
                              [sys.key]: !prev[sys.key as keyof typeof l1Systems],
                            }))
                          }
                          className={`p-3 rounded border text-left transition-all ${
                            isOnline
                              ? "bg-space-panel border-telemetry-green/50 text-white"
                              : "bg-telemetry-red/10 border-telemetry-red text-telemetry-red"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-heading uppercase text-xs font-bold">
                              {sys.label}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isOnline ? "bg-telemetry-green" : "bg-telemetry-red animate-ping"
                              }`}
                            />
                          </div>
                          <span className="text-[10px] font-mono block opacity-75">
                            {sys.desc}
                          </span>
                          <span className="text-[10px] font-mono font-bold mt-1.5 block">
                            {isOnline ? "STATUS: NOMINAL" : "STATUS: OFFLINE"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* System Consequence Diagnostic */}
                  <div className="p-3.5 rounded bg-space-bg border border-space-border font-mono text-xs">
                    <span className="font-heading uppercase tracking-wider text-telemetry-amber font-semibold block mb-1">
                      REAL-TIME FLIGHT DIAGNOSTIC:
                    </span>
                    {!l1Systems.power ? (
                      <p className="text-telemetry-red">
                        CRITICAL POWER LOSS: Total blackout. Flight computer and heaters offline. Satellite freezing to -120°C in shadow.
                      </p>
                    ) : !l1Systems.computer ? (
                      <p className="text-telemetry-red">
                        FLIGHT COMPUTER CRASH: Guidance CPU halted. Autonomous commands stopped. Satellite in uncommanded freeze.
                      </p>
                    ) : !l1Systems.adcs ? (
                      <p className="text-telemetry-amber">
                        ATTITUDE DRIFT: Reaction wheels lost. Spacecraft is tumbling at 4 deg/sec. Antennas cannot lock on Earth.
                      </p>
                    ) : !l1Systems.thermal ? (
                      <p className="text-telemetry-amber">
                        THERMAL VIOLATION: Solar radiation heating internal electronics to +135°C. Solder joint failure imminent.
                      </p>
                    ) : !l1Systems.comms ? (
                      <p className="text-telemetry-amber">
                        TELEMETRY LOST: Radio link dropped. Ground control receiving 0 bps. Science cannot be returned.
                      </p>
                    ) : !l1Systems.payload ? (
                      <p className="text-slate-400">
                        PAYLOAD SAFE: Spacecraft bus is flying nominally, but zero scientific data is being gathered.
                      </p>
                    ) : (
                      <p className="text-telemetry-green">
                        ALL SUBSYSTEMS NOMINAL: Power, steering, thermal, computer, and communications working in harmony.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== INTERACTIVE LESSON 2 ==================== */}
              {activeLesson.id === "lesson-2" && (
                <div className="flex flex-col gap-4">
                  <div className="p-3 rounded bg-black/40 border border-space-border text-xs font-mono text-slate-300">
                    Adjust the orbital altitude slider to witness Kepler&apos;s Third Law: higher orbits travel slower and take exponentially longer to circle Earth.
                  </div>

                  <div className="flex flex-col gap-3 font-mono text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>ORBITAL ALTITUDE:</span>
                        <strong className="text-telemetry-amber">{l2AltitudeKm} km</strong>
                      </div>
                      <input
                        type="range"
                        min="200"
                        max="35786"
                        step="50"
                        value={l2AltitudeKm}
                        onChange={(e) => setL2AltitudeKm(Number(e.target.value))}
                        className="w-full accent-telemetry-amber cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        <span>200 km (LEO)</span>
                        <span>700 km (SSO)</span>
                        <span>35,786 km (GEO)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                      <div className="p-2.5 rounded bg-space-bg border border-space-border">
                        <span className="text-[10px] text-slate-400 block">ORBITAL SPEED:</span>
                        <span className="text-sm font-bold text-telemetry-cyan">
                          {l2V.toFixed(2)} km/s
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-space-bg border border-space-border">
                        <span className="text-[10px] text-slate-400 block">PERIOD:</span>
                        <span className="text-sm font-bold text-telemetry-amber">
                          {l2PeriodMin < 120 ? `${l2PeriodMin.toFixed(1)} min` : `${(l2PeriodMin / 60).toFixed(1)} hrs`}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-space-bg border border-space-border">
                        <span className="text-[10px] text-slate-400 block">ORBITS PER DAY:</span>
                        <span className="text-sm font-bold text-white">
                          {l2OrbitsPerDay.toFixed(1)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-space-bg border border-space-border">
                        <span className="text-[10px] text-slate-400 block">ORBIT REGIME:</span>
                        <span className="text-xs font-bold text-telemetry-green uppercase">
                          {l2AltitudeKm <= 1200 ? "LEO" : l2AltitudeKm < 35000 ? "MEO" : "GEO"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== INTERACTIVE LESSON 3 ==================== */}
              {activeLesson.id === "lesson-3" && (
                <div className="flex flex-col gap-4">
                  <div className="p-3 rounded bg-black/40 border border-space-border text-xs font-mono text-slate-300">
                    A satellite in Low Earth Orbit spends ~35 minutes of every 90-minute orbit in Earth&apos;s shadow. Balance your solar panel area and battery size so the battery does not drain beyond 40% (Depth of Discharge).
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>SOLAR PANEL AREA:</span>
                          <strong className="text-telemetry-amber">{l3ArrayArea.toFixed(1)} m²</strong>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="5.0"
                          step="0.1"
                          value={l3ArrayArea}
                          onChange={(e) => setL3ArrayArea(Number(e.target.value))}
                          className="w-full accent-telemetry-amber cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>BATTERY CAPACITY:</span>
                          <strong className="text-telemetry-cyan">{l3BatteryWh} Wh</strong>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="800"
                          step="20"
                          value={l3BatteryWh}
                          onChange={(e) => setL3BatteryWh(Number(e.target.value))}
                          className="w-full accent-telemetry-cyan cursor-pointer"
                        />
                      </div>

                      <div className="pt-1">
                        <Button
                          size="sm"
                          variant={l3InEclipse ? "danger" : "primary"}
                          onClick={() => setL3InEclipse(!l3InEclipse)}
                          className="w-full"
                        >
                          {l3InEclipse ? "Orbital Position: ECLIPSE (Shadow)" : "Orbital Position: SUNLIGHT"}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-3.5 rounded bg-space-bg border border-space-border">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">POWER GENERATION:</span>
                        <span className="text-lg font-bold text-white">
                          {l3GenWatts.toFixed(0)} W (Load: {l3LoadWatts} W)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">ECLIPSE BATTERY DRAIN (DOD):</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xl font-bold ${
                              l3DOD > 50 ? "text-telemetry-red" : l3DOD > 35 ? "text-telemetry-amber" : "text-telemetry-green"
                            }`}
                          >
                            {l3DOD}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {l3DOD > 50 ? "(CRITICAL - Rapid Cell Death)" : l3DOD > 35 ? "(WARNING - High Wear)" : "(HEALTHY - 5+ Year Life)"}
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-space-panel h-2 rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            l3DOD > 50 ? "bg-telemetry-red" : l3DOD > 35 ? "bg-telemetry-amber" : "bg-telemetry-green"
                          }`}
                          style={{ width: `${Math.min(100, l3DOD)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== INTERACTIVE LESSON 4 ==================== */}
              {activeLesson.id === "lesson-4" && (
                <div className="flex flex-col gap-4">
                  <div className="p-3 rounded bg-black/40 border border-space-border text-xs font-mono text-slate-300">
                    Earth-observation payloads produce massive daily data (45 GB/day). If your radio downlink throughput or ground pass contact time is too low, the onboard memory buffer overflows and images are permanently lost!
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>RADIO DATA RATE:</span>
                          <strong className="text-telemetry-cyan">{l4DownlinkMbps} Mbps</strong>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="200"
                          step="5"
                          value={l4DownlinkMbps}
                          onChange={(e) => setL4DownlinkMbps(Number(e.target.value))}
                          className="w-full accent-telemetry-cyan cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                          <span>1 Mbps (S-band)</span>
                          <span>50 Mbps (X-band)</span>
                          <span>150 Mbps (Ka-band)</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>DAILY GROUND CONTACT TIME:</span>
                          <strong className="text-telemetry-amber">{l4ContactMinutes} min/day</strong>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="120"
                          step="5"
                          value={l4ContactMinutes}
                          onChange={(e) => setL4ContactMinutes(Number(e.target.value))}
                          className="w-full accent-telemetry-amber cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-3.5 rounded bg-space-bg border border-space-border">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">DAILY DOWNLINK VOLUME:</span>
                        <span className="text-lg font-bold text-white">
                          {l4DownlinkGbPerDay.toFixed(1)} GB / {l4GenGbPerDay} GB
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">SCIENCE DATA RETURN FRACTION:</span>
                        <span
                          className={`text-2xl font-bold ${
                            l4ReturnPercent >= 90 ? "text-telemetry-green" : "text-telemetry-red"
                          }`}
                        >
                          {l4ReturnPercent}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {l4ReturnPercent >= 90
                            ? "✓ Nominal: Ground stations clear buffer every day."
                            : "✗ Storage Overflow: Memory buffer drops valuable science."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== INTERACTIVE LESSON 5 ==================== */}
              {activeLesson.id === "lesson-5" && (
                <div className="flex flex-col gap-4">
                  <div className="p-3 rounded bg-black/40 border border-space-border text-xs font-mono text-slate-300">
                    The Tsiolkovsky Rocket Equation governs space exploration. Adjust payload mass, fuel mass, and engine efficiency (Isp) to see how velocity change (Delta-V) is produced.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span>PAYLOAD DRY MASS:</span>
                          <strong>{l5DryMass} kg</strong>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="2000"
                          step="50"
                          value={l5DryMass}
                          onChange={(e) => setL5DryMass(Number(e.target.value))}
                          className="w-full accent-telemetry-amber cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>PROPELLANT MASS:</span>
                          <strong className="text-telemetry-cyan">{l5PropellantMass} kg</strong>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="1500"
                          step="10"
                          value={l5PropellantMass}
                          onChange={(e) => setL5PropellantMass(Number(e.target.value))}
                          className="w-full accent-telemetry-cyan cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span>ENGINE TYPE &amp; EFFICIENCY (Isp):</span>
                          <strong className="text-telemetry-green">{l5Isp} s</strong>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { label: "Cold Gas (70s)", isp: 70 },
                            { label: "Hydrazine (220s)", isp: 220 },
                            { label: "Ion Plasma (1600s)", isp: 1600 },
                          ].map((eng) => (
                            <button
                              key={eng.isp}
                              type="button"
                              onClick={() => setL5Isp(eng.isp)}
                              className={`p-1.5 rounded border text-[10px] text-center ${
                                l5Isp === eng.isp
                                  ? "bg-telemetry-amber text-black font-bold border-telemetry-amber"
                                  : "bg-space-panel border-space-border text-slate-300"
                              }`}
                            >
                              {eng.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-3.5 rounded bg-space-bg border border-space-border">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1">DELIVERED DELTA-V:</span>
                        <span className="text-3xl font-bold text-telemetry-amber">
                          {l5DeltaV} m/s
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 flex flex-col gap-1 border-t border-space-border/60 pt-2">
                        <span className="text-[10px] text-slate-500">WHAT THIS DELTA-V UNLOCKS:</span>
                        <div className={l5DeltaV >= 150 ? "text-telemetry-green font-semibold" : "text-slate-500"}>
                          {l5DeltaV >= 150 ? "✓" : "✗"} 150 m/s: Low Earth Orbit Stationkeeping
                        </div>
                        <div className={l5DeltaV >= 1500 ? "text-telemetry-green font-semibold" : "text-slate-500"}>
                          {l5DeltaV >= 1500 ? "✓" : "✗"} 1,500 m/s: Geostationary Orbit Circularization
                        </div>
                        <div className={l5DeltaV >= 3150 ? "text-telemetry-green font-semibold" : "text-slate-500"}>
                          {l5DeltaV >= 3150 ? "✓" : "✗"} 3,150 m/s: Trans-Lunar Moon Injection
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== INTERACTIVE LESSON 6 ==================== */}
              {activeLesson.id === "lesson-6" && (
                <div className="flex flex-col gap-4 font-mono text-xs">
                  <div className="p-3 rounded bg-black/40 border border-space-border text-slate-300">
                    Step-by-step guided build: select each subsystem to assemble your first certified Earth-observation satellite, then trigger orbital launch!
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center">
                    {[
                      { step: 1, title: "1. Payload", choice: "Land Imager (430 kg)" },
                      { step: 2, title: "2. Bus", choice: "Mid-Size EELV" },
                      { step: 3, title: "3. Power", choice: "2.4 m² Arrays + 320 Wh" },
                      { step: 4, title: "4. ADCS", choice: "Reaction Wheels (0.01°)" },
                      { step: 5, title: "5. Rocket", choice: "Vega-C to SSO-700" },
                    ].map((s) => (
                      <div
                        key={s.step}
                        className={`p-2 rounded border ${
                          l6Step > s.step || l6Launched
                            ? "bg-telemetry-green/10 border-telemetry-green/40 text-telemetry-green"
                            : l6Step === s.step
                            ? "bg-telemetry-amber/10 border-telemetry-amber text-telemetry-amber"
                            : "bg-space-bg border-space-border text-slate-500"
                        }`}
                      >
                        <div className="font-heading uppercase text-[10px] font-bold">
                          {s.title}
                        </div>
                        <div className="text-[10px] mt-0.5 truncate">{s.choice}</div>
                      </div>
                    ))}
                  </div>

                  {!l6Launched ? (
                    <div className="p-4 rounded bg-space-bg border border-space-border flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <div className="font-heading uppercase text-sm text-white font-bold mb-1">
                          {l6Step === 1 && "Step 1: Install Earth Optical Imager"}
                          {l6Step === 2 && "Step 2: Match Chassis to Payload Mass"}
                          {l6Step === 3 && "Step 3: Size Solar Panels & Battery Bank"}
                          {l6Step === 4 && "Step 4: Equip Reaction Wheels for Precision Steering"}
                          {l6Step === 5 && "Step 5: Authorize Launch Vehicle to 700 km SSO"}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {l6Step === 1 && "Select the Operational Land Imager (30m spatial resolution) to fulfill charter."}
                          {l6Step === 2 && "A 430 kg camera requires an EELV Mid-Size bus to maintain structural margin."}
                          {l6Step === 3 && "2.4 m² arrays generate 380W in sunlight and 320 Wh sustains eclipse passes."}
                          {l6Step === 4 && "3-axis reaction wheels provide 0.01° boresight stabilization."}
                          {l6Step === 5 && "Vega-C delivers 2,200 kg into Sun-synchronous orbit with certified margin."}
                        </p>
                      </div>

                      {l6Step < 5 ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setL6Step((s) => s + 1)}
                          className="shrink-0"
                        >
                          Confirm &amp; Next Step
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setL6Launched(true);
                            handleFinishLesson("lesson-6", "Advanced Planetary Sensor Suite");
                          }}
                          className="shrink-0 bg-telemetry-green hover:bg-telemetry-green/90 text-black font-bold"
                        >
                          <Rocket className="w-3.5 h-3.5 mr-1" />
                          Launch Satellite!
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-telemetry-green/10 border border-telemetry-green/50 text-center flex flex-col items-center">
                      <Sparkles className="w-8 h-8 text-telemetry-green mb-2 animate-bounce" />
                      <h3 className="font-heading uppercase text-lg text-white font-bold mb-1">
                        ORBITAL INSERTION CONFIRMED!
                      </h3>
                      <p className="text-xs text-slate-300 max-w-md mb-4">
                        Congratulations! Your spacecraft was successfully placed into a 700 km Sun-synchronous orbit. All telemetry nominal.
                      </p>
                      <Link href="/mission/new">
                        <Button size="sm" variant="primary">
                          Proceed to Full Mission Operations
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Lesson Footer Actions */}
            <div className="mt-6 pt-4 border-t border-space-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Award className="w-4 h-4 text-telemetry-amber" />
                <span className="text-slate-300">
                  Badge: <strong className="text-white">{activeLesson.badgeName}</strong>
                </span>
                {isLessonComplete(activeLesson.id) && (
                  <Badge variant="info" size="sm" className="text-[10px]">
                    ACQUIRED
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isLessonComplete(activeLesson.id) ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleFinishLesson(activeLesson.id, activeLesson.unlockedPartName)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Complete Lesson &amp; Claim Badge
                  </Button>
                ) : (
                  <div className="text-xs font-mono text-telemetry-green font-semibold">
                    ✓ Lesson Certified
                  </div>
                )}

                {/* Advance to next lesson button */}
                {activeLesson.number < 6 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveLessonId(`lesson-${activeLesson.number + 1}`)}
                  >
                    <span>Next Lesson</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-space-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div>MOONLANDER SPACE ACADEMY // CADET FLIGHT ACCREDITATION</div>
        <div className="flex items-center gap-3">
          <Link href="/codex" className="text-telemetry-amber hover:underline">
            SPACE CODEX
          </Link>
          <span>•</span>
          <Link href="/sandbox" className="text-telemetry-cyan hover:underline">
            SANDBOX STUDIO
          </Link>
        </div>
      </footer>
    </div>
  );
}
