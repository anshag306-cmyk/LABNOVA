import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Beaker,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  Send,
  ShieldAlert,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import {
  checkChemicalSafety,
  generateAIProtocol,
  runAITroubleshooter,
} from '../../services/geminiService';

export const AiAssistantModal: React.FC = () => {
  const {
    isAiModalOpen,
    closeAiAssistant,
    aiModalInitialMode,
    aiModalContextData,
    addProtocol,
  } = useLab();

  const [mode, setMode] = useState<'troubleshoot' | 'chemical-safety' | 'protocol-gen'>('troubleshoot');

  // Input fields for Troubleshoot
  const [technique, setTechnique] = useState('Agarose Gel Electrophoresis / PCR');
  const [symptom, setSymptom] = useState('Smeary bands and no distinct amplicon visible at expected 1.2 kb size');
  const [conditions, setConditions] = useState('Taq DNA Polymerase, 55°C annealing temp, 35 cycles, 1% agarose in 1X TAE');

  // Input fields for Chemical Safety
  const [chemicalList, setChemicalList] = useState('Ethanol (95%), Bleach (Sodium Hypochlorite 5%), Glacial Acetic Acid');
  const [reactionContext, setReactionContext] = useState('Surface decontamination and organic solvent waste neutralization');

  // Input fields for Protocol Gen
  const [protocolGoal, setProtocolGoal] = useState('Isolate high-purity total RNA from mammalian fibroblast cell line using spin columns');

  // Results & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (aiModalInitialMode) {
      setMode(aiModalInitialMode);
    }
    if (aiModalContextData) {
      if (aiModalInitialMode === 'chemical-safety' && aiModalContextData.reagent) {
        setChemicalList(aiModalContextData.reagent);
        setReactionContext(`Handling and storage safety for ${aiModalContextData.reagent} (CAS: ${aiModalContextData.casNumber || 'N/A'})`);
      }
    }
  }, [aiModalInitialMode, aiModalContextData]);

  if (!isAiModalOpen) return null;

  const handleTroubleshoot = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await runAITroubleshooter({
        assayType: technique,
        symptoms: symptom,
        experimentalConditions: conditions,
        observedData: 'Smearing / low fidelity band',
      });
      setResult(data.diagnosis);
    } catch (err: any) {
      setError(err.message || 'Troubleshooting consultation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChemicalSafety = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const chemicals = chemicalList
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const data = await checkChemicalSafety(chemicals);
      setResult(data.safety);
    } catch (err: any) {
      setError(err.message || 'Reactivity analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProtocolGen = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateAIProtocol({
        title: protocolGoal.slice(0, 45),
        goal: protocolGoal,
      });
      setResult(data.protocol);
      addProtocol(data.protocol);
    } catch (err: any) {
      setError(err.message || 'Protocol generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                LabNova AI Research Copilot
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Specialized in assay troubleshooting, GHS chemical compatibility, and validated protocol authoring.
              </p>
            </div>
          </div>

          <button
            onClick={closeAiAssistant}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setMode('troubleshoot');
              setResult(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mode === 'troubleshoot'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Assay Troubleshooter</span>
          </button>

          <button
            onClick={() => {
              setMode('chemical-safety');
              setResult(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mode === 'chemical-safety'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Chemical Reactivity & Safety</span>
          </button>

          <button
            onClick={() => {
              setMode('protocol-gen');
              setResult(null);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              mode === 'protocol-gen'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Protocol Architect</span>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Form per Mode */}
        {mode === 'troubleshoot' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Laboratory Technique / Assay:
              </label>
              <input
                type="text"
                value={technique}
                onChange={(e) => setTechnique(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Observed Symptom / Anomaly:
              </label>
              <input
                type="text"
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Experimental Conditions & Reagents Used:
              </label>
              <textarea
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleTroubleshoot}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Diagnosing Root Cause...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Run AI Diagnostic</span>
                </>
              )}
            </button>
          </div>
        )}

        {mode === 'chemical-safety' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Chemicals to Combine or Handle (comma-separated):
              </label>
              <input
                type="text"
                value={chemicalList}
                onChange={(e) => setChemicalList(e.target.value)}
                placeholder="e.g. Bleach, Ammonia, Isopropanol"
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Planned Procedure / Context:
              </label>
              <textarea
                rows={2}
                value={reactionContext}
                onChange={(e) => setReactionContext(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleChemicalSafety}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Incompatibilities...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Evaluate Chemical Safety</span>
                </>
              )}
            </button>
          </div>
        )}

        {mode === 'protocol-gen' && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Experimental Goal & Target Workflow:
              </label>
              <textarea
                rows={3}
                value={protocolGoal}
                onChange={(e) => setProtocolGoal(e.target.value)}
                placeholder="e.g. Purify plasmid DNA from 5 mL overnight bacterial culture with 260/280 > 1.8..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleProtocolGen}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Architecting Protocol...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Generate Validated SOP</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Presentation */}
        {result && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>AI Scientific Synthesis Result</span>
              </span>

              <button
                onClick={handleCopyResult}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* If Diagnosis */}
            {mode === 'troubleshoot' && result.primaryDiagnosis && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block uppercase">
                    Primary Diagnosis ({result.confidence}% Confidence):
                  </span>
                  <span className="text-sm font-bold text-emerald-950 dark:text-emerald-100 mt-0.5 block">
                    {result.primaryDiagnosis}
                  </span>
                </div>

                {Array.isArray(result.rootCauses) && result.rootCauses.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Probable Root Causes:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {result.rootCauses.map((c: string, i: number) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.actionableSteps) && result.actionableSteps.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Corrective Actions & Protocol Adjustments:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {result.actionableSteps.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.preventativeMeasures) && result.preventativeMeasures.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Preventative Good Laboratory Practices (GLP):
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {result.preventativeMeasures.join(' • ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* If Chemical Safety */}
            {mode === 'chemical-safety' && result.dangerLevel && (
              <div className="space-y-3 text-xs">
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    result.dangerLevel === 'Low'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                      : 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold block">
                        {result.compatibilityRating}
                      </span>
                      <span className="text-[11px] opacity-90">{result.reactionHazard}</span>
                    </div>
                  </div>
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-white/70 dark:bg-black/40">
                    {result.dangerLevel}
                  </span>
                </div>

                {Array.isArray(result.ghsClassification) && result.ghsClassification.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                      GHS Classifications:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {result.ghsClassification.map((g: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border text-slate-800 dark:text-slate-200">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(result.ppeRecommendations) && result.ppeRecommendations.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Required PPE:
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                      {result.ppeRecommendations.map((p: string, i: number) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.disposalWasteStream && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                      Disposal & Waste Stream:
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border">
                      {result.disposalWasteStream}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* If Protocol Generated */}
            {mode === 'protocol-gen' && result.title && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    Protocol Created & Registered to SOP Library!
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">
                    "{result.title}" (ID: {result.id}, {result.steps?.length} steps, ~{result.estimatedDurationMinutes} min)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
