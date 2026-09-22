import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { CROPS_CONFIG, isCropAiModelVerified, CropConfig } from '../config/crops';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';
import localDiseasesData from '../knowledge/localDiseases.json';

export const CropPreparationScreen = ({ route, navigation }: any) => {
  const { t, language } = useI18n();
  const { cropId, crop, cropDisplayName: routeCropDisplayName } = route.params || {};

  const [showCropGuide, setShowCropGuide] = useState(false);

  // 1. Resolve crop configuration dynamically from CROPS_CONFIG
  const cropConfig: CropConfig | undefined = useMemo(() => {
    if (!cropId && !crop) return undefined;
    return CROPS_CONFIG.find(
      (c) =>
        (cropId && c.id === cropId) ||
        (crop && c.rawName.toLowerCase() === String(crop).toLowerCase()) ||
        (crop && c.id === String(crop).toLowerCase())
    );
  }, [cropId, crop]);

  // Dynamic localized crop name
  const cropDisplayName =
    routeCropDisplayName ||
    (cropConfig ? t(cropConfig.nameKey) : crop || 'Crop');

  // 2. Real Model Status Check
  const isVerified = isCropAiModelVerified(cropConfig?.id || cropId);

  // 3. Look up verified offline agronomic disease knowledge
  const diseaseList = useMemo(() => {
    if (!cropConfig) return [];
    const cropsDict = localDiseasesData.crops as Record<string, any[]>;
    const raw = cropConfig.rawName;
    const cid = cropConfig.id;

    if (cropsDict[raw]) return cropsDict[raw];

    const matchKey = Object.keys(cropsDict).find(
      (k) =>
        k.toLowerCase() === raw.toLowerCase() ||
        k.toLowerCase().replace(/ /g, '_') === cid ||
        cid.includes(k.toLowerCase().replace(/ /g, '_'))
    );
    return matchKey ? cropsDict[matchKey] : [];
  }, [cropConfig]);

  const hasCropKnowledge = diseaseList.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader onNotificationPress={() => navigation.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Navigation Button */}
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>{t('backToCrops')}</Text>
        </TouchableOpacity>

        {/* Hero Card Container */}
        <View style={styles.heroCard}>
          {/* Actual Crop Image in Soft-Tinted Frame */}
          <View style={styles.cropImageOuter}>
            <View style={styles.cropImageWrapper}>
              {cropConfig?.image ? (
                <Image
                  source={cropConfig.image}
                  style={styles.cropImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.cropPlaceholderIcon}>🌱</Text>
              )}
            </View>
          </View>

          {/* Crop Name & Category Badge */}
          <View style={styles.cropTitleRow}>
            <Text style={styles.cropNameHeading}>{cropDisplayName}</Text>
            {cropConfig?.category && (
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>
                  {cropConfig.category.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Status Badge Pill */}
          <View
            style={[
              styles.statusBadge,
              isVerified ? styles.statusBadgeVerified : styles.statusBadgePrep,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isVerified ? styles.statusDotVerified : styles.statusDotPrep,
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                isVerified
                  ? styles.statusBadgeTextVerified
                  : styles.statusBadgeTextPrep,
              ]}
            >
              {isVerified ? t('aiDiagnosisAvailable') : t('aiPrepBadge')}
            </Text>
          </View>

          {/* Heading */}
          <Text style={styles.mainHeading}>
            {isVerified
              ? t('aiDiagnosisAvailable')
              : t('aiPrepTitle')}
          </Text>

          {/* Dynamic Explanation for the Specific Crop */}
          <Text style={styles.cropSubtitle}>
            {isVerified
              ? t('aiDiagnosisAvailableSubtitle', { crop: cropDisplayName })
              : t('aiPrepCropDescription', { crop: cropDisplayName })}
          </Text>

          {!isVerified && (
            <Text style={styles.cropExplanation}>
              {t('aiPrepExplanation')}
            </Text>
          )}

          {/* Primary & Secondary Buttons */}
          <View style={styles.buttonGroup}>
            {isVerified ? (
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('CameraCapture', {
                    crop: cropConfig?.rawName || crop,
                    cropDisplayName,
                    cropId: cropConfig?.id || cropId,
                  })
                }
              >
                <Text style={styles.primaryButtonIcon}>📸</Text>
                <Text style={styles.primaryButtonText}>
                  {t('startDiagnosis')}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Primary: Find Crop Expert */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Nearby Help')}
                >
                  <Text style={styles.primaryButtonIcon}>📞</Text>
                  <Text style={styles.primaryButtonText}>
                    {t('findCropExpert')}
                  </Text>
                </TouchableOpacity>

                {/* Optional: View Crop Guide (if verified knowledge exists) */}
                {hasCropKnowledge && (
                  <TouchableOpacity
                    style={styles.guideButton}
                    activeOpacity={0.8}
                    onPress={() => setShowCropGuide(!showCropGuide)}
                  >
                    <Text style={styles.guideButtonIcon}>
                      {showCropGuide ? '📖' : '📋'}
                    </Text>
                    <Text style={styles.guideButtonText}>
                      {showCropGuide
                        ? t('hideCropGuide')
                        : t('viewCropGuide')}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Secondary: Back to Crops */}
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.75}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.secondaryButtonText}>
                    {t('backToCrops')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Expandable Crop Disease Guide (Local Agronomic Knowledge) */}
        {showCropGuide && (
          <View style={styles.knowledgeCard}>
            <View style={styles.knowledgeHeaderRow}>
              <Text style={styles.knowledgeSectionIcon}>🌿</Text>
              <Text style={styles.knowledgeTitle}>
                {t('cropGuideTitle', { crop: cropDisplayName })}
              </Text>
            </View>

            <Text style={styles.knowledgeSubtitle}>
              {t('commonDiseasesTitle')}
            </Text>

            {diseaseList.map((item, idx) => {
              // Localized disease translation if available
              const trans = item.translations?.[language];
              const diseaseName = trans?.disease || item.disease;
              const symptoms = trans?.symptoms || item.symptoms || [];
              const recommendations =
                trans?.recommendations || item.recommendations || [];

              return (
                <View key={item.id || idx} style={styles.diseaseItem}>
                  <View style={styles.diseaseHeader}>
                    <Text style={styles.diseaseNumber}>{idx + 1}.</Text>
                    <Text style={styles.diseaseName}>{diseaseName}</Text>
                  </View>

                  {symptoms.length > 0 && (
                    <View style={styles.symptomsBox}>
                      <Text style={styles.boxLabel}>Symptoms:</Text>
                      {symptoms.slice(0, 2).map((s: string, sIdx: number) => (
                        <Text key={sIdx} style={styles.bulletText}>
                          • {s}
                        </Text>
                      ))}
                    </View>
                  )}

                  {recommendations.length > 0 && (
                    <View style={styles.recomBox}>
                      <Text style={styles.boxLabelGreen}>Recommended Action:</Text>
                      {recommendations.slice(0, 2).map((r: string, rIdx: number) => (
                        <Text key={rIdx} style={styles.bulletTextGreen}>
                          ✓ {r}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Non-Blocking Agricultural Resources Section */}
        <View style={styles.resourcesSection}>
          <Text style={styles.resourcesHeader}>
            {t('cropKnowledgeTitle', { crop: cropDisplayName })}
          </Text>

          {/* Quick Access Card 1: Pest Protection Guide */}
          <TouchableOpacity
            style={styles.resourceCard}
            activeOpacity={0.82}
            onPress={() =>
              navigation.navigate('PestExplorer', {
                filterCrop: cropConfig?.rawName || crop,
              })
            }
          >
            <View style={[styles.resourceIconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.resourceIcon}>🐛</Text>
            </View>
            <View style={styles.resourceTextWrap}>
              <Text style={styles.resourceCardTitle}>{t('viewPestExplorer')}</Text>
              <Text style={styles.resourceCardSubtitle}>
                Identify major insect pests and organic controls
              </Text>
            </View>
            <Text style={styles.resourceChevron}>›</Text>
          </TouchableOpacity>

          {/* Quick Access Card 2: Nutrient Deficiencies */}
          <TouchableOpacity
            style={styles.resourceCard}
            activeOpacity={0.82}
            onPress={() =>
              navigation.navigate('NutrientGuide', {
                filterCrop: cropConfig?.rawName || crop,
              })
            }
          >
            <View style={[styles.resourceIconCircle, { backgroundColor: '#E1F5FE' }]}>
              <Text style={styles.resourceIcon}>🧪</Text>
            </View>
            <View style={styles.resourceTextWrap}>
              <Text style={styles.resourceCardTitle}>{t('viewNutrientGuide')}</Text>
              <Text style={styles.resourceCardSubtitle}>
                Identify leaf chlorosis, NPK, and micro-nutrient signs
              </Text>
            </View>
            <Text style={styles.resourceChevron}>›</Text>
          </TouchableOpacity>

          {/* Quick Access Card 3: Crop Doctors & University KVKs */}
          <TouchableOpacity
            style={styles.resourceCard}
            activeOpacity={0.82}
            onPress={() => navigation.navigate('Nearby Help')}
          >
            <View style={[styles.resourceIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.resourceIcon}>🏛️</Text>
            </View>
            <View style={styles.resourceTextWrap}>
              <Text style={styles.resourceCardTitle}>
                {t('cropDoctorsAndExperts')}
              </Text>
              <Text style={styles.resourceCardSubtitle}>
                {t('expertConsultNotice')}
              </Text>
            </View>
            <Text style={styles.resourceChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Landscape Illustration */}
        <LandscapeBanner />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
    marginRight: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EDE8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 18,
  },
  cropImageOuter: {
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropImageWrapper: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#F1F7F2',
    borderWidth: 2,
    borderColor: '#D7E9DA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cropImage: {
    width: 82,
    height: 82,
  },
  cropPlaceholderIcon: {
    fontSize: 48,
  },
  cropTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
    gap: 8,
  },
  cropNameHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#162836',
  },
  categoryPill: {
    backgroundColor: '#EDF5EE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4E8D7',
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  statusBadgePrep: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  statusBadgeVerified: {
    backgroundColor: '#E8F8EE',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotPrep: {
    backgroundColor: '#2E7D32',
  },
  statusDotVerified: {
    backgroundColor: '#1B5E20',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusBadgeTextPrep: {
    color: '#2E7D32',
  },
  statusBadgeTextVerified: {
    color: '#1B5E20',
  },
  mainHeading: {
    fontSize: 23,
    fontWeight: '800',
    color: '#162836',
    textAlign: 'center',
    marginBottom: 8,
  },
  cropSubtitle: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  cropExplanation: {
    fontSize: 14,
    color: '#5A6E60',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonIcon: {
    fontSize: 17,
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  guideButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7F1',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  guideButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  guideButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#5A6E60',
  },
  knowledgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8E2',
    marginBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  knowledgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  knowledgeSectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  knowledgeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#162836',
  },
  knowledgeSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#78909C',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diseaseItem: {
    backgroundColor: '#FBFDFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EDF2ED',
    marginBottom: 10,
  },
  diseaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diseaseNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
    marginRight: 6,
  },
  diseaseName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#162836',
    flex: 1,
  },
  symptomsBox: {
    marginBottom: 6,
    paddingLeft: 4,
  },
  boxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 2,
  },
  bulletText: {
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 18,
  },
  recomBox: {
    paddingLeft: 4,
  },
  boxLabelGreen: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 2,
  },
  bulletTextGreen: {
    fontSize: 12.5,
    color: '#2E7D32',
    lineHeight: 18,
  },
  resourcesSection: {
    marginBottom: 12,
  },
  resourcesHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EDE8',
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  resourceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceIcon: {
    fontSize: 20,
  },
  resourceTextWrap: {
    flex: 1,
  },
  resourceCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 2,
  },
  resourceCardSubtitle: {
    fontSize: 12,
    color: '#5A6E60',
    lineHeight: 16,
  },
  resourceChevron: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
    marginLeft: 6,
  },
});
