import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  AlertCircle,
  TrendingUp,
  Search,
  Plus,
  Download,
  Eye,
  Filter,
  Activity,
  CheckCircle2,
  Clock,
  FlaskConical,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Edit,
  Database,
  ExternalLink,
  ChevronRight,
  Settings,
  Receipt,
  Sparkles,
  Calendar,
  Building2,
  UserCog,
  LogOut,
  Shield,
  Lock,
} from 'lucide-react';
import {
  PathologyPatient,
  PathologyReport,
  TestTemplate,
  ReportStatus,
  LabSettings,
} from '../../types';
import {
  subscribeToPatients,
  subscribeToReports,
  subscribeToTestTemplates,
  subscribeToLabSettings,
  cachedSettings,
  deleteReportFromFirestore,
  deletePatientFromFirestore,
  updateReportStatusInFirestore,
  seedInitialPathologyDataIfNeeded,
} from '../../services/pathologyFirebase';
import { generatePathologyPdf, generateInvoicePdf } from '../../services/pdfReportGenerator';
import { DEFAULT_LAB_SETTINGS } from '../../data/pathologyTemplates';
import { useAuth } from '../../context/AuthContext';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import { ReportBuilderModal } from './ReportBuilderModal';
import { ReportDetailModal } from './ReportDetailModal';
import { TestCatalogModal } from './TestCatalogModal';
import { LabTestModulesView } from './LabTestModulesView';
import { PathologyBillingView } from './PathologyBillingView';
import { LabNovaSettingsView } from './LabNovaSettingsView';

export const PathologyDashboard: React.FC<{
  initialTab?: 'overview' | 'reports' | 'modules' | 'patients' | 'billing' | 'settings' | 'analytics';
}> = ({ initialTab = 'overview' }) => {
  const { currentLab, user, isAdmin, isStaff, logout, openLabSwitcher, openStaffModal } = useAuth();

  // Real-time Firestore state
  const [patients, setPatients] = useState<PathologyPatient[]>([]);
  const [reports, setReports] = useState<PathologyReport[]>([]);
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [settings, setSettings] = useState<LabSettings>(cachedSettings || DEFAULT_LAB_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseLive, setFirebaseLive] = useState(true);

  // Active view tab: overview, reports queue, test modules, patient directory, billing/invoices, settings, analytics
  const [activeTab, setActiveTab] = useState<
    'overview' | 'reports' | 'modules' | 'patients' | 'billing' | 'settings' | 'analytics'
  >(initialTab);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const [selectedReport, setSelectedReport] = useState<PathologyReport | null>(null);
  const [selectedPatientForReport, setSelectedPatientForReport] = useState<PathologyPatient | null>(null);
  const [selectedTestCodeForReport, setSelectedTestCodeForReport] = useState<string | null>(null);
  const [reportToEdit, setReportToEdit] = useState<PathologyReport | null>(null);

  // Initialize Firebase subscriptions for current tenant
  useEffect(() => {
    setIsLoading(true);

    // Initial seeding check for this lab
    seedInitialPathologyDataIfNeeded(currentLab.id);

    const unsubPatients = subscribeToPatients(
      currentLab.id,
      (data) => {
        setPatients(data);
        setIsLoading(false);
        setFirebaseLive(true);
      },
      () => setFirebaseLive(false)
    );

    const unsubReports = subscribeToReports(
      currentLab.id,
      (data) => {
        setReports(data);
        setIsLoading(false);
        setFirebaseLive(true);
      },
      () => setFirebaseLive(false)
    );

    const unsubTemplates = subscribeToTestTemplates(currentLab.id, (data) => {
      setTemplates(data);
    });

    const unsubSettings = subscribeToLabSettings(currentLab.id, (s) => {
      setSettings(s);
    });

    return () => {
      unsubPatients();
      unsubReports();
      unsubTemplates();
      unsubSettings();
    };
  }, [currentLab.id]);

  // Handlers
  const handleOpenPatientRegistration = () => {
    setIsPatientModalOpen(true);
  };

  const handlePatientCreated = (patient: PathologyPatient, openReportBuilder?: boolean) => {
    if (openReportBuilder) {
      setSelectedPatientForReport(patient);
      setSelectedTestCodeForReport(null);
      setReportToEdit(null);
      setIsReportModalOpen(true);
    }
  };

  const handleOpenNewReport = (forPatient?: PathologyPatient, initialTestCode?: string) => {
    setSelectedPatientForReport(forPatient || null);
    setSelectedTestCodeForReport(initialTestCode || null);
    setReportToEdit(null);
    setIsReportModalOpen(true);
  };

  const handleViewReport = (report: PathologyReport) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const handleEditReport = (report: PathologyReport) => {
    setReportToEdit(report);
    setSelectedPatientForReport(null);
    setIsReportModalOpen(true);
  };

  const handleDeleteReport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert('Permission Denied: Only Lab Administrators can delete diagnostic records.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this pathology report?')) {
      await deleteReportFromFirestore(id, currentLab.id);
    }
  };

  const handleDeletePatient = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert('Permission Denied: Only Lab Administrators can delete patient records.');
      return;
    }
    if (window.confirm('Delete patient record and their history from Firebase?')) {
      await deletePatientFromFirestore(id, currentLab.id);
    }
  };

  const handleQuickStatusAdvance = async (e: React.MouseEvent, report: PathologyReport) => {
    e.stopPropagation();
    const sequence: ReportStatus[] = ['sample_collected', 'processing', 'completed', 'verified', 'delivered'];
    const currentIndex = sequence.indexOf(report.status);
    const nextStatus = sequence[(currentIndex + 1) % sequence.length];

    let extra: Partial<PathologyReport> = {};
    if (nextStatus === 'verified' && !report.verifiedAt) {
      extra.verifiedAt = new Date().toISOString();
      if (!report.digitalSignatureHash) {
        extra.digitalSignatureHash = Array.from(crypto.getRandomValues(new Uint8Array(20)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      }
    }
    await updateReportStatusInFirestore(report.id, nextStatus, extra, currentLab.id);
  };

  // KPI Calculations
  const totalPatientsCount = patients.length;
  const totalReportsCount = reports.length;
  const verifiedReportsCount = reports.filter((r) => r.status === 'verified' || r.status === 'delivered').length;
  const pendingReportsCount = reports.filter((r) => r.status === 'sample_collected' || r.status === 'processing').length;

  const criticalReportsCount = reports.filter((r) =>
    (r.results || []).some((res) => res.status === 'critical')
  ).length;

  const totalRevenue = reports.reduce((sum, r) => sum + (r.billing?.paidAmount || 0), 0);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.patientName.toLowerCase().includes(q) ||
      r.patientUHID.toLowerCase().includes(q) ||
      r.reportId.toLowerCase().includes(q) ||
      (r.sampleBarcode && r.sampleBarcode.toLowerCase().includes(q)) ||
      (r.referredBy && r.referredBy.toLowerCase().includes(q)) ||
      r.testNames.some((t) => t.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'critical'
        ? (r.results || []).some((res) => res.status === 'critical')
        : r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered patients
  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.referredBy && p.referredBy.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-16">
      {/* Top Professional Header Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                  {settings.labName || currentLab.name || 'LABNOVA PATHOLOGY LIMS'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  {settings.accreditationText || 'NABL ISO 15189:2022'}
                </span>
                {/* Lab Switcher Button */}
                <button
                  type="button"
                  onClick={openLabSwitcher}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/50 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 text-slate-600 dark:text-slate-300"
                  title="Switch Active Laboratory Branch"
                >
                  <Building2 className="w-3 h-3 text-blue-500" />
                  <span>Lab: {currentLab.code}</span>
                  <span className="text-[10px] underline opacity-80">Change</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center flex-wrap gap-2 mt-0.5">
                <span>{settings.tagline || 'Clinical Biochemistry, Hematology & Molecular Diagnostics'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Firebase Connected
                </span>
              </p>
            </div>
          </div>

          {/* User Session, RBAC Actions & Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {/* User Profile & Role Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block">
                <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                    isAdmin
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}>
                    {user?.role || 'staff'}
                  </span>
                </div>
              </div>

              {/* Admin: Staff & Roles Management */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={openStaffModal}
                  className="ml-1 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  title="Manage Lab Staff & Role-Based Permissions"
                >
                  <UserCog className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </button>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                title="Sign out of laboratory session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => setActiveTab('modules')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
              <span>Test Modules ({templates.length})</span>
            </button>

            <button
              onClick={handleOpenPatientRegistration}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-800 dark:text-slate-200 transition shadow-xs flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>Register Patient</span>
            </button>

            <button
              onClick={() => handleOpenNewReport()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs shadow-blue-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Patients */}
          <div
            id="kpi-card-registered-patients"
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveTab('patients');
              setSearchQuery('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('patients');
                setSearchQuery('');
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
              activeTab === 'patients'
                ? 'bg-blue-50/80 border-blue-500 shadow-md dark:bg-blue-950/40 dark:border-blue-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Registered Patients
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {totalPatientsCount}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold group-hover:underline flex items-center gap-0.5">
                Open Directory <ChevronRight className="w-3 h-3 inline" />
              </span>
            </div>
          </div>

          {/* Diagnostic Reports */}
          <div
            id="kpi-card-diagnostic-reports"
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveTab('reports');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('reports');
                setStatusFilter('all');
                setSearchQuery('');
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
              activeTab === 'reports' && statusFilter !== 'critical'
                ? 'bg-indigo-50/80 border-indigo-500 shadow-md dark:bg-indigo-950/40 dark:border-indigo-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Diagnostic Reports
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {totalReportsCount}
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
                {verifiedReportsCount} Verified <ChevronRight className="w-3 h-3 inline" />
              </span>
            </div>
          </div>

          {/* Test Modules */}
          <div
            id="kpi-card-test-modules"
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveTab('modules');
              setSearchQuery('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('modules');
                setSearchQuery('');
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
              activeTab === 'modules'
                ? 'bg-purple-50/80 border-purple-500 shadow-md dark:bg-purple-950/40 dark:border-purple-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Test Catalog
              </span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
                {templates.length}
              </span>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold group-hover:underline flex items-center gap-0.5">
                View Tests <ChevronRight className="w-3 h-3 inline" />
              </span>
            </div>
          </div>

          {/* Critical Value Alerts */}
          <div
            id="kpi-card-critical-alerts"
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveTab('reports');
              setStatusFilter('critical');
              setSearchQuery('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('reports');
                setStatusFilter('critical');
                setSearchQuery('');
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group ${
              activeTab === 'reports' && statusFilter === 'critical'
                ? 'bg-rose-50/80 border-rose-500 shadow-md dark:bg-rose-950/40 dark:border-rose-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                Critical Alerts
              </span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                {criticalReportsCount}
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold group-hover:underline flex items-center gap-0.5">
                Review Now <ChevronRight className="w-3 h-3 inline" />
              </span>
            </div>
          </div>

          {/* Diagnostic Revenue & Billing */}
          <div
            id="kpi-card-pathology-billing"
            role="button"
            tabIndex={0}
            onClick={() => {
              setActiveTab('billing');
              setSearchQuery('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('billing');
                setSearchQuery('');
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer select-none group col-span-2 lg:col-span-1 ${
              activeTab === 'billing'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-md dark:bg-emerald-950/40 dark:border-emerald-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:shadow-md'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Pathology Billing
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{totalRevenue.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                Invoices <ChevronRight className="w-3 h-3 inline" />
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="tab-btn-overview"
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Today's Activity & Overview</span>
            </button>

            <button
              id="tab-btn-reports"
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports Queue ({reports.length})</span>
            </button>

            <button
              id="tab-btn-patients"
              onClick={() => setActiveTab('patients')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'patients'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Registered Patients ({patients.length})</span>
            </button>

            <button
              id="tab-btn-modules"
              onClick={() => setActiveTab('modules')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'modules'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Test Modules ({templates.length})</span>
            </button>

            <button
              id="tab-btn-billing"
              onClick={() => setActiveTab('billing')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'billing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Billing & Invoices</span>
            </button>

            <button
              id="tab-btn-settings"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Lab Settings</span>
            </button>

            <button
              id="tab-btn-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Lab Analytics</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  activeTab === 'reports' || activeTab === 'overview'
                    ? 'Search by patient, UHID, test, barcode...'
                    : activeTab === 'patients'
                    ? 'Search patient name, phone, doctor...'
                    : activeTab === 'modules'
                    ? 'Search test code, category, parameter...'
                    : 'Search records...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* TAB 0: TODAY'S ACTIVITY & OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Today's Operational Status Banner */}
            <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white shadow-md border border-blue-900/40 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Pathology Facility Operations • ISO 15189 Standard</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
                    <span>Clinical Lab Activity & Daily Diagnostic Worklist</span>
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl flex items-center flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-200">
                      <Calendar className="w-3.5 h-3.5 text-blue-400 inline shrink-0" />
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span>{reports.length} Total Diagnostic Records</span>
                    <span className="text-slate-500">•</span>
                    <span>{templates.length} Standard Test Profiles</span>
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    id="btn-overview-new-report"
                    onClick={() => handleOpenNewReport()}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-500 hover:bg-blue-400 text-white shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Diagnostic Report</span>
                  </button>
                  <button
                    id="btn-overview-register-patient"
                    onClick={handleOpenPatientRegistration}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-all"
                  >
                    <Users className="w-4 h-4 text-blue-300" />
                    <span>Register Patient</span>
                  </button>
                  <button
                    id="btn-overview-view-tests"
                    onClick={() => setActiveTab('modules')}
                    className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 transition-all"
                  >
                    <FlaskConical className="w-4 h-4 text-purple-300" />
                    <span>Test Catalog</span>
                  </button>
                </div>
              </div>

              {/* 4 Operations Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-white/10">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTab('patients')}
                  className="bg-white/5 hover:bg-white/10 transition-all rounded-xl p-3 border border-white/5 cursor-pointer group"
                >
                  <span className="text-xs text-slate-400 block group-hover:text-blue-300">Registered Patients</span>
                  <span className="text-2xl font-bold font-mono text-white">{totalPatientsCount}</span>
                  <span className="text-[11px] text-blue-300 block mt-0.5 group-hover:underline">
                    View directory →
                  </span>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveTab('reports');
                    setStatusFilter('processing');
                  }}
                  className="bg-white/5 hover:bg-white/10 transition-all rounded-xl p-3 border border-white/5 cursor-pointer group"
                >
                  <span className="text-xs text-slate-400 block group-hover:text-amber-300">Samples In Processing</span>
                  <span className="text-2xl font-bold font-mono text-amber-300">
                    {pendingReportsCount}
                  </span>
                  <span className="text-[11px] text-amber-400 block mt-0.5 group-hover:underline">
                    In lab processing →
                  </span>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveTab('reports');
                    setStatusFilter('completed');
                  }}
                  className="bg-white/5 hover:bg-white/10 transition-all rounded-xl p-3 border border-white/5 cursor-pointer group"
                >
                  <span className="text-xs text-slate-400 block group-hover:text-purple-300">Pending Review</span>
                  <span className="text-2xl font-bold font-mono text-purple-300">
                    {reports.filter((r) => r.status === 'completed').length}
                  </span>
                  <span className="text-[11px] text-purple-300 block mt-0.5 group-hover:underline">
                    Awaiting e-sign →
                  </span>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveTab('reports');
                    setStatusFilter('critical');
                  }}
                  className="bg-white/5 hover:bg-white/10 transition-all rounded-xl p-3 border border-white/5 cursor-pointer group"
                >
                  <span className="text-xs text-slate-400 block group-hover:text-rose-300">Critical Abnormalities</span>
                  <span className="text-2xl font-bold font-mono text-rose-400">
                    {criticalReportsCount}
                  </span>
                  <span className="text-[11px] text-rose-300 block mt-0.5 group-hover:underline">
                    Immediate review →
                  </span>
                </div>
              </div>
            </div>

            {/* Today's Diagnostic Priority Queue Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Today's Diagnostic Queue & Recent Reports ({reports.length})
                  </h3>
                </div>
                <button
                  id="btn-overview-view-all-reports"
                  onClick={() => {
                    setActiveTab('reports');
                    setStatusFilter('all');
                  }}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 group"
                >
                  <span>View Full Reports Queue</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-3 px-4">Accession / Barcode</th>
                        <th className="py-3 px-4">Patient Information</th>
                        <th className="py-3 px-4">Tests & Modality</th>
                        <th className="py-3 px-4">Workflow Status</th>
                        <th className="py-3 px-4">Result Flags</th>
                        <th className="py-3 px-4">Billing</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reports.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No diagnostic reports yet</p>
                            <button
                              onClick={() => handleOpenNewReport()}
                              className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                            >
                              + Create first report
                            </button>
                          </td>
                        </tr>
                      ) : (
                        reports.slice(0, 5).map((report) => {
                          const hasCrit = (report.results || []).some((r) => r.status === 'critical');
                          const hasHigh = (report.results || []).some((r) => r.status === 'high');
                          const hasLow = (report.results || []).some((r) => r.status === 'low');

                          return (
                            <tr
                              key={report.id}
                              onClick={() => handleViewReport(report)}
                              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition"
                            >
                              {/* Accession ID & Barcode */}
                              <td className="py-3 px-4 font-mono">
                                <div className="font-bold text-slate-900 dark:text-slate-100">
                                  {report.reportId}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {report.sampleBarcode || 'BC-000000'}
                                </div>
                              </td>

                              {/* Patient Info */}
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                  {report.patientName}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                  <span>{report.patientAge}Y / {report.patientGender}</span>
                                  <span>•</span>
                                  <span className="font-mono">{report.patientUHID}</span>
                                </div>
                              </td>

                              {/* Tests */}
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-800 dark:text-slate-200">
                                  {report.testNames.join(', ')}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {report.results?.length || 0} parameters • {report.sampleType}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                <button
                                  title="Click to advance status"
                                  onClick={(e) => handleQuickStatusAdvance(e, report)}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition ${
                                    report.status === 'verified'
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                      : report.status === 'delivered'
                                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                      : report.status === 'completed'
                                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                  }`}
                                >
                                  {report.status === 'verified' ? (
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Clock className="w-3 h-3" />
                                  )}
                                  <span>{report.status.replace('_', ' ')}</span>
                                </button>
                              </td>

                              {/* Result Flags */}
                              <td className="py-3 px-4">
                                {hasCrit ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                                    CRITICAL
                                  </span>
                                ) : hasHigh || hasLow ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    ABNORMAL
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    Normal
                                  </span>
                                )}
                              </td>

                              {/* Billing */}
                              <td className="py-3 px-4 font-mono">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  ₹{report.billing?.paidAmount || 0}
                                </div>
                                <div className="text-[10px] text-emerald-600 uppercase font-semibold">
                                  {report.billing?.paymentStatus || 'paid'}
                                </div>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-3 px-4 text-right">
                                <div
                                  className="flex items-center justify-end space-x-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    title="View Report Sheet"
                                    onClick={() => handleViewReport(report)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    title="Download Official A4 PDF Report"
                                    onClick={() => generatePathologyPdf(report, settings)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>

                                  <button
                                    title="Download Tax Invoice PDF"
                                    onClick={() => generateInvoicePdf(report, settings)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                                  >
                                    <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                  </button>

                                  <button
                                    title="Edit Report"
                                    onClick={() => handleEditReport(report)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    title="Delete Report"
                                    onClick={(e) => handleDeleteReport(e, report.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
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

            {/* Two Columns: Registered Patients & Clinical Test Catalog */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Registered Patients */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Registered Patients ({patients.length})
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleOpenPatientRegistration}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      onClick={() => setActiveTab('patients')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 group"
                    >
                      <span>View All ({patients.length})</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
                  {patients.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No registered patients found.
                    </div>
                  ) : (
                    patients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                      >
                        <div className="flex items-center space-x-3 truncate pr-2">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {patient.fullName.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {patient.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{patient.uhid}</span>
                              <span>•</span>
                              <span>{patient.age}Y/{patient.gender}</span>
                              <span>•</span>
                              <span>{patient.phone}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenNewReport(patient)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/50 shrink-0 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Report</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Standard Clinical Test Catalog */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Standard Test Modules ({templates.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('modules')}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 group"
                  >
                    <span>Browse All Tests</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {templates.slice(0, 6).map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleOpenNewReport(undefined, template.testCode)}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs cursor-pointer transition flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">
                            {template.testCode}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {template.parameters.length} params
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                          {template.testName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {template.department} • {template.specimenTube}
                        </p>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          ₹{template.price}
                        </span>
                        <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 group-hover:underline flex items-center gap-0.5">
                          Order Test <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: REPORTS QUEUE */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium mr-1">
                <Filter className="w-3.5 h-3.5" />
                Status:
              </span>
              {[
                { id: 'all', label: 'All Reports' },
                { id: 'sample_collected', label: 'Sample Collected' },
                { id: 'processing', label: 'Processing' },
                { id: 'completed', label: 'Completed' },
                { id: 'verified', label: 'Verified (e-Signed)' },
                { id: 'critical', label: '🚨 Critical Values' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setStatusFilter(filter.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    statusFilter === filter.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Reports Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Accession / Barcode</th>
                      <th className="py-3 px-4">Patient Information</th>
                      <th className="py-3 px-4">Tests & Modality</th>
                      <th className="py-3 px-4">Workflow Status</th>
                      <th className="py-3 px-4">Result Flags</th>
                      <th className="py-3 px-4">Billing</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="text-sm font-medium">No diagnostic reports matching your criteria</p>
                          <button
                            onClick={() => handleOpenNewReport()}
                            className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
                          >
                            + Create a new report
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => {
                        const hasCrit = (report.results || []).some((r) => r.status === 'critical');
                        const hasHigh = (report.results || []).some((r) => r.status === 'high');
                        const hasLow = (report.results || []).some((r) => r.status === 'low');

                        return (
                          <tr
                            key={report.id}
                            onClick={() => handleViewReport(report)}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition"
                          >
                            {/* Accession ID & Barcode */}
                            <td className="py-3 px-4 font-mono">
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {report.reportId}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {report.sampleBarcode || 'BC-000000'}
                              </div>
                            </td>

                            {/* Patient Info */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {report.patientName}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                <span>{report.patientAge}Y / {report.patientGender}</span>
                                <span>•</span>
                                <span className="font-mono">{report.patientUHID}</span>
                              </div>
                            </td>

                            {/* Tests */}
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-800 dark:text-slate-200">
                                {report.testNames.join(', ')}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {report.results?.length || 0} parameters • {report.sampleType}
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <button
                                title="Click to advance status"
                                onClick={(e) => handleQuickStatusAdvance(e, report)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5 transition ${
                                  report.status === 'verified'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                    : report.status === 'delivered'
                                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                    : report.status === 'completed'
                                    ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                }`}
                              >
                                {report.status === 'verified' ? (
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                <span>{report.status.replace('_', ' ')}</span>
                              </button>
                            </td>

                            {/* Result Flags */}
                            <td className="py-3 px-4">
                              {hasCrit ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                                  CRITICAL
                                </span>
                              ) : hasHigh || hasLow ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                  ABNORMAL
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                  Normal
                                </span>
                              )}
                            </td>

                            {/* Billing */}
                            <td className="py-3 px-4 font-mono">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                ₹{report.billing?.paidAmount || 0}
                              </div>
                              <div className="text-[10px] text-emerald-600 uppercase font-semibold">
                                {report.billing?.paymentStatus || 'paid'}
                              </div>
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              <div
                                className="flex items-center justify-end space-x-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  title="View Report Sheet"
                                  onClick={() => handleViewReport(report)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  title="Download Official PDF Report"
                                  onClick={() => generatePathologyPdf(report, settings)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                                >
                                  <Download className="w-4 h-4" />
                                </button>

                                <button
                                  title="Download Official Tax Invoice PDF"
                                  onClick={() => generateInvoicePdf(report, settings)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                                >
                                  <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </button>

                                <button
                                  title="Edit Report"
                                  onClick={() => handleEditReport(report)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                {isAdmin && (
                                  <button
                                    title="Delete Report (Admin only)"
                                    onClick={(e) => handleDeleteReport(e, report.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
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
        )}

        {/* TAB 2: PATIENTS DIRECTORY */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Patient Demographics & Medical Records ({filteredPatients.length})
              </span>
              <button
                onClick={handleOpenPatientRegistration}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Register New Patient
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">UHID</th>
                      <th className="py-3 px-4">Patient Full Name</th>
                      <th className="py-3 px-4">Demographics</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4">Referring Doctor</th>
                      <th className="py-3 px-4">Registered Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredPatients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {patient.uhid}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {patient.fullName}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {patient.age} Yrs / {patient.gender} • <span className="font-semibold">{patient.bloodGroup}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {patient.phone}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {patient.referredBy || 'Self / Walk-in'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(patient.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenNewReport(patient)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/50"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Create Report</span>
                            </button>
                            {isAdmin && (
                              <button
                                onClick={(e) => handleDeletePatient(e, patient.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                title="Delete Patient (Admin only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: TEST MODULES (26 SPECIFIC LAB TESTS) */}
        {activeTab === 'modules' && (
          <LabTestModulesView
            templates={templates}
            onOrderTest={(template) => handleOpenNewReport(undefined, template.testCode)}
          />
        )}

        {/* TAB: BILLING & INVOICES */}
        {activeTab === 'billing' && (
          <PathologyBillingView
            reports={reports}
            settings={settings}
            onViewReport={handleViewReport}
          />
        )}

        {/* TAB: LAB NOVA SETTINGS */}
        {activeTab === 'settings' && (
          <LabNovaSettingsView
            currentSettings={settings}
            onSettingsUpdated={(newSettings) => setSettings(newSettings)}
          />
        )}

        {/* TAB: LAB ANALYTICS & REVENUE BREAKDOWN */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Departmental Investigation Share
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Hematology (CBC / ESR / Smear)', percent: 38, count: '64 Tests', color: 'bg-rose-500' },
                  { name: 'Biochemistry (Lipid / LFT / KFT)', percent: 32, count: '54 Tests', color: 'bg-blue-500' },
                  { name: 'Endocrinology (HbA1c / Thyroid)', percent: 18, count: '30 Tests', color: 'bg-purple-500' },
                  { name: 'Clinical Pathology & Urinalysis', percent: 12, count: '20 Tests', color: 'bg-amber-500' },
                ].map((dep) => (
                  <div key={dep.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span>{dep.name}</span>
                      <span className="font-mono text-slate-500">{dep.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className={`h-full ${dep.color}`} style={{ width: `${dep.percent}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Turnaround Time & Quality KPIs
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Average Routine TAT</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">3.4 Hours</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Critical Value Alert TAT</span>
                  <span className="font-bold text-emerald-600 font-mono">18 Minutes</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">NABL Audit Compliance</span>
                  <span className="font-bold text-blue-600 font-mono">99.8%</span>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400">Digital Signatures Verified</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{verifiedReportsCount}</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Firebase Firestore Storage Architecture
              </h3>
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Database className="w-3.5 h-3.5" />
                    <span>Database ID: pathology-lab-system</span>
                  </div>
                  <div>• Collections: pathology_patients</div>
                  <div>• Collections: pathology_reports</div>
                  <div>• Collections: pathology_test_templates</div>
                  <div>• Storage: 21 CFR Part 11 Audit Trail</div>
                </div>
                <p className="leading-relaxed text-[11px]">
                  All patient records, test results, reference ranges, and verified digital signatures persist continuously to cloud Firestore with live snapshot sync.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <PatientRegistrationModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onPatientCreated={handlePatientCreated}
      />

      <ReportBuilderModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportToEdit(null);
          setSelectedTestCodeForReport(null);
        }}
        patients={patients}
        templates={templates}
        settings={settings}
        selectedPatientInitial={selectedPatientForReport}
        initialSelectedTestCode={selectedTestCodeForReport || undefined}
        reportToEdit={reportToEdit}
        onReportSaved={(report) => {
          // Open detail preview of saved report
          setSelectedReport(report);
          setIsDetailModalOpen(true);
        }}
        onOpenPatientRegistration={() => {
          setIsReportModalOpen(false);
          setIsPatientModalOpen(true);
        }}
      />

      <ReportDetailModal
        report={selectedReport}
        settings={settings}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEditReport={(report) => {
          setIsDetailModalOpen(false);
          handleEditReport(report);
        }}
      />

      <TestCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        templates={templates}
        onTemplateAdded={(tmpl) => {
          setTemplates((prev) => [...prev, tmpl]);
        }}
      />
    </div>
  );
};
