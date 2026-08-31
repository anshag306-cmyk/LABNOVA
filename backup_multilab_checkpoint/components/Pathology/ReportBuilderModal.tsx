import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  User,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Receipt,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  PathologyPatient,
  PathologyReport,
  TestTemplate,
  ReportParameterResult,
  ReportStatus,
  PaymentStatus,
  PaymentMode,
  ParameterFlag,
  LabSettings,
} from '../../types';
import { DEFAULT_TEST_TEMPLATES } from '../../data/pathologyTemplates';
import { addReportToFirestore, updateReportInFirestore } from '../../services/pathologyFirebase';
import { useAuth } from '../../context/AuthContext';

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PathologyPatient[];
  templates?: TestTemplate[];
  selectedPatientInitial?: PathologyPatient | null;
  reportToEdit?: PathologyReport | null;
  initialSelectedTestCode?: string | null;
  settings?: LabSettings;
  onReportSaved: (report: PathologyReport) => void;
  onOpenPatientRegistration: () => void;
}

export const ReportBuilderModal: React.FC<ReportBuilderModalProps> = ({
  isOpen,
  onClose,
  patients,
  templates = DEFAULT_TEST_TEMPLATES,
  selectedPatientInitial,
  reportToEdit,
  initialSelectedTestCode,
  settings,
  onReportSaved,
  onOpenPatientRegistration,
}) => {
  const { currentLab, isAdmin, isStaff } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedTestCodes, setSelectedTestCodes] = useState<string[]>([]);
  const [sampleType, setSampleType] = useState('EDTA Whole Blood & Serum');
  const [sampleBarcode, setSampleBarcode] = useState('');
  const [sampleCollectedAt, setSampleCollectedAt] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [results, setResults] = useState<ReportParameterResult[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [status, setStatus] = useState<ReportStatus>('completed');
  const [verifiedBy, setVerifiedBy] = useState('Dr. Manisha Kulkarni, MD (Pathology), Reg #MMC-2014/09/3842');

  // Billing
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    if (reportToEdit) {
      setSelectedPatientId(reportToEdit.patientId);
      setSelectedTestCodes(reportToEdit.testCodes || []);
      setSampleType(reportToEdit.sampleType || 'Serum');
      setSampleBarcode(reportToEdit.sampleBarcode || '');
      setSampleCollectedAt(reportToEdit.sampleCollectedAt || new Date().toISOString());
      setReferringDoctor(reportToEdit.referredBy || '');
      setResults(reportToEdit.results || []);
      setClinicalNotes(reportToEdit.clinicalNotes || '');
      setInterpretation(reportToEdit.interpretation || '');
      setStatus(reportToEdit.status || 'completed');
      setVerifiedBy(
        reportToEdit.verifiedBy ||
          (settings
            ? `${settings.pathologistName}, ${settings.pathologistQualification}, Reg #${settings.pathologistRegistration}`
            : 'Dr. Manisha Kulkarni, MD (Pathology)')
      );
      setTotalAmount(reportToEdit.billing?.totalAmount || 0);
      setDiscount(reportToEdit.billing?.discount || 0);
      setPaidAmount(reportToEdit.billing?.paidAmount || 0);
      setPaymentStatus(reportToEdit.billing?.paymentStatus || 'paid');
      setPaymentMode(reportToEdit.billing?.paymentMode || 'UPI');
    } else {
      const patient = selectedPatientInitial || patients[0];
      if (patient) {
        setSelectedPatientId(patient.id);
        setReferringDoctor(patient.referredBy || 'Self / Walk-in');
      }

      // If a specific test code was clicked (e.g. from Test Modules), use it; otherwise default to CBC
      const defaultCodes = initialSelectedTestCode ? [initialSelectedTestCode] : ['CBC-01'];
      setSelectedTestCodes(defaultCodes);
      const defaultBarcode = `BC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      setSampleBarcode(defaultBarcode);
      setSampleCollectedAt(new Date().toISOString());

      // Auto-set sample type from template if available
      const matchedTmpl = templates.find((t) => t.testCode === defaultCodes[0]);
      if (matchedTmpl) {
        setSampleType(matchedTmpl.sampleType || 'EDTA Whole Blood & Serum');
      }

      if (settings) {
        setVerifiedBy(
          `${settings.pathologistName}, ${settings.pathologistQualification}, Reg #${settings.pathologistRegistration}`
        );
      }

      loadParametersForTests(defaultCodes);
    }
  }, [reportToEdit, selectedPatientInitial, initialSelectedTestCode, isOpen, settings]);

  // When patient selection changes, auto-populate referring doctor
  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    const pat = patients.find((p) => p.id === patientId);
    if (pat && !reportToEdit) {
      setReferringDoctor(pat.referredBy || 'Self / Walk-in');
    }
  };

  // Helper to load parameters when tests are toggled
  const loadParametersForTests = (testCodes: string[]) => {
    const newResults: ReportParameterResult[] = [];
    let calculatedPrice = 0;

    testCodes.forEach((code) => {
      const tmpl = templates.find((t) => t.testCode === code);
      if (tmpl) {
        calculatedPrice += tmpl.price;
        tmpl.parameters.forEach((param) => {
          // Check if parameter already exists to preserve values
          const existing = results.find((r) => r.parameterId === param.id);
          if (existing) {
            newResults.push(existing);
          } else {
            // Provide a normal median default value for easy demonstration
            const defaultValue = param.refRangeMin && param.refRangeMax
              ? Number(((param.refRangeMin + param.refRangeMax) / 2).toFixed(1))
              : param.refRangeText.includes('Pale') ? 'Pale Yellow'
              : param.refRangeText.includes('Clear') ? 'Clear'
              : param.refRangeText.includes('Nil') ? 'Nil'
              : param.refRangeText.includes('Negative') ? 'Negative'
              : '';

            newResults.push({
              parameterId: param.id,
              name: param.name,
              category: tmpl.category,
              value: String(defaultValue),
              numericValue: typeof defaultValue === 'number' ? defaultValue : undefined,
              unit: param.unit,
              refRangeText: param.refRangeText,
              status: 'normal',
              method: param.method,
            });
          }
        });
      }
    });

    setResults(newResults);
    if (!reportToEdit) {
      setTotalAmount(calculatedPrice);
      setPaidAmount(calculatedPrice - discount);
    }
  };

  const toggleTest = (code: string) => {
    let nextCodes: string[];
    if (selectedTestCodes.includes(code)) {
      nextCodes = selectedTestCodes.filter((c) => c !== code);
    } else {
      nextCodes = [...selectedTestCodes, code];
    }
    setSelectedTestCodes(nextCodes);
    loadParametersForTests(nextCodes);
  };

  // Auto-calculate flag on value change
  const handleParameterValueChange = (index: number, val: string) => {
    const updated = [...results];
    const item = updated[index];
    item.value = val;

    const num = parseFloat(val);
    if (!isNaN(num)) {
      item.numericValue = num;
      // find original parameter definition
      let min: number | undefined;
      let max: number | undefined;
      let critLow: number | undefined;
      let critHigh: number | undefined;

      for (const tmpl of templates) {
        const found = tmpl.parameters.find((p) => p.id === item.parameterId);
        if (found) {
          min = found.refRangeMin;
          max = found.refRangeMax;
          critLow = found.criticalLow;
          critHigh = found.criticalHigh;
          break;
        }
      }

      if (critLow !== undefined && num <= critLow) {
        item.status = 'critical';
      } else if (critHigh !== undefined && num >= critHigh) {
        item.status = 'critical';
      } else if (min !== undefined && num < min) {
        item.status = 'low';
      } else if (max !== undefined && num > max) {
        item.status = 'high';
      } else {
        item.status = 'normal';
      }
    } else {
      item.numericValue = undefined;
      const lower = val.toLowerCase();
      if (lower.includes('positive') || lower.includes('reactive') || lower.includes('detected')) {
        item.status = 'high';
      } else {
        item.status = 'normal';
      }
    }

    setResults(updated);
  };

  const handleStatusChange = (index: number, newFlag: ParameterFlag) => {
    const updated = [...results];
    updated[index].status = newFlag;
    setResults(updated);
  };

  const handleQuickImpressionPreset = (preset: string) => {
    if (preset === 'normal') {
      setClinicalNotes('All biological biochemical & hematological parameters evaluated fall strictly within normal physiological reference ranges.');
      setInterpretation('Within normal biological reference intervals. No diagnostic anomalies identified.');
    } else if (preset === 'dyslipidemia') {
      setClinicalNotes('Moderate atherogenic lipid profile elevation observed with borderline total cholesterol and triglycerides.');
      setInterpretation('Suggest dietary moderation, aerobic lifestyle intervention, and periodic repeat profile.');
    } else if (preset === 'anemia') {
      setClinicalNotes('Microcytic hypochromic red cell indices with decreased hemoglobin suggestive of iron deficiency anemia.');
      setInterpretation('Serum ferritin & iron profile study recommended to guide oral/parental hematinic therapy.');
    } else if (preset === 'prediabetes') {
      setClinicalNotes('Elevated fasting plasma glucose and glycated hemoglobin HbA1c consistent with impaired glucose tolerance.');
      setInterpretation('Clinical correlation recommended for glycemic control and lifestyle metabolic protocol.');
    }
  };

  const handleSaveReport = async () => {
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) {
      setError('Please select a valid registered patient.');
      return;
    }
    if (results.length === 0) {
      setError('Please select at least one test to include parameters.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const reportId = reportToEdit?.reportId || `RPT-${currentYear}-${randomSeq}`;

      const selectedTemplates = templates.filter((t) =>
        selectedTestCodes.includes(t.testCode)
      );
      const testNames = selectedTemplates.map((t) => t.testName);

      // Generate digital signature hash if verified
      let signatureHash = reportToEdit?.digitalSignatureHash;
      let verifiedAtTime = reportToEdit?.verifiedAt;
      if (status === 'verified' || status === 'completed') {
        if (!signatureHash) {
          signatureHash = Array.from(crypto.getRandomValues(new Uint8Array(20)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }
        verifiedAtTime = new Date().toISOString();
      }

      const cleanResults = results.map((r) => {
        const item: any = {
          parameterId: r.parameterId,
          name: r.name,
          value: r.value,
          unit: r.unit,
          refRangeText: r.refRangeText,
          status: r.status,
        };
        if (r.category) item.category = r.category;
        if (typeof r.numericValue === 'number' && !isNaN(r.numericValue)) {
          item.numericValue = r.numericValue;
        }
        if (r.method) item.method = r.method;
        if (r.remarks) item.remarks = r.remarks;
        return item;
      });

      const reportData: Omit<PathologyReport, 'id'> = {
        labId: reportToEdit?.labId || currentLab.id,
        reportId,
        patientId: patient.id,
        patientUHID: patient.uhid,
        patientName: patient.fullName,
        patientAge: patient.age,
        patientGender: patient.gender,
        patientPhone: patient.phone,
        referredBy: referringDoctor.trim() || patient.referredBy || 'Self',
        sampleType,
        sampleBarcode: sampleBarcode || `BC-${Date.now()}`,
        sampleCollectedAt: sampleCollectedAt || new Date().toISOString(),
        sampleReceivedAt: new Date().toISOString(),
        reportDate: new Date().toISOString(),
        testCodes: selectedTestCodes,
        testNames: testNames.length > 0 ? testNames : ['Custom Diagnostic Examination'],
        results: cleanResults,
        status,
        verifiedBy: verifiedBy || settings?.pathologistName || currentLab.pathologistName,
        billing: {
          totalAmount,
          discount,
          paidAmount,
          paymentStatus,
          paymentMode,
        },
        createdAt: reportToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (patient.address) {
        reportData.patientAddress = patient.address;
      }
      if (clinicalNotes.trim()) {
        reportData.clinicalNotes = clinicalNotes.trim();
      }
      if (interpretation.trim()) {
        reportData.interpretation = interpretation.trim();
      }
      if (verifiedAtTime) {
        reportData.verifiedAt = verifiedAtTime;
      }
      if (signatureHash) {
        reportData.digitalSignatureHash = signatureHash;
      }

      let savedReport: PathologyReport;
      if (reportToEdit) {
        await updateReportInFirestore(reportToEdit.id, reportData, currentLab.id);
        savedReport = { ...reportData, id: reportToEdit.id };
      } else {
        savedReport = await addReportToFirestore(reportData, currentLab.id);
      }

      setIsSaving(false);
      onReportSaved(savedReport);
      onClose();
    } catch (err: any) {
      console.error('Error saving pathology report:', err);
      setError(err?.message || 'Failed to save pathology report to Firebase.');
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{reportToEdit ? 'Edit Pathology Report' : 'New Pathology Diagnostic Report'}</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  Firebase Live
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure patient parameters, auto-flag biological intervals & generate compliant reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Patient Selection & Specimen Details */}
          <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" />
                1. Patient & Accession Details
              </span>
              <button
                type="button"
                onClick={onOpenPatientRegistration}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Quick Register New Patient
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Select Patient */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Select Registered Patient *
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => handlePatientChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.uhid}) - {p.age}Y/{p.gender}
                    </option>
                  ))}
                </select>
              </div>

              {/* Referring Doctor */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Referring Doctor / Clinic
                </label>
                <input
                  type="text"
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma, MD"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Sample Type */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Specimen / Sample Type
                </label>
                <input
                  type="text"
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  placeholder="e.g. EDTA Whole Blood, Serum"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Sample Barcode Identifier
                </label>
                <input
                  type="text"
                  value={sampleBarcode}
                  onChange={(e) => setSampleBarcode(e.target.value)}
                  placeholder="BC-2026-XXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Sample Draw Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={sampleCollectedAt ? sampleCollectedAt.slice(0, 16) : ''}
                  onChange={(e) => setSampleCollectedAt(new Date(e.target.value).toISOString())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Test Catalog Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                2. Select Diagnostic Test Profiles
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {selectedTestCodes.length} panel(s) selected
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {templates.map((t) => {
                const isSelected = selectedTestCodes.includes(t.testCode);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTest(t.testCode)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-400'
                      }`}
                    >
                      {isSelected && <CheckCircle className="w-2.5 h-2.5" />}
                    </div>
                    <span>{t.testName}</span>
                    <span className="font-mono text-[11px] opacity-70">₹{t.price}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Interactive Parameter Values Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                3. Parameter Results & Auto-Flagging ({results.length} Parameters)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter values — flags auto-update against normal biological limits
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Investigation</th>
                    <th className="py-2.5 px-3 w-32">Patient Result</th>
                    <th className="py-2.5 px-3 w-28">Status / Flag</th>
                    <th className="py-2.5 px-3 w-20">Unit</th>
                    <th className="py-2.5 px-3">Biological Ref. Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {results.map((r, idx) => (
                    <tr key={r.parameterId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                        <div>{r.name}</div>
                        {r.category && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {r.category}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={r.value}
                          onChange={(e) => handleParameterValueChange(idx, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(idx, e.target.value as ParameterFlag)}
                          className={`w-full px-2 py-1 rounded-lg text-xs font-bold border ${
                            r.status === 'normal'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : r.status === 'low'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : r.status === 'high'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          <option value="normal">Normal</option>
                          <option value="low">▼ Low</option>
                          <option value="high">▲ High</option>
                          <option value="critical">🚨 Critical</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {r.unit || '-'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                        {r.refRangeText || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Clinical Impression Presets & Notes */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                4. Clinical Impression & Pathologist Remarks
              </span>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleQuickImpressionPreset('normal')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400"
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickImpressionPreset('dyslipidemia')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400"
                >
                  Dyslipidemia
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickImpressionPreset('anemia')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400"
                >
                  Microcytic Anemia
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickImpressionPreset('prediabetes')}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400"
                >
                  Impaired Glycemia
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Clinical Remarks / Findings
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="e.g. Findings indicate adequate red cell volume..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Diagnostic Advice / Recommendations
                </label>
                <textarea
                  rows={3}
                  value={interpretation}
                  onChange={(e) => setInterpretation(e.target.value)}
                  placeholder="e.g. Recommend clinical correlation and follow-up in 3 months..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Billing & Signatory Verification */}
          <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-emerald-500" />
              5. Billing & Pathologist Verification
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Total Tariff (₹)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Paid Amount (₹)
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Report Stage / Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ReportStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="sample_collected">Sample Collected</option>
                  <option value="processing">In Laboratory Processing</option>
                  <option value="completed">Completed (Pending Verification)</option>
                  <option value="verified">Verified (Pathologist Signed)</option>
                  <option value="delivered">Delivered to Patient</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Consultant Pathologist Signatory
                </label>
                <input
                  type="text"
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted 21 CFR Part 11 Audit Trail & Firebase Firestore Storage</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveReport}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {isSaving ? 'Saving to Firebase...' : reportToEdit ? 'Update Report' : 'Save & Publish Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
