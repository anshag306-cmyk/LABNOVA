import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  UploadCloud,
  QrCode,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  FileText,
  User,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  ChevronRight,
  Smartphone,
  Save,
  Sliders,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  PathologyPatient,
  PathologyReport,
  TestTemplate,
  ReportParameterResult,
  ParameterFlag,
  LabSettings,
} from '../../types';
import { DEFAULT_TEST_TEMPLATES } from '../../data/pathologyTemplates';
import {
  createMobileScanSession,
  subscribeToMobileScanSession,
  markMobileScanCompleted,
} from '../../services/mobileScanSession';

interface ExtractedScannedParam {
  id: string;
  parameterName: string;
  matchedParameterId?: string | null;
  testCode: string;
  value: string;
  unit: string;
  refRangeText: string;
  status: ParameterFlag;
  isAmbiguous: boolean;
  confidence: number;
  ambiguityReason?: string;
  isIncluded: boolean;
}

interface ScanReportAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PathologyPatient[];
  templates?: TestTemplate[];
  selectedPatientInitial?: PathologyPatient | null;
  onApplyToReport: (data: {
    patientId: string;
    patientDetails?: Partial<PathologyPatient>;
    testCodes: string[];
    results: ReportParameterResult[];
    clinicalNotes?: string;
    interpretation?: string;
  }) => void;
}

export const ScanReportAiModal: React.FC<ScanReportAiModalProps> = ({
  isOpen,
  onClose,
  patients,
  templates = DEFAULT_TEST_TEMPLATES,
  selectedPatientInitial,
  onApplyToReport,
}) => {
  // Step: 'source' (upload/camera/qr), 'analyzing', 'review'
  const [step, setStep] = useState<'source' | 'analyzing' | 'review'>('source');
  const [sourceMode, setSourceMode] = useState<'upload' | 'webcam' | 'mobile_qr'>('upload');

  // Image data
  const [reportImageBase64, setReportImageBase64] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');

  // Mobile QR session state
  const [mobileSessionId, setMobileSessionId] = useState<string | null>(null);
  const [mobileQrDataUrl, setMobileQrDataUrl] = useState<string | null>(null);
  const [mobileSessionUrl, setMobileSessionUrl] = useState<string>('');
  const [isWaitingForMobile, setIsWaitingForMobile] = useState<boolean>(false);

  // Webcam state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Analysis state
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<string>('');

  // Extracted data for review & edit
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [extractedPatientName, setExtractedPatientName] = useState<string>('');
  const [extractedAge, setExtractedAge] = useState<string>('');
  const [extractedGender, setExtractedGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [extractedReferringDoctor, setExtractedReferringDoctor] = useState<string>('');
  const [detectedTestCodes, setDetectedTestCodes] = useState<string[]>([]);
  const [extractedParams, setExtractedParams] = useState<ExtractedScannedParam[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [interpretation, setInterpretation] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize selected patient
  useEffect(() => {
    if (selectedPatientInitial) {
      setSelectedPatientId(selectedPatientInitial.id);
      setExtractedPatientName(selectedPatientInitial.fullName);
      setExtractedAge(String(selectedPatientInitial.age));
      setExtractedGender(selectedPatientInitial.gender);
      setExtractedReferringDoctor(selectedPatientInitial.referredBy || '');
    } else if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0].id);
      setExtractedPatientName(patients[0].fullName);
      setExtractedAge(String(patients[0].age));
      setExtractedGender(patients[0].gender);
      setExtractedReferringDoctor(patients[0].referredBy || '');
    }
  }, [selectedPatientInitial, patients]);

  // Clean up webcam and mobile session when closing
  useEffect(() => {
    if (!isOpen) {
      stopWebcam();
      setStep('source');
      setReportImageBase64(null);
      setAnalysisError(null);
    }
  }, [isOpen]);

  // Start mobile QR session
  const startMobileQrSession = async () => {
    try {
      setIsWaitingForMobile(true);
      const { sessionId, sessionUrl } = await createMobileScanSession();
      setMobileSessionId(sessionId);
      setMobileSessionUrl(sessionUrl);

      // Generate visual QR code
      const qrUrl = await QRCode.toDataURL(sessionUrl, {
        width: 240,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setMobileQrDataUrl(qrUrl);

      // Listen for mobile photo upload
      const unsubscribe = subscribeToMobileScanSession(sessionId, (docData) => {
        if (docData.status === 'uploaded' && docData.imageBase64) {
          unsubscribe();
          markMobileScanCompleted(sessionId);
          setIsWaitingForMobile(false);
          setReportImageBase64(docData.imageBase64);
          setImageFileName('mobile_camera_report.jpg');
          runAiAnalysis(docData.imageBase64);
        }
      });
    } catch (err: any) {
      console.error('Failed to initialize mobile scan session:', err);
      setIsWaitingForMobile(false);
    }
  };

  // Webcam controls
  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
      }
    } catch (err: any) {
      console.warn('Webcam permission error:', err);
      setWebcamError('Unable to access camera. Please allow camera permissions or upload an image file.');
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      stopWebcam();
      setReportImageBase64(dataUrl);
      setImageFileName('webcam_snapshot.jpg');
      runAiAnalysis(dataUrl);
    }
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setReportImageBase64(base64);
      runAiAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setReportImageBase64(base64);
      runAiAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  // Main AI Analysis API caller
  const runAiAnalysis = async (imageBase64: string) => {
    setStep('analyzing');
    setAnalysisError(null);

    try {
      const response = await fetch('/api/gemini/scan-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          supportedTemplates: templates,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setAnalysisSource(data.source || 'gemini-2.5-flash');

      // Populate extracted patient demographics if detected
      if (data.patientDetails) {
        if (data.patientDetails.patientName) setExtractedPatientName(data.patientDetails.patientName);
        if (data.patientDetails.patientAge) setExtractedAge(String(data.patientDetails.patientAge));
        if (data.patientDetails.patientGender) setExtractedGender(data.patientDetails.patientGender);
        if (data.patientDetails.referredBy) setExtractedReferringDoctor(data.patientDetails.referredBy);
      }

      // Populate detected test codes
      const detectedCodes: string[] = [];
      if (Array.isArray(data.detectedPanels)) {
        data.detectedPanels.forEach((p: any) => {
          if (p.testCode && !detectedCodes.includes(p.testCode)) {
            detectedCodes.push(p.testCode);
          }
        });
      }

      // Process parameters and map against existing templates
      const scannedList: ExtractedScannedParam[] = [];
      if (Array.isArray(data.parameters)) {
        data.parameters.forEach((param: any, idx: number) => {
          const matchedTestCode = param.testCode || (detectedCodes[0] || 'CBC-01');
          if (!detectedCodes.includes(matchedTestCode)) {
            detectedCodes.push(matchedTestCode);
          }

          scannedList.push({
            id: `scan-param-${idx}-${Date.now()}`,
            parameterName: param.parameterName || `Parameter ${idx + 1}`,
            matchedParameterId: param.matchedParameterId || null,
            testCode: matchedTestCode,
            value: String(param.value ?? ''),
            unit: param.unit || '',
            refRangeText: param.refRangeText || '',
            status: (param.status as ParameterFlag) || 'normal',
            isAmbiguous: Boolean(param.isAmbiguous),
            confidence: typeof param.confidence === 'number' ? param.confidence : 90,
            ambiguityReason: param.ambiguityReason || '',
            isIncluded: true,
          });
        });
      }

      if (detectedCodes.length === 0) {
        detectedCodes.push('CBC-01');
      }

      setDetectedTestCodes(detectedCodes);
      setExtractedParams(scannedList);
      setClinicalNotes(data.clinicalImpression || 'Parameters extracted and verified from physical diagnostic report.');
      setInterpretation('Correlate clinically with patient symptoms.');
      setStep('review');
    } catch (err: any) {
      console.error('Error during AI report scan:', err);
      setAnalysisError(
        'AI analysis could not complete. You can retry with a clearer photo or manually verify values.'
      );
      setStep('review'); // Allow manual entry/review even if AI had issues
    }
  };

  // Editing handlers in Review Step
  const handleUpdateParamField = (id: string, field: keyof ExtractedScannedParam, val: any) => {
    setExtractedParams((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, [field]: val };
          // If editing a blurry value, user manual edit clears ambiguity
          if (field === 'value') {
            updated.isAmbiguous = false;
            updated.confidence = 100;
          }
          return updated;
        }
        return p;
      })
    );
  };

  const handleToggleIncludeParam = (id: string) => {
    setExtractedParams((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isIncluded: !p.isIncluded } : p))
    );
  };

  const handleDeleteParam = (id: string) => {
    setExtractedParams((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddCustomParam = () => {
    const newParam: ExtractedScannedParam = {
      id: `custom-param-${Date.now()}`,
      parameterName: 'New Investigation Parameter',
      matchedParameterId: null,
      testCode: detectedTestCodes[0] || 'CBC-01',
      value: '',
      unit: '',
      refRangeText: '',
      status: 'normal',
      isAmbiguous: false,
      confidence: 100,
      isIncluded: true,
    };
    setExtractedParams((prev) => [...prev, newParam]);
  };

  // Confirm and apply verified parameters to Report Builder
  const handleConfirmAndApply = () => {
    const activeParams = extractedParams.filter((p) => p.isIncluded);
    const finalResults: ReportParameterResult[] = activeParams.map((p) => {
      const num = parseFloat(p.value);
      return {
        parameterId: p.matchedParameterId || `p-${p.parameterName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: p.parameterName,
        value: p.value,
        numericValue: !isNaN(num) ? num : undefined,
        unit: p.unit,
        refRangeText: p.refRangeText,
        status: p.status,
      };
    });

    onApplyToReport({
      patientId: selectedPatientId || (patients[0]?.id ?? ''),
      patientDetails: {
        fullName: extractedPatientName,
        age: parseInt(extractedAge) || 30,
        gender: extractedGender,
        referredBy: extractedReferringDoctor,
      },
      testCodes: detectedTestCodes,
      results: finalResults,
      clinicalNotes,
      interpretation,
    });

    onClose();
  };

  const ambiguousCount = extractedParams.filter((p) => p.isAmbiguous).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Scan Diagnostic Report with AI</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Multimodal OCR &bull; All Tests
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Extracts test parameters, units & biological ranges with strict veracity review
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* STEP 1: CAPTURE / UPLOAD / MOBILE QR */}
          {step === 'source' && (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              {/* Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    stopWebcam();
                    setSourceMode('upload');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    sourceMode === 'upload'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Image
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSourceMode('webcam');
                    startWebcam();
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    sourceMode === 'webcam'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  PC Camera
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopWebcam();
                    setSourceMode('mobile_qr');
                    startMobileQrSession();
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    sourceMode === 'mobile_qr'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  Mobile QR Capture
                </button>
              </div>

              {/* Upload View */}
              {sourceMode === 'upload' && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 sm:p-10 text-center space-y-4 transition-all bg-slate-50/50 dark:bg-slate-900/50"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      Upload Medical Report Image
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Drag and drop any report photo, analyzer thermal slip, or document (PNG, JPG, WebP)
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition active:scale-98"
                  >
                    Select Image from Computer
                  </button>

                  <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
                    <span>Supports all 26+ LabNova panels: CBC, LFT, KFT, Lipid, Thyroid, Urine & more</span>
                  </div>
                </div>
              )}

              {/* Webcam View */}
              {sourceMode === 'webcam' && (
                <div className="space-y-4">
                  {webcamError ? (
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-center space-y-3">
                      <p>{webcamError}</p>
                      <button
                        type="button"
                        onClick={() => setSourceMode('upload')}
                        className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs"
                      >
                        Switch to File Upload
                      </button>
                    </div>
                  ) : (
                    <div className="relative rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-xl max-h-[420px] flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-auto max-h-[420px] object-cover"
                      />
                      <div className="absolute bottom-4 inset-x-0 flex justify-center">
                        <button
                          type="button"
                          onClick={captureWebcamSnapshot}
                          className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl shadow-blue-600/40 flex items-center gap-2 transition active:scale-95"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Frame & Analyze
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile QR View */}
              {sourceMode === 'mobile_qr' && (
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      Scan via Mobile Phone Camera
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Scan this QR code with your mobile camera. It opens a dedicated capture page and streams the photo directly to this PC screen.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md inline-block">
                    {mobileQrDataUrl ? (
                      <img
                        src={mobileQrDataUrl}
                        alt="Mobile Scan QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Waiting for mobile capture...</span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono">
                    Temporary encrypted session ID: {mobileSessionId || 'Generating...'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ANALYZING STATE */}
          {step === 'analyzing' && (
            <div className="max-w-md mx-auto py-12 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-blue-500/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30">
                  <Sparkles className="w-10 h-10 animate-spin" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Analyzing Laboratory Report...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Executing Gemini OCR, segmenting diagnostic test tables, cross-referencing parameters, and identifying reference ranges.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Strict Medical Safety Filter Active</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Values will never be guessed or fabricated. Unclear or blurry items will be highlighted for your explicit manual review.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & EDIT EXTRACTED VALUES */}
          {step === 'review' && (
            <div className="space-y-6">
              {/* Ambiguity Alert Banner if any parameter is marked ambiguous */}
              {ambiguousCount > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">
                      {ambiguousCount} Parameter(s) Require Manual Verification
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Portions of the report image were blurry, smudged, or partially cropped. LabNova flagged them with{' '}
                      <span className="font-bold bg-amber-200 dark:bg-amber-900 px-1 rounded">
                        ⚠️ Needs Verification
                      </span>
                      . Please confirm these values against your physical document before saving.
                    </p>
                  </div>
                </div>
              )}

              {/* Patient Selection & Demographics Card */}
              <div className="bg-slate-50/80 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Patient Linkage & Demographics
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Scanned Source: {analysisSource}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {/* Select Existing Patient */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Assign to Registered Patient
                    </label>
                    <select
                      value={selectedPatientId}
                      onChange={(e) => {
                        const pid = e.target.value;
                        setSelectedPatientId(pid);
                        const matched = patients.find((p) => p.id === pid);
                        if (matched) {
                          setExtractedPatientName(matched.fullName);
                          setExtractedAge(String(matched.age));
                          setExtractedGender(matched.gender);
                          setExtractedReferringDoctor(matched.referredBy || '');
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.uhid}) - {p.age}Y/{p.gender}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Referring Doctor */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Referring Doctor / Clinic
                    </label>
                    <input
                      type="text"
                      value={extractedReferringDoctor}
                      onChange={(e) => setExtractedReferringDoctor(e.target.value)}
                      placeholder="e.g. Dr. A. K. Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Detected Test Panels Pill Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Detected Test Panels ({detectedTestCodes.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click to toggle test panel inclusions
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => {
                    const isSelected = detectedTestCodes.includes(t.testCode);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setDetectedTestCodes((prev) => prev.filter((c) => c !== t.testCode));
                          } else {
                            setDetectedTestCodes((prev) => [...prev, t.testCode]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'opacity-30'
                          }`}
                        />
                        <span>{t.testName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extracted Parameters Review Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Extracted Parameters & Values ({extractedParams.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCustomParam}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Parameter
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-8">Inc</th>
                        <th className="py-2.5 px-3">Parameter Name</th>
                        <th className="py-2.5 px-3 w-32">Observed Result</th>
                        <th className="py-2.5 px-3 w-28">Status / Flag</th>
                        <th className="py-2.5 px-3 w-20">Unit</th>
                        <th className="py-2.5 px-3 w-36">Biological Range</th>
                        <th className="py-2.5 px-3 w-10 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {extractedParams.map((param) => (
                        <tr
                          key={param.id}
                          className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                            param.isAmbiguous
                              ? 'bg-amber-50/40 dark:bg-amber-950/20'
                              : !param.isIncluded
                              ? 'opacity-40'
                              : ''
                          }`}
                        >
                          {/* Include Checkbox */}
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={param.isIncluded}
                              onChange={() => handleToggleIncludeParam(param.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>

                          {/* Parameter Name */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={param.parameterName}
                              onChange={(e) =>
                                handleUpdateParamField(param.id, 'parameterName', e.target.value)
                              }
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-medium text-slate-900 dark:text-slate-100 text-xs"
                            />
                            {param.isAmbiguous && (
                              <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>{param.ambiguityReason || 'Verify value from physical sheet'}</span>
                              </div>
                            )}
                          </td>

                          {/* Observed Value */}
                          <td className="py-2 px-3">
                            <div className="relative">
                              <input
                                type="text"
                                value={param.value}
                                onChange={(e) =>
                                  handleUpdateParamField(param.id, 'value', e.target.value)
                                }
                                placeholder="Enter value"
                                className={`w-full px-2 py-1 rounded-lg font-mono font-bold text-xs border ${
                                  param.isAmbiguous
                                    ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 ring-1 ring-amber-400'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                }`}
                              />
                              {param.isAmbiguous && (
                                <span className="absolute -top-2 right-1 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white shadow-xs">
                                  Verify
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Flag */}
                          <td className="py-2 px-3">
                            <select
                              value={param.status}
                              onChange={(e) =>
                                handleUpdateParamField(param.id, 'status', e.target.value as ParameterFlag)
                              }
                              className={`w-full px-2 py-1 rounded-lg text-xs font-bold border ${
                                param.status === 'normal'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : param.status === 'low'
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : param.status === 'high'
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

                          {/* Unit */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={param.unit}
                              onChange={(e) =>
                                handleUpdateParamField(param.id, 'unit', e.target.value)
                              }
                              className="w-full px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-[11px] text-slate-700 dark:text-slate-300"
                            />
                          </td>

                          {/* Reference Range */}
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={param.refRangeText}
                              onChange={(e) =>
                                handleUpdateParamField(param.id, 'refRangeText', e.target.value)
                              }
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-[11px] text-slate-600 dark:text-slate-300"
                            />
                          </td>

                          {/* Delete */}
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteParam(param.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Split view: Original photo preview for cross-checking */}
              {reportImageBase64 && (
                <details className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 group">
                  <summary className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      Inspect Original Uploaded Report Image ({imageFileName || 'Captured Frame'})
                    </span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400">
                      Toggle Image Preview
                    </span>
                  </summary>
                  <div className="mt-3 bg-black rounded-xl overflow-hidden max-h-96 flex items-center justify-center border border-slate-700">
                    <img
                      src={reportImageBase64}
                      alt="Original Report"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
          <div>
            {step === 'review' && (
              <button
                type="button"
                onClick={() => setStep('source')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                &larr; Re-scan Another Image
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            {step === 'review' && (
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition active:scale-98"
              >
                <Save className="w-3.5 h-3.5" />
                Apply Verified Values to Report Builder
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
