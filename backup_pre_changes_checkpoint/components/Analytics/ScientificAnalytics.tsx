import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Calculator,
  ChevronRight,
  Compass,
  Database,
  Divide,
  Eye,
  FileSpreadsheet,
  FlaskConical,
  Gauge,
  HelpCircle,
  Info,
  LineChart,
  Percent,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';

export const ScientificAnalytics: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'calculators' | 'uv_vis' | 'qpcr' | 'kinetics'>('calculators');

  // Calculator States
  // 1. Molarity: mass (g) = Molarity (M) * MW (g/mol) * Volume (L)
  const [molTargetM, setMolTargetM] = useState<number>(0.5); // 0.5 M
  const [molMW, setMolMW] = useState<number>(58.44); // NaCl MW
  const [molVolumeMl, setMolVolumeMl] = useState<number>(500); // 500 mL

  const calculatedMassGrams = (molTargetM * molMW * (molVolumeMl / 1000)).toFixed(3);

  // 2. C1V1 = C2V2
  const [c1, setC1] = useState<number>(10); // 10X or 10 mM
  const [c2, setC2] = useState<number>(1); // 1X or 1 mM
  const [v2, setV2] = useState<number>(50); // 50 mL final
  const calculatedV1 = c1 > 0 ? ((c2 * v2) / c1).toFixed(2) : '0';
  const calculatedDiluent = (Number(v2) - Number(calculatedV1)).toFixed(2);

  // 3. RPM to RCF / g-force: RCF = 1.118 * 10^-5 * r * (RPM)^2
  const [rotorRadiusMm, setRotorRadiusMm] = useState<number>(100); // 100 mm
  const [rpmValue, setRpmValue] = useState<number>(14000); // 14,000 RPM
  const calculatedRcf = Math.round(1.118e-5 * (rotorRadiusMm / 10) * Math.pow(rpmValue, 2));

  // 4. DNA A260/A280 Purity Calculator
  const [a260Val, setA260Val] = useState<number>(0.84);
  const [a280Val, setA280Val] = useState<number>(0.45);
  const a260_280_ratio = a280Val > 0 ? (a260Val / a280Val).toFixed(2) : '0';
  const dnaConcentrationUgMl = (a260Val * 50).toFixed(1);

  // Interactive Kinetics simulation parameters
  const [vmax, setVmax] = useState<number>(120);
  const [km, setKm] = useState<number>(15);

  // Generate Michaelis Menten points
  const substratePoints = [0, 2, 5, 10, 15, 25, 40, 60, 90, 130, 180, 250];
  const kineticsData = substratePoints.map((s) => ({
    s,
    v: Number(((vmax * s) / (km + s)).toFixed(1)),
  }));

  // UV-Vis points mock (220nm to 340nm peak around 260nm for nucleic acids)
  const wavelengths = Array.from({ length: 25 }, (_, i) => 220 + i * 5);
  const uvVisPoints = wavelengths.map((wl) => {
    // Gaussian peak centered at 260 with sigma 18
    const peak = Math.exp(-Math.pow(wl - 260, 2) / (2 * Math.pow(16, 2)));
    const baseline = 0.05 + 0.02 * Math.sin(wl / 20);
    return {
      wl,
      abs: Number((peak * 0.92 + baseline).toFixed(3)),
    };
  });

  // qPCR amplification curves mock (Cycles 1 to 40)
  const cycles = Array.from({ length: 40 }, (_, i) => i + 1);
  const qpcrCurves = [
    { sample: 'Sample A (Target High)', ct: 18.4, color: '#10b981', baseline: 0.02 },
    { sample: 'Sample B (Target Mid)', ct: 23.1, color: '#3b82f6', baseline: 0.02 },
    { sample: 'Sample C (Target Low)', ct: 28.5, color: '#f59e0b', baseline: 0.02 },
    { sample: 'NTC (Negative Control)', ct: 38.0, color: '#ef4444', baseline: 0.01 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Scientific Analytics & Laboratory Math
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Molarity calculators, optical density spectrum modeling, and enzyme reaction kinetics.
          </p>
        </div>

        {/* Subtab selection pills */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setActiveSubTab('calculators')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'calculators'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Formulation Math
          </button>
          <button
            onClick={() => setActiveSubTab('uv_vis')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'uv_vis'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            UV-Vis Spectrum
          </button>
          <button
            onClick={() => setActiveSubTab('qpcr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'qpcr'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            qPCR Amplification
          </button>
          <button
            onClick={() => setActiveSubTab('kinetics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'kinetics'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Enzyme Kinetics
          </button>
        </div>
      </div>

      {/* 1. CALCULATORS TAB */}
      {activeSubTab === 'calculators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Molarity Calculator */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Solution Molarity & Mass Calculator
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculate exact solute mass for desired molarity: <code>mass = M × MW × Volume</code>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Concentration (Molar, M):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={molTargetM}
                  onChange={(e) => setMolTargetM(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Formula Molecular Weight (g/mol):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={molMW}
                  onChange={(e) => setMolMW(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Desired Volume (mL):
                </label>
                <input
                  type="number"
                  value={molVolumeMl}
                  onChange={(e) => setMolVolumeMl(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Required Mass to Weigh:
              </span>
              <span className="text-xl font-mono font-black text-emerald-700 dark:text-emerald-300">
                {calculatedMassGrams} g
              </span>
            </div>
          </div>

          {/* C1V1 = C2V2 Dilution Calculator */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Divide className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Serial Stock Dilution (C₁V₁ = C₂V₂)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compute stock volume needed to achieve desired working concentration.
            </p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Stock Conc (C₁):
                  </label>
                  <input
                    type="number"
                    value={c1}
                    onChange={(e) => setC1(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Conc (C₂):
                  </label>
                  <input
                    type="number"
                    value={c2}
                    onChange={(e) => setC2(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Final Volume Desired (V₂ in mL):
                </label>
                <input
                  type="number"
                  value={v2}
                  onChange={(e) => setV2(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-blue-900 dark:text-blue-200">
                  Stock Volume (V₁):
                </span>
                <span className="font-mono font-black text-blue-700 dark:text-blue-300 text-lg">
                  {calculatedV1} mL
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300">
                <span>Buffer / Diluent to add:</span>
                <span className="font-mono font-bold">{calculatedDiluent} mL</span>
              </div>
            </div>
          </div>

          {/* Centrifuge RPM to RCF / g Converter */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Centrifuge Speed (RPM ↔ RCF × g)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standardize centrifuge protocols across different rotor geometries.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rotor Radius (mm):
                </label>
                <input
                  type="number"
                  value={rotorRadiusMm}
                  onChange={(e) => setRotorRadiusMm(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Rotor Speed (RPM):
                </label>
                <input
                  type="number"
                  step="500"
                  value={rpmValue}
                  onChange={(e) => setRpmValue(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                Relative Centrifugal Force (RCF):
              </span>
              <span className="text-xl font-mono font-black text-teal-700 dark:text-teal-300">
                {calculatedRcf.toLocaleString()} × g
              </span>
            </div>
          </div>

          {/* DNA / RNA A260/A280 Purity Assayer */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Spectrophotometric Nucleic Acid Purity
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluate pure dsDNA (ideal: 1.80-1.85) vs protein contamination (&lt;1.70).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Absorbance at 260 nm:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={a260Val}
                  onChange={(e) => setA260Val(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Absorbance at 280 nm:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={a280Val}
                  onChange={(e) => setA280Val(Number(e.target.value))}
                  className="w-full p-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  A260 / A280 Optical Ratio:
                </span>
                <span className="font-mono font-black text-purple-700 dark:text-purple-300 text-lg">
                  {a260_280_ratio}{' '}
                  {Number(a260_280_ratio) >= 1.8 && Number(a260_280_ratio) <= 2.0 ? (
                    <span className="text-xs text-emerald-600 font-bold">(Pure)</span>
                  ) : (
                    <span className="text-xs text-amber-600 font-bold">(Sub-optimal)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-purple-700 dark:text-purple-300">
                <span>Estimated dsDNA Concentration:</span>
                <span className="font-mono font-bold">{dnaConcentrationUgMl} µg/mL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. UV-VIS SPECTRUM SCAN */}
      {activeSubTab === 'uv_vis' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                UV-Vis Full Spectrum Scan (220 nm - 340 nm)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sample: Purified Genomic Plasmid pUC19-GFP • Peak Absorbance at λ = 260 nm (0.970 OD)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              A260/A280 = 1.87 (Pristine)
            </span>
          </div>

          {/* SVG Spectrum Chart */}
          <div className="w-full h-64 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              {/* Horizontal Grid lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="40" y1="65" x2="480" y2="65" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="40" y1="110" x2="480" y2="110" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="40" y1="155" x2="480" y2="155" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="0.8" />

              {/* Y Axis labels */}
              <text x="10" y="24" fontSize="9" fill="#94a3b8" fontFamily="monospace">1.0 OD</text>
              <text x="10" y="69" fontSize="9" fill="#94a3b8" fontFamily="monospace">0.7 OD</text>
              <text x="10" y="114" fontSize="9" fill="#94a3b8" fontFamily="monospace">0.4 OD</text>
              <text x="10" y="159" fontSize="9" fill="#94a3b8" fontFamily="monospace">0.1 OD</text>

              {/* Spectrum path */}
              {(() => {
                const pointsStr = uvVisPoints
                  .map((p, idx) => {
                    const x = 40 + (idx / (uvVisPoints.length - 1)) * 440;
                    const y = 165 - (p.abs / 1.0) * 145;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                    />
                    {/* Area fill */}
                    <polygon
                      fill="url(#uvvis-gradient)"
                      points={`40,165 ${pointsStr} 480,165`}
                      opacity="0.18"
                    />
                    <defs>
                      <linearGradient id="uvvis-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </>
                );
              })()}

              {/* 260nm peak marker */}
              <line x1="186" y1="20" x2="186" y2="165" stroke="#ef4444" strokeDasharray="2 2" strokeWidth="1" />
              <circle cx="186" cy="24" r="4" fill="#ef4444" />
              <text x="194" y="28" fontSize="10" fontWeight="bold" fill="#ef4444">
                λ 260 nm Peak
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <span className="text-slate-400 block">Baseline @ 320 nm</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">0.052 OD</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <span className="text-slate-400 block">Peak @ 260 nm</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">0.970 OD</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
              <span className="text-slate-400 block">Peak @ 280 nm</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">0.518 OD</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. qPCR AMPLIFICATION CURVES */}
      {activeSubTab === 'qpcr' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Real-Time qPCR Amplification Plot (ΔRn vs Cycle)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                SYBR Green I Dye • 40 Cycles • Baseline Threshold = 0.200 ΔRn
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              {qpcrCurves.map((c, i) => (
                <div key={i} className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{c.sample}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG qPCR Chart */}
          <div className="w-full h-64 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              {/* Threshold line */}
              <line x1="40" y1="120" x2="480" y2="120" stroke="#f43f5e" strokeDasharray="4 2" strokeWidth="1.2" />
              <text x="400" y="115" fontSize="9" fontWeight="bold" fill="#f43f5e">Threshold (Ct)</text>

              {/* Grid lines */}
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="40" y1="30" x2="40" y2="170" stroke="#cbd5e1" strokeWidth="1" />

              {/* X cycle marks */}
              {[1, 10, 20, 30, 40].map((cy) => (
                <text
                  key={cy}
                  x={40 + ((cy - 1) / 39) * 440}
                  y="185"
                  fontSize="9"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  Cycle {cy}
                </text>
              ))}

              {/* Generate Sigmoid Curves */}
              {qpcrCurves.map((curve, idx) => {
                const points = cycles.map((c) => {
                  const x = 40 + ((c - 1) / 39) * 440;
                  // Sigmoidal function: 1 / (1 + exp(-k * (c - ct)))
                  const val = 1.6 / (1 + Math.exp(-0.4 * (c - curve.ct)));
                  const y = 170 - val * 85;
                  return `${x},${y}`;
                });

                return (
                  <polyline
                    key={idx}
                    fill="none"
                    stroke={curve.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    points={points.join(' ')}
                  />
                );
              })}
            </svg>
          </div>

          <div className="grid grid-cols-4 gap-3 text-xs">
            {qpcrCurves.map((c, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border">
                <span className="text-slate-400 block truncate">{c.sample}</span>
                <span className="font-mono text-sm font-bold block mt-0.5" style={{ color: c.color }}>
                  Ct = {c.ct}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ENZYME KINETICS */}
      {activeSubTab === 'kinetics' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Michaelis-Menten Enzyme Kinetics Simulator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Equation: <code>v = (Vmax × [S]) / (Km + [S])</code>
              </p>
            </div>

            <div className="flex items-center space-x-4 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-600 dark:text-slate-400">Vmax:</span>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={vmax}
                  onChange={(e) => setVmax(Number(e.target.value))}
                  className="w-20 accent-emerald-600"
                />
                <span className="font-bold text-emerald-600">{vmax} µM/min</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-600 dark:text-slate-400">Km:</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-20 accent-emerald-600"
                />
                <span className="font-bold text-emerald-600">{km} µM</span>
              </div>
            </div>
          </div>

          {/* SVG Kinetics Chart */}
          <div className="w-full h-64 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 relative">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              {/* Asymptote Vmax line */}
              <line x1="40" y1="30" x2="480" y2="30" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1" />
              <text x="410" y="25" fontSize="9" fill="#94a3b8">Vmax = {vmax}</text>

              {/* Coordinates */}
              <line x1="40" y1="170" x2="480" y2="170" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="40" y1="30" x2="40" y2="170" stroke="#cbd5e1" strokeWidth="1" />

              {/* Curve */}
              {(() => {
                const maxS = 250;
                const points = kineticsData.map((pt) => {
                  const x = 40 + (pt.s / maxS) * 440;
                  const y = 170 - (pt.v / 200) * 140;
                  return `${x},${y}`;
                });

                return (
                  <>
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      points={points.join(' ')}
                    />
                    {kineticsData.map((pt, i) => {
                      const x = 40 + (pt.s / maxS) * 440;
                      const y = 170 - (pt.v / 200) * 140;
                      return <circle key={i} cx={x} cy={y} r="3" fill="#059669" />;
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
