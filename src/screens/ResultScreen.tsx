import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NormalizedResult } from '../models/index';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { ExpertService } from '../services/expertService';
import { VoiceReadoutButton } from '../components/VoiceReadoutButton';
import { VoiceService } from '../services/voiceService';
import { OnnxEngine } from '../offline/onnxEngine';
import { IpdmGuidanceCard } from '../ipdm/components/IpdmGuidanceCard';

const cropNameKeyMap: Record<string, string> = {
  tomato: 'crop.tomato',
  paddy: 'crop.paddy',
  rice: 'crop.paddy',
  rice_leaf: 'crop.paddy',
  chilli: 'crop.chilli',
  cotton: 'crop.cotton',
  sugarcane: 'crop.sugarcane',
  coconut: 'crop.coconut',
  maize: 'crop.maize',
  corn: 'crop.maize',
  wheat: 'crop.wheat',
  coffee: 'crop.coffee',
  tea: 'crop.tea',
  rubber: 'crop.rubber',
  tobacco: 'crop.tobacco',
  black_pepper: 'crop.blackPepper',
  'black pepper': 'crop.blackPepper',
  cardamom: 'crop.cardamom',
  turmeric: 'crop.turmeric',
  arecanut: 'crop.arecanut',
  'betel nut': 'crop.arecanut',
  cashew: 'crop.cashew',
  ragi: 'crop.ragi',
  potato: 'crop.potato',
  cucumber: 'crop.cucumber',
  brinjal: 'crop.brinjal',
  cabbage: 'crop.cabbage',
  ginger: 'crop.ginger',
  banana: 'crop.banana',
  banana_leaf: 'crop.banana',
  guava: 'crop.guava',
  mango: 'crop.mango',
  grapes: 'crop.grapes',
  pomegranate: 'crop.pomegranate',
  groundnut: 'crop.groundnut',
  soybean: 'crop.soybean',
  bitter_gourd: 'crop.bitterGourd',
  'bitter gourd': 'crop.bitterGourd',
};


export const ResultScreen = ({ route, navigation }: any) => {
  const { result, crop, imageUris } = route.params as { result: NormalizedResult; crop: string; imageUris: string[] };
  const { t, language } = useI18n();

  const isHealthy = (result.health_status || '').toLowerCase() === 'healthy';
  const isLowConfidence = result.confidence < 0.5;
  const isMediumConfidence = result.confidence >= 0.5 && result.confidence < 0.75;

  const differential =
    (result as any).differential_assessment ||
    (OnnxEngine as any).getDifferentialReference?.(crop || result.crop, result.disease);
  const hasDifferential = differential && differential.status === 'AVAILABLE';

  const getLookalikeBadgeStyle = (type: string) => {
    switch (type) {
      case 'NUTRIENT':
        return { bg: '#DCFCE7', text: '#166534', label: '🌱 NUTRIENT' };
      case 'PEST':
        return { bg: '#FEE2E2', text: '#991B1B', label: '🐛 PEST' };
      case 'PHYSIOLOGICAL':
        return { bg: '#F3E8FF', text: '#6B21A8', label: '☀️ PHYSIOLOGICAL' };
      case 'DISEASE':
      default:
        return { bg: '#FEF3C7', text: '#B45309', label: '🔬 DISEASE' };
    }
  };

  const getLocalizedCrop = (rawCrop: string) => {
    if (!rawCrop) return '';
    const key = cropNameKeyMap[rawCrop.toLowerCase().trim()];
    return key ? t(key) : rawCrop;
  };

  const getSeverityStyle = (sev: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'high' || s === 'severe') return styles.sevHigh;
    if (s === 'moderate' || s === 'medium') return styles.sevModerate;
    return styles.sevLow;
  };

  const getLocalizedSeverity = (sev: string) => {
    const s = (sev || '').toLowerCase();
    if (s === 'severe' || s === 'high') return t('severitySevere');
    if (s === 'moderate' || s === 'medium') return t('severityModerate');
    if (s === 'mild' || s === 'low') return t('severityMild');
    if (s === 'none') return t('severityNone');
    return sev;
  };

  const getLocalizedConfidence = (lvl: string) => {
    const l = (lvl || '').toLowerCase();
    if (l === 'high') return t('confidenceHigh');
    if (l === 'medium' || l === 'moderate') return t('confidenceMedium');
    if (l === 'low') return t('confidenceLow');
    return lvl;
  };

  const displayCrop = getLocalizedCrop(crop) || getLocalizedCrop(result.crop);

  const handleSharePdf = () => {
    Alert.alert(t('sharePdf'), `${t('pdfExportNotice')} (${displayCrop})`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.cropBadge}>
            <Text style={styles.cropBadgeText}>{displayCrop}</Text>
          </View>
          <View style={[styles.sourceBadge, result.analysis_source === 'online' ? styles.sourceOnline : styles.sourceOffline]}>
            <Text style={styles.sourceText}>
              {result.analysis_source === 'online' ? t('sourceOnline') : t('sourceOffline')}
            </Text>
          </View>
        </View>

        {/* Multilingual Voice Readout Button */}
        <VoiceReadoutButton
          getTextToSpeak={() =>
            VoiceService.buildDiseaseSpeechSummary(result, displayCrop, language)
          }
          language={language}
        />

        {/* Main Disease Card */}
        <View style={[styles.mainCard, isHealthy ? styles.healthyCard : styles.diseasedCard]}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{isHealthy ? t('healthGood') : t('possibleDisease')}</Text>
            {!isHealthy && (
              <View style={[styles.sevBadge, getSeverityStyle(result.severity)]}>
                <Text style={styles.sevBadgeText}>{getLocalizedSeverity(result.severity)} {t('severity')}</Text>
              </View>
            )}
          </View>

          <Text style={styles.diseaseName}>{result.disease}</Text>

          {/* Knowledge-base results are labelled so they are never mistaken for
              an AI diagnosis. Uses the existing card styles; no redesign. */}
          {result.is_diagnosis === false && !!result.source_note && (
            <Text style={styles.sourceNoteText}>{result.source_note}</Text>
          )}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t('confidence')}</Text>
              <Text style={[styles.metaVal, isLowConfidence ? styles.valLow : styles.valHigh]}>
                {result.is_diagnosis === false
                  ? '—'
                  : `${getLocalizedConfidence(result.confidence_level)} (${(result.confidence * 100).toFixed(0)}%)`}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t('photosAnalyzed')}</Text>
              <Text style={styles.metaVal}>{imageUris.length} {t('photosCount')}</Text>
            </View>
          </View>
        </View>

        {/* Low Confidence Uncertainty Notice */}
        {isLowConfidence && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ {t('lowConfidenceWarning')}</Text>
          </View>
        )}

        {/* Confidence-Aware Differential Warning Banner */}
        {hasDifferential && !isHealthy && (
          isLowConfidence ? (
            <View style={styles.diffWarningBoxLow}>
              <Text style={styles.diffWarningTitleLow}>⚠️ {t('confidenceNoticeLow')}</Text>
            </View>
          ) : isMediumConfidence ? (
            <View style={styles.diffWarningBoxMed}>
              <Text style={styles.diffWarningTitleMed}>ℹ️ {t('confidenceNoticeMedium')}</Text>
            </View>
          ) : null
        )}

        {/* Symptoms */}
        {result.symptoms && result.symptoms.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🔍 {t('symptomsObserved')}</Text>
            {result.symptoms.map((s, idx) => (
              <Text key={idx} style={styles.listItem}>• {s}</Text>
            ))}
          </View>
        )}

        {/* 🔍 DIFFERENTIAL DIAGNOSIS & LOOK-ALIKES CARD */}
        {hasDifferential && !isHealthy && (
          <View style={[styles.sectionCard, styles.diffCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.diffTitle}>🔍 {t('differentialTitle')}</Text>
                <Text style={styles.diffSubtitle}>{t('differentialSubtitle')}</Text>
              </View>
              <View style={[styles.statusTag, styles.tagSuccess]}>
                <Text style={styles.statusTagText}>ICAR VERIFIED</Text>
              </View>
            </View>

            {differential.condition_name && (
              <Text style={styles.diffConditionTarget}>
                Reference: {differential.condition_name}
              </Text>
            )}

            {/* Look-Alike Conditions */}
            {differential.lookalikes && differential.lookalikes.length > 0 && (
              <View style={styles.lookalikeSection}>
                <Text style={styles.subDetailLabel}>{t('lookalikesTitle')}:</Text>
                {differential.lookalikes.map((item: any, idx: number) => {
                  const badge = getLookalikeBadgeStyle(item.type);
                  return (
                    <View key={idx} style={styles.lookalikeCard}>
                      <View style={styles.lookalikeHeader}>
                        <Text style={styles.lookalikeName}>{item.name}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.typeBadgeText, { color: badge.text }]}>{badge.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.overlapText}>
                        <Text style={styles.boldSubLabel}>Overlapping Signs: </Text>{item.overlap_symptoms}
                      </Text>
                      <View style={styles.distinguishBox}>
                        <Text style={styles.distinguishLabel}>⚡ {t('distinguishingFeatureLabel')}</Text>
                        <Text style={styles.distinguishText}>{item.distinguishing_feature}</Text>
                      </View>
                      <Text style={styles.confirmAdviceText}>
                        <Text style={styles.boldSubLabel}>🔬 {t('confirmationAdviceLabel')} </Text>{item.confirmation_advice}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Symptom Cross-Check */}
            {differential.symptom_crosscheck && (
              <View style={styles.crosscheckSection}>
                <Text style={styles.subDetailLabel}>{t('symptomCrosscheckTitle')}:</Text>

                {differential.symptom_crosscheck.expected_present && differential.symptom_crosscheck.expected_present.length > 0 && (
                  <View style={styles.symptomGroup}>
                    <Text style={styles.expectedTitle}>{t('expectedSymptomsLabel')}</Text>
                    {differential.symptom_crosscheck.expected_present.map((sym: any, idx: number) => (
                      <Text key={idx} style={styles.crosscheckExpectedItem}>✅  {sym}</Text>
                    ))}
                  </View>
                )}

                {differential.symptom_crosscheck.contradicting_symptoms && differential.symptom_crosscheck.contradicting_symptoms.length > 0 && (
                  <View style={styles.symptomGroup}>
                    <Text style={styles.contradictingTitle}>{t('contradictingSymptomsLabel')}</Text>
                    {differential.symptom_crosscheck.contradicting_symptoms.map((sym: any, idx: number) => (
                      <Text key={idx} style={styles.crosscheckContradictItem}>❌  {sym}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            <Text style={styles.sourceCreditText}>
              Evidence Source: {differential.source_verification || 'ICAR-IIHR Bengaluru / TNAU Agritech'}
            </Text>
          </View>
        )}

        {/* 📋 FARMER FIELD ACTION CHECKLIST */}
        {hasDifferential && differential.farmer_action_checklist && differential.farmer_action_checklist.length > 0 && !isHealthy && (
          <View style={[styles.sectionCard, styles.checklistCard]}>
            <Text style={styles.checklistTitle}>📋 {t('farmerChecklistTitle')}</Text>
            {differential.farmer_action_checklist.map((action: any, idx: number) => (
              <View key={idx} style={styles.checklistItemRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.checklistItemText}>{action}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 🐛 PEST CHECK CARD */}
        {result.pest_assessment && (
          <View style={[styles.sectionCard, styles.pestCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.pestTitle}>🐛 {t('pestCheckTitle') || 'Pest Infestation Assessment'}</Text>
              <View style={[styles.statusTag, result.pest_assessment.status === 'AI_AVAILABLE' ? styles.tagSuccess : styles.tagMuted]}>
                <Text style={styles.statusTagText}>
                  {result.pest_assessment.status === 'AI_AVAILABLE' ? 'AI VERIFIED' : 'KNOWLEDGE BASE'}
                </Text>
              </View>
            </View>

            {result.pest_assessment.pest_detected ? (
              <View>
                <Text style={styles.primaryTargetText}>
                  {result.pest_assessment.pest_detected} {result.pest_assessment.scientific_name ? `(${result.pest_assessment.scientific_name})` : ''}
                </Text>

                {result.pest_assessment.is_disease_vector && result.pest_assessment.vector_explanation && (
                  <View style={styles.vectorAlertBox}>
                    <Text style={styles.vectorAlertTitle}>⚠️ {t('diseaseVectorNotice') || 'Disease Vector Identified'}</Text>
                    <Text style={styles.vectorAlertText}>{result.pest_assessment.vector_explanation}</Text>
                  </View>
                )}

                {result.pest_assessment.damage_symptoms && result.pest_assessment.damage_symptoms.length > 0 && (
                  <View style={styles.subDetailBox}>
                    <Text style={styles.subDetailLabel}>Damage Symptoms:</Text>
                    {result.pest_assessment.damage_symptoms.map((dmg, idx) => (
                      <Text key={idx} style={styles.listItem}>• {dmg}</Text>
                    ))}
                  </View>
                )}

                {result.pest_assessment.management && result.pest_assessment.management.length > 0 && (
                  <View style={styles.subDetailBox}>
                    <Text style={styles.subDetailLabel}>Recommended Pest Management:</Text>
                    {result.pest_assessment.management.map((m, idx) => (
                      <Text key={idx} style={styles.listItem}>• {m}</Text>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.unavailableText}>
                {t('noPestDataDesc') || 'No verified pest infestation detected in this inspection.'}
              </Text>
            )}
            <Text style={styles.sourceCreditText}>Source: {result.pest_assessment.source_verification || 'ICAR-NBAIR / CIBRC'}</Text>
          </View>
        )}

        {/* 🌱 NUTRIENT DEFICIENCY CARD */}
        {result.nutrient_assessment && (
          <View style={[styles.sectionCard, styles.nutrientCard]}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.nutrientTitle}>🌱 {t('nutrientCheckTitle') || 'Nutrient Deficiency Assessment'}</Text>
              <View style={[styles.statusTag, result.nutrient_assessment.status === 'AI_AVAILABLE' ? styles.tagSuccess : styles.tagMuted]}>
                <Text style={styles.statusTagText}>
                  {result.nutrient_assessment.status === 'AI_AVAILABLE' ? 'AI VERIFIED' : 'KNOWLEDGE BASE'}
                </Text>
              </View>
            </View>

            {result.nutrient_assessment.deficiency_detected ? (
              <View>
                <Text style={styles.primaryTargetText}>
                  {result.nutrient_assessment.deficiency_detected} ({result.nutrient_assessment.nutrient_name})
                </Text>

                {result.nutrient_assessment.visual_symptoms && result.nutrient_assessment.visual_symptoms.length > 0 && (
                  <View style={styles.subDetailBox}>
                    <Text style={styles.subDetailLabel}>Visual Foliar Symptoms:</Text>
                    {result.nutrient_assessment.visual_symptoms.map((sym, idx) => (
                      <Text key={idx} style={styles.listItem}>• {sym}</Text>
                    ))}
                  </View>
                )}

                {result.nutrient_assessment.soil_relationship && (
                  <View style={styles.soilBox}>
                    <Text style={styles.subDetailLabel}>Soil & Cause Relationship:</Text>
                    <Text style={styles.soilText}>{result.nutrient_assessment.soil_relationship}</Text>
                  </View>
                )}

                {result.nutrient_assessment.management && result.nutrient_assessment.management.length > 0 && (
                  <View style={styles.subDetailBox}>
                    <Text style={styles.subDetailLabel}>Soil & Foliar Correction:</Text>
                    {result.nutrient_assessment.management.map((m, idx) => (
                      <Text key={idx} style={styles.listItem}>• {m}</Text>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.unavailableText}>
                {t('noNutrientDataDesc') || 'No major nutrient deficiency observed on sampled foliage.'}
              </Text>
            )}
            <Text style={styles.sourceCreditText}>Source: {result.nutrient_assessment.source_verification || 'ICAR-IISS / TNAU Agri Portal'}</Text>
          </View>
        )}

        {/* 💊 CROP PROTECTION (CIBRC VERIFIED) */}
        {result.crop_protection && result.crop_protection.active_ingredients && result.crop_protection.active_ingredients.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>💊 {t('cropProtectionTitle') || 'Crop Protection & CIBRC Guidance'}</Text>
            <Text style={styles.subDetailLabel}>Verified Active Ingredients:</Text>
            {result.crop_protection.active_ingredients.map((ing, idx) => (
              <Text key={idx} style={styles.listItem}>• {ing}</Text>
            ))}
            <Text style={styles.protectionNote}>
              Guidance: {result.crop_protection.application_guidance} (Safety Waiting Interval: {result.crop_protection.safety_interval_days || 7} days)
            </Text>
          </View>
        )}

        {/* 🧪 FERTILIZER & SOIL ADVISORY */}
        {result.fertilizer_advisory && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🧪 {t('fertilizerAdvisoryTitle') || 'Fertilizer & Soil Advisory'}</Text>
            <Text style={styles.subDetailLabel}>Soil Advisory:</Text>
            <Text style={styles.soilText}>{result.fertilizer_advisory.soil_link}</Text>
            {result.fertilizer_advisory.recommended_npk_ratio && (
              <Text style={styles.npkText}>Standard NPK Guideline: {result.fertilizer_advisory.recommended_npk_ratio}</Text>
            )}
          </View>
        )}

        {/* 🌿 INTEGRATED PEST & DISEASE MANAGEMENT (IPDM) LAYER 1 */}
        {!isHealthy && (
          <IpdmGuidanceCard
            crop={crop}
            condition={result.disease}
            confidence={result.confidence}
          />
        )}

        {/* Immediate Actions */}
        {result.recommendations && result.recommendations.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🛠️ {t('recommendations')}</Text>
            {result.recommendations.map((r, idx) => (
              <Text key={idx} style={styles.listItem}>• {r}</Text>
            ))}
          </View>
        )}

        {/* Prevention */}
        {result.prevention && result.prevention.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🛡️ {t('prevention')}</Text>
            {result.prevention.map((p, idx) => (
              <Text key={idx} style={styles.listItem}>• {p}</Text>
            ))}
          </View>
        )}

        {/* Regional Advice */}
        {result.regional_advice && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>🌾 {t('regionalAdvice')}</Text>
            <Text style={styles.infoBoxText}>{result.regional_advice}</Text>
          </View>
        )}

        {/* Farmer Advisory Message */}
        {result.user_message && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>📢 {t('tagline')}</Text>
            <Text style={styles.infoBoxText}>{result.user_message}</Text>
          </View>
        )}

        {/* 4 Bottom Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('saveCase')}
            onPress={() => Alert.alert(t('savedTitle'), t('savedMessage'))}
          >
            <Text style={styles.saveBtnText}>💾 {t('saveCase')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pdfBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('sharePdf')}
            onPress={handleSharePdf}
          >
            <Text style={styles.pdfBtnText}>📄 {t('sharePdf')}</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Action: Find Nearby Crop Doctor for this crop */}
        <TouchableOpacity
          style={styles.cropDoctorBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${t('findDoctorForCrop')} ${displayCrop}`}
          onPress={() => navigation.navigate('MainTabs', {
            screen: 'Nearby Help',
            params: { selectedCrop: crop }
          })}
        >
          <Text style={styles.cropDoctorBtnEmoji}>🩺</Text>
          <Text style={styles.cropDoctorBtnText}>{t('findDoctorForCrop')} {displayCrop}</Text>
        </TouchableOpacity>

        {/* Secondary Action: Direct Toll-free Kisan Helpline Call */}
        <TouchableOpacity
          style={styles.expertBtn}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t('callKisanHelpline')}
          onPress={() => ExpertService.callExpert('18001801551')}
        >
          <Text style={styles.expertBtnText}>📞 {t('callKisanHelpline')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('backToHome')}
          onPress={() => navigation.navigate('MainTabs')}
        >
          <Text style={styles.homeBtnText}>{t('backToHome')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sourceNoteText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#5A6B5F',
    marginTop: 6,
    marginBottom: 2,
  },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 18 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  cropBadge: { backgroundColor: Colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  cropBadgeText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  sourceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  sourceOnline: { backgroundColor: '#DCFCE7' },
  sourceOffline: { backgroundColor: '#FEF3C7' },
  sourceText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  mainCard: { padding: 18, borderRadius: 16, marginBottom: 14, borderWidth: 1.5 },
  healthyCard: { backgroundColor: '#F0FDF4', borderColor: Colors.success },
  diseasedCard: { backgroundColor: Colors.surface, borderColor: Colors.cardBorder },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { fontSize: 13, textTransform: 'uppercase', color: '#4B5563', fontWeight: '700' },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sevHigh: { backgroundColor: '#FEE2E2' },
  sevModerate: { backgroundColor: '#FEF3C7' },
  sevLow: { backgroundColor: '#DCFCE7' },
  sevBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  diseaseName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginVertical: 8 },
  metaRow: { flexDirection: 'row', marginTop: 6 },
  metaItem: { marginRight: 24 },
  metaLabel: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  metaVal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  valHigh: { color: Colors.primary },
  valLow: { color: Colors.danger },
  warningBox: { backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.danger, marginBottom: 14 },
  warningTitle: { fontSize: 14, color: Colors.danger, lineHeight: 20, fontWeight: '600' },
  sectionCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.cardBorder },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  pestCard: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  nutrientCard: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pestTitle: { fontSize: 16, fontWeight: '800', color: '#B45309' },
  nutrientTitle: { fontSize: 16, fontWeight: '800', color: '#047857' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagSuccess: { backgroundColor: '#DCFCE7' },
  tagMuted: { backgroundColor: '#E2E8F0' },
  statusTagText: { fontSize: 10, fontWeight: '800', color: '#1E293B' },
  primaryTargetText: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  vectorAlertBox: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#F87171', marginVertical: 6 },
  vectorAlertTitle: { fontSize: 13, fontWeight: '700', color: '#DC2626' },
  vectorAlertText: { fontSize: 13, color: '#991B1B', marginTop: 2, lineHeight: 18 },
  subDetailBox: { marginTop: 6, marginBottom: 4 },
  subDetailLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 3 },
  soilBox: { backgroundColor: '#F1F5F9', padding: 10, borderRadius: 8, marginVertical: 6 },
  soilText: { fontSize: 13, color: '#334155', lineHeight: 19 },
  npkText: { fontSize: 13, fontWeight: '700', color: '#047857', marginTop: 4 },
  protectionNote: { fontSize: 13, color: '#374151', marginTop: 6, fontStyle: 'italic' },
  sourceCreditText: { fontSize: 11, color: '#64748B', marginTop: 8, textAlign: 'right' },
  unavailableText: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic', marginVertical: 4 },
  listItem: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 6 },
  infoBox: { backgroundColor: Colors.earthBeige, padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  infoBoxTitle: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark, marginBottom: 4 },
  infoBoxText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  saveBtn: { flex: 0.48, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, minHeight: 48, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  pdfBtn: { flex: 0.48, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: '#CBD5E1', minHeight: 48, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pdfBtnText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  cropDoctorBtn: {
    flexDirection: 'row',
    backgroundColor: '#047857', // Emerald green
    minHeight: 52,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  cropDoctorBtnEmoji: { fontSize: 18, marginRight: 8 },
  cropDoctorBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  expertBtn: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: '#CBD5E1', minHeight: 48, paddingVertical: 13, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  expertBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  homeBtn: { minHeight: 48, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  homeBtnText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
  diffWarningBoxLow: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F87171', marginBottom: 12 },
  diffWarningTitleLow: { fontSize: 13, color: '#991B1B', lineHeight: 18, fontWeight: '600' },
  diffWarningBoxMed: { backgroundColor: '#FFFBEB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FCD34D', marginBottom: 12 },
  diffWarningTitleMed: { fontSize: 13, color: '#92400E', lineHeight: 18, fontWeight: '600' },
  diffCard: { borderColor: '#3B82F6', backgroundColor: '#F8FAFC' },
  diffTitle: { fontSize: 16, fontWeight: '800', color: '#1D4ED8' },
  diffSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  diffConditionTarget: { fontSize: 13, fontWeight: '700', color: '#334155', marginVertical: 8, backgroundColor: '#E2E8F0', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, alignSelf: 'flex-start' },
  lookalikeSection: { marginTop: 4, marginBottom: 8 },
  lookalikeCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#CBD5E1' },
  lookalikeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  lookalikeName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  typeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginLeft: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '800' },
  overlapText: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 6 },
  distinguishBox: { backgroundColor: '#FEF3C7', padding: 8, borderRadius: 6, marginVertical: 4, borderWidth: 1, borderColor: '#FDE68A' },
  distinguishLabel: { fontSize: 12, fontWeight: '700', color: '#92400E', marginBottom: 2 },
  distinguishText: { fontSize: 13, color: '#78350F', lineHeight: 18, fontWeight: '600' },
  confirmAdviceText: { fontSize: 12, color: '#334155', lineHeight: 17, marginTop: 4 },
  boldSubLabel: { fontWeight: '700', color: Colors.textPrimary },
  crosscheckSection: { marginTop: 6, marginBottom: 4 },
  symptomGroup: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, marginVertical: 4, borderWidth: 1, borderColor: '#CBD5E1' },
  expectedTitle: { fontSize: 13, fontWeight: '700', color: '#166534', marginBottom: 4 },
  contradictingTitle: { fontSize: 13, fontWeight: '700', color: '#991B1B', marginBottom: 4 },
  crosscheckExpectedItem: { fontSize: 13, color: '#15803D', lineHeight: 19, marginBottom: 3 },
  crosscheckContradictItem: { fontSize: 13, color: '#B91C1C', lineHeight: 19, marginBottom: 3 },
  checklistCard: { borderColor: '#0D9488', backgroundColor: '#F0FDFA' },
  checklistTitle: { fontSize: 16, fontWeight: '800', color: '#0F766E', marginBottom: 10 },
  checklistItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  stepNumberBadge: { backgroundColor: '#0D9488', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 },
  stepNumberText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  checklistItemText: { fontSize: 14, color: '#134E4A', lineHeight: 20, flex: 1 },
});