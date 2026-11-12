export interface HelperStatus {
  available: boolean;
  sketchupInstalled: boolean;
  sketchupVersions: string[];
}

const HELPER_HEALTH_URL = 'http://127.0.0.1:48921/health';

export async function checkHelperAvailability(timeoutMs = 800): Promise<HelperStatus> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(HELPER_HEALTH_URL, {
      method: 'GET',
      signal: controller.signal,
    });
    if (!response.ok) {
      return { available: false, sketchupInstalled: false, sketchupVersions: [] };
    }
    const data = (await response.json()) as {
      status?: string;
      sketchupInstalled?: boolean;
      sketchupVersions?: string[];
    };
    if (data.status === 'ok') {
      return {
        available: true,
        sketchupInstalled: Boolean(data.sketchupInstalled),
        sketchupVersions: Array.isArray(data.sketchupVersions) ? data.sketchupVersions : [],
      };
    }
    return { available: false, sketchupInstalled: false, sketchupVersions: [] };
  } catch {
    return { available: false, sketchupInstalled: false, sketchupVersions: [] };
  } finally {
    window.clearTimeout(timer);
  }
}

