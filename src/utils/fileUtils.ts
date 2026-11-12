export function downloadDaeFile(daeContent: string, filename: string): void {
  const blob = new Blob([daeContent], { type: 'model/vnd.collada+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function isValidObjFilename(filename: string): boolean {
  return /\.obj$/i.test(filename.trim());
}

export interface BrowserMemoryCheck {
  warning: string | null;
}

export function checkFileSizeAgainstBrowserMemory(fileSizeBytes: number): BrowserMemoryCheck {
  const perfWithMemory = performance as Performance & {
    memory?: { jsHeapSizeLimit: number; usedJSHeapSize: number };
  };

  if (perfWithMemory.memory) {
    const available = perfWithMemory.memory.jsHeapSizeLimit - perfWithMemory.memory.usedJSHeapSize;
    // Rough heuristic: ASCII OBJ -> DAE XML can temporarily require ~4-6x file size in heap
    if (fileSizeBytes * 5 > available) {
      return {
        warning:
          'This OBJ file is very large relative to your browser tab memory limit. Conversion will still run in a background Web Worker, but if the browser runs out of memory, try closing other tabs.',
      };
    }
  } else if (fileSizeBytes > 150 * 1024 * 1024) {
    return {
      warning:
        'Large file detected (>150 MB). Processing runs in a background Web Worker; please keep this tab open until conversion completes.',
    };
  }

  return { warning: null };
}

