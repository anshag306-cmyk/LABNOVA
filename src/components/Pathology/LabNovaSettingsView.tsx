import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Award,
  Save,
  CheckCircle2,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileCheck,
  UserCheck,
  Sparkles,
  Info,
  Lock,
  Palette,
  Image as ImageIcon,
  Sliders,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Grid,
  FileSpreadsheet,
  Type,
  Plus,
  Minus,
  FileText,
  Layers,
  Eye,
  EyeOff,
  QrCode,
} from 'lucide-react';
import { LabSettings, PrePrintedLetterheadConfig, DigitalLetterheadConfig } from '../../types';
import { DEFAULT_LAB_SETTINGS } from '../../data/pathologyTemplates';
import { saveLabSettingsToFirestore } from '../../services/pathologyFirebase';
import {
  getPrePrintedConfig,
  savePrePrintedConfig,
  resetPrePrintedConfig,
  getDigitalConfig,
  saveDigitalConfig,
  resetDigitalConfig,
  DEFAULT_DIGITAL_CONFIG,
  DEFAULT_PREPRINTED_CONFIG,
} from '../../services/prePrintedConfig';
import { generateAlignmentTestGridPdf } from '../../services/pdfReportGenerator';
import { useAuth } from '../../context/AuthContext';

interface LabNovaSettingsViewProps {
  currentSettings?: LabSettings;
  onSettingsUpdated?: (newSettings: LabSettings) => void;
}

const PRESET_HEADER_COLORS = [
  { name: 'Deep Slate Navy', hex: '#0f172a' },
  { name: 'Emerald Clinical', hex: '#047857' },
  { name: 'Indigo Medical', hex: '#4338ca' },
  { name: 'Sky Cyan', hex: '#0284c7' },
  { name: 'Royal Purple', hex: '#6b21a8' },
  { name: 'Crimson Diagnostic', hex: '#be123c' },
];

export const LabNovaSettingsView: React.FC<LabNovaSettingsViewProps> = ({
  currentSettings,
  onSettingsUpdated,
}) => {
  const { currentLab, isAdmin, isStaff } = useAuth();

  const [formData, setFormData] = useState<LabSettings>(() => {
    return currentSettings
      ? { ...currentSettings, labId: currentLab.id }
      : { ...DEFAULT_LAB_SETTINGS, labId: currentLab.id };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calibration Tab Switcher
  const [calibrationTab, setCalibrationTab] = useState<'digital' | 'preprinted'>('digital');

  // Digital Letterhead Print Adjustment State
  const [digitalConfig, setDigitalConfig] = useState<DigitalLetterheadConfig>(getDigitalConfig());
  const [digitalSaved, setDigitalSaved] = useState(false);

  // Pre-Printed Letterhead Stationery Calibration State (Stored locally per machine/lab station)
  const [prePrintedConfig, setPrePrintedConfig] = useState<PrePrintedLetterheadConfig>(getPrePrintedConfig());
  const [prePrintedSaved, setPrePrintedSaved] = useState(false);
  const [nudgeStep, setNudgeStep] = useState<1 | 5>(1);

  useEffect(() => {
    if (currentSettings) {
      setFormData({ ...currentSettings, labId: currentLab.id });
    }
  }, [currentSettings, currentLab.id]);

  const handleChange = (field: keyof LabSettings, value: string) => {
    if (!isAdmin) return;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSavedSuccess(false);
  };

  // Digital Config Handlers
  const handleDigitalChange = <K extends keyof DigitalLetterheadConfig>(
    field: K,
    value: DigitalLetterheadConfig[K]
  ) => {
    setDigitalConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    setDigitalSaved(false);
  };

  const handleDigitalNudge = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    setDigitalConfig((prev) => {
      let newTop = prev.topOffsetMm || 0;
      let newLeft = prev.horizontalOffsetMm || 0;

      if (direction === 'UP') newTop = Math.max(-25, newTop - nudgeStep);
      else if (direction === 'DOWN') newTop = Math.min(30, newTop + nudgeStep);
      else if (direction === 'LEFT') newLeft = Math.max(-25, newLeft - nudgeStep);
      else if (direction === 'RIGHT') newLeft = Math.min(25, newLeft + nudgeStep);

      return {
        ...prev,
        topOffsetMm: newTop,
        horizontalOffsetMm: newLeft,
      };
    });
    setDigitalSaved(false);
  };

  const handleSaveDigital = () => {
    saveDigitalConfig(digitalConfig);
    setDigitalSaved(true);
    setTimeout(() => setDigitalSaved(false), 3000);
  };

  const handleResetDigital = () => {
    if (window.confirm('Reset Digital Letterhead position offsets and font size to standard defaults?')) {
      const def = resetDigitalConfig();
      setDigitalConfig(def);
      setDigitalSaved(true);
      setTimeout(() => setDigitalSaved(false), 3000);
    }
  };

  // PrePrinted Config Handlers
  const handlePrePrintedChange = <K extends keyof PrePrintedLetterheadConfig>(
    field: K,
    value: PrePrintedLetterheadConfig[K]
  ) => {
    setPrePrintedConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPrePrintedSaved(false);
  };

  const handlePrePrintedNudge = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    setPrePrintedConfig((prev) => {
      let newHeaderOffset = prev.headerSpaceOffsetMm;
      let newHorizontalOffset = prev.horizontalOffsetMm;

      if (direction === 'UP') {
        newHeaderOffset = Math.max(-30, prev.headerSpaceOffsetMm - nudgeStep);
      } else if (direction === 'DOWN') {
        newHeaderOffset = Math.min(50, prev.headerSpaceOffsetMm + nudgeStep);
      } else if (direction === 'LEFT') {
        newHorizontalOffset = Math.max(-25, prev.horizontalOffsetMm - nudgeStep);
      } else if (direction === 'RIGHT') {
        newHorizontalOffset = Math.min(25, prev.horizontalOffsetMm + nudgeStep);
      }

      return {
        ...prev,
        headerSpaceOffsetMm: newHeaderOffset,
        horizontalOffsetMm: newHorizontalOffset,
      };
    });
    setPrePrintedSaved(false);
  };

  const handleSavePrePrinted = () => {
    savePrePrintedConfig(prePrintedConfig);
    setPrePrintedSaved(true);
    setTimeout(() => setPrePrintedSaved(false), 3000);
  };

  const handleResetPrePrinted = () => {
    if (window.confirm('Reset Pre-Printed Letterhead margin and offset calibration to defaults?')) {
      const def = resetPrePrintedConfig();
      setPrePrintedConfig(def);
      setPrePrintedSaved(true);
      setTimeout(() => setPrePrintedSaved(false), 3000);
    }
  };

  const handlePrintTestGrid = () => {
    generateAlignmentTestGridPdf(prePrintedConfig);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSavedSuccess(false);

    try {
      await saveLabSettingsToFirestore(formData, currentLab.id);
      setIsSaving(false);
      setSavedSuccess(true);
      if (onSettingsUpdated) {
        onSettingsUpdated(formData);
      }
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save lab settings:', err);
      setErrorMessage(err?.message || 'Error updating settings in Firestore');
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (!isAdmin) return;
    if (window.confirm(`Reset lab branding and accreditation to ${currentLab.name} defaults?`)) {
      setFormData({
        ...DEFAULT_LAB_SETTINGS,
        labId: currentLab.id,
        labName: currentLab.name,
        tagline: currentLab.tagline,
        address: currentLab.address,
        phone: currentLab.phone,
        email: currentLab.email,
        website: currentLab.website || '',
        pathologistName: currentLab.pathologistName,
        pathologistQualification: currentLab.pathologistQualification,
        pathologistRegistration: currentLab.pathologistRegistration,
        technologistName: currentLab.technologistName,
        technologistQualification: currentLab.technologistQualification,
        licenseNumber: currentLab.licenseNumber,
        nablCertNumber: currentLab.nablCertNumber,
        taxId: currentLab.taxId || '',
        headerColor: currentLab.headerColor || '#0f172a',
      });
      setSavedSuccess(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Read-Only Notice for Staff */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Staff Role (Read-Only Mode):</span>
            <span className="ml-1">
              You are signed in with Staff privileges. Modifying official laboratory branding,
              signatory credentials, and tax settings requires Administrator authorization.
            </span>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: formData.headerColor || '#0f172a' }}
          >
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {formData.labName || currentLab.name}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {currentLab.code || 'LIMS'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Branding, letterhead colors, and medical accreditation for this laboratory tenant
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Reset Defaults
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to Firestore...</span>
                </>
              ) : savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved & Synchronized</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Lab Settings</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            Laboratory profile updated in Firestore! All new PDF diagnostic reports and invoices will now reflect these credentials.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Brand & Facility Identity */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Laboratory Branding & Facility Details
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Laboratory Title / Facility Name
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.labName}
                onChange={(e) => handleChange('labName', e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Specialty Tagline & Diagnostic Scope
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Facility Physical Address
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone(s)
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  disabled={!isAdmin}
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Web Portal URL
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Visual Styling & Letterhead Theme */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              PDF Letterhead & Theme Palette
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Header Accent Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_HEADER_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => handleChange('headerColor', preset.hex)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      formData.headerColor === preset.hex
                        ? 'border-blue-500 ring-2 ring-blue-500/30 bg-slate-50 dark:bg-slate-800'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shadow-xs shrink-0"
                      style={{ backgroundColor: preset.hex }}
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom Logo URL (Printed on Top Left of Report)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.logoUrl || ''}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Leaves empty to use standard crisp SVG clinical laboratory emblem.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Currency Symbol
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Applied across test catalog tariffs and invoices
                </p>
              </div>
              <input
                type="text"
                disabled={!isAdmin}
                maxLength={3}
                value={formData.currency || '₹'}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-16 text-center font-bold px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Regulatory Accreditations & Licenses */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Accreditations, Compliance & Tax IDs
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Accreditation Standards Headline
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.accreditationText}
                onChange={(e) => handleChange('accreditationText', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  NABL Certificate Number
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.nablCertNumber}
                  onChange={(e) => handleChange('nablCertNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Clinical License #
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GST / Corporate Tax Identification
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.taxId || ''}
                onChange={(e) => handleChange('taxId', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Authorized Medical Pathologist & Technologist */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Signatories & Digital Signature Credentials
            </h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Consultant Pathologist Name & Title
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.pathologistName}
                onChange={(e) => handleChange('pathologistName', e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pathologist Qualifications & Designations
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.pathologistQualification}
                onChange={(e) => handleChange('pathologistQualification', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Medical Council Registration #
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.pathologistRegistration}
                onChange={(e) => handleChange('pathologistRegistration', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Senior Technologist Name
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.technologistName}
                  onChange={(e) => handleChange('technologistName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Technologist Qualifications
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.technologistQualification}
                  onChange={(e) => handleChange('technologistQualification', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: PDF Print Adjustments & Calibration (Dual Mode: Digital + Pre-Printed) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-500/30 dark:border-blue-500/20 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    PDF Print Adjustments & Calibration Controls
                  </h3>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      calibrationTab === 'digital'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {calibrationTab === 'digital' ? 'Digital Letterhead Mode' : 'Pre-Printed Stationery Mode'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure UP/DOWN/LEFT/RIGHT position offsets and Investigation Table font size for both PDF options
                </p>
              </div>
            </div>

            {/* Tab Switcher & Top Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setCalibrationTab('digital')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    calibrationTab === 'digital'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Digital PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCalibrationTab('preprinted')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    calibrationTab === 'preprinted'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Pre-Printed PDF</span>
                </button>
              </div>

              {calibrationTab === 'digital' ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetDigital}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDigital}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Digital Settings</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleResetPrePrinted}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintTestGrid}
                    className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
                    title="Print 10mm metric calibration grid on your letterhead"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Test Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePrePrinted}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Stationery Settings</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Success Alerts */}
          {digitalSaved && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Digital Letterhead position offsets and font sizes saved successfully!</span>
            </div>
          )}

          {prePrintedSaved && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Pre-printed letterhead alignment offsets saved to this station!</span>
            </div>
          )}

          {/* Body based on Tab */}
          {calibrationTab === 'digital' ? (
            /* Digital Letterhead Adjustments */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
              {/* Directional Nudge Pad (5 cols) */}
              <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Full Report Position (UP/DOWN/LEFT/RIGHT)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setNudgeStep(1)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                        nudgeStep === 1
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      1 mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setNudgeStep(5)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                        nudgeStep === 5
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      5 mm
                    </button>
                  </div>
                </div>

                {/* D-Pad Buttons */}
                <div className="flex flex-col items-center justify-center py-2">
                  <button
                    type="button"
                    onClick={() => handleDigitalNudge('UP')}
                    title="Move report upwards on A4 page"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 hover:border-blue-300 shadow-xs active:scale-95 transition mb-1"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDigitalNudge('LEFT')}
                      title="Shift report left on A4 page"
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 hover:border-blue-300 shadow-xs active:scale-95 transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700/60 flex items-center justify-center text-[10px] font-mono font-bold text-blue-800 dark:text-blue-300">
                      PAD
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDigitalNudge('RIGHT')}
                      title="Shift report right on A4 page"
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 hover:border-blue-300 shadow-xs active:scale-95 transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDigitalNudge('DOWN')}
                    title="Move report downwards on A4 page"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 hover:border-blue-300 shadow-xs active:scale-95 transition mt-1"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Offset Metrics */}
                <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Vertical Offset (Top/Down):</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {(digitalConfig.topOffsetMm || 0) >= 0 ? `+${digitalConfig.topOffsetMm || 0}` : digitalConfig.topOffsetMm} mm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Horizontal Offset (Left/Right):</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {(digitalConfig.horizontalOffsetMm || 0) >= 0 ? `+${digitalConfig.horizontalOffsetMm || 0}` : digitalConfig.horizontalOffsetMm} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Digital Font Size and Sliders (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                {/* Investigation Table Font Size Control */}
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                          Investigation Section Font Size (Digital PDF)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Applies to Test Names, Results, Units & Biological Reference Ranges
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-blue-600 text-white font-mono font-bold text-xs shadow-xs">
                      {(digitalConfig.tableFontSizePt || 9.5).toFixed(1)} pt
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Stepper (+ / -) */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() =>
                          handleDigitalChange(
                            'tableFontSizePt',
                            Math.max(7.5, Math.round(((digitalConfig.tableFontSizePt || 9.5) - 0.5) * 10) / 10)
                          )
                        }
                        disabled={(digitalConfig.tableFontSizePt || 9.5) <= 7.5}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-100 hover:text-blue-700 disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Decrease font size (-0.5 pt)"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-1.5 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {(digitalConfig.tableFontSizePt || 9.5).toFixed(1)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDigitalChange(
                            'tableFontSizePt',
                            Math.min(13.0, Math.round(((digitalConfig.tableFontSizePt || 9.5) + 0.5) * 10) / 10)
                          )
                        }
                        disabled={(digitalConfig.tableFontSizePt || 9.5) >= 13.0}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-100 hover:text-blue-700 disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Increase font size (+0.5 pt)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1">
                      {[8.0, 9.0, 9.5, 10.5, 11.5, 12.5].map((sz) => {
                        const active = Math.abs((digitalConfig.tableFontSizePt || 9.5) - sz) < 0.2;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleDigitalChange('tableFontSizePt', sz)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              active
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {sz} pt
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="7.5"
                    max="13.0"
                    step="0.5"
                    value={digitalConfig.tableFontSizePt || 9.5}
                    onChange={(e) => handleDigitalChange('tableFontSizePt', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Digital Letterhead Design Guarantee:</span>
                  </div>
                  <p>
                    Long test names automatically wrap into 2 lines with increased row heights, keeping all text readable on standard A4 printing without altering the digital letterhead design.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Pre-Printed Letterhead Adjustments */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
              {/* Directional Nudge Pad (5 cols) */}
              <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Stationery Directional Nudge Pad
                    </span>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setNudgeStep(1)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                        nudgeStep === 1
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      1 mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setNudgeStep(5)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                        nudgeStep === 5
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      5 mm
                    </button>
                  </div>
                </div>

                {/* D-Pad Buttons */}
                <div className="flex flex-col items-center justify-center py-2">
                  <button
                    type="button"
                    onClick={() => handlePrePrintedNudge('UP')}
                    title="Move text upwards (reduce top margin)"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 hover:border-amber-300 shadow-xs active:scale-95 transition mb-1"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrePrintedNudge('LEFT')}
                      title="Shift text left"
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 hover:border-amber-300 shadow-xs active:scale-95 transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 flex items-center justify-center text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300">
                      ALIGN
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrePrintedNudge('RIGHT')}
                      title="Shift text right"
                      className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 hover:border-amber-300 shadow-xs active:scale-95 transition"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePrePrintedNudge('DOWN')}
                    title="Move text downwards (increase top clearance)"
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 hover:border-amber-300 shadow-xs active:scale-95 transition mt-1"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Offset Metrics */}
                <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Effective Top Clearance:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {Math.max(15, (prePrintedConfig.topMarginMm || 48) + (prePrintedConfig.headerSpaceOffsetMm || 0))} mm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Effective Left Margin:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {Math.max(5, (prePrintedConfig.leftMarginMm || 12) + (prePrintedConfig.horizontalOffsetMm || 0))} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Precision Parameter Sliders (7 cols) */}
              <div className="md:col-span-7 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Page 1 Top Clearance:
                      </label>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {prePrintedConfig.topMarginMm} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      step="1"
                      value={prePrintedConfig.topMarginMm}
                      onChange={(e) => handlePrePrintedChange('topMarginMm', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <span className="text-[10px] text-slate-400">Height of physical letterhead banner</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Bottom Clearance:
                      </label>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {prePrintedConfig.bottomMarginMm} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="1"
                      value={prePrintedConfig.bottomMarginMm}
                      onChange={(e) => handlePrePrintedChange('bottomMarginMm', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                    <span className="text-[10px] text-slate-400">Space for physical footer / stamp</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Left Margin:
                      </label>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {prePrintedConfig.leftMarginMm} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={prePrintedConfig.leftMarginMm}
                      onChange={(e) => handlePrePrintedChange('leftMarginMm', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Right Margin:
                      </label>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {prePrintedConfig.rightMarginMm} mm
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={prePrintedConfig.rightMarginMm}
                      onChange={(e) => handlePrePrintedChange('rightMarginMm', Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                  </div>
                </div>

                {/* Investigation Table Font Size Control */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Type className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                          Investigation Table Font Size (Stationery PDF)
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Applies to Test Names, Results, Units & Biological Reference Ranges
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-mono font-bold text-xs shadow-xs">
                      {(prePrintedConfig.tableFontSizePt || 9.5).toFixed(1)} pt
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Stepper (+ / -) */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() =>
                          handlePrePrintedChange(
                            'tableFontSizePt',
                            Math.max(7.5, Math.round(((prePrintedConfig.tableFontSizePt || 9.5) - 0.5) * 10) / 10)
                          )
                        }
                        disabled={(prePrintedConfig.tableFontSizePt || 9.5) <= 7.5}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Decrease font size (-0.5 pt)"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-1.5 font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                        {(prePrintedConfig.tableFontSizePt || 9.5).toFixed(1)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handlePrePrintedChange(
                            'tableFontSizePt',
                            Math.min(13.0, Math.round(((prePrintedConfig.tableFontSizePt || 9.5) + 0.5) * 10) / 10)
                          )
                        }
                        disabled={(prePrintedConfig.tableFontSizePt || 9.5) >= 13.0}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-100 hover:text-amber-700 disabled:opacity-30 disabled:pointer-events-none transition"
                        title="Increase font size (+0.5 pt)"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1">
                      {[8.0, 9.0, 9.5, 10.5, 11.5, 12.5].map((sz) => {
                        const active = Math.abs((prePrintedConfig.tableFontSizePt || 9.5) - sz) < 0.2;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handlePrePrintedChange('tableFontSizePt', sz)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold transition border ${
                              active
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {sz} pt
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <input
                    type="range"
                    min="7.5"
                    max="13.0"
                    step="0.5"
                    value={prePrintedConfig.tableFontSizePt || 9.5}
                    onChange={(e) => handlePrePrintedChange('tableFontSizePt', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                {/* Toggles */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prePrintedConfig.includeSignatures}
                      onChange={(e) => handlePrePrintedChange('includeSignatures', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Include Digital Signatures
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Uncheck to leave space for manual rubber stamp
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prePrintedConfig.includePatientBox}
                      onChange={(e) => handlePrePrintedChange('includePatientBox', e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Patient Demographics Box
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Draw clean rounded border around patient info
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};
