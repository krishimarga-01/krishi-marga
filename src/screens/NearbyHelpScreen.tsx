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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ExpertService } from '../services/expertService';
import { ExpertContact, ExpertCategory } from '../models';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';

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

export const NearbyHelpScreen = ({ route }: any) => {
  const { t } = useI18n();

  // Pre-selected crop if navigated from ResultScreen
  const initialCrop = route?.params?.selectedCrop || 'All';
  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop);

  // Active section tab: 'crop_doctor' (primary) vs 'kvk_support' (secondary)
  const [activeTab, setActiveTab] = useState<'doctors' | 'kvk'>('doctors');

  const [experts, setExperts] = useState<ExpertContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [locationDenied, setLocationDenied] = useState<boolean>(false);

  // Fetch verified crop doctors
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

  // Initial load without forcing location
  useEffect(() => {
    loadDoctors(locationCoords, selectedCrop);
  }, [loadDoctors, locationCoords, selectedCrop]);

  // Request location permission ONLY when farmer explicitly taps the location button
  const handleRequestLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        Alert.alert(
          t('locationOptionalTitle'),
          t('locationDeniedDesc')
        );
        setIsLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocationCoords(coords);
      setLocationDenied(false);
      await loadDoctors(coords, selectedCrop);
    } catch (err) {
      console.log('Location request error:', err);
      Alert.alert(t('locationNoticeTitle'), t('locationErrorDesc'));
    } finally {
      setIsLocating(false);
    }
  };

  // Filter contacts based on active tab
  const filteredList = experts.filter((expert) => {
    if (activeTab === 'doctors') {
      return expert.category === 'crop_doctor' || expert.category === 'agricultural_specialist';
    } else {
      return expert.category === 'kvk_support';
    }
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('nearbyHelpTitle')}</Text>
          <Text style={styles.subtitle}>{t('nearbySubtitle')}</Text>
        </View>

        {/* Offline Notice Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineEmoji}>📡</Text>
            <Text style={styles.offlineText}>
              {isCached ? t('offlineCachedNotice') : t('offlineDoctorsNotice')}
            </Text>
          </View>
        )}

        {/* Location Status / On-Demand Request Bar */}
        <View style={styles.locationBar}>
          {locationCoords ? (
            <View style={styles.locationActiveWrap}>
              <Text style={styles.locationActiveText}>📍 {t('locationActive')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.locationReqBtn}
              activeOpacity={0.8}
              onPress={handleRequestLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Text style={styles.locationBtnEmoji}>📍</Text>
                  <Text style={styles.locationReqText}>
                    {locationDenied ? t('locationOptional') : t('enableLocationForDoctors')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Crop Relevance Selector */}
        <View style={styles.cropScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropScroll}>
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
                    {cropName === 'All' ? t('filterAllCrops') : cropName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Tabs: Primary (Crop Doctors) vs Secondary (KVKs) */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'doctors' && styles.tabButtonActive]}
            onPress={() => setActiveTab('doctors')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'doctors' && styles.tabButtonTextActive]}>
              🩺 {t('tabCropDoctors')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'kvk' && styles.tabButtonActive]}
            onPress={() => setActiveTab('kvk')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'kvk' && styles.tabButtonTextActive]}>
              🏛️ {t('tabKvkSupport')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('locatingDoctors')}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredList}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>{t('noDoctorsFoundTitle')}</Text>
                <Text style={styles.emptyText}>{t('noDoctorsFound')}</Text>
                <TouchableOpacity
                  style={styles.helplineBtn}
                  activeOpacity={0.85}
                  onPress={() => ExpertService.callExpert('18001801551')}
                >
                  <Text style={styles.helplineBtnText}>📞 {t('callKisanHelpline')}</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => {
              return (
                <View style={styles.card}>
                  {/* Top Header: Name and Badge */}
                  <View style={styles.cardHeader}>
                    <View style={styles.nameWrap}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.roleTitle}>{item.roleTitle}</Text>
                    </View>
                    {item.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>✓ {t('verifiedBadge')}</Text>
                      </View>
                    )}
                  </View>

                  {/* Institution */}
                  <Text style={styles.institution}>🏛️ {item.institution}</Text>

                  {/* Distance - ONLY shown when actually calculated */}
                  {typeof item.distanceKm === 'number' && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>🚗 {item.distanceKm} {t('kmAway')}</Text>
                    </View>
                  )}

                  {/* Specialization & Crops */}
                  {item.specialization && (
                    <View style={styles.specWrap}>
                      <Text style={styles.specLabel}>{t('specializesIn')}</Text>
                      <Text style={styles.specText}>{item.specialization}</Text>
                    </View>
                  )}

                  {/* Crops Tags */}
                  {item.crops && item.crops.length > 0 && (
                    <View style={styles.cropsRow}>
                      {item.crops.map((c, i) => (
                        <View key={i} style={[styles.cropTag, selectedCrop === c && styles.cropTagMatch]}>
                          <Text style={[styles.cropTagText, selectedCrop === c && styles.cropTagTextMatch]}>
                            🌱 {c}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Address - ONLY if genuine verified address exists */}
                  {item.address && (
                    <Text style={styles.address}>📍 {item.address}</Text>
                  )}

                  {/* Hours */}
                  {item.hours && (
                    <Text style={styles.hours}>🕒 {item.hours}</Text>
                  )}

                  {/* Action Buttons Row */}
                  <View style={styles.actionsRow}>
                    {/* Call Button: ONLY if genuine phone exists */}
                    {item.phone && (
                      <TouchableOpacity
                        style={styles.callBtn}
                        activeOpacity={0.8}
                        onPress={() => ExpertService.callExpert(item.phone)}
                      >
                        <Text style={styles.callEmoji}>📞</Text>
                        <Text style={styles.callBtnText}>{t('callButton')} ({item.phone})</Text>
                      </TouchableOpacity>
                    )}

                    {/* Directions Button: ONLY if real location/address exists */}
                    {(item.latitude || item.address) && (
                      <TouchableOpacity
                        style={styles.directionsBtn}
                        activeOpacity={0.8}
                        onPress={() => ExpertService.openDirections(item)}
                      >
                        <Text style={styles.directionsEmoji}>🧭</Text>
                        <Text style={styles.directionsBtnText}>{t('directionsButton')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineEmoji: { fontSize: 16, marginRight: 8 },
  offlineText: { fontSize: 12, color: '#92400E', flex: 1, fontWeight: '600' },

  locationBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  locationActiveWrap: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  locationActiveText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  locationReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  locationBtnEmoji: { fontSize: 16, marginRight: 6 },
  locationReqText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },

  cropScrollWrap: { marginTop: 8, marginBottom: 6 },
  cropScroll: { paddingHorizontal: 16, gap: 8 },
  cropChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cropChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cropChipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600' },
  cropChipTextActive: { color: '#FFFFFF', fontWeight: '700' },

  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  tabButtonTextActive: { color: Colors.primary, fontWeight: '700' },

  listContent: { paddingHorizontal: 16, paddingBottom: 30, paddingTop: 4 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  loadingText: { marginTop: 12, fontSize: 14, color: Colors.textSecondary },

  card: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameWrap: { flex: 1, marginRight: 8 },
  name: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  roleTitle: { fontSize: 13, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: '700', color: '#166534' },

  institution: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },

  distanceBadge: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  distanceText: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },

  specWrap: { marginTop: 8 },
  specLabel: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  specText: { fontSize: 13, color: Colors.textPrimary, marginTop: 2, lineHeight: 18 },

  cropsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  cropTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cropTagMatch: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  cropTagText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  cropTagTextMatch: { color: '#166534', fontWeight: '700' },

  address: { fontSize: 13, color: Colors.textSecondary, marginTop: 8, lineHeight: 18 },
  hours: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  actionsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  callBtn: {
    flex: 1.5,
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callEmoji: { fontSize: 16, marginRight: 6 },
  callBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionsEmoji: { fontSize: 16, marginRight: 6 },
  directionsBtnText: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  helplineBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  helplineBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});