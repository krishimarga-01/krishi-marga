import { PestReportPayload, PestAlert } from '../models/ipdm.types';
import { IpdmValidation } from '../models/ipdm.validation';
import { IpdmN8nApi } from '../api/ipdm.n8n';
import { IpdmNetwork } from '../services/ipdm.network';

/**
 * LAYER 2: COMMUNITY PEST EARLY WARNING SERVICE
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * - Community pest alerts and reporting are STRICTLY ONLINE ONLY.
 * - When offline:
 *     - No PostGIS spatial queries.
 *     - No community alert generation.
 *     - No remote pest report submission.
 *     - Returns empty alerts array.
 * - When online:
 *     - Farmer pest report -> n8n -> Supabase / PostGIS ST_DWithin (10 km radius / 10,000m)
 *     - Alerts distributed dynamically to farmers within 10 km.
 */
export class PestAlertService {
  /**
   * Calculates geodesic distance between two points using the Haversine formula (km).
   */
  public static calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Submits farmer pest report to n8n / Supabase PostGIS (ONLINE ONLY).
   */
  public static async submitReport(report: any): Promise<{ success: boolean; message: string }> {
    // 1. Online check: Community pest reports cannot be submitted offline
    const online = await IpdmNetwork.isConnected();
    if (!online) {
      return {
        success: false,
        message: 'Community pest reporting is an online-only feature. Please connect to the internet to submit your report.',
      };
    }

    // 2. Validate coordinates and required fields
    const validated = IpdmValidation.validatePestReport(report);
    if (!validated.isValid || !validated.data) {
      return { success: false, message: validated.error || 'Invalid report data.' };
    }

    // 3. Post to n8n webhook
    return await IpdmN8nApi.submitPestReport(validated.data);
  }

  /**
   * Retrieves active community pest alerts within 10 km (ONLINE ONLY).
   * If offline or coordinates invalid, returns empty list.
   */
  public static async getNearbyAlerts(
    userLat: number,
    userLon: number,
    radiusKm: number = 10
  ): Promise<PestAlert[]> {
    // 1. Online check: Community alerts require backend PostGIS connectivity
    const online = await IpdmNetwork.isConnected();
    if (!online) {
      return [];
    }

    // 2. Coordinate check
    if (!IpdmValidation.validateCoordinates(userLat, userLon)) {
      return [];
    }

    try {
      const liveAlerts = await IpdmN8nApi.fetchCommunityAlerts(userLat, userLon, radiusKm);
      // Ensure only alerts within the specified radius (<= 10 km) are returned
      return liveAlerts.filter((alert) => alert.distanceKm <= radiusKm);
    } catch (err) {
      console.warn('[PestAlertService] Failed to fetch community alerts:', err);
      return [];
    }
  }
}
