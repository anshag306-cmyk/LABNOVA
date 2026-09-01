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
  where,
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
  Laboratory,
  LabUser,
} from '../types';
import {
  DEFAULT_TEST_TEMPLATES,
  INITIAL_PATHOLOGY_PATIENTS,
  INITIAL_PATHOLOGY_REPORTS,
  DEFAULT_LAB_SETTINGS,
  INITIAL_LABORATORIES,
  INITIAL_LAB_USERS,
  INITIAL_APEX_PATIENTS,
  INITIAL_APEX_REPORTS,
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
export const DEFAULT_LAB_ID = 'lab-nova-main';
export const PATIENTS_COLLECTION = 'pathology_patients';
export const REPORTS_COLLECTION = 'pathology_reports';
export const TEMPLATES_COLLECTION = 'pathology_test_templates';
export const SETTINGS_COLLECTION = 'pathology_settings';
export const LABS_COLLECTION = 'laboratories';
export const LAB_USERS_COLLECTION = 'lab_users';

// In-memory fallback / cache in case of initial hydration or offline preview
let cachedPatientsMap: Record<string, PathologyPatient[]> = {
  [DEFAULT_LAB_ID]: [...INITIAL_PATHOLOGY_PATIENTS],
  'lab-apex-diag': [...INITIAL_APEX_PATIENTS],
};

let cachedReportsMap: Record<string, PathologyReport[]> = {
  [DEFAULT_LAB_ID]: [...INITIAL_PATHOLOGY_REPORTS],
  'lab-apex-diag': [...INITIAL_APEX_REPORTS],
};

let cachedTemplates: TestTemplate[] = [...DEFAULT_TEST_TEMPLATES];
let cachedLabs: Laboratory[] = [...INITIAL_LABORATORIES];
let cachedStaffMap: Record<string, LabUser[]> = {
  [DEFAULT_LAB_ID]: INITIAL_LAB_USERS.filter((u) => u.labId === DEFAULT_LAB_ID),
  'lab-apex-diag': INITIAL_LAB_USERS.filter((u) => u.labId === 'lab-apex-diag'),
};

export let cachedSettings: LabSettings = { ...DEFAULT_LAB_SETTINGS, labId: DEFAULT_LAB_ID };

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

// -------------------------------------------------------------
// SEEDING & MIGRATION HELPER
// Preserves all existing data, safely assigns default labId if missing
// -------------------------------------------------------------

export async function seedInitialPathologyDataIfNeeded(_labId?: string): Promise<void> {
  try {
    // 1. Seed Laboratories if empty
    const labsSnap = await getDocs(collection(firestoreDb, LABS_COLLECTION));
    if (labsSnap.empty) {
      console.log('Seeding initial laboratories to Firestore...');
      for (const lab of INITIAL_LABORATORIES) {
        await setDoc(doc(firestoreDb, LABS_COLLECTION, lab.id), sanitizeForFirestore(lab));
      }
    }

    // 2. Seed Staff/Users if empty
    const usersSnap = await getDocs(collection(firestoreDb, LAB_USERS_COLLECTION));
    if (usersSnap.empty) {
      console.log('Seeding initial staff users to Firestore...');
      for (const user of INITIAL_LAB_USERS) {
        await setDoc(doc(firestoreDb, LAB_USERS_COLLECTION, user.id), sanitizeForFirestore(user));
      }
    }

    // 3. Seed Patients if empty or ensure Apex demo patients exist
    const patientsSnap = await getDocs(collection(firestoreDb, PATIENTS_COLLECTION));
    if (patientsSnap.empty) {
      console.log('Seeding initial pathology patients to Firestore...');
      for (const p of INITIAL_PATHOLOGY_PATIENTS) {
        await setDoc(
          doc(firestoreDb, PATIENTS_COLLECTION, p.id),
          sanitizeForFirestore({ ...p, labId: DEFAULT_LAB_ID })
        );
      }
      for (const p of INITIAL_APEX_PATIENTS) {
        await setDoc(
          doc(firestoreDb, PATIENTS_COLLECTION, p.id),
          sanitizeForFirestore(p)
        );
      }
    } else {
      // Safe non-destructive migration: tag any patient without labId as DEFAULT_LAB_ID
      for (const d of patientsSnap.docs) {
        const data = d.data();
        if (!data.labId) {
          updateDoc(doc(firestoreDb, PATIENTS_COLLECTION, d.id), { labId: DEFAULT_LAB_ID }).catch(
            () => {}
          );
        }
      }
    }

    // 4. Seed Reports if empty or migrate
    const reportsSnap = await getDocs(collection(firestoreDb, REPORTS_COLLECTION));
    if (reportsSnap.empty) {
      console.log('Seeding initial diagnostic reports to Firestore...');
      for (const r of INITIAL_PATHOLOGY_REPORTS) {
        await setDoc(
          doc(firestoreDb, REPORTS_COLLECTION, r.id),
          sanitizeForFirestore({ ...r, labId: DEFAULT_LAB_ID })
        );
      }
      for (const r of INITIAL_APEX_REPORTS) {
        await setDoc(
          doc(firestoreDb, REPORTS_COLLECTION, r.id),
          sanitizeForFirestore(r)
        );
      }
    } else {
      // Safe non-destructive migration: tag any report without labId as DEFAULT_LAB_ID
      for (const d of reportsSnap.docs) {
        const data = d.data();
        if (!data.labId) {
          updateDoc(doc(firestoreDb, REPORTS_COLLECTION, d.id), { labId: DEFAULT_LAB_ID }).catch(
            () => {}
          );
        }
      }
    }

    // 5. Seed Test Templates if missing
    const templatesSnap = await getDocs(collection(firestoreDb, TEMPLATES_COLLECTION));
    const existingTestCodes = new Set(
      templatesSnap.docs.map((d) => (d.data() as TestTemplate).testCode)
    );
    for (const t of DEFAULT_TEST_TEMPLATES) {
      if (!existingTestCodes.has(t.testCode)) {
        await setDoc(
          doc(firestoreDb, TEMPLATES_COLLECTION, t.id),
          sanitizeForFirestore({ ...t, labId: DEFAULT_LAB_ID })
        );
      }
    }

    // 6. Seed Settings
    const settingsGeneralRef = doc(firestoreDb, SETTINGS_COLLECTION, 'general_config');
    const settingsSnap = await getDocs(collection(firestoreDb, SETTINGS_COLLECTION));
    if (settingsSnap.empty) {
      await setDoc(
        settingsGeneralRef,
        sanitizeForFirestore({ ...DEFAULT_LAB_SETTINGS, labId: DEFAULT_LAB_ID })
      );
      await setDoc(
        doc(firestoreDb, SETTINGS_COLLECTION, DEFAULT_LAB_ID),
        sanitizeForFirestore({ ...DEFAULT_LAB_SETTINGS, labId: DEFAULT_LAB_ID })
      );
      // Apex settings
      const apexLab = INITIAL_LABORATORIES.find((l) => l.id === 'lab-apex-diag');
      if (apexLab) {
        await setDoc(
          doc(firestoreDb, SETTINGS_COLLECTION, 'lab-apex-diag'),
          sanitizeForFirestore({
            labId: 'lab-apex-diag',
            labName: apexLab.name,
            tagline: apexLab.tagline,
            logoUrl: apexLab.logoUrl || '',
            accreditationText: 'NABL Accredited ISO 15189:2022 | CAP Recognized',
            licenseNumber: apexLab.licenseNumber,
            nablCertNumber: apexLab.nablCertNumber,
            taxId: apexLab.taxId || '',
            address: apexLab.address,
            phone: apexLab.phone,
            email: apexLab.email,
            website: apexLab.website || '',
            pathologistName: apexLab.pathologistName,
            pathologistQualification: apexLab.pathologistQualification,
            pathologistRegistration: apexLab.pathologistRegistration,
            technologistName: apexLab.technologistName,
            technologistQualification: apexLab.technologistQualification,
            currency: apexLab.currency,
            headerColor: apexLab.headerColor,
          })
        );
      }
    }

    isFirebaseConnected = true;
  } catch (error) {
    console.warn('Firestore initial seeding or migration notice:', error);
  }
}

// -------------------------------------------------------------
// MULTI-TENANT PATIENT OPERATIONS
// -------------------------------------------------------------

export function subscribeToPatients(
  labIdOrCallback: string | ((patients: PathologyPatient[]) => void),
  maybeCallback?: (patients: PathologyPatient[]) => void,
  onError?: (err: Error) => void
) {
  const targetLabId =
    typeof labIdOrCallback === 'string' ? labIdOrCallback : DEFAULT_LAB_ID;
  const callback =
    typeof labIdOrCallback === 'function' ? labIdOrCallback : maybeCallback || (() => {});

  try {
    const q = query(
      collection(firestoreDb, PATIENTS_COLLECTION),
      orderBy('registeredAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        isFirebaseConnected = true;
        if (snapshot.empty) {
          seedInitialPathologyDataIfNeeded();
          const fallback = cachedPatientsMap[targetLabId] || cachedPatientsMap[DEFAULT_LAB_ID] || [];
          callback(fallback);
          return;
        }

        const allPatients: PathologyPatient[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as PathologyPatient;
          // Non-destructive auto-tagging
          if (!data.labId && targetLabId === DEFAULT_LAB_ID) {
            updateDoc(doc(firestoreDb, PATIENTS_COLLECTION, docSnap.id), {
              labId: DEFAULT_LAB_ID,
            }).catch(() => {});
          }
          return {
            ...data,
            id: docSnap.id,
            labId: data.labId || DEFAULT_LAB_ID,
          };
        });

        // Strict multi-tenant filtering: Only returns patients belonging to this lab
        const scopedPatients = allPatients.filter((p) => {
          if (targetLabId === DEFAULT_LAB_ID) {
            return p.labId === DEFAULT_LAB_ID || !p.labId;
          }
          return p.labId === targetLabId;
        });

        cachedPatientsMap[targetLabId] = scopedPatients;
        callback(scopedPatients);
      },
      (error) => {
        console.warn('Patients snapshot subscription fallback:', error);
        isFirebaseConnected = false;
        if (onError) onError(error);
        const fallback = cachedPatientsMap[targetLabId] || cachedPatientsMap[DEFAULT_LAB_ID] || [];
        callback(fallback);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to patients:', error);
    const fallback = cachedPatientsMap[targetLabId] || cachedPatientsMap[DEFAULT_LAB_ID] || [];
    callback(fallback);
    return () => {};
  }
}

export async function addPatientToFirestore(
  patientData: Omit<PathologyPatient, 'id'>,
  labId?: string
): Promise<PathologyPatient> {
  const finalLabId = labId || patientData.labId || DEFAULT_LAB_ID;
  const cleanData = sanitizeForFirestore({
    ...patientData,
    labId: finalLabId,
  });

  try {
    const docRef = await addDoc(
      collection(firestoreDb, PATIENTS_COLLECTION),
      cleanData
    );
    const newPatient: PathologyPatient = {
      ...cleanData,
      id: docRef.id,
    };
    const currentList = cachedPatientsMap[finalLabId] || [];
    cachedPatientsMap[finalLabId] = [
      newPatient,
      ...currentList.filter((p) => p.id !== docRef.id),
    ];
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
    // Update local cache
    for (const labId of Object.keys(cachedPatientsMap)) {
      cachedPatientsMap[labId] = cachedPatientsMap[labId].map((p) =>
        p.id === id ? { ...p, ...cleanUpdates } : p
      );
    }
  } catch (error) {
    console.error('Error updating patient in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${PATIENTS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function deletePatientFromFirestore(id: string, _labId?: string): Promise<void> {
  try {
    const docRef = doc(firestoreDb, PATIENTS_COLLECTION, id);
    await deleteDoc(docRef);
    for (const labId of Object.keys(cachedPatientsMap)) {
      cachedPatientsMap[labId] = cachedPatientsMap[labId].filter((p) => p.id !== id);
    }
  } catch (error) {
    console.error('Error deleting patient in Firestore:', error);
    handleFirestoreError(error, OperationType.DELETE, `${PATIENTS_COLLECTION}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// MULTI-TENANT REPORT OPERATIONS
// -------------------------------------------------------------

export function subscribeToReports(
  labIdOrCallback: string | ((reports: PathologyReport[]) => void),
  maybeCallback?: (reports: PathologyReport[]) => void,
  onError?: (err: Error) => void
) {
  const targetLabId =
    typeof labIdOrCallback === 'string' ? labIdOrCallback : DEFAULT_LAB_ID;
  const callback =
    typeof labIdOrCallback === 'function' ? labIdOrCallback : maybeCallback || (() => {});

  try {
    const q = query(
      collection(firestoreDb, REPORTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        isFirebaseConnected = true;
        if (snapshot.empty) {
          seedInitialPathologyDataIfNeeded();
          const fallback = cachedReportsMap[targetLabId] || cachedReportsMap[DEFAULT_LAB_ID] || [];
          callback(fallback);
          return;
        }

        const allReports: PathologyReport[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as PathologyReport;
          if (!data.labId && targetLabId === DEFAULT_LAB_ID) {
            updateDoc(doc(firestoreDb, REPORTS_COLLECTION, docSnap.id), {
              labId: DEFAULT_LAB_ID,
            }).catch(() => {});
          }
          return {
            ...data,
            id: docSnap.id,
            labId: data.labId || DEFAULT_LAB_ID,
            results: data.results || [],
            testCodes: data.testCodes || [],
            testNames: data.testNames || [],
          };
        });

        // Strict multi-tenant filtering: Only returns reports belonging to this lab
        const scopedReports = allReports.filter((r) => {
          if (targetLabId === DEFAULT_LAB_ID) {
            return r.labId === DEFAULT_LAB_ID || !r.labId;
          }
          return r.labId === targetLabId;
        });

        cachedReportsMap[targetLabId] = scopedReports;
        callback(scopedReports);
      },
      (error) => {
        console.warn('Reports snapshot subscription fallback:', error);
        isFirebaseConnected = false;
        if (onError) onError(error);
        const fallback = cachedReportsMap[targetLabId] || cachedReportsMap[DEFAULT_LAB_ID] || [];
        callback(fallback);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to reports:', error);
    const fallback = cachedReportsMap[targetLabId] || cachedReportsMap[DEFAULT_LAB_ID] || [];
    callback(fallback);
    return () => {};
  }
}

export async function addReportToFirestore(
  reportData: Omit<PathologyReport, 'id'>,
  labId?: string
): Promise<PathologyReport> {
  const finalLabId = labId || reportData.labId || DEFAULT_LAB_ID;
  const cleanData = sanitizeForFirestore({
    ...reportData,
    labId: finalLabId,
  });

  try {
    const docRef = await addDoc(
      collection(firestoreDb, REPORTS_COLLECTION),
      cleanData
    );
    const newReport: PathologyReport = {
      ...cleanData,
      id: docRef.id,
    };
    const currentList = cachedReportsMap[finalLabId] || [];
    cachedReportsMap[finalLabId] = [
      newReport,
      ...currentList.filter((r) => r.id !== docRef.id),
    ];
    return newReport;
  } catch (error) {
    console.error('Error adding report to Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, REPORTS_COLLECTION);
    throw error;
  }
}

export async function updateReportInFirestore(
  id: string,
  updates: Partial<PathologyReport>,
  _labId?: string
): Promise<void> {
  const cleanUpdates = sanitizeForFirestore({
    ...updates,
    updatedAt: new Date().toISOString(),
  });
  try {
    const docRef = doc(firestoreDb, REPORTS_COLLECTION, id);
    await updateDoc(docRef, cleanUpdates);
    for (const labId of Object.keys(cachedReportsMap)) {
      cachedReportsMap[labId] = cachedReportsMap[labId].map((r) =>
        r.id === id ? { ...r, ...cleanUpdates } : r
      );
    }
  } catch (error) {
    console.error('Error updating report in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${REPORTS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function updateReportStatusInFirestore(
  id: string,
  status: ReportStatus,
  extraUpdates?: Partial<PathologyReport>,
  _labId?: string
): Promise<void> {
  const updates: Partial<PathologyReport> = {
    status,
    ...extraUpdates,
    updatedAt: new Date().toISOString(),
  };
  await updateReportInFirestore(id, updates);
}

export async function deleteReportFromFirestore(id: string, _labId?: string): Promise<void> {
  try {
    const docRef = doc(firestoreDb, REPORTS_COLLECTION, id);
    await deleteDoc(docRef);
    for (const labId of Object.keys(cachedReportsMap)) {
      cachedReportsMap[labId] = cachedReportsMap[labId].filter((r) => r.id !== id);
    }
  } catch (error) {
    console.error('Error deleting report in Firestore:', error);
    handleFirestoreError(error, OperationType.DELETE, `${REPORTS_COLLECTION}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// TEST TEMPLATES & LAB-SPECIFIC TARIFF OPERATIONS
// -------------------------------------------------------------

export function subscribeToTestTemplates(
  labIdOrCallback?: string | ((templates: TestTemplate[]) => void),
  maybeCallback?: (templates: TestTemplate[]) => void
) {
  const targetLabId =
    typeof labIdOrCallback === 'string' ? labIdOrCallback : DEFAULT_LAB_ID;
  const callback =
    typeof labIdOrCallback === 'function' ? labIdOrCallback : maybeCallback || (() => {});

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

        // Overlay lab-specific custom price overrides if present
        const customLabTemplates = templates.filter((t) => t.labId === targetLabId);
        const customPriceMap = new Map<string, number>();
        customLabTemplates.forEach((ct) => {
          customPriceMap.set(ct.testCode, ct.price);
        });

        const mergedTemplates = DEFAULT_TEST_TEMPLATES.map((base) => {
          const matchingFirestore = templates.find((t) => t.testCode === base.testCode);
          const overridePrice = customPriceMap.get(base.testCode);
          return {
            ...base,
            ...(matchingFirestore || {}),
            price: overridePrice !== undefined ? overridePrice : matchingFirestore?.price || base.price,
            labId: targetLabId,
          };
        });

        cachedTemplates = mergedTemplates;
        callback(mergedTemplates);
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

/**
 * Updates or creates a tariff price for a specific laboratory.
 * Allows independent pricing per lab!
 */
export async function updateTestTemplatePriceInFirestore(
  testCode: string,
  newPrice: number,
  labId: string = DEFAULT_LAB_ID
): Promise<void> {
  try {
    const docId = `tariff_${labId}_${testCode}`.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const docRef = doc(firestoreDb, TEMPLATES_COLLECTION, docId);
    const baseTemplate = DEFAULT_TEST_TEMPLATES.find((t) => t.testCode === testCode);

    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...(baseTemplate || {}),
        testCode,
        price: Number(newPrice),
        labId,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );

    cachedTemplates = cachedTemplates.map((t) =>
      t.testCode === testCode ? { ...t, price: Number(newPrice) } : t
    );
  } catch (error) {
    console.error('Error updating test price:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${TEMPLATES_COLLECTION}/${testCode}`);
    throw error;
  }
}

export async function addTestTemplateToFirestore(
  template: Omit<TestTemplate, 'id'>,
  labId: string = DEFAULT_LAB_ID
): Promise<TestTemplate> {
  const cleanTemplate = sanitizeForFirestore({
    ...template,
    labId,
  });
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
// LAB SETTINGS & BRANDING OPERATIONS
// -------------------------------------------------------------

export function subscribeToLabSettings(
  labIdOrCallback?: string | ((settings: LabSettings) => void),
  maybeCallback?: (settings: LabSettings) => void
) {
  const targetLabId =
    typeof labIdOrCallback === 'string' ? labIdOrCallback : DEFAULT_LAB_ID;
  const callback =
    typeof labIdOrCallback === 'function' ? labIdOrCallback : maybeCallback || (() => {});

  try {
    // Check specific lab config document
    const docRef = doc(firestoreDb, SETTINGS_COLLECTION, targetLabId);
    const generalDocRef = doc(firestoreDb, SETTINGS_COLLECTION, 'general_config');

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as LabSettings;
          cachedSettings = { ...DEFAULT_LAB_SETTINGS, ...data, labId: targetLabId };
          callback(cachedSettings);
        } else {
          // If lab settings doc doesn't exist yet, fallback to general or initial lab profile
          const targetLab = cachedLabs.find((l) => l.id === targetLabId);
          if (targetLab) {
            const labSettings: LabSettings = {
              labId: targetLab.id,
              labName: targetLab.name,
              tagline: targetLab.tagline,
              logoUrl: targetLab.logoUrl || '',
              accreditationText: targetLab.nablCertNumber
                ? `NABL Accredited ISO 15189:2022 | Cert #${targetLab.nablCertNumber}`
                : DEFAULT_LAB_SETTINGS.accreditationText,
              licenseNumber: targetLab.licenseNumber,
              nablCertNumber: targetLab.nablCertNumber,
              taxId: targetLab.taxId || '',
              address: targetLab.address,
              phone: targetLab.phone,
              email: targetLab.email,
              website: targetLab.website || '',
              pathologistName: targetLab.pathologistName,
              pathologistQualification: targetLab.pathologistQualification,
              pathologistRegistration: targetLab.pathologistRegistration,
              technologistName: targetLab.technologistName,
              technologistQualification: targetLab.technologistQualification,
              currency: targetLab.currency,
              headerColor: targetLab.headerColor,
            };
            setDoc(docRef, sanitizeForFirestore(labSettings)).catch(() => {});
            cachedSettings = labSettings;
            callback(labSettings);
          } else {
            // General config fallback
            callback(cachedSettings);
          }
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
  settings: LabSettings,
  labId?: string
): Promise<void> {
  const targetLabId = labId || settings.labId || DEFAULT_LAB_ID;
  const cleanSettings = sanitizeForFirestore({
    ...settings,
    labId: targetLabId,
  });

  try {
    const docRef = doc(firestoreDb, SETTINGS_COLLECTION, targetLabId);
    await setDoc(docRef, cleanSettings, { merge: true });

    // If DEFAULT_LAB_ID, also sync general_config for backwards compatibility
    if (targetLabId === DEFAULT_LAB_ID) {
      const generalRef = doc(firestoreDb, SETTINGS_COLLECTION, 'general_config');
      await setDoc(generalRef, cleanSettings, { merge: true }).catch(() => {});
    }

    // Also update laboratory document in laboratories collection
    const labRef = doc(firestoreDb, LABS_COLLECTION, targetLabId);
    await setDoc(
      labRef,
      sanitizeForFirestore({
        name: settings.labName,
        tagline: settings.tagline,
        logoUrl: settings.logoUrl || '',
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        licenseNumber: settings.licenseNumber,
        nablCertNumber: settings.nablCertNumber,
        taxId: settings.taxId || '',
        pathologistName: settings.pathologistName,
        pathologistQualification: settings.pathologistQualification,
        pathologistRegistration: settings.pathologistRegistration,
        technologistName: settings.technologistName,
        technologistQualification: settings.technologistQualification,
        currency: settings.currency,
        headerColor: settings.headerColor,
      }),
      { merge: true }
    ).catch(() => {});

    cachedSettings = { ...cachedSettings, ...cleanSettings };
  } catch (error) {
    console.error('Error saving lab settings to Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${SETTINGS_COLLECTION}/${targetLabId}`);
    throw error;
  }
}

// -------------------------------------------------------------
// MULTI-LABORATORY TENANT MANAGEMENT
// -------------------------------------------------------------

export function subscribeToLaboratories(
  callback: (labs: Laboratory[]) => void
) {
  try {
    const colRef = collection(firestoreDb, LABS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          seedInitialPathologyDataIfNeeded();
          callback(cachedLabs);
          return;
        }

        const labs: Laboratory[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Laboratory;
          return {
            ...data,
            id: docSnap.id,
          };
        });

        cachedLabs = labs;
        callback(labs);
      },
      (error) => {
        console.warn('Laboratories snapshot fallback:', error);
        callback(cachedLabs);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to laboratories:', error);
    callback(cachedLabs);
    return () => {};
  }
}

export async function createNewLaboratoryInFirestore(
  labData: Laboratory,
  adminUser?: Partial<LabUser>
): Promise<Laboratory> {
  const cleanLab = sanitizeForFirestore({
    ...labData,
    createdAt: new Date().toISOString(),
    status: labData.status || 'active',
  });

  try {
    const labDocRef = doc(firestoreDb, LABS_COLLECTION, labData.id);
    await setDoc(labDocRef, cleanLab);

    // Create corresponding settings doc
    const settingsDocRef = doc(firestoreDb, SETTINGS_COLLECTION, labData.id);
    const initialSettings: LabSettings = {
      labId: labData.id,
      labName: labData.name,
      tagline: labData.tagline,
      logoUrl: labData.logoUrl || '',
      accreditationText: labData.nablCertNumber
        ? `NABL Accredited ISO 15189:2022 | Cert #${labData.nablCertNumber}`
        : 'ISO 15189 Accredited Clinical Pathology Laboratory',
      licenseNumber: labData.licenseNumber,
      nablCertNumber: labData.nablCertNumber,
      taxId: labData.taxId || '',
      address: labData.address,
      phone: labData.phone,
      email: labData.email,
      website: labData.website || '',
      pathologistName: labData.pathologistName,
      pathologistQualification: labData.pathologistQualification,
      pathologistRegistration: labData.pathologistRegistration,
      technologistName: labData.technologistName,
      technologistQualification: labData.technologistQualification,
      currency: labData.currency || '₹',
      headerColor: labData.headerColor || '#0f172a',
    };
    await setDoc(settingsDocRef, sanitizeForFirestore(initialSettings));

    // Register creator as Admin user in lab_users
    if (adminUser && adminUser.email) {
      const userId = adminUser.id || `usr-${Date.now()}`;
      const newUser: LabUser = {
        id: userId,
        email: adminUser.email,
        displayName: adminUser.displayName || 'Lab Administrator',
        role: 'admin',
        labId: labData.id,
        department: adminUser.department || 'Administration',
        phone: adminUser.phone || labData.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(firestoreDb, LAB_USERS_COLLECTION, userId), sanitizeForFirestore(newUser));
    }

    cachedLabs = [...cachedLabs.filter((l) => l.id !== labData.id), cleanLab];
    return cleanLab;
  } catch (error) {
    console.error('Error creating new laboratory in Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, `${LABS_COLLECTION}/${labData.id}`);
    throw error;
  }
}

export async function updateLaboratoryInFirestore(
  labId: string,
  updates: Partial<Laboratory>
): Promise<void> {
  const cleanUpdates = sanitizeForFirestore(updates);
  try {
    const docRef = doc(firestoreDb, LABS_COLLECTION, labId);
    await updateDoc(docRef, cleanUpdates);
    cachedLabs = cachedLabs.map((l) => (l.id === labId ? { ...l, ...cleanUpdates } : l));
  } catch (error) {
    console.error('Error updating laboratory in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${LABS_COLLECTION}/${labId}`);
    throw error;
  }
}

export async function deleteLaboratoryFromFirestore(labId: string): Promise<void> {
  try {
    const docRef = doc(firestoreDb, LABS_COLLECTION, labId);
    await deleteDoc(docRef);
    cachedLabs = cachedLabs.filter((l) => l.id !== labId);
  } catch (error) {
    console.error('Error deleting laboratory from Firestore:', error);
    handleFirestoreError(error, OperationType.DELETE, `${LABS_COLLECTION}/${labId}`);
    throw error;
  }
}

// -------------------------------------------------------------
// STAFF & ROLE MANAGEMENT (RBAC)
// -------------------------------------------------------------

export function subscribeToAllUsers(
  callback: (users: LabUser[]) => void
) {
  try {
    const colRef = collection(firestoreDb, LAB_USERS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          seedInitialPathologyDataIfNeeded();
          callback(INITIAL_LAB_USERS);
          return;
        }

        const allUsers: LabUser[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as LabUser;
          return {
            ...data,
            id: docSnap.id,
          };
        });

        callback(allUsers);
      },
      (error) => {
        console.warn('All users snapshot fallback:', error);
        callback(INITIAL_LAB_USERS);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to all users:', error);
    callback(INITIAL_LAB_USERS);
    return () => {};
  }
}

export function subscribeToLabStaff(
  labId: string,
  callback: (staff: LabUser[]) => void
) {
  try {
    const colRef = collection(firestoreDb, LAB_USERS_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          seedInitialPathologyDataIfNeeded();
          const fallback = cachedStaffMap[labId] || [];
          callback(fallback);
          return;
        }

        const allUsers: LabUser[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as LabUser;
          return {
            ...data,
            id: docSnap.id,
          };
        });

        // Filter staff strictly by laboratory tenant ID (superadmin is visible or scoped)
        const scopedStaff = allUsers.filter(
          (u) => u.labId === labId || (u.role === 'superadmin' && labId === DEFAULT_LAB_ID)
        );

        cachedStaffMap[labId] = scopedStaff;
        callback(scopedStaff);
      },
      (error) => {
        console.warn('Staff snapshot fallback:', error);
        callback(cachedStaffMap[labId] || []);
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to lab staff:', error);
    callback(cachedStaffMap[labId] || []);
    return () => {};
  }
}

export async function addStaffMemberToFirestore(
  staffData: Omit<LabUser, 'id'>
): Promise<LabUser> {
  const cleanData = sanitizeForFirestore({
    ...staffData,
    createdAt: new Date().toISOString(),
    status: staffData.status || 'active',
  });

  try {
    const docRef = await addDoc(
      collection(firestoreDb, LAB_USERS_COLLECTION),
      cleanData
    );
    const newStaff: LabUser = {
      ...cleanData,
      id: docRef.id,
    };
    const current = cachedStaffMap[staffData.labId] || [];
    cachedStaffMap[staffData.labId] = [newStaff, ...current];
    return newStaff;
  } catch (error) {
    console.error('Error adding staff member:', error);
    handleFirestoreError(error, OperationType.CREATE, LAB_USERS_COLLECTION);
    throw error;
  }
}

export async function updateStaffMemberInFirestore(
  id: string,
  updates: Partial<LabUser>
): Promise<void> {
  const cleanUpdates = sanitizeForFirestore(updates);
  try {
    const docRef = doc(firestoreDb, LAB_USERS_COLLECTION, id);
    await updateDoc(docRef, cleanUpdates);
    for (const labId of Object.keys(cachedStaffMap)) {
      cachedStaffMap[labId] = cachedStaffMap[labId].map((u) =>
        u.id === id ? { ...u, ...cleanUpdates } : u
      );
    }
  } catch (error) {
    console.error('Error updating staff member:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${LAB_USERS_COLLECTION}/${id}`);
    throw error;
  }
}

export async function deleteStaffMemberFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(firestoreDb, LAB_USERS_COLLECTION, id);
    await deleteDoc(docRef);
    for (const labId of Object.keys(cachedStaffMap)) {
      cachedStaffMap[labId] = cachedStaffMap[labId].filter((u) => u.id !== id);
    }
  } catch (error) {
    console.error('Error deleting staff member:', error);
    handleFirestoreError(error, OperationType.DELETE, `${LAB_USERS_COLLECTION}/${id}`);
    throw error;
  }
}

// -------------------------------------------------------------
// STATS / METRICS HELPER
// -------------------------------------------------------------

export function getCachedPathologyData() {
  return {
    patientsMap: cachedPatientsMap,
    reportsMap: cachedReportsMap,
    templates: cachedTemplates,
    labs: cachedLabs,
    settings: cachedSettings,
    isFirebaseConnected,
    databaseId: firebaseConfig.firestoreDatabaseId,
    projectId: firebaseConfig.projectId,
  };
}
