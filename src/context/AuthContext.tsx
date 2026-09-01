import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  auth,
  DEFAULT_LAB_ID,
  subscribeToLaboratories,
  createNewLaboratoryInFirestore,
  subscribeToLabStaff,
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
  isLabSwitcherOpen: boolean;
  openLabSwitcher: () => void;
  closeLabSwitcher: () => void;
  isStaffModalOpen: boolean;
  openStaffModal: () => void;
  closeStaffModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  loginAsDemo: (role: UserRole, labId?: string, name?: string) => void;
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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        // Map Firebase user
        const email = fbUser.email || '';
        const isOwner = email.toLowerCase() === 'anshag306@gmail.com';

        // Check if user already exists in known staff
        const matched = INITIAL_LAB_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        const mappedUser: LabUser = {
          id: fbUser.uid,
          email: email || 'user@labnova.com',
          displayName: fbUser.displayName || matched?.displayName || (isOwner ? 'Ansh Agrawal' : 'Pathologist'),
          role: isOwner ? 'superadmin' : matched?.role || 'admin',
          labId: matched?.labId || currentLabId || DEFAULT_LAB_ID,
          department: matched?.department || (isOwner ? 'Executive Administration' : 'Clinical Diagnostics'),
          status: 'active',
          createdAt: new Date().toISOString(),
        };

        setUser(mappedUser);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mappedUser));
      }
    });

    return () => unsubscribe();
  }, [currentLabId]);

  // Derived current active lab (non-superadmins are strictly locked to their assigned lab)
  const effectiveLabId = user && user.role !== 'superadmin' ? user.labId : currentLabId;
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
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;
      const email = fbUser.email || '';
      const isOwner = email.toLowerCase() === 'anshag306@gmail.com';

      const mappedUser: LabUser = {
        id: fbUser.uid,
        email: email,
        displayName: fbUser.displayName || 'Authorized User',
        role: isOwner ? 'superadmin' : 'admin',
        labId: currentLabId,
        department: isOwner ? 'Executive Administration' : 'Pathology & Diagnostics',
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      setUser(mappedUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mappedUser));
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      // In sandbox/iframe popups might be blocked; offer informative message
      if (err?.code === 'auth/popup-blocked') {
        setAuthError('Popup blocked by browser. Please enable popups or select a Quick Demo Account.');
      } else {
        setAuthError(err?.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      // Look up known lab staff
      const matched = INITIAL_LAB_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      const isSuperAdminEmail = email.toLowerCase().trim() === 'anshag306@gmail.com';
      const assignedRole: UserRole = isSuperAdminEmail
        ? 'superadmin'
        : matched?.role || (email.toLowerCase().includes('admin') ? 'admin' : 'staff');
      const assignedLabId = matched?.labId || currentLabId || DEFAULT_LAB_ID;

      const newUser: LabUser = {
        id: matched?.id || `usr-${Date.now()}`,
        email: email.trim(),
        displayName: isSuperAdminEmail
          ? 'Ansh Agrawal'
          : matched?.displayName || email.split('@')[0],
        role: assignedRole,
        labId: assignedLabId,
        department: isSuperAdminEmail
          ? 'Executive Administration & Multi-Lab Oversight'
          : matched?.department || (assignedRole === 'admin' ? 'Laboratory Administration' : 'Technical Staff'),
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      setUser(newUser);
      setCurrentLabId(assignedLabId);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
      localStorage.setItem(LOCAL_STORAGE_LAB_KEY, assignedLabId);
    } catch (err: any) {
      setAuthError(err?.message || 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemo = (role: UserRole, labId?: string, name?: string) => {
    const targetLab = labId || DEFAULT_LAB_ID;
    let demoUser: LabUser;

    if (role === 'superadmin') {
      demoUser = {
        id: 'usr-superadmin',
        email: 'anshag306@gmail.com',
        displayName: 'Ansh Agrawal',
        role: 'superadmin',
        labId: targetLab,
        department: 'Multi-Lab Clinical Oversight',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    } else if (targetLab === 'lab-apex-diag') {
      if (role === 'admin') {
        demoUser = {
          id: 'usr-apex-admin',
          email: 'rajesh.sharma@apexpathlabs.com',
          displayName: name || 'Dr. Rajesh Sharma (MD)',
          role: 'admin',
          labId: 'lab-apex-diag',
          department: 'Senior Pathology Consultant',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      } else {
        demoUser = {
          id: 'usr-apex-staff',
          email: 'pooja.patel@apexpathlabs.com',
          displayName: name || 'Pooja R. Patel (MLT)',
          role: 'staff',
          labId: 'lab-apex-diag',
          department: 'Biochemistry Bench',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      }
    } else {
      if (role === 'admin') {
        demoUser = {
          id: 'usr-admin-01',
          email: 'manisha.kulkarni@labnova.com',
          displayName: name || 'Dr. Manisha Kulkarni (MD)',
          role: 'admin',
          labId: DEFAULT_LAB_ID,
          department: 'Chief Pathologist & Lab Director',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      } else {
        demoUser = {
          id: 'usr-staff-01',
          email: 'sunil.verma@labnova.com',
          displayName: name || 'Sunil K. Verma (M.Sc MLT)',
          role: 'staff',
          labId: DEFAULT_LAB_ID,
          department: 'Senior Laboratory Technologist',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
      }
    }

    setUser(demoUser);
    setCurrentLabId(targetLab);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoUser));
    localStorage.setItem(LOCAL_STORAGE_LAB_KEY, targetLab);
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
        createdAt: new Date().toISOString(),
        ownerEmail: adminEmail,
        status: 'active',
      };

      const created = await createNewLaboratoryInFirestore(fullLab, {
        displayName: adminName,
        email: adminEmail,
      });

      // Update state and switch to newly created lab
      setAvailableLabs((prev) => [...prev, created]);
      setCurrentLabId(created.id);
      localStorage.setItem(LOCAL_STORAGE_LAB_KEY, created.id);

      // Set logged in user as Admin of this new lab
      const adminUser: LabUser = {
        id: `usr-${Date.now()}`,
        email: adminEmail,
        displayName: adminName,
        role: 'admin',
        labId: created.id,
        department: 'Laboratory Administration',
        status: 'active',
        createdAt: new Date().toISOString(),
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
