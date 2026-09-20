import { karnatakaRSKData, RSKLocation, RSKOfficer } from '../data/karnataka/rsk';
import { VERIFIED_CROP_DOCTORS } from './expertService';
import { Linking, Alert, Platform } from 'react-native';

export interface RSKFilterOptions {
  district?: string;
  taluk?: string;
  hobli?: string;
  officeType?: 'ALL' | 'RSK' | 'DEPARTMENT_OFFICE';
  searchQuery?: string;
}

export interface UnifiedSupportCenter {
  id: string;
  name: string;
  type: 'RSK' | 'DEPARTMENT_OFFICE' | 'KVK' | 'UNIVERSITY_CLINIC';
  typeLabel: string;
  categoryPriority: number; // 1: RSK, 2: Dept Office, 3: KVK, 4: University Clinic
  district: string;
  taluk: string;
  hobli?: string | null;
  place?: string;
  pincode?: string | null;
  address?: string;
  phones: string[];
  officers?: RSKOfficer[];
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null; // null means distance unavailable
  isVerified: boolean;
  specialization?: string;
}

export interface SupportCenterFilterOptions {
  district?: string;
  taluk?: string;
  hobli?: string;
  officeType?: 'ALL' | 'RSK' | 'DEPARTMENT_OFFICE' | 'KVK_CLINIC';
  searchQuery?: string;
  userCoords?: { latitude: number; longitude: number } | null;
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 * Returns rounded to 1 decimal place (e.g. 2.4 km).
 */
export function calculateHaversineDistanceKm(
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

export class RSKService {
  private static cachedLocations: RSKLocation[] = karnatakaRSKData.locations;

  /**
   * Returns all 31 unique Karnataka districts.
   */
  static getAllDistricts(): string[] {
    const set = new Set<string>();
    for (const loc of this.cachedLocations) {
      if (loc.district) {
        set.add(loc.district);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Returns taluks for a given district or all taluks.
   */
  static getTaluksForDistrict(district?: string): string[] {
    if (!district || district === 'All') {
      const set = new Set<string>();
      for (const loc of this.cachedLocations) {
        if (loc.taluk) set.add(loc.taluk);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }
    const set = new Set<string>();
    for (const loc of this.cachedLocations) {
      if (loc.district.toLowerCase() === district.toLowerCase() && loc.taluk) {
        set.add(loc.taluk);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Returns hoblis for a given district and taluk.
   */
  static getHoblisForTaluk(district?: string, taluk?: string): string[] {
    const set = new Set<string>();
    for (const loc of this.cachedLocations) {
      const distMatch = !district || district === 'All' || loc.district.toLowerCase() === district.toLowerCase();
      const talukMatch = !taluk || taluk === 'All' || loc.taluk.toLowerCase() === taluk.toLowerCase();
      if (distMatch && talukMatch && loc.hobli) {
        set.add(loc.hobli);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  /**
   * Filter and sort unified support centers with optional GPS distance calculation.
   * NEVER invents coordinates or distances.
   */
  static getUnifiedSupportCenters(options: SupportCenterFilterOptions = {}): UnifiedSupportCenter[] {
    const { district, taluk, hobli, officeType = 'ALL', searchQuery, userCoords } = options;
    const query = searchQuery ? searchQuery.trim().toLowerCase() : '';

    const results: UnifiedSupportCenter[] = [];

    // 1. Convert Karnataka RSK & Dept Offices (611 locations)
    for (const loc of this.cachedLocations) {
      const isRsk = loc.office_type === 'RSK';
      const catPriority = isRsk ? 1 : 2;

      // RSK dataset does NOT have coordinates -> distance is strictly null
      results.push({
        id: loc.id,
        name: loc.name,
        type: loc.office_type,
        typeLabel: isRsk ? 'RSK' : 'DEPT OFFICE',
        categoryPriority: catPriority,
        district: loc.district,
        taluk: loc.taluk,
        hobli: loc.hobli,
        place: loc.place,
        pincode: loc.pincode,
        phones: loc.phones || [],
        officers: loc.officers || [],
        latitude: null,
        longitude: null,
        distanceKm: null, // "Distance unavailable" - NEVER fabricated
        isVerified: true,
      });
    }

    // 2. Convert Verified Research Stations, KVKs, and University Clinics (14 verified locations)
    for (const doc of VERIFIED_CROP_DOCTORS) {
      const isKvk = doc.category === 'kvk_support';
      const catPriority = isKvk ? 3 : 4;
      const typeLabel = isKvk ? 'KVK CENTER' : 'UNIVERSITY CLINIC';

      let distanceKm: number | null = null;
      if (userCoords && doc.latitude && doc.longitude) {
        distanceKm = calculateHaversineDistanceKm(
          userCoords.latitude,
          userCoords.longitude,
          doc.latitude,
          doc.longitude
        );
      }

      // Parse district from address if possible
      let docDistrict = 'All';
      const addr = doc.address || '';
      if (addr.includes('Bengaluru') || addr.includes('Bangalore')) docDistrict = 'Bengaluru Urban';
      else if (addr.includes('Dharwad')) docDistrict = 'Dharwad';
      else if (addr.includes('Coimbatore')) docDistrict = 'Coimbatore';
      else if (addr.includes('Thanjavur')) docDistrict = 'Thanjavur';

      results.push({
        id: doc.id,
        name: doc.name,
        type: isKvk ? 'KVK' : 'UNIVERSITY_CLINIC',
        typeLabel: typeLabel,
        categoryPriority: catPriority,
        district: docDistrict,
        taluk: doc.roleTitle || 'Research Station',
        place: doc.institution,
        address: doc.address,
        phones: doc.phone ? [doc.phone] : [],
        latitude: doc.latitude,
        longitude: doc.longitude,
        distanceKm: distanceKm, // Real verified distance
        isVerified: true,
        specialization: doc.specialization,
      });
    }

    // 3. Apply Filters
    const filtered = results.filter((item) => {
      // District filter
      if (district && district !== 'All') {
        if (item.district && item.district !== 'All' && item.district.toLowerCase() !== district.toLowerCase()) {
          return false;
        }
      }

      // Taluk filter
      if (taluk && taluk !== 'All') {
        if (item.taluk && item.taluk.toLowerCase() !== taluk.toLowerCase()) {
          return false;
        }
      }

      // Hobli filter
      if (hobli && hobli !== 'All') {
        if (!item.hobli || item.hobli.toLowerCase() !== hobli.toLowerCase()) {
          return false;
        }
      }

      // Office Type filter
      if (officeType === 'RSK' && item.type !== 'RSK') {
        return false;
      }
      if (officeType === 'DEPARTMENT_OFFICE' && item.type !== 'DEPARTMENT_OFFICE') {
        return false;
      }
      if (officeType === 'KVK_CLINIC' && item.type !== 'KVK' && item.type !== 'UNIVERSITY_CLINIC') {
        return false;
      }

      // Search Query filter (matches Name, Place, District, Taluk, Hobli, Pincode, Phone, Officers)
      if (query) {
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesPlace = item.place ? item.place.toLowerCase().includes(query) : false;
        const matchesDistrict = item.district ? item.district.toLowerCase().includes(query) : false;
        const matchesTaluk = item.taluk ? item.taluk.toLowerCase().includes(query) : false;
        const matchesHobli = item.hobli ? item.hobli.toLowerCase().includes(query) : false;
        const matchesPincode = item.pincode ? item.pincode.includes(query) : false;
        const matchesAddress = item.address ? item.address.toLowerCase().includes(query) : false;
        const matchesPhone = item.phones.some((p) => p.includes(query));
        const matchesOfficer = item.officers?.some(
          (o) =>
            o.designation.toLowerCase().includes(query) ||
            (o.officer_name && o.officer_name.toLowerCase().includes(query))
        ) || false;

        if (
          !matchesName &&
          !matchesPlace &&
          !matchesDistrict &&
          !matchesTaluk &&
          !matchesHobli &&
          !matchesPincode &&
          !matchesAddress &&
          !matchesPhone &&
          !matchesOfficer
        ) {
          return false;
        }
      }

      return true;
    });

    // 4. Sort Results
    if (userCoords) {
      // When GPS is available:
      // Items with real distance sorted first (ascending distance).
      // Items with distance unavailable sorted after by categoryPriority, then alphabetical.
      filtered.sort((a, b) => {
        const aHasDist = a.distanceKm !== null && a.distanceKm !== undefined;
        const bHasDist = b.distanceKm !== null && b.distanceKm !== undefined;

        if (aHasDist && bHasDist) {
          return (a.distanceKm as number) - (b.distanceKm as number);
        }
        if (aHasDist && !bHasDist) return -1;
        if (!aHasDist && bHasDist) return 1;

        // Both lack distance: sort by category priority (1. RSK, 2. Dept Office, 3. KVK, 4. Univ)
        if (a.categoryPriority !== b.categoryPriority) {
          return a.categoryPriority - b.categoryPriority;
        }
        return a.name.localeCompare(b.name);
      });
    } else {
      // When GPS is NOT active (Manual Search mode):
      // Prioritize 1. RSK, 2. Dept Office, 3. KVK, 4. Univ Clinic
      filtered.sort((a, b) => {
        if (a.categoryPriority !== b.categoryPriority) {
          return a.categoryPriority - b.categoryPriority;
        }
        if (a.district !== b.district) {
          return a.district.localeCompare(b.district);
        }
        return a.name.localeCompare(b.name);
      });
    }

    return filtered;
  }

  /**
   * Backward-compatible filter for RSKLocation.
   */
  static filterLocations(options: RSKFilterOptions = {}): RSKLocation[] {
    const { district, taluk, hobli, officeType = 'ALL', searchQuery } = options;
    const query = searchQuery ? searchQuery.trim().toLowerCase() : '';

    return this.cachedLocations.filter((loc) => {
      if (district && district !== 'All' && loc.district.toLowerCase() !== district.toLowerCase()) {
        return false;
      }
      if (taluk && taluk !== 'All' && loc.taluk.toLowerCase() !== taluk.toLowerCase()) {
        return false;
      }
      if (hobli && hobli !== 'All') {
        if (!loc.hobli || loc.hobli.toLowerCase() !== hobli.toLowerCase()) {
          return false;
        }
      }
      if (officeType === 'RSK' && loc.office_type !== 'RSK') {
        return false;
      }
      if (officeType === 'DEPARTMENT_OFFICE' && loc.office_type !== 'DEPARTMENT_OFFICE') {
        return false;
      }

      if (query) {
        const matchesName = loc.name.toLowerCase().includes(query);
        const matchesPlace = loc.place.toLowerCase().includes(query);
        const matchesDistrict = loc.district.toLowerCase().includes(query);
        const matchesTaluk = loc.taluk.toLowerCase().includes(query);
        const matchesHobli = loc.hobli ? loc.hobli.toLowerCase().includes(query) : false;
        const matchesPincode = loc.pincode ? loc.pincode.includes(query) : false;
        const matchesPhone = loc.phones.some((p) => p.includes(query));
        const matchesOfficer = loc.officers.some(
          (o) =>
            o.designation.toLowerCase().includes(query) ||
            (o.officer_name && o.officer_name.toLowerCase().includes(query))
        );

        if (
          !matchesName &&
          !matchesPlace &&
          !matchesDistrict &&
          !matchesTaluk &&
          !matchesHobli &&
          !matchesPincode &&
          !matchesPhone &&
          !matchesOfficer
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Dials phone number if available.
   */
  static callNumber(phone: string) {
    if (!phone) return;
    const cleaned = phone.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Call Failed', `Could not initiate phone call to ${phone}`);
    });
  }

  /**
   * Opens directions using verified coordinates if available,
   * or falls back to verified address query.
   */
  static openDirections(location: UnifiedSupportCenter | RSKLocation) {
    if ('latitude' in location && location.latitude && location.longitude) {
      const lat = location.latitude;
      const lon = location.longitude;
      const label = encodeURIComponent(location.name);
      const url =
        Platform.OS === 'ios'
          ? `maps:0,0?q=${label}@${lat},${lon}`
          : `geo:${lat},${lon}?q=${lat},${lon}(${label})`;
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(webUrl);
          }
        })
        .catch(() => {
          Linking.openURL(webUrl);
        });
      return;
    }

    const placeStr = ('place' in location && location.place) ? location.place : ('address' in location && location.address) ? location.address : '';
    const talukStr = location.taluk || '';
    const distStr = location.district || '';
    const query = `${location.name}, ${placeStr}, ${talukStr}, ${distStr}, Karnataka`;
    const encoded = encodeURIComponent(query.trim());
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Maps Unavailable', 'Could not open maps application.');
    });
  }
}
