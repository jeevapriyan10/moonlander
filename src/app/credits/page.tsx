"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck, Database, BookOpen, Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-space-bg text-slate-200 flex flex-col font-body">
      {/* Top Header */}
      <header className="h-14 border-b border-space-border bg-space-panel/80 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-heading uppercase text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Flight Ops</span>
          </Link>
          <span className="text-gray-600">/</span>
          <h1 className="font-heading font-extrabold text-sm uppercase tracking-wider text-white">
            MoonLander // Scientific Citations & Asset Credits
          </h1>
        </div>
        <Badge variant="info" size="sm">
          OPEN ACCESS & CC BY 4.0
        </Badge>
      </header>

      {/* Main Credits Dossier */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8 space-y-8">
        <div className="space-y-2 border-b border-space-border pb-6">
          <Badge variant="amber" size="sm">
            LEGAL & ATTRIBUTION
          </Badge>
          <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-wider text-white">
            Planetary Assets, Physics & Ephemeris Citations
          </h2>
          <p className="font-mono text-xs text-slate-400 max-w-3xl leading-relaxed">
            MoonLander utilizes open-access datasets, public-domain imagery, and peer-reviewed astrodynamic models. No proprietary logos, insignia, or commercial trademarks are used.
          </p>
        </div>

        {/* Section 1: Planetary Textures */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-telemetry-cyan font-heading uppercase tracking-wider font-bold text-lg">
            <Globe2 className="w-5 h-5" />
            <h3>1. Planetary Maps & Surface Textures</h3>
          </div>

          <div className="rounded-xl border border-space-border bg-space-panel/60 overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-space-panel border-b border-space-border text-slate-400 font-heading uppercase">
                <tr>
                  <th className="p-3">Celestial Body</th>
                  <th className="p-3">Maps & Channels</th>
                  <th className="p-3">Source & Credit</th>
                  <th className="p-3">License</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-border/60 text-slate-300">
                <tr>
                  <td className="p-3 font-bold text-white">Earth</td>
                  <td className="p-3">Day, Night Lights, Clouds, Normal, Specular</td>
                  <td className="p-3">Solar System Scope / NASA Visible Earth ("Blue Marble" & "Black Marble")</td>
                  <td className="p-3 text-telemetry-green">CC BY 4.0 / Public Domain</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Moon</td>
                  <td className="p-3">Surface Albedo & Topographic Relief</td>
                  <td className="p-3">Solar System Scope / NASA Lunar Reconnaissance Orbiter (LROC)</td>
                  <td className="p-3 text-telemetry-green">CC BY 4.0 / Public Domain</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Mars</td>
                  <td className="p-3">Surface Albedo & MOLA Elevation</td>
                  <td className="p-3">Solar System Scope / NASA Mars Global Surveyor (MOLA)</td>
                  <td className="p-3 text-telemetry-green">CC BY 4.0 / Public Domain</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Venus</td>
                  <td className="p-3">Atmospheric Super-Rotation Clouds</td>
                  <td className="p-3">Solar System Scope / NASA Magellan & JAXA Akatsuki</td>
                  <td className="p-3 text-telemetry-green">CC BY 4.0 / Public Domain</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Jupiter & Saturn</td>
                  <td className="p-3">Atmospheric Belts & Saturn Ring Alpha</td>
                  <td className="p-3">NASA Cassini Imaging Central Laboratory for Operations (CICLOPS) & Juno</td>
                  <td className="p-3 text-telemetry-green">CC BY 4.0 / Public Domain</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Milky Way</td>
                  <td className="p-3">Equirectangular Deep Space Panorama</td>
                  <td className="p-3">European Southern Observatory (ESO) / S. Brunier</td>
                  <td className="p-3 text-telemetry-green">CC BY 4.0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Ephemerides & Real Astronomy */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-telemetry-amber font-heading uppercase tracking-wider font-bold text-lg">
            <Database className="w-5 h-5" />
            <h3>2. Astronomical Ephemeris & Numerical Models</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-1.5">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Keplerian Ephemerides</h4>
              <p className="text-slate-400">
                NASA Jet Propulsion Laboratory (JPL) Analytical Keplerian Elements by E. M. Standish (1992). Computes J2000 planetary state vectors across 1800–2050 AD.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-1.5">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Earth Gravity & Geodesy</h4>
              <p className="text-slate-400">
                EGM96 spherical harmonic gravity model, WGS-84 reference ellipsoid, and IAU 2015 recommended physical constants.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-1.5">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Lambert Targeter</h4>
              <p className="text-slate-400">
                Universal variable formulation with Battin-Vaughn hyperbola solver for deterministic multi-revolution interplanetary transfers.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 space-y-1.5">
              <h4 className="font-heading uppercase text-white font-bold text-sm">Space Weather Datasets</h4>
              <p className="text-slate-400">
                Historical coronal mass ejection (CME) and solar energetic particle (SEP) flux records from NASA CCMC / DONKI space weather archives.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Engineering Literature */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-telemetry-green font-heading uppercase tracking-wider font-bold text-lg">
            <BookOpen className="w-5 h-5" />
            <h3>3. Aerospace Systems Engineering References</h3>
          </div>

          <div className="p-4 rounded-xl border border-space-border bg-space-panel/60 font-mono text-xs text-slate-300 space-y-2">
            <p>1. Larson, W. J., & Wertz, J. R. (1999). <em>Space Mission Analysis and Design (SMAD)</em> (3rd ed.). Microcosm Press / Springer.</p>
            <p>2. Vallado, D. A. (2013). <em>Fundamentals of Astrodynamics and Applications</em> (4th ed.). Microcosm Press.</p>
            <p>3. NASA. (2016). <em>NASA Systems Engineering Handbook</em> (NASA/SP-2016-6105 Rev 2). National Aeronautics and Space Administration.</p>
            <p>4. AIAA. (2006). <em>AIAA S-120-2006: Mass Properties Control for Space Systems</em>. American Institute of Aeronautics and Astronautics.</p>
          </div>
        </section>

        <div className="text-center pt-6 border-t border-space-border/60">
          <Link href="/campaign">
            <span className="font-heading uppercase text-xs text-telemetry-amber hover:underline tracking-wider cursor-pointer">
              Return to Meridian Space Authority Campaign
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}

