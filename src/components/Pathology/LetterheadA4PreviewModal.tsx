import React from 'react';
import {
  X,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  ShieldCheck,
  QrCode,
  FileText,
  Award,
  Calendar,
  Clock,
  User,
  Activity,
  Check,
} from 'lucide-react';
import { LetterheadTemplate, LabSettings } from '../../types';
import { generatePathologyPdf } from '../../services/pdfReportGenerator';
import { getDigitalConfig } from '../../services/prePrintedConfig';

interface LetterheadA4PreviewModalProps {
  template: LetterheadTemplate | null;
  settings: LabSettings;
  isActive: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectAndSave?: (templateId: string) => void;
}

export const LetterheadA4PreviewModal: React.FC<LetterheadA4PreviewModalProps> = ({
  template,
  settings,
  isActive,
  isOpen,
  onClose,
  onSelectAndSave,
}) => {
  if (!isOpen || !template) return null;

  // Sample pathology report data for preview
  const samplePatient = {
    patientName: 'Mrs. Sunita Sharma',
    patientAge: 42,
    patientGender: 'Female',
    patientUHID: 'UHID-2026-89421',
    patientPhone: '+91 98231 45678',
    reportId: 'REP-CBC-8942',
    sampleBarcode: 'LAB-984210',
    sampleType: 'EDTA Whole Blood (2ml Lavender Top)',
    sampleCollectionTime: '02 Sep 2026, 08:30 AM',
    registeredAt: '02 Sep 2026, 09:15 AM',
    verifiedAt: '02 Sep 2026, 11:45 AM',
    referredBy: 'Dr. Rajesh Sharma, MD (Internal Medicine)',
    department: 'Clinical Hematology & Cytology',
    analyzer: 'Beckman Coulter DxH 900 Automated Hematology System',
  };

  const sampleResults = [
    {
      name: 'Hemoglobin (Hb)',
      value: '10.8',
      status: 'low',
      unit: 'g/dL',
      refRange: '12.0 - 15.5',
      method: 'Cyanmethemoglobin Photometry',
    },
    {
      name: 'Total RBC Count',
      value: '3.92',
      status: 'low',
      unit: 'mil/mcL',
      refRange: '4.00 - 5.20',
      method: 'Automated Cytometry',
    },
    {
      name: 'Packed Cell Volume (PCV / Hct)',
      value: '33.4',
      status: 'low',
      unit: '%',
      refRange: '36.0 - 46.0',
      method: 'Calculated Index',
    },
    {
      name: 'Mean Corpuscular Volume (MCV)',
      value: '72.1',
      status: 'low',
      unit: 'fL',
      refRange: '80.0 - 100.0',
      method: 'Calculated Index',
    },
    {
      name: 'Mean Corpuscular Hemoglobin (MCH)',
      value: '23.5',
      status: 'low',
      unit: 'pg',
      refRange: '27.0 - 33.0',
      method: 'Calculated Index',
    },
    {
      name: 'Total Leukocyte Count (TLC / WBC)',
      value: '7,400',
      status: 'normal',
      unit: '/mcL',
      refRange: '4,000 - 11,000',
      method: 'Flow Cytometry Laser',
    },
    {
      name: 'Platelet Count',
      value: '2,45,000',
      status: 'normal',
      unit: '/mcL',
      refRange: '1,50,000 - 4,50,000',
      method: 'Electrical Impedance',
    },
    {
      name: 'Erythrocyte Sedimentation Rate (ESR)',
      value: '32',
      status: 'high',
      unit: 'mm/1st hr',
      refRange: '0 - 20',
      method: 'Westergren Automated Method',
    },
  ];

  const handleDownloadSamplePdf = () => {
    // Generate a sample report object for testing PDF output with this template
    const previewReport: any = {
      id: 'sample-report-preview',
      reportId: samplePatient.reportId,
      patientId: 'p-preview',
      patientName: samplePatient.patientName,
      patientAge: samplePatient.patientAge,
      patientGender: samplePatient.patientGender,
      patientUHID: samplePatient.patientUHID,
      patientPhone: samplePatient.patientPhone,
      sampleBarcode: samplePatient.sampleBarcode,
      testName: 'Complete Blood Count (CBC) with Automated Differential',
      category: 'Hematology',
      sampleType: samplePatient.sampleType,
      sampleCollectionTime: samplePatient.sampleCollectionTime,
      createdAt: samplePatient.registeredAt,
      verifiedAt: samplePatient.verifiedAt,
      referredBy: samplePatient.referredBy,
      status: 'verified',
      price: 350,
      paidAmount: 350,
      paymentStatus: 'paid',
      department: samplePatient.department,
      analyzer: samplePatient.analyzer,
      methodology: 'Automated 5-Part Flow Cytometry + Photometric Analysis',
      clinicalNotes: 'Microcytic hypochromic red cell indices suggestive of mild Iron Deficiency Anemia. Elevated ESR noted.',
      interpretation: 'Serum Ferritin, Iron profile, and Peripheral Blood Smear examination recommended for confirmation.',
      results: sampleResults.map((r, idx) => ({
        id: `res-${idx}`,
        name: r.name,
        value: r.value,
        status: r.status as any,
        unit: r.unit,
        refRangeText: r.refRange,
        method: r.method,
      })),
      digitalSignatureHash: 'a8f4c2e9b1d38706f52e41a9c3b87d21054e8f19',
    };

    const tempSettings = {
      ...settings,
      letterheadTemplateId: template.id,
    };

    generatePathologyPdf(previewReport, tempSettings, getDigitalConfig());
  };

  // Render distinct header based on template archetype
  const renderTemplateHeader = () => {
    switch (template.id) {
      case 'modern_diagnostic':
        return (
          <div className="border-b-2 border-sky-500 pb-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    +
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {settings.labName || 'LAB NOVA PATHOLOGY'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                      DIGITAL LIMS
                    </span>
                  </div>
                  <p className="text-xs text-sky-700 font-semibold mt-0.5">
                    {settings.tagline || 'ACCELERATED CLINICAL & MOLECULAR DIAGNOSTICS'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {settings.address} | Phone: {settings.phone}
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>NABL ISO 15189:2022</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 mt-1">
                  Cert: {settings.nablCertNumber || 'MC-4892'}
                </span>
                <span className="text-[10px] text-slate-400">Lic: {settings.licenseNumber}</span>
              </div>
            </div>
          </div>
        );

      case 'minimal_professional':
        return (
          <div className="border-b-2 border-slate-900 pb-4 space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-serif font-bold text-slate-900 tracking-wide uppercase">
                  {settings.labName || 'LAB NOVA PATHOLOGY'}
                </h2>
                <p className="text-xs font-mono uppercase tracking-widest text-slate-600 mt-0.5">
                  {settings.tagline || 'CLINICAL BIOCHEMISTRY & MOLECULAR PATHOLOGY'}
                </p>
              </div>
              <div className="text-right text-xs space-y-0.5 text-slate-700">
                <div className="font-bold text-slate-900">NABL ACCREDITED LABORATORY</div>
                <div className="font-mono text-[11px]">ISO 15189 / Cert #{settings.nablCertNumber}</div>
                <div className="text-[11px] text-slate-500">License: {settings.licenseNumber}</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-600">
              <span>{settings.address}</span>
              <span>
                Tel: {settings.phone} | {settings.email}
              </span>
            </div>
          </div>
        );

      case 'premium_laboratory':
        return (
          <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-950 text-white p-5 shadow-lg relative overflow-hidden mb-4">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 object-contain bg-white/10 rounded-xl p-1" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-indigo-950 flex items-center justify-center font-extrabold text-2xl shadow-md">
                    ★
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    {settings.labName || 'LAB NOVA EXECUTIVE PATHOLOGY'}
                  </h2>
                  <p className="text-xs font-medium text-amber-300 mt-0.5">
                    {settings.tagline || 'REFERENCE CLINICAL BIOCHEMISTRY & ADVANCED GENOMICS'}
                  </p>
                  <p className="text-[11px] text-indigo-200 mt-1">
                    {settings.address} | 24x7 Diagnostic Support: {settings.phone}
                  </p>
                </div>
              </div>

              <div className="text-right bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-amber-400/40">
                <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center justify-end gap-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>NABL ISO 15189</span>
                </div>
                <div className="text-[11px] font-mono text-indigo-100 mt-0.5">
                  Accreditation: {settings.nablCertNumber || 'MC-4892'}
                </div>
                <div className="text-[10px] text-indigo-300">Govt Lic: {settings.licenseNumber}</div>
              </div>
            </div>
          </div>
        );

      case 'clean_medical':
        return (
          <div className="border-t-4 border-emerald-600 pt-3 border-b border-slate-200 pb-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                    +
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-emerald-900">
                    {settings.labName || 'LAB NOVA PATHOLOGY & DIAGNOSTICS'}
                  </h2>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    {settings.tagline || 'PATIENT-CENTRIC PREVENTATIVE & CLINICAL DIAGNOSTICS'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {settings.address} | Email: {settings.email}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  NABL ACCREDITED
                </span>
                <p className="text-[11px] font-mono text-slate-600 mt-1.5">
                  Cert #{settings.nablCertNumber || 'MC-4892'}
                </p>
                <p className="text-[10px] text-slate-400">Phone: {settings.phone}</p>
              </div>
            </div>
          </div>
        );

      case 'corporate_lab':
        return (
          <div className="border-b-2 border-blue-900 pb-4 space-y-3">
            <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider">LAB NOVA HEALTHCARE NETWORK</span>
                <span className="text-[10px] bg-blue-800 px-2 py-0.5 rounded font-mono">ENTERPRISE LIMS</span>
              </div>
              <span className="text-xs font-mono text-blue-200">ISO 15189:2022 / CAP COMPLIANT</span>
            </div>
            <div className="flex justify-between items-start pt-1">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {settings.labName || 'LAB NOVA CENTRAL REFERENCE LABORATORY'}
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {settings.tagline || 'NATIONAL CENTRALIZED DIAGNOSTIC COMPLEX'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Central Hub: {settings.address} | Toll-Free: {settings.phone}
                </p>
              </div>
              <div className="text-right text-xs text-slate-600 space-y-0.5">
                <div className="font-mono font-bold text-slate-900">Lic #{settings.licenseNumber}</div>
                <div className="font-mono text-[11px]">NABL Cert #{settings.nablCertNumber}</div>
                <div className="font-mono text-[11px] text-slate-400">GST: {settings.taxId || '27AADCL8942E1ZS'}</div>
              </div>
            </div>
          </div>
        );

      case 'modern_medical':
        return (
          <div className="space-y-3 mb-4">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-4 rounded-xl shadow-md flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white text-blue-600 flex items-center justify-center font-black text-xl shadow-xs">
                  +
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight uppercase">
                    {settings.labName || 'LAB NOVA PATHOLOGY'}
                  </h2>
                  <p className="text-[11px] text-blue-100 font-medium">
                    {settings.tagline || 'PRECISION CLINICAL PATHOLOGY & MOLECULAR LAB'}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-white/20 backdrop-blur-xs text-xs font-bold border border-white/30 text-white">
                NABL ISO 15189
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 px-1">
              <span>{settings.address}</span>
              <span>
                Support: {settings.phone} | Lic: {settings.licenseNumber}
              </span>
            </div>
          </div>
        );

      case 'classic_medical':
      default:
        return (
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md space-y-2 mb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 object-contain bg-white rounded-lg p-1" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                    +
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">
                    {settings.labName || 'LAB NOVA PATHOLOGY & DIAGNOSTIC LABORATORY'}
                  </h2>
                  <p className="text-xs text-slate-300 font-medium">
                    {settings.tagline || 'REFERENCE CLINICAL BIOCHEMISTRY, HEMATOLOGY & MOLECULAR DIAGNOSTICS'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {settings.address} | Support: {settings.phone}
                  </p>
                </div>
              </div>

              <div className="text-right bg-slate-800 p-2 rounded-lg border border-slate-700">
                <div className="text-xs font-bold text-emerald-400 uppercase">NABL ACCREDITED</div>
                <div className="text-[10px] text-slate-300">ISO 15189:2022</div>
                <div className="text-[10px] font-mono text-slate-400">Cert: {settings.nablCertNumber || 'MC-4892'}</div>
                <div className="text-[10px] font-mono text-slate-400">Lic: {settings.licenseNumber}</div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
              style={{ backgroundColor: template.primaryColor }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{template.name} Letterhead</h3>
                {isActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Active Default Letterhead</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {template.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{template.styleArchetype}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadSamplePdf}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition"
              title="Download full sample PDF rendered with this template"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Download Sample PDF</span>
            </button>

            {onSelectAndSave && (
              <button
                type="button"
                onClick={() => {
                  onSelectAndSave(template.id);
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isActive ? 'Active Letterhead' : 'Set as Active Letterhead'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: A4 Sheet Simulation */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-200/70 dark:bg-slate-950 flex-1 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-[780px] rounded-xl shadow-2xl p-6 sm:p-8 space-y-4 border border-slate-300 text-xs select-none">
            {/* 1. Header Banner */}
            {renderTemplateHeader()}

            {/* 2. Patient Demographics Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                  <span className="font-bold text-slate-900 text-sm">{samplePatient.patientName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">UHID / Patient ID</span>
                  <span className="font-mono font-bold text-blue-700">{samplePatient.patientUHID}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Age / Gender</span>
                  <span className="font-semibold text-slate-800">
                    {samplePatient.patientAge} Yrs / {samplePatient.patientGender}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Accession #</span>
                  <span className="font-mono font-bold text-slate-800">{samplePatient.reportId}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400">Referred By: </span>
                  <span className="font-medium text-slate-800">{samplePatient.referredBy}</span>
                </div>
                <div>
                  <span className="text-slate-400">Specimen: </span>
                  <span className="font-medium text-slate-800">{samplePatient.sampleType}</span>
                </div>
                <div>
                  <span className="text-slate-400">Collected: </span>
                  <span className="font-medium text-slate-800">{samplePatient.sampleCollectionTime}</span>
                </div>
                <div>
                  <span className="text-slate-400">Reported: </span>
                  <span className="font-medium text-slate-800">{samplePatient.verifiedAt}</span>
                </div>
              </div>
            </div>

            {/* 3. Investigation Panel Header */}
            <div className="pt-2">
              <div className="flex justify-between items-center pb-1">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 uppercase">
                    COMPLETE BLOOD COUNT (CBC) WITH AUTOMATED DIFFERENTIAL
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Department: {samplePatient.department} | Method: Automated 5-Part Cytometry + Photometry
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono font-bold border border-blue-200">
                  Panel Code: CBC-01
                </span>
              </div>

              {/* Table */}
              <table className="w-full text-xs text-left border-collapse mt-2">
                <thead>
                  <tr
                    className="text-white text-[11px] uppercase"
                    style={{ backgroundColor: template.primaryColor }}
                  >
                    <th className="py-2 px-3 rounded-l-lg font-bold">Investigation Parameter</th>
                    <th className="py-2 px-3 text-center font-bold">Result</th>
                    <th className="py-2 px-3 text-center font-bold">Flag</th>
                    <th className="py-2 px-3 text-center font-bold">Unit</th>
                    <th className="py-2 px-3 rounded-r-lg text-right font-bold">Biological Ref. Interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sampleResults.map((row, idx) => (
                    <tr
                      key={row.name}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}
                    >
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-900">{row.name}</span>
                        <div className="text-[9px] text-slate-400">{row.method}</div>
                      </td>
                      <td className="py-2 px-3 text-center font-bold font-mono text-sm">
                        <span
                          className={
                            row.status === 'low'
                              ? 'text-blue-600'
                              : row.status === 'high'
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }
                        >
                          {row.value}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {row.status === 'low' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                            ▼ LOW
                          </span>
                        )}
                        {row.status === 'high' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            ▲ HIGH
                          </span>
                        )}
                        {row.status === 'normal' && (
                          <span className="text-[11px] text-slate-400">Normal</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600 font-medium">{row.unit}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-700">{row.refRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Clinical Notes / Interpretation */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-900 block text-[11px] uppercase">
                Clinical Impression & Pathologist Advice:
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                Mild Microcytic Hypochromic Anemia with elevated ESR. Suggestive of Iron Deficiency vs Anemia of Chronic
                Disease. Advised Serum Ferritin & Iron Profile correlation.
              </p>
            </div>

            {/* 5. Signatures Footer */}
            <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-4 items-end">
              <div>
                <div className="h-9 flex items-end">
                  <span className="font-serif italic text-slate-600 text-sm">Sunil K. Verma</span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <p className="font-bold text-slate-900 text-xs">{settings.technologistName || 'Sunil K. Verma'}</p>
                  <p className="text-[10px] text-slate-500">
                    {settings.technologistQualification || 'Senior Biomedical Analyst & MLT In-Charge'}
                  </p>
                </div>
              </div>

              {/* Digital Verification QR Stamp */}
              <div className="text-center flex flex-col items-center">
                <div className="p-1.5 rounded-lg border border-slate-200 bg-white shadow-xs inline-block">
                  <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center text-white">
                    <QrCode className="w-8 h-8" />
                  </div>
                </div>
                <p className="text-[9px] font-mono text-slate-400 mt-1">SHA-256 Digitally Signed</p>
                <p className="text-[9px] text-emerald-600 font-bold">NABL ISO 15189 Verified</p>
              </div>

              <div className="text-right">
                <div className="h-9 flex items-end justify-end">
                  <span className="font-serif italic text-slate-800 text-sm font-bold">Dr. Manisha Kulkarni</span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <p className="font-bold text-slate-900 text-xs">
                    {settings.pathologistName || 'Dr. Manisha Kulkarni, MD'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {settings.pathologistQualification || 'MD Pathology, Chief Consultant Pathologist'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    {settings.pathologistRegistration || 'Reg # MMC-2014/09/3842'}
                  </p>
                </div>
              </div>
            </div>

            {/* End Disclaimer */}
            <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
              ** End of Diagnostic Examination Report — Valid with Digital Medical Certification **
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
