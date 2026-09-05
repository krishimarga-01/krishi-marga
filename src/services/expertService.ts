import { ExpertContact } from '../models/index';
import { Linking, Alert } from 'react-native';

// Development verified agricultural contacts (clearly marked as development verified)
export const VERIFIED_REGIONAL_EXPERTS: ExpertContact[] = [
  {
    id: 'kvk_1',
    name: 'Kisan Call Centre (Govt of India)',
    type: 'National Agricultural Toll-Free Helpline',
    phone: '18001801551',
    address: 'Ministry of Agriculture & Farmers Welfare',
    hours: '6:00 AM - 10:00 PM (All days)',
    isMockData: false,
  },
  {
    id: 'kvk_2',
    name: 'Krishi Vigyan Kendra (KVK) Regional Center',
    type: 'District Farm Science Centre',
    phone: '18001801551', // Official helpline
    address: 'ICAR Agricultural Extension Division',
    hours: '9:30 AM - 5:30 PM (Mon - Sat)',
    isMockData: true,
  },
];

export const ExpertService = {
  async getNearbyExperts(lat?: number, lon?: number): Promise<ExpertContact[]> {
    // When the real backend database is ready, fetch geo-located Kendras
    return VERIFIED_REGIONAL_EXPERTS;
  },

  async callExpert(phone?: string): Promise<void> {
    if (!phone) {
      Alert.alert('Contact Unavailable', 'No telephone contact is registered for this center.');
      return;
    }
    const url = 'tel:' + phone;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Dialer Error', 'Unable to launch phone dialer on this device.');
    }
  },
};