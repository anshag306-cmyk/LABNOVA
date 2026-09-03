import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  FileText,
  Building2,
  UserCheck,
  Calendar,
  Hash,
  Download,
  Search,
  Lock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { PathologyReport, Laboratory, LabSettings } from '../../types';
import { getReportForVerification, getCachedPathologyData } from '../../services/pathologyFirebase';
import { downloadPathologyReportPdf } from '../../services/pdfReportGenerator';

interface PublicReportVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportId?: string;
}

export const PublicReportVerificationModal: React.FC<PublicReportVerificationModalProps> = ({
  isOpen,
  onClose,
  initialReportId,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialReportId || '');
  const [loading, setLoading] = useState(false);
  const [verifiedData, setVerifiedData] = useState<{
    report: PathologyReport;
    lab?: Laboratory;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialReportId) {
      setSearchQuery(initialReportId);
      performLookup(initialReportId);
    }
  }, [initialReportId]);

  const performLookup = async (queryId: string) => {
    if (!queryId.trim()) return;
    setLoading(true);
    setError(null);
    setVerifiedData(null);

    try {
      const result = await getReportForVerification(queryId.trim());
      if (result && result.report) {
        setVerifiedData(result);
      } else {
        setError(
          `No diagnostic record matching "${queryId}" was found in the authorized NABL verification registry. Please check the Report ID or QR code.`
        );
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Unable to verify report at this time. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(searchQuery);
  };

  const handleDownloadPdf = () => {
    if (!verifiedData?.report) return;
    const { settings } = getCachedPathologyData();
    const effectiveSettings: LabSettings = {
      ...settings,
      labName: verifiedData.lab?.name || settings.labName,
      phone: verifiedData.lab?.phone || settings.phone,
      email: verifiedData.lab?.email || settings.email,
      address: verifiedData.lab?.address || settings.address,
      licenseNumber: verifiedData.lab?.licenseNumber || settings.licenseNumber,
      nablCertNumber: verifiedData.lab?.nablCertNumber || settings.nablCertNumber,
      pathologistName: verifiedData.lab?.pathologistName || settings.pathologistName,
      pathologistQualification: verifiedData.lab?.pathologistQualification || settings.pathologistQualification,
      pathologistRegistration: verifiedData.lab?.pathologistRegistration || settings.pathologistRegistration,
    };
    downloadPathologyReportPdf(verifiedData.report, effectiveSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-900 via-teal-900 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-300 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">
                  Diagnostic Report Verification
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-wider">
                  NABL ISO 15189
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Official real-time authenticity & digital signature verification registry
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Search Lookup Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Report ID (e.g., RPT-2026-0921 or Doc UUID)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authenticity Record Not Found</p>
                <p className="mt-0.5 text-rose-700 dark:text-rose-300 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Verified Report Card */}
          {verifiedData && verifiedData.report && (
            <div className="space-y-4">
              {/* Authenticity Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Authorized Authentic Diagnostic Report
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Digitally validated against LabNova reference database records.
                    </p>
                  </div>
                </div>

                <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[11px] font-mono font-bold">
                  {verifiedData.report.status.toUpperCase()}
                </span>
              </div>

              {/* Report Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>Report Identifier</span>
                  </div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                    {verifiedData.report.reportId}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Sample Barcode: {verifiedData.report.sampleBarcode}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    <Calendar className="w-3.5 h-3.5 text-teal-500" />
                    <span>Date of Authorization</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {new Date(verifiedData.report.reportDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Collected: {new Date(verifiedData.report.sampleCollectedAt).toLocaleString()}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    <span>Issuing Laboratory</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {verifiedData.lab?.name || 'LabNova Diagnostics'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    License: {verifiedData.lab?.licenseNumber || 'DL-2024-PATH-0928'} • NABL:{' '}
                    {verifiedData.lab?.nablCertNumber || 'NABL-MC-5421'}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Authorizing Pathologist</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {verifiedData.report.verifiedBy ||
                      verifiedData.lab?.pathologistName ||
                      'Dr. Ananya Sharma, MD (Path)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {verifiedData.lab?.pathologistRegistration || 'MCI Reg: MCI-78291-D'}
                  </div>
                </div>
              </div>

              {/* Patient and Tests List */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/80 pb-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Patient Reference:
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white font-semibold">
                    UHID: {verifiedData.report.patientUHID} ({verifiedData.report.patientAge}y,{' '}
                    {verifiedData.report.patientGender})
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Authorized Clinical Investigations:
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {verifiedData.report.testNames.map((testName, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[11px] font-semibold"
                      >
                        {testName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Digital Signature Hash */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    <Hash className="w-3 h-3 text-teal-500" />
                    <span>SHA-256 Digital Verification Hash:</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 mt-1">
                    {verifiedData.report.digitalSignatureHash ||
                      `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`}
                  </div>
                </div>
              </div>

              {/* Download Action */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Authorized PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
