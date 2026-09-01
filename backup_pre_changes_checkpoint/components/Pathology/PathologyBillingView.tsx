import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
} from 'lucide-react';
import { PathologyReport, LabSettings, PaymentStatus } from '../../types';
import { generateInvoicePdf } from '../../services/pdfReportGenerator';
import { updateReportInFirestore } from '../../services/pathologyFirebase';
import { useAuth } from '../../context/AuthContext';

interface PathologyBillingViewProps {
  reports: PathologyReport[];
  settings?: LabSettings;
  onViewReport: (report: PathologyReport) => void;
}

export const PathologyBillingView: React.FC<PathologyBillingViewProps> = ({
  reports,
  settings,
  onViewReport,
}) => {
  const { currentLab, isAdmin, isStaff } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Financial KPI calculations
  const totalGross = reports.reduce(
    (sum, r) => sum + (r.billing?.totalAmount || r.price || 0),
    0
  );
  const totalDiscounts = reports.reduce(
    (sum, r) => sum + (r.billing?.discount || r.discount || 0),
    0
  );
  const totalCollected = reports.reduce(
    (sum, r) => sum + (r.billing?.paidAmount || (r.paymentStatus === 'paid' ? r.price : 0) || 0),
    0
  );
  const totalNetPayable = totalGross - totalDiscounts;
  const totalDues = Math.max(0, totalNetPayable - totalCollected);

  // Filtered reports list
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.patientName.toLowerCase().includes(q) ||
      r.patientUHID.toLowerCase().includes(q) ||
      r.reportId.toLowerCase().includes(q) ||
      (r.referredBy && r.referredBy.toLowerCase().includes(q)) ||
      r.testNames.some((t) => t.toLowerCase().includes(q));

    const pStatus = r.billing?.paymentStatus || r.paymentStatus || 'paid';
    const matchesStatus = statusFilter === 'all' ? true : pStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDownloadInvoice = (report: PathologyReport) => {
    generateInvoicePdf(report, settings);
  };

  const handleMarkAsPaid = async (report: PathologyReport) => {
    setUpdatingId(report.id);
    try {
      const totalAmt = report.billing?.totalAmount || 0;
      const discountAmt = report.billing?.discount || 0;
      const netPayable = totalAmt - discountAmt;
      await updateReportInFirestore(
        report.id,
        {
          billing: {
            totalAmount: totalAmt,
            discount: discountAmt,
            paidAmount: netPayable,
            paymentStatus: 'paid',
            paymentMode: report.billing?.paymentMode || 'UPI',
          },
        },
        currentLab.id
      );
    } catch (err) {
      console.error('Failed to update payment status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Billed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Billed Gross
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              ₹{totalGross.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Standard Tariffs</span>
          </div>
        </div>

        {/* Total Realized Collections */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Collected Collections
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{totalCollected.toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium font-mono">
              {totalNetPayable > 0 ? Math.round((totalCollected / totalNetPayable) * 100) : 100}% Realized
            </span>
          </div>
        </div>

        {/* Outstanding Dues */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Receivables / Dues
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              ₹{totalDues.toLocaleString()}
            </span>
            <span className="text-[11px] text-amber-600 font-medium">To be collected</span>
          </div>
        </div>

        {/* Total Concessions / Discounts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Concessions & Waivers
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              ₹{totalDiscounts.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Approved Waivers</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Payment Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'paid', label: 'Paid in Full' },
            { id: 'partial', label: 'Partial Payment' },
            { id: 'pending', label: 'Due / Unpaid' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, UHID, invoice number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Invoice / Report ID</th>
                <th className="py-3.5 px-4">Patient & UHID</th>
                <th className="py-3.5 px-4">Investigations</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Gross (₹)</th>
                <th className="py-3.5 px-4 text-right">Discount (₹)</th>
                <th className="py-3.5 px-4 text-right">Net Paid (₹)</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No billing records matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const gross = report.billing?.totalAmount || report.price || 0;
                  const disc = report.billing?.discount || report.discount || 0;
                  const paid = report.billing?.paidAmount || (report.paymentStatus === 'paid' ? gross - disc : 0);
                  const net = gross - disc;
                  const due = Math.max(0, net - paid);
                  const pStatus = report.billing?.paymentStatus || report.paymentStatus || 'paid';
                  const pMode = report.billing?.paymentMode || 'UPI';

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Invoice ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        INV-{report.reportId}
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {report.patientName}
                        </div>
                        <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                          {report.patientUHID} • {report.patientAge}y/{report.patientGender}
                        </div>
                      </td>

                      {/* Investigations */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {report.testNames?.join(', ') || report.testName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Dr. {report.referredBy || 'Self Walk-in'}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(report.sampleCollectedAt).toLocaleDateString()}
                      </td>

                      {/* Gross */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        ₹{gross.toFixed(2)}
                      </td>

                      {/* Discount */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {disc > 0 ? `-₹${disc.toFixed(2)}` : '₹0.00'}
                      </td>

                      {/* Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{paid.toFixed(2)}
                        {due > 0 && (
                          <div className="text-[10px] text-amber-600 font-normal">
                            Due: ₹{due.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                            pStatus === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                              : pStatus === 'partial'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {pStatus}
                        </span>
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                        {pMode}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {pStatus !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(report)}
                              disabled={updatingId === report.id}
                              className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1"
                              title="Mark full balance paid"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Clear</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(report)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Download Official Tax Invoice PDF"
                          >
                            <Download className="w-3 h-3 text-emerald-600" />
                            <span>Tax Inv</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onViewReport(report)}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                            title="View Associated Report"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
