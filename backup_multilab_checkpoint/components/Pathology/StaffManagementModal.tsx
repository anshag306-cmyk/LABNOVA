import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Mail,
  Phone,
  Building,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LabUser, UserRole } from '../../types';
import {
  subscribeToLabStaff,
  addStaffMemberToFirestore,
  updateStaffMemberInFirestore,
  deleteStaffMemberFromFirestore,
} from '../../services/pathologyFirebase';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentLab, user, isAdmin, isSuperAdmin } = useAuth();
  const [staffList, setStaffList] = useState<LabUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<LabUser | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [department, setDepartment] = useState('Hematology Bench');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToLabStaff(currentLab.id, (staff) => {
      setStaffList(staff);
    });
    return () => unsub();
  }, [isOpen, currentLab.id]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('staff');
    setDepartment('Hematology Bench');
    setPhone('');
    setIsAdding(false);
    setEditingUser(null);
    setError(null);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide full name and work email.');
      return;
    }

    try {
      if (editingUser) {
        await updateStaffMemberInFirestore(editingUser.id, {
          displayName: name.trim(),
          email: email.trim(),
          role,
          department,
          phone,
        });
        setSuccess(`Updated details for ${name}.`);
      } else {
        await addStaffMemberToFirestore({
          displayName: name.trim(),
          email: email.trim(),
          role,
          labId: currentLab.id,
          department,
          phone,
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        setSuccess(`New staff member ${name} added to ${currentLab.name}.`);
      }

      resetForm();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to save staff member.');
    }
  };

  const handleEditClick = (u: LabUser) => {
    setEditingUser(u);
    setName(u.displayName);
    setEmail(u.email);
    setRole(u.role);
    setDepartment(u.department || 'Clinical Bench');
    setPhone(u.phone || '');
    setIsAdding(true);
  };

  const handleDeleteClick = async (u: LabUser) => {
    if (u.id === user?.id) {
      alert('You cannot remove your own active user account.');
      return;
    }
    if (confirm(`Remove ${u.displayName} from ${currentLab.name}?`)) {
      try {
        await deleteStaffMemberFromFirestore(u.id);
      } catch (err: any) {
        setError(err?.message || 'Failed to delete user.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Staff & Role-Based Access Control
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  {currentLab.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage laboratory staff credentials, operational permissions, and security roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning if non-admin */}
        {!isAdmin ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Administrator Access Required
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Staff members have operational access to patients, tests, and reports. Managing staff
              rosters, security permissions, and laboratory pricing requires Administrator credentials.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Status alerts */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Permission Summary Pill Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ADMIN ROLE</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Full control: Access all patients & reports, edit test prices/tariffs, manage staff roster, and update lab branding & letterhead.
                </p>
              </div>

              <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-2 md:pt-0 md:pl-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Shield className="w-4 h-4" />
                  <span>STAFF ROLE</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Operational: Register patients, enter test parameters, generate A4 reports & billing. Cannot modify tariffs, security, or branding.
                </p>
              </div>
            </div>

            {/* Add / Edit Form */}
            {isAdding ? (
              <form
                onSubmit={handleSaveStaff}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-800/60 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {editingUser ? 'Edit Staff Member' : 'Register New Staff Member'}
                  </h4>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Anand Verma / Priya Nair"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="staff@labnova.com"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Access Role *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="staff">Staff (Operational Only)</option>
                      <option value="admin">Admin (Full Control)</option>
                      {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Department / Section
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Clinical Biochemistry / Reception"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Direct Mobile Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98200 00000"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                  >
                    {editingUser ? 'Update Staff Member' : 'Add to Laboratory Roster'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Active Personnel ({staffList.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Staff Member</span>
                </button>
              </div>
            )}

            {/* Roster List */}
            <div className="space-y-2.5">
              {staffList.map((st) => {
                const isUserAdmin = st.role === 'admin' || st.role === 'superadmin';
                return (
                  <div
                    key={st.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isUserAdmin
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                        }`}
                      >
                        {st.displayName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {st.displayName}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                              st.role === 'superadmin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                                : isUserAdmin
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                            }`}
                          >
                            {st.role}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {st.email}
                          </span>
                          {st.department && (
                            <>
                              <span>•</span>
                              <span>{st.department}</span>
                            </>
                          )}
                          {st.phone && (
                            <>
                              <span>•</span>
                              <span>{st.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditClick(st)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Edit Details & Role"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(st)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Delete from Laboratory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
