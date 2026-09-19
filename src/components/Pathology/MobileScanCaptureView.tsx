import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, RefreshCw, UploadCloud, AlertCircle, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { submitMobileCapturedImage } from '../../services/mobileScanSession';

interface MobileScanCaptureViewProps {
  sessionId: string;
  onDone?: () => void;
}

export const MobileScanCaptureView: React.FC<MobileScanCaptureViewProps> = ({ sessionId, onDone }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image client-side to ensure quick transmission
  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1920;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImage(raw);
        setCapturedImage(compressed);
      } catch {
        setError('Failed to process photo. Please try capturing again.');
      }
    };
    reader.onerror = () => setError('Error reading file. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleSendToPc = async () => {
    if (!capturedImage) return;
    setIsSending(true);
    setError(null);

    try {
      await submitMobileCapturedImage(sessionId, capturedImage);
      setIsSent(true);
    } catch (err: any) {
      console.error('Error sending photo to PC:', err);
      setError('Failed to send image to PC. Please ensure you have internet access and retry.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-4 sm:p-6 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between py-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>LabNova Mobile Camera</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-400 font-semibold">
                Live QR Session
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Secure Laboratory Optical Scanner</p>
          </div>
        </div>

        {onDone && (
          <button
            onClick={onDone}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
      </header>

      {/* Main Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full py-6 space-y-6">
        {/* Hidden Camera Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          id="mobile-report-camera-input"
        />

        {error && (
          <div className="w-full p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {isSent ? (
          /* Success Screen */
          <div className="w-full bg-slate-800/80 border border-emerald-500/30 rounded-3xl p-6 text-center space-y-4 shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Report Photo Sent to PC!</h2>
              <p className="text-xs text-slate-300 mt-1">
                Your computer monitor is now analyzing this diagnostic report with AI.
              </p>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2 text-left">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Transferred securely to your active PC workstation session only.</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSent(false);
                  setCapturedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
              >
                Capture Another Report Page
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          /* Image Preview & Confirmation */
          <div className="w-full bg-slate-800/80 border border-slate-700 rounded-3xl p-4 space-y-4 shadow-xl">
            <div className="relative rounded-2xl overflow-hidden bg-black max-h-96 flex items-center justify-center border border-slate-700">
              <img
                src={capturedImage}
                alt="Report preview"
                className="w-full h-auto max-h-96 object-contain"
              />
              <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Ready to transmit
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-200">Verify image clarity</p>
              <p className="text-[11px] text-slate-400">
                Ensure numbers, parameter names, and reference ranges are sharply readable.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                disabled={isSending}
                className="py-3 px-4 rounded-xl border border-slate-700 hover:bg-slate-700/60 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </button>

              <button
                type="button"
                onClick={handleSendToPc}
                disabled={isSending}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Sending to PC...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    Send to PC Screen
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Initial Capture Prompt */
          <div className="w-full bg-slate-800/60 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xl">
            <div className="w-20 h-20 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
              <Camera className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-white">Scan Medical Report</h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
                Capture a clear photo of the patient's physical paper report or lab analyzer printout.
              </p>
            </div>

            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-left space-y-1.5 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300">Tips for Best AI Accuracy:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Lay report flat on a well-lit surface</li>
                <li>Avoid casting hand shadows over numbers</li>
                <li>Keep the entire test table within the camera frame</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <Camera className="w-4 h-4" />
              Open Camera & Take Photo
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
        LabNova Diagnostic Assistant &bull; Encrypted Session Handshake
      </footer>
    </div>
  );
};
