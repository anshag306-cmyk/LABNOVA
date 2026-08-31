import React from 'react';
import { Award, ShieldCheck, Stethoscope, CheckCircle2, GraduationCap, Building2 } from 'lucide-react';

export const PublicDoctorsTeam: React.FC = () => {
  return (
    <section
      id="public-doctors-team"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Consultant Clinical Leadership</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pathologist-Supervised Diagnostic Excellence
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Every laboratory finding is interpreted, cross-correlated, and electronically authorized
            by qualified medical pathologists with extensive clinical diagnostic experience.
          </p>
        </div>

        {/* Leadership Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Pathologist 1: Dr. Manisha Kulkarni */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20 shrink-0">
                  MK
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Dr. Manisha Kulkarni
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 text-[10px] font-bold">
                      MD Path
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-teal-600 dark:text-teal-400">
                    Chief Consulting Pathologist & NABL Authorized Signatory
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Reg. No: MMC-2014/09/3842
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Specializing in Oncopathology, Hematomorphology, and Clinical Biochemistry. Over 14
                years of diagnostic leadership guiding tertiary-care referral testing with rigorous
                quality standards.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>MBBS, MD (Pathology) – B.J. Government Medical College</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Lead Assessor Trained in ISO 15189:2022</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pathologist 2: Sunil K. Verma */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-teal-500/20 shrink-0">
                  SV
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      Sunil K. Verma
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                      M.Sc MLT
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Senior Biomedical Analyst & Laboratory Quality Manager
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Member, Association of Clinical Biochemists
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Oversees automated robotic analyzer calibration, daily Levey-Jennings QC monitoring,
                cold-chain specimen handling, and electronic bidirectional LIMS integration.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>M.Sc Medical Laboratory Technology (Biochemistry)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Award className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span>Certified EQAS & Statistical Process Control Specialist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
