import Constants from 'expo-constants';

/**
 * Krishi Marga Backend Configuration
 *
 * Development:
 *   Connects phone -> PC LAN IP (http://10.247.1.212:5678/webhook/detect-disease)
 *
 * Production:
 *   Connects phone -> Production HTTPS Endpoint (configured via app.json extra.productionBackendUrl or EXPO_PUBLIC_BACKEND_URL)
 */

export const Config = {
  // 1. Development LAN URL for local physical phone testing
  developmentBackendUrl: 'http://172.20.253.63:5678/webhook/detect-disease',

  // 2. Production HTTPS URL placeholder (can be overridden via environment or app.json without code modifications)
  productionBackendUrl: 'https://api.krishimarga.com/webhook/detect-disease',

  // 3. Resolves the active URL according to environment mode (__DEV__ vs release build or environment override)
  getBackendUrl(): string {
    // Check runtime environment variable first if provided
    if (process.env.EXPO_PUBLIC_BACKEND_URL) {
      return process.env.EXPO_PUBLIC_BACKEND_URL;
    }

    // Check app.json extra properties if configured
    const extra = Constants.expoConfig?.extra;
    if (extra?.backendUrl) {
      return extra.backendUrl;
    }

    // In React Native development mode (__DEV__), automatically detect PC IP from Expo hostUri if available
    if (__DEV__) {
      const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
      if (hostUri) {
        const hostIp = hostUri.split(':')[0];
        if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
          return `http://${hostIp}:5678/webhook/detect-disease`;
        }
      }
      return this.developmentBackendUrl;
    }

    // In production release builds, default to production HTTPS endpoint
    return this.productionBackendUrl;
  },
};