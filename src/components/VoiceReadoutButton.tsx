import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Colors } from '../theme';
import { SupportedLanguage } from '../services/i18n';
import { VoiceService } from '../services/voiceService';

interface VoiceReadoutButtonProps {
  getTextToSpeak: () => string;
  language: SupportedLanguage;
  label?: string;
}

const BUTTON_LABELS: Record<SupportedLanguage, { speak: string; stop: string }> = {
  en: { speak: 'Listen to Summary', stop: 'Stop Audio' },
  kn: { speak: 'ಧ್ವನಿ ಸಾರಾಂಶ ಆಲಿಸಿ', stop: 'ನಿಲ್ಲಿಸಿ' },
  hi: { speak: 'ऑडियो सारांश सुनें', stop: 'रोकें' },
  ta: { speak: 'சுருக்கத்தைக் கேளுங்கள்', stop: 'நிறுத்து' },
  te: { speak: 'వాయిస్ సారాంశం వినండి', stop: 'ఆపండి' },
  ml: { speak: 'ഓഡിയോ സംഗ്രഹം കേൾക്കുക', stop: 'നിർത്തുക' },
};

export const VoiceReadoutButton: React.FC<VoiceReadoutButtonProps> = ({
  getTextToSpeak,
  language,
  label,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      VoiceService.stop();
    };
  }, []);

  const handlePress = async () => {
    if (isPlaying) {
      await VoiceService.stop();
      setIsPlaying(false);
      return;
    }

    try {
      setIsLoading(true);
      const text = getTextToSpeak();
      if (!text || text.trim().length === 0) {
        setIsLoading(false);
        return;
      }

      setIsPlaying(true);
      setIsLoading(false);

      await VoiceService.speak(
        text,
        language,
        () => setIsPlaying(false),
        () => setIsPlaying(false)
      );
    } catch {
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const localizedLabels = BUTTON_LABELS[language] || BUTTON_LABELS.en;
  const displayLabel = label || (isPlaying ? localizedLabels.stop : localizedLabels.speak);

  return (
    <TouchableOpacity
      style={[styles.button, isPlaying && styles.buttonActive]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
    >
      <View style={styles.contentRow}>
        <Text style={styles.icon}>{isPlaying ? '⏹' : '🔊'}</Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.indicator} />
        ) : (
          <Text style={[styles.text, isPlaying && styles.textActive]}>
            {displayLabel}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  text: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
  textActive: {
    color: '#991B1B',
  },
  indicator: {
    marginLeft: 6,
  },
});
