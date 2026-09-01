import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_EQUIPMENT,
  INITIAL_EXPERIMENTS,
  INITIAL_INVENTORY,
  INITIAL_PROTOCOLS,
  INITIAL_SAMPLES,
  INITIAL_SENSORS,
} from '../data/seedData';
import {
  AuditEntry,
  ChemicalInventoryItem,
  Equipment,
  EquipmentReservation,
  Experiment,
  Protocol,
  Sample,
  TelemetrySensor,
} from '../types';

export interface ActiveTimerState {
  protocolTitle: string;
  stepTitle: string;
  stepNumber: number;
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
}

export type LabNavTab = 'pathology' | 'overview' | 'eln' | 'protocols' | 'samples' | 'inventory' | 'equipment' | 'analytics' | 'compliance';

interface LabContextType {
  activeTab: LabNavTab;
  setActiveTab: (tab: LabNavTab) => void;
  selectedExperimentId: string | null;
  setSelectedExperimentId: (id: string | null) => void;
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Entities
  experiments: Experiment[];
  addExperiment: (exp: Partial<Experiment>) => Experiment;
  updateExperiment: (id: string, updates: Partial<Experiment>) => void;
  signExperiment: (id: string, scientistName: string) => void;
  deleteExperiment: (id: string) => void;

  protocols: Protocol[];
  addProtocol: (protocol: Protocol) => void;
  
  samples: Sample[];
  addSample: (sample: Partial<Sample>) => Sample;
  updateSample: (id: string, updates: Partial<Sample>) => void;
  deleteSample: (id: string) => void;

  inventory: ChemicalInventoryItem[];
  updateInventoryQuantity: (id: string, delta: number) => void;
  addInventoryItem: (item: ChemicalInventoryItem) => void;

  equipment: Equipment[];
  reserveEquipment: (equipmentId: string, reservation: Omit<EquipmentReservation, 'id'>) => void;
  updateEquipmentStatus: (equipmentId: string, status: Equipment['status']) => void;

  sensors: TelemetrySensor[];
  auditLogs: AuditEntry[];
  addAuditLog: (action: string, module: AuditEntry['module'], recordId: string, details: string, eSignHash?: string) => void;

  // Active protocol timer
  activeTimer: ActiveTimerState | null;
  startTimer: (protocolTitle: string, stepTitle: string, stepNumber: number, durationMinutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;

  // AI Assistant Modal
  isAiModalOpen: boolean;
  aiModalInitialMode: 'general' | 'troubleshoot' | 'chemical-safety' | 'protocol-gen';
  aiModalContextData: any;
  openAiAssistant: (mode?: 'general' | 'troubleshoot' | 'chemical-safety' | 'protocol-gen', contextData?: any) => void;
  closeAiAssistant: () => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('labnova_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    localStorage.setItem('labnova_theme', next);
  };

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<LabNavTab>('pathology');
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);

  // Entities stored in localStorage
  const [experiments, setExperiments] = useState<Experiment[]>(() => {
    try {
      const saved = localStorage.getItem('labnova_experiments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((exp: Experiment) => ({
            ...exp,
            protocolSteps: exp.protocolSteps || [],
            reagents: exp.reagents || [],
            tags: exp.tags || [],
            numericalData: exp.numericalData || [],
            aiConclusions: exp.aiConclusions || [],
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to restore experiments from localStorage', e);
    }
    return INITIAL_EXPERIMENTS;
  });

  const [protocols, setProtocols] = useState<Protocol[]>(() => {
    try {
      const saved = localStorage.getItem('labnova_protocols');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((p: Protocol) => ({
            ...p,
            steps: p.steps || [],
            reagents: p.reagents || [],
            ppeRequired: p.ppeRequired || [],
            qualityControls: p.qualityControls || [],
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to restore protocols from localStorage', e);
    }
    return INITIAL_PROTOCOLS;
  });

  const [samples, setSamples] = useState<Sample[]>(() => {
    try {
      const saved = localStorage.getItem('labnova_samples');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to restore samples from localStorage', e);
    }
    return INITIAL_SAMPLES;
  });

  const [inventory, setInventory] = useState<ChemicalInventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('labnova_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: ChemicalInventoryItem) => {
            const seedMatch = INITIAL_INVENTORY.find((si) => si.id === item.id);
            return {
              ...item,
              ghsHazards: item.ghsHazards || seedMatch?.ghsHazards || [],
              sdsSummary: item.sdsSummary || seedMatch?.sdsSummary,
              ppe: item.ppe || seedMatch?.ppe || ['Lab Coat', 'Nitrile Gloves'],
              ghsTags: item.ghsTags || seedMatch?.ghsTags || [],
            };
          });
        }
      }
    } catch (e) {
      console.warn('Failed to restore inventory from localStorage', e);
    }
    return INITIAL_INVENTORY;
  });

  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    try {
      const saved = localStorage.getItem('labnova_equipment');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((eq: Equipment) => ({
            ...eq,
            reservations: eq.reservations || [],
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to restore equipment from localStorage', e);
    }
    return INITIAL_EQUIPMENT;
  });

  const [sensors] = useState<TelemetrySensor[]>(INITIAL_SENSORS);

  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem('labnova_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to restore audit logs from localStorage', e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('labnova_experiments', JSON.stringify(experiments));
  }, [experiments]);

  useEffect(() => {
    localStorage.setItem('labnova_protocols', JSON.stringify(protocols));
  }, [protocols]);

  useEffect(() => {
    localStorage.setItem('labnova_samples', JSON.stringify(samples));
  }, [samples]);

  useEffect(() => {
    localStorage.setItem('labnova_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('labnova_equipment', JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem('labnova_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Audit logging helper
  const addAuditLog = (
    action: string,
    module: AuditEntry['module'],
    recordId: string,
    details: string,
    eSignHash?: string
  ) => {
    const newEntry: AuditEntry = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      user: 'active.operator@labnova.io',
      action,
      module,
      recordId,
      details,
      eSignHash,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Experiment Handlers
  const addExperiment = (exp: Partial<Experiment>): Experiment => {
    const id = `EXP-2026-${String(experiments.length + 84).padStart(3, '0')}`;
    const newExp: Experiment = {
      id,
      title: exp.title || 'Untitled Experiment',
      projectCode: exp.projectCode || 'NOVA-RES-01',
      scientist: exp.scientist || 'Active Researcher',
      status: exp.status || 'draft',
      category: exp.category || 'General Research',
      tags: exp.tags || ['Laboratory'],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      hypothesis: exp.hypothesis || '',
      protocolSteps: exp.protocolSteps || [],
      reagents: exp.reagents || [],
      rawResults: exp.rawResults || '',
      numericalData: exp.numericalData || [],
      notes: exp.notes || '',
    };

    setExperiments((prev) => [newExp, ...prev]);
    addAuditLog('EXPERIMENT_CREATED', 'ELN', id, `Initiated new experiment "${newExp.title}" in project ${newExp.projectCode}.`);
    return newExp;
  };

  const updateExperiment = (id: string, updates: Partial<Experiment>) => {
    setExperiments((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          const updated = {
            ...exp,
            ...updates,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          return updated;
        }
        return exp;
      })
    );
    addAuditLog('EXPERIMENT_UPDATED', 'ELN', id, `Modified fields on record ${id}.`);
  };

  const signExperiment = (id: string, scientistName: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    // Generate simulated SHA-256 hash
    const fakeHash = 'SHA256:' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    setExperiments((prev) =>
      prev.map((exp) => {
        if (exp.id === id) {
          return {
            ...exp,
            status: 'completed',
            signedBy: scientistName,
            signedAt: timestamp,
            signatureHash: fakeHash,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return exp;
      })
    );

    addAuditLog(
      'DIGITAL_SIGNATURE_APPLIED',
      'ELN',
      id,
      `21 CFR Part 11 compliant digital sign-off by ${scientistName}. Status set to COMPLETED.`,
      fakeHash
    );
  };

  const deleteExperiment = (id: string) => {
    const target = experiments.find((e) => e.id === id);
    setExperiments((prev) => prev.filter((e) => e.id !== id));
    if (selectedExperimentId === id) setSelectedExperimentId(null);
    addAuditLog('EXPERIMENT_ARCHIVED', 'ELN', id, `Archived experiment "${target?.title || id}".`);
  };

  // Protocols
  const addProtocol = (protocol: Protocol) => {
    setProtocols((prev) => [protocol, ...prev]);
    addAuditLog('PROTOCOL_REGISTERED', 'Protocols', protocol.id, `Added SOP protocol "${protocol.title}" v${protocol.version}.`);
  };

  // Samples
  const addSample = (sample: Partial<Sample>): Sample => {
    const id = `SMP-2026-${String(samples.length + 49).padStart(4, '0')}`;
    const newSample: Sample = {
      id,
      name: sample.name || 'Novel Specimen',
      type: sample.type || 'DNA',
      concentration: sample.concentration || '100 ng/µL',
      volumeRemainingUl: sample.volumeRemainingUl || 50,
      storageUnit: sample.storageUnit || 'Freezer -80°C Alpha',
      rackLocation: sample.rackLocation || { rack: 'Rack A1', box: 'Box-01', well: 'A1' },
      barcode: `LN8849${Math.floor(10000 + Math.random() * 90000)}`,
      biosafetyLevel: sample.biosafetyLevel || 'BSL-1',
      createdBy: sample.createdBy || 'Dr. Elena Rostova',
      createdAt: new Date().toISOString().split('T')[0],
      expiryDate: sample.expiryDate || '2028-08-30',
      tags: sample.tags || ['Laboratory'],
      notes: sample.notes || '',
    };

    setSamples((prev) => [newSample, ...prev]);
    addAuditLog('SAMPLE_INGESTED', 'Samples', id, `Registered sample "${newSample.name}" at location ${newSample.storageUnit} ${newSample.rackLocation.well}.`);
    return newSample;
  };

  const updateSample = (id: string, updates: Partial<Sample>) => {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    addAuditLog('SAMPLE_MODIFIED', 'Samples', id, `Updated sample record attributes.`);
  };

  const deleteSample = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id));
    addAuditLog('SAMPLE_DEPLETED', 'Samples', id, `Marked sample as consumed/depleted.`);
  };

  // Inventory
  const updateInventoryQuantity = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextQty = Math.max(0, Math.round((item.quantity + delta) * 10) / 10);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
    const item = inventory.find((i) => i.id === id);
    addAuditLog(
      delta > 0 ? 'REAGENT_RESTOCKED' : 'REAGENT_CONSUMED',
      'Inventory',
      id,
      `Adjusted ${item?.name || id} by ${delta > 0 ? '+' : ''}${delta} ${item?.unit || ''}.`
    );
  };

  const addInventoryItem = (item: ChemicalInventoryItem) => {
    setInventory((prev) => [item, ...prev]);
    addAuditLog('REAGENT_CATALOGED', 'Inventory', item.id, `Cataloged new reagent "${item.name}" (CAS: ${item.casNumber}).`);
  };

  // Equipment
  const reserveEquipment = (equipmentId: string, reservation: Omit<EquipmentReservation, 'id'>) => {
    const resId = `res-${Date.now().toString(36)}`;
    const fullRes: EquipmentReservation = { ...reservation, id: resId };

    setEquipment((prev) =>
      prev.map((eq) => {
        if (eq.id === equipmentId) {
          return {
            ...eq,
            reservations: [...eq.reservations, fullRes],
          };
        }
        return eq;
      })
    );

    const eq = equipment.find((e) => e.id === equipmentId);
    addAuditLog(
      'EQUIPMENT_RESERVED',
      'Instruments',
      equipmentId,
      `Scheduled ${eq?.name || equipmentId} for "${reservation.experimentTitle}" (${reservation.startTime} - ${reservation.endTime}).`
    );
  };

  const updateEquipmentStatus = (equipmentId: string, status: Equipment['status']) => {
    setEquipment((prev) =>
      prev.map((eq) => (eq.id === equipmentId ? { ...eq, status } : eq))
    );
    addAuditLog('INSTRUMENT_STATUS_CHANGED', 'Instruments', equipmentId, `Status updated to ${status.toUpperCase()}.`);
  };

  // Timer Management
  const [activeTimer, setActiveTimer] = useState<ActiveTimerState | null>(() => {
    const saved = localStorage.getItem('labnova_active_timer');
    return saved ? JSON.parse(saved) : null;
  });

  const startTimer = (protocolTitle: string, stepTitle: string, stepNumber: number, durationMinutes: number) => {
    const total = durationMinutes * 60;
    const nextTimer: ActiveTimerState = {
      protocolTitle,
      stepTitle,
      stepNumber,
      secondsRemaining: total,
      totalSeconds: total,
      isRunning: true,
    };
    setActiveTimer(nextTimer);
    localStorage.setItem('labnova_active_timer', JSON.stringify(nextTimer));
    addAuditLog('PROTOCOL_TIMER_STARTED', 'Protocols', `STEP-${stepNumber}`, `Timer started for "${stepTitle}" (${durationMinutes} min).`);
  };

  const pauseTimer = () => {
    if (!activeTimer) return;
    const updated = { ...activeTimer, isRunning: false };
    setActiveTimer(updated);
    localStorage.setItem('labnova_active_timer', JSON.stringify(updated));
  };

  const resumeTimer = () => {
    if (!activeTimer) return;
    const updated = { ...activeTimer, isRunning: true };
    setActiveTimer(updated);
    localStorage.setItem('labnova_active_timer', JSON.stringify(updated));
  };

  const resetTimer = () => {
    if (!activeTimer) return;
    const updated = { ...activeTimer, secondsRemaining: activeTimer.totalSeconds, isRunning: false };
    setActiveTimer(updated);
    localStorage.setItem('labnova_active_timer', JSON.stringify(updated));
  };

  const stopTimer = () => {
    setActiveTimer(null);
    localStorage.removeItem('labnova_active_timer');
  };

  // Timer ticker
  useEffect(() => {
    if (!activeTimer || !activeTimer.isRunning) return;

    const interval = setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev || !prev.isRunning) return prev;
        if (prev.secondsRemaining <= 1) {
          // Play audio notification chime
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.8);
          } catch (e) {
            // Audio context may be restricted before user gesture
          }

          addAuditLog('PROTOCOL_TIMER_ELAPSED', 'Protocols', `STEP-${prev.stepNumber}`, `Timer countdown reached zero for "${prev.stepTitle}".`);
          return { ...prev, secondsRemaining: 0, isRunning: false };
        }
        const next = { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
        localStorage.setItem('labnova_active_timer', JSON.stringify(next));
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer?.isRunning]);

  // AI Assistant Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiModalInitialMode, setAiModalInitialMode] = useState<'general' | 'troubleshoot' | 'chemical-safety' | 'protocol-gen'>('general');
  const [aiModalContextData, setAiModalContextData] = useState<any>(null);

  const openAiAssistant = (mode: 'general' | 'troubleshoot' | 'chemical-safety' | 'protocol-gen' = 'general', contextData?: any) => {
    setAiModalInitialMode(mode);
    setAiModalContextData(contextData || null);
    setIsAiModalOpen(true);
  };

  const closeAiAssistant = () => {
    setIsAiModalOpen(false);
  };

  return (
    <LabContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedExperimentId,
        setSelectedExperimentId,
        themeMode,
        toggleTheme,
        experiments,
        addExperiment,
        updateExperiment,
        signExperiment,
        deleteExperiment,
        protocols,
        addProtocol,
        samples,
        addSample,
        updateSample,
        deleteSample,
        inventory,
        updateInventoryQuantity,
        addInventoryItem,
        equipment,
        reserveEquipment,
        updateEquipmentStatus,
        sensors,
        auditLogs,
        addAuditLog,
        activeTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        stopTimer,
        isAiModalOpen,
        aiModalInitialMode,
        aiModalContextData,
        openAiAssistant,
        closeAiAssistant,
      }}
    >
      {children}
    </LabContext.Provider>
  );
};

export const useLab = () => {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
};
