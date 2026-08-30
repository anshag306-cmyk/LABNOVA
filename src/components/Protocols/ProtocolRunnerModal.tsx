import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Thermometer,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useLab } from '../../context/LabContext';
import { Protocol } from '../../types';

export const ProtocolRunnerModal: React.FC<{
  protocol: Protocol | null;
  isOpen: boolean;
  onClose: () => void;
  onConvertToExperiment?: (protocol: Protocol) => void;
}> = ({ protocol, isOpen, onClose, onConvertToExperiment }) => {
  const { startTimer } = useLab();

  if (!isOpen || !protocol) return null;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [stepNotes, setStepNotes] = useState<Record<number, string>>({});
  const [stepTimerSeconds, setStepTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const steps = protocol.steps || [];
  const step = steps[currentStepIndex] || steps[0];
  const isLastStep = steps.length > 0 && currentStepIndex === steps.length - 1;
  const allCompleted = steps.length > 0 && steps.every((_, idx) => completedSteps[idx]);

  // Reset timer when step changes
  useEffect(() => {
    if (step && step.durationMinutes) {
      setStepTimerSeconds(step.durationMinutes * 60);
      setIsTimerRunning(false);
    }
  }, [currentStepIndex, step]);

  // Step countdown
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => {
      setStepTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1.2);
          } catch (e) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const toggleCurrentStepCompleted = () => {
    const next = !completedSteps[currentStepIndex];
    setCompletedSteps((prev) => ({ ...prev, [currentStepIndex]: next }));

    if (next && isLastStep) {
      try {
        confetti({ particleCount: 80, spread: 70 });
      } catch (e) {}
    }
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <span>Interactive Step-by-Step Execution</span>
              <span>•</span>
              <span>v{protocol.version}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
              {protocol.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {steps.length > 0
                ? Math.round(
                    (Object.values(completedSteps).filter(Boolean).length /
                      steps.length) *
                      100
                  )
                : 0}
              % Complete
            </span>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center space-x-1.5">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 flex-1 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'bg-emerald-600 ring-2 ring-emerald-400/40'
                    : completedSteps[idx]
                    ? 'bg-emerald-400 dark:bg-emerald-600'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
                title={`Jump to step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>
        </div>

        {/* Active Step Display */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Step {step.stepNumber}: {step.title}
            </h3>

            <div className="flex items-center space-x-2">
              {step.temperature && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center space-x-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <span>{step.temperature}</span>
                </span>
              )}
              {step.durationMinutes && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{step.durationMinutes} min</span>
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Critical Checkpoint */}
          {step.checkpoint && (
            <div className="p-3.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200">
              <strong className="block mb-0.5 text-emerald-950 dark:text-emerald-100">
                Quality Checkpoint:
              </strong>
              {step.checkpoint}
            </div>
          )}

          {/* Precision Step Timer Widget */}
          {step.durationMinutes > 0 && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">
                  Stage Countdown
                </span>
                <span className="text-2xl font-black font-mono tracking-widest text-slate-900 dark:text-slate-100">
                  {formatTimer(stepTimerSeconds)}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`p-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95 ${
                    isTimerRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>{stepTimerSeconds === 0 ? 'Restart' : 'Start'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setStepTimerSeconds(step.durationMinutes * 60);
                  }}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  title="Reset step timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    startTimer(
                      protocol.title,
                      step.title,
                      step.stepNumber,
                      step.durationMinutes
                    )
                  }
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                  title="Pin to top global navbar"
                >
                  Pin Global
                </button>
              </div>
            </div>
          )}

          {/* Step Observations Input */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
              Step Execution Notes:
            </label>
            <input
              type="text"
              placeholder="e.g. Inversion produced clear lysate in 2 min 40 sec..."
              value={stepNotes[currentStepIndex] || ''}
              onChange={(e) =>
                setStepNotes({ ...stepNotes, [currentStepIndex]: e.target.value })
              }
              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Step Checkbox & Navigation Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <button
            onClick={toggleCurrentStepCompleted}
            className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              completedSteps[currentStepIndex]
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-emerald-500'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {completedSteps[currentStepIndex]
                ? 'Step Verified & Completed'
                : 'Mark Step as Completed'}
            </span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {isLastStep ? (
              <button
                onClick={() => {
                  if (onConvertToExperiment) onConvertToExperiment(protocol);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center space-x-1"
              >
                <span>Save to Lab Notebook</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentStepIndex((p) =>
                    Math.min(protocol.steps.length - 1, p + 1)
                  )
                }
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm flex items-center space-x-1"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
