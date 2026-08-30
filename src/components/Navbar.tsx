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
} from 'lucide-react';
import { useLab } from '../context/LabContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    themeMode,
    toggleTheme,
    activeTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    stopTimer,
    openAiAssistant,
    inventory,
    sensors,
  } = useLab();

  // Calculate alerts
  const lowStockCount = inventory.filter((item) => item.quantity <= item.minThreshold).length;
  const criticalSensors = sensors.filter((s) => s.status !== 'normal').length;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const navItems: Array<{ id: any; label: string; icon: any; badge?: number | string | undefined }> = [
    { id: 'pathology', label: 'Pathology LIMS', icon: FlaskConical, badge: 'Firebase' },
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'eln', label: 'Lab Notebook', icon: BookOpen },
    { id: 'protocols', label: 'Protocols', icon: FlaskConical },
    { id: 'samples', label: 'Sample Registry', icon: Database },
    { id: 'inventory', label: 'Chemicals & SDS', icon: Beaker, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'equipment', label: 'Instruments', icon: Cpu },
    { id: 'analytics', label: 'Analytics & Math', icon: LineChart },
    { id: 'compliance', label: 'Audit Trail', icon: ShieldCheck },
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
      {/* Top Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-sm text-white">
              <FlaskConical className="w-6 h-6 transform -rotate-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  LabNova
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  LIMS & ELN
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Research Systems • GLP Standard
              </p>
            </div>
          </div>

          {/* Center: Live Active Protocol Timer (if any active) */}
          {activeTimer && (
            <div
              id="active-timer-banner"
              className={`hidden md:flex items-center space-x-3 px-3.5 py-1.5 rounded-full border transition-all ${
                activeTimer.secondsRemaining === 0
                  ? 'bg-red-50 border-red-300 text-red-700 animate-pulse dark:bg-red-950/60 dark:border-red-800 dark:text-red-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <div className="text-xs font-semibold max-w-xs truncate">
                <span>Step {activeTimer.stepNumber}: {activeTimer.stepTitle}</span>
              </div>
              <span className="font-mono font-bold text-sm tracking-wider">
                {formatTimer(activeTimer.secondsRemaining)}
              </span>
              <div className="flex items-center space-x-1 pl-1">
                {activeTimer.isRunning ? (
                  <button
                    onClick={pauseTimer}
                    title="Pause timer"
                    className="p-1 hover:bg-emerald-200/50 rounded dark:hover:bg-emerald-800/50"
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={resumeTimer}
                    title="Resume timer"
                    className="p-1 hover:bg-emerald-200/50 rounded dark:hover:bg-emerald-800/50"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={resetTimer}
                  title="Reset"
                  className="p-1 hover:bg-emerald-200/50 rounded dark:hover:bg-emerald-800/50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={stopTimer}
                  title="Close timer"
                  className="p-1 hover:bg-emerald-200/50 rounded dark:hover:bg-emerald-800/50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Right: Quick Telemetry, AI Assistant Trigger, Theme */}
          <div className="flex items-center space-x-3">
            {/* Environmental telemetry pill */}
            <div className="hidden lg:flex items-center space-x-2 text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">Vault: -80.4°C</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="font-mono">CO₂: 5.0%</span>
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

            {/* Theme Toggle Button */}
            <button
              id="btn-theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={themeMode === 'dark' ? 'Switch to Cleanroom Light' : 'Switch to Darkroom Mode'}
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
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
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
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
