import { Loader2, XCircle } from 'lucide-react';
import type { ConversionProgress } from '../engine/types';

interface ProgressPanelProps {
  progress: ConversionProgress;
  onCancel: () => void;
}

export function ProgressPanel({ progress, onCancel }: ProgressPanelProps) {
  return (
    <div className="rounded-2xl border border-[#4285FF]/35 bg-[#11151D] p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-[#4285FF]" />
          <div>
            <p className="text-sm font-semibold text-[#F5F7FA]">{progress.message}</p>
            <p className="mt-0.5 text-xs text-[#929BAA] uppercase tracking-wider">
              Stage: {progress.stage}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#FF5B65]/35 bg-[#FF5B65]/10 px-3.5 py-2 text-xs font-semibold text-[#FF5B65] transition-colors hover:bg-[#FF5B65]/20"
        >
          <XCircle className="h-4 w-4" />
          <span>Cancel</span>
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-[#929BAA]">Local Web Worker Progress</span>
          <span className="font-mono font-semibold text-[#6B9FFF]">{progress.percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4285FF] to-[#6B9FFF] transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

