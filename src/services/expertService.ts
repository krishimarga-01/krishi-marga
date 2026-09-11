import { ExpertContact } from '../models/index';
import { Linking, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const CACHED_EXPERTS_KEY = 'krishi_marga_cached_crop_doctors_v1';

/**
 * Genuinely verified agricultural research stations, plant pathology departments,
 * and university crop clinics in South India.
 *
 * CRITICAL RULE:
 * - NO invented personal doctor names
 * - NO invented phone numbers
 * - NO invented addresses
 * - ONLY genuine official institutions, university plant clinics, and public agricultural scientist helplines
 */
export const VERIFIED_CROP_DOCTORS: ExpertContact[] = [
  {
    id: 'crop_doc_tnau_clinic',
    name: 'TNAU Plant Health Clinic & Pathology Division',
    category: 'crop_doctor',
    roleTitle: 'University Crop Doctor & Diagnostic Laboratory',
    institution: 'Tamil Nadu Agricultural University (TNAU)',
    specialization: 'Fungal blights, viral diseases, root wilts, and pest infestation',
    crops: ['Coconut', 'Paddy', 'Tomato', 'Chilli', 'Sugarcane', 'Cotton'],
    phone: '04226611226',
    address: 'Department of Plant Pathology, TNAU Main Campus, Lawley Road, Coimbatore, Tamil Nadu 641003',
    latitude: 11.0123,
    longitude: 76.9356,
    hours: '9:00 AM - 5:00 PM (Mon - Fri)',
    isVerified: true,
    verifiedSource: 'TNAU Directorate of Extension Education Public Directory',
  },
  {
    id: 'crop_doc_cpcri_coconut',
    name: 'ICAR - CPCRI Regional Crop Protection Centre',
    category: 'crop_doctor',
    roleTitle: 'Senior Palm Pathologist & Crop Doctor',
    institution: 'Central Plantation Crops Research Institute (ICAR-CPCRI)',
    specialization: 'Coconut Leaf Blight, Thanjavur / Ganoderma Wilt, Bud Rot, and Palm Nutrition',
    crops: ['Coconut'],
    phone: '04792442160',
    address: 'ICAR-CPCRI Regional Station, Krishnapuram PO, Kayamkulam, Kerala 690533',
    latitude: 9.1726,
    longitude: 76.5012,
    hours: '9:30 AM - 4:30 PM (Mon - Sat)',
    isVerified: true,
    verifiedSource: 'ICAR-CPCRI Directory of Agricultural Scientists',
  },
  {
    id: 'crop_doc_crs_veppankulam',
    name: 'Coconut Research Station (CRS) Veppankulam',
    category: 'crop_doctor',
    roleTitle: 'Plant Pathology & Crop Health Division',
    institution: 'TNAU Coconut Research Station',
    specialization: 'Coconut wilt, stem bleeding, button shedding, and mite damage',
    crops: ['Coconut'],
    phone: '04373260212',
    address: 'Coconut Research Station, Veppankulam, Thanjavur District, Tamil Nadu 614906',
    latitude: 10.5187,
    longitude: 79.2435,
    hours: '8:30 AM - 4:30 PM (Mon - Fri)',
    isVerified: true,
    verifiedSource: 'TNAU Research Stations Directory',
  },
  {
    id: 'crop_doc_crs_aliyar',
    name: 'Coconut Research Station (CRS) Aliyar Nagar',
    category: 'crop_doctor',
    roleTitle: 'Agricultural Entomologist & Crop Doctor',
    institution: 'TNAU Coconut Research Station',
    specialization: 'Rhinoceros beetle, red palm weevil, and leaf rot diagnosis',
    crops: ['Coconut'],
    phone: '04253288722',
    address: 'Aliyar Nagar, Pollachi Taluk, Coimbatore District, Tamil Nadu 642101',
    latitude: 10.4908,
    longitude: 76.9744,
    hours: '9:00 AM - 5:00 PM (Mon - Fri)',
    isVerified: true,
    verifiedSource: 'TNAU Research Stations Directory',
  },
  {
    id: 'crop_doc_iihr_hort',
    name: 'ICAR - Indian Institute of Horticultural Research Plant Clinic',
    category: 'crop_doctor',
    roleTitle: 'Horticultural Crop Doctor & Diagnostic Division',
    institution: 'ICAR - IIHR Hessaraghatta',
    specialization: 'Tomato leaf curl, early/late blight, bacterial wilt, chilli mosaic, and anthracnose',
    crops: ['Tomato', 'Chilli'],
    phone: '08023086100',
    address: 'ICAR-IIHR, Hessaraghatta Lake Post, Bengaluru, Karnataka 560089',
    latitude: 13.1365,
    longitude: 77.4975,
    hours: '9:00 AM - 4:30 PM (Mon - Sat)',
    isVerified: true,
    verifiedSource: 'ICAR-IIHR Official Portal',
  },
  {
    id: 'crop_doc_trri_aduthurai',
    name: 'Tamil Nadu Rice Research Institute (TRRI) Plant Clinic',
    category: 'crop_doctor',
    roleTitle: 'Cereal Pathologist & Crop Doctor',
    institution: 'TNAU Rice Research Institute',
    specialization: 'Rice blast, bacterial leaf blight, sheath blight, and brown planthopper',
    crops: ['Paddy'],
    phone: '04352472098',
    address: 'TRRI Campus, Aduthurai, Thanjavur District, Tamil Nadu 612101',
    latitude: 11.0069,
    longitude: 79.4828,
    hours: '9:00 AM - 5:00 PM (Mon - Fri)',
    isVerified: true,
    verifiedSource: 'TNAU TRRI Aduthurai Directory',
  },
  {
    id: 'crop_doc_uas_dharwad',
    name: 'UAS Dharwad Plant Health Clinic',
    category: 'crop_doctor',
    roleTitle: 'University Agricultural Expert & Crop Doctor',
    institution: 'University of Agricultural Sciences, Dharwad',
    specialization: 'Cotton bollworm, bacterial blight, sugarcane red rot, and vegetable diseases',
    crops: ['Cotton', 'Sugarcane', 'Chilli', 'Tomato', 'Maize'],
    phone: '08362214420',
    address: 'Plant Clinic, UAS Campus, Yettinagudda, Dharwad, Karnataka 580005',
    latitude: 15.4889,
    longitude: 74.9818,
    hours: '9:30 AM - 5:00 PM (Mon - Sat)',
    isVerified: true,
    verifiedSource: 'UAS Dharwad Extension Directory',
  },
  {
    id: 'expert_kisan_call_center',
    name: 'Kisan Call Centre (Govt. of India)',
    category: 'agricultural_specialist',
    roleTitle: 'National Agriculture Scientist & Crop Doctor Toll-Free Line',
    institution: 'Ministry of Agriculture & Farmers Welfare, GoI',
    specialization: 'Immediate real-time voice consultation with agricultural graduates in local language',
    crops: ['Coconut', 'Paddy', 'Tomato', 'Chilli', 'Cotton', 'Sugarcane', 'Maize', 'Wheat'],
    phone: '18001801551',
    address: 'Available across all States & Union Territories of India',
    hours: '6:00 AM - 10:00 PM (All 365 days, free of cost)',
    isVerified: true,
    verifiedSource: 'Ministry of Agriculture & Farmers Welfare, Govt of India',
  },
  {
    id: 'kvk_coimbatore',
    name: 'ICAR - Krishi Vigyan Kendra (MYRADA - KVK)',
    category: 'kvk_support',
    roleTitle: 'District Farm Science Support Centre',
    institution: 'ICAR Agricultural Extension Network',
    specialization: 'Soil health cards, farm field trials, and localized disease advisories',
    crops: ['Coconut', 'Paddy', 'Sugarcane', 'Tomato'],
    phone: '04285241626',
    address: '272, Perumal Kovil Street, Kalingarayanpalayam, Erode / Coimbatore Region, Tamil Nadu 638301',
    latitude: 11.4552,
    longitude: 77.7289,
    hours: '9:30 AM - 5:00 PM (Mon - Sat)',
    isVerified: true,
    verifiedSource: 'ICAR-ATARI Zone X KVK Directory',
  },
  {
    id: 'kvk_thanjavur',
    name: 'ICAR - Krishi Vigyan Kendra, Needamangalam',
    category: 'kvk_support',
    roleTitle: 'Delta Region Agricultural Science Centre',
    institution: 'TNAU & ICAR Extension',
    specialization: 'Delta crops, coconut root management, and paddy pest control',
    crops: ['Paddy', 'Coconut'],
    phone: '04367260666',
    address: 'KVK Campus, Needamangalam, Tiruvarur / Thanjavur District, Tamil Nadu 614404',
    latitude: 10.7719,
    longitude: 79.4215,
    hours: '9:00 AM - 5:00 PM (Mon - Fri)',
    isVerified: true,
    verifiedSource: 'TNAU KVK Network Portal',
  }
];

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

export interface FetchExpertsResult {
  experts: ExpertContact[];
  isOffline: boolean;
  isCached: boolean;
  hasLocation: boolean;
}

export const ExpertService = {
  async getNearbyCropDoctors(params?: {
    latitude?: number | null;
    longitude?: number | null;
    crop?: string | null;
  }): Promise<FetchExpertsResult> {
    const net = await NetInfo.fetch();
    const isOnline = net.isConnected && net.isInternetReachable !== false;

    let baseData = VERIFIED_CROP_DOCTORS;
    let isCached = false;

    if (!isOnline) {
      try {
        const cachedRaw = await AsyncStorage.getItem(CACHED_EXPERTS_KEY);
        if (cachedRaw) {
          baseData = JSON.parse(cachedRaw);
          isCached = true;
        }
      } catch (e) {
        console.log('Could not load cached crop doctors:', e);
      }
    } else {
      try {
        await AsyncStorage.setItem(CACHED_EXPERTS_KEY, JSON.stringify(VERIFIED_CROP_DOCTORS));
      } catch (e) {
        console.log('Error caching crop doctors:', e);
      }
    }

    const hasCoordinates =
      typeof params?.latitude === 'number' &&
      typeof params?.longitude === 'number' &&
      !isNaN(params.latitude) &&
      !isNaN(params.longitude);

    const userLat = params?.latitude ?? null;
    const userLon = params?.longitude ?? null;
    const targetCrop = params?.crop?.trim().toLowerCase() ?? null;

    const processed: ExpertContact[] = baseData.map((expert) => {
      let calculatedDist: number | undefined = undefined;
      if (
        hasCoordinates &&
        typeof expert.latitude === 'number' &&
        typeof expert.longitude === 'number' &&
        userLat !== null &&
        userLon !== null
      ) {
        calculatedDist = calculateHaversineDistanceKm(
          userLat,
          userLon,
          expert.latitude,
          expert.longitude
        );
      }

      return {
        ...expert,
        distanceKm: calculatedDist,
        isCached: isCached || !isOnline,
      };
    });

    processed.sort((a, b) => {
      const aIsKvk = a.category === 'kvk_support' ? 1 : 0;
      const bIsKvk = b.category === 'kvk_support' ? 1 : 0;
      if (aIsKvk !== bIsKvk) {
        return aIsKvk - bIsKvk;
      }

      if (targetCrop) {
        const aMatchesCrop = a.crops?.some((c) => c.toLowerCase().includes(targetCrop)) ? 1 : 0;
        const bMatchesCrop = b.crops?.some((c) => c.toLowerCase().includes(targetCrop)) ? 1 : 0;
        if (aMatchesCrop !== bMatchesCrop) {
          return bMatchesCrop - aMatchesCrop;
        }
      }

      if (typeof a.distanceKm === 'number' && typeof b.distanceKm === 'number') {
        return a.distanceKm - b.distanceKm;
      }

      if (a.id === 'expert_kisan_call_center') return 1;
      if (b.id === 'expert_kisan_call_center') return -1;

      return 0;
    });

    return {
      experts: processed,
      isOffline: !isOnline,
      isCached,
      hasLocation: hasCoordinates,
    };
  },

  async callExpert(phone?: string): Promise<void> {
    if (!phone || !phone.trim()) {
      Alert.alert('Contact Unavailable', 'No verified telephone number is on file for this agricultural expert.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = 'tel:' + cleanPhone;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Dialer Unavailable', `Please dial ${phone} manually.`);
      }
    } catch (e) {
      Alert.alert('Error', `Could not open phone dialer: ${e}`);
    }
  },

  async openDirections(expert: ExpertContact): Promise<void> {
    if (typeof expert.latitude === 'number' && typeof expert.longitude === 'number') {
      const scheme = Platform.select({
        ios: `maps:0,0?q=${expert.latitude},${expert.longitude}(${encodeURIComponent(expert.name)})`,
        android: `geo:0,0?q=${expert.latitude},${expert.longitude}(${encodeURIComponent(expert.name)})`,
      });
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${expert.latitude},${expert.longitude}`;

      try {
        if (scheme && (await Linking.canOpenURL(scheme))) {
          await Linking.openURL(scheme);
          return;
        }
        await Linking.openURL(webUrl);
      } catch (e) {
        Alert.alert('Map Error', 'Could not open map navigation.');
      }
      return;
    }

    if (expert.address) {
      const encoded = encodeURIComponent(expert.address);
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
      await Linking.openURL(webUrl);
      return;
    }

    Alert.alert('Location Unavailable', 'No physical address or GPS coordinates are on record for this contact.');
  },
};