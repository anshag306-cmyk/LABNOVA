import React, { useState } from 'react';
import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Filter,
  FlaskConical,
  Layers,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Thermometer,
  User,
  X,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { generateAIProtocol } from '../../services/geminiService';
import { Protocol } from '../../types';
import { ProtocolRunnerModal } from './ProtocolRunnerModal';

export const ProtocolLibrary: React.FC<{
  onStartExperimentWithProtocol?: (protocol: Protocol) => void;
}> = ({ onStartExperimentWithProtocol }) => {
  const { protocols, addProtocol, addAuditLog } = useLab();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedProtocolId, setExpandedProtocolId] = useState<string | null>(protocols[0]?.id || null);

  // Active Runner Modal
  const [runningProtocol, setRunningProtocol] = useState<Protocol | null>(null);

  // AI Generator Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiGoal, setAiGoal] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [aiOrganism, setAiOrganism] = useState('');
  const [aiSampleType, setAiSampleType] = useState('');
  const [aiEquipment, setAiEquipment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const filteredProtocols = protocols.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reagents.some((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleGenerateProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiGoal.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const res = await generateAIProtocol({
        title: aiTitle.trim() || aiGoal.slice(0, 45),
        goal: aiGoal.trim(),
        organism: aiOrganism.trim(),
        sampleType: aiSampleType.trim(),
        equipment: aiEquipment.trim(),
      });

      addProtocol(res.protocol);
      setExpandedProtocolId(res.protocol.id);
      setIsAiModalOpen(false);
      // Reset form
      setAiGoal('');
      setAiTitle('');
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || 'Protocol generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & AI Protocol Generator Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Standard Operating Procedures (SOP) Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Validated experimental workflows, step-by-step timers, and AI automated protocol authoring.
          </p>
        </div>

        <button
          id="btn-ai-gen-protocol"
          onClick={() => setIsAiModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>AI Protocol Architect</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search protocols by title, reagents, or application..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            <option value="molecular_biology">Molecular Biology</option>
            <option value="genomics">Genomics</option>
            <option value="analytical_chemistry">Analytical Chemistry</option>
            <option value="cell_culture">Cell Culture</option>
            <option value="biochemistry">Biochemistry</option>
          </select>
        </div>
      </div>

      {/* Protocol List */}
      <div className="space-y-4">
        {filteredProtocols.map((protocol) => {
          const isExpanded = expandedProtocolId === protocol.id;

          return (
            <div
              key={protocol.id}
              id={`protocol-card-${protocol.id}`}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all"
            >
              {/* Header row */}
              <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {protocol.id}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      v{protocol.version}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Author: {protocol.author}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {protocol.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                    {protocol.summary}
                  </p>
                </div>

                <div className="flex items-center space-x-2 pt-2 sm:pt-0">
                  <button
                    onClick={() => setRunningProtocol(protocol)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Protocol</span>
                  </button>

                  <button
                    onClick={() =>
                      setExpandedProtocolId(isExpanded ? null : protocol.id)
                    }
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                    title={isExpanded ? 'Collapse SOP' : 'Expand SOP Details'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Protocol Details */}
              {isExpanded && (
                <div className="px-5 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-5 bg-slate-50/50 dark:bg-slate-800/20">
                  {/* Meta overview bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Est. Duration</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                        {protocol.estimatedDurationMinutes} minutes
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Steps Count</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                        {(protocol.steps || []).length} sequential steps
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Required PPE</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                        {(protocol.ppeRequired || []).join(', ')}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Reagents</span>
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                        {(protocol.reagents || []).length} verified items
                      </span>
                    </div>
                  </div>

                  {/* Reagents Table */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                      Master Reagents & Buffers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(protocol.reagents || []).map((r, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {r.name}
                          </span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                            {r.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step list overview */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                      Procedural Step Outline
                    </h3>
                    <div className="space-y-2">
                      {(protocol.steps || []).map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {s.stepNumber}. {s.title}
                            </span>
                            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                              {s.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                            {s.temperature && <span>{s.temperature}</span>}
                            <span>•</span>
                            <span>{s.durationMinutes} min</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Protocol Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Generate Scientific Protocol with Gemini AI
                </h2>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Describe your target assay or scientific objective. LabNova AI will architect the complete step-by-step SOP with reagents, temperatures, checkpoints, and troubleshooting advice.
            </p>

            {generationError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-700 text-xs">
                {generationError}
              </div>
            )}

            <form onSubmit={handleGenerateProtocol} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Experimental Goal / Target Assay:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Purify recombinant His-tagged GFP from BL21 E. coli using Ni-NTA affinity chromatography and desalting column..."
                  value={aiGoal}
                  onChange={(e) => setAiGoal(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Protocol Title (optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ni-NTA Agarose Purification of His-Tagged Proteins"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Organism / Cell System:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. E. coli BL21(DE3)"
                    value={aiOrganism}
                    onChange={(e) => setAiOrganism(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Sample Type:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bacterial Cell Pellet"
                    value={aiSampleType}
                    onChange={(e) => setAiSampleType(e.target.value)}
                    className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Equipment Available:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sonicator, Refrigerated Benchtop Centrifuge, Gravity Columns"
                  value={aiEquipment}
                  onChange={(e) => setAiEquipment(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {isGenerating && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isGenerating ? 'Architecting Protocol...' : 'Generate SOP'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Protocol Runner Execution Modal */}
      <ProtocolRunnerModal
        protocol={runningProtocol}
        isOpen={Boolean(runningProtocol)}
        onClose={() => setRunningProtocol(null)}
        onConvertToExperiment={(proto) => {
          if (onStartExperimentWithProtocol) {
            onStartExperimentWithProtocol(proto);
          }
        }}
      />
    </div>
  );
};
