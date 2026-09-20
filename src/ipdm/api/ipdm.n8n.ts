import { Config } from '../../services/config';
import { IpdmRequestPayload, IpdmGuidance, PestReportPayload, PestAlert } from '../models/ipdm.types';
import { IpdmValidation } from '../models/ipdm.validation';

export class IpdmN8nApi {
  /**
   * Requests live expanded IPDM guidance from the n8n backend.
   * Path: <EXPO_PUBLIC_BACKEND_URL>/webhook/ipdm
   */
  public static async fetchExpandedGuidance(
    payload: IpdmRequestPayload,
    timeoutMs: number = 8000
  ): Promise<IpdmGuidance | null> {
    try {
      const base = Config.getBackendUrl();
      const endpoint = `${base.replace(/\/+$/, '')}/webhook/ipdm`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return null;
      }

      const json = await response.json();
      return IpdmValidation.normalizeGuidance(
        json.data || json.result || json,
        payload.crop,
        payload.disease || payload.pest || 'Identified Issue',
        'n8n_expanded'
      );
    } catch (err) {
      // Offline, network error, or backend not configured
      return null;
    }
  }

  /**
   * Submits a farmer pest report to n8n for PostGIS proximity processing.
   * Path: <EXPO_PUBLIC_BACKEND_URL>/webhook/pest-report
   */
  public static async submitPestReport(
    report: PestReportPayload,
    timeoutMs: number = 10000
  ): Promise<{ success: boolean; message: string; alertId?: string }> {
    try {
      const base = Config.getBackendUrl();
      const endpoint = `${base.replace(/\/+$/, '')}/webhook/pest-report`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(report),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        return { success: false, message: `Backend error (${response.status})` };
      }

      const json = await response.json();
      return {
        success: true,
        message: json.message || 'Pest report logged successfully. Nearby farmers will be alerted.',
        alertId: json.alertId || json.id,
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reach alert server.' };
    }
  }

  /**
   * Retrieves active community pest alerts within radius of coordinates.
   * Path: <EXPO_PUBLIC_BACKEND_URL>/webhook/pest-alerts?lat=...&lon=...&radius_km=10
   */
  public static async fetchCommunityAlerts(
    lat: number,
    lon: number,
    radiusKm: number = 10,
    timeoutMs: number = 8000
  ): Promise<PestAlert[]> {
    try {
      const base = Config.getBackendUrl();
      const endpoint = `${base.replace(/\/+$/, '')}/webhook/pest-alerts?latitude=${lat}&longitude=${lon}&radius_km=${radiusKm}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) return [];

      const json = await response.json();
      const list = json.alerts || json.data || json;
      return IpdmValidation.normalizeAlerts(list);
    } catch {
      return [];
    }
  }
}
