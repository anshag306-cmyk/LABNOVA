import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Eye,
  Save,
  Check,
  Sparkles,
  ShieldCheck,
  Building,
  RefreshCw,
  Info,
  Layers,
  Award,
  Lock,
} from 'lucide-react';
import { LetterheadTemplate, LabSettings } from '../../types';
import { LETTERHEAD_TEMPLATES, getLetterheadTemplateById } from '../../data/letterheadTemplatesData';
import { LetterheadA4PreviewModal } from './LetterheadA4PreviewModal';
import { saveLabSettingsToFirestore } from '../../services/pathologyFirebase';
import { useAuth } from '../../context/AuthContext';

interface LetterheadTemplatesCatalogProps {
  currentSettings: LabSettings;
  onSettingsUpdated?: (newSettings: LabSettings) => void;
}

export const LetterheadTemplatesCatalog: React.FC<LetterheadTemplatesCatalogProps> = ({
  currentSettings,
  onSettingsUpdated,
}) => {
  const { currentLab, isAdmin } = useAuth();

  // Active saved template from current laboratory settings
  const activeTemplateId = currentSettings.letterheadTemplateId || 'classic_medical';

  // Currently selected template in UI (defaults to saved active template)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(activeTemplateId);

  // Preview Modal state
  const [previewTemplate, setPreviewTemplate] = useState<LetterheadTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Saving state & feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSaveSuccessMsg(null);
  };

  const handleOpenPreview = (template: LetterheadTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleSaveTemplate = async (templateIdToSave: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    try {
      const updatedSettings: LabSettings = {
        ...currentSettings,
        labId: currentLab.id,
        letterheadTemplateId: templateIdToSave,
      };

      await saveLabSettingsToFirestore(updatedSettings, currentLab.id);

      setSelectedTemplateId(templateIdToSave);
      setIsSaving(false);
      setSaveSuccessMsg('Letterhead saved successfully.');

      if (onSettingsUpdated) {
        onSettingsUpdated(updatedSettings);
      }

      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 4500);
    } catch (err: any) {
      console.error('Failed to save letterhead template:', err);
      setErrorMessage(err?.message || 'Failed to save letterhead to Firestore.');
      setIsSaving(false);
    }
  };

  const activeTemplateObj = getLetterheadTemplateById(activeTemplateId);
  const selectedTemplateObj = getLetterheadTemplateById(selectedTemplateId);

  return (
    <div className="space-y-6">
      {/* Read-Only Notice for Staff */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
          <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Staff Read-Only View:</span>
            <span className="ml-1">
              You can preview and inspect laboratory report letterheads. Changing the default letterhead template for{' '}
              <strong>{currentLab.name}</strong> requires Administrator privileges.
            </span>
          </div>
        </div>
      )}

      {/* Top Banner with Active Letterhead Status and Quick Save */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: activeTemplateObj.primaryColor }}
          >
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Official Report Letterhead Templates
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {currentLab.code || 'TENANT'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select and activate an accredited A4 pathology report template for <strong>{currentLab.name}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Current Active Letterhead:</span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1 justify-end">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: activeTemplateObj.primaryColor }}
              />
              <span>{activeTemplateObj.name}</span>
            </span>
          </div>

          {isAdmin && (
            <button
              id="btn-save-active-letterhead"
              type="button"
              disabled={isSaving || selectedTemplateId === activeTemplateId}
              onClick={() => handleSaveTemplate(selectedTemplateId)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${
                selectedTemplateId === activeTemplateId
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Selected Template</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div
          id="alert-letterhead-saved-success"
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span>{saveSuccessMsg}</span>
              <span className="font-normal block text-[11px] text-emerald-700 dark:text-emerald-400">
                "{selectedTemplateObj.name}" is now the active default letterhead for {currentLab.name}. All newly generated PDF reports will use this layout.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* Template Grid Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {LETTERHEAD_TEMPLATES.map((tmpl) => {
          const isActive = tmpl.id === activeTemplateId;
          const isSelected = tmpl.id === selectedTemplateId;

          return (
            <div
              key={tmpl.id}
              id={`letterhead-card-${tmpl.id}`}
              onClick={() => handleSelectTemplate(tmpl.id)}
              className={`rounded-3xl bg-white dark:bg-slate-900 border-2 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer shadow-xs hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : isActive
                  ? 'border-emerald-500/80 bg-emerald-50/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Card Header Status Bar */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: tmpl.primaryColor }}
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {tmpl.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isActive ? (
                    <span
                      id={`badge-active-${tmpl.id}`}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Active</span>
                    </span>
                  ) : isSelected ? (
                    <span
                      id={`badge-selected-${tmpl.id}`}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                    >
                      Currently Selected
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Visual Mini A4 Preview Sheet */}
              <div className="p-4 bg-slate-100/70 dark:bg-slate-950/60 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 relative group">
                <div className="w-full max-w-[280px] aspect-[210/297] bg-white rounded-lg shadow-md border border-slate-300 p-2.5 flex flex-col justify-between select-none text-[6px] transition-transform duration-200 group-hover:scale-[1.02]">
                  {/* Mini Template Specific Header */}
                  <div className="space-y-1">
                    {tmpl.id === 'modern_diagnostic' ? (
                      <div className="border-b border-sky-500 pb-1 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-sm bg-sky-600 text-white font-bold flex items-center justify-center text-[5px]">
                            +
                          </div>
                          <div>
                            <div className="font-bold text-[7px] text-slate-900 leading-none">
                              {currentSettings.labName || 'LAB NOVA'}
                            </div>
                            <div className="text-[4.5px] text-sky-700 font-semibold">DIGITAL DIAGNOSTICS</div>
                          </div>
                        </div>
                        <div className="px-1 py-0.2 rounded-xs bg-emerald-100 text-emerald-800 text-[4.5px] font-bold">
                          NABL ISO 15189
                        </div>
                      </div>
                    ) : tmpl.id === 'minimal_professional' ? (
                      <div className="border-b border-slate-900 pb-1 flex justify-between items-end">
                        <div>
                          <div className="font-serif font-bold text-[7px] text-slate-900 uppercase">
                            {currentSettings.labName || 'LAB NOVA'}
                          </div>
                          <div className="text-[4px] tracking-wider text-slate-500">CLINICAL PATHOLOGY</div>
                        </div>
                        <div className="text-[4.5px] font-mono text-slate-700">ISO 15189 CERT</div>
                      </div>
                    ) : tmpl.id === 'premium_laboratory' ? (
                      <div className="rounded-sm bg-indigo-950 text-white p-1 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400" />
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-400 font-bold text-[6px]">★</span>
                            <div className="font-bold text-[6.5px] text-white">
                              {currentSettings.labName || 'LAB NOVA'}
                            </div>
                          </div>
                          <span className="text-amber-300 text-[4px] font-bold">NABL SEAL</span>
                        </div>
                      </div>
                    ) : tmpl.id === 'clean_medical' ? (
                      <div className="border-t-2 border-emerald-600 border-b border-slate-200 py-0.5 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[4px]">
                            +
                          </div>
                          <div className="font-bold text-[6.5px] text-emerald-900">
                            {currentSettings.labName || 'LAB NOVA'}
                          </div>
                        </div>
                        <div className="px-1 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[4px] font-bold">
                          ACCREDITED
                        </div>
                      </div>
                    ) : tmpl.id === 'corporate_lab' ? (
                      <div className="space-y-0.5">
                        <div className="bg-blue-900 text-white px-1 py-0.5 rounded-xs flex justify-between text-[4.5px] font-bold">
                          <span>ENTERPRISE LAB</span>
                          <span>ISO 15189</span>
                        </div>
                        <div className="flex justify-between text-[6px] font-bold text-slate-900">
                          <span>{currentSettings.labName || 'LAB NOVA NETWORK'}</span>
                          <span className="text-[4.5px] font-mono">LIC #{currentSettings.licenseNumber || 'DL-894'}</span>
                        </div>
                      </div>
                    ) : tmpl.id === 'modern_medical' ? (
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-1 rounded-sm flex justify-between items-center">
                        <div className="font-bold text-[6.5px] uppercase">{currentSettings.labName || 'LAB NOVA'}</div>
                        <div className="text-[4px] bg-white/20 px-1 rounded-xs">NABL ISO</div>
                      </div>
                    ) : (
                      /* Classic Medical */
                      <div className="bg-slate-900 text-white p-1 rounded-xs flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[4px]">
                            +
                          </div>
                          <div>
                            <div className="font-bold text-[6.5px] text-white uppercase">
                              {currentSettings.labName || 'LAB NOVA'}
                            </div>
                            <div className="text-[4px] text-slate-300">DIAGNOSTIC PATHOLOGY</div>
                          </div>
                        </div>
                        <div className="text-[4px] font-bold text-emerald-400 bg-slate-800 px-1 py-0.5 rounded-xs">
                          NABL ACCREDITED
                        </div>
                      </div>
                    )}

                    {/* Mini Patient Details Box */}
                    <div className="bg-slate-50 border border-slate-200 p-1 rounded-xs space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>Sunita Sharma (42Y / F)</span>
                        <span className="font-mono text-blue-600">UHID-89421</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[5px]">
                        <span>Ref: Dr. Rajesh Sharma</span>
                        <span>Specimen: Blood</span>
                      </div>
                    </div>

                    {/* Mini Table Rows */}
                    <div className="space-y-0.5 pt-0.5">
                      <div
                        className="text-white px-1 py-0.5 rounded-xs flex justify-between font-bold text-[5px]"
                        style={{ backgroundColor: tmpl.primaryColor }}
                      >
                        <span>TEST NAME</span>
                        <span>RESULT</span>
                        <span>REF. RANGE</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-100 text-slate-700">
                        <span className="font-semibold">Hemoglobin (Hb)</span>
                        <span className="font-bold text-blue-600">10.8 g/dL</span>
                        <span className="text-slate-400">12.0 - 15.5</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-100 text-slate-700">
                        <span className="font-semibold">Total RBC Count</span>
                        <span className="font-bold text-blue-600">3.92 mil</span>
                        <span className="text-slate-400">4.0 - 5.2</span>
                      </div>
                      <div className="flex justify-between py-0.5 border-b border-slate-100 text-slate-700">
                        <span className="font-semibold">ESR (Westergren)</span>
                        <span className="font-bold text-amber-600">32 mm/hr</span>
                        <span className="text-slate-400">0 - 20</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Dual Signatures */}
                  <div className="pt-1 border-t border-slate-200 flex justify-between items-end text-[4.5px] text-slate-500">
                    <div>
                      <div className="font-bold text-slate-800">MLT Analyst</div>
                      <div>Verified</div>
                    </div>
                    <div className="text-center font-mono text-emerald-600 text-[4px] font-bold">
                      [QR VERIFIED]
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">Chief Pathologist</div>
                      <div>MD (Pathology)</div>
                    </div>
                  </div>
                </div>

                {/* Hover overlay with Quick Preview button */}
                <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleOpenPreview(tmpl, e)}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1.5 hover:bg-slate-100 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Full A4 Preview</span>
                  </button>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {tmpl.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {tmpl.description}
                  </p>

                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                      Key Layout Features:
                    </span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      {tmpl.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Actions: Preview, Select, Save */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    id={`btn-preview-${tmpl.id}`}
                    type="button"
                    onClick={(e) => handleOpenPreview(tmpl, e)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    <span>Preview</span>
                  </button>

                  <button
                    id={`btn-select-${tmpl.id}`}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Selected' : 'Select'}</span>
                  </button>

                  {isAdmin && (
                    <button
                      id={`btn-save-${tmpl.id}`}
                      type="button"
                      disabled={isSaving || isActive}
                      onClick={(e) => handleSaveTemplate(tmpl.id, e)}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 ${
                        isActive
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90'
                      }`}
                      title={isActive ? 'Currently active letterhead' : 'Save as active letterhead for this lab'}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-size A4 Preview Modal */}
      {isPreviewOpen && previewTemplate && (
        <LetterheadA4PreviewModal
          template={previewTemplate}
          settings={currentSettings}
          isActive={previewTemplate.id === activeTemplateId}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewTemplate(null);
          }}
          onSelectAndSave={isAdmin ? (id) => handleSaveTemplate(id) : undefined}
        />
      )}
    </div>
  );
};
