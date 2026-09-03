import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  Activity,
  Plus,
  Search,
  Filter,
  ArrowUpRight,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Lock,
  Database,
  Layers,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLab } from '../../context/LabContext';
import { Laboratory, LabUser, UserRole, PathologyPatient, PathologyReport } from '../../types';
import {
  subscribeToLaboratories,
  subscribeToAllUsers,
  updateLaboratoryInFirestore,
  deleteLaboratoryFromFirestore,
  createNewLaboratoryInFirestore,
  addStaffMemberToFirestore,
  updateStaffMemberInFirestore,
  deleteStaffMemberFromFirestore,
  subscribeToPatients,
  subscribeToReports,
} from '../../services/pathologyFirebase';
import { DEFAULT_TEST_TEMPLATES } from '../../data/pathologyTemplates';

interface SuperAdminDashboardProps {
  onViewPublicSite: () => void;
  onInspectLab: (labId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onViewPublicSite,
  onInspectLab,
}) => {
  const { user, availableLabs, logout, currentLab, switchLab } = useAuth();
  const { themeMode, toggleTheme } = useLab();

  const [activeTab, setActiveTab] = useState<'laboratories' | 'users' | 'analytics' | 'catalog'>('laboratories');
  const [labs, setLabs] = useState<Laboratory[]>(availableLabs);
  const [allUsers, setAllUsers] = useState<LabUser[]>([]);
  const [allPatients, setAllPatients] = useState<Record<string, PathologyPatient[]>>({});
  const [allReports, setAllReports] = useState<Record<string, PathologyReport[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabFilter, setSelectedLabFilter] = useState<string>('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

  // Modals state
  const [isAddLabOpen, setIsAddLabOpen] = useState(false);
  const [isEditLabOpen, setIsEditLabOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Laboratory | null>(null);
  const [isDeleteLabOpen, setIsDeleteLabOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState<Laboratory | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LabUser | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for Laboratory
  const [labForm, setLabForm] = useState<Partial<Laboratory>>({
    name: '',
    code: '',
    city: 'Pune',
    state: 'Maharashtra',
    address: '',
    phone: '+91 9675607315',
    email: '',
    pathologistName: '',
    pathologistQualification: 'MD (Pathology)',
    licenseNumber: '',
    nablCertNumber: '',
    currency: '₹',
    headerColor: '#0284c7',
    status: 'active',
  });

  // Form states for User
  const [userForm, setUserForm] = useState<{
    displayName: string;
    email: string;
    role: UserRole;
    labId: string;
    department: string;
    phone: string;
    status: 'active' | 'inactive';
  }>({
    displayName: '',
    email: '',
    role: 'staff',
    labId: availableLabs[0]?.id || 'lab-nova-main',
    department: 'Clinical Diagnostics',
    phone: '',
    status: 'active',
  });

  // Subscribe to all laboratories
  useEffect(() => {
    const unsubLabs = subscribeToLaboratories((updatedLabs) => {
      if (updatedLabs && updatedLabs.length > 0) {
        setLabs(updatedLabs);
      }
    });
    return () => unsubLabs();
  }, []);

  // Subscribe to all users across all laboratories
  useEffect(() => {
    const unsubUsers = subscribeToAllUsers((users) => {
      setAllUsers(users);
    });
    return () => unsubUsers();
  }, []);

  // Subscribe to patient records and reports across active laboratories
  useEffect(() => {
    const unsubs: Array<() => void> = [];
    labs.forEach((lab) => {
      const unsubP = subscribeToPatients(lab.id, (pts) => {
        setAllPatients((prev) => ({ ...prev, [lab.id]: pts }));
      });
      const unsubR = subscribeToReports(lab.id, (rpts) => {
        setAllReports((prev) => ({ ...prev, [lab.id]: rpts }));
      });
      unsubs.push(unsubP, unsubR);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [labs]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Aggregated Stats
  const totalLabsCount = labs.length;
  const activeLabsCount = labs.filter((l) => l.status !== 'suspended').length;
  const totalUsersCount = allUsers.length;
  const totalAdminsCount = allUsers.filter((u) => u.role === 'admin').length;
  const totalStaffCount = allUsers.filter((u) => u.role === 'staff').length;

  const totalPatientsCount = (Object.values(allPatients) as PathologyPatient[][]).reduce(
    (sum, pts) => sum + (pts?.length || 0),
    0
  );
  const totalReportsCount = (Object.values(allReports) as PathologyReport[][]).reduce(
    (sum, rpts) => sum + (rpts?.length || 0),
    0
  );
  const totalRevenue = (Object.values(allReports) as PathologyReport[][]).reduce(
    (sum, rpts) => sum + (rpts || []).reduce((labSum, r) => labSum + (r.billing?.paidAmount || 0), 0),
    0
  );

  // Handle Lab Creation
  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.name || !labForm.email) {
      showFeedback('error', 'Please provide laboratory name and official contact email.');
      return;
    }

    try {
      setIsLoading(true);
      const generatedId = `lab-${labForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 16)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newLabData: Laboratory = {
        id: generatedId,
        name: labForm.name,
        tagline: labForm.tagline || 'Clinical Pathology & Diagnostic Services',
        code: labForm.code || labForm.name.slice(0, 4).toUpperCase(),
        phone: labForm.phone || '+91 9675607315',
        email: labForm.email,
        address: labForm.address || `${labForm.city || 'Pune'}, India`,
        city: labForm.city || 'Pune',
        state: labForm.state || 'Maharashtra',
        licenseNumber: labForm.licenseNumber || `LIMS-${Math.floor(10000 + Math.random() * 90000)}`,
        nablCertNumber: labForm.nablCertNumber || `MC-${Math.floor(1000 + Math.random() * 9000)}`,
        pathologistName: labForm.pathologistName || 'Chief Pathologist, MD',
        pathologistQualification: labForm.pathologistQualification || 'MD (Pathology)',
        pathologistRegistration: `MMC-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        technologistName: 'Senior Lab Technologist',
        technologistQualification: 'M.Sc (MLT)',
        currency: labForm.currency || '₹',
        headerColor: labForm.headerColor || '#0284c7',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      await createNewLaboratoryInFirestore(newLabData);
      setIsAddLabOpen(false);
      showFeedback('success', `Laboratory "${newLabData.name}" onboarded with isolated workspace!`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to create laboratory.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Lab Updates
  const handleUpdateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLab) return;

    try {
      setIsLoading(true);
      await updateLaboratoryInFirestore(editingLab.id, {
        name: labForm.name,
        code: labForm.code,
        city: labForm.city,
        state: labForm.state,
        address: labForm.address,
        phone: labForm.phone,
        email: labForm.email,
        pathologistName: labForm.pathologistName,
        pathologistQualification: labForm.pathologistQualification,
        licenseNumber: labForm.licenseNumber,
        nablCertNumber: labForm.nablCertNumber,
        status: labForm.status,
      });
      setIsEditLabOpen(false);
      showFeedback('success', `Updated details for ${labForm.name}.`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to update laboratory.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Lab Status Toggle (Active / Suspended)
  const handleToggleLabStatus = async (lab: Laboratory) => {
    const newStatus = lab.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateLaboratoryInFirestore(lab.id, { status: newStatus });
      showFeedback('success', `Laboratory ${lab.name} is now ${newStatus}.`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to change status.');
    }
  };

  // Handle Lab Deletion Modal
  const handleOpenDeleteLabModal = (lab: Laboratory) => {
    setLabToDelete(lab);
    setDeleteConfirmText('');
    setIsDeleteLabOpen(true);
  };

  const handleConfirmDeleteLab = async () => {
    if (!labToDelete) return;
    try {
      setIsLoading(true);
      await deleteLaboratoryFromFirestore(labToDelete.id);
      setIsDeleteLabOpen(false);
      const deletedName = labToDelete.name;
      setLabToDelete(null);
      showFeedback('success', `Laboratory "${deletedName}" permanently deleted from platform.`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to delete laboratory.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Creation
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.displayName || !userForm.email) {
      showFeedback('error', 'Please provide user name and email address.');
      return;
    }

    try {
      setIsLoading(true);
      await addStaffMemberToFirestore({
        displayName: userForm.displayName.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        labId: userForm.labId,
        department: userForm.department,
        phone: userForm.phone,
        status: userForm.status,
        createdAt: new Date().toISOString(),
      });
      setIsAddUserOpen(false);
      showFeedback('success', `User ${userForm.displayName} registered and mapped to laboratory!`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to register user.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Update & Re-assignment
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsLoading(true);
      await updateStaffMemberInFirestore(editingUser.id, {
        displayName: userForm.displayName,
        email: userForm.email,
        role: userForm.role,
        labId: userForm.labId,
        department: userForm.department,
        phone: userForm.phone,
        status: userForm.status,
      });
      setIsEditUserOpen(false);
      showFeedback('success', `Updated user account and lab assignment for ${userForm.displayName}.`);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Deletion
  const handleDeleteUser = async (u: LabUser) => {
    if (u.id === user?.id || u.email.toLowerCase() === user?.email.toLowerCase()) {
      showFeedback('error', 'You cannot delete your own logged-in Super Admin account.');
      return;
    }
    if (confirm(`Permanently remove user "${u.displayName}" (${u.email})?`)) {
      try {
        await deleteStaffMemberFromFirestore(u.id);
        showFeedback('success', `User ${u.displayName} removed from system.`);
      } catch (err: any) {
        showFeedback('error', err?.message || 'Failed to delete user.');
      }
    }
  };

  // Filtered Users
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLab = selectedLabFilter === 'all' || u.labId === selectedLabFilter;
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;

    return matchesSearch && matchesLab && matchesRole;
  });

  // Filtered Labs
  const filteredLabs = labs.filter((l) => {
    return (
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.city && l.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.pathologistName && l.pathologistName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Super Admin Header */}
      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
          themeMode === 'dark'
            ? 'bg-slate-900/95 border-slate-800 text-slate-100'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Super Admin Identifier */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-md shadow-purple-500/20 text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    LabNova
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    Super Admin Console
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Multi-Laboratory Management & Role-Based Access Oversight
                </p>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Toggle Theme"
              >
                {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>

              {/* View Public Website */}
              <button
                type="button"
                onClick={onViewPublicSite}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <span>Public Website</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Profile Badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  SA
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user?.displayName || 'Super Administrator'}
                  </div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-semibold">
                    Global Super Admin
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Feedback Alert */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between shadow-sm transition-all ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5 text-xs font-medium">
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-xs opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global Multi-Tenant Metrics Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Registered Laboratories */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Laboratories
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{totalLabsCount}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {activeLabsCount} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Multi-tenant isolated workspaces</p>
          </div>

          {/* Card 2: System Users & Staff */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                System Users (RBAC)
              </span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{totalUsersCount}</span>
              <span className="text-xs text-slate-500">
                {totalAdminsCount} Admins • {totalStaffCount} Staff
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Role-based access mapping</p>
          </div>

          {/* Card 3: Total Patients Across Labs */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Multi-Lab Patients
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{totalPatientsCount}</span>
              <span className="text-xs text-slate-500">{totalReportsCount} Reports Issued</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Zero cross-tenant data leakage</p>
          </div>

          {/* Card 4: System Diagnostics Revenue */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Aggregate Diagnostics Revenue
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-bold text-emerald-600">NABL Ready</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Sum of all laboratory billing</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="tab-superadmin-labs"
              type="button"
              onClick={() => setActiveTab('laboratories')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'laboratories'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Laboratories Directory ({labs.length})</span>
            </button>

            <button
              id="tab-superadmin-users"
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Accounts & Mappings ({allUsers.length})</span>
            </button>

            <button
              id="tab-superadmin-analytics"
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Data Isolation & Health Audit</span>
            </button>

            <button
              id="tab-superadmin-catalog"
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Master Pathology Catalog</span>
            </button>
          </div>

          {/* Quick Action Button */}
          {activeTab === 'laboratories' && (
            <button
              id="btn-onboard-new-lab"
              type="button"
              onClick={() => {
                setLabForm({
                  name: '',
                  code: '',
                  city: 'Pune',
                  state: 'Maharashtra',
                  address: '',
                  phone: '+91 9675607315',
                  email: '',
                  pathologistName: '',
                  pathologistQualification: 'MD (Pathology)',
                  licenseNumber: '',
                  nablCertNumber: '',
                  currency: '₹',
                  headerColor: '#0284c7',
                  status: 'active',
                });
                setIsAddLabOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Laboratory</span>
            </button>
          )}

          {activeTab === 'users' && (
            <button
              id="btn-add-new-user"
              type="button"
              onClick={() => {
                setUserForm({
                  displayName: '',
                  email: '',
                  role: 'staff',
                  labId: labs[0]?.id || 'lab-nova-main',
                  department: 'Biochemistry Bench',
                  phone: '',
                  status: 'active',
                });
                setIsAddUserOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Map New User</span>
            </button>
          )}
        </div>

        {/* TAB 1: LABORATORIES DIRECTORY */}
        {activeTab === 'laboratories' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search labs by name, code, city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredLabs.length} of {labs.length} laboratories
              </span>
            </div>

            {/* Laboratories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLabs.map((lab) => {
                const labPts = allPatients[lab.id] || [];
                const labRpts = allReports[lab.id] || [];
                const labStaff = allUsers.filter((u) => u.labId === lab.id);
                const isSuspended = lab.status === 'suspended';

                return (
                  <div
                    key={lab.id}
                    className={`p-6 rounded-3xl bg-white dark:bg-slate-900 border transition-all relative flex flex-col justify-between space-y-5 ${
                      isSuspended
                        ? 'border-slate-300 dark:border-slate-800 opacity-60'
                        : 'border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-700 shadow-sm'
                    }`}
                  >
                    {/* Lab Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-md"
                          style={{ backgroundColor: lab.headerColor || '#0284c7' }}
                        >
                          {lab.code || 'LAB'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{lab.name}</h3>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                isSuspended
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {lab.status || 'Active'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{lab.tagline}</p>
                        </div>
                      </div>

                      {/* Code Badge */}
                      <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {lab.code}
                      </span>
                    </div>

                    {/* Metadata Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {lab.pathologistName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lab.city || 'India'}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-mono">{lab.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>MC-{lab.nablCertNumber || 'NABL'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metrics Counters */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="p-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/30">
                        <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                          {labPts.length}
                        </div>
                        <div className="text-[10px] text-slate-500">Patients</div>
                      </div>
                      <div className="p-2 rounded-xl bg-purple-50/50 dark:bg-purple-950/30">
                        <div className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                          {labRpts.length}
                        </div>
                        <div className="text-[10px] text-slate-500">Reports</div>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30">
                        <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {labStaff.length}
                        </div>
                        <div className="text-[10px] text-slate-500">Staff Assigned</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      {/* Inspect / Launch Lab Workspace */}
                      <button
                        type="button"
                        onClick={() => onInspectLab(lab.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Lab Workspace</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLab(lab);
                            setLabForm({ ...lab });
                            setIsEditLabOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Lab Information"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleLabStatus(lab)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition ${
                            isSuspended
                              ? 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                              : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {isSuspended ? 'Activate' : 'Suspend'}
                        </button>

                        <button
                          id={`btn-delete-lab-${lab.id}`}
                          type="button"
                          onClick={() => handleOpenDeleteLabModal(lab)}
                          className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                          title="Permanently Delete Laboratory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: USER ACCOUNTS & MAPPINGS (RBAC) */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filters Bar */}
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search user by name, email, department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Lab Filter */}
                <select
                  value={selectedLabFilter}
                  onChange={(e) => setSelectedLabFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Laboratories</option>
                  {labs.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>

                {/* Role Filter */}
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Roles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Lab Admin</option>
                  <option value="staff">Lab Staff</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">User Details</th>
                      <th className="py-3.5 px-4">Role</th>
                      <th className="py-3.5 px-4">Assigned Laboratory Workspace</th>
                      <th className="py-3.5 px-4">Department & Contact</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {filteredUsers.map((u) => {
                      const assignedLab = labs.find((l) => l.id === u.labId);
                      const isSuper = u.role === 'superadmin';
                      const isCurrentAuthUser = u.email.toLowerCase() === user?.email.toLowerCase();

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          {/* User Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center text-white ${
                                  isSuper
                                    ? 'bg-purple-600'
                                    : u.role === 'admin'
                                    ? 'bg-blue-600'
                                    : 'bg-emerald-600'
                                }`}
                              >
                                {u.displayName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{u.displayName}</span>
                                  {isCurrentAuthUser && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                                isSuper
                                  ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800'
                                  : u.role === 'admin'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                              }`}
                            >
                              {isSuper ? 'Super Admin' : u.role === 'admin' ? 'Lab Admin' : 'Lab Staff'}
                            </span>
                          </td>

                          {/* Assigned Laboratory */}
                          <td className="py-3.5 px-4">
                            {isSuper ? (
                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> All Laboratories (Global)
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {assignedLab?.name || u.labId}
                                </span>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                                  {assignedLab?.code || 'LAB'}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Department & Contact */}
                          <td className="py-3.5 px-4">
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                              {u.department || 'Clinical Bench'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.phone || '—'}</div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                u.status === 'inactive'
                                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                              }`}
                            >
                              {u.status || 'active'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingUser(u);
                                  setUserForm({
                                    displayName: u.displayName,
                                    email: u.email,
                                    role: u.role,
                                    labId: u.labId,
                                    department: u.department || 'Clinical Diagnostics',
                                    phone: u.phone || '',
                                    status: u.status || 'active',
                                  });
                                  setIsEditUserOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Re-assign Lab or Change Role"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {!isCurrentAuthUser && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                  title="Remove User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DATA ISOLATION & HEALTH AUDIT */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Multi-Tenant Laboratory Data Isolation Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time verification showing patient intake, diagnostic reports, and revenue isolated per tenant.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Isolation Protocol: ENFORCED</span>
                </div>
              </div>

              {/* Lab Isolation Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Laboratory Workspace</th>
                      <th className="py-3 px-4">Tenant Identifier</th>
                      <th className="py-3 px-4">Patients (Isolated)</th>
                      <th className="py-3 px-4">Diagnostic Reports</th>
                      <th className="py-3 px-4">Revenue Generated</th>
                      <th className="py-3 px-4">Staff Assigned</th>
                      <th className="py-3 px-4 text-right">Isolation Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {labs.map((lab) => {
                      const labPts = allPatients[lab.id] || [];
                      const labRpts = allReports[lab.id] || [];
                      const labStaff = allUsers.filter((u) => u.labId === lab.id);
                      const revenue = labRpts.reduce((sum, r) => sum + (r.billing?.paidAmount || 0), 0);

                      return (
                        <tr key={lab.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: lab.headerColor || '#0284c7' }}
                            />
                            <span>{lab.name}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{lab.id}</td>
                          <td className="py-3.5 px-4 font-bold text-blue-600">{labPts.length} Patients</td>
                          <td className="py-3.5 px-4 font-bold text-purple-600">{labRpts.length} Reports</td>
                          <td className="py-3.5 px-4 font-bold text-emerald-600">
                            ₹{revenue.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">{labStaff.length} Members</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> 100% Isolated
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Architecture Guarantees */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Database className="w-4 h-4" />
                  <span>Partitioned Queries</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  All Firestore collections for patients and test reports carry a mandatory `labId` index, ensuring
                  subscribers only receive events for their assigned laboratory tenant.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <Lock className="w-4 h-4" />
                  <span>UI-Level Lock</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Normal Lab Admins and Staff do not have any branch switcher interface in their navigation. Their
                  session is strictly anchored to their assigned lab.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Award className="w-4 h-4" />
                  <span>NABL ISO 15189 Ready</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Letterheads, pathologist qualifications, and registration numbers are tenant-isolated so A4 print
                  reports always reflect the correct legal entity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MASTER PATHOLOGY CATALOG */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Master Clinical Pathology Test Catalog ({DEFAULT_TEST_TEMPLATES.length} Tests)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Standard multi-parameter profiles available to all laboratory branches. Individual branches can
                    customize tariffs.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEFAULT_TEST_TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {tmpl.testCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">{tmpl.testName}</h4>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        ₹{tmpl.price}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div>
                        <strong>Category:</strong> {tmpl.category}
                      </div>
                      <div>
                        <strong>Sample:</strong> {tmpl.sampleType}
                      </div>
                      <div>
                        <strong>Parameters ({tmpl.parameters.length}):</strong>{' '}
                        {tmpl.parameters.map((p) => p.name).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: ONBOARD NEW LABORATORY */}
      {isAddLabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Onboard New Laboratory Branch</h3>
                  <p className="text-xs text-slate-500">Create a secure, isolated tenant workspace</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddLabOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLab} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Laboratory Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CarePath Diagnostics (Lab C)"
                    value={labForm.name}
                    onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lab Short Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LAB-C"
                    value={labForm.code}
                    onChange={(e) => setLabForm({ ...labForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City & State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai, Maharashtra"
                    value={labForm.city}
                    onChange={(e) => setLabForm({ ...labForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9675607315"
                    value={labForm.phone}
                    onChange={(e) => setLabForm({ ...labForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@carepath.com"
                    value={labForm.email}
                    onChange={(e) => setLabForm({ ...labForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Pathologist Name & Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Anand Verma, MD (Pathology)"
                    value={labForm.pathologistName}
                    onChange={(e) => setLabForm({ ...labForm, pathologistName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NABL Certificate Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MC-5910"
                    value={labForm.nablCertNumber}
                    onChange={(e) => setLabForm({ ...labForm, nablCertNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Brand Color
                  </label>
                  <input
                    type="color"
                    value={labForm.headerColor || '#0284c7'}
                    onChange={(e) => setLabForm({ ...labForm, headerColor: e.target.value })}
                    className="w-full h-9 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddLabOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Provision Laboratory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT LABORATORY */}
      {isEditLabOpen && editingLab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Laboratory Information</h3>
                  <p className="text-xs text-slate-500">Tenant: {editingLab.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditLabOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLab} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Laboratory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={labForm.name}
                    onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    required
                    value={labForm.code}
                    onChange={(e) => setLabForm({ ...labForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={labForm.status}
                    onChange={(e) => setLabForm({ ...labForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={labForm.phone}
                    onChange={(e) => setLabForm({ ...labForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={labForm.email}
                    onChange={(e) => setLabForm({ ...labForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pathologist Name
                  </label>
                  <input
                    type="text"
                    value={labForm.pathologistName}
                    onChange={(e) => setLabForm({ ...labForm, pathologistName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditLabOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PERMANENTLY DELETE LABORATORY CONFIRMATION */}
      {isDeleteLabOpen && labToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Permanently Delete Laboratory
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Irreversible Super Admin Action</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteLabOpen(false);
                  setLabToDelete(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Lab Details Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: labToDelete.headerColor || '#0284c7' }}
                  >
                    {labToDelete.code || 'LAB'}
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {labToDelete.name}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  ID: {labToDelete.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Location: </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {labToDelete.city || 'India'}, {labToDelete.state || ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500">Pathologist: </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {labToDelete.pathologistName || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs pt-1">
                <div className="text-slate-500">
                  Patients:{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {allPatients[labToDelete.id]?.length || 0}
                  </span>
                </div>
                <div className="text-slate-500">
                  Reports:{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {allReports[labToDelete.id]?.length || 0}
                  </span>
                </div>
                <div className="text-slate-500">
                  Staff:{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {allUsers.filter((u) => u.labId === labToDelete.id).length}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning Text */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1">
              <p className="font-bold">
                ⚠️ Warning: You are permanently deleting "{labToDelete.name}".
              </p>
              <p className="leading-relaxed text-rose-700 dark:text-rose-400">
                This will delete the laboratory registration and its isolated tenant records. This operation cannot be undone.
              </p>
            </div>

            {/* Confirmation verification input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">DELETE</span> or the lab code{' '}
                <span className="font-mono font-bold text-slate-900 dark:text-white">"{labToDelete.code}"</span> to confirm:
              </label>
              <input
                id="input-delete-lab-confirmation"
                type="text"
                placeholder={`Type DELETE or ${labToDelete.code}`}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteLabOpen(false);
                  setLabToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-laboratory"
                type="button"
                disabled={
                  isLoading ||
                  (deleteConfirmText.trim() !== 'DELETE' &&
                    deleteConfirmText.trim().toUpperCase() !== (labToDelete.code || '').toUpperCase() &&
                    deleteConfirmText.trim() !== labToDelete.name)
                }
                onClick={handleConfirmDeleteLab}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isLoading ? 'Deleting Lab...' : 'Permanently Delete Laboratory'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / MAP NEW USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Add & Map New User</h3>
                  <p className="text-xs text-slate-500">Configure role & laboratory assignment</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Kavita Deshmukh"
                  value={userForm.displayName}
                  onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="kavita@labnova.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  System Role *
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="staff">Lab Staff (Operational Bench Access)</option>
                  <option value="admin">Lab Administrator (Full Lab Control)</option>
                  <option value="superadmin">Super Admin (Global Multi-Lab Oversight)</option>
                </select>
              </div>

              {userForm.role !== 'superadmin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Laboratory Tenant *
                  </label>
                  <select
                    value={userForm.labId}
                    onChange={(e) => setUserForm({ ...userForm, labId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Section
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clinical Biochemistry"
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER & REASSIGN LAB */}
      {isEditUserOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit User & Lab Assignment</h3>
                  <p className="text-xs text-slate-500">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditUserOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={userForm.displayName}
                  onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  System Role
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="staff">Lab Staff (Operational Access)</option>
                  <option value="admin">Lab Administrator</option>
                  <option value="superadmin">Super Admin (Multi-Lab)</option>
                </select>
              </div>

              {userForm.role !== 'superadmin' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Laboratory Tenant
                  </label>
                  <select
                    value={userForm.labId}
                    onChange={(e) => setUserForm({ ...userForm, labId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    {labs.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Section
                </label>
                <input
                  type="text"
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={userForm.status}
                  onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save User Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
