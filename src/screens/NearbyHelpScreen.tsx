import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { RSKService, UnifiedSupportCenter } from '../services/rskService';
import { RSKDetailModal } from '../components/RSKDetailModal';
import { RSKLocation } from '../data/karnataka/rsk';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';
import { useI18n } from '../services/i18n';

type GpsState = 'IDLE' | 'LOCATING' | 'AVAILABLE' | 'DENIED' | 'UNAVAILABLE';

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
  const searchInputRef = useRef<TextInput>(null);

  // Active top tab
  const [activeTab, setActiveTab] = useState<'centers' | 'helplines'>('centers');

  // GPS State Management (Never automatic on startup, purely farmer-driven)
  const [gpsState, setGpsState] = useState<GpsState>('IDLE');
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Manual Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [district, setDistrict] = useState<string>('All');
  const [taluk, setTaluk] = useState<string>('All');
  const [hobli, setHobli] = useState<string>('All');
  const [officeType, setOfficeType] = useState<'ALL' | 'RSK' | 'DEPARTMENT_OFFICE' | 'KVK_CLINIC'>('ALL');

  // RSK Detail Modal
  const [modalLocation, setModalLocation] = useState<RSKLocation | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Filter options data
  const allDistricts = useMemo(() => ['All', ...RSKService.getAllDistricts()], []);
  const availableTaluks = useMemo(() => ['All', ...RSKService.getTaluksForDistrict(district)], [district]);
  const availableHoblis = useMemo(() => ['All', ...RSKService.getHoblisForTaluk(district, taluk)], [district, taluk]);

  // Unified Support Centers list with real distance calculation when GPS is active
  const supportCenters = useMemo(() => {
    return RSKService.getUnifiedSupportCenters({
      district,
      taluk,
      hobli,
      officeType,
      searchQuery,
      userCoords,
    });
  }, [district, taluk, hobli, officeType, searchQuery, userCoords]);

  // Request GPS Location Flow
  const handleFindNearMe = async () => {
    setGpsState('LOCATING');
    try {
      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsState('DENIED');
        setUserCoords(null);
        return;
      }

      // 2. Obtain current GPS position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (position && position.coords) {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsState('AVAILABLE');
      } else {
        setGpsState('UNAVAILABLE');
        setUserCoords(null);
      }
    } catch (error) {
      setGpsState('UNAVAILABLE');
      setUserCoords(null);
    }
  };

  // Clear GPS location
  const handleClearLocation = () => {
    setUserCoords(null);
    setGpsState('IDLE');
  };

  // Focus manual search box
  const handleFocusManualSearch = () => {
    searchInputRef.current?.focus();
  };

  // Open modal for details
  const handleOpenDetailModal = (center: UnifiedSupportCenter) => {
    // Map UnifiedSupportCenter to RSKLocation for the modal
    const mapped: RSKLocation = {
      id: center.id,
      state: 'Karnataka',
      district: center.district,
      taluk: center.taluk,
      hobli: center.hobli || null,
      office_type: center.type === 'RSK' ? 'RSK' : 'DEPARTMENT_OFFICE',
      name: center.name,
      place: center.place || center.address || '',
      pincode: center.pincode || null,
      phones: center.phones,
      officers: center.officers || [],
      verification_status: 'VERIFIED',
      source_lines: [],
      officer_count: center.officers ? center.officers.length : 0,
    };
    setModalLocation(mapped);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader />

      <View style={styles.container}>
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('nearbyHelp') || 'Agricultural Support & Helplines'}</Text>
          <Text style={styles.subtitle}>
            {t('rskSubtitle') || 'Verified Karnataka RSKs, Agriculture Officers, KVKs & Helplines'}
          </Text>
        </View>

        {/* Tab Selector: Centers & Offices vs Toll-Free Helplines */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'centers' && styles.tabButtonActive]}
            onPress={() => setActiveTab('centers')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'centers' && styles.tabButtonTextActive]}>
              🌾 {t('rskTab') || 'Support Centers & RSKs'} ({supportCenters.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'helplines' && styles.tabButtonActive]}
            onPress={() => setActiveTab('helplines')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabButtonText, activeTab === 'helplines' && styles.tabButtonTextActive]}>
              📞 {t('helplines') || 'Toll-Free Helplines'} (5)
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================================= */}
        {/* TAB 1: SUPPORT CENTERS (GPS-FIRST + OFFLINE MANUAL SEARCH) */}
        {/* ========================================================================= */}
        {activeTab === 'centers' ? (
          <FlatList
            data={supportCenters}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.filterHeaderContainer}>
                {/* 1. GPS DISCOVERY CARD AT TOP */}
                {gpsState === 'IDLE' && (
                  <View style={styles.gpsDiscoveryCard}>
                    <View style={styles.gpsCardHeaderRow}>
                      <Text style={styles.gpsCardIcon}>📍</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.gpsCardTitle}>
                          {t('findSupportNearYou') || 'Find Agriculture Support Near You'}
                        </Text>
                        <Text style={styles.gpsCardSubtitle}>
                          {t('allowLocationPrompt') ||
                            'Allow location access to find the nearest Raita Samparka Kendra, agriculture office, KVK or other available support center.'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.gpsActionButtonsRow}>
                      <TouchableOpacity
                        style={styles.findNearMeBtn}
                        activeOpacity={0.85}
                        onPress={handleFindNearMe}
                      >
                        <Text style={styles.findNearMeBtnText}>
                          📍 {t('findNearMe') || 'Find Near Me'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.searchManuallyBtn}
                        activeOpacity={0.85}
                        onPress={handleFocusManualSearch}
                      >
                        <Text style={styles.searchManuallyBtnText}>
                          🔎 {t('searchManually') || 'Search Manually'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* GPS LOCATING IN PROGRESS */}
                {gpsState === 'LOCATING' && (
                  <View style={styles.gpsStatusCard}>
                    <ActivityIndicator color="#1E6335" size="small" />
                    <Text style={styles.gpsStatusText}>
                      {t('locating') || 'Getting your location to find nearby centers...'}
                    </Text>
                  </View>
                )}

                {/* STATE A: GPS AVAILABLE */}
                {gpsState === 'AVAILABLE' && userCoords && (
                  <View style={styles.gpsAvailableCard}>
                    <View style={styles.gpsAvailableRow}>
                      <Text style={styles.gpsActiveIcon}>🟢</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.gpsAvailableTitle}>
                          {t('supportNearYou') || 'Support Near You'}
                        </Text>
                        <Text style={styles.gpsAvailableSubtitle}>
                          Sorted by distance from your current GPS location
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.clearLocationPill}
                        onPress={handleClearLocation}
                      >
                        <Text style={styles.clearLocationPillText}>
                          ✕ {t('clearLocation') || 'Clear GPS'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* STATE B: GPS PERMISSION DENIED */}
                {gpsState === 'DENIED' && (
                  <View style={styles.gpsDeniedCard}>
                    <View style={styles.gpsDeniedHeaderRow}>
                      <Text style={styles.gpsDeniedIcon}>⚠️</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.gpsDeniedTitle}>
                          {t('locationDeniedTitle') || 'Location access was not allowed.'}
                        </Text>
                        <Text style={styles.gpsDeniedSubtitle}>
                          {t('locationDeniedDesc') ||
                            'You can search for an agriculture support center by district, taluk or Hobli.'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.gpsDeniedActionsRow}>
                      <TouchableOpacity
                        style={styles.gpsRetryBtn}
                        onPress={handleFindNearMe}
                      >
                        <Text style={styles.gpsRetryBtnText}>
                          🔄 {t('tryLocationAgain') || 'Try Location Again'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.gpsManualBtn}
                        onPress={handleFocusManualSearch}
                      >
                        <Text style={styles.gpsManualBtnText}>
                          🔎 {t('searchManually') || 'Search Manually'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* STATE C: GPS UNAVAILABLE / ERROR */}
                {gpsState === 'UNAVAILABLE' && (
                  <View style={styles.gpsDeniedCard}>
                    <View style={styles.gpsDeniedHeaderRow}>
                      <Text style={styles.gpsDeniedIcon}>📡</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.gpsDeniedTitle}>
                          {t('locationUnavailableTitle') || 'Location could not be determined.'}
                        </Text>
                        <Text style={styles.gpsDeniedSubtitle}>
                          {t('locationUnavailableDesc') ||
                            'Please ensure location services are turned on or search manually.'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.gpsDeniedActionsRow}>
                      <TouchableOpacity
                        style={styles.gpsRetryBtn}
                        onPress={handleFindNearMe}
                      >
                        <Text style={styles.gpsRetryBtnText}>
                          🔄 {t('tryLocationAgain') || 'Try Again'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.gpsManualBtn}
                        onPress={handleFocusManualSearch}
                      >
                        <Text style={styles.gpsManualBtnText}>
                          🔎 {t('searchManually') || 'Search Manually'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* 2. MANUAL SEARCH SECTION (ALWAYS AVAILABLE & OFFLINE) */}
                <View style={styles.searchSectionDivider}>
                  <Text style={styles.sectionDividerText}>
                    {gpsState === 'AVAILABLE' ? 'FILTER NEARBY RESULTS' : '🔎 SEARCH MANUALLY'}
                  </Text>
                </View>

                {/* Single Search Input (District, Taluk, Hobli, Name, Pincode) */}
                <View style={styles.searchBar}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder={
                      t('searchRskPlaceholder') ||
                      'Search district, taluk, Hobli, center, or PIN...'
                    }
                    placeholderTextColor="#8A9E8D"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    clearButtonMode="while-editing"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.clearSearchText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* District Filter Chips */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>📍 {t('district') || 'District'}:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {allDistricts.map((dist) => {
                      const isSelected = district === dist;
                      return (
                        <TouchableOpacity
                          key={dist}
                          style={[styles.filterChip, isSelected && styles.filterChipActive]}
                          onPress={() => {
                            setDistrict(dist);
                            setTaluk('All');
                            setHobli('All');
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                            {dist === 'All' ? (t('allDistricts') || 'All (31)') : dist}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Taluk Filter Chips */}
                {availableTaluks.length > 1 && (
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>🏛️ {t('taluk') || 'Taluk'}:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      {availableTaluks.map((tq) => {
                        const isSelected = taluk === tq;
                        return (
                          <TouchableOpacity
                            key={tq}
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() => {
                              setTaluk(tq);
                              setHobli('All');
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                              {tq === 'All' ? (t('allTaluks') || 'All Taluks') : tq}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Hobli Filter Chips */}
                {availableHoblis.length > 1 && (
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>🌾 {t('hobli') || 'Hobli'}:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                      {availableHoblis.map((hb) => {
                        const isSelected = hobli === hb;
                        return (
                          <TouchableOpacity
                            key={hb}
                            style={[styles.filterChip, isSelected && styles.filterChipActive]}
                            onPress={() => setHobli(hb)}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                              {hb === 'All' ? (t('allHoblis') || 'All Hoblis') : hb}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Office Type Tabs */}
                <View style={styles.officeTypeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, officeType === 'ALL' && styles.typeBtnActive]}
                    onPress={() => setOfficeType('ALL')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeBtnText, officeType === 'ALL' && styles.typeBtnTextActive]}>
                      All Offices
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, officeType === 'RSK' && styles.typeBtnActive]}
                    onPress={() => setOfficeType('RSK')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeBtnText, officeType === 'RSK' && styles.typeBtnTextActive]}>
                      🌾 RSKs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, officeType === 'DEPARTMENT_OFFICE' && styles.typeBtnActive]}
                    onPress={() => setOfficeType('DEPARTMENT_OFFICE')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeBtnText, officeType === 'DEPARTMENT_OFFICE' && styles.typeBtnTextActive]}>
                      🏛️ Dept Offices
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeBtn, officeType === 'KVK_CLINIC' && styles.typeBtnActive]}
                    onPress={() => setOfficeType('KVK_CLINIC')}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.typeBtnText, officeType === 'KVK_CLINIC' && styles.typeBtnTextActive]}>
                      🩺 KVK & Clinics
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Results Count Banner */}
                <View style={styles.resultBanner}>
                  <Text style={styles.resultBannerText}>
                    Showing {supportCenters.length} verified locations
                    {district !== 'All' ? ` in ${district}` : ' across Karnataka'}
                    {userCoords ? ' • Sorted by proximity' : ''}
                  </Text>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const isRsk = item.type === 'RSK';
              const isKvk = item.type === 'KVK';
              const hasCoordinates = item.latitude !== null && item.longitude !== null;
              const hasDistance = item.distanceKm !== null && item.distanceKm !== undefined;
              const hasPhone = item.phones && item.phones.length > 0;
              const hasAddressOrCoords = hasCoordinates || item.place || item.address;

              return (
                <View style={styles.card}>
                  {/* Top Row: Name and Badges */}
                  <View style={styles.cardHeader}>
                    <View style={styles.nameWrap}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.locationPath}>
                        📍 {item.district} › {item.taluk}
                      </Text>
                    </View>
                    <View style={styles.badgeColumn}>
                      <View
                        style={[
                          styles.typeBadgeSmall,
                          isRsk ? styles.rskBadge : isKvk ? styles.kvkBadge : styles.deptBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeBadgeSmallText,
                            isRsk ? styles.rskBadgeText : isKvk ? styles.kvkBadgeText : styles.deptBadgeText,
                          ]}
                        >
                          {item.typeLabel}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Distance Indicator (REAL DISTANCE ONLY) */}
                  <View style={styles.distanceRow}>
                    {hasDistance ? (
                      <View style={styles.realDistancePill}>
                        <Text style={styles.realDistancePillText}>
                          🧭 {item.distanceKm} {t('kmAway') || 'km away'}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.distanceUnavailablePill}>
                        <Text style={styles.distanceUnavailablePillText}>
                          📍 {t('distanceUnavailable') || 'Distance unavailable'}
                        </Text>
                      </View>
                    )}
                    {item.isVerified && (
                      <View style={styles.verifiedTag}>
                        <Text style={styles.verifiedTagText}>✓ VERIFIED</Text>
                      </View>
                    )}
                  </View>

                  {/* Hobli */}
                  {item.hobli ? (
                    <View style={styles.hobliPill}>
                      <Text style={styles.hobliPillText}>🌾 Hobli: {item.hobli}</Text>
                    </View>
                  ) : null}

                  {/* Place / Address */}
                  {item.place || item.address ? (
                    <Text style={styles.addressText} numberOfLines={2}>
                      🏢 {item.place || item.address} {item.pincode ? `(${item.pincode})` : ''}
                    </Text>
                  ) : null}

                  {/* Specialization if university / KVK */}
                  {item.specialization ? (
                    <Text style={styles.specializationText} numberOfLines={2}>
                      🔬 {item.specialization}
                    </Text>
                  ) : null}

                  {/* Officers Count */}
                  {item.officers && item.officers.length > 0 && (
                    <View style={styles.officerCountRow}>
                      <Text style={styles.officerCountText}>
                        👥 {item.officers.length} {item.officers.length === 1 ? 'Designated Officer' : 'Designated Officers'}
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons: Call & Directions */}
                  <View style={styles.cardActionsRow}>
                    {/* Call button: ONLY shown if a verified phone number exists */}
                    {hasPhone ? (
                      <TouchableOpacity
                        style={styles.callButtonSmall}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('call') || 'Call'} ${item.phones[0]}`}
                        onPress={() => RSKService.callNumber(item.phones[0])}
                      >
                        <Text style={styles.callButtonTextSmall}>
                          📞 {t('call') || 'Call'} {item.phones[0]}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {/* Directions button: shown if coords or verified address exists */}
                    {hasAddressOrCoords ? (
                      <TouchableOpacity
                        style={styles.directionsBtn}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel={t('directions') || 'Directions'}
                        onPress={() => RSKService.openDirections(item)}
                      >
                        <Text style={styles.directionsText}>
                          🗺️ {t('directions') || 'Directions'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {/* Info / Officers Details */}
                    {item.type !== 'KVK' && item.type !== 'UNIVERSITY_CLINIC' && (
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        activeOpacity={0.85}
                        accessibilityRole="button"
                        accessibilityLabel="Information and officers details"
                        onPress={() => handleOpenDetailModal(item)}
                      >
                        <Text style={styles.detailsBtnText}>ℹ️ Info</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🌾</Text>
                <Text style={styles.emptyTitle}>
                  {gpsState === 'AVAILABLE'
                    ? t('noNearbyCentersTitle') || 'No nearby centers found'
                    : 'No Centers Found'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {gpsState === 'AVAILABLE'
                    ? t('noNearbyCentersDesc') || 'Try searching by district, taluk or Hobli.'
                    : 'No centers match your filter. Try switching to "All Districts" or clearing the search box.'}
                </Text>
                {gpsState === 'AVAILABLE' && (
                  <TouchableOpacity
                    style={styles.emptySearchManuallyBtn}
                    onPress={handleFocusManualSearch}
                  >
                    <Text style={styles.emptySearchManuallyBtnText}>
                      🔎 {t('searchManually') || 'Search Manually'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            ListFooterComponent={<LandscapeBanner />}
          />
        ) : (
          /* ========================================================================= */
          /* TAB 2: TOLL-FREE HELPLINES LIST */
          /* ========================================================================= */
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

                <View style={styles.helplineMetaRow}>
                  <Text style={styles.helplineMetaText}>⏰ {item.hours}</Text>
                  <Text style={styles.helplineMetaText}>🗣️ {item.languages}</Text>
                </View>

                <Text style={styles.helplineDesc}>{item.description}</Text>

                <TouchableOpacity
                  style={styles.callButton}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${item.displayPhone}`}
                  onPress={() => RSKService.callNumber(item.phone)}
                >
                  <Text style={styles.callButtonText}>📞 Call {item.displayPhone}</Text>
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={<LandscapeBanner />}
          />
        )}
      </View>

      {/* RSK Detail Officers Modal */}
      {modalLocation && (
        <RSKDetailModal
          visible={modalVisible}
          location={modalLocation}
          onClose={() => setModalVisible(false)}
        />
      )}
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
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#162836',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#5A6E60',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2EE',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: '#1E6335',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  filterHeaderContainer: {
    marginBottom: 10,
  },
  gpsDiscoveryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#CBE5D3',
    marginBottom: 12,
    shadowColor: '#1E6335',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gpsCardIcon: {
    fontSize: 24,
    marginRight: 10,
    marginTop: 2,
  },
  gpsCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 2,
  },
  gpsCardSubtitle: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  gpsActionButtonsRow: {
    flexDirection: 'row',
  },
  findNearMeBtn: {
    flex: 1.2,
    backgroundColor: '#1E6335',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  findNearMeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  searchManuallyBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  searchManuallyBtnText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },
  gpsStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  gpsStatusText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#1E6335',
    fontWeight: '600',
  },
  gpsAvailableCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  gpsAvailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsActiveIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  gpsAvailableTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  gpsAvailableSubtitle: {
    fontSize: 11.5,
    color: '#047857',
  },
  clearLocationPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  clearLocationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  gpsDeniedCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  gpsDeniedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  gpsDeniedIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  gpsDeniedTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  gpsDeniedSubtitle: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
  gpsDeniedActionsRow: {
    flexDirection: 'row',
  },
  gpsRetryBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  gpsRetryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  gpsManualBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  gpsManualBtnText: {
    color: '#B45309',
    fontWeight: '700',
    fontSize: 12,
  },
  searchSectionDivider: {
    marginVertical: 4,
    marginBottom: 8,
  },
  sectionDividerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  clearSearchText: {
    fontSize: 16,
    color: '#94A3B8',
    padding: 4,
  },
  filterGroup: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1E6335',
    borderColor: '#1E6335',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  officeTypeRow: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeBtnActive: {
    backgroundColor: '#1E6335',
    borderColor: '#1E6335',
  },
  typeBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  resultBanner: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  resultBannerText: {
    fontSize: 11.5,
    color: '#1E6335',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationPath: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badgeColumn: {
    alignItems: 'flex-end',
  },
  typeBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rskBadge: {
    backgroundColor: '#DCFCE7',
  },
  deptBadge: {
    backgroundColor: '#F1F5F9',
  },
  kvkBadge: {
    backgroundColor: '#FEF3C7',
  },
  typeBadgeSmallText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rskBadgeText: {
    color: '#166534',
  },
  deptBadgeText: {
    color: '#334155',
  },
  kvkBadgeText: {
    color: '#92400E',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  realDistancePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  realDistancePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534',
  },
  distanceUnavailablePill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  distanceUnavailablePillText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  verifiedTag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  hobliPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 3,
  },
  hobliPillText: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '600',
  },
  addressText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  specializationText: {
    fontSize: 11.5,
    color: '#0369A1',
    marginTop: 2,
    lineHeight: 15,
  },
  officerCountRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  officerCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  cardActionsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  callButtonSmall: {
    backgroundColor: '#1E6335',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
  },
  callButtonTextSmall: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  directionsBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    justifyContent: 'center',
  },
  directionsText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  detailsBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  detailsBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 12,
  },
  organizationText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  helplineMetaRow: {
    marginVertical: 6,
  },
  helplineMetaText: {
    fontSize: 11.5,
    color: '#475569',
    marginBottom: 2,
  },
  helplineDesc: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 10,
  },
  callButton: {
    backgroundColor: '#1E6335',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptySearchManuallyBtn: {
    marginTop: 14,
    backgroundColor: '#1E6335',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  emptySearchManuallyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
