import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Info,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import type { ConversionResult } from '../engine/types';
import { openDaeInSketchUp, type SketchUpLaunchOutcome } from '../integration/sketchupLauncher';
import { downloadDaeFile } from '../utils/fileUtils';
import { formatBytes, formatDuration, formatNumber } from '../utils/formatUtils';

interface ResultPanelProps {
  result: ConversionResult;
  onConvertAnother: () => void;
}

export function ResultPanel({ result, onConvertAnother }: ResultPanelProps) {
  const [launching, setLaunching] = useState(false);
  const [launchOutcome, setLaunchOutcome] = useState<SketchUpLaunchOutcome | null>(null);

  const handleDownload = () => {
    downloadDaeFile(result.daeContent, result.convertedFilename);
  };

  const handleOpenInSketchUp = async () => {
    setLaunching(true);
    try {
      const outcome = await openDaeInSketchUp(result.daeContent, result.convertedFilename);
      setLaunchOutcome(outcome);
    } finally {
      setLaunching(false);
    }
  };

  const validationLabel =
    result.validation.status === 'PASSED'
      ? 'PASSED (Exact Geometry Preserved)'
      : result.validation.status === 'PASSED_WITH_NOTES'
        ? 'PASSED WITH NOTES'
        : 'FAILED';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#20C997]/40 bg-[#11151D] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-white/8 pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#20C997]/15 text-[#20C997]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide text-[#20C997] sm:text-lg">
                CONVERSION COMPLETED SUCCESSFULLY
              </h3>
              <p className="mt-0.5 text-xs text-[#929BAA]">
                COLLADA 1.4.1 (.DAE) generated and validated locally in your browser.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onConvertAnother}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-[#171D28] px-4 py-2.5 text-xs font-semibold text-[#F5F7FA] transition-colors hover:border-[#6B9FFF]/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Convert Another Model</span>
          </button>
        </div>

        {/* 9 Required Conversion Metrics */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Original Filename" value={result.originalFilename} mono />
          <MetricCard label="Original File Size" value={formatBytes(result.originalFileSize)} />
          <MetricCard label="Converted Filename" value={result.convertedFilename} mono />
          <MetricCard label="Converted File Size" value={formatBytes(result.convertedFileSize)} />
          <MetricCard label="Vertex Count" value={formatNumber(result.vertexCount)} />
          <MetricCard
            label="Face Count"
            value={
              result.exportedTriangleCount !== result.faceCount
                ? `${formatNumber(result.faceCount)} (${formatNumber(result.exportedTriangleCount)} tris)`
                : formatNumber(result.faceCount)
            }
          />
          <MetricCard label="Object Count" value={formatNumber(result.objectCount)} />
          <MetricCard label="Conversion Duration" value={formatDuration(result.durationMs)} />
          <MetricCard
            label="Geometry Validation Status"
            value={validationLabel}
            highlight={result.validation.status === 'FAILED' ? 'error' : 'success'}
          />
        </div>

        {result.warnings.length > 0 && (
          <div className="mt-5 space-y-2 rounded-xl border border-[#4285FF]/25 bg-[#4285FF]/8 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6B9FFF]">
              <Info className="h-4 w-4" />
              <span>Conversion &amp; Compatibility Notes</span>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-[#929BAA]">
              {result.warnings.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="mt-7 flex flex-col gap-3.5 sm:flex-row">
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-[#4285FF] px-6 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-[#4285FF]/25 transition-all hover:bg-[#5391FF] active:scale-[0.99]"
          >
            <Download className="h-4 w-4" />
            <span>DOWNLOAD DAE</span>
          </button>

          <button
            type="button"
            disabled={launching}
            onClick={handleOpenInSketchUp}
            className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl border border-[#6B9FFF]/35 bg-[#171D28] px-6 py-3.5 text-sm font-bold tracking-wide text-[#F5F7FA] transition-colors hover:border-[#6B9FFF] hover:bg-[#1D2432] disabled:opacity-60"
          >
            <ExternalLink className="h-4 w-4 text-[#6B9FFF]" />
            <span>{launching ? 'CHECKING HELPER...' : 'OPEN IN SKETCHUP'}</span>
          </button>
        </div>
      </div>

      {/* Honest SketchUp Integration Outcome */}
      {launchOutcome && (
        <div
          className={`rounded-2xl border p-5 ${
            launchOutcome.status === 'protocol_dispatched'
              ? 'border-[#4285FF]/40 bg-[#4285FF]/10'
              : 'border-amber-500/35 bg-[#171D28]'
          }`}
        >
          {launchOutcome.status === 'protocol_dispatched' ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#6B9FFF]">
                <Terminal className="h-4 w-4" />
                <span>Launch Request Sent to Local Windows Helper</span>
              </div>
              <p className="text-xs leading-relaxed text-[#929BAA]">
                Your browser downloaded <code className="text-[#F5F7FA]">{launchOutcome.filename}</code>{' '}
                and dispatched <code className="text-[#F5F7FA]">mwhunyuan://open</code> to the
                local helper.
                {launchOutcome.sketchupVersions.length > 0
                  ? ` Detected SketchUp: ${launchOutcome.sketchupVersions.join(', ')}.`
                  : ' If Windows prompts you to allow opening MW Hunyuan Bridge Helper, click Allow.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <AlertCircle className="h-4 w-4" />
                <span>Manual SketchUp Import (Optional Helper Not Detected)</span>
              </div>
              <p className="text-xs leading-relaxed text-[#929BAA]">{launchOutcome.reason}</p>
              <div className="rounded-xl border border-white/8 bg-[#11151D] p-4 text-xs text-[#F5F7FA]">
                <p className="mb-2 font-semibold text-[#6B9FFF]">
                  How to import <code className="font-mono">{launchOutcome.filename}</code> into
                  SketchUp:
                </p>
                <ol className="list-decimal space-y-1.5 pl-4 text-[#929BAA]">
                  <li>Open SketchUp Desktop.</li>
                  <li>
                    Go to <span className="font-medium text-[#F5F7FA]">File → Import…</span>
                  </li>
                  <li>
                    Select <span className="font-medium text-[#F5F7FA]">COLLADA Files (*.dae)</span>{' '}
                    in the file type dropdown.
                  </li>
                  <li>
                    Choose <code className="font-mono text-[#F5F7FA]">{launchOutcome.filename}</code>{' '}
                    from your Downloads folder and click <span className="font-medium text-[#F5F7FA]">Import</span>.
                  </li>
                  <li>
                    Save as a native SketchUp project via{' '}
                    <span className="font-medium text-[#F5F7FA]">File → Save As (.skp)</span>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  mono = false,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: 'success' | 'error';
}) {
  const valueColor =
    highlight === 'success'
      ? 'text-[#20C997]'
      : highlight === 'error'
        ? 'text-[#FF5B65]'
        : 'text-[#F5F7FA]';

  return (
    <div className="rounded-xl border border-white/8 bg-[#171D28] p-3.5">
      <div className="text-[11px] font-medium tracking-wider text-[#929BAA] uppercase">{label}</div>
      <div
        className={`mt-1 truncate text-sm font-semibold ${valueColor} ${mono ? 'font-mono' : ''}`}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}

