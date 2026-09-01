import React, { useState } from 'react';
import {
  FlaskConical,
  ShieldCheck,
  Award,
  Clock,
  ArrowRight,
  Search,
  CheckCircle2,
  Lock,
  Activity,
  Calendar,
  Sparkles,
  Barcode,
  Microscope,
  FileCheck,
  Check,
} from 'lucide-react';

interface PublicHeroProps {
  onExploreTests: () => void;
  onOpenHomeBooking: () => void;
  onOpenStaffLogin: () => void;
}

export const PublicHero: React.FC<PublicHeroProps> = ({
  onExploreTests,
  onOpenHomeBooking,
  onOpenStaffLogin,
}) => {
  const [trackingCode, setTrackingCode] = useState('');
  const [trackedStatus, setTrackedStatus] = useState<{
    searched: boolean;
    found: boolean;
    stage: number;
    code: string;
    sampleType?: string;
  } | null>(null);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    const trimmed = trackingCode.trim().toUpperCase();
    // Simulate real specimen tracking lookup without leaking private patient data
    setTrackedStatus({
      searched: true,
      found: true,
      stage: 3, // Verified & Ready
      code: trimmed,
      sampleType: 'Venous Whole Blood (EDTA / Gel SST)',
    });
  };

  return (
    <section id="public-hero" className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* Background Medical Mesh & Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-[28rem] h-[28rem] bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-2xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Mission, Medical Hierarchy & Actions */}
          <div className="lg:col-span-7 space-y-6">
            {/* Accreditation Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>NABL ISO 15189:2022 Accredited Reference Pathology Laboratory</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Precision Diagnostics,{' '}
                <span className="bg-gradient-to-r from-blue-700 via-teal-600 to-cyan-600 dark:from-blue-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
                  Accurate Reporting
                </span>
                , Trusted Care.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                LabNova combines 100% automated closed-tube analyzers, automated barcode cold-chain
                logistics, and Consultant Pathologist verification to provide dependable diagnostic
                insights with industry-leading 2–4 hour turnaround.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                id="hero-btn-explore-tests"
                onClick={onExploreTests}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-md shadow-blue-600/25 transition-all transform active:scale-95"
              >
                <span>Browse Diagnostic Test Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-btn-home-booking"
                onClick={onOpenHomeBooking}
                className="px-5 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-2 shadow-xs transition"
              >
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Book Home Sample Collection</span>
              </button>

              <button
                onClick={onOpenStaffLogin}
                className="px-4 py-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-teal-400 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Staff Portal</span>
              </button>
            </div>

            {/* Trust Highlights Strip */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  99.8%
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Analytical Precision (Bio-Rad EQAS)
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  2–4 Hrs
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Rapid Routine Turnaround Time
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  75+
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Automated Diagnostic Panels
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  100%
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Barcoded Specimen Traceability
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Specimen Tracking & Quality Verification Card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Specimen Accession Tracker
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Check your laboratory test status in real-time
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Live System
                </span>
              </div>

              {/* Barcode / Accession Search Form */}
              <form onSubmit={handleTrackSubmit} className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sample Barcode or Accession ID
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-public-track-code"
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="e.g. ACC-8942-X or BAR-1002"
                    className="w-full pl-9 pr-24 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition shadow-xs"
                  >
                    Track Status
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>Try demo code:</span>
                  <button
                    type="button"
                    onClick={() => setTrackingCode('ACC-8942-X')}
                    className="text-teal-600 dark:text-teal-400 underline font-mono font-medium hover:text-teal-500"
                  >
                    ACC-8942-X
                  </button>
                </p>
              </form>

              {/* Live Tracking Result Stepper */}
              {trackedStatus && trackedStatus.found && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Accession Code
                      </span>
                      <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {trackedStatus.code}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-bold">
                      Pathologist Verified
                    </span>
                  </div>

                  {/* 4-Step Chain */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          1. Specimen Accessioned & Barcoded
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Vacutainer verified with dual phlebotomy check
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          2. Automated High-Precision Analysis
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Analyzed on Sysmex / Roche Cobas with active QC
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          3. Consultant Pathologist Verified
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Dr. Manisha Kulkarni, MD (Reg # MMC-2014/09/3842)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center shrink-0 text-xs animate-pulse">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="text-xs">
                        <div className="font-bold text-teal-600 dark:text-teal-400">
                          4. Digital Report Released & Ready
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Delivered securely to patient phone & email
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Assurance Notice */}
                  <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Strict Patient Privacy:</strong> To protect clinical confidentiality,
                      full diagnostic values and patient personal data are restricted to verified
                      SMS/OTP links or authorized staff sign-in.
                    </span>
                  </div>
                </div>
              )}

              {/* Quality Standards Strip */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                  <Microscope className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      Triple-Tier QC
                    </div>
                    <div className="text-[10px] text-slate-500">Bio-Rad Unity Daily</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center gap-2.5">
                  <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      QR Verification
                    </div>
                    <div className="text-[10px] text-slate-500">21 CFR Part 11 Hash</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
