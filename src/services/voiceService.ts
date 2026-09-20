import * as Speech from 'expo-speech';
import { NormalizedResult } from '../models/index';
import { PesticideScanResult } from './pesticideService';
import { SupportedLanguage } from './i18n';

const LANGUAGE_SPEECH_TAGS: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  ml: 'ml-IN',
};

export class VoiceService {
  public static buildDiseaseSpeechSummary(
    result: NormalizedResult,
    displayCrop: string,
    language: SupportedLanguage
  ): string {
    if (!result) return '';

    const isHealthy =
      result.health_status === 'Healthy' ||
      (result.disease && result.disease.toLowerCase().includes('healthy'));

    if (language === 'kn') {
      if (isHealthy) {
        return displayCrop + ' ಬೆಳೆಯು ಆರೋಗ್ಯಕರವಾಗಿದೆ. ಯಾವುದೇ ಪ್ರಮುಖ ರೋಗಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ.';
      }
      let text = displayCrop + ' ಬೆಳೆಯಲ್ಲಿ ' + result.disease + ' ರೋಗದ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ.';
      if (result.severity) {
        text += ' ತೀವ್ರತೆಯ ಮಟ್ಟ: ' + result.severity + '.';
      }
      if (result.recommendations && result.recommendations.length) {
        text += ' ಶಿಫಾರಸು ಮಾಡಲಾದ ಕ್ರಮ: ' + result.recommendations[0];
      }
      return text;
    }

    if (language === 'hi') {
      if (isHealthy) {
        return displayCrop + ' की फसल स्वस्थ है। कोई गंभीर बीमारी नहीं पाई गई।';
      }
      let text = displayCrop + ' में ' + result.disease + ' की पहचान हुई है।';
      if (result.severity) {
        text += ' गंभीरता स्तर: ' + result.severity + '.';
      }
      if (result.recommendations && result.recommendations.length) {
        text += ' उपचार सलाह: ' + result.recommendations[0];
      }
      return text;
    }

    if (language === 'ta') {
      if (isHealthy) {
        return displayCrop + ' பயிர் ஆரோக்கியமாக உள்ளது. எந்த தீவிர நோயும் கண்டறியப்படவில்லை.';
      }
      let text = displayCrop + ' பயிரில் ' + result.disease + ' கண்டறியப்பட்டுள்ளது.';
      if (result.severity) {
        text += ' தீவிரம்: ' + result.severity + '.';
      }
      if (result.recommendations && result.recommendations.length) {
        text += ' பரிந்துரை: ' + result.recommendations[0];
      }
      return text;
    }

    if (language === 'te') {
      if (isHealthy) {
        return displayCrop + ' పంట ఆరోగ్యంగా ఉంది. ఎటువంటి తీవ్రమైన వ్యాధులు కనిపించలేదు.';
      }
      let text = displayCrop + ' పంటలో ' + result.disease + ' గుర్తించబడింది.';
      if (result.severity) {
        text += ' తీవ్రత: ' + result.severity + '.';
      }
      if (result.recommendations && result.recommendations.length) {
        text += ' సూచన: ' + result.recommendations[0];
      }
      return text;
    }

    if (language === 'ml') {
      if (isHealthy) {
        return displayCrop + ' വിള ആരോഗ്യകരമാണ്. രോഗലക്ഷണങ്ങളൊന്നും കണ്ടെത്തിയില്ല.';
      }
      let text = displayCrop + ' വിളയിൽ ' + result.disease + ' കണ്ടെത്തി.';
      if (result.severity) {
        text += ' തീവ്രത: ' + result.severity + '.';
      }
      if (result.recommendations && result.recommendations.length) {
        text += ' പ്രതിവിധി: ' + result.recommendations[0];
      }
      return text;
    }

    if (isHealthy) {
      return 'The ' + displayCrop + ' crop appears healthy. No significant disease symptoms were detected.';
    }

    let summary = 'Detected ' + result.disease + ' on ' + displayCrop + '.';
    if (result.severity) {
      summary += ' Severity is assessed as ' + result.severity + '.';
    }
    if (result.recommendations && result.recommendations.length) {
      summary += ' Primary recommended action: ' + result.recommendations[0];
    }
    return summary;
  }

  public static buildPesticideSpeechSummary(
    result: PesticideScanResult,
    language: SupportedLanguage
  ): string {
    if (!result) return '';

    if (!result.identified) {
      if (language === 'kn') {
        return 'ಕೀಟನಾಶಕದ ವಿವರಗಳನ್ನು ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಬಾಟಲಿಯ ಲೇಬಲ್ ಅನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ಛಾಯಾಚಿತ್ರ ತೆಗೆಯಿರಿ.';
      }
      if (language === 'hi') {
        return 'कीटनाशक लेबल की पहचान नहीं हो सकी। कृपया लेबल की स्पष्ट तस्वीर लें।';
      }
      if (language === 'ta') {
        return 'பூச்சிக்கொல்லி லேபிளை அடையாளம் காண முடியவில்லை. தெளிவான புகைப்படத்தை எடுக்கவும்.';
      }
      if (language === 'te') {
        return 'పురుగుమందు వివరాలు గుర్తించబడలేదు. దయచేసి లేబుల్‌ని స్పష్టంగా ఫోటో తీయండి.';
      }
      if (language === 'ml') {
        return 'കീടനാശിനി ലേബൽ തിരിച്ചറിയാൻ കഴിഞ്ഞില്ല. ദയവായി വ്യക്തമായ ഫോട്ടോ എടുക്കുക.';
      }
      return 'Could not identify the pesticide label. Please ensure the label is clearly visible and try again.';
    }

    const name = result.product_name || result.active_ingredient || 'Pesticide';

    if (language === 'kn') {
      let text = 'ಗುರುತಿಸಲಾದ ಉತ್ಪನ್ನ: ' + name + '.';
      if (result.category) text += ' ಪ್ರಕಾರ: ' + result.category + '.';
      if (result.is_banned) {
        text += ' ಎಚ್ಚರಿಕೆ: ಈ ಉತ್ಪನ್ನವನ್ನು ನಿಷೇಧಿಸಲಾಗಿದೆ.';
      } else if (result.cibrc_registered) {
        text += ' ಸಿ.ಐ.ಬಿ.ಆರ್.ಸಿ ಯಲ್ಲಿ ನೋಂದಾಯಿತವಾಗಿದೆ.';
      }
      if (result.dosage_notice) {
        text += ' ' + result.dosage_notice;
      }
      return text;
    }

    if (language === 'hi') {
      let text = 'पहचाना गया उत्पाद: ' + name + '.';
      if (result.category) text += ' श्रेणी: ' + result.category + '.';
      if (result.is_banned) {
        text += ' चेतावनी: यह कीटनाशक प्रतिबंधित है।';
      } else if (result.cibrc_registered) {
        text += ' सीआईबीआरसी द्वारा पंजीकृत है।';
      }
      if (result.dosage_notice) {
        text += ' ' + result.dosage_notice;
      }
      return text;
    }

    if (language === 'ta') {
      let text = 'கண்டறியப்பட்ட பொருள்: ' + name + '.';
      if (result.category) text += ' வகை: ' + result.category + '.';
      if (result.is_banned) {
        text += ' எச்சரிக்கை: இந்த மருந்து தடை செய்யப்பட்டுள்ளது.';
      }
      return text;
    }

    if (language === 'te') {
      let text = 'గుర్తించబడిన పురుగుమందు: ' + name + '.';
      if (result.category) text += ' వర్గం: ' + result.category + '.';
      if (result.is_banned) {
        text += ' హెచ్చరిక: ఇది నిషేధించబడిన మందు.';
      }
      return text;
    }

    if (language === 'ml') {
      let text = 'തിരിച്ചറിഞ്ഞ ഉൽപ്പന്നം: ' + name + '.';
      if (result.category) text += ' വിഭാഗം: ' + result.category + '.';
      if (result.is_banned) {
        text += ' മുന്നറിയിപ്പ്: ഇത് നിരോധിച്ച കീടനാശിനിയാണ്.';
      }
      return text;
    }

    let summary = 'Product identified as ' + name + '.';
    if (result.category) {
      summary += ' Category: ' + result.category + '.';
    }
    if (result.is_banned) {
      summary += ' Warning: This chemical is banned or restricted.';
    } else if (result.cibrc_registered) {
      summary += ' Verified CIBRC registered.';
    }
    if (result.safety_guidance && result.safety_guidance.length) {
      summary += ' Key safety precaution: ' + result.safety_guidance[0];
    }
    return summary;
  }

  public static async speak(
    text: string,
    language: SupportedLanguage,
    onDone?: () => void,
    onError?: (err: unknown) => void
  ): Promise<void> {
    if (!text || text.trim().length === 0) {
      if (onDone) onDone();
      return;
    }

    try {
      await VoiceService.stop();
      const langCode = LANGUAGE_SPEECH_TAGS[language] || 'en-IN';

      Speech.speak(text, {
        language: langCode,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          if (onDone) onDone();
        },
        onStopped: () => {
          if (onDone) onDone();
        },
        onError: (err) => {
          console.warn('[VoiceService] Speech error:', err);
          if (onError) onError(err);
          if (onDone) onDone();
        },
      });
    } catch (error) {
      console.warn('[VoiceService] Could not play speech:', error);
      if (onError) onError(error);
      if (onDone) onDone();
    }
  }

  public static async stop(): Promise<void> {
    try {
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await Speech.stop();
      }
    } catch {
      // Ignore cleanup error
    }
  }

  public static async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  }
}
