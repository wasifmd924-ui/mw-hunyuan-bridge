import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Lock, Play } from 'lucide-react';
import type { WorkerRequestMessage, WorkerResponseMessage } from '../engine/conversionWorker';
import {
  DEFAULT_CONVERSION_OPTIONS,
  type ConversionOptions,
  type ConversionProgress,
  type ConversionResult,
} from '../engine/types';
import { ProgressPanel } from './ProgressPanel';
import { QualityMode } from './QualityMode';
import { ResultPanel } from './ResultPanel';
import { UploadZone } from './UploadZone';

export function Converter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ConversionOptions>(DEFAULT_CONVERSION_OPTIONS);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
    setProgress(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setProgress(null);
  };

  const handleStartConversion = () => {
    if (!selectedFile || isConverting) return;

    setError(null);
    setResult(null);
    setIsConverting(true);
    setProgress({
      stage: 'reading',
      percent: 2,
      message: 'Initializing background conversion worker...',
    });

    workerRef.current?.terminate();
    const worker = new Worker(new URL('../engine/conversionWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponseMessage>) => {
      const msg = event.data;
      if (msg.type === 'PROGRESS') {
        setProgress(msg.progress);
      } else if (msg.type === 'RESULT') {
        setIsConverting(false);
        setProgress(null);
        setResult(msg.result);
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === 'CANCELLED') {
        setIsConverting(false);
        setProgress(null);
        setError('Conversion was cancelled.');
        worker.terminate();
        workerRef.current = null;
      } else if (msg.type === 'ERROR') {
        setIsConverting(false);
        setProgress(null);
        setError(msg.message);
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.onerror = (err) => {
      setIsConverting(false);
      setProgress(null);
      setError(
        err.message || 'The conversion worker encountered a memory or runtime error.'
      );
      worker.terminate();
      workerRef.current = null;
    };

    const request: WorkerRequestMessage = {
      type: 'CONVERT',
      file: selectedFile,
      options,
    };
    worker.postMessage(request);
  };

  const handleCancelConversion = () => {
    if (!workerRef.current) return;
    const cancelMsg: WorkerRequestMessage = { type: 'CANCEL' };
    workerRef.current.postMessage(cancelMsg);
  };

  const handleConvertAnother = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setProgress(null);
  };

  return (
    <section id="converter-workspace" className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-[#F5F7FA] sm:text-3xl">
          OBJ to SketchUp Converter
        </h2>
        <p className="mt-2 text-sm text-[#929BAA]">
          Convert Hunyuan3D <span className="font-mono text-[#6B9FFF]">.obj</span> meshes to
          SketchUp-ready COLLADA <span className="font-mono text-[#20C997]">.dae</span> files
          locally.
        </p>
      </div>

      <div className="glass-panel space-y-6 rounded-3xl p-5 sm:p-8">
        {!result ? (
          <>
            <UploadZone
              selectedFile={selectedFile}
              disabled={isConverting}
              onFileSelected={handleFileSelected}
              onClearFile={handleClearFile}
            />

            <QualityMode options={options} disabled={isConverting} onChange={setOptions} />

            {isConverting && progress && (
              <ProgressPanel progress={progress} onCancel={handleCancelConversion} />
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-[#FF5B65]/40 bg-[#FF5B65]/10 p-4 text-xs leading-relaxed text-[#FF5B65]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Conversion Error</p>
                  <p className="mt-1 text-[#FF5B65]/90">{error}</p>
                </div>
              </div>
            )}

            {!isConverting && (
              <button
                type="button"
                disabled={!selectedFile}
                onClick={handleStartConversion}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#4285FF] px-6 py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-[#4285FF]/20 transition-all hover:bg-[#5391FF] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#929BAA] disabled:shadow-none"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>CONVERT OBJ TO SKETCHUP DAE</span>
              </button>
            )}
          </>
        ) : (
          <ResultPanel result={result} onConvertAnother={handleConvertAnother} />
        )}

        <div className="flex items-center justify-center gap-2 border-t border-white/8 pt-4 text-center text-xs text-[#929BAA]">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#20C997]" />
          <span>
            Your 3D files are processed locally in your browser. MW Hunyuan Bridge does not upload
            your model to a conversion server.
          </span>
        </div>
      </div>
    </section>
  );
}

