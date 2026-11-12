import { exportModelToCollada } from './colladaExporter';
import { validateColladaExport } from './geometryValidator';
import { ConversionCancelledError, parseObjBlob, parseObjString } from './objParser';
import type { ConversionOptions, ConversionProgress, ConversionResult } from './types';

export function buildConvertedFilename(originalFilename: string): string {
  const trimmed = originalFilename.trim() || 'model.obj';
  if (/\.obj$/i.test(trimmed)) {
    return trimmed.replace(/\.obj$/i, '.dae');
  }
  return `${trimmed}.dae`;
}

export async function convertObjFileToDae(
  file: Blob,
  filename: string,
  options: ConversionOptions,
  onProgress?: (progress: ConversionProgress) => void,
  shouldCancel?: () => boolean
): Promise<ConversionResult> {
  const startedAt = performance.now();

  onProgress?.({
    stage: 'parsing',
    percent: 5,
    message: 'Streaming and parsing OBJ geometry...',
  });

  const parsed = await parseObjBlob(
    file,
    (pct) => {
      onProgress?.({
        stage: 'parsing',
        percent: 5 + Math.round(pct * 0.45),
        message: `Parsing OBJ geometry (${pct}%)...`,
      });
    },
    shouldCancel
  );

  if (shouldCancel?.()) {
    throw new ConversionCancelledError();
  }

  onProgress?.({
    stage: 'exporting',
    percent: 55,
    message: 'Generating COLLADA 1.4.1 (.DAE) XML...',
  });

  const exported = exportModelToCollada(
    parsed,
    options,
    (pct) => {
      onProgress?.({
        stage: 'exporting',
        percent: 55 + Math.round(pct * 0.3),
        message: `Writing COLLADA geometry (${pct}%)...`,
      });
    },
    shouldCancel
  );

  if (shouldCancel?.()) {
    throw new ConversionCancelledError();
  }

  onProgress?.({
    stage: 'validating',
    percent: 90,
    message: 'Validating COLLADA XML and geometry preservation...',
  });

  const validation = validateColladaExport(parsed, exported);
  if (validation.status === 'FAILED') {
    throw new Error(`Geometry validation failed: ${validation.errors.join(' ')}`);
  }

  const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
  const convertedFilename = buildConvertedFilename(filename);
  const convertedFileSize = new TextEncoder().encode(exported.daeContent).byteLength;

  onProgress?.({
    stage: 'complete',
    percent: 100,
    message: 'Conversion completed successfully.',
  });

  return {
    daeContent: exported.daeContent,
    originalFilename: filename,
    originalFileSize: file.size,
    convertedFilename,
    convertedFileSize,
    vertexCount: parsed.stats.vertexCount,
    faceCount: parsed.stats.faceCount,
    exportedTriangleCount: exported.exportedPrimitiveCount,
    objectCount: parsed.stats.objectCount,
    durationMs,
    validation,
    warnings: [...parsed.warnings, ...validation.notes],
  };
}

export function convertObjStringToDae(
  objText: string,
  filename: string,
  options: ConversionOptions
): ConversionResult {
  const startedAt = performance.now();
  const parsed = parseObjString(objText);
  const exported = exportModelToCollada(parsed, options);
  const validation = validateColladaExport(parsed, exported);

  if (validation.status === 'FAILED') {
    throw new Error(`Geometry validation failed: ${validation.errors.join(' ')}`);
  }

  const durationMs = Math.max(1, Math.round(performance.now() - startedAt));
  const originalFileSize = new TextEncoder().encode(objText).byteLength;
  const convertedFileSize = new TextEncoder().encode(exported.daeContent).byteLength;

  return {
    daeContent: exported.daeContent,
    originalFilename: filename,
    originalFileSize,
    convertedFilename: buildConvertedFilename(filename),
    convertedFileSize,
    vertexCount: parsed.stats.vertexCount,
    faceCount: parsed.stats.faceCount,
    exportedTriangleCount: exported.exportedPrimitiveCount,
    objectCount: parsed.stats.objectCount,
    durationMs,
    validation,
    warnings: [...parsed.warnings, ...validation.notes],
  };
}

