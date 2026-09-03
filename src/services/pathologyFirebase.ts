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
  HomeSampleBooking,
  UserRole,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_STAFF_PERMISSIONS,
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
import { optimizeBase64DataUrl } from '../utils/imageCompressor';

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
export const USERS_COLLECTION = 'users';
export const HOME_BOOKINGS_COLLECTION = 'home_sample_bookings';

// In-memory fallback / cache in case of initial hydration or offline preview
let cachedPatientsMap: Record<string, PathologyPatient[]> = {
  [DEFAULT_LAB_ID]: [...INITIAL_PATHOLOGY_PATIENTS],
  'lab-apex-diag': [...INITIAL_APEX_PATIENTS],
};

let cachedReportsMap: Record<string, PathologyReport[]> = {
  [DEFAULT_LAB_ID]: [...INITIAL_PATHOLOGY_REPORTS],
  'lab-apex-diag': [...INITIAL_APEX_REPORTS],
};

let cachedHomeBookingsMap: Record<string, HomeSampleBooking[]> = {
  [DEFAULT_LAB_ID]: [],
  'lab-apex-diag': [],
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

export { DEFAULT_ADMIN_PERMISSIONS, DEFAULT_STAFF_PERMISSIONS };

export const SUPERADMIN_EMAILS = [
  'anshag306@gmail.com',
  'ansh.ag.asr@gmail.com',
];

export function isOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SUPERADMIN_EMAILS.includes(clean);
}

/**
 * Resolves or initializes a complete, non-null tenant profile for the authenticated Firebase user.
 * Guarantees tenantId is never null, role and permissions are populated, and the document is synced to users/{uid}.
 */
export async function loadOrCreateUserProfile(
  fbUser: {
    uid?: string;
    id?: string;
    email?: string | null;
    displayName?: string | null;
    tenantId?: string | null;
  },
  defaultPreferredLabId?: string,
  overrides?: Partial<LabUser>
): Promise<LabUser> {
  const effectiveUid = fbUser.uid || fbUser.id || `usr-${Date.now()}`;
  const email = (overrides?.email || fbUser.email || '').trim().toLowerCase();
  const isOwner = isOwnerEmail(email);

  // 1. Super Admin: full access to master management console
  if (isOwner) {
    const resolvedTenantId = overrides?.tenantId || overrides?.labId || defaultPreferredLabId || DEFAULT_LAB_ID;
    const profile: LabUser = {
      id: effectiveUid,
      uid: effectiveUid,
      email: email || 'anshag306@gmail.com',
      displayName: overrides?.displayName || fbUser.displayName || 'Ansh Agrawal',
      role: 'superadmin',
      labId: resolvedTenantId,
      tenantId: resolvedTenantId,
      isLabOwner: true,
      needsLabRegistration: false,
      permissions: ['*'],
      department: 'Executive Administration & Multi-Lab Oversight',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(firestoreDb, USERS_COLLECTION, effectiveUid), sanitizeForFirestore(profile), { merge: true });
      await setDoc(doc(firestoreDb, LAB_USERS_COLLECTION, effectiveUid), sanitizeForFirestore(profile), { merge: true });
    } catch (err) {
      console.warn('Notice saving superadmin profile:', err);
    }
    return profile;
  }

  // 2. Regular User: Check if user owns or is registered to an existing laboratory
  let existingLabId: string | undefined = undefined;
  let isOwnerOfLab = false;

  // A. Check if user is the registered owner of any laboratory in Firestore
  try {
    const labsCol = collection(firestoreDb, LABS_COLLECTION);
    const qUid = query(labsCol, where('ownerUid', '==', effectiveUid));
    const snapUid = await getDocs(qUid);
    if (!snapUid.empty) {
      existingLabId = snapUid.docs[0].id;
      isOwnerOfLab = true;
    } else if (email) {
      const qEmail = query(labsCol, where('ownerEmail', '==', email));
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        existingLabId = snapEmail.docs[0].id;
        isOwnerOfLab = true;
      }
    }
  } catch (err) {
    console.warn('Notice checking owned lab in laboratories collection:', err);
  }

  // B. Check existing user profile in users/{uid}
  if (!existingLabId) {
    try {
      const userDocRef = doc(firestoreDb, USERS_COLLECTION, effectiveUid);
      const userDocSnap = await getDocFromServer(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        if (data.needsLabRegistration) {
          existingLabId = undefined;
        } else if (data.tenantId && data.tenantId !== DEFAULT_LAB_ID) {
          existingLabId = data.tenantId;
          isOwnerOfLab = Boolean(data.isLabOwner);
        }
      }
    } catch (err) {
      console.warn('Notice reading users/{uid}:', err);
    }
  }

  // C. Check if user is an invited staff member in lab_users
  if (!existingLabId) {
    try {
      const labUserDocRef = doc(firestoreDb, LAB_USERS_COLLECTION, effectiveUid);
      const labUserSnap = await getDocFromServer(labUserDocRef);
      if (labUserSnap.exists()) {
        const data = labUserSnap.data();
        if (data.tenantId && data.tenantId !== DEFAULT_LAB_ID) {
          existingLabId = data.tenantId;
        } else if (data.labId && data.labId !== DEFAULT_LAB_ID) {
          existingLabId = data.labId;
        }
      }
    } catch (err) {
      console.warn('Notice reading lab_users/{uid}:', err);
    }
  }

  // D. Check known demo seed staff if matching demo email
  if (!existingLabId && email) {
    const seedMatched = INITIAL_LAB_USERS.find(
      (u) => u.email.toLowerCase() === email
    );
    if (seedMatched && seedMatched.labId) {
      existingLabId = seedMatched.labId;
    }
  }

  // If explicit override with tenantId is passed (e.g. from registration flow)
  if (overrides?.tenantId || overrides?.labId) {
    existingLabId = overrides.tenantId || overrides.labId;
  }

  // E. Determine if user has an active laboratory or needs onboarding
  const hasLab = Boolean(existingLabId);
  const needsLabRegistration = !hasLab;

  const profile: LabUser = {
    id: effectiveUid,
    uid: effectiveUid,
    email: email || (fbUser.email || ''),
    displayName: overrides?.displayName || fbUser.displayName || (email ? email.split('@')[0] : 'Lab Owner'),
    role: overrides?.role || (isOwnerOfLab ? 'admin' : (hasLab ? 'staff' : 'admin')),
    labId: existingLabId || '',
    tenantId: existingLabId,
    isLabOwner: isOwnerOfLab,
    needsLabRegistration,
    permissions: isOwnerOfLab || !hasLab ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS,
    department: overrides?.department || (isOwnerOfLab || !hasLab ? 'Laboratory Administration' : 'Diagnostics & Clinical Operations'),
    phone: overrides?.phone || '',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(firestoreDb, USERS_COLLECTION, effectiveUid), sanitizeForFirestore(profile), { merge: true });
    if (hasLab) {
      await setDoc(doc(firestoreDb, LAB_USERS_COLLECTION, effectiveUid), sanitizeForFirestore(profile), { merge: true });
    }
  } catch (err) {
    console.warn('Notice saving user profile:', err);
  }

  return profile;
}

/**
 * Migration & Backfill routine:
 * Scans lab_users, pathology_patients, pathology_reports, and settings.
 * Ensures that any document missing `tenantId` is safely updated with a valid tenantId.
 */
export async function migrateAndBackfillTenants(): Promise<{
  usersUpdated: number;
  patientsUpdated: number;
  reportsUpdated: number;
  settingsUpdated: number;
}> {
  const stats = {
    usersUpdated: 0,
    patientsUpdated: 0,
    reportsUpdated: 0,
    settingsUpdated: 0,
  };

  try {
    // 1. Backfill lab_users and mirror to users/{uid}
    const staffSnap = await getDocs(collection(firestoreDb, LAB_USERS_COLLECTION));
    for (const d of staffSnap.docs) {
      const data = d.data();
      const resolvedTenantId = data.tenantId || data.labId || DEFAULT_LAB_ID;
      const role = data.role || 'staff';
      const permissions = data.permissions || (role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS);

      if (!data.tenantId || !data.permissions) {
        await updateDoc(doc(firestoreDb, LAB_USERS_COLLECTION, d.id), {
          tenantId: resolvedTenantId,
          labId: resolvedTenantId,
          permissions,
          status: data.status || 'active',
        }).catch(() => {});
        stats.usersUpdated++;
      }

      // Mirror to users collection so Firestore Security Rules can find it
      await setDoc(
        doc(firestoreDb, USERS_COLLECTION, d.id),
        sanitizeForFirestore({
          id: d.id,
          uid: d.id,
          email: data.email,
          displayName: data.displayName || data.name || 'Staff Member',
          role,
          labId: resolvedTenantId,
          tenantId: resolvedTenantId,
          permissions,
          department: data.department || 'Diagnostics',
          status: data.status || 'active',
          updatedAt: new Date().toISOString(),
        }),
        { merge: true }
      ).catch(() => {});
    }

    // 2. Backfill settings
    const settingsSnap = await getDocs(collection(firestoreDb, SETTINGS_COLLECTION));
    for (const d of settingsSnap.docs) {
      const data = d.data();
      const targetId = data.labId || d.id;
      if (!data.tenantId || data.tenantId !== targetId) {
        await updateDoc(doc(firestoreDb, SETTINGS_COLLECTION, d.id), {
          tenantId: targetId,
          labId: targetId,
        }).catch(() => {});
        stats.settingsUpdated++;
      }
    }

    // 3. Backfill patients
    const patientsSnap = await getDocs(collection(firestoreDb, PATIENTS_COLLECTION));
    for (const d of patientsSnap.docs) {
      const data = d.data();
      const targetId = data.labId || data.tenantId || DEFAULT_LAB_ID;
      if (!data.tenantId || !data.labId) {
        await updateDoc(doc(firestoreDb, PATIENTS_COLLECTION, d.id), {
          tenantId: targetId,
          labId: targetId,
        }).catch(() => {});
        stats.patientsUpdated++;
      }
    }

    // 4. Backfill reports
    const reportsSnap = await getDocs(collection(firestoreDb, REPORTS_COLLECTION));
    for (const d of reportsSnap.docs) {
      const data = d.data();
      const targetId = data.labId || data.tenantId || DEFAULT_LAB_ID;
      if (!data.tenantId || !data.labId) {
        await updateDoc(doc(firestoreDb, REPORTS_COLLECTION, d.id), {
          tenantId: targetId,
          labId: targetId,
        }).catch(() => {});
        stats.reportsUpdated++;
      }
    }

    console.log('✅ Multi-tenant migration and backfill completed successfully:', stats);
  } catch (error) {
    console.warn('Notice during migrateAndBackfillTenants:', error);
  }

  return stats;
}

// -------------------------------------------------------------
// MULTI-TENANT PATIENT OPERATIONS
// -------------------------------------------------------------

export function subscribeToPatients(
  labIdOrCallback: string | ((patients: PathologyPatient[]) => void),
  maybeCallback?: (patients: PathologyPatient[]) => void,
  onError?: (err: Error) => void,
  isSuperAdmin = false
) {
  const targetLabId =
    typeof labIdOrCallback === 'string' ? labIdOrCallback : DEFAULT_LAB_ID;
  const callback =
    typeof labIdOrCallback === 'function' ? labIdOrCallback : maybeCallback || (() => {});

  try {
    const colRef = collection(firestoreDb, PATIENTS_COLLECTION);
    const q = isSuperAdmin && !targetLabId
      ? query(colRef)
      : query(colRef, where('labId', '==', targetLabId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        isFirebaseConnected = true;
        if (snapshot.empty) {
          if (targetLabId === DEFAULT_LAB_ID) {
            seedInitialPathologyDataIfNeeded();
            const fallback = cachedPatientsMap[targetLabId] || [];
            callback(fallback);
          } else {
            cachedPatientsMap[targetLabId] = [];
            callback([]);
          }
          return;
        }

        const allPatients: PathologyPatient[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as PathologyPatient;
          return {
            ...data,
            id: docSnap.id,
            labId: data.labId || data.tenantId || targetLabId,
            tenantId: data.tenantId || data.labId || targetLabId,
          };
        });

        allPatients.sort((a, b) => {
          const tA = new Date(a.registeredAt || 0).getTime();
          const tB = new Date(b.registeredAt || 0).getTime();
          return tB - tA;
        });

        cachedPatientsMap[targetLabId] = allPatients;
        callback(allPatients);
      },
      (error) => {
        console.warn('Patients snapshot subscription fallback:', error);
        isFirebaseConnected = false;
        if (onError) onError(error);
        const fallback = cachedPatientsMap[targetLabId] || [];
        callback(fallback);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to patients:', error);
    const fallback = cachedPatientsMap[targetLabId] || [];
    callback(fallback);
    return () => {};
  }
}

export async function addPatientToFirestore(
  patientData: Omit<PathologyPatient, 'id'>,
  labId?: string
): Promise<PathologyPatient> {
  const finalLabId = (labId || patientData.labId || patientData.tenantId || '').trim() || DEFAULT_LAB_ID;
  const cleanData = sanitizeForFirestore({
    ...patientData,
    labId: finalLabId,
    tenantId: finalLabId,
    registeredAt: patientData.registeredAt || new Date().toISOString(),
  });

  try {
    const docRef = await addDoc(
      collection(firestoreDb, PATIENTS_COLLECTION),
      cleanData
    );
    const newPatient: PathologyPatient = {
      ...cleanData,
      id: docRef.id,
      labId: finalLabId,
      tenantId: finalLabId,
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
  onError?: (err: Error) => void,
  isSuperAdmin = false
) {
  const targetLabId =
    typeof labIdOrCallback === 'string' ? labIdOrCallback : DEFAULT_LAB_ID;
  const callback =
    typeof labIdOrCallback === 'function' ? labIdOrCallback : maybeCallback || (() => {});

  try {
    const colRef = collection(firestoreDb, REPORTS_COLLECTION);
    const q = isSuperAdmin && !targetLabId
      ? query(colRef)
      : query(colRef, where('labId', '==', targetLabId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        isFirebaseConnected = true;
        if (snapshot.empty) {
          if (targetLabId === DEFAULT_LAB_ID) {
            seedInitialPathologyDataIfNeeded();
            const fallback = cachedReportsMap[targetLabId] || [];
            callback(fallback);
          } else {
            cachedReportsMap[targetLabId] = [];
            callback([]);
          }
          return;
        }

        const allReports: PathologyReport[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as PathologyReport;
          return {
            ...data,
            id: docSnap.id,
            labId: data.labId || data.tenantId || targetLabId,
            tenantId: data.tenantId || data.labId || targetLabId,
            results: data.results || [],
            testCodes: data.testCodes || [],
            testNames: data.testNames || [],
          };
        });

        allReports.sort((a, b) => {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });

        cachedReportsMap[targetLabId] = allReports;
        callback(allReports);
      },
      (error) => {
        console.warn('Reports snapshot subscription fallback:', error);
        isFirebaseConnected = false;
        if (onError) onError(error);
        const fallback = cachedReportsMap[targetLabId] || [];
        callback(fallback);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to reports:', error);
    const fallback = cachedReportsMap[targetLabId] || [];
    callback(fallback);
    return () => {};
  }
}

export async function addReportToFirestore(
  reportData: Omit<PathologyReport, 'id'>,
  labId?: string
): Promise<PathologyReport> {
  const finalLabId = (labId || reportData.labId || reportData.tenantId || '').trim() || DEFAULT_LAB_ID;
  const cleanData = sanitizeForFirestore({
    ...reportData,
    labId: finalLabId,
    tenantId: finalLabId,
    createdAt: reportData.createdAt || new Date().toISOString(),
  });

  try {
    const docRef = await addDoc(
      collection(firestoreDb, REPORTS_COLLECTION),
      cleanData
    );
    const newReport: PathologyReport = {
      ...cleanData,
      id: docRef.id,
      labId: finalLabId,
      tenantId: finalLabId,
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

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as LabSettings;
          const merged: LabSettings =
            targetLabId === DEFAULT_LAB_ID
              ? { ...DEFAULT_LAB_SETTINGS, ...data, labId: targetLabId, tenantId: targetLabId }
              : { ...data, labId: targetLabId, tenantId: targetLabId };
          cachedSettings = merged;
          callback(merged);
        } else {
          // If lab settings doc doesn't exist yet, fallback to lab profile from cachedLabs
          const targetLab = cachedLabs.find((l) => l.id === targetLabId);
          if (targetLab) {
            const labSettings: LabSettings = {
              labId: targetLab.id,
              tenantId: targetLab.id,
              labName: targetLab.name,
              hospitalName: targetLab.hospitalName || '',
              tagline: targetLab.tagline,
              logoUrl: targetLab.logoUrl || '',
              accreditationText: targetLab.nablCertNumber
                ? `NABL Accredited ISO 15189:2022 | Cert #${targetLab.nablCertNumber}`
                : 'ISO 15189 Accredited Clinical Pathology Laboratory',
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
              letterheadTemplateId: targetLab.letterheadTemplateId || 'classic_medical',
              reportFooter: targetLab.reportFooter || '',
              reportHeader: targetLab.reportHeader || '',
            };
            setDoc(docRef, sanitizeForFirestore(labSettings)).catch(() => {});
            cachedSettings = labSettings;
            callback(labSettings);
          } else if (targetLabId === DEFAULT_LAB_ID) {
            cachedSettings = DEFAULT_LAB_SETTINGS;
            callback(DEFAULT_LAB_SETTINGS);
          } else {
            const emptySettings: LabSettings = {
              labId: targetLabId,
              tenantId: targetLabId,
              labName: 'Diagnostic Laboratory',
              tagline: 'Pathology & Diagnostic Services',
              accreditationText: 'ISO 15189 Accredited Clinical Laboratory',
              licenseNumber: '',
              nablCertNumber: '',
              address: '',
              phone: '',
              email: '',
              website: '',
              pathologistName: '',
              pathologistQualification: '',
              pathologistRegistration: '',
              technologistName: '',
              technologistQualification: '',
              currency: '₹',
              headerColor: '#0f172a',
              letterheadTemplateId: 'classic_medical',
            };
            cachedSettings = emptySettings;
            callback(emptySettings);
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
  const targetLabId = (labId || settings.labId || settings.tenantId || '').trim() || DEFAULT_LAB_ID;

  // Optimize logoUrl if present and large (> 80KB)
  let optimizedLogo = settings.logoUrl || '';
  if (optimizedLogo && optimizedLogo.startsWith('data:image/') && optimizedLogo.length > 80 * 1024) {
    try {
      optimizedLogo = await optimizeBase64DataUrl(optimizedLogo, 70 * 1024);
    } catch {
      // Fallback
    }
  }

  const cleanSettings = sanitizeForFirestore({
    ...settings,
    logoUrl: optimizedLogo,
    labId: targetLabId,
    tenantId: targetLabId,
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
        tenantId: targetLabId,
        name: settings.labName,
        tagline: settings.tagline,
        logoUrl: optimizedLogo,
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
        letterheadTemplateId: settings.letterheadTemplateId || 'classic_medical',
      }),
      { merge: true }
    ).catch(() => {});

    cachedSettings = { ...cleanSettings, labId: targetLabId, tenantId: targetLabId };
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
  let optimizedLogo = labData.logoUrl || '';
  if (optimizedLogo && optimizedLogo.startsWith('data:image/') && optimizedLogo.length > 80 * 1024) {
    try {
      optimizedLogo = await optimizeBase64DataUrl(optimizedLogo, 70 * 1024);
    } catch {
      // Fallback
    }
  }

  const effectiveUserId = adminUser?.id || (auth.currentUser ? auth.currentUser.uid : `usr-${Date.now()}`);
  const effectiveUserEmail = (
    adminUser?.email ||
    (auth.currentUser ? auth.currentUser.email : '') ||
    labData.email ||
    ''
  ).trim().toLowerCase();

  const cleanLab: Laboratory = sanitizeForFirestore({
    ...labData,
    tenantId: labData.id,
    ownerUid: effectiveUserId,
    ownerEmail: effectiveUserEmail,
    hospitalName: labData.hospitalName || '',
    letterheadTemplateId: labData.letterheadTemplateId || 'classic_medical',
    reportFooter: labData.reportFooter || '',
    reportHeader: labData.reportHeader || '',
    logoUrl: optimizedLogo,
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
      tenantId: labData.id,
      labName: labData.name,
      hospitalName: labData.hospitalName || '',
      tagline: labData.tagline,
      logoUrl: optimizedLogo,
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
      letterheadTemplateId: labData.letterheadTemplateId || 'classic_medical',
      reportFooter: labData.reportFooter || '',
      reportHeader: labData.reportHeader || '',
    };
    await setDoc(settingsDocRef, sanitizeForFirestore(initialSettings));

    // Register creator as Admin user in lab_users and users
    if (effectiveUserEmail || effectiveUserId) {
      const newUser: LabUser = {
        id: effectiveUserId,
        uid: effectiveUserId,
        email: effectiveUserEmail,
        displayName: adminUser?.displayName || labData.pathologistName || 'Lab Administrator',
        role: 'admin',
        labId: labData.id,
        tenantId: labData.id,
        isLabOwner: true,
        needsLabRegistration: false,
        permissions: DEFAULT_ADMIN_PERMISSIONS,
        department: adminUser?.department || 'Laboratory Administration',
        phone: adminUser?.phone || labData.phone,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(firestoreDb, LAB_USERS_COLLECTION, effectiveUserId), sanitizeForFirestore(newUser), { merge: true }).catch(() => {});
      await setDoc(doc(firestoreDb, USERS_COLLECTION, effectiveUserId), sanitizeForFirestore(newUser), { merge: true }).catch(() => {});
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
  let optimizedUpdates = { ...updates };
  if (
    optimizedUpdates.logoUrl &&
    optimizedUpdates.logoUrl.startsWith('data:image/') &&
    optimizedUpdates.logoUrl.length > 80 * 1024
  ) {
    try {
      optimizedUpdates.logoUrl = await optimizeBase64DataUrl(optimizedUpdates.logoUrl, 70 * 1024);
    } catch {
      // Fallback
    }
  }

  const cleanUpdates = sanitizeForFirestore(optimizedUpdates);
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
  callback: (staff: LabUser[]) => void,
  isSuperAdmin = false
) {
  try {
    const colRef = collection(firestoreDb, LAB_USERS_COLLECTION);
    const q = isSuperAdmin && !labId
      ? query(colRef)
      : query(colRef, where('labId', '==', labId));

    const unsubscribe = onSnapshot(
      q,
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
            labId: data.labId || data.tenantId || labId,
            tenantId: data.tenantId || data.labId || labId,
          };
        });

        cachedStaffMap[labId] = allUsers;
        callback(allUsers);
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
  const targetTenantId = (staffData.tenantId || staffData.labId || DEFAULT_LAB_ID).trim();
  const permissions = staffData.permissions && staffData.permissions.length > 0
    ? staffData.permissions
    : (staffData.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_STAFF_PERMISSIONS);

  const cleanData = sanitizeForFirestore({
    ...staffData,
    tenantId: targetTenantId,
    labId: targetTenantId,
    permissions,
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
      tenantId: targetTenantId,
      labId: targetTenantId,
    };
    // Mirror to users collection as well
    await setDoc(doc(firestoreDb, USERS_COLLECTION, docRef.id), sanitizeForFirestore(newStaff), { merge: true }).catch(() => {});

    const current = cachedStaffMap[targetTenantId] || [];
    cachedStaffMap[targetTenantId] = [newStaff, ...current];
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
// HOME SAMPLE COLLECTION OPERATIONS
// -------------------------------------------------------------

export function subscribeToHomeBookings(
  labIdOrCallback: string | ((bookings: HomeSampleBooking[]) => void),
  maybeCallback?: (bookings: HomeSampleBooking[]) => void,
  onError?: (err: Error) => void
) {
  const targetLabId =
    typeof labIdOrCallback === 'string' ? labIdOrCallback : DEFAULT_LAB_ID;
  const callback =
    typeof labIdOrCallback === 'function' ? labIdOrCallback : maybeCallback || (() => {});

  try {
    const q = query(
      collection(firestoreDb, HOME_BOOKINGS_COLLECTION),
      orderBy('bookingTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        isFirebaseConnected = true;
        const allBookings: HomeSampleBooking[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as HomeSampleBooking;
          return {
            ...data,
            id: docSnap.id,
            labId: data.labId || DEFAULT_LAB_ID,
          };
        });

        // Strict multi-tenant filtering: Only returns bookings assigned to this lab (or all if superadmin)
        const scopedBookings = allBookings.filter((b) => {
          if (targetLabId === 'all') return true;
          if (targetLabId === DEFAULT_LAB_ID) {
            return b.labId === DEFAULT_LAB_ID || !b.labId;
          }
          return b.labId === targetLabId;
        });

        cachedHomeBookingsMap[targetLabId] = scopedBookings;
        callback(scopedBookings);
      },
      (error) => {
        console.warn('Home bookings subscription fallback:', error);
        isFirebaseConnected = false;
        if (onError) onError(error);
        const fallback = cachedHomeBookingsMap[targetLabId] || cachedHomeBookingsMap[DEFAULT_LAB_ID] || [];
        callback(fallback);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Failed to subscribe to home bookings:', error);
    const fallback = cachedHomeBookingsMap[targetLabId] || cachedHomeBookingsMap[DEFAULT_LAB_ID] || [];
    callback(fallback);
    return () => {};
  }
}

export async function addHomeBookingToFirestore(
  bookingData: Omit<HomeSampleBooking, 'id'>
): Promise<HomeSampleBooking> {
  const targetLabId = bookingData.labId || DEFAULT_LAB_ID;
  const cleanData = sanitizeForFirestore({
    ...bookingData,
    labId: targetLabId,
    status: bookingData.status || 'pending',
    createdAt: new Date().toISOString(),
    bookingTimestamp: bookingData.bookingTimestamp || new Date().toISOString(),
  });

  try {
    const docRef = await addDoc(
      collection(firestoreDb, HOME_BOOKINGS_COLLECTION),
      cleanData
    );
    const newBooking: HomeSampleBooking = {
      ...cleanData,
      id: docRef.id,
    };
    const currentList = cachedHomeBookingsMap[targetLabId] || [];
    cachedHomeBookingsMap[targetLabId] = [newBooking, ...currentList.filter((b) => b.id !== docRef.id)];
    return newBooking;
  } catch (error) {
    console.error('Error adding home booking to Firestore:', error);
    handleFirestoreError(error, OperationType.CREATE, HOME_BOOKINGS_COLLECTION);
    throw error;
  }
}

export async function updateHomeBookingStatusInFirestore(
  bookingId: string,
  status: HomeSampleBooking['status'],
  extraUpdates?: Partial<HomeSampleBooking>
): Promise<void> {
  const cleanUpdates = sanitizeForFirestore({
    status,
    ...extraUpdates,
    updatedAt: new Date().toISOString(),
  });

  try {
    const docRef = doc(firestoreDb, HOME_BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, cleanUpdates);
    for (const labId of Object.keys(cachedHomeBookingsMap)) {
      cachedHomeBookingsMap[labId] = cachedHomeBookingsMap[labId].map((b) =>
        b.id === bookingId ? { ...b, ...cleanUpdates } : b
      );
    }
  } catch (error) {
    console.error('Error updating home booking in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${HOME_BOOKINGS_COLLECTION}/${bookingId}`);
    throw error;
  }
}

// -------------------------------------------------------------
// PUBLIC REPORT QR VERIFICATION
// -------------------------------------------------------------

export async function getReportForVerification(
  reportIdentifier: string
): Promise<{ report: PathologyReport; lab?: Laboratory } | null> {
  try {
    const cleanId = reportIdentifier.trim();
    // 1. Try to find in cache first
    for (const labId of Object.keys(cachedReportsMap)) {
      const match = cachedReportsMap[labId].find(
        (r) => r.id === cleanId || r.reportId === cleanId
      );
      if (match) {
        const lab = cachedLabs.find((l) => l.id === match.labId);
        return { report: match, lab };
      }
    }

    // 2. Query Firestore by doc id or reportId field
    try {
      const docSnap = await getDocFromServer(doc(firestoreDb, REPORTS_COLLECTION, cleanId));
      if (docSnap.exists()) {
        const rData = { ...docSnap.data(), id: docSnap.id } as PathologyReport;
        const lab = cachedLabs.find((l) => l.id === rData.labId);
        return { report: rData, lab };
      }
    } catch {
      // If direct doc lookup fails, query collection
    }

    const q = query(
      collection(firestoreDb, REPORTS_COLLECTION),
      where('reportId', '==', cleanId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      const rData = { ...docSnap.data(), id: docSnap.id } as PathologyReport;
      const lab = cachedLabs.find((l) => l.id === rData.labId);
      return { report: rData, lab };
    }

    return null;
  } catch (err) {
    console.error('Error retrieving report for verification:', err);
    return null;
  }
}

// -------------------------------------------------------------
// STATS / METRICS HELPER
// -------------------------------------------------------------

export function getCachedPathologyData() {
  return {
    patientsMap: cachedPatientsMap,
    reportsMap: cachedReportsMap,
    homeBookingsMap: cachedHomeBookingsMap,
    templates: cachedTemplates,
    labs: cachedLabs,
    settings: cachedSettings,
    isFirebaseConnected,
    databaseId: firebaseConfig.firestoreDatabaseId,
    projectId: firebaseConfig.projectId,
  };
}
