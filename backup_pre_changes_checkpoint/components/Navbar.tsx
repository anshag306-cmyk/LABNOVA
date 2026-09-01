import React from 'react';
import {
  Activity,
  AlertTriangle,
  Beaker,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  FlaskConical,
  LineChart,
  Moon,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
  Building2,
  User,
  LogOut,
  Globe,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onViewPublicWebsite?: () => void;
  onGoToSuperAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onViewPublicWebsite, onGoToSuperAdmin }) => {
  const {
    activeTab,
    setActiveTab,
    themeMode,
    toggleTheme,
    openAiAssistant,
  } = useLab();

  const {
    user,
    currentLab,
    isAdmin,
    isSuperAdmin,
    openLabSwitcher,
    logout,
  } = useAuth();

  const navItems: Array<{ id: any; label: string; icon: any; badge?: number | string | undefined }> = [
    { id: 'pathology', label: 'Pathology Lab Dashboard', icon: FlaskConical, badge: 'Live' },
    { id: 'compliance', label: 'Audit Trail & Compliance', icon: ShieldCheck },
  ];

  return (
    <header
      id="labnova-navbar"
      className={`border-b transition-colors sticky top-0 z-40 backdrop-blur-md ${
        themeMode === 'dark'
          ? 'bg-slate-900/95 border-slate-800 text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}
    >
      {/* Super Admin Inspection Banner (If logged in as Super Admin viewing a lab) */}
      {isSuperAdmin && onGoToSuperAdmin && (
        <div className="bg-purple-900/90 border-b border-purple-700 text-purple-100 px-4 py-1.5 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" />
            <span className="font-semibold">Super Admin Inspection Mode:</span>
            <span>Viewing active laboratory workspace for <strong>{currentLab.name}</strong> ({currentLab.code})</span>
          </div>
          <button
            type="button"
            onClick={onGoToSuperAdmin}
            className="px-2.5 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition shadow-xs"
          >
            ← Return to Super Admin Hub
          </button>
        </div>
      )}

      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('pathology')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm text-white">
              <FlaskConical className="w-6 h-6 transform -rotate-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  LabNova
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                  Pathology LIMS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Clinical Pathology & Diagnostics • NABL ISO 15189
              </p>
            </div>
          </div>

          {/* Right: Status, AI Copilot Trigger, Theme */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Super Admin Console Button (Only for Super Admin) */}
            {isSuperAdmin && onGoToSuperAdmin && (
              <button
                type="button"
                onClick={onGoToSuperAdmin}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold hover:bg-purple-100 dark:hover:bg-purple-900 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Super Admin Hub</span>
              </button>
            )}

            {/* Lab Identifier: Clickable switcher ONLY for Super Admin; Static locked badge for regular lab users */}
            {isSuperAdmin ? (
              <button
                id="btn-navbar-lab-switcher"
                onClick={openLabSwitcher}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900 transition"
                title="Switch Pathology Lab Branch (Super Admin)"
              >
                <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="font-semibold hidden md:inline truncate max-w-[140px]">{currentLab.name}</span>
                <span className="font-mono text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded font-bold">
                  {currentLab.code}
                </span>
              </button>
            ) : (
              <div
                id="badge-navbar-assigned-lab"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-default"
                title={`Assigned Laboratory: ${currentLab.name}`}
              >
                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-semibold hidden md:inline truncate max-w-[150px]">{currentLab.name}</span>
                <span className="font-mono text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold">
                  {currentLab.code}
                </span>
              </div>
            )}

            {/* Accreditation & Database Status */}
            <div className="hidden lg:flex items-center space-x-2 text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">NABL ISO 15189</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">Cloud Connected</span>
            </div>

            {/* AI Assistant Button */}
            <button
              id="btn-ai-assistant"
              onClick={() => openAiAssistant('general')}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm transition-transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Lab AI Copilot</span>
            </button>

            {/* Public Website Switch Button */}
            {onViewPublicWebsite && (
              <button
                id="btn-navbar-public-website"
                onClick={onViewPublicWebsite}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 font-semibold transition"
                title="View Public Lab Website"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">Public Website</span>
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={themeMode === 'dark' ? 'Switch to Cleanroom Light' : 'Switch to Darkroom Mode'}
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Logout Button */}
            <button
              id="btn-navbar-logout"
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 transition-colors"
              title="Sign Out to Public Homepage"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Tab Bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 dark:border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 shadow-sm ring-1 ring-blue-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
