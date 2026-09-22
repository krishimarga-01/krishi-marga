import Constants from 'expo-constants';

/**
 * KRISHI MARGA — BACKEND CONFIGURATION
 * ------------------------------------------------------------------
 * PRODUCTION ARCHITECTURE:
 *
 *   Phone  ->  HTTPS production endpoint  ->  Cloud n8n  ->  Gemini  ->  Response
 *
 * The production build NEVER depends on:
 *   - LAN IP addresses (192.168.x.x / 10.x.x.x)
 *   - localhost
 *   - the Expo debugger host / hostUri
 *   - temporary tunnel URLs (ngrok etc.)
 *
 * The endpoint is supplied ONLY through explicit configuration:
 *   1. EXPO_PUBLIC_BACKEND_URL          (primary — set in .env / EAS build env)
 *   2. app.json -> expo.extra.backendUrl (build-time override)
 *   3. EXPO_PUBLIC_DEV_BACKEND_URL      (development convenience only, __DEV__ only)
 *
 * If nothing is configured the app reports a clear, actionable configuration
 * error instead of silently trying a stale developer machine address.
 */

export type BackendEndpoint = 'diagnosis' | 'pesticide';

export class BackendNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendNotConfiguredError';
  }
}

/** Removes a trailing slash so path joining is predictable. */
function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Accepts either a base URL ("https://api.example.com" or
 * "https://api.example.com/webhook") or a full legacy webhook URL
 * ("https://api.example.com/webhook/detect-disease") and returns the base
 * that per-feature webhook paths are appended to.
 */
function deriveWebhookBase(raw: string): string {
  const url = trimTrailingSlash(raw.trim());
  // Legacy full URL that already points at a specific webhook path.
  const legacyMatch = url.match(/^(.*)\/(detect-disease|scan-pesticide)$/);
  if (legacyMatch) return legacyMatch[1];
  if (/\/webhook(-test)?$/.test(url)) return url;
  return `${url}/webhook`;
}

const WEBHOOK_PATHS: Record<BackendEndpoint, string> = {
  diagnosis: 'detect-disease',
  pesticide: 'detect-disease',
};

/**
 * Network/timeout budget.
 *
 * The server may run a sequential 3-model Gemini failover. The client budget is
 * deliberately larger than the realistic server worst case, but still bounded so
 * the UI can never hang forever. These are NOT "very large timeouts": they are
 * matched to the documented server budget (see n8n/README_N8N.md).
 */
export const NetworkBudget = {
  /** Whole-request ceiling for a disease diagnosis upload + inference. */
  diagnosisTimeoutMs: 75000,
  /** Whole-request ceiling for a pesticide label scan (single Gemini call). */
  pesticideTimeoutMs: 45000,
  /** Retries are only attempted for transient transport failures, never for
   *  server-reported errors, and never more than this many times. */
  maxTransientRetries: 1,
  /** Backoff before the single retry. */
  retryBackoffMs: 1500,
  /** Requests with an identical signature inside this window are de-duplicated. */
  duplicateWindowMs: 2000,
};

function readConfiguredUrl(): { url: string | null; source: string } {
  // 1. Primary production configuration.
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    return { url: envUrl.trim(), source: 'EXPO_PUBLIC_BACKEND_URL' };
  }

  // 2. Build-time override baked into app.json.
  const extra = Constants.expoConfig?.extra as { backendUrl?: string } | undefined;
  if (extra?.backendUrl && String(extra.backendUrl).trim()) {
    return { url: String(extra.backendUrl).trim(), source: 'app.json extra.backendUrl' };
  }

  // 3. Development-only convenience variable. Never consulted in a release build.
  if (__DEV__) {
    const devUrl = process.env.EXPO_PUBLIC_DEV_BACKEND_URL;
    if (devUrl && devUrl.trim()) {
      return { url: devUrl.trim(), source: 'EXPO_PUBLIC_DEV_BACKEND_URL (development)' };
    }
  }

  return { url: null, source: 'not configured' };
}

export const Config = {
  /** True when a backend endpoint has been supplied by configuration. */
  isConfigured(): boolean {
    return readConfiguredUrl().url !== null;
  },

  /** Where the active endpoint came from — safe to display in diagnostics. */
  getConfigSource(): string {
    return readConfiguredUrl().source;
  },

  /** True when the configured endpoint uses HTTPS. */
  isSecure(): boolean {
    const { url } = readConfiguredUrl();
    return !!url && url.toLowerCase().startsWith('https://');
  },

  /**
   * Resolves the full webhook URL for a feature.
   * Throws BackendNotConfiguredError when no endpoint has been configured, so
   * calling code can present a precise message instead of a generic network error.
   */
  getEndpointUrl(endpoint: BackendEndpoint): string {
    const { url, source } = readConfiguredUrl();
    if (!url) {
      throw new BackendNotConfiguredError(
        'The diagnosis server address has not been configured for this build. ' +
          'Set EXPO_PUBLIC_BACKEND_URL to your HTTPS endpoint and rebuild.'
      );
    }

    if (!__DEV__ && !url.toLowerCase().startsWith('https://')) {
      // Production must not ship a cleartext endpoint. Fail loudly at the call
      // site rather than silently sending farmer photos over plain HTTP.
      throw new BackendNotConfiguredError(
        'The production backend URL must use HTTPS. Update EXPO_PUBLIC_BACKEND_URL.'
      );
    }

    if (__DEV__) {
      console.log(`[CONFIG] Backend endpoint "${endpoint}" resolved from ${source}`);
    }

    return `${deriveWebhookBase(url)}/${WEBHOOK_PATHS[endpoint]}`;
  },

  /**
   * Backwards-compatible accessor used by existing screens/services.
   * Returns the disease-diagnosis endpoint.
   */
  getBackendUrl(): string {
    return Config.getEndpointUrl('diagnosis');
  },

  /**
   * Non-throwing variant for diagnostic screens that must render even when the
   * app is unconfigured.
   */
  describeBackend(): string {
    try {
      return Config.getBackendUrl();
    } catch (e: any) {
      return 'NOT CONFIGURED — set EXPO_PUBLIC_BACKEND_URL';
    }
  },
};
