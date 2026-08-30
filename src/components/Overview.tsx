import React from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Beaker,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  FlaskConical,
  Gauge,
  Plus,
  ShieldCheck,
  Sparkles,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useLab } from '../context/LabContext';

export const Overview: React.FC<{ onNewExperimentClick: () => void }> = ({ onNewExperimentClick }) => {
  const {
    experiments,
    equipment,
    inventory,
    sensors,
    setActiveTab,
    setSelectedExperimentId,
    openAiAssistant,
    updateInventoryQuantity,
  } = useLab();

  // Metrics
  const activeExp = experiments.filter((e) => e.status === 'in_progress');
  const inReviewExp = experiments.filter((e) => e.status === 'in_review');
  const lowInventory = inventory.filter((i) => i.quantity <= i.minThreshold);
  const inUseEquipment = equipment.filter((eq) => eq.status === 'in_use');
  const availableEquipment = equipment.filter((eq) => eq.status === 'available');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800';
      case 'in_review':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mission Control Summary */}
      <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Facility Status: Fully Nominal • GLP Compliant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              LabNova Research Command Center
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Real-time monitoring across 4 cold-chain vaults, {equipment.length} calibrated instruments, and {experiments.length} active research protocols.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              id="btn-quick-pathology"
              onClick={() => setActiveTab('pathology')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white shadow-sm transition-all"
            >
              <FlaskConical className="w-4 h-4 text-blue-100" />
              <span>Pathology LIMS</span>
            </button>
            <button
              id="btn-quick-new-exp"
              onClick={onNewExperimentClick}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Experiment</span>
            </button>
            <button
              id="btn-quick-protocols"
              onClick={() => setActiveTab('protocols')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-all"
            >
              <FlaskConical className="w-4 h-4 text-emerald-300" />
              <span>SOP Library</span>
            </button>
            <button
              id="btn-quick-ai-consult"
              onClick={() => openAiAssistant('troubleshoot')}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-all"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>AI Troubleshooter</span>
            </button>
          </div>
        </div>

        {/* Quick High-Level Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-xs text-slate-400 block">Active Studies</span>
            <span className="text-2xl font-bold font-mono text-white">{activeExp.length}</span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">+{inReviewExp.length} pending review</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-xs text-slate-400 block">Instrument Fleet</span>
            <span className="text-2xl font-bold font-mono text-emerald-300">{availableEquipment.length} / {equipment.length}</span>
            <span className="text-[11px] text-slate-300 block mt-0.5">{inUseEquipment.length} running cycles</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-xs text-slate-400 block">Reagent Stock</span>
            <span className="text-2xl font-bold font-mono text-white">{inventory.length}</span>
            <span className={`text-[11px] block mt-0.5 ${lowInventory.length > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400'}`}>
              {lowInventory.length > 0 ? `⚠️ ${lowInventory.length} items low` : 'All above threshold'}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/5">
            <span className="text-xs text-slate-400 block">Cold Storage Health</span>
            <span className="text-2xl font-bold font-mono text-white">100%</span>
            <span className="text-[11px] text-emerald-400 block mt-0.5">±0.2°C tolerance verified</span>
          </div>
        </div>
      </div>

      {/* Pathology Laboratory System Highlight Banner */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md border border-blue-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold tracking-tight">
                Pathology Laboratory & Clinical Diagnostics (LIMS)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950">
                FIREBASE LIVE
              </span>
            </div>
            <p className="text-xs text-blue-200/80 mt-1 max-w-xl">
              NABL accredited patient registration, accession barcode tracking, dynamic report builder with automatic reference range checking, and instant official PDF generation.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('pathology')}
          className="self-start md:self-center px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <span>Open Pathology LIMS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Environmental Telemetry Sensors Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Live Environmental & Cold-Chain Telemetry
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Updated every 60s via sensor daemon
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sensors.map((sensor) => (
            <div
              key={sensor.id}
              id={`sensor-card-${sensor.id}`}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-hover hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    {sensor.location}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                    {sensor.name}
                  </h3>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              </div>

              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                  {sensor.value}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {sensor.unit}
                </span>
              </div>

              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Safe Range:</span>
                <span className="font-mono font-medium">
                  {sensor.minLimit} to {sensor.maxLimit} {sensor.unit}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Columns: Ongoing Experiments & Active Instruments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Experiments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Active Research Studies & ELN Entries
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('eln')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center space-x-1"
            >
              <span>View All ({experiments.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {experiments.slice(0, 3).map((exp) => {
              const completedSteps = (exp.protocolSteps || []).filter((s) => s.completed).length;
              const totalSteps = (exp.protocolSteps || []).length;
              const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

              return (
                <div
                  key={exp.id}
                  id={`exp-card-${exp.id}`}
                  onClick={() => {
                    setSelectedExperimentId(exp.id);
                    setActiveTab('eln');
                  }}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {exp.id}
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {exp.projectCode}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {exp.title}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStatusBadge(exp.status)}`}>
                      {exp.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                    {exp.hypothesis}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>Lead: {exp.scientist}</span>
                      <span>•</span>
                      <span>Updated: {exp.updatedAt}</span>
                    </div>

                    {totalSteps > 0 && (
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {completedSteps}/{totalSteps} Steps ({percent}%)
                        </span>
                        <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Instrument Status & Reagent Alerts */}
        <div className="space-y-6">
          {/* Equipment Status Widget */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Instrument Availability
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('equipment')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                Schedule
              </button>
            </div>

            <div className="space-y-3">
              {equipment.slice(0, 4).map((eq) => (
                <div
                  key={eq.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs"
                >
                  <div className="truncate pr-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {eq.name}
                    </span>
                    <span className="text-slate-400 text-[11px] block truncate">
                      {eq.location}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      eq.status === 'available'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : eq.status === 'in_use'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {eq.status === 'in_use' ? 'RUNNING' : eq.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reagent Inventory Stock Watch */}
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Beaker className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Critical Inventory Alerts
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                All Stock
              </button>
            </div>

            {lowInventory.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                All laboratory reagents above minimum replenishment threshold.
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowInventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-amber-900 dark:text-amber-200 block truncate max-w-[180px]">
                        {item.name}
                      </span>
                      <span className="text-amber-700 dark:text-amber-400 text-[11px]">
                        Qty: {item.quantity} {item.unit} (Min: {item.minThreshold})
                      </span>
                    </div>
                    <button
                      onClick={() => updateInventoryQuantity(item.id, 250)}
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] shadow-sm active:scale-95"
                    >
                      + Restock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
