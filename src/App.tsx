import React, { useState } from 'react';
import { AiAssistantModal } from './components/AiAssistant/AiAssistantModal';
import { ScientificAnalytics } from './components/Analytics/ScientificAnalytics';
import { ComplianceAudit } from './components/Compliance/ComplianceAudit';
import { EquipmentManager } from './components/Equipment/EquipmentManager';
import { ChemicalInventory } from './components/Inventory/ChemicalInventory';
import { Navbar } from './components/Navbar';
import { ExperimentDetail } from './components/Notebook/ExperimentDetail';
import { NewExperimentModal } from './components/Notebook/NewExperimentModal';
import { NotebookList } from './components/Notebook/NotebookList';
import { Overview } from './components/Overview';
import { PathologyDashboard } from './components/Pathology/PathologyDashboard';
import { ProtocolLibrary } from './components/Protocols/ProtocolLibrary';
import { SampleRegistry } from './components/Samples/SampleRegistry';
import { LabProvider, useLab } from './context/LabContext';
import { Protocol } from './types';

const MainLabContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedExperimentId,
    setSelectedExperimentId,
    themeMode,
    addExperiment,
  } = useLab();

  const [isNewExpModalOpen, setIsNewExpModalOpen] = useState(false);

  const handleStartExperimentWithProtocol = (protocol: Protocol) => {
    const newExp = addExperiment({
      title: `Run: ${protocol.title}`,
      category: protocol.category.replace('_', ' ').toUpperCase(),
      hypothesis: `Execute and validate standard operating procedure "${protocol.title}" under controlled GLP conditions.`,
      tags: ['SOP_Execution', protocol.category || 'general'],
      protocolId: protocol.id,
      protocolSteps: (protocol.steps || []).map((s) => ({ ...s, completed: false })),
      reagents: protocol.reagents || [],
      status: 'in_progress',
    });

    setSelectedExperimentId(newExp.id);
    setActiveTab('eln');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Navbar />

      {activeTab === 'pathology' ? (
        <div className="flex-1">
          <PathologyDashboard />
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && (
            <Overview onNewExperimentClick={() => setIsNewExpModalOpen(true)} />
          )}

          {activeTab === 'eln' && (
            <>
              {selectedExperimentId ? (
                <ExperimentDetail
                  experimentId={selectedExperimentId}
                  onBack={() => setSelectedExperimentId(null)}
                />
              ) : (
                <NotebookList
                  onSelectExperiment={(id) => setSelectedExperimentId(id)}
                  onNewExperiment={() => setIsNewExpModalOpen(true)}
                />
              )}
            </>
          )}

          {activeTab === 'protocols' && (
            <ProtocolLibrary
              onStartExperimentWithProtocol={handleStartExperimentWithProtocol}
            />
          )}

          {activeTab === 'samples' && <SampleRegistry />}

          {activeTab === 'inventory' && <ChemicalInventory />}

          {activeTab === 'equipment' && <EquipmentManager />}

          {activeTab === 'analytics' && <ScientificAnalytics />}

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
      <NewExperimentModal
        isOpen={isNewExpModalOpen}
        onClose={() => setIsNewExpModalOpen(false)}
        onCreated={(newId) => {
          setSelectedExperimentId(newId);
          setActiveTab('eln');
        }}
      />

      <AiAssistantModal />
    </div>
  );
};

export default function App() {
  return (
    <LabProvider>
      <MainLabContent />
    </LabProvider>
  );
}
