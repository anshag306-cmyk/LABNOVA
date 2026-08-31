import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Plus,
  Shield,
  Stethoscope,
  X,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Laboratory } from '../../types';

interface LabSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabSwitcherModal: React.FC<LabSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentLab, availableLabs, switchLab, registerNewLab, isAdmin, isSuperAdmin } =
    useAuth();

  const [isRegistering, setIsRegistering] = useState(false);
  const [newLabName, setNewLabName] = useState('');
  const [newLabCity, setNewLabCity] = useState('');
  const [newLabPhone, setNewLabPhone] = useState('');
  const [newPathologist, setNewPathologist] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  if (!isOpen) return null;

  const handleSelectLab = (labId: string) => {
    switchLab(labId);
    onClose();
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName || !newAdminEmail) return;

    try {
      await registerNewLab(
        {
          name: newLabName,
          city: newLabCity || 'Pune',
          phone: newLabPhone || '+91 20 6700 0000',
          pathologistName: newPathologist || `Dr. ${newAdminName || 'Consultant'}, MD`,
        },
        newAdminName || 'Lab Director',
        newAdminEmail
      );
      setIsRegistering(false);
      onClose();
    } catch (e) {
      // Handled
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Select Active Laboratory Tenant
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Switch workspaces to view isolated patient records, reports, and tariffs
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!isRegistering ? (
            <>
              <div className="space-y-3">
                {availableLabs.map((lab) => {
                  const isCurrent = lab.id === currentLab.id;
                  return (
                    <div
                      key={lab.id}
                      onClick={() => handleSelectLab(lab.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-600'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {lab.name}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {lab.code || 'LAB'}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {lab.tagline || 'Clinical Pathology Laboratory'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {lab.city || 'India'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Stethoscope className="w-3 h-3 text-blue-500" />
                            {lab.pathologistName}
                          </span>
                          {lab.nablCertNumber && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <Award className="w-3 h-3" /> NABL MC-{lab.nablCertNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectLab(lab.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 hover:bg-blue-50 dark:bg-slate-700 dark:hover:bg-blue-900/30 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300'
                        }`}
                      >
                        <span>{isCurrent ? 'Current Workspace' : 'Switch Workspace'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Button: Register New Lab */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Data is strictly segregated per laboratory tenant.
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-transform active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Onboard New Laboratory</span>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateLab} className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add New Laboratory Tenant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in primary laboratory credentials to initialize the workspace
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Laboratory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    placeholder="e.g. CityCare Diagnostic Center"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newLabCity}
                    onChange={(e) => setNewLabCity(e.target.value)}
                    placeholder="e.g. Hyderabad"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newLabPhone}
                    onChange={(e) => setNewLabPhone(e.target.value)}
                    placeholder="+91 40 2300 1122"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="Dr. K. Srinivas"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="srinivas@citycare.in"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Consultant Pathologist Name
                  </label>
                  <input
                    type="text"
                    value={newPathologist}
                    onChange={(e) => setNewPathologist(e.target.value)}
                    placeholder="Dr. K. Srinivas, MD (Pathology)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm"
                >
                  Provision Laboratory
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
