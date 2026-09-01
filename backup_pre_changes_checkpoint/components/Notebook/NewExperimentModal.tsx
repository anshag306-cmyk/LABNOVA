import React, { useState } from 'react';
import { FlaskConical, Layers, Plus, X } from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { Experiment, Protocol } from '../../types';

export const NewExperimentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newId: string) => void;
}> = ({ isOpen, onClose, onCreated }) => {
  const { protocols, addExperiment } = useLab();

  const [title, setTitle] = useState('');
  const [projectCode, setProjectCode] = useState('NOVA-RES-01');
  const [scientist, setScientist] = useState('Dr. Elena Rostova');
  const [category, setCategory] = useState('Molecular Biology');
  const [hypothesis, setHypothesis] = useState('');
  const [tagsInput, setTagsInput] = useState('In Vitro, Assay, Primary Study');
  const [selectedProtocolId, setSelectedProtocolId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let initialSteps = [];
    let initialReagents = [];

    if (selectedProtocolId) {
      const templateProto = protocols.find((p) => p.id === selectedProtocolId);
      if (templateProto) {
        initialSteps = templateProto.steps.map((s) => ({
          ...s,
          completed: false,
        }));
        initialReagents = templateProto.reagents;
      }
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const created = addExperiment({
      title: title.trim(),
      projectCode: projectCode.trim(),
      scientist: scientist.trim(),
      category: category.trim(),
      hypothesis: hypothesis.trim(),
      tags,
      protocolId: selectedProtocolId || undefined,
      protocolSteps: initialSteps,
      reagents: initialReagents,
      status: 'in_progress',
    });

    onCreated(created.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Initiate New Research Experiment
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Experiment Title:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Western Blot Quantitation of p-AKT in HEK293T Cells"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Project Code:
              </label>
              <input
                type="text"
                required
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Lead Scientist / Operator:
              </label>
              <input
                type="text"
                required
                value={scientist}
                onChange={(e) => setScientist(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Scientific Discipline:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Molecular Biology">Molecular Biology</option>
                <option value="Genomics & Sequencing">Genomics & Sequencing</option>
                <option value="Analytical Chemistry">Analytical Chemistry</option>
                <option value="Cell Biology">Cell Biology</option>
                <option value="Biochemistry & Kinetics">Biochemistry & Kinetics</option>
                <option value="Pharmacology">Pharmacology</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Protocol SOP Template:
              </label>
              <select
                value={selectedProtocolId}
                onChange={(e) => setSelectedProtocolId(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Blank (Manual Steps) --</option>
                {protocols.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (v{p.version})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Hypothesis & Core Objective:
            </label>
            <textarea
              rows={3}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="State the measurable hypothesis, target significance criteria, and experimental controls..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Tags (comma-separated):
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="CRISPR, Western Blot, HPLC, Kinetics"
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              Create Experiment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
