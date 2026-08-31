import React from 'react';
import {
  ShieldCheck,
  Award,
  Microscope,
  CheckCircle2,
  Cpu,
  Thermometer,
  FileCheck,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react';

export const PublicTechnologyAndQuality: React.FC = () => {
  return (
    <section id="public-quality-tech" className="py-16 sm:py-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>NABL ISO 15189:2022 Certified Standard of Care</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Clinical Quality Assurance & Diagnostic Technology
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Every specimen at LabNova is processed under strict multi-tiered quality control
            protocols, utilizing automated closed-tube instrumentation to ensure zero manual
            transcription error.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Automated Instrumentation */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Closed-Tube Robotic Analyzers
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Automated 5-part differential hematology (Sysmex) and integrated clinical chemistry
                (Roche Cobas) minimize aerosolization and sample carryover.
              </p>
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Zero manual sample handling</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Bidirectional LIMS auto-interface</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Triple-Tier Internal QC */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-teal-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Triple-Level Daily QC
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Low, normal, and high control standards run twice daily with Westgard multirule
                verification before any patient batch is released.
              </p>
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Bio-Rad Unity Real Time EQAS</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Standard Levey-Jennings tracking</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Cold-Chain & Barcode Traceability */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-blue-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Thermometer className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Barcoded Cold-Chain Chain
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                From home phlebotomy draw to analyzer tray, specimen temperature is monitored
                continuously with electronic barcode hand-off logs.
              </p>
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>2°C – 8°C gel pack transport</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Zero patient mix-up guarantee</span>
              </li>
            </ul>
          </div>

          {/* Pillar 4: Critical Biological Alerting */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-rose-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Critical Value Rapid Alert
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Panic-level biological findings (e.g. Potassium &gt; 6.2, Platelets &lt; 20,000,
                Troponin elevated) trigger immediate direct phone call to treating physician.
              </p>
            </div>
            <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Direct emergency physician notification</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Double-check re-run protocol</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
