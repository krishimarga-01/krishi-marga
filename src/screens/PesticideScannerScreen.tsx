import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { GlobalHeader } from '../components/GlobalHeader';
import { useI18n } from '../services/i18n';
import NetInfo from '@react-native-community/netinfo';
import { PesticideService, PesticideScanResult, PesticideScanError } from '../services/pesticideService';
import { UploadHandle } from '../services/httpClient';
import { PesticideDatabaseService, PesticideRecord } from '../services/pesticideDatabaseService';
import { PesticideScannerService } from '../services/pesticideScannerService';
import { VoiceReadoutButton } from '../components/VoiceReadoutButton';
import { VoiceService } from '../services/voiceService';

export const PesticideScannerScreen = ({ navigation, route }: any) => {
  const { t, language } = useI18n();

  // Active Tab: 'SCAN' or 'DIRECTORY'
  const [activeTab, setActiveTab] = useState<'SCAN' | 'DIRECTORY'>('SCAN');

  // Selected crop (optional, from route params or user choice)
  const initialCrop = route?.params?.crop || '';
  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop);

  // Image state (supports front label and optional back label)
  const [images, setImages] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<PesticideScanResult | null>(null);

  // Guards that keep the scanner from getting stuck or firing twice.
  const isScanningRef = useRef(false);
  const isMountedRef = useRef(true);
  const uploadHandleRef = useRef<UploadHandle | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      // Leaving the screen cancels any upload still in flight.
      isMountedRef.current = false;
      if (uploadHandleRef.current) {
        uploadHandleRef.current.cancel();
        uploadHandleRef.current = null;
      }
    };
  }, []);

  // Offline directory search state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedDirectoryItem, setSelectedDirectoryItem] = useState<PesticideRecord | null>(null);

  // Quick crop options for compatibility check
  const QUICK_CROPS = [
    { id: '', label: 'All Crops' },
    { id: 'paddy', label: '🌾 Paddy' },
    { id: 'chilli', label: '🌶️ Chilli' },
    { id: 'tomato', label: '🍅 Tomato' },
    { id: 'cotton', label: '☁️ Cotton' },
    { id: 'maize', label: '🌽 Maize' },
    { id: 'sugarcane', label: '🎋 Sugarcane' },
    { id: 'banana', label: '🍌 Banana' },
  ];

  // Pick image from camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera Permission', 'Camera permission is required to take photos of pesticide labels.');
        return;
      }

      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.85,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImages((prev) => [...prev, res.assets[0].uri].slice(0, 3));
        setScanResult(null);
      }
    } catch (err: any) {
      Alert.alert('Camera Error', err.message || 'Unable to open camera');
    }
  };

  // Pick image from gallery
  const handlePickGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Gallery Permission', 'Gallery permission is required to select photos of pesticide labels.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setImages((prev) => [...prev, res.assets[0].uri].slice(0, 3));
        setScanResult(null);
      }
    } catch (err: any) {
      Alert.alert('Gallery Error', err.message || 'Unable to open photo gallery');
    }
  };

  // Remove an image from the list
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Run the scan
  const handleScan = async () => {
    // Duplicate-tap protection: the ref settles synchronously, unlike state.
    if (isScanningRef.current) {
      return;
    }

    if (images.length === 0) {
      Alert.alert('No Photo', 'Please take or choose a photo of the pesticide label first.');
      return;
    }

    isScanningRef.current = true;
    setIsScanning(true);
    setScanResult(null);

    try {
      // Online label reading needs connectivity; say so plainly instead of
      // waiting for a timeout, and point at the offline directory.
      const net = await NetInfo.fetch();
      const isOnline = !!net.isConnected && net.isInternetReachable !== false;
      if (!isOnline) {
        Alert.alert(
          t('offline') || 'Offline',
          t('photoScanningRequiresInternet') ||
            'Photo label scanning needs an internet connection. The verified directory works offline.',
          [
            { text: 'Search Offline Directory', onPress: () => setActiveTab('DIRECTORY') },
            { text: 'OK', style: 'cancel' },
          ]
        );
        return;
      }

      const result = await PesticideService.scanPesticideLabel({
        imageUris: images,
        language: language || 'en',
        crop: selectedCrop || undefined,
        registerHandle: (handle) => {
          uploadHandleRef.current = handle;
        },
      });

      if (!isMountedRef.current) return;
      setScanResult(result);
    } catch (err: any) {
      if (!isMountedRef.current) return;

      const scanErr = err as PesticideScanError;
      if (scanErr?.caseType === 'ABORTED') return;

      // Genuine server errors are shown, not disguised as connectivity problems.
      const title =
        scanErr?.caseType === 'NOT_CONFIGURED'
          ? 'Scanner Not Configured'
          : scanErr?.caseType === 'TIMEOUT'
          ? 'Scan Took Too Long'
          : scanErr?.caseType === 'SERVER_ERROR'
          ? 'Scanner Server Error'
          : scanErr?.caseType === 'NETWORK_ERROR'
          ? 'Connection Problem'
          : 'Scan Failed';

      const message =
        scanErr?.message ||
        'The label could not be analysed. You can search verified CIBRC medicines in the offline directory.';

      const buttons: any[] = [];
      if (scanErr?.retryable !== false) {
        buttons.push({ text: 'Retry', onPress: () => handleScan() });
      }
      buttons.push({ text: 'Search Offline Directory', onPress: () => setActiveTab('DIRECTORY') });
      buttons.push({ text: 'Close', style: 'cancel' });

      Alert.alert(title, message, buttons);
    } finally {
      // Always clears the loading state, on every path.
      uploadHandleRef.current = null;
      isScanningRef.current = false;
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  };

  // Directory search list
  const directoryItems = PesticideDatabaseService.search(searchQuery, categoryFilter);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <GlobalHeader />

      {/* Header with Back button */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('back') || 'Back'}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>{t('back') || 'Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('pesticideScannerHeader') || 'Pesticide Label Scanner'}</Text>
      </View>

      {/* Tab Selector: Scan Label vs Offline Directory */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'SCAN' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'SCAN' }}
          accessibilityLabel={t('tabScanLabel') || 'Scan Label'}
          onPress={() => setActiveTab('SCAN')}
        >
          <Text style={[styles.tabText, activeTab === 'SCAN' && styles.tabTextActive]}>
            📷 {t('tabScanLabel') || 'Scan Label'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'DIRECTORY' && styles.tabButtonActive]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'DIRECTORY' }}
          accessibilityLabel={`${t('tabDirectory') || 'Verified Directory'} (${PesticideDatabaseService.getAll().length})`}
          onPress={() => setActiveTab('DIRECTORY')}
        >
          <Text style={[styles.tabText, activeTab === 'DIRECTORY' && styles.tabTextActive]}>
            📚 {t('tabDirectory') || 'Verified Directory'} ({PesticideDatabaseService.getAll().length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.scrollContent}>
        {/* ========================================================================= */}
        {/* TAB 1: SCAN LABEL FLOW */}
        {/* ========================================================================= */}
        {activeTab === 'SCAN' && (
          <View>
            {/* Offline notice */}
            <View style={styles.noticeCard}>
              <Text style={styles.noticeIcon}>ℹ️</Text>
              <Text style={styles.noticeText}>
                {t('photoScanningRequiresInternet') ||
                  'Photo label scanning requires an internet connection. The verified directory is fully available offline.'}
              </Text>
            </View>

            {/* Optional Crop Selection */}
            <View style={styles.cropFilterSection}>
              <Text style={styles.cropFilterTitle}>
                {t('selectCropOptional') || 'Select your crop for compatibility check:'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropChipsRow}>
                {QUICK_CROPS.map((c) => {
                  const isSelected = selectedCrop.toLowerCase() === c.id.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.cropChip, isSelected && styles.cropChipSelected]}
                      onPress={() => setSelectedCrop(c.id)}
                    >
                      <Text style={[styles.cropChipText, isSelected && styles.cropChipTextSelected]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Viewfinder / Image Picker Box */}
            {images.length === 0 ? (
              <View style={styles.viewfinderBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                <View style={styles.viewfinderContent}>
                  <Text style={styles.viewfinderEmoji}>🧪</Text>
                  <Text style={styles.viewfinderPrompt}>
                    {t('placeLabelInFrame') || 'Align bottle label & active ingredient inside frame'}
                  </Text>
                  <Text style={styles.viewfinderSubtext}>
                    Clear photo of front brand or back active ingredients table
                  </Text>

                  <View style={styles.captureActionsRow}>
                    <TouchableOpacity
                      style={styles.photoActionBtn}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('takePhoto') || 'Take Photo'}
                      onPress={handleTakePhoto}
                    >
                      <Text style={styles.photoActionBtnText}>📷 {t('takePhoto') || 'Take Photo'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.galleryActionBtn}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('chooseGallery') || 'Gallery'}
                      onPress={handlePickGallery}
                    >
                      <Text style={styles.galleryActionBtnText}>🖼️ {t('chooseGallery') || 'Gallery'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              /* Thumbnails & Action controls */
              <View style={styles.previewContainer}>
                <Text style={styles.previewHeader}>Photos to Scan ({images.length}/3):</Text>
                <View style={styles.previewThumbnailsRow}>
                  {images.map((uri, idx) => (
                    <View key={idx} style={styles.thumbnailWrapper}>
                      <Image source={{ uri }} style={styles.thumbnailImg} />
                      <TouchableOpacity
                        style={styles.removeBadge}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove photo ${idx + 1}`}
                        onPress={() => handleRemoveImage(idx)}
                      >
                        <Text style={styles.removeBadgeText}>✕</Text>
                      </TouchableOpacity>
                      <Text style={styles.thumbnailLabel}>
                        {idx === 0 ? 'Front Label' : idx === 1 ? 'Back / Ingredients' : `Photo ${idx + 1}`}
                      </Text>
                    </View>
                  ))}
                </View>

                {images.length < 3 && (
                  <View style={styles.addMoreRow}>
                    <TouchableOpacity
                      style={styles.addMoreBtn}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Add Back Label"
                      onPress={handleTakePhoto}
                    >
                      <Text style={styles.addMoreBtnText}>📷 Add Back Label</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.addMoreBtnSecondary}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel="Add Photo From Gallery"
                      onPress={handlePickGallery}
                    >
                      <Text style={styles.addMoreBtnSecondaryText}>+ From Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Scan Action Button */}
                <TouchableOpacity
                  style={[styles.scanActionBtn, isScanning && styles.scanActionBtnDisabled]}
                  disabled={isScanning}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={isScanning ? 'Analyzing Label' : (t('scanAndVerify') || 'Scan & Verify Label')}
                  onPress={handleScan}
                >
                  {isScanning ? (
                    <View style={styles.scanningRow}>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.scanActionBtnText}> {t('scanningLabel') || 'Analyzing Label with AI...'}</Text>
                    </View>
                  ) : (
                    <Text style={styles.scanActionBtnText}>🔍 {t('scanAndVerify') || 'Scan & Verify Label'}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retakeAllBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={t('retakePhoto') || 'Clear & Retake'}
                  onPress={() => {
                    setImages([]);
                    setScanResult(null);
                  }}
                >
                  <Text style={styles.retakeAllBtnText}>🔄 {t('retakePhoto') || 'Clear & Retake'}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* SCANNING IN PROGRESS INDICATOR */}
            {isScanning && (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#1E6335" />
                <Text style={styles.loadingTitle}>{t('crossCheckingCibrc') || 'Verifying with CIBRC Database...'}</Text>
                <Text style={styles.loadingSubtitle}>
                  Zero-hallucination verification • Reading active ingredients • Checking formulation
                </Text>
              </View>
            )}

            {/* MULTILINGUAL VOICE READOUT BUTTON */}
            {scanResult && (
              <VoiceReadoutButton
                getTextToSpeak={() =>
                  VoiceService.buildPesticideSpeechSummary(scanResult, language)
                }
                language={language}
              />
            )}

            {/* ================================================================= */}
            {/* SCAN RESULT: UNIDENTIFIED / UNREADABLE */}
            {/* ================================================================= */}
            {scanResult && !scanResult.identified && (
              <View style={styles.unidentifiedCard}>
                <View style={styles.unidentifiedHeaderRow}>
                  <Text style={styles.unidentifiedIcon}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.unidentifiedTitle}>
                      {t('couldNotIdentifyTitle') || 'Product could not be identified confidently'}
                    </Text>
                    <Text style={styles.unidentifiedReason}>
                      {scanResult.user_message ||
                        'The photo does not show a clear agricultural medicine label or sufficient evidence.'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.guidanceHeading}>
                  {t('couldNotIdentifyDesc') || 'Please follow these farmer guidance tips:'}
                </Text>
                {scanResult.guidance.map((tip, idx) => (
                  <View key={idx} style={styles.guidanceRow}>
                    <Text style={styles.guidanceBullet}>•</Text>
                    <Text style={styles.guidanceText}>{tip}</Text>
                  </View>
                ))}

                <View style={styles.unidentifiedActionsRow}>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                      setImages([]);
                      setScanResult(null);
                    }}
                  >
                    <Text style={styles.retryBtnText}>📷 {t('retakePhoto') || 'Retake Clearer Photo'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.browseDirectBtn}
                    onPress={() => setActiveTab('DIRECTORY')}
                  >
                    <Text style={styles.browseDirectBtnText}>📚 {t('browseDirectory') || 'Search Database'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ================================================================= */}
            {/* SCAN RESULT: VERIFIED IDENTIFIED PRODUCT */}
            {/* ================================================================= */}
            {scanResult && scanResult.identified && (
              <View style={styles.resultCard}>
                {/* Banned Alert or Verified Badge */}
                {scanResult.is_banned ? (
                  <View style={styles.bannedBanner}>
                    <Text style={styles.bannedIcon}>⛔</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bannedTitle}>
                        {t('bannedMedicineWarning') || 'STRICT WARNING: BANNED CHEMICAL'}
                      </Text>
                      <Text style={styles.bannedSub}>
                        This chemical is strictly banned or prohibited in India. Do not purchase or spray.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.verifiedBadgeRow}>
                    <View style={styles.verifiedPill}>
                      <Text style={styles.verifiedPillText}>✓ {t('verifiedMedicine') || 'CIBRC Verified Medicine'}</Text>
                    </View>
                    <Text style={styles.confidenceText}>
                      Confidence: {Math.round((scanResult.confidence || 0.9) * 100)}%
                    </Text>
                  </View>
                )}

                {/* Product Name & Brand */}
                <Text style={styles.productName}>{scanResult.product_name}</Text>
                {scanResult.manufacturer && (
                  <Text style={styles.manufacturerName}>Manufactured / Marketed by: {scanResult.manufacturer}</Text>
                )}

                {/* Crop Compatibility Card (If crop was selected) */}
                {scanResult.crop_compatibility && (
                  <View
                    style={[
                      styles.compatibilityCard,
                      scanResult.crop_compatibility.is_suitable
                        ? styles.compatGreen
                        : styles.compatYellow,
                    ]}
                  >
                    <Text style={styles.compatIcon}>
                      {scanResult.crop_compatibility.is_suitable ? '✅' : '⚠️'}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compatTitle}>
                        {scanResult.crop_compatibility.is_suitable
                          ? t('approvedForYourCrop') || `Verified for ${selectedCrop.toUpperCase()}`
                          : t('notApprovedForYourCrop') || `Caution: Not registered for ${selectedCrop.toUpperCase()}`}
                      </Text>
                      <Text style={styles.compatNote}>{scanResult.crop_compatibility.note}</Text>
                    </View>
                  </View>
                )}

                {/* PESTICIDE INTENDED USE & EXPLANATION CARD */}
                <View style={styles.intendedUseCard}>
                  <View style={styles.intendedUseHeaderRow}>
                    <Text style={styles.intendedUseIcon}>📋</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.intendedUseTitle}>
                        {t('pesticideIntendedUseTitle') || 'Pesticide Intended Use & Explanation'}
                      </Text>
                      <Text style={styles.intendedUseSubtitle}>
                        {scanResult.category || 'Agricultural Crop Protection Chemical'}
                      </Text>
                    </View>
                  </View>

                  {/* 1. Primary Intended Use */}
                  <View style={styles.intendedUseRow}>
                    <Text style={styles.intendedUseKey}>🎯 {t('intendedUseFieldTitle') || 'Intended Use'}:</Text>
                    <Text style={styles.intendedUseVal}>
                      {scanResult.target_pests && scanResult.target_pests.length > 0 && scanResult.suitable_crops && scanResult.suitable_crops.length > 0
                        ? `Used to control ${scanResult.target_pests.join(', ')} in ${scanResult.suitable_crops.join(', ')}.`
                        : scanResult.general_use || scanResult.why_farmers_use_it || 'Formulated for registered agricultural target pest and disease management.'}
                    </Text>
                  </View>

                  {/* 2. Active Ingredient & Concentration */}
                  <View style={styles.intendedUseRow}>
                    <Text style={styles.intendedUseKey}>🧪 {t('activeIngredientFieldTitle') || 'Active Ingredient'}:</Text>
                    <Text style={styles.intendedUseVal}>
                      {scanResult.active_ingredient || 'As stated on container'} {scanResult.formulation ? `(${scanResult.formulation})` : ''}
                    </Text>
                  </View>

                  {/* 3. Application & Dosage */}
                  <View style={styles.intendedUseRow}>
                    <Text style={styles.intendedUseKey}>⚖️ {t('appAndDosageFieldTitle') || 'Application & Dosage'}:</Text>
                    <Text style={styles.intendedUseVal}>
                      {scanResult.localRecord?.dosage_guidance || scanResult.dosage_notice}
                    </Text>
                  </View>

                  {/* 4. Safety Precautions & Waiting Period (PHI) */}
                  <View style={styles.intendedUseRow}>
                    <Text style={styles.intendedUseKey}>🛡️ {t('safetyAndPhiFieldTitle') || 'Safety & Waiting Period (PHI)'}:</Text>
                    <Text style={styles.intendedUseVal}>
                      {scanResult.safety_guidance && scanResult.safety_guidance.length > 0
                        ? `${scanResult.safety_guidance.slice(0, 2).join('. ')}. Always observe label pre-harvest waiting interval (PHI) before harvesting.`
                        : 'Wear protective gear during handling. Observe label pre-harvest waiting interval (PHI) before harvesting.'}
                    </Text>
                  </View>
                </View>

                {/* 15-Litre Sprayer Tank Dosage Calculation Card */}
                {scanResult.localRecord && (
                  <View style={styles.tankCard}>
                    <View style={styles.tankHeaderRow}>
                      <Text style={styles.tankIcon}>🪣</Text>
                      <Text style={styles.tankTitle}>{t('sprayerTankCalculation') || '15L Knapsack Tank Calculation'}</Text>
                    </View>
                    {(() => {
                      const tank = PesticideScannerService.calculateTankDosage(scanResult.localRecord!);
                      return (
                        <View style={styles.tankBody}>
                          <Text style={styles.tankAmountText}>• {t('sprayerTank15l') || 'Dosage'}: {tank.amountText}</Text>
                          <Text style={styles.tankWaterText}>• {t('cleanWaterMixInstruction') || 'Water'}: {tank.waterText}</Text>
                          <Text style={styles.tankSafetyText}>• {t('wearProtectiveGearNotice') || 'Safety'}: {tank.safetyNote}</Text>
                        </View>
                      );
                    })()}
                  </View>
                )}

                {/* 2x2 Specs Grid */}
                <View style={styles.specsGrid}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>{t('activeIngredientLabel') || 'Active Ingredient'}</Text>
                    <Text style={styles.specValue}>{scanResult.active_ingredient || 'N/A'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>{t('formulationLabel') || 'Formulation'}</Text>
                    <Text style={styles.specValue}>{scanResult.formulation || 'Standard'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>{t('categoryLabel') || 'Category'}</Text>
                    <Text style={styles.specValue}>{scanResult.category || 'Agricultural Chemical'}</Text>
                  </View>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>{t('toxicityTriangleLabel') || 'Toxicity Triangle'}</Text>
                    <Text style={styles.specValue}>
                      {scanResult.localRecord?.toxicity_triangle || 'See Label'}
                    </Text>
                  </View>
                </View>

                {/* What it is */}
                {scanResult.what_it_is ? (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>ℹ️ {t('whatItIs') || 'What This Medicine Is'}:</Text>
                    <Text style={styles.sectionBody}>{scanResult.what_it_is}</Text>
                  </View>
                ) : null}

                {/* Why farmers use it */}
                {scanResult.why_farmers_use_it ? (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>🌾 {t('whyFarmersUseIt') || 'Why Farmers Use This'}:</Text>
                    <Text style={styles.sectionBody}>{scanResult.why_farmers_use_it}</Text>
                  </View>
                ) : null}

                {/* Target pests & diseases */}
                {scanResult.target_pests && scanResult.target_pests.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>🎯 {t('targetPestsLabel') || 'Target Pests & Diseases'}:</Text>
                    <View style={styles.chipsContainer}>
                      {scanResult.target_pests.map((pest, pIdx) => (
                        <View key={pIdx} style={styles.pestChip}>
                          <Text style={styles.pestChipText}>{pest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Suitable crops */}
                {scanResult.suitable_crops && scanResult.suitable_crops.length > 0 && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>🌱 {t('suitableCropsLabel') || 'Registered Crops'}:</Text>
                    <View style={styles.chipsContainer}>
                      {scanResult.suitable_crops.map((crp, cIdx) => (
                        <View key={cIdx} style={styles.cropBadgeChip}>
                          <Text style={styles.cropBadgeChipText}>{crp}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Safety & Precautions */}
                {scanResult.safety_guidance && scanResult.safety_guidance.length > 0 && (
                  <View style={styles.safetyCard}>
                    <Text style={styles.safetyTitle}>🛡️ {t('safetyPrecautions') || 'Safety & Precautions'}:</Text>
                    {scanResult.safety_guidance.map((sec, sIdx) => (
                      <View key={sIdx} style={styles.safetyRow}>
                        <Text style={styles.safetyBullet}>•</Text>
                        <Text style={styles.safetyText}>{sec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Mandatory Dosage Caution (Zero Dosage Invention) */}
                <View style={styles.dosageCard}>
                  <Text style={styles.dosageIcon}>⚖️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dosageTitle}>Dosage Guidance Notice:</Text>
                    <Text style={styles.dosageText}>{scanResult.dosage_notice}</Text>
                  </View>
                </View>

                {/* Scan Another Button */}
                <TouchableOpacity
                  style={styles.scanAnotherBtn}
                  onPress={() => {
                    setImages([]);
                    setScanResult(null);
                  }}
                >
                  <Text style={styles.scanAnotherBtnText}>📷 Scan Another Bottle / Sachet</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: OFFLINE DIRECTORY (17+ CIBRC VERIFIED CHEMICALS) */}
        {/* ========================================================================= */}
        {activeTab === 'DIRECTORY' && (
          <View>
            <View style={styles.directoryHeaderBox}>
              <Text style={styles.directoryHeading}>
                {t('offlineDirectoryTitle') || 'Offline Pesticide Directory'}
              </Text>
              <Text style={styles.directorySubheading}>
                {t('offlineDirectorySubtitle') ||
                  'Instant search of CIBRC verified insecticides, fungicides, and biocontrols'}
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchBarWrap}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t('searchPesticidePlaceholder') || 'Search brand, chemical, or crop...'}
                placeholderTextColor="#78909C"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catTabsRow}>
              {[
                { id: 'ALL', label: 'All (17)' },
                { id: 'INSECTICIDE', label: '🐛 Insecticides' },
                { id: 'FUNGICIDE', label: '🍄 Fungicides' },
                { id: 'HERBICIDE', label: '🌿 Herbicides' },
                { id: 'BIO', label: '🍃 Biocontrol' },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.catTab, categoryFilter === tab.id && styles.catTabActive]}
                  onPress={() => setCategoryFilter(tab.id)}
                >
                  <Text style={[styles.catTabText, categoryFilter === tab.id && styles.catTabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Directory Cards */}
            {directoryItems.map((item) => {
              const isSelected = selectedDirectoryItem?.id === item.id;
              return (
                <View key={item.id} style={styles.dirCard}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedDirectoryItem(isSelected ? null : item)}
                  >
                    <View style={styles.dirCardTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dirCardTitle}>{item.canonical_name}</Text>
                        <Text style={styles.dirCardBrands}>
                          Brands: {item.common_brands.join(', ')}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.catBadge,
                          item.category.includes('INSECTICIDE')
                            ? styles.badgeRed
                            : item.category.includes('FUNGICIDE')
                            ? styles.badgeBlue
                            : styles.badgeGreen,
                        ]}
                      >
                        <Text style={styles.catBadgeText}>{item.category.split(' ')[0]}</Text>
                      </View>
                    </View>

                    <View style={styles.dirCardMetaRow}>
                      <Text style={styles.dirMetaPill}>🧪 {item.active_ingredient}</Text>
                      <Text style={styles.dirMetaPill}>📦 {item.formulation}</Text>
                      {item.is_banned && <Text style={styles.dirBannedPill}>⛔ BANNED</Text>}
                    </View>

                    <Text style={styles.dirCropsText}>
                      Suitable for: {item.suitable_crops.slice(0, 5).join(', ')}
                      {item.suitable_crops.length > 5 ? ` +${item.suitable_crops.length - 5} more` : ''}
                    </Text>

                    <Text style={styles.expandPrompt}>
                      {isSelected ? '▲ Tap to collapse details' : '▼ Tap to view full label & safety details'}
                    </Text>
                  </TouchableOpacity>

                  {/* Expanded Details */}
                  {isSelected && (
                    <View style={styles.dirDetailsExpanded}>
                      <View style={styles.divider} />
                      <Text style={styles.detailHeading}>About This Chemical:</Text>
                      <Text style={styles.detailBody}>{item.farmer_explanation}</Text>

                      <Text style={styles.detailHeading}>Why Farmers Use It:</Text>
                      <Text style={styles.detailBody}>{item.why_farmers_use_it}</Text>

                      <Text style={styles.detailHeading}>Toxicity & Safety:</Text>
                      <Text style={styles.detailBody}>Triangle: {item.toxicity_triangle}</Text>
                      {item.safety_precautions.map((p, idx) => (
                        <Text key={idx} style={styles.safetyBulletText}>
                          • {p}
                        </Text>
                      ))}

                      <Text style={styles.detailHeading}>Dosage Guidance:</Text>
                      <Text style={styles.detailBody}>{item.dosage_guidance}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {directoryItems.length === 0 && (
              <View style={styles.emptySearchBox}>
                <Text style={styles.emptySearchEmoji}>🔍</Text>
                <Text style={styles.emptySearchText}>No medicines match '{searchQuery}'</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDE9',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
    marginRight: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#162836',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2EE',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
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
  tabText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1E6335',
    fontWeight: '800',
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  noticeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    color: '#1E40AF',
    lineHeight: 18,
  },
  cropFilterSection: {
    marginBottom: 14,
  },
  cropFilterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  cropChipsRow: {
    flexDirection: 'row',
  },
  cropChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cropChipSelected: {
    backgroundColor: '#E2F4E7',
    borderColor: '#1E6335',
  },
  cropChipText: {
    fontSize: 12.5,
    color: '#475569',
    fontWeight: '600',
  },
  cropChipTextSelected: {
    color: '#1E6335',
    fontWeight: '800',
  },
  viewfinderBox: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    height: 280,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#4ADE80',
  },
  topLeft: {
    top: 14,
    left: 14,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 14,
    right: 14,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  viewfinderContent: {
    alignItems: 'center',
  },
  viewfinderEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  viewfinderPrompt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  viewfinderSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 18,
  },
  captureActionsRow: {
    flexDirection: 'row',
  },
  photoActionBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 10,
  },
  photoActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  galleryActionBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  galleryActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  previewThumbnailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbnailWrapper: {
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
  },
  thumbnailImg: {
    width: 80,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  thumbnailLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  addMoreRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  addMoreBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  addMoreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
  },
  addMoreBtnSecondary: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  addMoreBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  scanActionBtn: {
    backgroundColor: '#1E6335',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scanActionBtnDisabled: {
    backgroundColor: '#8CB89A',
  },
  scanActionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeAllBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  retakeAllBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  unidentifiedCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  unidentifiedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unidentifiedIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  unidentifiedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  unidentifiedReason: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  guidanceHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  guidanceRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  guidanceBullet: {
    fontSize: 14,
    color: '#D97706',
    marginRight: 6,
  },
  guidanceText: {
    flex: 1,
    fontSize: 12.5,
    color: '#451A03',
    lineHeight: 18,
  },
  unidentifiedActionsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  retryBtn: {
    flex: 1,
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  browseDirectBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  browseDirectBtnText: {
    color: '#D97706',
    fontWeight: '700',
    fontSize: 12.5,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bannedBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 12,
  },
  bannedIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  bannedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#991B1B',
  },
  bannedSub: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  verifiedBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#166534',
  },
  confidenceText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  productName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  manufacturerName: {
    fontSize: 12.5,
    color: '#475569',
    marginBottom: 12,
  },
  compatibilityCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  compatGreen: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  compatYellow: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  compatIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  compatTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  compatNote: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  specBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  specValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoSection: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  pestChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  pestChipText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  cropBadgeChip: {
    backgroundColor: '#E2F4E7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  cropBadgeChipText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  safetyCard: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9A3412',
    marginBottom: 6,
  },
  safetyRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  safetyBullet: {
    fontSize: 14,
    color: '#EA580C',
    marginRight: 6,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    color: '#7C2D12',
    lineHeight: 16,
  },
  dosageCard: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  dosageIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  dosageTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  dosageText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  scanAnotherBtn: {
    backgroundColor: '#1E6335',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanAnotherBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  directoryHeaderBox: {
    marginBottom: 12,
  },
  directoryHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#162836',
  },
  directorySubheading: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  searchBarWrap: {
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
    fontSize: 13.5,
    color: '#1E293B',
  },
  clearSearch: {
    fontSize: 16,
    color: '#94A3B8',
    padding: 4,
  },
  catTabsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  catTab: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catTabActive: {
    backgroundColor: '#1E6335',
    borderColor: '#1E6335',
  },
  catTabText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  catTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dirCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dirCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  dirCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dirCardBrands: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  badgeBlue: {
    backgroundColor: '#E0F2FE',
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  dirCardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 6,
  },
  dirMetaPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 11,
    color: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 4,
  },
  dirBannedPill: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dirCropsText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  expandPrompt: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 8,
  },
  dirDetailsExpanded: {
    marginTop: 8,
  },
  detailHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 6,
    marginBottom: 2,
  },
  detailBody: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  safetyBulletText: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginLeft: 4,
  },
  emptySearchBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#64748B',
  },
  intendedUseCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  intendedUseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DCFCE7',
    paddingBottom: 8,
  },
  intendedUseIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  intendedUseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  intendedUseSubtitle: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  intendedUseRow: {
    marginBottom: 8,
  },
  intendedUseKey: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#14532D',
    marginBottom: 2,
  },
  intendedUseVal: {
    fontSize: 12.5,
    color: '#1E293B',
    lineHeight: 18,
  },
  tankCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  tankHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tankIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tankTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E40AF',
  },
  tankBody: {
    paddingLeft: 4,
  },
  tankAmountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  tankWaterText: {
    fontSize: 12,
    color: '#1E40AF',
    marginBottom: 4,
  },
  tankSafetyText: {
    fontSize: 11.5,
    color: '#475569',
    fontStyle: 'italic',
  },
});
