import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaseStorage } from '../storage/caseStorage';
import { DiagnosisCase } from '../models/index';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { AuthService } from '../services/authService';

export const HistoryScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const [cases, setCases] = useState<DiagnosisCase[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    const auth = await AuthService.getUserProfile();
    setIsLoggedIn(auth.isLoggedIn);
  };

  const crops = Array.from(new Set(cases.map((c) => c.crop)));

  const filtered = cases.filter((c) => {
    const matchesSearch = c.crop.toLowerCase().includes(search.toLowerCase()) ||
      c.result.disease.toLowerCase().includes(search.toLowerCase());
    const matchesCrop = selectedCropFilter ? c.crop === selectedCropFilter : true;
    return matchesSearch && matchesCrop;
  });

  const handleDelete = (caseId: string) => {
    Alert.alert('Delete Record', 'Remove this diagnosis from local records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await CaseStorage.deleteCase(caseId);
          loadData();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Diagnosis History</Text>
        <Text style={styles.subtitle}>Previous crop inspections stored locally on this phone</Text>

        {/* Guest Sync Callout */}
        {!isLoggedIn && (
          <TouchableOpacity
            style={styles.guestSyncBanner}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.guestSyncIcon}>☁️</Text>
            <View style={styles.guestSyncTextWrap}>
              <Text style={styles.guestSyncTitle}>Login to sync your diagnosis history across devices.</Text>
              <Text style={styles.guestSyncSub}>Tap to connect Google or Phone</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Search Input */}
        <TextInput
          style={styles.searchBar}
          placeholder='Search by crop or disease...'
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        {/* Crop Filter Pills */}
        {crops.length > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, selectedCropFilter === null && styles.activeFilterPill]}
              onPress={() => setSelectedCropFilter(null)}
            >
              <Text style={[styles.filterPillText, selectedCropFilter === null && styles.activeFilterPillText]}>All Crops</Text>
            </TouchableOpacity>
            {crops.map((cr) => (
              <TouchableOpacity
                key={cr}
                style={[styles.filterPill, selectedCropFilter === cr && styles.activeFilterPill]}
                onPress={() => setSelectedCropFilter(selectedCropFilter === cr ? null : cr)}
              >
                <Text style={[styles.filterPillText, selectedCropFilter === cr && styles.activeFilterPillText]}>{cr}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* List of Cases */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No crop diagnosis records found.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.caseId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Result', {
                  result: item.result,
                  crop: item.crop,
                  imageUris: item.imageUris,
                })}
                onLongPress={() => handleDelete(item.caseId)}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cropTitle}>{item.crop}</Text>
                  <View style={[styles.sourceBadge, item.result.analysis_source === 'online' ? styles.onlineBadge : styles.offlineBadge]}>
                    <Text style={styles.sourceText}>
                      {item.result.analysis_source === 'online' ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.diseaseName}>{item.result.disease}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{new Date(item.timestamp).toLocaleDateString()}</Text>
                  <Text style={styles.metaConfidence}>Confidence: {(item.result.confidence * 100).toFixed(0)}%</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 18 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, marginBottom: 14 },
  guestSyncBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.earthBeige, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 14 },
  guestSyncIcon: { fontSize: 24, marginRight: 10 },
  guestSyncTextWrap: { flex: 1 },
  guestSyncTitle: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  guestSyncSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  searchBar: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary, marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  filterPill: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 6 },
  activeFilterPill: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterPillText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  activeFilterPillText: { color: '#FFFFFF' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 15, color: Colors.textMuted },
  card: { backgroundColor: Colors.surface, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cropTitle: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  onlineBadge: { backgroundColor: '#DCFCE7' },
  offlineBadge: { backgroundColor: '#FEF3C7' },
  sourceText: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
  diseaseName: { fontSize: 15, color: Colors.textPrimary, marginVertical: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  metaText: { fontSize: 12, color: Colors.textMuted },
  metaConfidence: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
});