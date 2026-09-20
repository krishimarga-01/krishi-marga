import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { DiagnosisApi, DiagnosisApiError } from '../services/diagnosisApi';
import { UploadHandle } from '../services/httpClient';
import { OnnxEngine } from '../offline/onnxEngine';
import { CaseStorage } from '../storage/caseStorage';
import { NetworkBudget } from '../services/config';
import { IPDMCommunityService } from '../services/ipdmCommunityService';

const { width, height } = Dimensions.get('window');

/**
 * Watchdog ceiling. Even if every other guard fails, the screen leaves the
 * analysing state after this long, so the app can never sit on the loading
 * screen forever.
 */
const WATCHDOG_MS = NetworkBudget.diagnosisTimeoutMs + 20000;

export const AnalyzingScreen = ({ route, navigation }: any) => {
  const { crop, imageUris, language, symptoms, latitude, longitude, cropDisplayName } = route.params;
  const { t } = useI18n();

  const [progressPercent, setProgressPercent] = useState(20);
  const [analysisStage, setAnalysisStage] = useState('Optimizing & uploading photo(s)...');
  const progressAnim = useRef(new Animated.Value(0.2)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const hasNavigatedRef = useRef(false);
  const isMountedRef = useRef(true);
  const runningRef = useRef(false);
  const progressTimerRef = useRef<any>(null);
  const watchdogRef = useRef<any>(null);
  const navTimerRef = useRef<any>(null);
  const uploadHandleRef = useRef<UploadHandle | null>(null);

  /** Stops every timer and cancels any in-flight upload. */
  const stopAllTimers = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    if (uploadHandleRef.current) {
      uploadHandleRef.current.cancel();
      uploadHandleRef.current = null;
    }
  }, []);

  /** Restarts the staged progress animation for a fresh attempt. */
  const startProgressTicker = useCallback(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    setProgressPercent(20);
    progressAnim.setValue(0.2);
    setAnalysisStage('Preparing your photo(s)...');

    let currentStep = 0;
    progressTimerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      currentStep++;
      if (currentStep === 2) {
        setAnalysisStage('Analyzing the leaf and symptoms...');
      } else if (currentStep === 4) {
        setAnalysisStage('Checking crop health...');
      } else if (currentStep >= 6) {
        setAnalysisStage('Preparing your recommendations...');
      }

      setProgressPercent((prev) => {
        if (prev < 92) {
          const increment = Math.max(2, Math.floor((92 - prev) / 4));
          const next = Math.min(92, prev + increment);
          Animated.timing(progressAnim, {
            toValue: next / 100,
            duration: 350,
            useNativeDriver: false,
          }).start();
          return next;
        }
        return prev;
      });
    }, 450);
  }, [progressAnim]);

  const completeProgress = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setAnalysisStage('Result ready!');
    setProgressPercent(100);
    Animated.timing(progressAnim, {
      toValue: 1.0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

  const persistAndGo = useCallback(
    async (finalResult: any) => {
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
        syncStatus: (finalResult.analysis_source === 'online' ? 'synced' : 'pending') as
          | 'synced'
          | 'pending',
      };

      // A storage failure must not strand the farmer on the loading screen.
      try {
        await CaseStorage.saveCase(caseRecord);
      } catch (e) {
        console.warn('[Analyzing] Case could not be saved locally:', e);
      }

      // Record real community observation for local epidemiology clustering (anonymized location)
      try {
        if (finalResult && finalResult.health_status === 'Diseased') {
          const isPest = finalResult.problem_type === 'PEST' || !!finalResult.pest_assessment?.pest_detected;
          const targetName = finalResult.pest_assessment?.pest_detected || finalResult.disease;
          if (targetName && targetName !== 'Unable to identify pest') {
            await IPDMCommunityService.recordObservation({
              crop: cropDisplayName || crop,
              pestOrDisease: targetName,
              type: isPest ? 'pest' : 'disease',
              severity: finalResult.severity || 'Moderate',
              latitude: latitude || undefined,
              longitude: longitude || undefined,
            });
          }
        }
      } catch (e) {
        console.warn('[Analyzing] Community observation record skipped:', e);
      }

      navTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current || hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;
        navigation.replace('Result', {
          result: finalResult,
          crop: cropDisplayName || crop,
          imageUris,
        });
      }, 350);
    },
    [crop, cropDisplayName, imageUris, language, latitude, longitude, navigation, symptoms]
  );

  /** Presents a failure with a working Retry that fully restarts the attempt. */
  const showFailure = useCallback(
    (title: string, message: string, allowRetry: boolean) => {
      stopAllTimers();
      if (!isMountedRef.current) return;
      setAnalysisStage(message);

      const buttons: any[] = [];
      if (allowRetry) {
        buttons.push({ text: 'Retry', onPress: () => runDiagnosis() });
      }
      buttons.push({
        text: 'Back',
        style: 'cancel',
        onPress: () => {
          if (navigation.canGoBack()) navigation.goBack();
        },
      });

      Alert.alert(title, message, buttons, { cancelable: false });
    },
    [navigation, stopAllTimers]
  );

  /**
   * Offline path.
   * Runs whatever offline capability genuinely exists for this crop: real
   * on-device inference when the model is present, otherwise a clearly labelled
   * knowledge-base lookup. The farmer is told which one they got.
   */
  const runOffline = useCallback(async () => {
    const capability = await OnnxEngine.getCapability(crop);

    if (!capability.hasRegistryEntry && !capability.hasKnowledgeEntry) {
      showFailure(t('offlineNotice'), t('offlineModelUnavailable'), false);
      return;
    }

    setAnalysisStage(
      capability.capability === 'MODEL_INFERENCE'
        ? 'Running on-device model...'
        : 'Loading offline crop knowledge...'
    );

    const result = await OnnxEngine.runInference(crop, imageUris, language);
    if (!isMountedRef.current) return;

    completeProgress();
    await persistAndGo(result);
  }, [crop, imageUris, language, completeProgress, persistAndGo, showFailure, t]);

  /** Single entry point for an attempt; safe to call again from Retry. */
  const runDiagnosis = useCallback(async () => {
    if (runningRef.current || hasNavigatedRef.current) return;
    runningRef.current = true;

    stopAllTimers();
    cancelUpload();
    startProgressTicker();

    // Absolute ceiling on the analysing state.
    watchdogRef.current = setTimeout(() => {
      cancelUpload();
      runningRef.current = false;
      showFailure(
        'Taking Too Long',
        'The analysis did not finish in time. Please check your connection and try again.',
        true
      );
    }, WATCHDOG_MS);

    try {
      const net = await NetInfo.fetch();
      const isOnline = !!net.isConnected && net.isInternetReachable !== false;

      if (!isOnline) {
        await runOffline();
        return;
      }

      const finalResult = await DiagnosisApi.detectDiseaseOnline({
        crop,
        imageUris,
        language,
        symptoms,
        latitude,
        longitude,
        registerHandle: (handle) => {
          uploadHandleRef.current = handle;
        },
        onUploadProgress: (fraction) => {
          if (!isMountedRef.current) return;
          if (fraction >= 0.99) setAnalysisStage('Examining leaf lesions & symptoms...');
        },
      });

      if (!isMountedRef.current || hasNavigatedRef.current) return;

      completeProgress();
      await persistAndGo(finalResult);
    } catch (err: any) {
      if (!isMountedRef.current) return;

      const apiErr = err as DiagnosisApiError;
      const caseType = apiErr?.caseType;

      if (caseType === 'ABORTED') return;

      // A connectivity failure mid-request still deserves the offline path if
      // this crop has genuine offline capability.
      if (caseType === 'NETWORK_ERROR') {
        try {
          const capability = await OnnxEngine.getCapability(crop);
          if (capability.hasRegistryEntry || capability.hasKnowledgeEntry) {
            await runOffline();
            return;
          }
        } catch {
          // fall through to the error dialog
        }
      }

      const title =
        caseType === 'NOT_CONFIGURED'
          ? 'Configuration Needed'
          : caseType === 'TIMEOUT'
          ? 'Taking Too Long'
          : caseType === 'SERVER_ERROR'
          ? 'Service Busy'
          : 'Check Failed';

      const userMessage =
        caseType === 'TIMEOUT'
          ? 'The analysis is taking longer than expected. Please check your internet connection and try again.'
          : caseType === 'NOT_CONFIGURED'
          ? 'Diagnosis server is not configured yet. You can still use the offline crop guides.'
          : caseType === 'SERVER_ERROR'
          ? 'The diagnosis service is temporarily busy. Please try again with a clear photo.'
          : caseType === 'NETWORK_ERROR'
          ? 'Network connection problem. Please check your internet or mobile data.'
          : (apiErr?.message || 'Something went wrong while checking the image. Please try again.');

      showFailure(
        title,
        userMessage,
        apiErr?.retryable !== false
      );
    } finally {
      runningRef.current = false;
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    }
  }, [
    cancelUpload,
    completeProgress,
    crop,
    imageUris,
    language,
    latitude,
    longitude,
    persistAndGo,
    runOffline,
    showFailure,
    startProgressTicker,
    stopAllTimers,
    symptoms,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2400,
        useNativeDriver: true,
      })
    ).start();

    runDiagnosis();

    return () => {
      // Leaving the screen stops the timers and cancels the upload so no work
      // and no memory is left behind.
      isMountedRef.current = false;
      stopAllTimers();
      cancelUpload();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Text style={styles.analyzingSubtitle}>{analysisStage}</Text>

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
