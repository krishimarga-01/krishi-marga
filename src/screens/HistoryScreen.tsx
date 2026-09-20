import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { CaseStorage } from '../storage/caseStorage';
import { DiagnosisCase } from '../models/index';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';

export const HistoryScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const [cases, setCases] = useState<DiagnosisCase[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    const all = await CaseStorage.getCases();
    setCases(all);
  };

  // Compute live dynamic stats from real storage
  const totalScans = cases.length;
  const healthyCount = cases.filter(
    (c) =>
      c.result.disease.toLowerCase().includes('healthy') ||
      c.result.severity?.toLowerCase() === 'none'
  ).length;
  const issuesFound = cases.filter(
    (c) =>
      !c.result.disease.toLowerCase().includes('healthy') &&
      c.result.severity?.toLowerCase() !== 'none'
  ).length;
  const pendingCount = cases.filter((c) => c.syncStatus === 'pending').length;

  const handleDelete = (caseId: string) => {
    Alert.alert(t('deleteRecordTitle'), t('deleteRecordConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('deleteButton'),
        style: 'destructive',
        onPress: async () => {
          await CaseStorage.deleteCase(caseId);
          loadData();
        },
      },
    ]);
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month} ${year} · ${hours}:${minutes} ${ampm}`;
    } catch {
      return isoString;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader onNotificationPress={() => navigation.navigate('Settings')} />

      <FlatList
        data={cases}
        keyExtractor={(item) => item.caseId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>My Cases</Text>
              <Text style={styles.screenSubtitle}>
                All your crop inspections in one place
              </Text>
            </View>

            {/* 4 Stat Cards */}
            <View style={styles.statsRow}>
              {/* Stat 1: Total Scans */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#E8F8EE' }]}>
                  <Text style={styles.statEmoji}>📄</Text>
                </View>
                <Text style={styles.statValue}>{totalScans}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
              </View>

              {/* Stat 2: Healthy */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#EEF7F0' }]}>
                  <Text style={styles.statEmoji}>🍃</Text>
                </View>
                <Text style={styles.statValue}>{healthyCount}</Text>
                <Text style={styles.statLabel}>Healthy</Text>
              </View>

              {/* Stat 3: Issues Found */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#FDF0E6' }]}>
                  <Text style={styles.statEmoji}>⚠️</Text>
                </View>
                <Text style={styles.statValue}>{issuesFound}</Text>
                <Text style={styles.statLabel}>Issues Found</Text>
              </View>

              {/* Stat 4: Pending */}
              <View style={styles.statCard}>
                <View style={[styles.statIconCircle, { backgroundColor: '#EBF2FA' }]}>
                  <Text style={styles.statEmoji}>⏱️</Text>
                </View>
                <Text style={styles.statValue}>{pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* Recent Cases Header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Recent Cases</Text>
              {cases.length > 0 && (
                <TouchableOpacity onPress={() => {}}>
                  <Text style={styles.viewAllText}>View All ›</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isHealthy =
            item.result.disease.toLowerCase().includes('healthy') ||
            item.result.severity?.toLowerCase() === 'none';

          return (
            <TouchableOpacity
              style={styles.caseCard}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Result', {
                  result: item.result,
                  crop: item.crop,
                  imageUris: item.imageUris,
                })
              }
              onLongPress={() => handleDelete(item.caseId)}
            >
              {/* Left Leaf Thumbnail */}
              <View style={styles.thumbContainer}>
                {item.imageUris && item.imageUris.length > 0 ? (
                  <Image
                    source={{ uri: item.imageUris[0] }}
                    style={styles.leafThumb}
                  />
                ) : (
                  <View style={styles.fallbackThumb}>
                    <Text style={styles.fallbackEmoji}>🌿</Text>
                  </View>
                )}
              </View>

              {/* Center Info */}
              <View style={styles.caseInfo}>
                <Text style={styles.cropName}>
                  {item.crop.endsWith('Leaf') ? item.crop : `${item.crop} Leaf`}
                </Text>
                <Text style={styles.diagnosisText} numberOfLines={1}>
                  {item.result.disease}
                </Text>
                <Text style={styles.timestampText}>
                  {formatDate(item.timestamp)}
                </Text>
              </View>

              {/* Right Status Pill & Arrow */}
              <View style={styles.caseRight}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isHealthy
                        ? Colors.statusHealthyBg
                        : Colors.statusIssueBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: isHealthy
                          ? Colors.statusHealthyText
                          : Colors.statusIssueText,
                      },
                    ]}
                  >
                    {isHealthy ? 'Healthy' : 'Issue Found'}
                  </Text>
                </View>
                <Text style={styles.arrowChevron}>›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Inspections Yet</Text>
            <Text style={styles.emptySubtitle}>
              Take a leaf photo of your crop to start your first inspection.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View>
            {/* Scan a New Leaf Action Card */}
            <TouchableOpacity
              style={styles.scanNewCard}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('CropSelect')}
            >
              <View style={styles.scanIconCircle}>
                <Text style={styles.scanCameraEmoji}>📷</Text>
              </View>
              <View style={styles.scanTextWrap}>
                <Text style={styles.scanTitle}>Scan a New Leaf</Text>
                <Text style={styles.scanSubtitle}>
                  Detect and protect your crops
                </Text>
              </View>
              <Text style={styles.scanChevron}>›</Text>
            </TouchableOpacity>

            {/* Bottom Landscape Illustration */}
            <LandscapeBanner />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  titleSection: {
    marginTop: 10,
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#162836',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#5A6E60',
    marginTop: 4,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 0.23,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8ECE8',
    elevation: 1,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#78909C',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#162836',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  caseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8EDE9',
    elevation: 1,
  },
  thumbContainer: {
    width: 54,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  leafThumb: {
    width: '100%',
    height: '100%',
  },
  fallbackThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackEmoji: {
    fontSize: 24,
  },
  caseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cropName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 2,
  },
  diagnosisText: {
    fontSize: 12.5,
    color: '#6F8275',
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 11,
    color: '#9EABB2',
    fontWeight: '500',
  },
  caseRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  arrowChevron: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E8EDE9',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#162836',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#78909C',
    textAlign: 'center',
  },
  scanNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F3',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D3ECDB',
    marginTop: 10,
    marginBottom: 10,
  },
  scanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scanCameraEmoji: {
    fontSize: 22,
  },
  scanTextWrap: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 2,
  },
  scanSubtitle: {
    fontSize: 12.5,
    color: '#5A6E60',
  },
  scanChevron: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },
});