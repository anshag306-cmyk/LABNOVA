import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  PathologyPatient,
  PathologyReport,
  TestTemplate,
  ReportStatus,
  LabSettings,
} from '../types';
import {
  DEFAULT_TEST_TEMPLATES,
  INITIAL_PATHOLOGY_PATIENTS,
  INITIAL_PATHOLOGY_REPORTS,
  DEFAULT_LAB_SETTINGS,
} from '../data/pathologyTemplates';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use specific database ID as specified in firebase-applet-config.json
export const firestoreDb: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || undefined
);

// Collection references
export const PATIENTS_COLLECTION = 'pathology_patients';
export const REPORTS_COLLECTION = 'pathology_reports';
export const TEMPLATES_COLLECTION = 'pathology_test_templates';
export const SETTINGS_COLLECTION = 'pathology_settings';

// In-memory fallback / cache in case of initial hydration or transient network
let cachedPatients: PathologyPatient[] = [...INITIAL_PATHOLOGY_PATIENTS];
let cachedReports: PathologyReport[] = [...INITIAL_PATHOLOGY_REPORTS];
let cachedTemplates: TestTemplate[] = [...DEFAULT_TEST_TEMPLATES];
export let cachedSettings: LabSettings = { ...DEFAULT_LAB_SETTINGS };

let isFirebaseConnected = false;

// -------------------------------------------------------------
// FIRESTORE SANITIZATION & ERROR HANDLING
// -------------------------------------------------------------

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Deeply sanitizes data before sending to Firestore:
 * Strips all keys whose values are `undefined` because Firestore strictly forbids undefined values.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Validate connection to Firestore
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Please check your Firebase configuration or network status.');
    }
  }
}
testConnection();

// Auto-seed initial data if collections are empty or missing templates
export async function seedInitialPathologyDataIfNeeded(): Promise<void> {
  try {
    const patientsSnap = await getDocs(collection(firestoreDb, PATIENTS_COLLECTION));
    if (patientsSnap.empty) {
      console.log('Seeding initial pathology patients to Firestore...');
      for (const p of INITIAL_PATHOLOGY_PATIENTS) {
        await setDoc(doc(firestoreDb, PATIENTS_COLLECTION, p.id), sanitizeForFirestore(p));
      }
    }

    const reportsSnap = await getDocs(collection(firestoreDb, REPORTS_COLLECTION));
    if (reportsSnap.empty) {
      console.log('Seeding initial pathology diagnostic reports to Firestore...');
      for (const r of INITIAL_PATHOLOGY_REPORTS) {
        await setDoc(doc(firestoreDb, REPORTS_COLLECTION, r.id), sanitizeForFirestore(r));
      }
    }

    const templatesSnap = await getDocs(collection(firestoreDb, TEMPLATES_COLLECTION));
    const existingTestCodes = new Set(
      templatesSnap.docs.map((d) => (d.data() as TestTemplate).testCode)
    );
    for (const t of DEFAULT_TEST_TEMPLATES) {
      if (!existingTestCodes.has(t.testCode)) {
        await setDoc(doc(firestoreDb, TEMPLATES_COLLECTION, t.id), sanitizeForFirestore(t));
      }
    }

    // Seed default lab settings if not present
    const settingsRef = doc(firestoreDb, SETTINGS_COLLECTION, 'general_config');
    const settingsSnap = await getDocs(collection(firestoreDb, SETTINGS_COLLECTION));
    if (settingsSnap.empty) {
      await setDoc(settingsRef, sanitizeForFirestore(DEFAULT_LAB_SETTINGS));
    }

    isFirebaseConnected = true;
  } catch (error) {
    console.warn('Firestore initial seeding or read notice:', error);
  }
}

// -------------------------------------------------------------
// PATIENT OPERATIONS
// -------------------------------------------------------------

export function subscribeToPatients(
  callback: (patients: PathologyPatient[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(
      collection(firestoreDb, PATIENTS_COLLECTION),
      orderBy('registeredAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        isFirebaseConnected = true;
        if (snapshot.empty && cachedPatients.length > 0) {
          // If Firestore is still empty, trigger seed and return cache
          seedInitialPathologyDataIfNeeded();
          callback(cachedPatients);
          return;
        }

        const patients: PathologyPatient[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as PathologyPatient;
          return {
            ...data,
            id: docSnap.id,
          };
        });

        cachedPatients = patients;
        callback(patients);
      },
      (error) => {
        console.warn('Patients snapshot subscription fallback:', error);
        isFirebaseConnected = false;
        if (onError) onError(error);
        callback(cachedPatients);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to patients:', error);
    callback(cachedPatients);
    return () => {};
  }
}

export async function addPatientToFirestore(
  patientData: Omit<PathologyPatient, 'id'>
): Promise<PathologyPatient> {
  const cleanData = sanitizeForFirestore(patientData);
  try {
    const docRef = await addDoc(
      collection(firestoreDb, PATIENTS_COLLECTION),
      cleanData
    );
    const newPatient: PathologyPatient = {
      ...cleanData,
      id: docRef.id,
    };
    cachedPatients = [newPatient, ...cachedPatients.filter((p) => p.id !== docRef.id)];
    return newPatient;
  } catch (error) {
    console.error('Error adding patient to Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, PATIENTS_COLLECTION);
    throw error;
  }
}

export async function updatePatientInFirestore(
  id: string,
  updates: Partial<PathologyPatient>
): Promise<void> {
  const cleanUpdates = sanitizeForFirestore(updates);
  try {
    const docRef = doc(firestoreDb, PATIENTS_COLLECTION, id);
    await updateDoc(docRef, cleanUpdates);
    cachedPatients = cachedPatients.map((p) =>
      p.id === id ? { ...p, ...cleanUpdates } : p
    );
  } catch (error) {
    console.error('Error updating patient in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${PATIENTS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function deletePatientFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(firestoreDb, PATIENTS_COLLECTION, id);
    await deleteDoc(docRef);
    cachedPatients = cachedPatients.filter((p) => p.id !== id);
  } catch (error) {
    console.error('Error deleting patient in Firestore:', error);
    handleFirestoreError(error, OperationType.DELETE, `${PATIENTS_COLLECTION}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// REPORT OPERATIONS
// -------------------------------------------------------------

export function subscribeToReports(
  callback: (reports: PathologyReport[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(
      collection(firestoreDb, REPORTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        isFirebaseConnected = true;
        if (snapshot.empty && cachedReports.length > 0) {
          seedInitialPathologyDataIfNeeded();
          callback(cachedReports);
          return;
        }

        const reports: PathologyReport[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as PathologyReport;
          return {
            ...data,
            id: docSnap.id,
            results: data.results || [],
            testCodes: data.testCodes || [],
            testNames: data.testNames || [],
          };
        });

        cachedReports = reports;
        callback(reports);
      },
      (error) => {
        console.warn('Reports snapshot subscription fallback:', error);
        isFirebaseConnected = false;
        if (onError) onError(error);
        callback(cachedReports);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to reports:', error);
    callback(cachedReports);
    return () => {};
  }
}

export async function addReportToFirestore(
  reportData: Omit<PathologyReport, 'id'>
): Promise<PathologyReport> {
  const cleanData = sanitizeForFirestore(reportData);
  try {
    const docRef = await addDoc(
      collection(firestoreDb, REPORTS_COLLECTION),
      cleanData
    );
    const newReport: PathologyReport = {
      ...cleanData,
      id: docRef.id,
    };
    cachedReports = [newReport, ...cachedReports.filter((r) => r.id !== docRef.id)];
    return newReport;
  } catch (error) {
    console.error('Error adding report to Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, REPORTS_COLLECTION);
    throw error;
  }
}

export async function updateReportInFirestore(
  id: string,
  updates: Partial<PathologyReport>
): Promise<void> {
  const cleanUpdates = sanitizeForFirestore({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  try {
    const docRef = doc(firestoreDb, REPORTS_COLLECTION, id);
    await updateDoc(docRef, cleanUpdates);
    cachedReports = cachedReports.map((r) =>
      r.id === id ? { ...r, ...cleanUpdates } : r
    );
  } catch (error) {
    console.error('Error updating report in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function updateReportStatusInFirestore(
  id: string,
  status: ReportStatus,
  extraUpdates?: Partial<PathologyReport>
): Promise<void> {
  const updates: Partial<PathologyReport> = {
    status,
    ...extraUpdates,
    updatedAt: new Date().toISOString(),
  };
  await updateReportInFirestore(id, updates);
}

export async function deleteReportFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(firestoreDb, REPORTS_COLLECTION, id);
    await deleteDoc(docRef);
    cachedReports = cachedReports.filter((r) => r.id !== id);
  } catch (error) {
    console.error('Error deleting report in Firestore:', error);
    handleFirestoreError(error, OperationType.DELETE, `${REPORTS_COLLECTION}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// TEST TEMPLATES OPERATIONS
// -------------------------------------------------------------

export function subscribeToTestTemplates(
  callback: (templates: TestTemplate[]) => void
) {
  try {
    const colRef = collection(firestoreDb, TEMPLATES_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty && cachedTemplates.length > 0) {
          seedInitialPathologyDataIfNeeded();
          callback(cachedTemplates);
          return;
        }

        const templates: TestTemplate[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as TestTemplate;
          return {
            ...data,
            id: docSnap.id,
            parameters: data.parameters || [],
          };
        });

        cachedTemplates = templates;
        callback(templates);
      },
      (error) => {
        console.warn('Templates snapshot fallback:', error);
        callback(cachedTemplates);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to templates:', error);
    callback(cachedTemplates);
    return () => {};
  }
}

export async function addTestTemplateToFirestore(
  template: Omit<TestTemplate, 'id'>
): Promise<TestTemplate> {
  const cleanTemplate = sanitizeForFirestore(template);
  try {
    const docRef = await addDoc(
      collection(firestoreDb, TEMPLATES_COLLECTION),
      cleanTemplate
    );
    const newTmpl: TestTemplate = {
      ...cleanTemplate,
      id: docRef.id,
    };
    cachedTemplates = [...cachedTemplates.filter((t) => t.id !== docRef.id), newTmpl];
    return newTmpl;
  } catch (error) {
    console.error('Error adding test template:', error);
    handleFirestoreError(error, OperationType.CREATE, TEMPLATES_COLLECTION);
    throw error;
  }
}

// -------------------------------------------------------------
// LAB SETTINGS OPERATIONS
// -------------------------------------------------------------

export function subscribeToLabSettings(
  callback: (settings: LabSettings) => void
) {
  try {
    const docRef = doc(firestoreDb, SETTINGS_COLLECTION, 'general_config');
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as LabSettings;
          cachedSettings = { ...DEFAULT_LAB_SETTINGS, ...data };
          callback(cachedSettings);
        } else {
          // Auto-seed if not present
          setDoc(docRef, sanitizeForFirestore(DEFAULT_LAB_SETTINGS)).catch((err) =>
            console.warn('Auto-seed lab settings error:', err)
          );
          callback(cachedSettings);
        }
      },
      (error) => {
        console.warn('Settings snapshot fallback:', error);
        callback(cachedSettings);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to lab settings:', error);
    callback(cachedSettings);
    return () => {};
  }
}

export async function saveLabSettingsToFirestore(
  settings: LabSettings
): Promise<void> {
  const cleanSettings = sanitizeForFirestore(settings);
  try {
    const docRef = doc(firestoreDb, SETTINGS_COLLECTION, 'general_config');
    await setDoc(docRef, cleanSettings, { merge: true });
    cachedSettings = { ...cachedSettings, ...cleanSettings };
  } catch (error) {
    console.error('Error saving lab settings to Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${SETTINGS_COLLECTION}/general_config`);
    throw error;
  }
}

export function getCachedPathologyData() {
  return {
    patients: cachedPatients,
    reports: cachedReports,
    templates: cachedTemplates,
    settings: cachedSettings,
    isFirebaseConnected,
    databaseId: firebaseConfig.firestoreDatabaseId,
    projectId: firebaseConfig.projectId,
  };
}
