import React from 'react';
import {
  X,
  Clock,
  FlaskConical,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { TestTemplate } from '../../types';

interface PublicTestDetailModalProps {
  test: TestTemplate | null;
  currency?: string;
  isOpen: boolean;
  onClose: () => void;
  onBookTest: (test: TestTemplate) => void;
}

export const PublicTestDetailModal: React.FC<PublicTestDetailModalProps> = ({
  test,
  currency = '₹',
  isOpen,
  onClose,
  onBookTest,
}) => {
  if (!isOpen || !test) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                {test.testCode}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                {test.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{test.tatHours ? `${test.tatHours} Hours Turnaround` : 'Same Day'}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {test.testName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Overview & Specimen Requirement Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Biological Specimen Required
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {test.sampleType || 'Venous Blood / Serum'}
              </p>
              {test.sampleTubeColor && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Vacutainer: {test.sampleTubeColor} top</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Standard Tariff & Billing
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {currency}
                {test.price.toLocaleString()}
              </div>
              <div className="text-[11px] text-teal-700 dark:text-teal-300 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>NABL Quality Standard Testing</span>
              </div>
            </div>
          </div>

          {/* Description & Clinical Significance */}
          {test.description && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Panel Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {test.description}
              </p>
            </div>
          )}

          {test.clinicalSignificance && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 space-y-1.5">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Clinical Significance & Diagnostic Value</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {test.clinicalSignificance}
              </p>
            </div>
          )}

          {/* Patient Preparation Instructions */}
          {test.specimenPrep && (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Patient Preparation & Fasting Guidelines</span>
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                {test.specimenPrep}
              </p>
            </div>
          )}

          {/* Parameters & Reference Intervals Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Measurable Parameters & Biological Reference Intervals ({test.parameters?.length || 0})
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Standard Ref Values</span>
            </div>

            {test.parameters && test.parameters.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-2.5 px-4 font-semibold">Parameter Name</th>
                      <th className="py-2.5 px-3 font-semibold">Biological Reference Range</th>
                      <th className="py-2.5 px-3 font-semibold">Unit</th>
                      <th className="py-2.5 px-3 font-semibold">Methodology</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {test.parameters.map((param, index) => (
                      <tr
                        key={param.id || index}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white">
                          {param.name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {param.refRangeText ||
                            (param.refRangeMin !== undefined && param.refRangeMax !== undefined
                              ? `${param.refRangeMin} - ${param.refRangeMax}`
                              : 'Normal')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                          {param.unit || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400">
                          {param.method || 'Automated Clinical Chemistry'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                Standard diagnostic panel parameters verified by Consultant Pathologist.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Official NABL ISO 15189:2022 diagnostic procedure.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                onBookTest(test);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition transform active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book This Test (Home Collection)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
