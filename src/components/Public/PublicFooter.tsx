import React from 'react';
import {
  FlaskConical,
  ShieldCheck,
  Award,
  Lock,
  ArrowUp,
  HeartPulse,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  QrCode,
  FileCheck2,
} from 'lucide-react';

interface PublicFooterProps {
  onOpenLogin?: () => void;
  onOpenStaffLogin?: () => void;
  onOpenHomeBooking: () => void;
  onVerifyReportClick?: () => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({
  onOpenLogin,
  onOpenStaffLogin,
  onOpenHomeBooking,
  onVerifyReportClick,
}) => {
  const handleLoginClick = onOpenLogin || onOpenStaffLogin;
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 transition-colors pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Col 1: Brand & Accreditation */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <FlaskConical className="w-6 h-6 transform -rotate-6" />
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-white">LabNova</span>
                <p className="text-xs text-teal-400 font-medium">
                  Pathology & Molecular Diagnostic Laboratory
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              Delivering accurate, verified clinical pathology diagnostics through automated
              instrumentation, closed-tube hematology and chemistry workflows, and Consultant
              Pathologist supervision.
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
              <span className="px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800 text-teal-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                NABL ISO 15189:2022
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                Bio-Rad EQAS Certified
              </span>
            </div>
          </div>

          {/* Col 2: Patient Services */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Patient Services
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => scrollToSection('public-tests-catalog')}
                  className="hover:text-teal-400 transition"
                >
                  Diagnostic Tests & Tariffs
                </button>
              </li>
              <li>
                <button onClick={onOpenHomeBooking} className="hover:text-teal-400 transition">
                  Book Home Blood Draw
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('public-hero')}
                  className="hover:text-teal-400 transition"
                >
                  Track Sample Status
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('public-quality-tech')}
                  className="hover:text-teal-400 transition"
                >
                  Quality & Instrumentation
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('public-doctors-team')}
                  className="hover:text-teal-400 transition"
                >
                  Consultant Pathologists
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Report Verification & Security Compliance */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-teal-400" />
              <span>Diagnostic Report Verification</span>
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Patients and consulting physicians can verify the authenticity of any clinical laboratory
              report by scanning its QR code or submitting the Report ID.
            </p>

            {onVerifyReportClick && (
              <button
                id="footer-btn-verify-report"
                onClick={onVerifyReportClick}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-950/80 hover:bg-teal-900/80 border border-teal-700/60 hover:border-teal-500 text-teal-200 hover:text-white text-xs font-bold flex items-center justify-center gap-2.5 shadow-sm transition group"
              >
                <QrCode className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                <span>Verify Diagnostic Report Authenticity</span>
                <ChevronRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Public Patient Data:</strong> Patient records and clinical reports
                are protected with cryptographic hashing and role-based data isolation.
              </span>
            </div>
          </div>
        </div>

        {/* Medical Regulatory Disclaimer */}
        <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-300">Statutory Diagnostic Disclaimer:</p>
          <p>
            Diagnostic test results are biological measurements intended for clinical correlation
            and therapeutic interpretation by qualified registered medical practitioners.
            Investigations are conducted strictly in accordance with NABL ISO 15189 guidelines. For
            urgent critical findings, please immediately contact our emergency pathology desk at
            +91 9675607315.
          </p>
        </div>

        {/* Bottom Bar: Copyright, Login, & Back to Top */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              © {new Date().getFullYear()} LabNova Pathology & Diagnostic Laboratory. All rights
              reserved.
            </span>
            {handleLoginClick && (
              <button
                id="footer-btn-login-signin"
                onClick={handleLoginClick}
                className="hover:text-teal-400 text-slate-400 font-medium flex items-center gap-1.5 transition"
              >
                <Lock className="w-3.5 h-3.5 text-teal-500" />
                <span>Login / Sign In</span>
              </button>
            )}
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 hover:text-teal-400 transition"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
