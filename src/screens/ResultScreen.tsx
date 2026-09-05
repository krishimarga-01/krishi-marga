import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NormalizedResult } from '../models/index';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { ExpertService } from '../services/expertService';

export const ResultScreen = ({ route, navigation }: any) => {
  const { result, crop, imageUris } = route.params as { result: NormalizedResult; crop: string; imageUris: string[] };
  const { t } = useI18n();

  const isHealthy = result.health_status === 'Healthy';
  const isLowConfidence = result.confidence < 0.5;

  const getSeverityStyle = (sev: string) => {
    if (sev === 'High') return styles.sevHigh;
    if (sev === 'Moderate') return styles.sevModerate;
    return styles.sevLow;
  };

  const handleSharePdf = () => {
    Alert.alert('Share PDF', 'Agronomic PDF summary export prepared for ' + crop + ' diagnosis.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View style={styles.cropBadge}>
            <Text style={styles.cropBadgeText}>{crop}</Text>
          </View>
          <View style={[styles.sourceBadge, result.analysis_source === 'online' ? styles.sourceOnline : styles.sourceOffline]}>
            <Text style={styles.sourceText}>
              {result.analysis_source === 'online' ? 'Online Analysis' : 'Offline Analysis'}
            </Text>
          </View>
        </View>

        {/* Main Disease Card */}
        <View style={[styles.mainCard, isHealthy ? styles.healthyCard : styles.diseasedCard]}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{isHealthy ? 'Crop Health: Good' : 'Possible Disease Detected'}</Text>
            {!isHealthy && (
              <View style={[styles.sevBadge, getSeverityStyle(result.severity)]}>
                <Text style={styles.sevBadgeText}>{result.severity} Severity</Text>
              </View>
            )}
          </View>

          <Text style={styles.diseaseName}>{result.disease}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Confidence</Text>
              <Text style={[styles.metaVal, isLowConfidence ? styles.valLow : styles.valHigh]}>
                {result.confidence_level} ({(result.confidence * 100).toFixed(0)}%)
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Photos Analyzed</Text>
              <Text style={styles.metaVal}>{imageUris.length} photos</Text>
            </View>
          </View>
        </View>

        {/* Low Confidence Uncertainty Notice */}
        {isLowConfidence && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ We are not fully sure. Try taking clearer photos in daylight or contact an agriculture expert.</Text>
          </View>
        )}

        {/* Symptoms */}
        {result.symptoms && result.symptoms.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🔍 Symptoms Observed</Text>
            {result.symptoms.map((s, idx) => (
              <Text key={idx} style={styles.listItem}>• {s}</Text>
            ))}
          </View>
        )}

        {/* Immediate Actions */}
        {result.recommendations && result.recommendations.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🛠️ Immediate Actions (What to do)</Text>
            {result.recommendations.map((r, idx) => (
              <Text key={idx} style={styles.listItem}>• {r}</Text>
            ))}
          </View>
        )}

        {/* Prevention */}
        {result.prevention && result.prevention.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>🛡️ Prevention Guidance</Text>
            {result.prevention.map((p, idx) => (
              <Text key={idx} style={styles.listItem}>• {p}</Text>
            ))}
          </View>
        )}

        {/* Regional Advice */}
        {result.regional_advice && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>🌾 Regional Advice</Text>
            <Text style={styles.infoBoxText}>{result.regional_advice}</Text>
          </View>
        )}

        {/* 4 Bottom Action Buttons */}
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.saveBtn} onPress={() => Alert.alert('Saved', 'Inspection already recorded in My History.')}>
            <Text style={styles.saveBtnText}>💾 Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pdfBtn} onPress={handleSharePdf}>
            <Text style={styles.pdfBtnText}>📄 Share PDF</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.expertBtn} onPress={() => ExpertService.callExpert('18001801551')}>
          <Text style={styles.expertBtnText}>📞 Call Agriculture Expert</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
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
  expertBtn: { backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  expertBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  homeBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  homeBtnText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },
});