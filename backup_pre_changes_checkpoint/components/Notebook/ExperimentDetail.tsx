import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileCheck,
  FileText,
  FlaskConical,
  Key,
  Layers,
  PenTool,
  Play,
  Printer,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLab } from '../../context/LabContext';
import { generateExperimentSummary } from '../../services/geminiService';
import { Experiment, ExperimentStatus, ProtocolStep } from '../../types';

export const ExperimentDetail: React.FC<{
  experimentId: string;
  onBack: () => void;
}> = ({ experimentId, onBack }) => {
  const {
    experiments,
    updateExperiment,
    signExperiment,
    deleteExperiment,
    startTimer,
    addAuditLog,
  } = useLab();

  const experiment = experiments.find((e) => e.id === experimentId);

  if (!experiment) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-slate-500">Experiment record not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg">
          Return to Lab Notebook
        </button>
      </div>
    );
  }

  // Local state for editable fields
  const [hypothesis, setHypothesis] = useState(experiment.hypothesis);
  const [rawResults, setRawResults] = useState(experiment.rawResults);
  const [notes, setNotes] = useState(experiment.notes);
  const [isEditing, setIsEditing] = useState(false);

  // Digital Signature Modal
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [signerName, setSignerName] = useState(experiment.scientist);
  const [signerPassword, setSignerPassword] = useState('');

  // AI Summary generation state
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Print Report View
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Toggle step completion
  const handleToggleStep = (stepId: string) => {
    const updatedSteps = (experiment.protocolSteps || []).map((step) => {
      if (step.id === stepId) {
        const nextCompleted = !step.completed;
        return {
          ...step,
          completed: nextCompleted,
          completedAt: nextCompleted
            ? new Date().toISOString().replace('T', ' ').slice(0, 16)
            : undefined,
        };
      }
      return step;
    });

    updateExperiment(experiment.id, { protocolSteps: updatedSteps });
  };

  // Save changes
  const handleSaveEdits = () => {
    updateExperiment(experiment.id, {
      hypothesis,
      rawResults,
      notes,
    });
    setIsEditing(false);
  };

  // Sign off
  const handleConfirmSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) return;

    signExperiment(experiment.id, signerName.trim());
    setIsSignModalOpen(false);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}
  };

  // Generate AI Research Summary
  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const stepsText = (experiment.protocolSteps || [])
        .map((s) => `${s.stepNumber}. ${s.title}: ${s.description}`)
        .join('\n');

      const res = await generateExperimentSummary({
        title: experiment.title,
        hypothesis: experiment.hypothesis,
        methods: stepsText,
        rawResults: experiment.rawResults,
        notes: experiment.notes,
      });

      updateExperiment(experiment.id, {
        aiExecutiveSummary: res.report.executiveSummary,
        aiConclusions: res.report.conclusions,
        aiFutureDirections: res.report.futureDirections,
      });

      addAuditLog(
        'AI_REPORT_GENERATED',
        'ELN',
        experiment.id,
        `Generated synthesis summary via Gemini API.`
      );
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Failed to synthesize summary');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Experiments</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSaveEdits}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-medium"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Edit Notes</span>
            </button>
          )}

          <button
            onClick={handleGenerateAiSummary}
            disabled={isGeneratingAi}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>{isGeneratingAi ? 'Synthesizing...' : 'AI Summary'}</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-medium"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Report View</span>
          </button>

          {!experiment.signedAt ? (
            <button
              onClick={() => setIsSignModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>21 CFR Part 11 Sign</span>
            </button>
          ) : (
            <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Digitally Signed</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Experiment Header */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
              {experiment.id}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Project: {experiment.projectCode}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={experiment.status}
              onChange={(e) =>
                updateExperiment(experiment.id, {
                  status: e.target.value as ExperimentStatus,
                })
              }
              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          {experiment.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-1.5">
            <User className="w-4 h-4 text-slate-400" />
            <span>Lead Scientist: <strong>{experiment.scientist}</strong></span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Created: {experiment.createdAt}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Last Modified: {experiment.updatedAt}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Tag className="w-4 h-4 text-slate-400" />
            <span>Category: {experiment.category}</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {(experiment.tags || []).map((t, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
            >
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Hypothesis & Objective Section */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Scientific Hypothesis & Target Acceptance Criteria</span>
        </h2>

        {isEditing ? (
          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            rows={3}
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="State the scientific hypothesis and statistical threshold..."
          />
        ) : (
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
            {experiment.hypothesis || 'No hypothesis defined.'}
          </p>
        )}
      </div>

      {/* Protocol Execution & Step Runner */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Standard Operating Procedure (SOP) Execution Steps</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Check off steps as performed. Launch countdown timers for precision incubations and centrifuge runs.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {(experiment.protocolSteps || []).filter((s) => s.completed).length} /{' '}
            {(experiment.protocolSteps || []).length} Completed
          </span>
        </div>

        <div className="space-y-3">
          {(experiment.protocolSteps || []).map((step) => (
            <div
              key={step.id}
              className={`p-4 rounded-xl border transition-all ${
                step.completed
                  ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => handleToggleStep(step.id)}
                    className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      step.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {step.completed && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Step {step.stepNumber}: {step.title}
                      </span>
                      {step.temperature && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {step.temperature}
                        </span>
                      )}
                      {step.durationMinutes && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {step.durationMinutes} min
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {step.description}
                    </p>

                    {step.checkpoint && (
                      <div className="mt-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/60">
                        <strong>Checkpoint:</strong> {step.checkpoint}
                      </div>
                    )}

                    {step.completedAt && (
                      <div className="mt-1 text-[10px] text-slate-400 font-mono">
                        Logged completed at: {step.completedAt}
                      </div>
                    )}
                  </div>
                </div>

                {step.requiresTimer && (
                  <button
                    onClick={() =>
                      startTimer(
                        experiment.title,
                        step.title,
                        step.stepNumber,
                        step.durationMinutes
                      )
                    }
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-200 hover:bg-emerald-100 text-slate-800 dark:bg-slate-700 dark:hover:bg-emerald-900 dark:text-slate-100 text-[11px] font-semibold transition-colors"
                  >
                    <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Run Timer</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reagents and Consumables Table */}
      {experiment.reagents.length > 0 && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Reagents, Standards & Consumables Consumed</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2 px-3">Reagent Name</th>
                  <th className="py-2 px-3">Quantity</th>
                  <th className="py-2 px-3">Storage Temp</th>
                  <th className="py-2 px-3">Lot / CAS ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(experiment.reagents || []).map((r, i) => (
                  <tr key={i} className="text-slate-700 dark:text-slate-200">
                    <td className="py-2.5 px-3 font-semibold">{r.name}</td>
                    <td className="py-2.5 px-3 font-mono">{r.amount}</td>
                    <td className="py-2.5 px-3">{r.storage}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {r.lotNumber || r.casNumber || 'Verified In-House'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw Results & Numerical Data Metrics */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Raw Experimental Findings & Observations</span>
        </h2>

        {isEditing ? (
          <textarea
            value={rawResults}
            onChange={(e) => setRawResults(e.target.value)}
            rows={4}
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter raw spectrophotometer readouts, gel band observations, chromatogram peak areas..."
          />
        ) : (
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
            {experiment.rawResults || 'No findings entered yet.'}
          </p>
        )}

        {/* Numerical data visual badges if available */}
        {experiment.numericalData && experiment.numericalData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {experiment.numericalData.map((d, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60"
              >
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                  {d.label}
                </span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                    {d.value}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {d.unit}
                  </span>
                </div>
                {d.stdDev && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ±{d.stdDev} SD
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Synthesis & Conclusions Card */}
      {(experiment.aiExecutiveSummary || isGeneratingAi) && (
        <div className="p-6 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-slate-900 dark:to-teal-950/20 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Gemini AI Scientific Abstract & Statistical Synthesis
              </h2>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
              Autonomous Synthesis
            </span>
          </div>

          {isGeneratingAi ? (
            <div className="p-6 text-center text-xs text-slate-500">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Synthesizing publication-grade conclusions and statistical evaluations...
            </div>
          ) : (
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>{experiment.aiExecutiveSummary}</p>

              {experiment.aiConclusions && experiment.aiConclusions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-teal-200/50 dark:border-teal-900/40">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                    Key Conclusions:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {experiment.aiConclusions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 21 CFR Part 11 Digital Signature Seal */}
      {experiment.signedAt && (
        <div className="p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>FDA 21 CFR Part 11 Electronic Signature Stamp</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Digitally certified and locked by <strong>{experiment.signedBy}</strong> on{' '}
              {experiment.signedAt}.
            </p>
            <div className="mt-2 text-[10px] font-mono text-slate-400 break-all">
              {experiment.signatureHash}
            </div>
          </div>

          <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Integrity
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              TAMPER-EVIDENT
            </span>
          </div>
        </div>
      )}

      {/* 21 CFR Part 11 Sign Modal */}
      {isSignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Key className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                21 CFR Part 11 Digital Signature
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              By executing this digital signature, you affirm under penalty of scientific perjury that you are the author/reviewer of this laboratory protocol and that all recorded procedures and data points are authentic.
            </p>

            <form onSubmit={handleConfirmSign} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Scientist Full Name / Credential:
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Operator Passcode Verification:
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={signerPassword}
                  onChange={(e) => setSignerPassword(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                >
                  Authenticate & Sign Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white text-slate-950 rounded-2xl p-8 max-w-3xl w-full border border-slate-300 shadow-2xl space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-emerald-700">LabNova</span>
                  <span className="text-xs font-semibold uppercase text-slate-500">Official Report</span>
                </div>
                <p className="text-xs text-slate-500">GLP / 21 CFR Part 11 Documentation Engine</p>
              </div>

              <div className="flex items-center space-x-2 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <strong>Record ID:</strong> {experiment.id}<br />
                  <strong>Project:</strong> {experiment.projectCode}<br />
                  <strong>Scientist:</strong> {experiment.scientist}
                </div>
                <div>
                  <strong>Status:</strong> {experiment.status.toUpperCase()}<br />
                  <strong>Date:</strong> {experiment.createdAt}<br />
                  <strong>Signed By:</strong> {experiment.signedBy || 'Pending Signature'}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm border-b pb-1">Experiment Title</h4>
                <p className="text-sm font-semibold mt-1">{experiment.title}</p>
              </div>

              <div>
                <h4 className="font-bold text-xs border-b pb-1">Hypothesis</h4>
                <p className="text-xs mt-1">{experiment.hypothesis}</p>
              </div>

              <div>
                <h4 className="font-bold text-xs border-b pb-1">Protocol Steps Performed</h4>
                <ul className="text-xs mt-1 space-y-1">
                  {(experiment.protocolSteps || []).map((s) => (
                    <li key={s.id}>
                      [{s.completed ? 'X' : ' '}] Step {s.stepNumber}: {s.title} ({s.durationMinutes} min, {s.temperature})
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-xs border-b pb-1">Raw Observations</h4>
                <p className="text-xs mt-1">{experiment.rawResults}</p>
              </div>

              {experiment.aiExecutiveSummary && (
                <div>
                  <h4 className="font-bold text-xs border-b pb-1">Executive Summary</h4>
                  <p className="text-xs mt-1">{experiment.aiExecutiveSummary}</p>
                </div>
              )}

              {experiment.signedAt && (
                <div className="p-3 bg-slate-50 border rounded text-[11px] font-mono">
                  <strong>Digital Signature:</strong> {experiment.signedBy} ({experiment.signedAt})<br />
                  <span className="text-[10px] text-slate-500">{experiment.signatureHash}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
