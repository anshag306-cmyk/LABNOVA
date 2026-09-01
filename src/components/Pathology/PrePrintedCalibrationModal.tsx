import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  Save,
  RotateCcw,
  Sliders,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Grid,
  Info,
  Layers,
  Sparkles,
  FileText,
  Type,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import {
  PathologyReport,
  LabSettings,
  PrePrintedLetterheadConfig,
  DigitalLetterheadConfig,
} from '../../types';
import {
  getPrePrintedConfig,
  savePrePrintedConfig,
  resetPrePrintedConfig,
  DEFAULT_PREPRINTED_CONFIG,
  getDigitalConfig,
  saveDigitalConfig,
  resetDigitalConfig,
  DEFAULT_DIGITAL_CONFIG,
} from '../../services/prePrintedConfig';
import {
  generatePrePrintedPathologyPdf,
  generatePathologyPdf,
  generateAlignmentTestGridPdf,
} from '../../services/pdfReportGenerator';

interface PrePrintedCalibrationModalProps {
  report: PathologyReport | null;
  settings?: LabSettings;
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'digital' | 'preprinted';
}

export const PrePrintedCalibrationModal: React.FC<PrePrintedCalibrationModalProps> = ({
  report,
  settings,
  isOpen,
  onClose,
  defaultMode = 'digital',
}) => {
  const [activeTab, setActiveTab] = useState<'digital' | 'preprinted'>(defaultMode);
  const [prePrintedConfig, setPrePrintedConfig] = useState<PrePrintedLetterheadConfig>(getPrePrintedConfig());
  const [digitalConfig, setDigitalConfig] = useState<DigitalLetterheadConfig>(getDigitalConfig());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [stepSize, setStepSize] = useState<1 | 5>(1); // Step size in mm for directional pad

  useEffect(() => {
    if (isOpen) {
      setPrePrintedConfig(getPrePrintedConfig());
      setDigitalConfig(getDigitalConfig());
      setActiveTab(defaultMode);
      setSavedSuccess(false);
    }
  }, [isOpen, defaultMode]);

  if (!isOpen || !report) return null;

  // Directional Nudge Handler
  const handleNudge = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (activeTab === 'digital') {
      setDigitalConfig((prev) => {
        let newTop = prev.topOffsetMm || 0;
        let newLeft = prev.horizontalOffsetMm || 0;

        if (direction === 'UP') newTop = Math.max(-25, newTop - stepSize);
        else if (direction === 'DOWN') newTop = Math.min(30, newTop + stepSize);
        else if (direction === 'LEFT') newLeft = Math.max(-25, newLeft - stepSize);
        else if (direction === 'RIGHT') newLeft = Math.min(25, newLeft + stepSize);

        return {
          ...prev,
          topOffsetMm: newTop,
          horizontalOffsetMm: newLeft,
        };
      });
    } else {
      setPrePrintedConfig((prev) => {
        let newHeaderOffset = prev.headerSpaceOffsetMm;
        let newHorizontalOffset = prev.horizontalOffsetMm;

        if (direction === 'UP') {
          newHeaderOffset = Math.max(-30, prev.headerSpaceOffsetMm - stepSize);
        } else if (direction === 'DOWN') {
          newHeaderOffset = Math.min(50, prev.headerSpaceOffsetMm + stepSize);
        } else if (direction === 'LEFT') {
          newHorizontalOffset = Math.max(-25, prev.horizontalOffsetMm - stepSize);
        } else if (direction === 'RIGHT') {
          newHorizontalOffset = Math.min(25, prev.horizontalOffsetMm + stepSize);
        }

        return {
          ...prev,
          headerSpaceOffsetMm: newHeaderOffset,
          horizontalOffsetMm: newHorizontalOffset,
        };
      });
    }
    setSavedSuccess(false);
  };

  // Font Size Stepper Handler
  const handleFontSizeStep = (delta: number) => {
    if (activeTab === 'digital') {
      setDigitalConfig((prev) => {
        const cur = prev.tableFontSizePt || 9.5;
        const next = Math.round(Math.min(13.0, Math.max(7.5, cur + delta)) * 10) / 10;
        return { ...prev, tableFontSizePt: next };
      });
    } else {
      setPrePrintedConfig((prev) => {
        const cur = prev.tableFontSizePt || 9.5;
        const next = Math.round(Math.min(13.0, Math.max(7.5, cur + delta)) * 10) / 10;
        return { ...prev, tableFontSizePt: next };
      });
    }
    setSavedSuccess(false);
  };

  // Font Size Direct Change Handler
  const handleFontSizeChange = (val: number) => {
    const clamped = Math.round(Math.min(13.0, Math.max(7.5, val)) * 10) / 10;
    if (activeTab === 'digital') {
      setDigitalConfig((prev) => ({ ...prev, tableFontSizePt: clamped }));
    } else {
      setPrePrintedConfig((prev) => ({ ...prev, tableFontSizePt: clamped }));
    }
    setSavedSuccess(false);
  };

  const handlePrePrintedFieldChange = <K extends keyof PrePrintedLetterheadConfig>(
    field: K,
    value: PrePrintedLetterheadConfig[K]
  ) => {
    setPrePrintedConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  const handleSaveSettings = () => {
    if (activeTab === 'digital') {
      saveDigitalConfig(digitalConfig);
    } else {
      savePrePrintedConfig(prePrintedConfig);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    const targetName = activeTab === 'digital' ? 'Digital Letterhead' : 'Pre-Printed Letterhead';
    if (window.confirm(`Reset all ${targetName} alignment offsets and font sizes to default standard?`)) {
      if (activeTab === 'digital') {
        const def = resetDigitalConfig();
        setDigitalConfig(def);
      } else {
        const def = resetPrePrintedConfig();
        setPrePrintedConfig(def);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleGeneratePdf = (directPrint: boolean = false) => {
    if (activeTab === 'digital') {
      saveDigitalConfig(digitalConfig);
      generatePathologyPdf(report, settings, digitalConfig);
    } else {
      savePrePrintedConfig(prePrintedConfig);
      generatePrePrintedPathologyPdf(report, settings, prePrintedConfig, directPrint);
    }
  };

  const handlePrintTestGrid = () => {
    generateAlignmentTestGridPdf(prePrintedConfig);
  };

  // Geometry calculations for live preview simulation
  const pageHeightMm = 297;
  const pageWidthMm = 210;

  // Pre-Printed calculations
  const prePrintedEffectiveTopMm = Math.max(15, (prePrintedConfig.topMarginMm || 48) + (prePrintedConfig.headerSpaceOffsetMm || 0));
  const prePrintedEffectiveBottomMm = Math.max(10, prePrintedConfig.bottomMarginMm || 28);
  const prePrintedEffectiveLeftMm = Math.max(5, (prePrintedConfig.leftMarginMm || 12) + (prePrintedConfig.horizontalOffsetMm || 0));
  const prePrintedEffectiveRightMm = Math.max(5, (prePrintedConfig.rightMarginMm || 12) - (prePrintedConfig.horizontalOffsetMm || 0));

  const prePrintedTopPercent = (prePrintedEffectiveTopMm / pageHeightMm) * 100;
  const prePrintedBottomPercent = (prePrintedEffectiveBottomMm / pageHeightMm) * 100;
  const prePrintedLeftPercent = (prePrintedEffectiveLeftMm / pageWidthMm) * 100;
  const prePrintedRightPercent = (prePrintedEffectiveRightMm / pageWidthMm) * 100;

  // Digital calculations
  const digitalBaseMargin = 12;
  const digitalEffectiveLeftMm = Math.max(4, Math.min(30, digitalBaseMargin + (digitalConfig.horizontalOffsetMm || 0)));
  const digitalEffectiveRightMm = Math.max(4, Math.min(30, digitalBaseMargin - (digitalConfig.horizontalOffsetMm || 0)));
  const digitalEffectiveTopMm = Math.max(4, Math.min(35, digitalBaseMargin + (digitalConfig.topOffsetMm || 0)));

  const digitalTopPercent = (digitalEffectiveTopMm / pageHeightMm) * 100;
  const digitalLeftPercent = (digitalEffectiveLeftMm / pageWidthMm) * 100;
  const digitalRightPercent = (digitalEffectiveRightMm / pageWidthMm) * 100;

  const currentFontSizePt =
    activeTab === 'digital'
      ? digitalConfig.tableFontSizePt || 9.5
      : prePrintedConfig.tableFontSizePt || 9.5;

  const FONT_PRESETS = [
    { label: 'Compact', size: 8.0, desc: 'High density' },
    { label: 'Standard', size: 9.0, desc: 'Standard' },
    { label: 'Recommended', size: 9.5, desc: 'A4 optimal' },
    { label: 'Medium', size: 10.5, desc: 'Clear' },
    { label: 'Large', size: 11.5, desc: 'High visibility' },
    { label: 'Extra Large', size: 12.5, desc: 'Max readable' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  PDF Print & Position Adjustments
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    activeTab === 'digital'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {activeTab === 'digital' ? 'Digital Letterhead' : 'Pre-Printed Stationery'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Adjust position offsets (UP/DOWN/LEFT/RIGHT) and Investigation Table Font Size for A4 printing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Digital Letterhead PDF vs Pre-Printed Stationery) */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-2 border-b border-slate-200 dark:border-slate-750 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:inline">
              Target Mode:
            </span>
            <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('digital');
                  setSavedSuccess(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'digital'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>1. Digital Letterhead PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('preprinted');
                  setSavedSuccess(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'preprinted'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. Print on Pre-Printed Letterhead</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden md:block">
            {activeTab === 'digital'
              ? 'Includes digital header banner, logo & accreditation'
              : 'Leaves blank clearance for pre-printed letterhead paper'}
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-950">
          {/* Left Column: Calibration Controls & Steppers (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Section 1: Clearly Visible Print Adjustment (Directional Position Nudge Pad) */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      activeTab === 'digital'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                      <span>Print Adjustment (UP / DOWN / LEFT / RIGHT)</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {activeTab === 'digital' ? 'Full Report Offset' : 'Stationery Offset'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Nudge full report position on A4 page before generating or printing
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setStepSize(1)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                      stepSize === 1
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    1 mm
                  </button>
                  <button
                    onClick={() => setStepSize(5)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                      stepSize === 5
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    5 mm
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Visual D-Pad */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <button
                    onClick={() => handleNudge('UP')}
                    title="Nudge Upwards (Shift content up on page)"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 hover:border-blue-300 shadow-xs active:scale-95 transition flex items-center justify-center mb-1"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNudge('LEFT')}
                      title="Nudge Left (Shift content left on page)"
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 hover:border-blue-300 shadow-xs active:scale-95 transition flex items-center justify-center"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700/60 flex items-center justify-center text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200">
                      PAD
                    </div>
                    <button
                      onClick={() => handleNudge('RIGHT')}
                      title="Nudge Right (Shift content right on page)"
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 hover:border-blue-300 shadow-xs active:scale-95 transition flex items-center justify-center"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => handleNudge('DOWN')}
                    title="Nudge Downwards (Shift content down on page)"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 hover:border-blue-300 shadow-xs active:scale-95 transition flex items-center justify-center mt-1"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Current Offset Metrics Readout */}
                <div className="space-y-2 text-xs">
                  {activeTab === 'digital' ? (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Vertical Offset (Top/Down):</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                          {(digitalConfig.topOffsetMm || 0) >= 0 ? `+${digitalConfig.topOffsetMm || 0}` : digitalConfig.topOffsetMm} mm
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Horizontal Offset (Left/Right):</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                          {(digitalConfig.horizontalOffsetMm || 0) >= 0 ? `+${digitalConfig.horizontalOffsetMm || 0}` : digitalConfig.horizontalOffsetMm} mm
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Effective Top Margin:</span>
                        <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                          {digitalEffectiveTopMm.toFixed(1)} mm
                        </strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Top Header Clearance:</span>
                        <strong className="text-amber-600 dark:text-amber-400 font-mono text-sm">
                          {prePrintedEffectiveTopMm.toFixed(1)} mm
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Left Margin:</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                          {prePrintedEffectiveLeftMm.toFixed(1)} mm
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-slate-600 dark:text-slate-400">Bottom Clearance:</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono text-sm">
                          {prePrintedEffectiveBottomMm.toFixed(1)} mm
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Investigation & Reporting Section Font Size Control */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-blue-500/30 dark:border-blue-500/20 p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Investigation Table Font Size Control</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {activeTab === 'digital' ? 'Digital PDF' : 'Pre-Printed PDF'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Applies to Test Names, Observed Results, Units, and Biological Reference Intervals. Long test names wrap into 2 lines automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs border border-blue-200 dark:border-blue-800">
                    {currentFontSizePt.toFixed(1)} pt
                  </span>
                </div>
              </div>

              {/* Stepper (+ / -) & Quick Range Slider */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                {/* Stepper (- / +) */}
                <div className="sm:col-span-5 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 justify-between">
                  <button
                    type="button"
                    onClick={() => handleFontSizeStep(-0.5)}
                    disabled={currentFontSizePt <= 7.5}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 transition shadow-xs flex items-center justify-center"
                    title="Decrease font size (-0.5pt)"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col items-center px-1">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                      {currentFontSizePt.toFixed(1)} pt
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">
                      {currentFontSizePt >= 11.5
                        ? 'Large & Clear'
                        : currentFontSizePt >= 9.5
                        ? 'Standard A4'
                        : 'Compact'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFontSizeStep(0.5)}
                    disabled={currentFontSizePt >= 13.0}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40 transition shadow-xs flex items-center justify-center"
                    title="Increase font size (+0.5pt)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Range Slider */}
                <div className="sm:col-span-7 flex flex-col justify-center px-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-1">
                    <span>7.5 pt (Compact)</span>
                    <span className="font-bold text-blue-600">9.5 pt (Optimal)</span>
                    <span>13.0 pt (Large)</span>
                  </div>
                  <input
                    type="range"
                    min="7.5"
                    max="13.0"
                    step="0.5"
                    value={currentFontSizePt}
                    onChange={(e) => handleFontSizeChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>

              {/* Font Size Preset Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Quick Font Size Presets:
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {FONT_PRESETS.map((preset) => {
                    const isSelected = Math.abs(currentFontSizePt - preset.size) < 0.1;
                    return (
                      <button
                        key={preset.size}
                        type="button"
                        onClick={() => handleFontSizeChange(preset.size)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition flex flex-col items-center ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600'
                        }`}
                      >
                        <span className="font-mono font-bold text-xs">{preset.size.toFixed(1)} pt</span>
                        <span className={`text-[9px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pre-Printed Specific Options */}
            {activeTab === 'preprinted' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Stationery Elements & Signatures
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prePrintedConfig.includeSignatures}
                      onChange={(e) => handlePrePrintedFieldChange('includeSignatures', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Digital Signatures
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Print signatures or leave blank for rubber stamp
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prePrintedConfig.includePatientBox}
                      onChange={(e) => handlePrePrintedFieldChange('includePatientBox', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Patient Details Card
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Draw bordered box around demographics
                      </span>
                    </div>
                  </label>
                </div>

                {/* Alignment test grid */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <Grid className="w-4 h-4 text-amber-600" />
                    <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Test physical paper rulers
                    </span>
                  </div>
                  <button
                    onClick={handlePrintTestGrid}
                    className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1.5"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Print 10mm Test Grid</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live A4 Visual Layout Simulation (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {activeTab === 'digital' ? 'Digital PDF A4 Simulation' : 'Stationery Alignment Simulation'}
                </span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">210 × 297 mm</span>
            </div>

            {/* Simulated A4 Paper (AspectRatio 1 : 1.414) */}
            <div className="relative w-full max-w-[320px] aspect-[210/297] bg-white rounded-lg shadow-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden select-none flex flex-col justify-between">
              {activeTab === 'digital' ? (
                /* Digital Letterhead Full Preview */
                <div
                  style={{
                    paddingLeft: `${digitalLeftPercent}%`,
                    paddingRight: `${digitalRightPercent}%`,
                    paddingTop: `${digitalTopPercent}%`,
                  }}
                  className="w-full space-y-1.5 transition-all duration-150 flex-1 flex flex-col"
                >
                  {/* Digital Top Header Banner */}
                  <div className="bg-slate-900 text-white p-1.5 rounded-sm flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[7px] font-bold text-white">
                        +
                      </div>
                      <div>
                        <div className="text-[7.5px] font-bold tracking-tight uppercase">
                          {settings?.labName || 'LAB NOVA PATHOLOGY'}
                        </div>
                        <div className="text-[5.5px] text-slate-300">
                          DIAGNOSTICS & RESEARCH COMPLEX
                        </div>
                      </div>
                    </div>
                    <div className="px-1 py-0.5 rounded-xs bg-emerald-900/60 text-emerald-300 text-[5.5px] font-bold border border-emerald-500/30">
                      NABL ISO 15189
                    </div>
                  </div>

                  {/* Patient Info Card */}
                  <div className="p-1 rounded-sm bg-slate-50 border border-slate-300 text-[6.5px] space-y-0.5">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{report.patientName}</span>
                      <span className="font-mono text-blue-700">{report.reportId}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>{report.patientAge}Y / {report.patientGender}</span>
                      <span>UHID: {report.patientUHID}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Ref: {report.referredBy || 'Direct'}</span>
                      <span>{report.sampleType}</span>
                    </div>
                  </div>

                  {/* Table Header Simulation */}
                  <div
                    style={{ fontSize: `${Math.max(6.0, (digitalConfig.tableFontSizePt || 9.5) * 0.68)}px` }}
                    className="bg-slate-200 border-b border-slate-400 px-1 py-0.5 font-bold text-slate-800 flex justify-between tracking-tight"
                  >
                    <span>INVESTIGATION</span>
                    <span>RESULT</span>
                    <span>UNIT</span>
                    <span>REF. INTERVAL</span>
                  </div>

                  {/* Results Rows Simulation (Dynamically scaled & demonstrating 2-line wrap) */}
                  <div
                    style={{ fontSize: `${Math.max(6.0, (digitalConfig.tableFontSizePt || 9.5) * 0.72)}px` }}
                    className="space-y-0.5 flex-1"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 py-0.5">
                      <span className="font-bold text-slate-900 truncate max-w-[42%]">
                        {report.results?.[0]?.name || 'Hemoglobin (Hb)'}
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {report.results?.[0]?.value || '14.2'}
                      </span>
                      <span className="text-slate-600">{report.results?.[0]?.unit || 'g/dL'}</span>
                      <span className="text-slate-600">
                        {report.results?.[0]?.refRangeText || '13.0 - 17.0'}
                      </span>
                    </div>

                    {/* Long Wrapped Name Example */}
                    <div className="bg-blue-50/70 p-1 rounded-xs border border-blue-200/60 space-y-0.5">
                      <div
                        style={{ fontSize: `${Math.max(6.0, (digitalConfig.tableFontSizePt || 9.5) * 0.72)}px` }}
                        className="text-blue-950 font-bold leading-snug"
                      >
                        ERYTHROCYTE SEDIMENTATION RATE (ESR)
                        <br />
                        WESTERGREN METHOD
                      </div>
                      <div className="flex justify-between items-center font-bold text-amber-700">
                        <span className="font-mono">Result: 28 mm/hr</span>
                        <span className="text-[9px] text-amber-600">▲ HIGH</span>
                        <span className="text-slate-600 font-normal">Ref: 0 - 15</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-100 py-0.5">
                      <span className="font-bold text-slate-900 truncate max-w-[42%]">
                        {report.results?.[1]?.name || 'Total Leukocyte Count (TLC)'}
                      </span>
                      <span className="font-bold text-slate-900 font-mono">
                        {report.results?.[1]?.value || '7,800'}
                      </span>
                      <span className="text-slate-600">{report.results?.[1]?.unit || '/cumm'}</span>
                      <span className="text-slate-600">4,000 - 11,000</span>
                    </div>
                  </div>

                  {/* Dual Digital Signatures */}
                  <div className="pt-1.5 border-t border-slate-300 flex justify-between text-[5.5px] text-slate-600 mt-auto">
                    <div>
                      <div className="font-bold text-slate-800">Sunil K. Verma</div>
                      <div className="text-[5px]">Senior MLT Analyst</div>
                    </div>
                    <div className="text-center text-emerald-600 font-bold">
                      ✓ Digitally Signed & Verified
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">Dr. Manisha Kulkarni</div>
                      <div className="text-[5px]">MD Pathologist</div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Pre-Printed Stationery Preview */
                <>
                  {/* Top Clearance Zone (Red Shaded) */}
                  <div
                    style={{ height: `${prePrintedTopPercent}%` }}
                    className="w-full bg-rose-500/15 border-b-2 border-rose-500/50 flex flex-col items-center justify-center text-center p-1 transition-all duration-150 relative shrink-0"
                  >
                    <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">
                      Physical Letterhead Header Zone
                    </span>
                    <span className="text-[8px] font-mono font-bold text-rose-600">
                      {prePrintedEffectiveTopMm.toFixed(1)} mm clearance
                    </span>
                    <div className="absolute bottom-1 right-2 text-[7px] text-rose-400 font-mono">
                      ▼ Content starts here
                    </div>
                  </div>

                  {/* Printable Body Content Zone */}
                  <div
                    style={{
                      paddingLeft: `${prePrintedLeftPercent}%`,
                      paddingRight: `${prePrintedRightPercent}%`,
                    }}
                    className="w-full space-y-1 pt-1 transition-all duration-150 flex-1 flex flex-col"
                  >
                    {/* Patient Info Card Simulation */}
                    <div
                      className={`p-1 rounded-sm ${
                        prePrintedConfig.includePatientBox
                          ? 'bg-slate-100 border border-slate-300'
                          : 'border-y border-slate-300'
                      } text-[6.5px] space-y-0.5`}
                    >
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{report.patientName}</span>
                        <span className="font-mono">{report.reportId}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>{report.patientAge}Y / {report.patientGender}</span>
                        <span>UHID: {report.patientUHID}</span>
                      </div>
                    </div>

                    {/* Table Header Simulation */}
                    <div
                      style={{ fontSize: `${Math.max(6.0, (prePrintedConfig.tableFontSizePt || 9.5) * 0.68)}px` }}
                      className="bg-slate-200 border-b border-slate-400 px-1 py-0.5 font-bold text-slate-800 flex justify-between tracking-tight"
                    >
                      <span>INVESTIGATION</span>
                      <span>RESULT</span>
                      <span>UNIT</span>
                      <span>REF. INTERVAL</span>
                    </div>

                    {/* Results Rows Simulation (Dynamically scaled & demonstrating 2-line wrap) */}
                    <div
                      style={{ fontSize: `${Math.max(6.0, (prePrintedConfig.tableFontSizePt || 9.5) * 0.72)}px` }}
                      className="space-y-0.5 flex-1"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 py-0.5">
                        <span className="font-bold text-slate-900 truncate max-w-[42%]">
                          {report.results?.[0]?.name || 'Hemoglobin (Hb)'}
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {report.results?.[0]?.value || '14.2'}
                        </span>
                        <span className="text-slate-600">{report.results?.[0]?.unit || 'g/dL'}</span>
                        <span className="text-slate-600">
                          {report.results?.[0]?.refRangeText || '13.0 - 17.0'}
                        </span>
                      </div>

                      {/* Long Wrapped Name Example */}
                      <div className="bg-blue-50/70 p-1 rounded-xs border border-blue-200/60 space-y-0.5">
                        <div
                          style={{ fontSize: `${Math.max(6.0, (prePrintedConfig.tableFontSizePt || 9.5) * 0.72)}px` }}
                          className="text-blue-950 font-bold leading-snug"
                        >
                          ERYTHROCYTE SEDIMENTATION RATE (ESR)
                          <br />
                          WESTERGREN METHOD
                        </div>
                        <div className="flex justify-between items-center font-bold text-amber-700">
                          <span className="font-mono">Result: 28 mm/hr</span>
                          <span className="text-[9px] text-amber-600">▲ HIGH</span>
                          <span className="text-slate-600 font-normal">Ref: 0 - 15</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-b border-slate-100 py-0.5">
                        <span className="font-bold text-slate-900 truncate max-w-[42%]">
                          {report.results?.[1]?.name || 'Total Leukocyte Count (TLC)'}
                        </span>
                        <span className="font-bold text-slate-900 font-mono">
                          {report.results?.[1]?.value || '7,800'}
                        </span>
                        <span className="text-slate-600">{report.results?.[1]?.unit || '/cumm'}</span>
                        <span className="text-slate-600">4,000 - 11,000</span>
                      </div>
                    </div>

                    {/* Signatures */}
                    {prePrintedConfig.includeSignatures ? (
                      <div className="pt-1.5 border-t border-slate-300 flex justify-between text-[5.5px] text-slate-600 mt-auto">
                        <div>
                          <div className="font-bold">MLT Analyst</div>
                          <div className="text-[4.5px]">Verified</div>
                        </div>
                        <div className="text-emerald-600 font-bold">✓ e-Signed</div>
                        <div className="text-right">
                          <div className="font-bold">Pathologist</div>
                          <div className="text-[4.5px]">MD Pathology</div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1.5 text-center text-[5.5px] text-slate-400 italic mt-auto">
                        [ Clear space for physical doctor rubber stamp & signature ]
                      </div>
                    )}
                  </div>

                  {/* Bottom Clearance Zone (Red Shaded) */}
                  <div
                    style={{ height: `${prePrintedBottomPercent}%` }}
                    className="w-full bg-rose-500/15 border-t-2 border-rose-500/50 flex items-center justify-center text-center p-1 shrink-0"
                  >
                    <span className="text-[8px] font-bold text-rose-700 uppercase tracking-wider">
                      Footer Clearance: {prePrintedEffectiveBottomMm.toFixed(1)} mm
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 text-[11px] text-slate-500 text-center flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 inline" />
              <span>
                {activeTab === 'digital'
                  ? 'Shows digital banner, patient card, test table with dynamic font, and signatures.'
                  : 'Red areas leave blank clearance for physical stationery pre-printed headers.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveSettings}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Calibration</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>Settings Saved!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleGeneratePdf(true)}
              className="px-3.5 py-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
              title="Open direct browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Direct Print</span>
            </button>

            <button
              onClick={() => handleGeneratePdf(false)}
              className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition shadow-md flex items-center gap-2 ${
                activeTab === 'digital'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>
                {activeTab === 'digital'
                  ? 'Download Digital Letterhead (A4 PDF)'
                  : 'Download Pre-Printed Report (A4 PDF)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PrintCalibrationModal = PrePrintedCalibrationModal;
