import { CheckCircle2, Settings2, Shield } from 'lucide-react';
import type { ConversionOptions, UnitType, UpAxisType } from '../engine/types';

interface QualityModeProps {
  options: ConversionOptions;
  disabled?: boolean;
  onChange: (next: ConversionOptions) => void;
}

export function QualityMode({ options, disabled = false, onChange }: QualityModeProps) {
  const toggleOriginalQuality = () => {
    const nextEnabled = !options.originalQualityMode;
    onChange({
      ...options,
      originalQualityMode: nextEnabled,
    });
  };

  return (
    <div className="space-y-4">
      {/* Prominent Original Quality Mode Card */}
      <div
        className={`rounded-2xl border p-5 transition-all ${
          options.originalQualityMode
            ? 'border-[#4285FF]/50 bg-[#4285FF]/8'
            : 'border-white/10 bg-[#11151D]'
        }`}
      >
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3.5">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4285FF]/20 text-[#6B9FFF]">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide text-[#F5F7FA] uppercase">
                  ORIGINAL QUALITY MODE
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    options.originalQualityMode
                      ? 'bg-[#20C997]/15 text-[#20C997]'
                      : 'bg-white/10 text-[#929BAA]'
                  }`}
                >
                  {options.originalQualityMode ? 'ENABLED (DEFAULT)' : 'CUSTOM'}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#929BAA]">
                Preserves exact vertex positions, polygon faces, normals, and object hierarchy. No
                decimation, remeshing, smoothing, or surface reconstruction.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={options.originalQualityMode}
            disabled={disabled}
            onClick={toggleOriginalQuality}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-50 ${
              options.originalQualityMode ? 'bg-[#4285FF]' : 'bg-white/15'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                options.originalQualityMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/8 pt-3.5 text-xs text-[#929BAA] sm:grid-cols-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#20C997]" />
            <span>Zero polygon reduction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#20C997]" />
            <span>Exact vertex coordinates</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#20C997]" />
            <span>Object hierarchy kept</span>
          </div>
        </div>
      </div>

      {/* COLLADA / SketchUp Export Metadata */}
      <div className="rounded-2xl border border-white/10 bg-[#11151D] p-5">
        <div className="mb-3.5 flex items-center gap-2 text-xs font-semibold tracking-wider text-[#929BAA] uppercase">
          <Settings2 className="h-4 w-4 text-[#6B9FFF]" />
          <span>COLLADA 1.4.1 &amp; SketchUp Compatibility Settings</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="unit-select" className="mb-1.5 block text-xs font-medium text-[#929BAA]">
              Model Unit Metadata
            </label>
            <select
              id="unit-select"
              disabled={disabled}
              value={options.unit}
              onChange={(e) => onChange({ ...options, unit: e.target.value as UnitType })}
              className="w-full rounded-lg border border-white/12 bg-[#171D28] px-3 py-2 text-xs font-medium text-[#F5F7FA] focus:border-[#4285FF] focus:outline-none disabled:opacity-50"
            >
              <option value="meter">Meters (meter = 1)</option>
              <option value="centimeter">Centimeters (meter = 0.01)</option>
              <option value="millimeter">Millimeters (meter = 0.001)</option>
              <option value="inch">Inches (meter = 0.0254)</option>
              <option value="foot">Feet (meter = 0.3048)</option>
            </select>
          </div>

          <div>
            <label htmlFor="axis-select" className="mb-1.5 block text-xs font-medium text-[#929BAA]">
              Source Up-Axis Metadata
            </label>
            <select
              id="axis-select"
              disabled={disabled}
              value={options.upAxis}
              onChange={(e) => onChange({ ...options, upAxis: e.target.value as UpAxisType })}
              className="w-full rounded-lg border border-white/12 bg-[#171D28] px-3 py-2 text-xs font-medium text-[#F5F7FA] focus:border-[#4285FF] focus:outline-none disabled:opacity-50"
            >
              <option value="Y_UP">Y_UP (Standard OBJ / Hunyuan3D)</option>
              <option value="Z_UP">Z_UP (Native SketchUp Axis)</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/12 bg-[#171D28] px-3 py-2 text-xs text-[#F5F7FA]">
              <input
                type="checkbox"
                disabled={disabled}
                checked={options.triangulatePolygons}
                onChange={(e) =>
                  onChange({ ...options, triangulatePolygons: e.target.checked })
                }
                className="h-4 w-4 rounded accent-[#4285FF]"
              />
              <span>Triangulate n-gons for SketchUp</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

