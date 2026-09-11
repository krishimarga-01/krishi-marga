import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NormalizedResult } from '../models/index';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { ExpertService } from '../services/expertService';

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
  const { t } = useI18n();

  const isHealthy = (result.health_status || '').toLowerCase() === 'healthy';
  const isLowConfidence = result.confidence < 0.5;

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

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{t('confidence')}</Text>
              <Text style={[styles.metaVal, isLowConfidence ? styles.valLow : styles.valHigh]}>
                {getLocalizedConfidence(result.confidence_level)} ({(result.confidence * 100).toFixed(0)}%)
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

        {/* Symptoms */}
        {result.symptoms && result.symptoms.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🔍 {t('symptomsObserved')}</Text>
            {result.symptoms.map((s, idx) => (
              <Text key={idx} style={styles.listItem}>• {s}</Text>
            ))}
          </View>
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
          <TouchableOpacity style={styles.saveBtn} onPress={() => Alert.alert(t('savedTitle'), t('savedMessage'))}>
            <Text style={styles.saveBtnText}>💾 {t('saveCase')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pdfBtn} onPress={handleSharePdf}>
            <Text style={styles.pdfBtnText}>📄 {t('sharePdf')}</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Action: Find Nearby Crop Doctor for this crop */}
        <TouchableOpacity
          style={styles.cropDoctorBtn}
          activeOpacity={0.85}
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
          onPress={() => ExpertService.callExpert('18001801551')}
        >
          <Text style={styles.expertBtnText}>📞 {t('callKisanHelpline')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.homeBtnText}>{t('backToHome')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  statusLabel: { fontSize: 13, textTransform: 'uppercase', color: Colors.textMuted, fontWeight: '600' },
  sevBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sevHigh: { backgroundColor: '#FEE2E2' },
  sevModerate: { backgroundColor: '#FEF3C7' },
  sevLow: { backgroundColor: '#DCFCE7' },
  sevBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  diseaseName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginVertical: 8 },
  metaRow: { flexDirection: 'row', marginTop: 6 },
  metaItem: { marginRight: 24 },
  metaLabel: { fontSize: 12, color: Colors.textMuted },
  metaVal: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  valHigh: { color: Colors.primary },
  valLow: { color: Colors.danger },
  warningBox: { backgroundColor: '#FEF2F2', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.danger, marginBottom: 14 },
  warningTitle: { fontSize: 14, color: Colors.danger, lineHeight: 20, fontWeight: '600' },
  sectionCard: { backgroundColor: Colors.surface, padding: 16, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.cardBorder },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  listItem: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginBottom: 6 },
  infoBox: { backgroundColor: Colors.earthBeige, padding: 14, borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: Colors.cardBorder },
  infoBoxTitle: { fontSize: 14, fontWeight: '700', color: Colors.primaryDark, marginBottom: 4 },
  infoBoxText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  saveBtn: { flex: 0.48, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  pdfBtn: { flex: 0.48, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.textMuted, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  pdfBtnText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  cropDoctorBtn: {
    flexDirection: 'row',
    backgroundColor: '#047857', // Emerald green
    paddingVertical: 15,
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
  expertBtn: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.cardBorder, paddingVertical: 13, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  expertBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  homeBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  homeBtnText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
});