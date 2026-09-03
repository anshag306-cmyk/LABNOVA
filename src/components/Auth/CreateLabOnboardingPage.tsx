import React, { useState } from 'react';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Award,
  Stethoscope,
  FlaskConical,
  FileText,
  Palette,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Laboratory, LetterheadTemplateId } from '../../types';
import { LETTERHEAD_TEMPLATES } from '../../data/letterheadTemplatesData';
import { optimizeBase64DataUrl } from '../../utils/imageCompressor';

interface CreateLabOnboardingPageProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
  onSubmit: (labData: Partial<Laboratory>) => Promise<void>;
  isLoading?: boolean;
}

const PRESET_HEADER_COLORS = [
  { name: 'Deep Slate Navy', hex: '#0f172a' },
  { name: 'Emerald Clinical', hex: '#047857' },
  { name: 'Indigo Medical', hex: '#4338ca' },
  { name: 'Sky Cyan', hex: '#0284c7' },
  { name: 'Royal Purple', hex: '#6b21a8' },
  { name: 'Crimson Diagnostic', hex: '#be123c' },
];

export const CreateLabOnboardingPage: React.FC<CreateLabOnboardingPageProps> = ({
  userEmail,
  userName,
  onLogout,
  onSubmit,
  isLoading = false,
}) => {
  // Form fields
  const [labName, setLabName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [tagline, setTagline] = useState('Advanced Clinical Pathology & Diagnostic Services');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(userEmail || '');
  const [website, setWebsite] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [nablCertNumber, setNablCertNumber] = useState('');
  const [pathologistName, setPathologistName] = useState('');
  const [pathologistQualification, setPathologistQualification] = useState('MD (Pathology), DCP');
  const [pathologistRegistration, setPathologistRegistration] = useState('');
  const [technologistName, setTechnologistName] = useState('');
  const [technologistQualification, setTechnologistQualification] = useState('B.Sc / M.Sc (MLT)');
  const [logoUrl, setLogoUrl] = useState('');
  const [headerColor, setHeaderColor] = useState('#0f172a');
  const [letterheadTemplateId, setLetterheadTemplateId] = useState<LetterheadTemplateId>('classic_medical');
  const [reportFooter, setReportFooter] = useState(
    'This is a computer-generated clinical pathology examination report. Please correlate with clinical findings.'
  );
  const [reportHeader, setReportHeader] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Please select a valid image file (PNG, JPEG, WebP, SVG).');
      return;
    }

    setIsUploadingLogo(true);
    setFormError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        try {
          const optimized = await optimizeBase64DataUrl(result, 70 * 1024);
          setLogoUrl(optimized);
        } catch {
          setLogoUrl(result);
        } finally {
          setIsUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingLogo(false);
      setFormError('Failed to process image. Please try another logo file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!labName.trim()) {
      setFormError('Please enter your Laboratory Name.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please enter the laboratory address.');
      return;
    }
    if (!city.trim()) {
      setFormError('Please enter the city.');
      return;
    }
    if (!state.trim()) {
      setFormError('Please enter the state.');
      return;
    }
    if (!pincode.trim()) {
      setFormError('Please enter the PIN code.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter the primary contact / phone number.');
      return;
    }
    if (!pathologistName.trim()) {
      setFormError('Please enter the Consultant Pathologist name.');
      return;
    }
    if (!technologistName.trim()) {
      setFormError('Please enter the MLT / Laboratory Technician name.');
      return;
    }

    const generatedCode = code.trim()
      ? code.trim().toUpperCase()
      : labName
          .trim()
          .replace(/[^a-zA-Z0-9]/g, '')
          .slice(0, 4)
          .toUpperCase() || 'LIMS';

    const submissionData: Partial<Laboratory> = {
      name: labName.trim(),
      hospitalName: hospitalName.trim() || undefined,
      tagline: tagline.trim(),
      code: generatedCode,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      phone: phone.trim(),
      email: (email.trim() || userEmail).toLowerCase(),
      website: website.trim() || undefined,
      licenseNumber: licenseNumber.trim() || `LIMS-${city.slice(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      nablCertNumber: nablCertNumber.trim() || '',
      pathologistName: pathologistName.trim(),
      pathologistQualification: pathologistQualification.trim(),
      pathologistRegistration: pathologistRegistration.trim() || `Reg #${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      technologistName: technologistName.trim(),
      technologistQualification: technologistQualification.trim(),
      logoUrl: logoUrl || undefined,
      headerColor,
      letterheadTemplateId,
      reportFooter: reportFooter.trim(),
      reportHeader: reportHeader.trim() || undefined,
      currency: '₹',
      status: 'active',
    };

    try {
      await onSubmit(submissionData);
    } catch (err: any) {
      console.error('Failed to create lab:', err);
      setFormError(err?.message || 'Failed to register laboratory. Please verify your connection and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Bar with User Account Info & Logout */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-400">Signed In Account:</span>
                <span className="text-xs font-bold text-white">{userName || userEmail}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Google Auth
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{userEmail}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out / Use Another Account</span>
          </button>
        </div>

        {/* Header Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>First-Time Account Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Register & Create Your Laboratory
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            You are signed in, but no laboratory is registered with this account yet. Fill out the details below to
            provision your dedicated, partitioned laboratory workspace with custom branding and letterhead.
          </p>
        </div>

        {/* Error notification */}
        {formError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-200 text-sm flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Registration Issue:</span> {formError}
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Laboratory Core Identity */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">1. Laboratory Identity & Profile</h2>
                <p className="text-xs text-slate-400">Official name and facility identification</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Laboratory Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  placeholder="e.g. Apex Diagnostics & Pathology Reference Laboratory"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hospital / Clinic Name (Optional)
                </label>
                <input
                  type="text"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  placeholder="e.g. Apex Multispeciality Hospital"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Facility Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Clinical Biochemistry, Hematology & Molecular Genetics"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Address & Communication */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">2. Location & Contact Details</h2>
                <p className="text-xs text-slate-400">Printed on test reports, receipts, and letterheads</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Laboratory Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 102, Medical Enclave, Civil Hospital Road"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  State <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  PIN Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 411001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile / Telephone <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lab Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lab@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Website / Patient Portal (Optional)
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. www.apexdiagnostics.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Legal & Accreditations */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">3. Accreditations & Registrations</h2>
                <p className="text-xs text-slate-400">Clinical establishment regulatory compliance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Laboratory Registration / License No. (Optional)
                </label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. CEA/MH/2026/8941"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  NABL / ISO Certificate No. (Optional)
                </label>
                <input
                  type="text"
                  value={nablCertNumber}
                  onChange={(e) => setNablCertNumber(e.target.value)}
                  placeholder="e.g. MC-4892 (NABL ISO 15189:2022)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Authorized Signatories */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">4. Signatories Printed on Reports</h2>
                <p className="text-xs text-slate-400">Pathologist and lab technician signatures</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Consultant Pathologist Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pathologistName}
                  onChange={(e) => setPathologistName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pathologist Qualification <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pathologistQualification}
                  onChange={(e) => setPathologistQualification(e.target.value)}
                  placeholder="e.g. MD (Pathology), DCP"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Medical Council Registration No.
                </label>
                <input
                  type="text"
                  value={pathologistRegistration}
                  onChange={(e) => setPathologistRegistration(e.target.value)}
                  placeholder="e.g. Reg # MMC-2012/04/1102"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  MLT / Lab Technician Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={technologistName}
                  onChange={(e) => setTechnologistName(e.target.value)}
                  placeholder="e.g. Pooja R. Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Technician Qualification
                </label>
                <input
                  type="text"
                  value={technologistQualification}
                  onChange={(e) => setTechnologistQualification(e.target.value)}
                  placeholder="e.g. M.Sc (MLT), Senior Analyst"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Branding, Logo & Letterhead Choice */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-5">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">5. Logo, Report Letterhead & Theme</h2>
                <p className="text-xs text-slate-400">Choose your default PDF report template and branding</p>
              </div>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Laboratory Logo (Optional)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Lab Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <FlaskConical className="w-8 h-8 text-slate-600" />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer border border-slate-700 transition">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>{isUploadingLogo ? 'Processing...' : 'Upload Logo Image'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="block text-[11px] text-rose-400 hover:underline"
                    >
                      Remove Logo
                    </button>
                  )}
                  <p className="text-[11px] text-slate-500">
                    PNG, JPEG, WebP, or SVG. Auto-compressed for crisp A4 PDF printing.
                  </p>
                </div>
              </div>
            </div>

            {/* Header Theme Color Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Primary Header Accent Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_HEADER_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setHeaderColor(c.hex)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs transition ${
                      headerColor === c.hex
                        ? 'border-white bg-slate-800 text-white font-bold shadow-sm'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Letterhead Template Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Default Report Letterhead Style <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {LETTERHEAD_TEMPLATES.map((tmpl) => {
                  const isSelected = letterheadTemplateId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => setLetterheadTemplateId(tmpl.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">{tmpl.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                        {tmpl.tagline}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: tmpl.primaryColor }}
                        />
                        <span>{tmpl.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Report Footer */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Report Footer Disclaimer
              </label>
              <textarea
                rows={2}
                value={reportFooter}
                onChange={(e) => setReportFooter(e.target.value)}
                placeholder="Disclaimers, clinical correlation notices, sample preservation terms"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              id="btn-create-laboratory"
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Provisioning Laboratory & Partitioning Firestore...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Create Laboratory & Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              A unique laboratory ID will be generated and permanently linked to your Google Account UID.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
