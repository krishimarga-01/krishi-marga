import * as Speech from 'expo-speech';
import type { SupportedLanguage } from './i18n';
import type { NormalizedResult } from '../models/index';
import type { PesticideScanResult } from './pesticideService';

/**
 * BCP 47 TTS Language Locales mapped to Krishi Marga's 6 supported languages.
 * 1 English + 5 Local Indian Languages:
 *   - en: Indian English / English
 *   - kn: Kannada (ಕನ್ನಡ)
 *   - ta: Tamil (தமிழ்)
 *   - ml: Malayalam (മലയാളം)
 *   - hi: Hindi (हिन्दी)
 *   - te: Telugu (తెలుగు)
 */
export const TTS_LOCALES: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  kn: 'kn-IN',
  ta: 'ta-IN',
  ml: 'ml-IN',
  hi: 'hi-IN',
  te: 'te-IN',
};

export interface VoiceSpeakOptions {
  onStart?: () => void;
  onDone?: () => void;
  onStopped?: () => void;
  onError?: (error: any) => void;
}

export const VoiceService = {
  /**
   * Stop any active speech across the entire application.
   */
  async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch (err) {
      console.warn('[VoiceService] Stop error:', err);
    }
  },

  /**
   * Check if speech engine is actively speaking.
   */
  async isSpeaking(): Promise<boolean> {
    try {
      return await Speech.isSpeakingAsync();
    } catch {
      return false;
    }
  },

  /**
   * Check if a voice exists on the current device for the target language.
   */
  async isVoiceAvailable(lang: SupportedLanguage): Promise<boolean> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      if (!voices || voices.length === 0) {
        return true;
      }
      const targetPrefix = lang.toLowerCase();
      return voices.some(
        (v) =>
          v.language.toLowerCase().startsWith(targetPrefix) ||
          v.language.toLowerCase().replace('_', '-').startsWith(TTS_LOCALES[lang].toLowerCase())
      );
    } catch {
      return true;
    }
  },

  /**
   * Speak the given text in the farmer's selected language.
   * Cancels any ongoing speech first to prevent overlapping audio.
   */
  async speak(
    text: string,
    language: SupportedLanguage,
    options?: VoiceSpeakOptions
  ): Promise<void> {
    if (!text || !text.trim()) {
      options?.onDone?.();
      return;
    }

    try {
      // 1. Cancel previous speech session
      await Speech.stop();

      const locale = TTS_LOCALES[language] || 'en-IN';

      Speech.speak(text, {
        language: locale,
        pitch: 1.0,
        rate: 0.88, // Slightly relaxed pacing for maximum clarity in rural farm environments
        onStart: options?.onStart,
        onDone: options?.onDone,
        onStopped: options?.onStopped,
        onError: options?.onError,
      });
    } catch (err) {
      console.error('[VoiceService] Speak error:', err);
      options?.onError?.(err);
    }
  },

  /**
   * Construct a farmer-friendly spoken narrative from a Crop Diagnosis Result.
   * Natural order: Crop -> Health Status -> Disease -> Confidence -> Symptoms -> Remedies -> Prevention.
   * NEVER speaks internal technical IDs, model names, or debug metadata.
   */
  buildDiseaseSpeechSummary(
    result: NormalizedResult,
    displayCrop: string,
    language: SupportedLanguage
  ): string {
    const isHealthy = (result.health_status || '').toLowerCase() === 'healthy';
    const isUncertain =
      (result.health_status || '').toLowerCase() === 'uncertain' ||
      result.problem_type === 'UNKNOWN';

    // HEALTHY PLANT SPOKEN NARRATIVES
    if (isHealthy) {
      switch (language) {
        case 'kn':
          return `ನಿಮ್ಮ ${displayCrop} ಬೆಳೆ ಸಂಪೂರ್ಣ ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತಿದೆ. ಯಾವುದೇ ಗಂಭೀರ ರೋಗ ಅಥವಾ ಕೀಟ ಬಾಧೆ ಕಂಡುಬಂದಿಲ್ಲ. ಸೂಕ್ತ ನೀರಾವರಿ ಮತ್ತು ಸಮತೋಲಿತ ಪೋಷಕಾಂಶ ನಿರ್ವಹಣೆಯನ್ನು ಮುಂದುವರಿಸಿ.`;
        case 'ta':
          return `உங்கள் ${displayCrop} பயிர் ஆரோக்கியமாக உள்ளது. பெரிய நோய் அல்லது பூச்சி தாக்குதல் எதுவும் கண்டறியப்படவில்லை. வழக்கமான பாசனம் மற்றும் உர நிர்வாகத்தைத் தொடரவும்.`;
        case 'te':
          return `మీ ${displayCrop} పంట ఆరోగ్యంగా కనిపిస్తోంది. ఎటువంటి తీవ్రమైన తెగులు లేదా పురుగుల దాడి గుర్తించబడలేదు. సరైన నీటి యాజమాన్యం మరియు పోషకాలను కొనసాగించండి.`;
        case 'ml':
          return `നിങ്ങളുടെ ${displayCrop} വിള ആരോഗ്യകരമായി കാണപ്പെടുന്നു. രോഗങ്ങളോ കീടബാധയോ കണ്ടെത്തിയിട്ടില്ല. കൃത്യമായ നനയും വളപ്രയോഗവും തുടരുക.`;
        case 'hi':
          return `आपकी ${displayCrop} की फसल स्वस्थ दिखाई दे रही है। किसी गंभीर बीमारी या कीट का प्रकोप नहीं पाया गया है। उचित सिंचाई और पोषण प्रबंधन जारी रखें।`;
        default:
          return `Your ${displayCrop} crop appears healthy. No major disease, pest, or nutrient deficiency was detected. Maintain balanced irrigation and regular crop care.`;
      }
    }

    // UNCERTAIN / UNCLEAR / WRONG CROP SPOKEN NARRATIVES
    if (isUncertain) {
      if (result.user_message && result.user_message.trim()) {
        return result.user_message.trim();
      }
      switch (language) {
        case 'kn':
          return `ಚಿತ್ರವು ಅಸ್ಪಷ್ಟವಾಗಿದೆ ಅಥವಾ ಆಯ್ಕೆಮಾಡಿದ ಬೆಳೆಗೆ ಸರಿಹೊಂದುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ${displayCrop} ಸಸ್ಯದ ಸ್ಪಷ್ಟವಾದ ಫೋಟೋವನ್ನು ಉತ್ತಮ ಬೆಳಕಿನಲ್ಲಿ ತೆಗೆದು ಅಪ್ಲೋಡ್ ಮಾಡಿ.`;
        case 'ta':
          return `புகைப்படம் தெளிவாக இல்லை அல்லது தேர்ந்தெடுக்கப்பட்ட பயிருடன் பொருந்தவில்லை. நல்ல வெளிச்சத்தில் உங்கள் ${displayCrop} செடியின் தெளிவான புகைப்படத்தை பதிவேற்றவும்.`;
        case 'te':
          return `ఫోటో స్పష్టంగా లేదు లేదా ఎంచుకున్న పంటతో సరిపోలడం లేదు. దయచేసి మంచి వెలుతురులో మీ ${displayCrop} మొక్క యొక్క స్పష్టమైన ఫోటోను అప్‌లోడ్ చేయండి.`;
        case 'ml':
          return `ഫോട്ടോ വ്യക്തമല്ല അല്ലെങ്കിൽ തിരഞ്ഞെടുത്ത വിളയുമായി പൊരുത്തപ്പെടുന്നില്ല. നല്ല വെളിച്ചത്തിൽ നിങ്ങളുടെ ${displayCrop} ചെടിയുടെ വ്യക്തമായ ഫോട്ടോ എടുക്കുക.`;
        case 'hi':
          return `फोटो स्पष्ट नहीं है या चयनित फसल से मेल नहीं खाती है। कृपया अच्छी रोशनी में अपने ${displayCrop} पौधे की स्पष्ट फोटो लें।`;
        default:
          return `The photo is unclear or does not match the selected crop. Please take a clear, well-lit photo of your ${displayCrop} plant.`;
      }
    }

    // CONFIRMED DISEASE / PEST / NUTRIENT DEFICIENCY
    const parts: string[] = [];

    const diseaseName = result.disease || 'Detected Problem';
    const confidencePct = Math.round(result.confidence * 100);

    switch (language) {
      case 'kn':
        parts.push(`ಬೆಳೆ: ${displayCrop}.`);
        parts.push(`ಪತ್ತೆಯಾದ ಸಮಸ್ಯೆ: ${diseaseName}.`);
        if (result.severity && result.severity !== 'None') {
          parts.push(`ತೀವ್ರತೆ: ${result.severity}.`);
        }
        if (confidencePct >= 50) {
          parts.push(`ವಿಶ್ವಾಸಾರ್ಹತೆ: ಶೇಕಡಾ ${confidencePct}.`);
        }
        if (result.symptoms && result.symptoms.length > 0) {
          parts.push(`ಲಕ್ಷಣಗಳು: ${result.symptoms.slice(0, 3).join(', ')}.`);
        }
        if (result.recommendations && result.recommendations.length > 0) {
          parts.push(`ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು: ${result.recommendations.slice(0, 2).join('. ')}.`);
        }
        if (result.prevention && result.prevention.length > 0) {
          parts.push(`ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮ: ${result.prevention.slice(0, 1).join('. ')}.`);
        }
        if (result.user_message) {
          parts.push(result.user_message);
        }
        break;

      case 'ta':
        parts.push(`பயிர்: ${displayCrop}.`);
        parts.push(`கண்டறியப்பட்ட பிரச்சனை: ${diseaseName}.`);
        if (result.severity && result.severity !== 'None') {
          parts.push(`தீவிரம்: ${result.severity}.`);
        }
        if (confidencePct >= 50) {
          parts.push(`நம்பகத்தன்மை: ${confidencePct} சதவீதம்.`);
        }
        if (result.symptoms && result.symptoms.length > 0) {
          parts.push(`அறிகுறிகள்: ${result.symptoms.slice(0, 3).join(', ')}.`);
        }
        if (result.recommendations && result.recommendations.length > 0) {
          parts.push(`பரிந்துரைக்கப்படும் நடவடிக்கைகள்: ${result.recommendations.slice(0, 2).join('. ')}.`);
        }
        if (result.prevention && result.prevention.length > 0) {
          parts.push(`தடுப்பு முறை: ${result.prevention.slice(0, 1).join('. ')}.`);
        }
        if (result.user_message) {
          parts.push(result.user_message);
        }
        break;

      case 'te':
        parts.push(`పంట: ${displayCrop}.`);
        parts.push(`గుర్తించిన సమస్య: ${diseaseName}.`);
        if (result.severity && result.severity !== 'None') {
          parts.push(`తీవ్రత: ${result.severity}.`);
        }
        if (confidencePct >= 50) {
          parts.push(`ఖచ్చితత్వం: ${confidencePct} శాతం.`);
        }
        if (result.symptoms && result.symptoms.length > 0) {
          parts.push(`లక్షణాలు: ${result.symptoms.slice(0, 3).join(', ')}.`);
        }
        if (result.recommendations && result.recommendations.length > 0) {
          parts.push(`సిఫార్సు చేయబడిన చర్యలు: ${result.recommendations.slice(0, 2).join('. ')}.`);
        }
        if (result.prevention && result.prevention.length > 0) {
          parts.push(`నివారణ చర్య: ${result.prevention.slice(0, 1).join('. ')}.`);
        }
        if (result.user_message) {
          parts.push(result.user_message);
        }
        break;

      case 'ml':
        parts.push(`വിള: ${displayCrop}.`);
        parts.push(`കണ്ടെത്തിയ പ്രശ്നം: ${diseaseName}.`);
        if (result.severity && result.severity !== 'None') {
          parts.push(`തീവ്രത: ${result.severity}.`);
        }
        if (confidencePct >= 50) {
          parts.push(`വിശ്വാസ്യത: ${confidencePct} ശതമാനം.`);
        }
        if (result.symptoms && result.symptoms.length > 0) {
          parts.push(`ലക്ഷണങ്ങൾ: ${result.symptoms.slice(0, 3).join(', ')}.`);
        }
        if (result.recommendations && result.recommendations.length > 0) {
          parts.push(`ശുപാർശ ചെയ്യുന്ന നടപടികൾ: ${result.recommendations.slice(0, 2).join('. ')}.`);
        }
        if (result.prevention && result.prevention.length > 0) {
          parts.push(`പ്രതിരോധം: ${result.prevention.slice(0, 1).join('. ')}.`);
        }
        if (result.user_message) {
          parts.push(result.user_message);
        }
        break;

      case 'hi':
        parts.push(`फसल: ${displayCrop}.`);
        parts.push(`पहचानी गई समस्या: ${diseaseName}.`);
        if (result.severity && result.severity !== 'None') {
          parts.push(`गंभीरता: ${result.severity}.`);
        }
        if (confidencePct >= 50) {
          parts.push(`सटीकता: ${confidencePct} प्रतिशत.`);
        }
        if (result.symptoms && result.symptoms.length > 0) {
          parts.push(`लक्षण: ${result.symptoms.slice(0, 3).join(', ')}.`);
        }
        if (result.recommendations && result.recommendations.length > 0) {
          parts.push(`सलाह और उपचार: ${result.recommendations.slice(0, 2).join('. ')}.`);
        }
        if (result.prevention && result.prevention.length > 0) {
          parts.push(`रोकथाम: ${result.prevention.slice(0, 1).join('. ')}.`);
        }
        if (result.user_message) {
          parts.push(result.user_message);
        }
        break;

      default:
        parts.push(`Crop: ${displayCrop}.`);
        parts.push(`Detected problem: ${diseaseName}.`);
        if (result.severity && result.severity !== 'None') {
          parts.push(`Severity: ${result.severity}.`);
        }
        if (confidencePct >= 50) {
          parts.push(`Confidence: ${confidencePct} percent.`);
        }
        if (result.symptoms && result.symptoms.length > 0) {
          parts.push(`Symptoms observed: ${result.symptoms.slice(0, 3).join(', ')}.`);
        }
        if (result.recommendations && result.recommendations.length > 0) {
          parts.push(`Recommended actions: ${result.recommendations.slice(0, 2).join('. ')}.`);
        }
        if (result.prevention && result.prevention.length > 0) {
          parts.push(`Prevention: ${result.prevention.slice(0, 1).join('. ')}.`);
        }
        if (result.user_message) {
          parts.push(result.user_message);
        }
        break;
    }

    if (
      result.differential_assessment?.lookalikes &&
      result.differential_assessment.lookalikes.length > 0 &&
      confidencePct < 75
    ) {
      switch (language) {
        case 'kn':
          parts.push('ಔಷಧ ಸಿಂಪಡಿಸುವ ಮೊದಲು ಪರದೆಯ ಮೇಲಿನ ರೋಗಲಕ್ಷಣಗಳ ವ್ಯತ್ಯಾಸವನ್ನು ಪರಿಶೀಲಿಸಿ.');
          break;
        case 'ta':
          parts.push('மருந்து தெளிப்பதற்கு முன் திரையில் உள்ள ஒத்த அறிகுறிகளைச் சரிபார்க்கவும்.');
          break;
        case 'te':
          parts.push('మందులు వాడే ముందు తెరపై ఉన్న సారూప్య లక్షణాలను సరిచూసుకోండి.');
          break;
        case 'ml':
          parts.push('മരുന്ന് തളിക്കുന്നതിന് മുൻപ് സ്ക്രീനിലെ വ്യത്യാസങ്ങൾ ഉറപ്പാക്കുക.');
          break;
        case 'hi':
          parts.push('दवा छिड़कने से पहले स्क्रीन पर दिए गए मिलते-जुलते लक्षणों की जांच करें।');
          break;
        default:
          parts.push('Please review the look-alike checklist on screen before applying chemical treatments.');
          break;
      }
    }

    return parts.join(' ');
  },

  /**
   * Construct a farmer-friendly spoken narrative from a Pesticide Scan Result.
   * Natural order: Product Name -> Active Ingredient -> Banned Warning -> Purpose -> Safety -> Dosage Advisory.
   * STRICT: NEVER fabricates missing dosage.
   */
  buildPesticideSpeechSummary(
    result: PesticideScanResult,
    language: SupportedLanguage
  ): string {
    // 1. Unidentified or Non-Pesticide Photo
    if (!result.identified) {
      if (result.user_message && result.user_message.trim()) {
        const guidanceText =
          result.guidance && result.guidance.length > 0
            ? ' ' + result.guidance.slice(0, 2).join('. ')
            : '';
        return result.user_message.trim() + guidanceText;
      }
      switch (language) {
        case 'kn':
          return 'ಈ ಚಿತ್ರವು ಕೃಷಿ ಔಷಧ ಅಥವಾ ಕೀಟನಾಶಕದ ಪ್ಯಾಕೇಜ್ ಎಂದು ಕಂಡುಬರುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೀಟನಾಶಕ ಬಾಟಲ್ ಅಥವಾ ಲೇಬಲ್‌ನ ಸ್ಪಷ್ಟವಾದ ಫೋಟೋವನ್ನು ತೆಗೆಯಿರಿ.';
        case 'ta':
          return 'இந்த புகைப்படம் விவசாய மருந்து அல்லது பூச்சிக்கொல்லி பாக்கெட் போல் தெரியவில்லை. தெளிவான பாட்டில் அல்லது லேபிளின் புகைப்படத்தை எடுக்கவும்.';
        case 'te':
          return 'ఈ ఫోటో పురుగుమందు ప్యాకెట్ లాగా కనిపించడం లేదు. దయచేసి స్పష్టమైన బాటిల్ లేదా లేబుల్ ఫోటోను తీయండి.';
        case 'ml':
          return 'ഈ ഫോട്ടോ ഒരു കീടനാശിനി പാക്കറ്റായി കാണപ്പെടുന്നില്ല. ദയവായി വ്യക്തമായ ബോട്ടിൽ അല്ലെങ്കിൽ ലേബൽ ഫോട്ടോ എടുക്കുക.';
        case 'hi':
          return 'यह फोटो कीटनाशक का पैकेट नहीं लग रही है। कृपया कीटनाशक की बोतल या लेबल की स्पष्ट फोटो लें।';
        default:
          return 'This photo does not appear to be an agricultural pesticide package. Please capture a clear photo of the pesticide bottle or sachet label.';
      }
    }

    // 2. Verified Identified Product
    const parts: string[] = [];

    // Banned Chemical Warning
    if (result.is_banned) {
      switch (language) {
        case 'kn':
          parts.push('ಎಚ್ಚರಿಕೆ: ಈ ರಾಸಾಯನಿಕವು ಭಾರತದಲ್ಲಿ ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿಷೇಧಿಸಲ್ಪಟ್ಟಿದೆ. ಇದನ್ನು ಖರೀದಿಸಬೇಡಿ ಅಥವಾ ಸಿಂಪಡಿಸಬೇಡಿ.');
          break;
        case 'ta':
          parts.push('எச்சரிக்கை: இந்த ரசாயனம் இந்தியாவில் தடை செய்யப்பட்டுள்ளது. இதை வாங்கவோ பயன்படுத்தவோ வேண்டாம்.');
          break;
        case 'te':
          parts.push('హెచ్చరిక: ఈ రసాయనం భారతదేశంలో నిషేధించబడింది. దీనిని కొనవద్దు లేదా పిచికారీ చేయవద్దు.');
          break;
        case 'ml':
          parts.push('മുന്നറിയിപ്പ്: ഈ രാസവസ്തു ഇന്ത്യയിൽ നിരോധിച്ചതാണ്. ഇത് വാങ്ങുകയോ തളിക്കുകയോ ചെയ്യരുത്.');
          break;
        case 'hi':
          parts.push('चेतावनी: यह रसायन भारत में प्रतिबंधित है। इसे न खरीदें और न ही छिड़कें।');
          break;
        default:
          parts.push('Warning: This chemical is strictly banned in India. Do not purchase or spray.');
          break;
      }
    }

    const name = result.product_name || 'Agrochemical Product';
    const ingredient = result.active_ingredient
      ? `${result.active_ingredient} ${result.formulation || ''}`.trim()
      : '';

    switch (language) {
      case 'kn':
        parts.push(`ಉತ್ಪನ್ನ: ${name}.`);
        if (ingredient) parts.push(`ಸಕ್ರಿಯ ರಾಸಾಯನಿಕ: ${ingredient}.`);
        if (result.what_it_is) parts.push(result.what_it_is);
        if (result.target_pests && result.target_pests.length > 0) {
          parts.push(`ಉಪಯೋಗಿಸುವ ಕೀಟಗಳು: ${result.target_pests.slice(0, 3).join(', ')}.`);
        }
        if (result.suitable_crops && result.suitable_crops.length > 0) {
          parts.push(`ಅನುಮೋದಿತ ಬೆಳೆಗಳು: ${result.suitable_crops.slice(0, 3).join(', ')}.`);
        }
        if (result.safety_guidance && result.safety_guidance.length > 0) {
          parts.push(`ಸುರಕ್ಷತಾ ಕ್ರಮ: ${result.safety_guidance[0]}.`);
        }
        parts.push(
          result.dosage_notice ||
            'ಖಚಿತವಾದ ಪ್ರಮಾಣಕ್ಕಾಗಿ ಯಾವಾಗಲೂ ಪ್ಯಾಕೇಜ್ ಲೇಬಲ್ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಸ್ಥಳೀಯ ಕೃಷಿ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.'
        );
        break;

      case 'ta':
        parts.push(`தயாரிப்பு: ${name}.`);
        if (ingredient) parts.push(`செயலில் உள்ள ரசாயனம்: ${ingredient}.`);
        if (result.what_it_is) parts.push(result.what_it_is);
        if (result.target_pests && result.target_pests.length > 0) {
          parts.push(`கட்டுப்படுத்தும் பூச்சிகள்: ${result.target_pests.slice(0, 3).join(', ')}.`);
        }
        if (result.suitable_crops && result.suitable_crops.length > 0) {
          parts.push(`பொருத்தமான பயிர்கள்: ${result.suitable_crops.slice(0, 3).join(', ')}.`);
        }
        if (result.safety_guidance && result.safety_guidance.length > 0) {
          parts.push(`பாதுகாப்பு: ${result.safety_guidance[0]}.`);
        }
        parts.push(
          result.dosage_notice ||
            'சரியான அளவிற்கு எப்போதும் தயாரிப்பு லேபிளைப் பார்க்கவும் அல்லது உள்ளூர் வேளாண் அதிகாரியை அணுகவும்.'
        );
        break;

      case 'te':
        parts.push(`ఉత్పత్తి: ${name}.`);
        if (ingredient) parts.push(`క్రియాశీల పదార్ధం: ${ingredient}.`);
        if (result.what_it_is) parts.push(result.what_it_is);
        if (result.target_pests && result.target_pests.length > 0) {
          parts.push(`నివారించే పురుగులు: ${result.target_pests.slice(0, 3).join(', ')}.`);
        }
        if (result.suitable_crops && result.suitable_crops.length > 0) {
          parts.push(`అనుకూలమైన పంటలు: ${result.suitable_crops.slice(0, 3).join(', ')}.`);
        }
        if (result.safety_guidance && result.safety_guidance.length > 0) {
          parts.push(`భద్రత: ${result.safety_guidance[0]}.`);
        }
        parts.push(
          result.dosage_notice ||
            'ఖచ్చితమైన మోతాదు కోసం ఎల్లప్పుడూ లేబుల్ చూడండి లేదా వ్యవసాయ అధికారిని సంప్రదించండి.'
        );
        break;

      case 'ml':
        parts.push(`ഉൽപ്പന്നം: ${name}.`);
        if (ingredient) parts.push(`സജീവ ഘടകം: ${ingredient}.`);
        if (result.what_it_is) parts.push(result.what_it_is);
        if (result.target_pests && result.target_pests.length > 0) {
          parts.push(`കീടങ്ങൾ: ${result.target_pests.slice(0, 3).join(', ')}.`);
        }
        if (result.suitable_crops && result.suitable_crops.length > 0) {
          parts.push(`അനുയോജ്യമായ വിളകൾ: ${result.suitable_crops.slice(0, 3).join(', ')}.`);
        }
        if (result.safety_guidance && result.safety_guidance.length > 0) {
          parts.push(`സുരക്ഷ: ${result.safety_guidance[0]}.`);
        }
        parts.push(
          result.dosage_notice ||
            'കൃത്യമായ അളവിനായി എല്ലായ്പ്പോഴും ലേബൽ പരിശോധിക്കുക അല്ലെങ്കിൽ കൃഷി ഉദ്യോഗസ്ഥനെ സമീപിക്കുക.'
        );
        break;

      case 'hi':
        parts.push(`उत्पाद: ${name}.`);
        if (ingredient) parts.push(`सक्रिय घटक: ${ingredient}.`);
        if (result.what_it_is) parts.push(result.what_it_is);
        if (result.target_pests && result.target_pests.length > 0) {
          parts.push(`लक्षित कीट: ${result.target_pests.slice(0, 3).join(', ')}.`);
        }
        if (result.suitable_crops && result.suitable_crops.length > 0) {
          parts.push(`उपयुक्त फसलें: ${result.suitable_crops.slice(0, 3).join(', ')}.`);
        }
        if (result.safety_guidance && result.safety_guidance.length > 0) {
          parts.push(`सुरक्षा निर्देश: ${result.safety_guidance[0]}.`);
        }
        parts.push(
          result.dosage_notice ||
            'सटीक खुराक के लिए हमेशा पैकेट का लेबल देखें या स्थानीय कृषि अधिकारी से संपर्क करें।'
        );
        break;

      default:
        parts.push(`Product: ${name}.`);
        if (ingredient) parts.push(`Active ingredient: ${ingredient}.`);
        if (result.what_it_is) parts.push(result.what_it_is);
        if (result.target_pests && result.target_pests.length > 0) {
          parts.push(`Target pests: ${result.target_pests.slice(0, 3).join(', ')}.`);
        }
        if (result.suitable_crops && result.suitable_crops.length > 0) {
          parts.push(`Suitable crops: ${result.suitable_crops.slice(0, 3).join(', ')}.`);
        }
        if (result.safety_guidance && result.safety_guidance.length > 0) {
          parts.push(`Safety precaution: ${result.safety_guidance[0]}.`);
        }
        parts.push(
          result.dosage_notice ||
            'Always check the printed package label or consult a local agriculture officer for exact dosage.'
        );
        break;
    }

    if (result.crop_compatibility && result.crop_compatibility.note) {
      parts.push(result.crop_compatibility.note);
    }

    return parts.join(' ');
  },
};
