import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Download,
  FileCheck,
  Filter,
  Key,
  Lock,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';

export const ComplianceAudit: React.FC = () => {
  const { auditLogs } = useLab();
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recordId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const handleExportCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'Operator', 'Action', 'Module', 'Record ID', 'Details', 'Signature Hash'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.user}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${l.recordId}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.eSignHash || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LabNova_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            21 CFR Part 11 Audit Trail & GLP Compliance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable, time-stamped chronological records capturing all data creation, modification, and electronic signatures.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs shadow-sm transition-transform active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Compliance Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start space-x-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
              FDA 21 CFR Part 11 Validated
            </h3>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
              Strict audit trails, secure computer-generated time-stamps, and tamper-evident SHA-256 e-signatures.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex items-start space-x-3">
          <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-blue-950 dark:text-blue-200">
              ALCOA+ Data Integrity
            </h3>
            <p className="text-[11px] text-blue-800 dark:text-blue-400 mt-0.5">
              Attributable, Legible, Contemporaneous, Original, and Accurate data records with zero deletion bypass.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 flex items-start space-x-3">
          <Award className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-bold text-purple-950 dark:text-purple-200">
              ISO 17025 & GLP Ready
            </h3>
            <p className="text-[11px] text-purple-800 dark:text-purple-400 mt-0.5">
              Full chain-of-custody tracking across all reagents, instrument calibrations, and technician sign-offs.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by operator, action, record ID, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Modules</option>
            <option value="ELN">ELN (Notebook)</option>
            <option value="Protocols">Protocols & SOPs</option>
            <option value="Samples">Samples & Specimens</option>
            <option value="Inventory">Chemicals & SDS</option>
            <option value="Instruments">Instruments & Booking</option>
            <option value="System">System Security</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Event ID & Time (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Event Description & E-Sign Stamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-slate-100 block">
                      {log.id}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {log.timestamp}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-sans font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                    {log.action}
                  </td>

                  <td className="py-3.5 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {log.module}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {log.recordId}
                  </td>

                  <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-400 text-xs">
                    {log.user}
                  </td>

                  <td className="py-3.5 px-4 font-sans max-w-xs sm:max-w-md">
                    <div className="text-slate-800 dark:text-slate-200 text-xs">
                      {log.details}
                    </div>
                    {log.eSignHash && (
                      <div className="mt-1 flex items-center space-x-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60 truncate">
                        <Key className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{log.eSignHash}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
