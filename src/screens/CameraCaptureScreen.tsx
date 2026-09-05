import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { DiagnosisApi } from '../services/diagnosisApi';
import { OnnxEngine } from '../offline/onnxEngine';
import { CaseStorage } from '../storage/caseStorage';

export const CameraCaptureScreen = ({ route, navigation }: any) => {
  const { crop, cropDisplayName } = route.params;
  const { t, language } = useI18n();

  const [images, setImages] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTakePhoto = async () => {
    if (images.length >= 10) {
      Alert.alert(t('captureTitle'), 'Maximum 10 photos allowed per crop.');
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera Permission', 'Camera access is required to take crop photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleChooseGallery = async () => {
    if (images.length >= 10) {
      Alert.alert(t('captureTitle'), 'Maximum 10 photos allowed.');
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Gallery Permission', 'Gallery access is required to choose photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      selectionLimit: 10 - images.length,
      quality: 0.85,
    });
    if (!result.canceled && result.assets) {
      const newUris = result.assets.map((a) => a.uri);
      setImages([...images, ...newUris].slice(0, 10));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
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
        Alert.alert('Location Permission', 'Farm location is optional. Diagnosis continues normally.');
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
    if (images.length === 0) {
      Alert.alert(t('captureTitle'), 'Please add at least 1 photo of ' + cropDisplayName + ' leaf/plant.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const net = await NetInfo.fetch();
      const isOnline = net.isConnected && net.isInternetReachable !== false;

      let finalResult;
      if (isOnline) {
        try {
          finalResult = await DiagnosisApi.detectDiseaseOnline({
            crop,
            imageUris: images,
            language,
            symptoms,
            latitude: locationCoords?.latitude,
            longitude: locationCoords?.longitude,
          });
        } catch (apiError) {
          console.log('Online diagnosis failed, trying offline engine:', apiError);
          if (OnnxEngine.isModelAvailable()) {
            finalResult = await OnnxEngine.runInference(crop, images);
          } else {
            throw apiError;
          }
        }
      } else {
        if (!OnnxEngine.isModelAvailable()) {
          Alert.alert(
            t('offlineNotice'),
            t('offlineModelUnavailable')
          );
          setIsAnalyzing(false);
          return;
        }
        finalResult = await OnnxEngine.runInference(crop, images);
      }

      const caseRecord = {
        caseId: 'case_' + Date.now(),
        crop,
        imageUris: images,
        imageCount: images.length,
        timestamp: new Date().toISOString(),
        symptoms,
        latitude: locationCoords?.latitude,
        longitude: locationCoords?.longitude,
        language,
        result: finalResult,
        syncStatus: 'synced' as const,
      };
      await CaseStorage.saveCase(caseRecord);

      setIsAnalyzing(false);
      navigation.navigate('Result', {
        result: finalResult,
        crop: cropDisplayName,
        imageUris: images,
      });
    } catch (err: any) {
      setIsAnalyzing(false);
      Alert.alert(
        t('serverUnavailable'),
        'Could not complete online analysis. Please verify your n8n server is active or try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isAnalyzing ? (
        <View style={styles.analyzingContainer}>
          <View style={styles.pulseCircle}>
            <Text style={styles.pulseEmoji}>🌿</Text>
          </View>
          <ActivityIndicator size='large' color={Colors.primary} style={styles.spinner} />
          <Text style={styles.analyzingTitle}>Analyzing your crop...</Text>
          <Text style={styles.analyzingSubtitle}>Examining leaf surface, discoloration, and spots</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header Banner */}
          <View style={styles.cropBanner}>
            <Text style={styles.cropBannerTitle}>Selected Crop: <Text style={styles.cropHighlight}>{cropDisplayName}</Text></Text>
            <Text style={styles.cropBannerDesc}>Rule: All images must be of this same crop.</Text>
          </View>

          {/* Helpful Photo Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Helpful Photo Angles</Text>
            <View style={styles.tipsRow}>
              <Text style={styles.tipPill}>🌱 Whole plant</Text>
              <Text style={styles.tipPill}>🍃 Leaf front</Text>
              <Text style={styles.tipPill}>🍂 Leaf back</Text>
              <Text style={styles.tipPill}>🎋 Stem</Text>
              <Text style={styles.tipPill}>🍎 Fruit</Text>
            </View>
          </View>

          {/* Action Buttons: Take Photo & Gallery */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.85} onPress={handleTakePhoto}>
              <Text style={styles.btnEmoji}>📷</Text>
              <Text style={styles.cameraBtnText}>{t('takePhoto')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryBtn} activeOpacity={0.85} onPress={handleChooseGallery}>
              <Text style={styles.btnEmoji}>🖼️</Text>
              <Text style={styles.galleryBtnText}>{t('chooseGallery')}</Text>
            </TouchableOpacity>
          </View>

          {/* Image Counter */}
          <View style={styles.counterRow}>
            <Text style={styles.counterText}>Photos Added: <Text style={styles.counterBold}>({images.length}/10)</Text></Text>
            <Text style={styles.counterNotice}>1 minimum, 10 maximum</Text>
          </View>

          {/* Thumbnail Gallery with Individual Remove */}
          {images.length > 0 && (
            <ScrollView horizontal style={styles.thumbScroll} showsHorizontalScrollIndicator={false}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveImage(idx)}>
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
              placeholderTextColor={Colors.textMuted}
              value={symptoms}
              onChangeText={setSymptoms}
            />
          </View>

          {/* Optional Location */}
          <TouchableOpacity style={styles.locationCard} activeOpacity={0.8} onPress={handleToggleLocation}>
            <Text style={styles.locEmoji}>📍</Text>
            <View style={styles.locTextWrap}>
              <Text style={styles.locTitle}>{t('optionalLocationTitle')}</Text>
              <Text style={styles.locSubtitle}>{locationCoords ? t('locationEnabled') : t('locationDisabled')}</Text>
            </View>
            <Text style={styles.locStatusBtn}>{locationCoords ? 'Attached ✓' : 'Attach GPS'}</Text>
          </TouchableOpacity>

          {/* Analyze Button */}
          <TouchableOpacity
            style={[styles.analyzeBtn, images.length === 0 && styles.disabledBtn]}
            disabled={images.length === 0}
            onPress={handleStartDiagnosis}
          >
            <Text style={styles.analyzeBtnText}>Analyze Crop ({images.length})</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  counterNotice: { fontSize: 12, color: Colors.textMuted },
  thumbScroll: { flexDirection: 'row', marginVertical: 10 },
  thumbWrap: { position: 'relative', marginRight: 12, alignItems: 'center' },
  thumb: { width: 85, height: 85, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder },
  removeBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.danger, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  thumbIndex: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  cardInput: { backgroundColor: Colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginVertical: 12 },
  cardLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  textInput: { minHeight: 60, fontSize: 15, color: Colors.textPrimary, textAlignVertical: 'top' },
  locationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 18 },
  locEmoji: { fontSize: 24, marginRight: 12 },
  locTextWrap: { flex: 1 },
  locTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  locSubtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  locStatusBtn: { fontSize: 13, fontWeight: '700', color: Colors.primary },
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