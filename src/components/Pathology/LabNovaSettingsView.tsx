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
} from 'lucide-react';
import { LabSettings } from '../../types';
import { DEFAULT_LAB_SETTINGS } from '../../data/pathologyTemplates';
import { saveLabSettingsToFirestore } from '../../services/pathologyFirebase';
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
      </div>
    </form>
  );
};
