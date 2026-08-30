import React, { useState } from 'react';
import {
  FlaskConical,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  AlertCircle,
  FileText,
  HelpCircle,
  Tag,
  SlidersHorizontal,
  ExternalLink,
  Info,
} from 'lucide-react';
import { TestTemplate, PathologyCategory } from '../../types';

interface LabTestModulesViewProps {
  templates: TestTemplate[];
  onOrderTest: (template: TestTemplate) => void;
}

export const LabTestModulesView: React.FC<LabTestModulesViewProps> = ({
  templates,
  onOrderTest,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTestCode, setExpandedTestCode] = useState<string | null>(null);

  const categories: string[] = [
    'All',
    'Hematology',
    'Biochemistry',
    'Endocrinology',
    'Infectious Diseases',
    'Serology/Immunology',
    'Coagulation',
    'Clinical Pathology',
  ];

  const filteredTemplates = templates.filter((tmpl) => {
    const matchesCategory =
      selectedCategory === 'All' ? true : tmpl.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tmpl.testName.toLowerCase().includes(q) ||
      tmpl.testCode.toLowerCase().includes(q) ||
      tmpl.category.toLowerCase().includes(q) ||
      tmpl.sampleType.toLowerCase().includes(q) ||
      (tmpl.clinicalSignificance && tmpl.clinicalSignificance.toLowerCase().includes(q)) ||
      tmpl.parameters.some((p) => p.name.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  const getTubeColorClass = (color?: string) => {
    switch (color?.toLowerCase()) {
      case 'lavender':
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800';
      case 'gold':
      case 'yellow':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'red':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'blue':
      case 'light blue':
        return 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800';
      case 'grey':
      case 'gray':
        return 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
      case 'green':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Diagnostic Test Catalog & Investigation Modules
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-emerald-400 font-semibold font-mono">
              {templates.length} Standardized Protocols
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Pathology Laboratory Investigation Modules
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Each specialized test module includes standard biological reference ranges, unit specifications,
            vacutainer tube protocols, specimen preparation requirements, clinical significance, and 1-click
            diagnostic report generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">Specimen Quality Guide</div>
            <div className="text-sm font-bold text-white">NABL ISO 15189:2022</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search test name (CBC, LFT...), parameter, tube..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Grid of Test Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          const isExpanded = expandedTestCode === template.testCode;

          return (
            <div
              key={template.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between overflow-hidden"
            >
              {/* Card Top */}
              <div className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-900">
                        {template.testCode}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {template.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {template.testName}
                    </h3>
                  </div>

                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono shrink-0">
                    ₹{template.price}
                  </span>
                </div>

                {/* Tube & Specimen Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {template.sampleTubeColor && (
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border text-[11px] flex items-center gap-1 ${getTubeColorClass(
                        template.sampleTubeColor
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {template.sampleTubeColor} Tube
                    </span>
                  )}

                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700">
                    {template.sampleType}
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    TAT: {template.tatHours}h
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200/50 dark:border-blue-900/50">
                    {template.parameters.length} Parameters
                  </span>
                </div>

                {/* Specimen Preparation Instruction */}
                {template.specimenPrep && (
                  <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="font-semibold">Prep: </strong>
                      {template.specimenPrep}
                    </span>
                  </div>
                )}

                {/* Clinical Significance */}
                {template.clinicalSignificance && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {template.clinicalSignificance}
                  </p>
                )}

                {/* Expanded Parameter Details */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Standard Test Parameters & Intervals:</span>
                      <span className="text-[11px] text-slate-400">
                        {template.parameters.length} Analytes
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                      {template.parameters.map((param) => (
                        <div
                          key={param.id}
                          className="p-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {param.name}
                            </div>
                            {param.method && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Method: {param.method}
                              </div>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono text-slate-600 dark:text-slate-300">
                              {param.refRangeText}
                            </div>
                            {param.unit && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                {param.unit}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedTestCode(isExpanded ? null : template.testCode)
                  }
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition flex items-center gap-1"
                >
                  <span>{isExpanded ? 'Hide Analytes' : 'View Analytes & Ranges'}</span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => onOrderTest(template)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run / Order Test</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
