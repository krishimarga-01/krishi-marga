import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ExpertService } from '../services/expertService';
import { ExpertContact } from '../models';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';

const SUPPORTED_CROPS = [
  'All',
  'Coconut',
  'Paddy',
  'Tomato',
  'Chilli',
  'Cotton',
  'Sugarcane',
  'Maize',
];

const COMPANY_HELPLINES = [
  {
    id: 'kcc_goi',
    name: 'Kisan Call Centre (Govt. of India)',
    organization: 'Ministry of Agriculture & Farmers Welfare',
    phone: '18001801551',
    displayPhone: '1800-180-1551 (Toll Free)',
    hours: '6:00 AM - 10:00 PM (All 7 Days)',
    languages: 'Kannada, Tamil, Telugu, Malayalam, Hindi, English',
    description: 'Direct telephonic consultation with agricultural university scientists & crop doctors.',
  },
  {
    id: 'bayer_care',
    name: 'Bayer CropScience Farmer Care',
    organization: 'Bayer CropScience India',
    phone: '18001204040',
    displayPhone: '1800-120-4040 (Toll Free)',
    hours: '9:00 AM - 6:00 PM (Mon-Sat)',
    languages: 'South Indian regional languages',
    description: 'Product verification, CIBRC dosage recommendations & crop protection guidance.',
  },
  {
    id: 'upl_care',
    name: 'UPL Kisan Helpline (Adarsh Kisan)',
    organization: 'UPL Limited India',
    phone: '18001021818',
    displayPhone: '1800-102-1818 (Toll Free)',
    hours: '9:30 AM - 6:00 PM',
    languages: 'Kannada, Tamil, Telugu, Hindi',
    description: 'Technical guidance on fungicides, herbicides & safe chemical application.',
  },
  {
    id: 'rallis_tata',
    name: 'Rallis Kisan Samadhan',
    organization: 'Rallis India Limited (A Tata Enterprise)',
    phone: '18002664449',
    displayPhone: '1800-266-4449 (Toll Free)',
    hours: '9:00 AM - 6:00 PM',
    languages: 'Regional languages',
    description: 'Plant health advisory, soil fertility & crop nutrition solutions.',
  },
  {
    id: 'syngenta_care',
    name: 'Syngenta Farmer Support Desk',
    organization: 'Syngenta India Limited',
    phone: '18001215656',
    displayPhone: '1800-121-5656 (Toll Free)',
    hours: '9:00 AM - 5:30 PM',
    languages: 'English, Hindi, Regional',
    description: 'Seed disease diagnostics, insecticide stewardship & spray advisory.',
  },
];

export const NearbyHelpScreen = ({ route }: any) => {
  const { t } = useI18n();

  const initialCrop = route?.params?.selectedCrop || 'All';
  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop);
  const [activeTab, setActiveTab] = useState<'doctors' | 'kvk' | 'helplines'>('doctors');

  const [experts, setExperts] = useState<ExpertContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);

  const loadDoctors = useCallback(async (coords?: { latitude: number; longitude: number } | null, cropFilter?: string) => {
    setIsLoading(true);
    try {
      const cropParam = cropFilter && cropFilter !== 'All' ? cropFilter : null;
      const result = await ExpertService.getNearbyCropDoctors({
        latitude: coords?.latitude ?? null,
        longitude: coords?.longitude ?? null,
        crop: cropParam,
      });

      setExperts(result.experts);
      setIsOffline(result.isOffline);
      setIsCached(result.isCached);
    } catch (e) {
      console.log('Error loading crop doctors:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors(locationCoords, selectedCrop);
  }, [loadDoctors, locationCoords, selectedCrop]);

  const handleRequestLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('locationOptionalTitle'), t('locationDeniedDesc'));
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocationCoords(coords);
      await loadDoctors(coords, selectedCrop);
    } catch (err) {
      console.log('Location request error:', err);
    } finally {
      setIsLocating(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Call Failed', `Could not initiate phone call to ${phoneNumber}`);
    });
  };

  const filteredList = experts.filter((expert) => {
    if (activeTab === 'doctors') {
      return expert.category === 'crop_doctor' || expert.category === 'agricultural_specialist';
    } else if (activeTab === 'kvk') {
      return expert.category === 'kvk_support';
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader />

      <View style={styles.container}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Crop Doctors & Support</Text>
          <Text style={styles.subtitle}>
            Verified university pathology clinics, KVKs & agri-helplines
          </Text>
        </View>

        {/* 3 Main Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'doctors' && styles.tabButtonActive]}
            onPress={() => setActiveTab('doctors')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'doctors' && styles.tabButtonTextActive]}>
              🩺 University Clinics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'kvk' && styles.tabButtonActive]}
            onPress={() => setActiveTab('kvk')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'kvk' && styles.tabButtonTextActive]}>
              🏛️ KVK Centers
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'helplines' && styles.tabButtonActive]}
            onPress={() => setActiveTab('helplines')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'helplines' && styles.tabButtonTextActive]}>
              📞 Helplines
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'helplines' ? (
          /* Company and Govt Helplines List */
          <FlatList
            data={COMPANY_HELPLINES}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameWrap}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.organizationText}>{item.organization}</Text>
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓ TOLL FREE</Text>
                  </View>
                </View>

                <Text style={styles.helplineHours}>⏰ Hours: {item.hours}</Text>
                <Text style={styles.helplineLang}>🗣️ Languages: {item.languages}</Text>
                <Text style={styles.services}>{item.description}</Text>

                <TouchableOpacity
                  style={styles.callButton}
                  activeOpacity={0.85}
                  onPress={() => handleCall(item.phone)}
                >
                  <Text style={styles.callButtonText}>📞 Call {item.displayPhone}</Text>
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={<LandscapeBanner />}
          />
        ) : (
          /* University Clinics & KVKs */
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                {/* Crop Filter Selector */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cropScroll}
                >
                  {SUPPORTED_CROPS.map((cropName) => {
                    const isSelected = selectedCrop === cropName;
                    return (
                      <TouchableOpacity
                        key={cropName}
                        style={[styles.cropChip, isSelected && styles.cropChipActive]}
                        onPress={() => setSelectedCrop(cropName)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.cropChipText, isSelected && styles.cropChipTextActive]}>
                          {cropName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameWrap}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.roleTitle}>{item.roleTitle}</Text>
                  </View>
                  {item.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓ VERIFIED</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.organizationText}>{item.institution}</Text>
                <Text style={styles.addressText}>📍 {item.address}</Text>
                {item.specialization && (
                  <Text style={styles.specializationText}>🎯 {item.specialization}</Text>
                )}

                <View style={styles.cardActionsRow}>
                  {item.phone ? (
                    <TouchableOpacity
                      style={styles.callButtonSmall}
                      activeOpacity={0.85}
                      onPress={() => handleCall(item.phone!)}
                    >
                      <Text style={styles.callButtonTextSmall}>📞 Call Clinic</Text>
                    </TouchableOpacity>
                  ) : null}

                  {item.latitude && item.longitude ? (
                    <TouchableOpacity
                      style={styles.directionsBtn}
                      activeOpacity={0.85}
                      onPress={() => ExpertService.openDirections(item)}
                    >
                      <Text style={styles.directionsText}>🗺️ Directions</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}
            ListFooterComponent={<LandscapeBanner />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#162836',
  },
  subtitle: {
    fontSize: 13,
    color: '#5A6E60',
    marginTop: 3,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEFEA',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6E60',
  },
  tabButtonTextActive: {
    color: '#1B5E20',
  },
  cropScroll: {
    paddingBottom: 10,
  },
  cropChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E2',
    marginRight: 8,
  },
  cropChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6E60',
  },
  cropChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  nameWrap: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162836',
  },
  roleTitle: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 1,
  },
  verifiedBadge: {
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C3E6CB',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E7E34',
  },
  organizationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#5A6E60',
    lineHeight: 16,
    marginBottom: 6,
  },
  specializationText: {
    fontSize: 12,
    color: '#334E68',
    backgroundColor: '#F0F9F3',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  helplineHours: {
    fontSize: 12,
    color: '#5A6E60',
    marginTop: 4,
  },
  helplineLang: {
    fontSize: 12,
    color: '#5A6E60',
    marginTop: 2,
  },
  services: {
    fontSize: 12.5,
    color: '#334E68',
    marginVertical: 8,
    lineHeight: 17,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  callButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  callButtonSmall: {
    flex: 0.48,
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  callButtonTextSmall: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  directionsBtn: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  directionsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
});