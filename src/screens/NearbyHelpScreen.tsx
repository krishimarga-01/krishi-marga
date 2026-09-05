import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpertService } from '../services/expertService';
import { ExpertContact } from '../models';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';

export const NearbyHelpScreen = () => {
  const { t } = useI18n();
  const [experts, setExperts] = useState<ExpertContact[]>([]);

  useEffect(() => {
    ExpertService.getNearbyExperts().then(setExperts);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('nearbyHelpTitle')}</Text>
        <Text style={styles.subtitle}>{t('nearbyNotice')}</Text>

        <FlatList
          data={experts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.name}</Text>
                {item.isMockData && (
                  <View style={styles.mockTag}>
                    <Text style={styles.mockTagText}>Development Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.address}>📍 {item.address}</Text>
              <Text style={styles.hours}>🕒 {item.hours}</Text>

              {item.phone && (
                <TouchableOpacity
                  style={styles.callBtn}
                  activeOpacity={0.8}
                  onPress={() => ExpertService.callExpert(item.phone)}
                >
                  <Text style={styles.callEmoji}>📞</Text>
                  <Text style={styles.callBtnText}>{t('callButton')} ({item.phone})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  card: { backgroundColor: Colors.surface, padding: 18, borderRadius: 14, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: 8 },
  mockTag: { backgroundColor: Colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  mockTagText: { fontSize: 10, fontWeight: '600', color: Colors.primary },
  type: { fontSize: 14, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  address: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  hours: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  callBtn: { flexDirection: 'row', backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  callEmoji: { fontSize: 18, marginRight: 8 },
  callBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});