import { downloadDaeFile } from '../utils/fileUtils';
import { checkHelperAvailability } from './helperDetection';

export type SketchUpLaunchOutcome =
  | {
      status: 'protocol_dispatched';
      sketchupVersions: string[];
      filename: string;
    }
  | {
      status: 'fallback_manual';
      filename: string;
      reason: string;
    };

export async function openDaeInSketchUp(
  daeContent: string,
  convertedFilename: string
): Promise<SketchUpLaunchOutcome> {
  // Always ensure the converted DAE file is saved locally first
  downloadDaeFile(daeContent, convertedFilename);

  const helper = await checkHelperAvailability();
  if (!helper.available) {
    return {
      status: 'fallback_manual',
      filename: convertedFilename,
      reason:
        'The optional MW Hunyuan Bridge Windows Helper is not running. Your .DAE file has been downloaded so you can import it directly into SketchUp.',
    };
  }

  // Trigger custom protocol with filename only; helper resolves it safely inside Downloads
  const protocolUri = `mwhunyuan://open?name=${encodeURIComponent(convertedFilename)}`;
  const anchor = document.createElement('a');
  anchor.href = protocolUri;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  return {
    status: 'protocol_dispatched',
    sketchupVersions: helper.sketchupVersions,
    filename: convertedFilename,
  };
}

