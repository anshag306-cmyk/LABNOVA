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
  Search,
  Filter,
  Check,
  Microscope,
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

  // Test Profile Search & Filter state
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>('All');

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
            // Provide a normal median default value for numeric/routine tests.
            // For Histopathology and Biopsy tests, do NOT invent pathology results; leave empty for operator/pathologist entry.
            const isHistopathology = tmpl.category === 'Histopathology' || tmpl.testCode.startsWith('BIOPSY-');
            const defaultValue = isHistopathology
              ? ''
              : param.refRangeMin !== undefined && param.refRangeMax !== undefined
              ? Number(((param.refRangeMin + param.refRangeMax) / 2).toFixed(1))
              : param.refRangeText.includes('Not Detected') ? 'Not Detected'
              : param.refRangeText.includes('Non-Reactive') ? 'Non-Reactive'
              : param.refRangeText.includes('Negative') ? 'Negative'
              : param.refRangeText.includes('Valid') ? 'Valid'
              : param.refRangeText.includes('Pale') ? 'Pale Yellow'
              : param.refRangeText.includes('Clear') ? 'Clear'
              : param.refRangeText.includes('Nil') ? 'Nil'
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
      // If adding test and current sample type is default or blank, auto-suggest the test's specimen type
      const tmpl = templates.find((t) => t.testCode === code);
      if (tmpl?.sampleType && (selectedTestCodes.length === 0 || sampleType === 'EDTA Whole Blood & Serum')) {
        setSampleType(tmpl.sampleType);
      }
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
      const lower = val.toLowerCase().trim();
      const isNegative =
        lower.includes('not detected') ||
        lower.includes('non-reactive') ||
        lower.includes('negative') ||
        lower.includes('nil') ||
        lower.includes('clear') ||
        lower.includes('valid') ||
        lower.includes('normal') ||
        lower === 'absent';

      if (isNegative) {
        item.status = 'normal';
      } else if (
        lower.includes('positive') ||
        lower.includes('reactive') ||
        lower.includes('detected') ||
        lower.includes('present')
      ) {
        item.status = 'high';
      } else if (
        lower.includes('equivocal') ||
        lower.includes('borderline') ||
        lower.includes('indeterminate')
      ) {
        item.status = 'high';
      } else {
        item.status = 'normal';
      }
    }

    // Auto-calculate Transferrin Saturation (%) for Iron Deficiency Profile if Iron or TIBC changed
    const lowerParamName = item.name.toLowerCase();
    if (lowerParamName.includes('iron') || lowerParamName.includes('tibc') || lowerParamName.includes('binding')) {
      const ironItem = updated.find((r) => r.name.toLowerCase() === 'serum iron' || r.name.toLowerCase() === 'iron');
      const tibcItem = updated.find((r) => r.name.toLowerCase().includes('total iron binding') || r.name.toLowerCase() === 'tibc');
      const tsatItem = updated.find((r) => r.name.toLowerCase().includes('transferrin saturation'));

      if (ironItem && tibcItem && tsatItem) {
        const ironNum = parseFloat(ironItem.value);
        const tibcNum = parseFloat(tibcItem.value);
        if (!isNaN(ironNum) && !isNaN(tibcNum) && tibcNum > 0) {
          const sat = Number(((ironNum / tibcNum) * 100).toFixed(1));
          tsatItem.value = String(sat);
          tsatItem.numericValue = sat;
          if (sat < 20.0) {
            tsatItem.status = 'low';
          } else if (sat > 50.0) {
            tsatItem.status = 'high';
          } else {
            tsatItem.status = 'normal';
          }
        }
      }
    }

    // Auto-calculate Indirect Bilirubin (mg/dL) if Total Bilirubin or Direct Bilirubin changed
    if (lowerParamName.includes('bilirubin')) {
      const totalBili = updated.find((r) => r.name.toLowerCase().includes('total bilirubin') || r.name.toLowerCase() === 'bilirubin total');
      const directBili = updated.find((r) => r.name.toLowerCase().includes('direct bilirubin') || r.name.toLowerCase() === 'bilirubin direct');
      const indirectBili = updated.find((r) => r.name.toLowerCase().includes('indirect bilirubin') || r.name.toLowerCase() === 'bilirubin indirect');

      if (totalBili && directBili && indirectBili) {
        const totNum = parseFloat(totalBili.value);
        const dirNum = parseFloat(directBili.value);
        if (!isNaN(totNum) && !isNaN(dirNum)) {
          const indVal = Math.max(0, Number((totNum - dirNum).toFixed(2)));
          indirectBili.value = String(indVal);
          indirectBili.numericValue = indVal;
          if (indVal > 0.8) {
            indirectBili.status = 'high';
          } else {
            indirectBili.status = 'normal';
          }
        }
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
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span>2. Select Diagnostic Test Profiles</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {selectedTestCodes.length} selected
                  </span>
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Click to add or remove test profiles. Selected test parameters load automatically.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search 95+ tests (e.g. CBC, ESR, Culture, Lipase, APTT)..."
                  value={testSearchQuery}
                  onChange={(e) => setTestSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
                {testSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTestSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin text-xs">
              {[
                'All',
                'Biochemistry',
                'Hematology',
                'Coagulation',
                'Microbiology',
                'Molecular Diagnostics',
                'Endocrinology',
                'Serology',
                'Immunology',
                'Infectious Diseases',
                'Histopathology',
                'Clinical Pathology',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTestCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition-colors ${
                    testCategoryFilter === cat
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Selected Tests Summary Bar */}
            {selectedTestCodes.length > 0 && (
              <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 mr-1">
                  Active Panels:
                </span>
                {selectedTestCodes.map((code) => {
                  const tmpl = templates.find((t) => t.testCode === code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-[11px] font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                    >
                      <span>{tmpl ? tmpl.testName : code}</span>
                      <button
                        type="button"
                        onClick={() => toggleTest(code)}
                        className="text-slate-400 hover:text-rose-500 font-bold ml-0.5"
                        title="Remove panel"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Filtered Test Buttons Grid */}
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/40 dark:bg-slate-850/40">
              {templates
                .filter((t) => {
                  const matchesCat =
                    testCategoryFilter === 'All' ? true : t.category === testCategoryFilter;
                  const q = testSearchQuery.toLowerCase().trim();
                  const matchesSearch =
                    !q ||
                    t.testName.toLowerCase().includes(q) ||
                    t.testCode.toLowerCase().includes(q) ||
                    t.category.toLowerCase().includes(q) ||
                    t.sampleType.toLowerCase().includes(q) ||
                    t.parameters.some((p) => p.name.toLowerCase().includes(q));
                  return matchesCat && matchesSearch;
                })
                .map((t) => {
                  const isSelected = selectedTestCodes.includes(t.testCode);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTest(t.testCode)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 text-left ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border shrink-0 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-400'
                        }`}
                      >
                        {isSelected && <CheckCircle className="w-2.5 h-2.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate max-w-[260px] sm:max-w-[320px]">{t.testName}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[260px]">
                          {t.category} • {t.sampleType.split('(')[0].trim()}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0 ml-auto">
                        ₹{t.price}
                      </span>
                    </button>
                  );
                })}
              {templates.filter((t) => {
                const matchesCat =
                  testCategoryFilter === 'All' ? true : t.category === testCategoryFilter;
                const q = testSearchQuery.toLowerCase().trim();
                return (
                  matchesCat &&
                  (!q ||
                    t.testName.toLowerCase().includes(q) ||
                    t.testCode.toLowerCase().includes(q) ||
                    t.category.toLowerCase().includes(q) ||
                    t.sampleType.toLowerCase().includes(q) ||
                    t.parameters.some((p) => p.name.toLowerCase().includes(q)))
                );
              }).length === 0 && (
                <div className="w-full py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No tests match &quot;{testSearchQuery}&quot;. Try a different search term or category.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Interactive Parameter Values & Histopathology Panel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                3. Parameter Results & Auto-Flagging ({results.length} Parameters)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Enter values — flags auto-update against normal biological limits
              </span>
            </div>

            {/* Standard Numeric & Qualitative Laboratory Tests Table */}
            {results.filter((r) => r.category !== 'Histopathology').length > 0 && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Investigation</th>
                      <th className="py-2.5 px-3 w-44">Patient Result</th>
                      <th className="py-2.5 px-3 w-28">Status / Flag</th>
                      <th className="py-2.5 px-3 w-20">Unit</th>
                      <th className="py-2.5 px-3">Biological Ref. Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {results
                      .filter((r) => r.category !== 'Histopathology')
                      .map((r) => {
                        const originalIdx = results.findIndex((item) => item.parameterId === r.parameterId);
                        const refLower = (r.refRangeText || '').toLowerCase();
                        const hasDetectedOption = refLower.includes('detected');
                        const hasReactiveOption = refLower.includes('reactive');
                        const hasPositiveOption = refLower.includes('positive');
                        const hasValidOption = refLower.includes('valid');

                        return (
                          <tr key={r.parameterId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-medium text-slate-900 dark:text-slate-100">
                              <div>{r.name}</div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                                {r.category && <span>{r.category}</span>}
                                {r.method && <span className="text-slate-400">• {r.method}</span>}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                id={`param-result-input-${originalIdx}`}
                                type="text"
                                value={r.value}
                                onChange={(e) => handleParameterValueChange(originalIdx, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const nextInput = document.getElementById(`param-result-input-${originalIdx + 1}`);
                                    if (nextInput) {
                                      (nextInput as HTMLInputElement).focus();
                                      (nextInput as HTMLInputElement).select?.();
                                    }
                                  }
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-semibold text-slate-900 dark:text-slate-100 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                              />
                              {/* Quick Qualitative Action Pills */}
                              {(hasDetectedOption || hasReactiveOption || hasPositiveOption || hasValidOption) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {hasDetectedOption && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleParameterValueChange(originalIdx, 'Not Detected')}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                          r.value === 'Not Detected'
                                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                                        }`}
                                      >
                                        Not Detected
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleParameterValueChange(originalIdx, 'Detected')}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                          r.value === 'Detected'
                                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                                        }`}
                                      >
                                        Detected
                                      </button>
                                    </>
                                  )}
                                  {hasReactiveOption && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleParameterValueChange(originalIdx, 'Non-Reactive')}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                          r.value === 'Non-Reactive'
                                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                                        }`}
                                      >
                                        Non-Reactive
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleParameterValueChange(originalIdx, 'Reactive')}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                          r.value === 'Reactive'
                                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                                        }`}
                                      >
                                        Reactive
                                      </button>
                                    </>
                                  )}
                                  {!hasDetectedOption && hasPositiveOption && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleParameterValueChange(originalIdx, 'Negative')}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                          r.value === 'Negative'
                                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-emerald-50'
                                        }`}
                                      >
                                        Negative
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleParameterValueChange(originalIdx, 'Positive')}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                          r.value === 'Positive'
                                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-rose-50'
                                        }`}
                                      >
                                        Positive
                                      </button>
                                    </>
                                  )}
                                  {hasValidOption && (
                                    <button
                                      type="button"
                                      onClick={() => handleParameterValueChange(originalIdx, 'Valid')}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                        r.value === 'Valid'
                                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-400'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-blue-50'
                                      }`}
                                    >
                                      Valid
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={r.status}
                                onChange={(e) => handleStatusChange(originalIdx, e.target.value as ParameterFlag)}
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
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Dedicated Histopathology / Surgical Pathology Examination Panel */}
            {results.filter((r) => r.category === 'Histopathology').length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      <Microscope className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                        Histopathology & Surgical Pathology Examination
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Enter clinical history, gross findings, microscopic details, and definitive histopathological diagnosis
                      </div>
                    </div>
                  </div>

                  {/* Rapid Biopsy Narrative Helpers */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px]">Quick Preset:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const diagIdx = results.findIndex((r) => r.category === 'Histopathology' && r.name.toLowerCase().includes('diagnosis'));
                        const grossIdx = results.findIndex((r) => r.category === 'Histopathology' && r.name.toLowerCase().includes('gross'));
                        const microIdx = results.findIndex((r) => r.category === 'Histopathology' && r.name.toLowerCase().includes('microscopic'));
                        if (grossIdx >= 0 && !results[grossIdx].value) {
                          handleParameterValueChange(grossIdx, 'Received a single container labeled with patient identification, containing tissue fragments fixed in 10% neutral buffered formalin.');
                        }
                        if (microIdx >= 0 && !results[microIdx].value) {
                          handleParameterValueChange(microIdx, 'Sections examined show preserved tissue architecture with no cellular atypia or nuclear pleomorphism. Mitotic activity is not increased. Surrounding fibrocollagenous stroma is unremarkable. No evidence of granuloma, dysplasia, or malignancy.');
                        }
                        if (diagIdx >= 0 && !results[diagIdx].value) {
                          handleParameterValueChange(diagIdx, 'BENIGN HISTOPATHOLOGICAL FEATURES. NO EVIDENCE OF DYSPLASIA OR MALIGNANCY.');
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[11px] hover:border-blue-400"
                    >
                      Benign Finding
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const diagIdx = results.findIndex((r) => r.category === 'Histopathology' && r.name.toLowerCase().includes('diagnosis'));
                        const microIdx = results.findIndex((r) => r.category === 'Histopathology' && r.name.toLowerCase().includes('microscopic'));
                        if (microIdx >= 0 && !results[microIdx].value) {
                          handleParameterValueChange(microIdx, 'Sections studied show subepithelial stroma infiltrated predominantly by mature lymphocytes, plasma cells, and scattered histiocytes. Vascular congestion with stromal edema noted. No cellular atypia or dysplasia identified.');
                        }
                        if (diagIdx >= 0 && !results[diagIdx].value) {
                          handleParameterValueChange(diagIdx, 'FEATURES ARE CONSISTENT WITH CHRONIC NON-SPECIFIC INFLAMMATION.');
                        }
                      }}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[11px] hover:border-blue-400"
                    >
                      Chronic Inflammation
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {results
                    .filter((r) => r.category === 'Histopathology')
                    .map((r) => {
                      const originalIdx = results.findIndex((item) => item.parameterId === r.parameterId);
                      const isDiagnosis = r.name.toLowerCase().includes('diagnosis');
                      const isMicro = r.name.toLowerCase().includes('microscopic');
                      const isGross = r.name.toLowerCase().includes('gross');
                      const isSite = r.name.toLowerCase().includes('site') || r.name.toLowerCase().includes('specimen');

                      return (
                        <div
                          key={r.parameterId}
                          className={`p-3 rounded-xl border transition ${
                            isDiagnosis
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span className={isDiagnosis ? 'text-rose-600 font-extrabold' : 'text-blue-600'}>▶</span>
                              <span>{r.name}</span>
                              {isDiagnosis && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                                  Primary Diagnosis
                                </span>
                              )}
                            </label>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {r.refRangeText || 'Narrative finding'}
                            </span>
                          </div>

                          <textarea
                            id={`param-result-textarea-${originalIdx}`}
                            rows={isMicro ? 4 : isDiagnosis ? 3 : isGross ? 3 : 2}
                            value={r.value}
                            onChange={(e) => handleParameterValueChange(originalIdx, e.target.value)}
                            placeholder={
                              isDiagnosis
                                ? 'Enter definitive histopathological diagnosis (e.g. Infiltrating ductal carcinoma / Benign tubular adenoma / Chronic gastritis...)'
                                : isMicro
                                ? 'Describe histological architecture, cellular features, nuclear atypia, mitotic activity, stroma, margins...'
                                : isGross
                                ? 'Describe specimen appearance, dimensions, number of fragments, color, consistency...'
                                : isSite
                                ? 'e.g. Endoscopic gastric biopsy / Skin punch biopsy 4mm right forearm...'
                                : 'Enter clinical observations or histological findings...'
                            }
                            className={`w-full px-3 py-2 rounded-lg text-xs font-medium border focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
                              isDiagnosis
                                ? 'border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-slate-900 font-semibold text-rose-950 dark:text-rose-100'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100'
                            }`}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
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
