import React, { useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { DiagnosisApi, DiagnosisApiError } from '../services/diagnosisApi';
import { OnnxEngine } from '../offline/onnxEngine';
import { CaseStorage } from '../storage/caseStorage';
import { ImageQualityService } from '../services/imageQualityService';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';

export const CameraCaptureScreen = ({ route, navigation }: any) => {
  const { crop, cropDisplayName } = route.params;
  const { t, language } = useI18n();

  const [images, setImages] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lowQualityNotice, setLowQualityNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }, [])
  );


  const handleTakePhoto = async () => {
    if (images.length >= 10) {
      Alert.alert(t('captureTitle'), t('maxPhotosAlert'));
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('cameraPermissionTitle'), t('cameraPermissionDesc'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.65,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const updated = [...images, result.assets[0].uri];
      setImages(updated);
      const quality = await ImageQualityService.inspectBatch(updated);
      setLowQualityNotice(quality.hasLowQualityWarning ? t('photoQualityLowWarning') : null);
    }
  };

  const handleChooseGallery = async () => {
    if (images.length >= 10) {
      Alert.alert(t('captureTitle'), t('maxPhotosAlert'));
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('galleryPermissionTitle'), t('galleryPermissionDesc'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 10 - images.length,
      quality: 0.65,
    });
    if (!result.canceled && result.assets) {
      const newUris = result.assets.map((a) => a.uri);
      const updated = [...images, ...newUris].slice(0, 10);
      setImages(updated);
      const quality = await ImageQualityService.inspectBatch(updated);
      setLowQualityNotice(quality.hasLowQualityWarning ? t('photoQualityLowWarning') : null);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    if (updated.length > 0) {
      const quality = await ImageQualityService.inspectBatch(updated);
      setLowQualityNotice(quality.hasLowQualityWarning ? t('photoQualityLowWarning') : null);
    } else {
      setLowQualityNotice(null);
    }
  };

  const handleToggleLocation = async () => {
    if (locationCoords) {
      setLocationCoords(null);
      return;
    }
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('locationOptionalTitle'), t('locationDisabled'));
        setIsLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocationCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (e) {
      console.log('Location error ignored:', e);
    } finally {
      setIsLocating(false);
    }
  };

  const handleStartDiagnosis = async () => {
    if (isSubmittingRef.current || isSubmitting) {
      return;
    }
    if (images.length === 0) {
      Alert.alert(t('captureTitle'), `${t('atLeastOnePhotoAlert')} (${cropDisplayName})`);
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // 1. Image Quality Sanity Check before upload
      const qualityAssessment = await ImageQualityService.inspectBatch(images);
      
      // Reject ONLY truly unusable photos (<120px or <4KB)
      if (!qualityAssessment.allUsable) {
        Alert.alert(t('photoUnusableTitle'), t('photoUnusableError'));
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // If usable but low-quality (240p/360p, WhatsApp compressed, poor lighting), set farmer advisory
      if (qualityAssessment.hasLowQualityWarning) {
        setLowQualityNotice(t('photoQualityLowWarning'));
      }

      // Navigate to dedicated AnalyzingScreen (Reference 1)
      navigation.navigate('Analyzing', {
        crop,
        imageUris: images,
        language,
        symptoms,
        latitude: locationCoords?.latitude,
        longitude: locationCoords?.longitude,
        cropDisplayName,
      });
    } catch (err) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader />
      <ScrollView contentContainerStyle={styles.container}>
          {/* Header Banner */}
          <View style={styles.cropBanner}>
            <Text style={styles.cropBannerTitle}>{t('selectedCropLabel')}: <Text style={styles.cropHighlight}>{cropDisplayName}</Text></Text>
            <Text style={styles.cropBannerDesc}>{t('cropRuleNotice')}</Text>
          </View>

          {/* Helpful Photo Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 {t('helpfulPhotoAngles')}</Text>
            <View style={styles.tipsRow}>
              <Text style={styles.tipPill}>🌱 {t('angleWholePlant')}</Text>
              <Text style={styles.tipPill}>🍃 {t('angleLeafFront')}</Text>
              <Text style={styles.tipPill}>🍂 {t('angleLeafBack')}</Text>
              <Text style={styles.tipPill}>🎋 {t('angleStem')}</Text>
              <Text style={styles.tipPill}>🍎 {t('angleFruit')}</Text>
            </View>
          </View>

          {/* Action Buttons: Take Photo & Gallery */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cameraBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('takePhoto')}
              onPress={handleTakePhoto}
            >
              <Text style={styles.btnEmoji}>📷</Text>
              <Text style={styles.cameraBtnText}>{t('takePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.galleryBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('chooseGallery')}
              onPress={handleChooseGallery}
            >
              <Text style={styles.btnEmoji}>🖼️</Text>
              <Text style={styles.galleryBtnText}>{t('chooseGallery')}</Text>
            </TouchableOpacity>
          </View>

          {/* Image Counter */}
          <View style={styles.counterRow}>
            <Text style={styles.counterText}>{t('photosAdded')}: <Text style={styles.counterBold}>({images.length}/10)</Text></Text>
            <Text style={styles.counterNotice}>{t('photoRangeNotice')}</Text>
          </View>

          {/* Thumbnail Gallery with Individual Remove */}
          {images.length > 0 && (
            <ScrollView horizontal style={styles.thumbScroll} showsHorizontalScrollIndicator={false}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove photo ${idx + 1}`}
                    onPress={() => handleRemoveImage(idx)}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.thumbIndex}>#{idx + 1}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Optional Symptoms */}
          <View style={styles.cardInput}>
            <Text style={styles.cardLabel}>{t('optionalSymptomsTitle')}</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={3}
              placeholder={t('optionalSymptomsPlaceholder')}
              placeholderTextColor="#718096"
              value={symptoms}
              onChangeText={setSymptoms}
            />
          </View>

          {/* Optional Location */}
          <TouchableOpacity
            style={styles.locationCard}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('optionalLocationTitle')}
            onPress={handleToggleLocation}
          >
            <Text style={styles.locEmoji}>📍</Text>
            <View style={styles.locTextWrap}>
              <Text style={styles.locTitle}>{t('optionalLocationTitle')}</Text>
              <Text style={styles.locSubtitle}>{locationCoords ? t('locationEnabled') : t('locationDisabled')}</Text>
            </View>
            <Text style={styles.locStatusBtn}>{locationCoords ? t('locationAttached') : t('attachGps')}</Text>
          </TouchableOpacity>

          {/* Low Quality Farmer Advisory Banner */}
          {lowQualityNotice && (
            <View style={styles.advisoryBanner}>
              <Text style={styles.advisoryEmoji}>⚠️</Text>
              <Text style={styles.advisoryText}>{lowQualityNotice}</Text>
            </View>
          )}

          {/* Analyze Button */}
          <TouchableOpacity
            style={[styles.analyzeBtn, (images.length === 0 || isSubmitting) && styles.disabledBtn]}
            disabled={images.length === 0 || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel={isSubmitting ? 'Starting Analysis' : `${t('startDiagnosis')} (${images.length})`}
            onPress={handleStartDiagnosis}
          >
            <Text style={styles.analyzeBtnText}>
              {isSubmitting ? 'Starting Analysis...' : `${t('startDiagnosis')} (${images.length})`}
            </Text>
          </TouchableOpacity>
          <LandscapeBanner />
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 18 },
  cropBanner: { backgroundColor: Colors.primarySoft, padding: 14, borderRadius: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  cropBannerTitle: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  cropHighlight: { fontWeight: '800', color: Colors.primaryDark },
  cropBannerDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  tipsCard: { backgroundColor: Colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 14 },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  tipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  tipPill: { backgroundColor: Colors.earthBeige, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 8, marginBottom: 6, fontSize: 12, color: Colors.textSecondary },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  cameraBtn: { flex: 0.48, backgroundColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center', elevation: 2 },
  galleryBtn: { flex: 0.48, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnEmoji: { fontSize: 26, marginBottom: 4 },
  cameraBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  galleryBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  counterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  counterText: { fontSize: 15, color: Colors.textPrimary },
  counterBold: { fontWeight: '800', color: Colors.primary },
  counterNotice: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  thumbScroll: { flexDirection: 'row', marginVertical: 10 },
  thumbWrap: { position: 'relative', marginRight: 12, alignItems: 'center' },
  thumb: { width: 85, height: 85, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.danger, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  removeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  thumbIndex: { fontSize: 11, color: '#4B5563', marginTop: 3, fontWeight: '600' },
  cardInput: { backgroundColor: Colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginVertical: 12 },
  cardLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  textInput: { minHeight: 60, fontSize: 15, color: Colors.textPrimary, textAlignVertical: 'top' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 18 },
  locEmoji: { fontSize: 24, marginRight: 12 },
  locTextWrap: { flex: 1 },
  locTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  locSubtitle: { fontSize: 12, color: '#4B5563', marginTop: 2 },
  locStatusBtn: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  advisoryBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  advisoryEmoji: { fontSize: 20, marginRight: 10 },
  advisoryText: { fontSize: 13, color: '#92400E', fontWeight: '600', flex: 1, lineHeight: 18 },
  analyzeBtn: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 3 },
  disabledBtn: { backgroundColor: Colors.cardBorder },
  analyzeBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  analyzingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  pulseCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  pulseEmoji: { fontSize: 42 },
  spinner: { marginBottom: 16 },
  analyzingTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  analyzingSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
});