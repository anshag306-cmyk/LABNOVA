import React, { useState, useEffect } from 'react';
import { AiAssistantModal } from './components/AiAssistant/AiAssistantModal';
import { ComplianceAudit } from './components/Compliance/ComplianceAudit';
import { Navbar } from './components/Navbar';
import { PathologyDashboard } from './components/Pathology/PathologyDashboard';
import { LabProvider, useLab } from './context/LabContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LabNovaAuthView } from './components/Auth/LabNovaAuthView';
import { LabSwitcherModal } from './components/Pathology/LabSwitcherModal';
import { StaffManagementModal } from './components/Pathology/StaffManagementModal';
import { PublicHomePage } from './components/Public/PublicHomePage';
import { SuperAdminDashboard } from './components/SuperAdmin/SuperAdminDashboard';
import { CreateLabOnboardingPage } from './components/Auth/CreateLabOnboardingPage';
import { MobileScanCaptureView } from './components/Pathology/MobileScanCaptureView';
import { PatientReportingRecordView } from './components/Public/PatientReportingRecordView';

const MainLabContent: React.FC = () => {
  // Check special URL parameters for Mobile Scan QR and Patient Reporting Record QR
  const [urlParams] = useState(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      return {
        mobileScanSession: search.get('mobileScanSession'),
        patientRecord: search.get('patientRecord'),
        ref: search.get('ref'),
      };
    }
    return { mobileScanSession: null, patientRecord: null, ref: null };
  });

  const {
    activeTab,
    themeMode,
  } = useLab();

  const {
    user,
    isAuthenticated,
    isSuperAdmin,
    needsLabRegistration,
    registerNewLab,
    logout,
    isLoading,
    isLabSwitcherOpen,
    closeLabSwitcher,
    isStaffModalOpen,
    closeStaffModal,
    switchLab,
  } = useAuth();

  // Navigation mode: 'public' (visitor website), 'auth' (staff login screen), 'dashboard' (authenticated LIMS), 'superadmin' (Super Admin Console)
  const [viewMode, setViewMode] = useState<'public' | 'auth' | 'dashboard' | 'superadmin'>('public');

  // When user authenticates or role changes, route according to role:
  // - Super Admin -> 'superadmin' master hub
  // - Normal Lab Staff -> 'dashboard' (isolated to user's assigned lab)
  useEffect(() => {
    if (isAuthenticated) {
      if (isSuperAdmin) {
        // If superadmin was not already inspecting a lab dashboard, default to superadmin console
        setViewMode((prev) => (prev === 'dashboard' ? 'dashboard' : 'superadmin'));
      } else {
        // Normal staff can only view operational dashboard
        setViewMode('dashboard');
      }
    } else {
      // When unauthenticated and currently on an internal dashboard, return to public homepage
      setViewMode((prev) => (prev === 'dashboard' || prev === 'superadmin' ? 'public' : prev));
    }
  }, [isAuthenticated, isSuperAdmin]);

  // Case 0: Mobile Scan Camera Capture Page (Opened from QR Code)
  if (urlParams.mobileScanSession) {
    return <MobileScanCaptureView sessionId={urlParams.mobileScanSession} />;
  }

  // Case 0.5: Secure Patient-Level Online Reporting Record View (Opened from Report QR Code)
  if (urlParams.patientRecord) {
    return (
      <PatientReportingRecordView
        patientRecordToken={urlParams.patientRecord}
        initialReportId={urlParams.ref || undefined}
        onBack={() => {
          window.location.href = window.location.pathname;
        }}
      />
    );
  }

  // Case 1: Staff explicitly requests login view
  if (!isAuthenticated && viewMode === 'auth') {
    return <LabNovaAuthView onBackToHome={() => setViewMode('public')} />;
  }

  // Case 1.5: Authenticated regular user with no registered laboratory -> Dedicated First-Time Onboarding
  if (isAuthenticated && !isSuperAdmin && (needsLabRegistration || !user?.tenantId)) {
    return (
      <CreateLabOnboardingPage
        userEmail={user?.email || ''}
        userName={user?.displayName || ''}
        onLogout={logout}
        isLoading={isLoading}
        onSubmit={async (labData) => {
          await registerNewLab(
            labData,
            labData.pathologistName || user?.displayName || 'Lab Director',
            labData.email || user?.email || ''
          );
          setViewMode('dashboard');
        }}
      />
    );
  }

  // Case 2: User is unauthenticated OR authenticated staff chooses to view public site
  if (!isAuthenticated || viewMode === 'public') {
    return (
      <PublicHomePage
        onOpenStaffLogin={() => setViewMode('auth')}
        onGoToDashboard={() => {
          if (isSuperAdmin) {
            setViewMode('superadmin');
          } else {
            setViewMode('dashboard');
          }
        }}
      />
    );
  }

  // Case 3: Super Admin viewing dedicated Master Management Console
  if (isSuperAdmin && viewMode === 'superadmin') {
    return (
      <>
        <SuperAdminDashboard
          onViewPublicSite={() => setViewMode('public')}
          onInspectLab={(labId: string) => {
            switchLab(labId);
            setViewMode('dashboard');
          }}
        />
        {/* Global Modals */}
        <AiAssistantModal />
        <LabSwitcherModal isOpen={isLabSwitcherOpen} onClose={closeLabSwitcher} />
        <StaffManagementModal isOpen={isStaffModalOpen} onClose={closeStaffModal} />
      </>
    );
  }

  // Case 4: Authenticated user accessing secure operational laboratory dashboard
  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Navbar
        onViewPublicWebsite={() => setViewMode('public')}
        onGoToSuperAdmin={isSuperAdmin ? () => setViewMode('superadmin') : undefined}
      />

      {activeTab === 'pathology' || activeTab === 'overview' ? (
        <div className="flex-1">
          <PathologyDashboard initialTab="overview" />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'compliance' && <ComplianceAudit />}
        </main>
      )}

      {/* Persistent Regulatory & GLP Status Footer */}
      <footer
        id="labnova-footer"
        className={`border-t py-4 text-xs transition-colors ${
          themeMode === 'dark'
            ? 'bg-slate-900/60 border-slate-800 text-slate-400'
            : 'bg-white/80 border-slate-200 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              LabNova LIMS & Diagnostic Platform
            </span>
            <span>•</span>
            <span>NABL ISO 15189 Partitioned Multi-Tenancy</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>Role-Based Access Control</span>
            <span>•</span>
            <span>Strict Tenant Isolation</span>
            <span>•</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">Secure Cloud Firestore</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <AiAssistantModal />

      {/* Auth & Multi-Lab Modals */}
      <LabSwitcherModal isOpen={isLabSwitcherOpen} onClose={closeLabSwitcher} />
      <StaffManagementModal isOpen={isStaffModalOpen} onClose={closeStaffModal} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LabProvider>
        <MainLabContent />
      </LabProvider>
    </AuthProvider>
  );
}
