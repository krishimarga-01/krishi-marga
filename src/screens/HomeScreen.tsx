import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { CaseStorage } from '../storage/caseStorage';
import { DiagnosisCase } from '../models/index';
import { AuthService } from '../services/authService';

export const HomeScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState<boolean | null>(true);
  const [recentCases, setRecentCases] = useState<DiagnosisCase[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });
    loadData();
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    const all = await CaseStorage.getCases();
    setRecentCases(all.slice(0, 3));
    const auth = await AuthService.getUserProfile();
    setIsLoggedIn(auth.isLoggedIn);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Top Official Header with Logo */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../assets/logo/app_logo.jpeg')}
                style={styles.logo}
                resizeMode='contain'
              />
              <View style={styles.brandTextWrap}>
                <Text style={styles.appName}>KRISHI MARGA</Text>
                <Text style={styles.tagline}>{t('tagline')}</Text>
              </View>
            </View>

            <View style={[styles.networkBadge, isOnline ? styles.onlineBadge : styles.offlineBadge]}>
              <Text style={styles.networkBadgeText}>{isOnline ? t('online') : t('offline')}</Text>
            </View>
          </View>

          <Text style={styles.greeting}>{t('farmerGreeting')}</Text>
        </View>

        {/* Primary Action Button 1: Detect Disease */}
        <TouchableOpacity
          style={styles.primaryActionCard}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('CropSelect')}
        >
          <View style={styles.detectIconWrap}>
            <Text style={styles.detectIcon}>📷</Text>
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.primaryActionTitle}>{t('detectDisease')}</Text>
            <Text style={styles.primaryActionSubtitle}>{t('checkCropSubtitle')}</Text>
          </View>
          <Text style={styles.arrowText}>➔</Text>
        </TouchableOpacity>

        {/* Guest Status / Cloud Sync Banner */}
        {!isLoggedIn && (
          <TouchableOpacity
            style={styles.guestBar}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.guestText}>{t('guestModeActive')} <Text style={styles.loginLink}>{t('loginToSync')}</Text></Text>
          </TouchableOpacity>
        )}

        {/* The 4 Main Navigation Action Grid */}
        <View style={styles.actionGrid}>
          {/* Button 2: My History */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('My Cases')}
          >
            <View style={styles.cardIconCircle}>
              <Text style={styles.cardEmoji}>📋</Text>
            </View>
            <Text style={styles.cardTitle}>{t('myHistory')}</Text>
            <Text style={styles.cardSubtitle}>{recentCases.length} {t('recordsSaved')}</Text>
          </TouchableOpacity>

          {/* Button 3: Nearby Help */}
          <TouchableOpacity
            style={styles.gridCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Nearby Help')}
          >
            <View style={styles.cardIconCircle}>
              <Text style={styles.cardEmoji}>📞</Text>
            </View>
            <Text style={styles.cardTitle}>{t('nearbyHelp')}</Text>
            <Text style={styles.cardSubtitle}>{t('cropDoctorsAndExperts')}</Text>
          </TouchableOpacity>
        </View>

        {/* Button 4: Offline Mode Guide Card */}
        <TouchableOpacity
          style={styles.offlineCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CropSelect')}
        >
          <View style={styles.offlineIconCircle}>
            <Text style={styles.cardEmoji}>📡</Text>
          </View>
          <View style={styles.offlineTextWrap}>
            <Text style={styles.offlineTitle}>{t('offlineModeAvailable')}</Text>
            <Text style={styles.offlineSubtitle}>{t('offlineModeDesc')}</Text>
          </View>
        </TouchableOpacity>

        {/* Recent Diagnoses */}
        {recentCases.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>{t('myCases')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('My Cases')}>
                <Text style={styles.seeAllText}>{t('viewAll')}</Text>
              </TouchableOpacity>
            </View>
            {recentCases.map((c) => (
              <TouchableOpacity
                key={c.caseId}
                style={styles.recentItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Result', { result: c.result, crop: c.crop, imageUris: c.imageUris })}
              >
                <View style={styles.recentItemLeft}>
                  <Text style={styles.recentCrop}>{c.crop}</Text>
                  <Text style={styles.recentDisease}>{c.result.disease}</Text>
                  <Text style={styles.recentDate}>{new Date(c.timestamp).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.recentBadge, c.result.analysis_source === 'online' ? styles.onlineBadge : styles.offlineBadge]}>
                  <Text style={styles.recentBadgeText}>{c.result.analysis_source === 'online' ? t('online') : t('offline')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 18 },
  header: { marginBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  brandTextWrap: { justifyContent: 'center' },
  appName: { fontSize: 22, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  tagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  greeting: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 12 },
  networkBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  onlineBadge: { backgroundColor: '#DCFCE7' },
  offlineBadge: { backgroundColor: '#FEF3C7' },
  networkBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  primaryActionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  detectIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryDark, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  detectIcon: { fontSize: 24 },
  actionTextContainer: { flex: 1 },
  primaryActionTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  primaryActionSubtitle: { fontSize: 13, color: '#E8F5E9', marginTop: 2 },
  arrowText: { fontSize: 20, color: '#FFFFFF', marginLeft: 6 },
  guestBar: { marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: Colors.earthBeige, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder },
  guestText: { fontSize: 13, color: Colors.textSecondary },
  loginLink: { color: Colors.primary, fontWeight: '700' },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  gridCard: { flex: 0.48, backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, elevation: 1 },
  cardIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardEmoji: { fontSize: 22 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  cardSubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 3 },
  offlineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginTop: 14 },
  offlineIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  offlineTextWrap: { flex: 1 },
  offlineTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  offlineSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  recentSection: { marginTop: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionHeader: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  seeAllText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  recentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder },
  recentItemLeft: { flex: 1 },
  recentCrop: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  recentDisease: { fontSize: 14, color: Colors.textPrimary, marginTop: 2 },
  recentDate: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  recentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  recentBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
});