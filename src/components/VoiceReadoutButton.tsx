import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Alert,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { VoiceService } from '../services/voiceService';
import { SupportedLanguage, useI18n } from '../services/i18n';
import { Colors } from '../theme';

interface VoiceReadoutButtonProps {
  getTextToSpeak: () => string;
  language?: SupportedLanguage;
  customLabel?: string;
  style?: StyleProp<ViewStyle>;
  onStateChange?: (isSpeaking: boolean) => void;
}

export const VoiceReadoutButton: React.FC<VoiceReadoutButtonProps> = ({
  getTextToSpeak,
  language: explicitLanguage,
  customLabel,
  style,
  onStateChange,
}) => {
  const { t, language: contextLanguage } = useI18n();
  const activeLanguage = explicitLanguage || contextLanguage || 'en';

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Stop speech immediately when leaving screen
      VoiceService.stop();
    };
  }, []);

  const handleToggleSpeech = async () => {
    if (isSpeaking) {
      await VoiceService.stop();
      if (isMountedRef.current) {
        setIsSpeaking(false);
        setIsLoading(false);
        onStateChange?.(false);
      }
      return;
    }

    try {
      setIsLoading(true);
      const speechText = getTextToSpeak();
      if (!speechText || !speechText.trim()) {
        setIsLoading(false);
        return;
      }

      await VoiceService.speak(speechText, activeLanguage, {
        onStart: () => {
          if (isMountedRef.current) {
            setIsSpeaking(true);
            setIsLoading(false);
            onStateChange?.(true);
          }
        },
        onDone: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
            setIsLoading(false);
            onStateChange?.(false);
          }
        },
        onStopped: () => {
          if (isMountedRef.current) {
            setIsSpeaking(false);
            setIsLoading(false);
            onStateChange?.(false);
          }
        },
        onError: (err) => {
          console.warn('[VoiceReadoutButton] TTS error:', err);
          if (isMountedRef.current) {
            setIsSpeaking(false);
            setIsLoading(false);
            onStateChange?.(false);
            Alert.alert(
              t('voiceError') || 'Voice Output',
              t('voiceNotAvailable') || 'Voice is not available for this language on this device.'
            );
          }
        },
      });
    } catch (e) {
      if (isMountedRef.current) {
        setIsSpeaking(false);
        setIsLoading(false);
        onStateChange?.(false);
      }
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.voiceButton,
        isSpeaking ? styles.voiceButtonActive : styles.voiceButtonIdle,
        style,
      ]}
      activeOpacity={0.8}
      onPress={handleToggleSpeech}
    >
      <View style={styles.contentRow}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.iconSpacing} />
        ) : isSpeaking ? (
          <Text style={styles.icon}>⏹</Text>
        ) : (
          <Text style={styles.icon}>🔊</Text>
        )}

        <Text style={styles.buttonText}>
          {isSpeaking
            ? t('voiceStop') || 'Stop Voice'
            : customLabel || t('voiceListen') || 'Listen to Result'}
        </Text>

        {isSpeaking && (
          <View style={styles.speakingBadge}>
            <Text style={styles.speakingBadgeText}>{t('voicePlaying') || 'Speaking...'}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  voiceButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  voiceButtonIdle: {
    backgroundColor: '#1E6335', // Krishi Marga Deep Emerald
  },
  voiceButtonActive: {
    backgroundColor: '#C53030', // Alert Crimson for Stop
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  iconSpacing: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  speakingBadge: {
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  speakingBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
