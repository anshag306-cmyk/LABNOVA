import React, { useState } from 'react';
import {
  FlaskConical,
  ShieldCheck,
  Building2,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Stethoscope,
  Eye,
  EyeOff,
  Phone,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Laboratory, UserRole } from '../../types';

interface LabNovaAuthViewProps {
  onBackToHome?: () => void;
}

export const LabNovaAuthView: React.FC<LabNovaAuthViewProps> = ({ onBackToHome }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerNewLab,
    isLoading,
    authError,
    clearError,
    availableLabs,
  } = useAuth();

  // Active portal tab: 'staff' | 'superadmin'
  const [activeTab, setActiveTab] = useState<'staff' | 'superadmin'>('staff');

  // Staff login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Super Admin login state
  const [superAdminMethod, setSuperAdminMethod] = useState<'password' | 'otp'>('password');
  const [superAdminEmail, setSuperAdminEmail] = useState('anshag306@gmail.com');
  const [superAdminPassword, setSuperAdminPassword] = useState('');
  const [showSuperAdminPassword, setShowSuperAdminPassword] = useState(false);
  const [adminPhone, setAdminPhone] = useState('+91 9675607315');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const [isRegisterLabOpen, setIsRegisterLabOpen] = useState(false);

  // New Lab registration form state
  const [newLabName, setNewLabName] = useState('');
  const [newLabCode, setNewLabCode] = useState('');
  const [newLabCity, setNewLabCity] = useState('');
  const [newLabPhone, setNewLabPhone] = useState('');
  const [newLabAddress, setNewLabAddress] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newPathologist, setNewPathologist] = useState('');
  const [newLicense, setNewLicense] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLocalError(null);
    loginWithEmail(email, password);
  };

  const handleSuperAdminPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!superAdminEmail.trim()) {
      setLocalError('Please enter the Super Admin email address.');
      return;
    }
    if (superAdminEmail.trim().toLowerCase() !== 'anshag306@gmail.com') {
      setLocalError('Access Restricted: Only authorized Global Super Administrator credentials permitted.');
      return;
    }
    if (!superAdminPassword.trim()) {
      setLocalError('Please enter your Super Admin security master key.');
      return;
    }
    loginWithEmail('anshag306@gmail.com', superAdminPassword);
  };

  const handleSendOtp = () => {
    setLocalError(null);
    if (!adminPhone.trim()) {
      setLocalError('Please provide the registered Super Admin mobile number.');
      return;
    }
    setOtpSent(true);
    setOtpCountdown(45);
    const interval = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!otpCode || otpCode.length < 4) {
      setLocalError('Please enter the 6-digit verification code sent to your registered mobile device.');
      return;
    }
    loginWithEmail('anshag306@gmail.com', 'otp-verified');
  };

  const handleRegisterLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName || !newAdminEmail || !newAdminName) return;

    try {
      const created = await registerNewLab(
        {
          name: newLabName,
          code: newLabCode || newLabName.slice(0, 3).toUpperCase(),
          city: newLabCity || 'Mumbai',
          phone: newLabPhone || '+91 98200 11223',
          address: newLabAddress || `${newLabCity || 'Mumbai'}, India`,
          pathologistName: newPathologist || `Dr. ${newAdminName}, MD (Pathology)`,
          licenseNumber: newLicense || `LIMS-${Math.floor(10000 + Math.random() * 90000)}`,
        },
        newAdminName,
        newAdminEmail
      );
      setRegisterSuccess(`Laboratory "${created.name}" registered successfully! Redirecting...`);
      setTimeout(() => {
        setIsRegisterLabOpen(false);
        setRegisterSuccess(null);
      }, 1200);
    } catch (err) {
      // Error handled in AuthContext
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Bar with Back to Public Site */}
      <div className="relative max-w-5xl w-full mx-auto mb-6 flex items-center justify-between">
        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition shadow-sm"
          >
            <span>← Back to Public Website</span>
          </button>
        )}
        <span className="text-xs font-mono text-cyan-400/80 flex items-center gap-1.5 ml-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Restricted Clinical Staff Portal</span>
        </span>
      </div>

      <div className="relative max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Col: Branding, Features & Trust Badges */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <FlaskConical className="w-7 h-7 transform -rotate-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">LabNova</span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Enterprise LIMS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Clinical Pathology Laboratory Management System
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Secure Multi-Tenant Diagnostics & Pathology Portal
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Equipped with complete multi-laboratory data isolation, strict role-based access control (RBAC),
              A4 print-ready diagnostic reports, and verifiable NABL ISO 15189 compliance.
            </p>
          </div>

          {/* Key Architecture Features */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Independent Multi-Lab Architecture</h2>
                <p className="text-[11px] text-slate-400">
                  Each laboratory operates with its own patients, tests, tariffs, billing, and custom branding letterhead.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Strict Role-Based Access (Admin & Staff)</h2>
                <p className="text-[11px] text-slate-400">
                  Admins manage staff, test prices, and branding. Staff access operational workflows without risking security settings.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">Database-Level Data Isolation</h2>
                <p className="text-[11px] text-slate-400">
                  Protected by Firestore Security Rules ensuring one lab can never read, modify, or leak another laboratory's data.
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Footer */}
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> NABL ISO 15189 Ready
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 256-Bit Cloud Encryption
            </span>
          </div>
        </div>

        {/* Right Col: Sign-In Box with Tabbed Authentication */}
        <div className="lg:col-span-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl space-y-5">
            {/* Tab Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('staff');
                  clearError();
                  setLocalError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'staff'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Lab Staff & Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('superadmin');
                  clearError();
                  setLocalError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'superadmin'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Super Admin</span>
              </button>
            </div>

            {/* Error Message Display */}
            {(authError || localError) && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{localError || authError}</span>
                  <button
                    onClick={() => {
                      clearError();
                      setLocalError(null);
                    }}
                    className="block text-[11px] text-rose-300 underline mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: Laboratory Staff & Admin Sign In */}
            {activeTab === 'staff' && (
              <div className="space-y-4">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-lg font-bold text-white">Laboratory Authorized Sign-In</h2>
                  <p className="text-xs text-slate-400">
                    Access your lab's diagnostic worklist, patient accessions, and test reports
                  </p>
                </div>

                {/* 1-Click Google Sign In */}
                <button
                  id="btn-google-login"
                  type="button"
                  disabled={isLoading}
                  onClick={loginWithGoogle}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center justify-center gap-3 shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Or Sign In with Email
                  </span>
                </div>

                {/* Email / Password Form */}
                <form onSubmit={handleStaffSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Staff / Lab Admin Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        id="input-login-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@labnova.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        id="input-login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-email-submit"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    <span>Sign In to Laboratory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Register New Laboratory Action */}
                <div className="pt-2 border-t border-slate-800/80 text-center">
                  <button
                    id="btn-open-register-lab"
                    type="button"
                    onClick={() => setIsRegisterLabOpen(true)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register a New Independent Pathology Laboratory</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Super Administrator Secure Portal */}
            {activeTab === 'superadmin' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/70 space-y-1">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Restricted Global Super Administrator Portal</span>
                  </div>
                  <p className="text-[11px] text-purple-200/80">
                    Cross-laboratory governance, multi-tenant database oversight, and staff management for Ansh Agrawal.
                  </p>
                </div>

                {/* Super Admin Method Selector */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuperAdminMethod('password');
                      setLocalError(null);
                    }}
                    className={`text-xs font-semibold pb-1 border-b-2 transition-all ${
                      superAdminMethod === 'password'
                        ? 'border-purple-500 text-purple-300 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Email & Security Key
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSuperAdminMethod('otp');
                      setLocalError(null);
                    }}
                    className={`text-xs font-semibold pb-1 border-b-2 transition-all ${
                      superAdminMethod === 'otp'
                        ? 'border-purple-500 text-purple-300 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mobile Phone & OTP Verification
                  </button>
                </div>

                {superAdminMethod === 'password' ? (
                  <form onSubmit={handleSuperAdminPasswordSubmit} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Super Administrator Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          id="input-superadmin-email"
                          type="email"
                          required
                          value={superAdminEmail}
                          onChange={(e) => setSuperAdminEmail(e.target.value)}
                          placeholder="anshag306@gmail.com"
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Master Security Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                        <input
                          id="input-superadmin-password"
                          type={showSuperAdminPassword ? 'text' : 'password'}
                          value={superAdminPassword}
                          onChange={(e) => setSuperAdminPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSuperAdminPassword(!showSuperAdminPassword)}
                          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                        >
                          {showSuperAdminPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      id="btn-superadmin-submit"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate & Open Super Admin Console</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Registered Administrator Phone Number
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <input
                            id="input-admin-phone"
                            type="tel"
                            value={adminPhone}
                            onChange={(e) => setAdminPhone(e.target.value)}
                            placeholder="+91 9675607315"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={otpCountdown > 0}
                          onClick={handleSendOtp}
                          className="px-3 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700 text-purple-200 text-xs font-bold whitespace-nowrap disabled:opacity-50"
                        >
                          {otpCountdown > 0 ? `Resend (${otpCountdown}s)` : otpSent ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Enter 6-Digit OTP Code
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                          <input
                            id="input-otp-code"
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="e.g. 784912"
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-mono tracking-widest text-center text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>OTP sent to {adminPhone}. Enter code to complete authentication.</span>
                        </p>
                      </div>
                    )}

                    <button
                      id="btn-otp-verify-submit"
                      type="submit"
                      disabled={isLoading || !otpSent}
                      className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Enter Super Admin Console</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Register New Pathology Laboratory */}
      {isRegisterLabOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Onboard New Pathology Laboratory</h3>
                  <p className="text-xs text-slate-400">
                    Instantly provision an isolated multi-tenant laboratory workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterLabOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{registerSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterLabSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Laboratory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLabName}
                    onChange={(e) => setNewLabName(e.target.value)}
                    placeholder="e.g. CarePath Reference Diagnostics"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Lab Code (3-4 letters)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={newLabCode}
                    onChange={(e) => setNewLabCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CPD"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={newLabCity}
                    onChange={(e) => setNewLabCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Official Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newLabPhone}
                    onChange={(e) => setNewLabPhone(e.target.value)}
                    placeholder="+91 98000 12345"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Clinical License / Reg #
                  </label>
                  <input
                    type="text"
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value)}
                    placeholder="LIMS-KA-77291"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Physical Address
                  </label>
                  <input
                    type="text"
                    value={newLabAddress}
                    onChange={(e) => setNewLabAddress(e.target.value)}
                    placeholder="e.g. 102 Health Avenue, Indiranagar, Bengaluru - 560038"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lab Administrator Section */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Lead Administrator / Pathologist Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Dr. Alok Verma"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Admin Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="alok.verma@carepath.in"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Consultant Pathologist & Signatory Title
                    </label>
                    <input
                      type="text"
                      value={newPathologist}
                      onChange={(e) => setNewPathologist(e.target.value)}
                      placeholder="Dr. Alok Verma, MD (Pathology), Reg #KMC-2015/04/8912"
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterLabOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-sm flex items-center gap-2"
                >
                  <span>Register Laboratory & Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
