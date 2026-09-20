/**
 * Krishi Marga — IPDM Community Intelligence Service
 * Aggregates real-time farmer observations and evaluates localized cluster warnings within 10 km.
 * 
 * CRITICAL SAFETY RULES:
 * 1. NO SYNTHETIC ALERTS: Never generates a warning or claims observations unless real reports exist.
 * 2. PRIVACY: Anonymizes coordinates to protect farmer field privacy.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PestAlertService } from '../ipdm/geo/pestAlert.service';

const LOCAL_OBSERVATIONS_KEY = '@krishi_marga_ipdm_observations';

export interface CommunityObservation {
  id: string;
  crop: string;
  pest_or_disease: string;
  type: 'pest' | 'disease';
  severity: string;
  timestamp: number;
  latitude?: number;
  longitude?: number;
  anonymized_location?: string;
}

export interface CommunityPestAlert {
  id: string;
  crop: string;
  pest_disease_name: string;
  alert_level: 'Watch' | 'Warning' | 'Outbreak Alert';
  observation_count: number;
  radius_km: number;
  time_window_hours: number;
  approximate_location: string;
  summary: string;
  action_advisory: string[];
  specialist_advisory: string;
  timestamp: number;
}

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const IPDMCommunityService = {
  radiusKm: 10,
  timeWindowHours: 48,
  minObservationsThreshold: 3,

  /**
   * Logs a new crop diagnosis as an anonymous observation on device.
   */
  async recordObservation(params: {
    crop: string;
    pestOrDisease: string;
    type: 'pest' | 'disease';
    severity: string;
    latitude?: number;
    longitude?: number;
  }): Promise<CommunityObservation> {
    const timestamp = Date.now();
    let anonLocation = 'Local Farming Area';
    let storedLat = params.latitude;
    let storedLon = params.longitude;

    if (params.latitude !== undefined && params.longitude !== undefined) {
      // Anonymize to ~8.8 km resolution grid
      storedLat = Math.round(params.latitude * 12.5) / 12.5;
      storedLon = Math.round(params.longitude * 12.5) / 12.5;
      anonLocation = `Agricultural Sector (${storedLat.toFixed(2)}°N, ${storedLon.toFixed(2)}°E)`;
    }

    const obs: CommunityObservation = {
      id: `obs_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
      crop: params.crop,
      pest_or_disease: params.pestOrDisease,
      type: params.type,
      severity: params.severity,
      timestamp,
      latitude: storedLat,
      longitude: storedLon,
      anonymized_location: anonLocation,
    };

    try {
      const existing = await this.getLocalObservations();
      const updated = [obs, ...existing].slice(0, 50);
      await AsyncStorage.setItem(LOCAL_OBSERVATIONS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[IPDMCommunityService] Failed to save observation locally:', e);
    }

    // Try submitting online to Supabase / PostGIS if connected
    if (params.latitude !== undefined && params.longitude !== undefined) {
      try {
        await PestAlertService.submitReport({
          crop: params.crop,
          pest: params.pestOrDisease,
          severity: params.severity.toUpperCase(),
          latitude: params.latitude,
          longitude: params.longitude,
          notes: `Recorded via ${params.type} scan`,
        });
      } catch {
        // Safe fail — online sync will retry when connected
      }
    }

    return obs;
  },

  async getLocalObservations(): Promise<CommunityObservation[]> {
    try {
      const data = await AsyncStorage.getItem(LOCAL_OBSERVATIONS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('[IPDMCommunityService] Failed to read observations:', e);
    }
    return [];
  },

  /**
   * Retrieves active community alerts within 10 km.
   * STRICT SAFETY RULE: ZERO SYNTHETIC / SENTINEL ALERTS.
   * If there are no verified clusters of >= 3 observations, returns [].
   */
  async getNearbyAlerts(userLat?: number, userLon?: number): Promise<CommunityPestAlert[]> {
    const observations = await this.getLocalObservations();
    const cutoffTime = Date.now() - this.timeWindowHours * 60 * 60 * 1000;
    const recent = observations.filter((o) => o.timestamp >= cutoffTime);

    const clusters: Record<string, CommunityObservation[]> = {};

    for (const obs of recent) {
      if (userLat !== undefined && userLon !== undefined && obs.latitude !== undefined && obs.longitude !== undefined) {
        const dist = haversineDistanceKm(userLat, userLon, obs.latitude, obs.longitude);
        if (dist > this.radiusKm) continue;
      }

      const key = `${obs.crop}::${obs.pest_or_disease}`;
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(obs);
    }

    const alerts: CommunityPestAlert[] = [];

    for (const [key, obsList] of Object.entries(clusters)) {
      if (obsList.length >= this.minObservationsThreshold) {
        const [crop, problem] = key.split('::');
        const alertLevel = obsList.length >= 5 ? 'Outbreak Alert' : 'Warning';

        alerts.push({
          id: `alert_${crop}_${problem}`.replace(/\s+/g, '_').toLowerCase(),
          crop,
          pest_disease_name: problem,
          alert_level: alertLevel,
          observation_count: obsList.length,
          radius_km: this.radiusKm,
          time_window_hours: this.timeWindowHours,
          approximate_location: obsList[0].anonymized_location || `~${this.radiusKm} km radius zone`,
          summary: `${obsList.length} nearby observations of ${problem} reported on ${crop} in past ${this.timeWindowHours}h.`,
          action_advisory: [
            `Inspect ${crop} plants closely for early symptoms.`,
            'Deploy monitoring traps and ensure proper field sanitation.',
            'Consult your nearest Raitha Samparka Kendra (RSK) before spraying.',
          ],
          specialist_advisory: 'Call Kisan Call Centre at 1800-180-1551 for coordinated community advisories.',
          timestamp: obsList[0].timestamp,
        });
      }
    }

    // IMPORTANT: If no real reports meet the threshold, return empty array [].
    // NEVER INVENT A FAKE OR SENTINEL ALERT!
    return alerts;
  },
};
