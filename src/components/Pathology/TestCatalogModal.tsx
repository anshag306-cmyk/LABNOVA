import React, { useState } from 'react';
import { X, BookOpen, Plus, Tag, Clock, FlaskConical, CheckCircle2 } from 'lucide-react';
import { TestTemplate, PathologyCategory } from '../../types';
import { DEFAULT_TEST_TEMPLATES } from '../../data/pathologyTemplates';
import { addTestTemplateToFirestore } from '../../services/pathologyFirebase';

interface TestCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates?: TestTemplate[];
  onTemplateAdded?: (tmpl: TestTemplate) => void;
}

export const TestCatalogModal: React.FC<TestCatalogModalProps> = ({
  isOpen,
  onClose,
  templates = DEFAULT_TEST_TEMPLATES,
  onTemplateAdded,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTemplate, setActiveTemplate] = useState<TestTemplate>(templates[0]);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Test Form State
  const [newTestCode, setNewTestCode] = useState('');
  const [newTestName, setNewTestName] = useState('');
  const [newCategory, setNewCategory] = useState<PathologyCategory>('Biochemistry');
  const [newSampleType, setNewSampleType] = useState('Serum (3 ml)');
  const [newPrice, setNewPrice] = useState(450);
  const [newTatHours, setNewTatHours] = useState(4);
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'All',
    'Hematology',
    'Biochemistry',
    'Microbiology',
    'Molecular Diagnostics',
    'Endocrinology',
    'Infectious Diseases',
    'Serology',
    'Immunology',
    'Coagulation',
    'Clinical Pathology',
  ];

  const filteredTemplates = templates.filter((t) =>
    selectedCategory === 'All' ? true : t.category === selectedCategory
  );

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestCode || !newTestName) return;

    setIsSubmitting(true);
    try {
      const templateData: Omit<TestTemplate, 'id'> = {
        testCode: newTestCode.toUpperCase(),
        testName: newTestName,
        category: newCategory,
        sampleType: newSampleType,
        price: Number(newPrice),
        tatHours: Number(newTatHours),
        parameters: [
          {
            id: `p-${Date.now()}-1`,
            name: `${newTestName} Level`,
            unit: 'mg/dL',
            refRangeText: 'Normal range standard',
            method: 'Automated Assay',
          },
        ],
      };

      if (newDescription.trim()) {
        templateData.description = newDescription.trim();
      }

      const saved = await addTestTemplateToFirestore(templateData);
      if (onTemplateAdded) onTemplateAdded(saved);
      setIsAddingNew(false);
      setActiveTemplate(saved);
    } catch (err) {
      console.error('Failed to add template:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Pathology Test Catalog & Reference Intervals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Accredited diagnostic panels, sample specimen requirements & standard tariffs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingNew ? 'View Catalog' : 'Add Custom Test'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        {!isAddingNew && (
          <div className="px-6 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto bg-slate-50/30 dark:bg-slate-900">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        {isAddingNew ? (
          <form onSubmit={handleCreateTest} className="overflow-y-auto p-6 space-y-4 flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Define New Diagnostic Procedure or Panel
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VITD-01"
                  value={newTestCode}
                  onChange={(e) => setNewTestCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono uppercase text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test / Panel Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vitamin D (25-OH) Total"
                  value={newTestName}
                  onChange={(e) => setNewTestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as PathologyCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Hematology">Hematology</option>
                  <option value="Immunology">Immunology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Clinical Pathology">Clinical Pathology</option>
                  <option value="Serology">Serology</option>
                  <option value="Microbiology">Microbiology</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sample / Specimen Required
                </label>
                <input
                  type="text"
                  value={newSampleType}
                  onChange={(e) => setNewSampleType(e.target.value)}
                  placeholder="Serum / EDTA Whole Blood"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Standard Tariff Price (₹)
                </label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Turnaround Time (Hours)
                </label>
                <input
                  type="number"
                  value={newTatHours}
                  onChange={(e) => setNewTatHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Clinical Description & Indications
              </label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Diagnostic clinical significance and method..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="pt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                {isSubmitting ? 'Saving...' : 'Save to Firebase Catalog'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
            {/* Test List Sidebar */}
            <div className="border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-2">
              {filteredTemplates.map((t) => {
                const isSelected = activeTemplate?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTemplate(t)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 shadow-xs'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold">
                        {t.testCode}
                      </span>
                      <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        ₹{t.price}
                      </span>
                    </div>
                    <div className="font-bold text-xs mt-1.5 line-clamp-1">{t.testName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                      <span>{t.category}</span>
                      <span>{t.parameters.length} parameters</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Test Detail Pane */}
            <div className="md:col-span-2 overflow-y-auto p-6 space-y-6">
              {activeTemplate && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50">
                        {activeTemplate.testCode}
                      </span>
                      <span className="text-base font-mono font-bold text-slate-900 dark:text-slate-100">
                        Tariff: ₹{activeTemplate.price}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                      {activeTemplate.testName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {activeTemplate.description || 'Standard diagnostic test profile.'}
                    </p>
                  </div>

                  {/* Specimen & TAT Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Specimen</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {activeTemplate.sampleType}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Department</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {activeTemplate.category}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Standard TAT</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {activeTemplate.tatHours} Hours
                      </span>
                    </div>
                  </div>

                  {/* Parameters & Biological Reference Intervals */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                      Included Parameters & Reference Intervals ({activeTemplate.parameters.length})
                    </h4>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-2.5 px-3">Parameter Name</th>
                            <th className="py-2.5 px-3">Unit</th>
                            <th className="py-2.5 px-3">Reference Interval</th>
                            <th className="py-2.5 px-3">Technology / Method</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {activeTemplate.parameters.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                              <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                                {p.name}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">
                                {p.unit || '-'}
                              </td>
                              <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                                {p.refRangeText}
                              </td>
                              <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                                {p.method || 'Standard Automation'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
