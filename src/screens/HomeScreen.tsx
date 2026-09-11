import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { CaseStorage } from '../storage/caseStorage';
import { DiagnosisCase } from '../models/index';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';

export const HomeScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const [recentCases, setRecentCases] = useState<DiagnosisCase[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const all = await CaseStorage.getCases();
    setRecentCases(all.slice(0, 4));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader onNotificationPress={() => navigation.navigate('Settings')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Farmer Greeting */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <Text style={styles.greetingTitle}>Namaste, Kisan!</Text>
            <Text style={styles.leafEmoji}> 🍃</Text>
          </View>
          <Text style={styles.greetingSubtitle}>
            Let's keep your crops healthy.
          </Text>
        </View>

        {/* Primary Action Hero Card: Detect Disease */}
        <TouchableOpacity
          style={styles.heroCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('CropSelect')}
        >
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroCameraEmoji}>📷</Text>
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Detect Disease</Text>
            <Text style={styles.heroSubtitle}>
              Take a photo of your crop leaf to inspect for diseases instantly
            </Text>
          </View>
          <View style={styles.heroArrowCircle}>
            <Text style={styles.heroArrowText}>➔</Text>
          </View>
        </TouchableOpacity>

        {/* 2-Column Action Cards: My History & Nearby Help */}
        <View style={styles.twoColumnRow}>
          {/* Card 1: My History */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('My Cases')}
          >
            <View style={styles.cardIconCircleBeige}>
              <Text style={styles.gridEmoji}>📋</Text>
            </View>
            <Text style={styles.cardTitle}>My History</Text>
            <Text style={styles.cardSubtitle}>View your past inspections</Text>
            <View style={styles.cardActionRow}>
              <Text style={styles.cardActionText}>
                {recentCases.length} records saved
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Nearby Help */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Nearby Help')}
          >
            <View style={styles.cardIconCircleGreen}>
              <Text style={styles.gridEmoji}>📞</Text>
            </View>
            <Text style={styles.cardTitle}>Nearby Help</Text>
            <Text style={styles.cardSubtitle}>
              Connect with crop doctors & experts
            </Text>
            <View style={styles.cardActionRow}>
              <Text style={styles.cardActionText}>Find experts</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Full-width Field Mode Card */}
        <TouchableOpacity
          style={styles.fieldModeCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={styles.fieldModeIconCircle}>
            <Text style={styles.fieldModeEmoji}>📡</Text>
          </View>
          <View style={styles.fieldModeTextWrap}>
            <Text style={styles.fieldModeTitle}>Field Mode</Text>
            <Text style={styles.fieldModeSubtitle}>
              Check your crops even without internet.
            </Text>
          </View>
          <View style={styles.learnMorePill}>
            <Text style={styles.learnMoreText}>Learn More</Text>
          </View>
        </TouchableOpacity>

        {/* Crop Protection & Farm Guides Section */}
        <View style={styles.guidesSection}>
          <Text style={styles.sectionHeaderTitle}>Crop Protection & Guides</Text>
          <View style={styles.guidesGrid}>
            {/* Guide 1: Pesticide Guide */}
            <TouchableOpacity
              style={styles.guideCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PesticideGuide')}
            >
              <View style={[styles.guideIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.guideEmoji}>🧪</Text>
              </View>
              <Text style={styles.guideCardTitle}>Pesticide Guide</Text>
              <Text style={styles.guideCardDesc}>CIBRC dosages & safety</Text>
            </TouchableOpacity>

            {/* Guide 2: Pests & Diseases */}
            <TouchableOpacity
              style={styles.guideCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PestExplorer')}
            >
              <View style={[styles.guideIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.guideEmoji}>🐛</Text>
              </View>
              <Text style={styles.guideCardTitle}>Pests & Disease</Text>
              <Text style={styles.guideCardDesc}>14 verified pests</Text>
            </TouchableOpacity>

            {/* Guide 3: Nutrient & Fertilizer */}
            <TouchableOpacity
              style={styles.guideCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('NutrientGuide')}
            >
              <View style={[styles.guideIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Text style={styles.guideEmoji}>🌾</Text>
              </View>
              <Text style={styles.guideCardTitle}>Nutrient / Soil</Text>
              <Text style={styles.guideCardDesc}>Deficiency signs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Landscape Banner at bottom above navigation */}
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
    paddingBottom: 16,
  },
  greetingSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#162836',
  },
  leafEmoji: {
    fontSize: 22,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#5A6E60',
    marginTop: 4,
    fontWeight: '500',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E6335',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#1E6335',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  heroIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroCameraEmoji: {
    fontSize: 26,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#D4EAD9',
    lineHeight: 17,
  },
  heroArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  heroArrowText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E6335',
  },
  twoColumnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridCard: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EDE9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardIconCircleBeige: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FAF5EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconCircleGreen: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF7F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gridEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6F8275',
    lineHeight: 16,
    marginBottom: 14,
    minHeight: 32,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
  },
  fieldModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F3',
    borderWidth: 1,
    borderColor: '#DBEFE2',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  fieldModeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCF1E3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fieldModeEmoji: {
    fontSize: 22,
  },
  fieldModeTextWrap: {
    flex: 1,
  },
  fieldModeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 2,
  },
  fieldModeSubtitle: {
    fontSize: 12,
    color: '#5A6E60',
  },
  learnMorePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBE5D4',
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B5E20',
  },
  guidesSection: {
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 10,
  },
  guidesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  guideCard: {
    flex: 0.31,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EDE9',
    elevation: 1,
  },
  guideIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  guideEmoji: {
    fontSize: 18,
  },
  guideCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#162836',
    textAlign: 'center',
    marginBottom: 2,
  },
  guideCardDesc: {
    fontSize: 10,
    color: '#78909C',
    textAlign: 'center',
  },
});