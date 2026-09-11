import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { DiagnosisApi } from '../services/diagnosisApi';
import { OnnxEngine } from '../offline/onnxEngine';
import { CaseStorage } from '../storage/caseStorage';

const { width, height } = Dimensions.get('window');

export const AnalyzingScreen = ({ route, navigation }: any) => {
  const { crop, imageUris, language, symptoms, latitude, longitude, cropDisplayName } = route.params;
  const { t } = useI18n();

  const [progressPercent, setProgressPercent] = useState(15);
  const progressAnim = useRef(new Animated.Value(0.15)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Arc rotation animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      })
    ).start();

    // 2. Simulated progressive loading bar while waiting for actual server/model response
    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev < 78) {
          const next = prev + Math.floor(Math.random() * 8) + 4;
          Animated.timing(progressAnim, {
            toValue: next / 100,
            duration: 350,
            useNativeDriver: false,
          }).start();
          return next;
        }
        return prev;
      });
    }, 400);

    // 3. Real AI Inference execution
    runDiagnosis(interval);

    return () => clearInterval(interval);
  }, []);

  const runDiagnosis = async (intervalId: any) => {
    try {
      const net = await NetInfo.fetch();
      const isOnline = net.isConnected && net.isInternetReachable !== false;

      let finalResult;
      if (isOnline) {
        try {
          finalResult = await DiagnosisApi.detectDiseaseOnline({
            crop,
            imageUris,
            language,
            symptoms,
            latitude,
            longitude,
          });
        } catch (apiError) {
          console.log('Online diagnosis error, trying offline engine:', apiError);
          if (OnnxEngine.isModelAvailable(crop)) {
            finalResult = await OnnxEngine.runInference(crop, imageUris, language);
          } else {
            throw apiError;
          }
        }
      } else {
        if (!OnnxEngine.isModelAvailable(crop)) {
          clearInterval(intervalId);
          Alert.alert(
            t('offlineNotice'),
            t('offlineModelUnavailable'),
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        finalResult = await OnnxEngine.runInference(crop, imageUris, language);
      }

      // Finish progress bar to 100%
      clearInterval(intervalId);
      setProgressPercent(100);
      Animated.timing(progressAnim, {
        toValue: 1.0,
        duration: 250,
        useNativeDriver: false,
      }).start();

      // Persist case record
      const caseRecord = {
        caseId: 'case_' + Date.now(),
        crop: cropDisplayName || crop,
        imageUris,
        imageCount: imageUris.length,
        timestamp: new Date().toISOString(),
        symptoms: symptoms || '',
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        language,
        result: finalResult,
        syncStatus: 'synced' as const,
      };
      await CaseStorage.saveCase(caseRecord);

      // Transition to Result Screen
      setTimeout(() => {
        navigation.replace('Result', {
          result: finalResult,
          crop: cropDisplayName || crop,
          imageUris,
        });
      }, 350);
    } catch (err: any) {
      clearInterval(intervalId);
      Alert.alert(
        'Diagnosis Error',
        err.message || 'Failed to complete crop health inspection.',
        [
          { text: 'Retry', onPress: () => runDiagnosis(intervalId) },
          { text: 'Back', style: 'cancel', onPress: () => navigation.goBack() },
        ]
      );
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Top Half: Field Photographic Background */}
      <View style={styles.topBackdrop}>
        <Image
          source={require('../../assets/backgrounds/analyzing_field_bg.png')}
          style={styles.fieldImage}
          resizeMode="cover"
        />
        <SafeAreaView style={styles.safeTopContent}>
          {/* Centered Brand Header */}
          <View style={styles.brandCenter}>
            <Image
              source={require('../../assets/logo/km_brand_icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={styles.brandTitle}>KRISHI MARGA</Text>
            <Text style={styles.brandSubtitle}>Your Crop Companion</Text>
          </View>

          {/* Heading & Subtitle */}
          <View style={styles.headingWrap}>
            <Text style={styles.mainHeading}>Analyzing your crop...</Text>
            <Text style={styles.subHeading}>
              Looking closely at leaf patterns, color changes{'\n'}and possible disease signs.
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Sheet / Curved Dome Card */}
      <View style={styles.bottomSheet}>
        {/* Plant / Sprout Icon in Circular Ring */}
        <View style={styles.sproutContainer}>
          <Animated.View style={[styles.sproutRing, { transform: [{ rotate: spin }] }]} />
          <View style={styles.sproutCircle}>
            <Text style={styles.sproutEmoji}>🌱</Text>
          </View>
        </View>

        {/* Action Title */}
        <Text style={styles.analyzingTitle}>Analyzing...</Text>
        <Text style={styles.analyzingSubtitle}>This may take a few seconds.</Text>

        {/* Progress Bar Container */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.percentText}>{progressPercent}%</Text>
        </View>

        {/* Farmer Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconCircle}>
            <Text style={styles.tipEmoji}>💡</Text>
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={styles.tipHeading}>Tip:</Text>
            <Text style={styles.tipBody}>
              Ensure good lighting and a clear leaf image for better results.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  topBackdrop: {
    width: '100%',
    height: height * 0.54,
    position: 'relative',
  },
  fieldImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  safeTopContent: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  brandCenter: {
    alignItems: 'center',
    marginTop: 16,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#162836',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#334E68',
    fontWeight: '500',
    marginTop: 1,
  },
  headingWrap: {
    alignItems: 'center',
    marginTop: 26,
  },
  mainHeading: {
    fontSize: 23,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 14,
    color: '#334E68',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  sproutContainer: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  sproutRing: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 3.5,
    borderColor: '#2E7D32',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  sproutCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sproutEmoji: {
    fontSize: 32,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#162836',
  },
  analyzingSubtitle: {
    fontSize: 14,
    color: '#607274',
    marginTop: 4,
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
    marginBottom: 26,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2F0E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 4,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B6B55',
    minWidth: 40,
    textAlign: 'right',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F3',
    borderWidth: 1,
    borderColor: '#D7EEDF',
    borderRadius: 18,
    padding: 16,
    width: '100%',
  },
  tipIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DDF4E4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  tipEmoji: {
    fontSize: 22,
  },
  tipTextWrap: {
    flex: 1,
  },
  tipHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E6B38',
    marginBottom: 2,
  },
  tipBody: {
    fontSize: 13,
    color: '#3E5C46',
    lineHeight: 18,
  },
});
