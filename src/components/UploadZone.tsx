import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { AlertTriangle, FileUp, Trash2, UploadCloud } from 'lucide-react';
import { checkFileSizeAgainstBrowserMemory, isValidObjFilename } from '../utils/fileUtils';
import { formatBytes } from '../utils/formatUtils';

interface UploadZoneProps {
  selectedFile: File | null;
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  onClearFile: () => void;
}

export function UploadZone({
  selectedFile,
  disabled = false,
  onFileSelected,
  onClearFile,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleCandidateFile = (file: File | undefined) => {
    if (!file) return;
    if (!isValidObjFilename(file.name)) {
      setValidationError(
        `Unsupported file "${file.name}". Please select a valid Wavefront .obj file.`
      );
      return;
    }
    if (file.size === 0) {
      setValidationError('The selected .obj file is empty (0 bytes).');
      return;
    }
    setValidationError(null);
    onFileSelected(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    handleCandidateFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleCandidateFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const memoryCheck = selectedFile ? checkFileSizeAgainstBrowserMemory(selectedFile.size) : null;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept=".obj"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              inputRef.current?.click();
            }
          }}
          className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12 ${
            isDragging
              ? 'border-[#4285FF] bg-[#4285FF]/10'
              : 'border-white/15 bg-[#11151D] hover:border-[#6B9FFF]/50 hover:bg-[#171D28]'
          } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4285FF]/15 text-[#4285FF] transition-transform group-hover:scale-105">
            <UploadCloud className="h-7 w-7" />
          </div>
          <p className="text-base font-semibold text-[#F5F7FA]">
            Drag and drop your Hunyuan3D <span className="font-mono text-[#6B9FFF]">.obj</span> file
            here
          </p>
          <p className="mt-1.5 text-sm text-[#929BAA]">
            or <span className="font-medium text-[#6B9FFF] underline">browse from your computer</span>
          </p>
          <p className="mt-4 text-xs text-[#929BAA]/80">
            Supports vertices (v), normals (vn), texture coordinates (vt), faces (f), objects (o),
            and groups (g).
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#4285FF]/30 bg-[#11151D] p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4285FF]/15 text-[#6B9FFF]">
                <FileUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-semibold text-[#F5F7FA]">
                  {selectedFile.name}
                </p>
                <p className="mt-0.5 text-xs text-[#929BAA]">
                  File size: <span className="font-medium text-[#F5F7FA]">{formatBytes(selectedFile.size)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-white/12 bg-[#171D28] px-3.5 py-2 text-xs font-medium text-[#F5F7FA] transition-colors hover:border-[#6B9FFF]/40 disabled:opacity-50"
              >
                Upload Another
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={onClearFile}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF5B65]/30 bg-[#FF5B65]/10 px-3 py-2 text-xs font-medium text-[#FF5B65] transition-colors hover:bg-[#FF5B65]/20 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            </div>
          </div>

          {memoryCheck?.warning && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>{memoryCheck.warning}</span>
            </div>
          )}
        </div>
      )}

      {validationError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#FF5B65]/35 bg-[#FF5B65]/10 p-3.5 text-xs text-[#FF5B65]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

