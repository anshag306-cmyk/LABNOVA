import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Clock,
  FlaskConical,
  CheckCircle2,
  Calendar,
  Eye,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { TestTemplate } from '../../types';

interface PublicServicesAndTestsProps {
  testTemplates: TestTemplate[];
  currency?: string;
  onViewTestDetails: (test: TestTemplate) => void;
  onBookTest: (test: TestTemplate) => void;
}

export const PublicServicesAndTests: React.FC<PublicServicesAndTestsProps> = ({
  testTemplates,
  currency = '₹',
  onViewTestDetails,
  onBookTest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    testTemplates.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ['All', ...Array.from(set)];
  }, [testTemplates]);

  // Filter tests based on search and category
  const filteredTests = useMemo(() => {
    return testTemplates.filter((test) => {
      const matchCategory =
        selectedCategory === 'All' || test.category?.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        test.testName.toLowerCase().includes(q) ||
        test.testCode.toLowerCase().includes(q) ||
        (test.category && test.category.toLowerCase().includes(q)) ||
        (test.description && test.description.toLowerCase().includes(q)) ||
        (test.parameters &&
          test.parameters.some((p) => p.name.toLowerCase().includes(q)))
      );
    });
  }, [testTemplates, selectedCategory, searchQuery]);

  return (
    <section
      id="public-tests-catalog"
      className="py-16 sm:py-24 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-semibold">
            <Tag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Standardized Diagnostic Tariffs & Profiles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pathology Services & Investigation Directory
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Transparent diagnostic panel pricing, biological specimen protocols, and comprehensive
            parameter reference ranges. Completely free of private patient information.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-4 max-w-4xl mx-auto">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              id="input-public-test-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by name, code, or organ (e.g. CBC, Liver, Creatinine, Thyroid, Sugar, Dengue)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 shadow-sm focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Test Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div
              key={test.id || test.testCode}
              className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md hover:border-teal-500/40 dark:hover:border-teal-500/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                    {test.testCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
                    {test.category}
                  </span>
                </div>

                {/* Test Name & Description */}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                    {test.testName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {test.description ||
                      test.clinicalSignificance ||
                      'Standardized diagnostic investigation verified by Consultant Pathologists.'}
                  </p>
                </div>

                {/* Key Attributes Strip */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Specimen:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[170px]">
                      {test.sampleType || 'Venous Blood'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Turnaround:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {test.tatHours ? `${test.tatHours} Hours` : 'Same Day'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Parameters:</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {test.parameters?.length || 1} Measurable Values
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action Buttons */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tariff</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {currency}
                    {test.price.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewTestDetails(test)}
                    className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                    title="View Parameters & Prep Guide"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onBookTest(test)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition transform active:scale-95 flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Book Test</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty Search Result State */}
        {filteredTests.length === 0 && (
          <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-3">
            <FlaskConical className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No matching diagnostic tests found
            </h3>
            <p className="text-xs text-slate-500">
              Try searching with another keyword or select "All" categories to view the full
              directory.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
