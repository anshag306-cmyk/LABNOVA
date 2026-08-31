import React from 'react';
import {
  FlaskConical,
  ShieldCheck,
  Phone,
  Clock,
  Lock,
  Sun,
  Moon,
  ChevronRight,
  User,
  LogOut,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PublicNavbarProps {
  onOpenStaffLogin: () => void;
  onGoToDashboard: () => void;
  onOpenHomeBooking: () => void;
  themeMode: 'light' | 'dark';
  toggleTheme: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({
  onOpenStaffLogin,
  onGoToDashboard,
  onOpenHomeBooking,
  themeMode,
  toggleTheme,
}) => {
  const { user, isAuthenticated, currentLab, logout } = useAuth();

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      {/* Top Notification & Hotline Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-teal-950 text-slate-200 text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-teal-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              NABL ISO 15189:2022 Accredited Reference Lab
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Sample Collection: Mon-Sat 7:00 AM – 9:00 PM | Sun 7:00 AM – 2:00 PM
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="tel:+912067928800"
              className="flex items-center gap-1 text-teal-300 hover:text-white transition font-medium"
            >
              <Phone className="w-3 h-3 text-teal-400" />
              <span>Helpline: +91 20 6792 8800</span>
            </a>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <button
              onClick={onOpenHomeBooking}
              className="text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 transition"
            >
              <Calendar className="w-3 h-3" />
              <span>Book Home Phlebotomy</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Clinical Brand */}
          <div
            onClick={() => scrollToSection('public-hero')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FlaskConical className="w-6 h-6 transform -rotate-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-teal-600 to-cyan-600 dark:from-blue-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent">
                  LabNova
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Diagnostics
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Pathology & Molecular Diagnostic Laboratory
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('public-hero')}
              className="hover:text-blue-600 dark:hover:text-teal-400 transition"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('public-tests-catalog')}
              className="hover:text-blue-600 dark:hover:text-teal-400 transition flex items-center gap-1.5"
            >
              <span>Diagnostic Tests</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-[10px]">
                Catalog
              </span>
            </button>
            <button
              onClick={() => scrollToSection('public-quality-tech')}
              className="hover:text-blue-600 dark:hover:text-teal-400 transition"
            >
              Quality & Technology
            </button>
            <button
              onClick={() => scrollToSection('public-doctors-team')}
              className="hover:text-blue-600 dark:hover:text-teal-400 transition"
            >
              Consultant Pathologists
            </button>
            <button
              onClick={() => scrollToSection('public-faqs')}
              className="hover:text-blue-600 dark:hover:text-teal-400 transition"
            >
              Patient FAQs
            </button>
            <button
              onClick={() => scrollToSection('public-contact')}
              className="hover:text-blue-600 dark:hover:text-teal-400 transition"
            >
              Location & Hours
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {themeMode === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* If Authenticated: Direct Access to Dashboard */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-authenticated-dashboard"
                  onClick={onGoToDashboard}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs font-bold shadow-sm transition-all transform active:scale-95"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Go to LIMS Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono uppercase">
                    {user.role}
                  </span>
                </button>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Public Visitor: Clear Staff Login Button in Header */
              <button
                id="btn-header-staff-login"
                onClick={onOpenStaffLogin}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-blue-700 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all transform active:scale-95 group"
              >
                <Lock className="w-3.5 h-3.5 text-teal-200 group-hover:rotate-6 transition-transform" />
                <span>Staff Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-blue-200 hidden sm:inline" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
