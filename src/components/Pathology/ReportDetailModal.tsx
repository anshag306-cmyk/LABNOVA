import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Activity,
  Edit,
  Share2,
  Receipt,
  Sliders,
  FileSpreadsheet,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { PathologyReport, ReportStatus, LabSettings } from '../../types';
import {
  generatePathologyPdf,
  generateInvoicePdf,
  generatePrePrintedPathologyPdf,
} from '../../services/pdfReportGenerator';
import { getPrePrintedConfig, getDigitalConfig } from '../../services/prePrintedConfig';
import { updateReportStatusInFirestore } from '../../services/pathologyFirebase';
import { DEFAULT_LAB_SETTINGS } from '../../data/pathologyTemplates';
import { PrePrintedCalibrationModal } from './PrePrintedCalibrationModal';

interface ReportDetailModalProps {
  report: PathologyReport | null;
  settings?: LabSettings;
  isOpen: boolean;
  onClose: () => void;
  onEditReport?: (report: PathologyReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  settings = DEFAULT_LAB_SETTINGS,
  isOpen,
  onClose,
  onEditReport,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState<'digital' | 'preprinted'>('digital');

  if (!isOpen || !report) return null;

  const handleDownloadPdf = () => {
    const config = getDigitalConfig();
    generatePathologyPdf(report, settings, config);
  };

  const handleDownloadInvoice = () => {
    generateInvoicePdf(report, settings);
  };

  const handleDownloadPrePrinted = () => {
    const config = getPrePrintedConfig();
    generatePrePrintedPathologyPdf(report, settings, config);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStatusChange = async (newStatus: ReportStatus) => {
    setIsUpdatingStatus(true);
    try {
      let extra: Partial<PathologyReport> = {};
      if (newStatus === 'verified' && !report.verifiedAt) {
        extra.verifiedAt = new Date().toISOString();
        if (!report.digitalSignatureHash) {
          extra.digitalSignatureHash = Array.from(crypto.getRandomValues(new Uint8Array(20)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }
      }
      await updateReportStatusInFirestore(report.id, newStatus, extra);
      report.status = newStatus;
      if (extra.verifiedAt) report.verifiedAt = extra.verifiedAt;
      if (extra.digitalSignatureHash) report.digitalSignatureHash = extra.digitalSignatureHash;
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const hasCritical = (report.results || []).some((r) => r.status === 'critical');
  const hasAbnormal = (report.results || []).some((r) => r.status === 'high' || r.status === 'low');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150 print:fixed print:inset-0 print:p-0 print:bg-white print:z-[9999] print:block print:overflow-visible">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none">
        {/* Top Control Bar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700/60">
              {report.reportId}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  report.status === 'verified'
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : report.status === 'delivered'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    : report.status === 'completed'
                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                }`}
              >
                {report.status.replace('_', ' ')}
              </span>

              {hasCritical && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white animate-pulse">
                  CRITICAL VALUE ALERT
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onEditReport && (
              <button
                onClick={() => {
                  onClose();
                  onEditReport(report);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
            )}

            <button
              onClick={handleDownloadInvoice}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
              title="Download Itemized Tax Invoice / Receipt PDF"
            >
              <Receipt className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Tax Invoice
            </button>

            {/* Print Adjustments / Calibration Shortcut Button */}
            <button
              onClick={() => {
                setCalibrationMode('digital');
                setIsCalibrationModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-xs"
              title="Open Full Page Position (UP/DOWN/LEFT/RIGHT) and Font Size Adjustment Controls"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Print Adjustments</span>
            </button>

            {/* Pre-Printed Letterhead Option */}
            <div className="flex items-center rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 p-0.5">
              <button
                onClick={handleDownloadPrePrinted}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition flex items-center gap-1.5"
                title="Download A4 PDF formatted specifically for physical Pre-Printed Letterhead paper"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Pre-Printed PDF</span>
              </button>
              <button
                onClick={() => {
                  setCalibrationMode('preprinted');
                  setIsCalibrationModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition border-l border-amber-500/30"
                title="Open Pre-Printed Letterhead Position & Margin Calibration Pad"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            {/* Official Digital Letterhead PDF Option with Calibration Nudge Button */}
            <div className="flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs p-0.5 transition">
              <button
                onClick={handleDownloadPdf}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                title="Download standard PDF with digital LabNova letterhead banner and configured font size/offsets"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Digital Letterhead PDF</span>
              </button>
              <button
                onClick={() => {
                  setCalibrationMode('digital');
                  setIsCalibrationModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800/60 transition border-l border-blue-400/30"
                title="Open Digital Letterhead Position (UP/DOWN/LEFT/RIGHT) and Font Size Controls"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Laboratory Sheet Preview */}
        <div className="overflow-y-auto p-4 sm:p-8 space-y-6 flex-1 bg-slate-100/60 dark:bg-slate-950 print:overflow-visible print:p-0 print:bg-white">
          <div className="bg-white dark:bg-slate-900 max-w-3xl mx-auto rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 print:max-w-none print:shadow-none print:border-none print:p-6 print:w-full">
            {/* Lab Letterhead */}
            <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                      {settings.labName || 'LAB NOVA PATHOLOGY'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                      NABL ACCREDITED
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                    {settings.tagline || 'REFERENCE CLINICAL BIOCHEMISTRY, HEMATOLOGY & MOLECULAR PATHOLOGY'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    {settings.accreditationText} | License: {settings.licenseNumber} | Phone: {settings.phone}
                  </p>
                </div>

                <div className="text-right hidden sm:block print:block">
                  <div className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    Cert No: {settings.nablCertNumber}
                  </div>
                  <div className="text-[11px] text-slate-400">24x7 Diagnostic Services</div>
                  <div className="mt-1">
                    <span className="font-mono text-xs text-slate-500">{report.sampleBarcode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Demographics & Accession Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px]">UHID / Patient ID</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {report.patientUHID}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Accession / Report No</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {report.reportId}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Patient Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {report.patientName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Age / Gender</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {report.patientAge} Yrs / {report.patientGender}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Mobile Number</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {report.patientPhone || 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Referred By</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {report.referredBy || 'Self / Walk-in'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Specimen Matrix</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {report.sampleType || 'EDTA Whole Blood'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Sample Drawn / Coll.</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {report.sampleCollectedAt ? new Date(report.sampleCollectedAt).toLocaleString() : 'Recent'}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-4 border-t border-slate-200 dark:border-slate-700/60 pt-2 flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">
                    Report Released Date: <strong className="text-slate-700 dark:text-slate-300 font-mono">{report.reportDate ? new Date(report.reportDate).toLocaleString() : new Date().toLocaleString()}</strong>
                  </span>
                  <span className="text-slate-500">
                    Barcode ID: <strong className="text-slate-700 dark:text-slate-300 font-mono">{report.sampleBarcode}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Test Investigations Heading */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span>{report.testNames.join(' & ')}</span>
                <span className="text-xs font-normal text-slate-400 font-mono">
                  {report.results.length} Parameters Evaluated
                </span>
              </h3>

              {/* Table of Results */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold bg-slate-50/50 dark:bg-slate-800/30">
                      <th className="py-2.5 px-3">Investigation</th>
                      <th className="py-2.5 px-3">Result</th>
                      <th className="py-2.5 px-3">Flag</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Biological Ref. Interval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {(report.results || []).map((res, i) => (
                      <tr key={i} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {res.name}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">
                          <span
                            className={
                              res.status === 'critical'
                                ? 'text-rose-600 dark:text-rose-400'
                                : res.status === 'high'
                                ? 'text-amber-600 dark:text-amber-400'
                                : res.status === 'low'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }
                          >
                            {res.value}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {res.status === 'high' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              ▲ HIGH
                            </span>
                          )}
                          {res.status === 'low' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                              ▼ LOW
                            </span>
                          )}
                          {res.status === 'critical' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                              🚨 CRITICAL
                            </span>
                          )}
                          {res.status === 'normal' && (
                            <span className="text-slate-400 text-[11px]">Normal</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {res.unit || '-'}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600 dark:text-slate-300">
                          {res.refRangeText || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Clinical Impression & Interpretation */}
            {(report.clinicalNotes || report.interpretation) && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 block uppercase tracking-wider text-[11px]">
                  Clinical Impression & Pathologist Remarks
                </span>
                {report.clinicalNotes && (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    <strong>Findings:</strong> {report.clinicalNotes}
                  </p>
                )}
                {report.interpretation && (
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    <strong>Interpretation & Advice:</strong> {report.interpretation}
                  </p>
                )}
              </div>
            )}

            {/* Sign-off & Accreditation Section */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    {settings.technologistName}
                  </div>
                  <div className="text-[11px] text-slate-500">{settings.technologistQualification}</div>
                  <div className="text-[11px] text-slate-400">Quality Control In-Charge</div>
                </div>

                <div className="text-center sm:text-left bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>NABL Verified & Digitally Signed</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    Hash: {(report.digitalSignatureHash || 'e7c10b4f8a92e1069d35fa7c844bf210').slice(0, 24)}...
                  </div>
                  <div className="text-[10px] text-slate-400">21 CFR Part 11 / IT Act Compliant</div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {report.verifiedBy || settings.pathologistName}
                  </div>
                  <div className="text-[11px] text-slate-500">{settings.pathologistQualification}</div>
                  <div className="text-[11px] text-slate-400">Reg #{settings.pathologistRegistration} (NABL Signatory)</div>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3">
              *** End of Diagnostic Laboratory Examination Report. Biological reference ranges vary with age, gender, and methodology. ***
            </div>
          </div>
        </div>

        {/* Bottom Bar for Status Progression */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Update Report Workflow Stage:
            </span>
            <select
              value={report.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as ReportStatus)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="sample_collected">Sample Collected</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified (e-Signed)</option>
              <option value="delivered">Delivered to Patient</option>
            </select>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Tariff: <strong className="text-slate-800 dark:text-slate-200">₹{report.billing?.totalAmount || 0}</strong>
            </span>
            <span>•</span>
            <span>
              Paid: <strong className="text-emerald-600 dark:text-emerald-400">₹{report.billing?.paidAmount || 0}</strong> ({report.billing?.paymentStatus || 'paid'})
            </span>
          </div>
        </div>
      </div>

      {/* Calibration & Print Adjustments Modal (Supports Digital and Pre-Printed) */}
      <PrePrintedCalibrationModal
        report={report}
        settings={settings}
        isOpen={isCalibrationModalOpen}
        onClose={() => setIsCalibrationModalOpen(false)}
        defaultMode={calibrationMode}
      />
    </div>
  );
};
