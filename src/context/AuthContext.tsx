import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  auth,
  DEFAULT_LAB_ID,
  subscribeToLaboratories,
  createNewLaboratoryInFirestore,
  subscribeToLabStaff,
  loadOrCreateUserProfile,
  migrateAndBackfillTenants,
  isOwnerEmail,
  DEFAULT_ADMIN_PERMISSIONS,
} from '../services/pathologyFirebase';
import { Laboratory, LabUser, UserRole } from '../types';
import { INITIAL_LABORATORIES, INITIAL_LAB_USERS } from '../data/pathologyTemplates';

interface AuthContextType {
  user: LabUser | null;
  currentLab: Laboratory;
  availableLabs: Laboratory[];
  isLoading: boolean;
  authError: string | null;
  isAdmin: boolean;
  isStaff: boolean;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  needsLabRegistration: boolean;
  isLabSwitcherOpen: boolean;
  openLabSwitcher: () => void;
  closeLabSwitcher: () => void;
  isStaffModalOpen: boolean;
  openStaffModal: () => void;
  closeStaffModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  loginAsDemo: (role: UserRole, labId?: string, name?: string) => Promise<void> | void;
  registerNewLab: (
    labData: Partial<Laboratory>,
    adminName: string,
    adminEmail: string
  ) => Promise<Laboratory>;
  switchLab: (labId: string) => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'labnova_auth_user';
const LOCAL_STORAGE_LAB_KEY = 'labnova_active_lab_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableLabs, setAvailableLabs] = useState<Laboratory[]>([...INITIAL_LABORATORIES]);
  const [currentLabId, setCurrentLabId] = useState<string>(() => {
    return localStorage.getItem(LOCAL_STORAGE_LAB_KEY) || DEFAULT_LAB_ID;
  });

  const [user, setUser] = useState<LabUser | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default to unauthenticated null state so public homepage is default landing page
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Global Multi-Lab & Staff Modals
  const [isLabSwitcherOpen, setIsLabSwitcherOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  const openLabSwitcher = () => setIsLabSwitcherOpen(true);
  const closeLabSwitcher = () => setIsLabSwitcherOpen(false);
  const openStaffModal = () => setIsStaffModalOpen(true);
  const closeStaffModal = () => setIsStaffModalOpen(false);

  // Background migration/backfill check on startup
  useEffect(() => {
    migrateAndBackfillTenants().catch((err) => {
      console.warn('Initial tenant backfill check notice:', err);
    });
  }, []);

  // Subscribe to all registered laboratories
  useEffect(() => {
    const unsub = subscribeToLaboratories((labs) => {
      if (labs && labs.length > 0) {
        setAvailableLabs(labs);
      }
    });
    return () => {
      unsub();
    };
  }, []);

  // Listen to Firebase Auth state & sync profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const isOwner = isOwnerEmail(fbUser.email || '');
          const profile = await loadOrCreateUserProfile(fbUser, isOwner ? currentLabId : undefined);
          setUser(profile);
          if (profile.tenantId) {
            setCurrentLabId(profile.tenantId);
            localStorage.setItem(LOCAL_STORAGE_LAB_KEY, profile.tenantId);
          } else {
            localStorage.removeItem(LOCAL_STORAGE_LAB_KEY);
          }
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
        } catch (e) {
          console.error('Error synchronizing profile on auth state change:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [currentLabId]);

  // Derived current active lab (non-superadmins are strictly locked to their assigned lab)
  const effectiveLabId = user && user.role !== 'superadmin' ? (user.tenantId || user.labId) : currentLabId;
  const currentLab: Laboratory =
    availableLabs.find((l) => l.id === effectiveLabId) ||
    availableLabs[0] ||
    INITIAL_LABORATORIES[0];

  const switchLab = (labId: string) => {
    // Strict RBAC: Only superadmin can switch active laboratory tenants
    if (user && user.role !== 'superadmin') {
      console.warn('Unauthorized: Regular lab staff cannot switch laboratories.');
      return;
    }

    const found = availableLabs.find((l) => l.id === labId);
    if (found) {
      setCurrentLabId(labId);
      localStorage.setItem(LOCAL_STORAGE_LAB_KEY, labId);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const email = fbUser.email || '';
      const isOwner = isOwnerEmail(email);

      const profile = await loadOrCreateUserProfile(fbUser, isOwner ? currentLabId : undefined, {
        displayName: fbUser.displayName || 'Authorized User',
        role: isOwner ? 'superadmin' : 'admin',
        department: isOwner ? 'Executive Administration' : 'Pathology & Diagnostics',
      });

      setUser(profile);
      if (profile.tenantId) {
        setCurrentLabId(profile.tenantId);
        localStorage.setItem(LOCAL_STORAGE_LAB_KEY, profile.tenantId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_LAB_KEY);
      }
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    } catch (err: any) {
      const errorCode = err?.code || '';
      const errorMessage = err?.message || '';

      // User closed the popup window or cancelled the authorization request
      if (
        errorCode === 'auth/popup-closed-by-user' ||
        errorCode === 'auth/cancelled-popup-request' ||
        errorCode === 'auth/user-cancelled' ||
        errorMessage.includes('popup-closed-by-user') ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        // Expected cancellation when user closes popup window. Do not treat as an error.
        return;
      }

      if (errorCode === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please enable popups or sign in with your email or demo account.');
        return;
      }

      if (errorCode === 'auth/unauthorized-domain') {
        setAuthError('Preview domain is not registered in Firebase OAuth authorized domains. Please use Email / Password or Quick Access to sign in.');
        return;
      }

      console.warn('Google sign-in attempt:', err);
      setAuthError(err?.message || 'Failed to authenticate with Google. Please try again or use email sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const pwd = password || 'LabNova2026!Secure';
      let fbUser: FirebaseUser | null = null;

      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, pwd);
        fbUser = cred.user;
      } catch (signInErr: any) {
        if (signInErr?.code === 'auth/user-not-found' || signInErr?.code === 'auth/invalid-credential') {
          try {
            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pwd);
            fbUser = cred.user;
          } catch {
            try {
              const anon = await signInAnonymously(auth);
              fbUser = anon.user;
            } catch {
              // Fallback
            }
          }
        } else {
          try {
            const anon = await signInAnonymously(auth);
            fbUser = anon.user;
          } catch {
            // Fallback
          }
        }
      }

      const targetUser = fbUser || auth.currentUser || { uid: `usr-${Date.now()}`, email: cleanEmail };
      const matched = INITIAL_LAB_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
      const isSuperAdminEmail = isOwnerEmail(cleanEmail);
      const assignedRole: UserRole = isSuperAdminEmail
        ? 'superadmin'
        : matched?.role || (cleanEmail.includes('admin') ? 'admin' : 'staff');
      const assignedLabId = matched?.labId || currentLabId || DEFAULT_LAB_ID;

      const profile = await loadOrCreateUserProfile(targetUser, assignedLabId, {
        displayName: isSuperAdminEmail
          ? 'Ansh Agrawal'
          : matched?.displayName || cleanEmail.split('@')[0],
        role: assignedRole,
        department: isSuperAdminEmail
          ? 'Executive Administration & Multi-Lab Oversight'
          : matched?.department || (assignedRole === 'admin' ? 'Laboratory Administration' : 'Technical Staff'),
      });

      setUser(profile);
      setCurrentLabId(profile.tenantId || assignedLabId);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      localStorage.setItem(LOCAL_STORAGE_LAB_KEY, profile.tenantId || assignedLabId);
    } catch (err: any) {
      console.error('Email login error:', err);
      setAuthError(err?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = async (role: UserRole, labId?: string, name?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const targetLab = labId || DEFAULT_LAB_ID;
      let email = '';
      let displayName = name || '';
      let department = '';

      if (role === 'superadmin') {
        email = 'anshag306@gmail.com';
        displayName = 'Ansh Agrawal';
        department = 'Multi-Lab Clinical Oversight';
      } else if (targetLab === 'lab-apex-diag') {
        if (role === 'admin') {
          email = 'rajesh.sharma@apexpathlabs.com';
          displayName = displayName || 'Dr. Rajesh Sharma (MD)';
          department = 'Senior Pathology Consultant';
        } else {
          email = 'pooja.patel@apexpathlabs.com';
          displayName = displayName || 'Pooja R. Patel (MLT)';
          department = 'Biochemistry Bench';
        }
      } else {
        if (role === 'admin') {
          email = 'manisha.kulkarni@labnova.com';
          displayName = displayName || 'Dr. Manisha Kulkarni (MD)';
          department = 'Chief Pathologist & Lab Director';
        } else {
          email = 'sunil.verma@labnova.com';
          displayName = displayName || 'Sunil K. Verma (M.Sc MLT)';
          department = 'Senior Laboratory Technologist';
        }
      }

      const pwd = 'LabNova2026!Secure';
      let fbUser: FirebaseUser | null = null;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pwd);
        fbUser = cred.user;
      } catch (signInErr: any) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, pwd);
          fbUser = cred.user;
        } catch {
          try {
            const anon = await signInAnonymously(auth);
            fbUser = anon.user;
          } catch {
            // Fallback
          }
        }
      }

      const targetUser = fbUser || auth.currentUser || { uid: `usr-${Date.now()}`, email };
      const profile = await loadOrCreateUserProfile(targetUser, targetLab, {
        displayName,
        role,
        department,
      });

      setUser(profile);
      setCurrentLabId(targetLab);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      localStorage.setItem(LOCAL_STORAGE_LAB_KEY, targetLab);
    } catch (err: any) {
      console.error('Demo login error:', err);
      setAuthError(err?.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const registerNewLab = async (
    labData: Partial<Laboratory>,
    adminName: string,
    adminEmail: string
  ): Promise<Laboratory> => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const newLabId = `lab-${(labData.name || 'clinic')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .slice(0, 16)}-${Math.floor(1000 + Math.random() * 9000)}`;

      const fullLab: Laboratory = {
        id: newLabId,
        name: labData.name || 'New Diagnostic Laboratory',
        hospitalName: labData.hospitalName || '',
        tagline: labData.tagline || 'Advanced Clinical Pathology & Diagnostic Services',
        code: labData.code || 'NDL',
        logoUrl: labData.logoUrl || '',
        phone: labData.phone || '+91 90000 00000',
        email: labData.email || adminEmail,
        website: labData.website || '',
        address: labData.address || 'Medical Center Boulevard',
        city: labData.city || 'Pune',
        state: labData.state || 'Maharashtra',
        pincode: labData.pincode || '411001',
        licenseNumber: labData.licenseNumber || `LIMS-REG-${Math.floor(10000 + Math.random() * 90000)}`,
        nablCertNumber: labData.nablCertNumber || `MC-${Math.floor(1000 + Math.random() * 9000)}`,
        taxId: labData.taxId || '',
        pathologistName: labData.pathologistName || adminName,
        pathologistQualification: labData.pathologistQualification || 'MD Pathology',
        pathologistRegistration:
          labData.pathologistRegistration || `Reg # MMC-${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        technologistName: labData.technologistName || 'Senior Lab Analyst',
        technologistQualification: labData.technologistQualification || 'B.Sc / M.Sc (MLT)',
        currency: labData.currency || '₹',
        headerColor: labData.headerColor || '#0284c7',
        letterheadTemplateId: labData.letterheadTemplateId || 'classic_medical',
        reportFooter: labData.reportFooter || '',
        reportHeader: labData.reportHeader || '',
        createdAt: new Date().toISOString(),
        ownerEmail: adminEmail,
        status: 'active',
      };

      // Ensure user has an auth session if currently anonymous/unauthenticated
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch {
          // fallback if offline/mock
        }
      }

      const effectiveUserId = auth.currentUser ? auth.currentUser.uid : `usr-${Date.now()}`;

      const created = await createNewLaboratoryInFirestore(fullLab, {
        id: effectiveUserId,
        displayName: adminName,
        email: adminEmail,
      });

      // Update state and switch to newly created lab
      setAvailableLabs((prev) => [...prev, created]);
      setCurrentLabId(created.id);
      localStorage.setItem(LOCAL_STORAGE_LAB_KEY, created.id);

      // Set logged in user as Admin of this new lab with tenantId set
      const adminUser: LabUser = {
        id: effectiveUserId,
        uid: effectiveUserId,
        email: adminEmail,
        displayName: adminName,
        role: 'admin',
        labId: created.id,
        tenantId: created.id,
        isLabOwner: true,
        needsLabRegistration: false,
        permissions: DEFAULT_ADMIN_PERMISSIONS,
        department: 'Laboratory Administration',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(adminUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(adminUser));

      return created;
    } catch (err: any) {
      console.error('Error creating new laboratory:', err);
      setAuthError(err?.message || 'Failed to register laboratory.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore
    }
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const clearError = () => setAuthError(null);

  const isAdmin = Boolean(user?.role === 'admin' || user?.role === 'superadmin');
  const isStaff = Boolean(user?.role === 'staff');
  const isSuperAdmin = Boolean(user?.role === 'superadmin');
  const isAuthenticated = Boolean(user);
  const needsLabRegistration = Boolean(
    user && user.role !== 'superadmin' && (!user.tenantId || user.needsLabRegistration)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        currentLab,
        availableLabs,
        isLoading,
        authError,
        isAdmin,
        isStaff,
        isSuperAdmin,
        isAuthenticated,
        needsLabRegistration,
        isLabSwitcherOpen,
        openLabSwitcher,
        closeLabSwitcher,
        isStaffModalOpen,
        openStaffModal,
        closeStaffModal,
        loginWithGoogle,
        loginWithEmail,
        loginAsDemo,
        registerNewLab,
        switchLab,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
