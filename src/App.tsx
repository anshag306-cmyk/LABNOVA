import React from 'react';
import { AiAssistantModal } from './components/AiAssistant/AiAssistantModal';
import { ComplianceAudit } from './components/Compliance/ComplianceAudit';
import { Navbar } from './components/Navbar';
import { PathologyDashboard } from './components/Pathology/PathologyDashboard';
import { LabProvider, useLab } from './context/LabContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LabNovaAuthView } from './components/Auth/LabNovaAuthView';
import { LabSwitcherModal } from './components/Pathology/LabSwitcherModal';
import { StaffManagementModal } from './components/Pathology/StaffManagementModal';

const MainLabContent: React.FC = () => {
  const {
    activeTab,
    themeMode,
  } = useLab();

  const {
    isAuthenticated,
    isLabSwitcherOpen,
    closeLabSwitcher,
    isStaffModalOpen,
    closeStaffModal,
  } = useAuth();

  // If unauthenticated, gate access with the secure LabNova Auth portal
  if (!isAuthenticated) {
    return <LabNovaAuthView />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Navbar />

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
              LabNova LIMS & ELN Platform v2.4.0
            </span>
            <span>•</span>
            <span>21 CFR Part 11 Compliant</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>GLP & ISO 17025 Standard</span>
            <span>•</span>
            <span>Cold-Chain Telemetry: NOMINAL</span>
            <span>•</span>
            <span>Local Vault Synchronized</span>
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
