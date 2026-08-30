import { ChemicalSafetyReport, DiagnosticResult, Protocol } from '../types';

export interface ProtocolGenRequest {
  title: string;
  goal: string;
  organism?: string;
  sampleType?: string;
  equipment?: string;
  constraints?: string;
}

export interface TroubleshootRequest {
  assayType: string;
  symptoms: string;
  experimentalConditions: string;
  observedData: string;
}

export interface ExperimentSummaryRequest {
  title: string;
  hypothesis: string;
  methods: string;
  rawResults: string;
  notes: string;
}

export interface ExperimentSummaryResponse {
  executiveSummary: string;
  conclusions: string[];
  futureDirections: string[];
  glpComplianceStatement: string;
}

export async function generateAIProtocol(data: ProtocolGenRequest): Promise<{ protocol: Protocol; source: string }> {
  const response = await fetch('/api/gemini/generate-protocol', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Server returned ${response.status}`);
  }

  const result = await response.json();
  const raw = result.protocol;

  const protocol: Protocol = {
    id: `PROT-${Date.now().toString(36).toUpperCase()}`,
    title: raw.title || data.title,
    category: 'molecular_biology',
    version: raw.version || '1.0.0',
    summary: raw.summary || '',
    estimatedDurationMinutes: raw.estimatedDurationMinutes || 90,
    ppeRequired: raw.ppeRequired || ['Lab Coat', 'Nitrile Gloves', 'Eye Protection'],
    reagents: raw.reagents || [],
    steps: (raw.steps || []).map((s: any, idx: number) => ({
      id: `step-${idx + 1}`,
      stepNumber: s.stepNumber || idx + 1,
      title: s.title || `Step ${idx + 1}`,
      description: s.description || '',
      durationMinutes: s.durationMinutes || 10,
      temperature: s.temperature || 'RT',
      requiresTimer: s.requiresTimer !== false,
      checkpoint: s.checkpoint || 'Confirm visual parameters',
      completed: false,
    })),
    qualityControls: raw.qualityControls || [],
    troubleshooting: raw.troubleshooting || [],
    createdAt: new Date().toISOString().split('T')[0],
    author: 'LabNova AI Specialist',
  };

  return { protocol, source: result.source };
}

export async function runAITroubleshooter(data: TroubleshootRequest): Promise<{ diagnosis: DiagnosticResult; source: string }> {
  const response = await fetch('/api/gemini/troubleshoot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Troubleshooting request failed' }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const res = await response.json();
  return { diagnosis: res.diagnosis, source: res.source };
}

export async function checkChemicalSafety(chemicals: string[]): Promise<{ safety: ChemicalSafetyReport; source: string }> {
  const response = await fetch('/api/gemini/chemical-safety', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chemicals }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Safety check failed' }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const res = await response.json();
  return { safety: res.safety, source: res.source };
}

export async function generateExperimentSummary(data: ExperimentSummaryRequest): Promise<{ report: ExperimentSummaryResponse; source: string }> {
  const response = await fetch('/api/gemini/summarize-experiment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Summary generation failed' }));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const res = await response.json();
  return { report: res.report, source: res.source };
}
