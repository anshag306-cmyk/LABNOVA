export type ExperimentStatus = 'draft' | 'in_progress' | 'in_review' | 'approved' | 'completed';

export interface ProtocolStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  durationMinutes: number;
  temperature: string;
  requiresTimer: boolean;
  checkpoint: string;
  completed?: boolean;
  completedAt?: string;
  notes?: string;
}

export interface ReagentRequirement {
  name: string;
  amount: string;
  storage: string;
  lotNumber?: string;
  casNumber?: string;
}

export interface Protocol {
  id: string;
  title: string;
  category: 'molecular_biology' | 'genomics' | 'analytical_chemistry' | 'cell_culture' | 'biochemistry';
  version: string;
  summary: string;
  estimatedDurationMinutes: number;
  ppeRequired: string[];
  reagents: ReagentRequirement[];
  steps: ProtocolStep[];
  qualityControls: string[];
  troubleshooting?: { issue: string; remedy: string }[];
  createdAt: string;
  author: string;
}

export interface Experiment {
  id: string;
  title: string;
  projectCode: string;
  scientist: string;
  status: ExperimentStatus;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  hypothesis: string;
  protocolId?: string;
  protocolSteps: ProtocolStep[];
  reagents: ReagentRequirement[];
  rawResults: string;
  numericalData?: { label: string; value: number; unit: string; stdDev?: number }[];
  notes: string;
  signedBy?: string;
  signedAt?: string;
  signatureHash?: string;
  aiExecutiveSummary?: string;
  aiConclusions?: string[];
  aiFutureDirections?: string[];
}

export type SampleType = 'DNA' | 'RNA' | 'Protein' | 'Cell Line' | 'Tissue' | 'Small Molecule' | 'Buffer' | 'Plasma';

export interface Sample {
  id: string;
  name: string;
  type: SampleType;
  concentration: string;
  purityA260A280?: number;
  volumeRemainingUl: number;
  storageUnit: string;
  rackLocation: {
    rack: string;
    box: string;
    well: string; // e.g. 'A1', 'C4'
  };
  barcode: string;
  passageNumber?: number;
  biosafetyLevel: 'BSL-1' | 'BSL-2' | 'BSL-3';
  createdBy: string;
  createdAt: string;
  expiryDate: string;
  tags: string[];
  notes?: string;
}

export type GHSHazard = 'flammable' | 'toxic' | 'fatal' | 'corrosive' | 'irritant' | 'carcinogen' | 'mutagen' | 'oxidizer' | 'compressed_gas' | 'environmental';

export interface ChemicalInventoryItem {
  id: string;
  name: string;
  formula?: string;
  casNumber: string;
  supplier?: string;
  catalogNumber?: string;
  lotNumber?: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  expiryDate?: string;
  storageTemp: string;
  hazardDiamond?: {
    health: number; // 0-4
    flammability: number; // 0-4
    instability: number; // 0-4
    special: string; // 'W' (reacts with water), 'OX' (oxidizer), 'COR' (corrosive), 'None'
  };
  ppe?: string[];
  ghsTags?: string[];
  ghsHazards?: GHSHazard[];
  sdsSummary?: {
    signalWord?: string;
    hazardStatements?: string[];
    precautionaryStatements?: string[];
    firstAid?: string;
    ppeRequired?: string[];
  };
  location: string;
}

export interface EquipmentReservation {
  id: string;
  user: string;
  experimentTitle: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  category: 'Chromatography' | 'Sequencing' | 'Centrifugation' | 'Spectrophotometry' | 'Thermal Cycler' | 'Microscopy' | 'Incubation';
  status: 'available' | 'in_use' | 'maintenance' | 'calibration_due';
  location: string;
  lastCalibrated: string;
  nextCalibrationDue: string;
  currentBooking?: {
    user: string;
    experimentTitle: string;
    endTime: string;
  };
  reservations: EquipmentReservation[];
  specs: Record<string, string>;
}

export interface TelemetrySensor {
  id: string;
  name: string;
  location: string;
  parameter: 'temperature' | 'co2' | 'humidity' | 'pressure';
  value: number;
  unit: string;
  minLimit: number;
  maxLimit: number;
  status: 'normal' | 'warning' | 'critical';
  trend: 'stable' | 'rising' | 'falling';
  history: { time: string; value: number }[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: 'ELN' | 'Inventory' | 'Samples' | 'Instruments' | 'Protocols' | 'System';
  recordId: string;
  details: string;
  eSignHash?: string;
}

export interface ChemicalSafetyReport {
  compatibilityRating: string;
  dangerLevel: 'Low' | 'Moderate' | 'Severe' | 'Extreme';
  reactionHazard: string;
  ghsClassification: string[];
  nfpa704: { health: number; flammability: number; instability: number; special: string };
  ppeRecommendations: string[];
  disposalWasteStream: string;
  firstAid: {
    eyeExposure: string;
    skinContact: string;
    inhalation: string;
  };
}

export interface DiagnosticResult {
  primaryDiagnosis: string;
  confidence: number;
  rootCauses: string[];
  actionableSteps: string[];
  preventativeMeasures: string[];
}

// ==========================================
// PATHOLOGY LABORATORY MANAGEMENT TYPES
// ==========================================

export type PatientGender = 'Male' | 'Female' | 'Other';

export type UserRole = 'admin' | 'staff' | 'superadmin';

export interface LabUser {
  id: string; // Auth UID or doc ID
  email: string;
  displayName: string;
  name?: string;
  role: UserRole;
  labId: string;
  department?: string;
  phone?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Laboratory {
  id: string; // Unique tenant identifier, e.g. 'lab-nova-main'
  name: string;
  tagline: string;
  code: string; // Short code, e.g. 'LNV', 'APX'
  logoUrl?: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  licenseNumber: string;
  nablCertNumber: string;
  taxId?: string;
  pathologistName: string;
  pathologistQualification: string;
  pathologistRegistration: string;
  technologistName: string;
  technologistQualification: string;
  currency: string;
  headerColor: string;
  createdAt: string;
  ownerEmail?: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface PathologyPatient {
  id: string; // Firestore document ID
  labId?: string; // Tenant identifier
  uhid: string; // Unique Healthcare ID, e.g. UHID-2026-0142
  fullName: string;
  age: number;
  gender: PatientGender;
  phone: string;
  email?: string;
  address?: string;
  bloodGroup?: string;
  referredBy: string; // e.g. Dr. A. K. Sen, MD
  registeredAt: string;
  notes?: string;
}

export type ParameterFlag = 'normal' | 'low' | 'high' | 'critical';

export interface TestParameter {
  id: string;
  name: string;
  category?: string;
  unit: string;
  refRangeMin?: number;
  refRangeMax?: number;
  refRangeText: string;
  method?: string;
  criticalLow?: number;
  criticalHigh?: number;
}

export type PathologyCategory =
  | 'Hematology'
  | 'Biochemistry'
  | 'Immunology'
  | 'Clinical Pathology'
  | 'Serology'
  | 'Endocrinology'
  | 'Microbiology'
  | 'Infectious Diseases'
  | 'Coagulation';

export interface LabSettings {
  labId?: string; // Tenant identifier
  labName: string;
  tagline: string;
  logoUrl?: string;
  accreditationText: string;
  licenseNumber: string;
  nablCertNumber: string;
  taxId?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  pathologistName: string;
  pathologistQualification: string;
  pathologistRegistration: string;
  technologistName: string;
  technologistQualification: string;
  currency: string;
  headerColor: string;
}

export interface TestTemplate {
  id: string;
  labId?: string; // Tenant identifier for customized tariffs
  testCode: string;
  testName: string;
  category: PathologyCategory;
  sampleType: string; // e.g. EDTA Whole Blood, Serum, Urine
  sampleTubeColor?: string; // e.g. lavender, gold, red, blue, grey
  price: number;
  tatHours: number;
  parameters: TestParameter[];
  description?: string;
  specimenPrep?: string;
  clinicalSignificance?: string;
}

export interface ReportParameterResult {
  parameterId: string;
  name: string;
  category?: string;
  value: string;
  numericValue?: number;
  unit: string;
  refRangeText: string;
  status: ParameterFlag;
  method?: string;
  remarks?: string;
}

export type ReportStatus =
  | 'sample_collected'
  | 'processing'
  | 'completed'
  | 'verified'
  | 'delivered';

export type PaymentStatus = 'paid' | 'pending' | 'partial';
export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Online';

export interface ReportBilling {
  totalAmount: number;
  discount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode: PaymentMode;
}

export interface PathologyReport {
  id: string; // Firestore document ID
  labId?: string; // Tenant identifier
  reportId: string; // e.g. RPT-2026-0921
  patientId: string;
  patientUHID: string;
  patientName: string;
  patientAge: number;
  patientGender: PatientGender;
  patientPhone: string;
  patientAddress?: string;
  referredBy: string;
  sampleType: string;
  sampleBarcode: string;
  sampleCollectedAt: string;
  sampleReceivedAt: string;
  reportDate: string;
  testCodes: string[];
  testNames: string[];
  results: ReportParameterResult[];
  clinicalNotes?: string;
  interpretation?: string;
  status: ReportStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  digitalSignatureHash?: string;
  billing: ReportBilling;
  createdAt: string;
  updatedAt: string;
}

export interface PathologyStats {
  totalPatients: number;
  todayPatients: number;
  totalReports: number;
  pendingReports: number;
  verifiedReports: number;
  deliveredReports: number;
  criticalAlerts: number;
  todayRevenue: number;
  totalRevenue: number;
  pendingPaymentAmount: number;
}

