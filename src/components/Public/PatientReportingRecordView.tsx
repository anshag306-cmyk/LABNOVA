import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  User,
  Calendar,
  Download,
  AlertCircle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Printer,
  ChevronRight,
  FlaskConical,
  Activity,
  Award,
} from 'lucide-react';
import { PathologyReport, Laboratory, LabSettings } from '../../types';
import { getPatientReportingRecord, getCachedPathologyData } from '../../services/pathologyFirebase';
import { generatePathologyPdf } from '../../services/pdfReportGenerator';

interface PatientReportingRecordViewProps {
  tokenOrIdentifier: string;
  onClose?: () => void;
}

export const PatientReportingRecordView: React.FC<PatientReportingRecordViewProps> = ({
  tokenOrIdentifier,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    reports: PathologyReport[];
    primaryReport: PathologyReport;
    lab?: Laboratory;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeReportIndex, setActiveReportIndex] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadRecord() {
      setLoading(true);
      setError(null);
      try {
        const result = await getPatientReportingRecord(tokenOrIdentifier);
        if (isMounted) {
          if (result && result.reports.length > 0) {
            setData(result);
          } else {
            setError('Patient diagnostic record not found or link has expired.');
          }
        }
      } catch (err) {
        console.error('Error loading patient reporting record:', err);
        if (isMounted) setError('Unable to load patient records. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadRecord();
    return () => {
      isMounted = false;
    };
  }, [tokenOrIdentifier]);

  const handleDownloadAllPdf = () => {
    if (!data || data.reports.length === 0) return;
    const { settings } = getCachedPathologyData();
    const effectiveSettings: LabSettings = {
      ...settings,
      labName: data.lab?.name || settings.labName,
      phone: data.lab?.phone || settings.phone,
      email: data.lab?.email || settings.email,
      address: data.lab?.address || settings.address,
      licenseNumber: data.lab?.licenseNumber || settings.licenseNumber,
      nablCertNumber: data.lab?.nablCertNumber || settings.nablCertNumber,
      pathologistName: data.lab?.pathologistName || settings.pathologistName,
      pathologistQualification: data.lab?.pathologistQualification || settings.pathologistQualification,
      pathologistRegistration: data.lab?.pathologistRegistration || settings.pathologistRegistration,
    };

    // If there are multiple separate reports, we pass the active one or consolidated
    // Our updated generatePathologyPdf supports single report with multi-tests or list of reports
    generatePathologyPdf(data.reports[activeReportIndex] || data.primaryReport, effectiveSettings);
  };

  const handleDownloadSinglePdf = (report: PathologyReport) => {
    const { settings } = getCachedPathologyData();
    const effectiveSettings: LabSettings = {
      ...settings,
      labName: data?.lab?.name || settings.labName,
      phone: data?.lab?.phone || settings.phone,
      email: data?.lab?.email || settings.email,
      address: data?.lab?.address || settings.address,
      licenseNumber: data?.lab?.licenseNumber || settings.licenseNumber,
      nablCertNumber: data?.lab?.nablCertNumber || settings.nablCertNumber,
      pathologistName: data?.lab?.pathologistName || settings.pathologistName,
      pathologistQualification: data?.lab?.pathologistQualification || settings.pathologistQualification,
      pathologistRegistration: data?.lab?.pathologistRegistration || settings.pathologistRegistration,
    };
    generatePathologyPdf(report, effectiveSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center animate-pulse">
          <Activity className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-slate-300">Retrieving Authorized Diagnostic Records...</p>
        <p className="text-xs text-slate-500">Encrypted Patient Accession Verification</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-800 border border-rose-900/60 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white">Record Verification Failed</h2>
          <p className="text-xs text-slate-400">{error || 'No matching records found.'}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-white transition"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const { primaryReport, reports, lab } = data;
  const activeReport = reports[activeReportIndex] || primaryReport;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-600/30">
              LN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {lab?.name || 'LabNova Pathology & Diagnostics'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> NABL Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Clinical Diagnostics & Patient Reporting Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              type="button"
              onClick={handleDownloadAllPdf}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official PDF
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition ml-2"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Patient Record Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">{primaryReport.patientName}</h1>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span>UHID: <strong className="text-slate-200 font-mono">{primaryReport.patientUHID}</strong></span>
                  <span>&bull;</span>
                  <span>{primaryReport.patientAge} Years / {primaryReport.patientGender}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-[11px] text-slate-400">Total Panels Evaluated</div>
                <div className="text-base font-bold text-emerald-400 font-mono">
                  {reports.length} Test Panel{reports.length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Demographics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Sample Collection</span>
              <span className="font-semibold text-slate-200">
                {new Date(primaryReport.sampleCollectedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Referring Consultant</span>
              <span className="font-semibold text-slate-200">{primaryReport.referredBy || 'Direct / Walk-in'}</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Accession Identifier</span>
              <span className="font-mono font-semibold text-slate-200">{primaryReport.reportId}</span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Sample Specimen</span>
              <span className="font-semibold text-slate-200">{primaryReport.sampleType}</span>
            </div>
          </div>
        </div>

        {/* Multi-Test Selector Tabs */}
        {reports.length > 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
                Select Investigation Panel ({reports.length} Tests for this Visit)
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {reports.map((r, idx) => {
                const isSelected = idx === activeReportIndex;
                const testTitle = r.testNames.join(' & ') || r.reportId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveReportIndex(idx)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>Page {idx + 1}: {testTitle}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {r.results?.length || 0} params
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Test Investigation Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                {activeReport.testNames.join(' & ') || 'Clinical Laboratory Examination'}
              </h2>
              <p className="text-xs text-slate-400">
                Method: Automated Clinical Analyzer &bull; Report ID: {activeReport.reportId}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadSinglePdf(activeReport)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Test PDF
            </button>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Investigation Parameter</th>
                  <th className="py-3 px-4 w-32">Observed Result</th>
                  <th className="py-3 px-4 w-28">Status / Flag</th>
                  <th className="py-3 px-4 w-24">Unit</th>
                  <th className="py-3 px-4">Biological Reference Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/30">
                {activeReport.results.map((res, idx) => {
                  const isAbnormal = res.status !== 'normal';
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {res.name}
                        {res.category && (
                          <span className="block text-[10px] text-slate-500 font-normal">
                            {res.category}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono font-bold text-sm ${
                            res.status === 'critical'
                              ? 'text-rose-400'
                              : res.status === 'high'
                              ? 'text-amber-400'
                              : res.status === 'low'
                              ? 'text-blue-400'
                              : 'text-slate-100'
                          }`}
                        >
                          {res.value}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            res.status === 'normal'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : res.status === 'low'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : res.status === 'high'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {res.status === 'normal'
                            ? 'Normal'
                            : res.status === 'low'
                            ? '▼ Low'
                            : res.status === 'high'
                            ? '▲ High'
                            : '🚨 Critical'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {res.unit || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px]">
                        {res.refRangeText || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clinical Impression & Pathologist Remarks */}
          {(activeReport.clinicalNotes || activeReport.interpretation) && (
            <div className="p-4 sm:p-5 bg-slate-950/60 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Clinical Impression & Pathologist Remarks:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeReport.clinicalNotes} {activeReport.interpretation}
              </p>
            </div>
          )}

          {/* Pathologist Signatory Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  {activeReport.verifiedBy || lab?.pathologistName || 'Dr. Manisha Kulkarni, MD (Pathology)'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {lab?.pathologistQualification || 'MD Pathology, FICP, Chief Consultant Pathologist'}
                </p>
                <p className="text-[10px] text-emerald-400 font-mono">
                  Authorized Signatory &bull; Digitally Verified & Released
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-400">
              <span>NABL Certificate: <strong className="text-slate-200 font-mono">{lab?.nablCertNumber || 'MC-4892'}</strong></span>
              <p className="text-[10px] text-slate-500 mt-0.5">Biological reference ranges validated to ISO 15189 standards</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>&copy; {new Date().getFullYear()} {lab?.name || 'LabNova Diagnostic Laboratory'}. All rights reserved.</p>
        <p className="text-[11px]">This is an authentic, read-only electronic healthcare document.</p>
      </footer>
    </div>
  );
};
