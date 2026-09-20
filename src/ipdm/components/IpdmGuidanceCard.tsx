import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { IpdmGuidance, IpdmRequestPayload } from '../models/ipdm.types';
import { IpdmService } from '../services/ipdm.service';
import { Colors } from '../../theme';
import { useI18n } from '../../services/i18n';

interface IpdmGuidanceCardProps {
  crop: string;
  condition: string;
  confidence?: number;
  latitude?: number;
  longitude?: number;
}

export const IpdmGuidanceCard: React.FC<IpdmGuidanceCardProps> = ({
  crop,
  condition,
  confidence,
  latitude,
  longitude,
}) => {
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(true);
  const [guidance, setGuidance] = useState<IpdmGuidance | null>(null);
  const [activeTab, setActiveTab] = useState<'bio' | 'treatment' | 'prevention' | 'precautions'>('bio');

  useEffect(() => {
    let isMounted = true;

    async function loadIpdm() {
      setLoading(true);
      try {
        const payload: IpdmRequestPayload = {
          crop,
          disease: condition,
          confidence,
          language,
          location: latitude && longitude ? { latitude, longitude } : undefined,
        };
        const data = await IpdmService.getGuidance(payload);
        if (isMounted) {
          setGuidance(data);
        }
      } catch (e) {
        console.warn('[IpdmGuidanceCard] Failed to load IPDM guidance:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadIpdm();
    return () => {
      isMounted = false;
    };
  }, [crop, condition, confidence, language, latitude, longitude]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading Integrated Pest & Disease Management...</Text>
      </View>
    );
  }

  if (!guidance) return null;

  const getSourceBadge = () => {
    switch (guidance.dataSource) {
      case 'n8n_expanded':
        return { label: 'Expanded IPDM', bg: '#DCFCE7', text: '#15803D' };
      case 'sqlite_fallback':
        return { label: 'Using Offline Guidance', bg: '#FEF3C7', text: '#B45309' };
      case 'sqlite_baseline':
      default:
        return { label: 'Offline IPDM Guidance', bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  const badge = getSourceBadge();

  // If no guidance exists in SQLite and device is offline / backend failed:
  // Render clean safe unavailable notice WITHOUT inventing fake advice
  if (guidance.isAvailable === false) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleWrapper}>
            <Text style={styles.cardEmoji}>🌿</Text>
            <View>
              <Text style={styles.cardTitle}>IPDM Advisory</Text>
              <Text style={styles.cardSubtitle}>Integrated Pest & Disease Management</Text>
            </View>
          </View>
          <View style={[styles.sourceBadge, { backgroundColor: '#F3F4F6' }]}>
            <Text style={[styles.sourceBadgeText, { color: '#6B7280' }]}>OFFLINE</Text>
          </View>
        </View>
        <View style={styles.unavailableBox}>
          <Text style={styles.unavailableIcon}>ℹ️</Text>
          <Text style={styles.unavailableText}>
            {guidance.unavailableMessage || 'Offline guidance for this condition is unavailable. Connect to the internet for expanded IPDM guidance.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.cardEmoji}>🌿</Text>
          <View>
            <Text style={styles.cardTitle}>IPDM Advisory</Text>
            <Text style={styles.cardSubtitle}>Integrated Pest & Disease Management</Text>
          </View>
        </View>
        <View style={[styles.sourceBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.sourceBadgeText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'bio' && styles.tabItemActive]}
          onPress={() => setActiveTab('bio')}
        >
          <Text style={[styles.tabText, activeTab === 'bio' && styles.tabTextActive]}>Biological</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'treatment' && styles.tabItemActive]}
          onPress={() => setActiveTab('treatment')}
        >
          <Text style={[styles.tabText, activeTab === 'treatment' && styles.tabTextActive]}>Treatment</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'prevention' && styles.tabItemActive]}
          onPress={() => setActiveTab('prevention')}
        >
          <Text style={[styles.tabText, activeTab === 'prevention' && styles.tabTextActive]}>Prevention</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'precautions' && styles.tabItemActive]}
          onPress={() => setActiveTab('precautions')}
        >
          <Text style={[styles.tabText, activeTab === 'precautions' && styles.tabTextActive]}>Safety</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'bio' && (
          <View>
            <Text style={styles.sectionHeading}>🌱 Biological & Organic Control</Text>
            {guidance.biologicalControl.length > 0 ? (
              guidance.biologicalControl.map((item, idx) => (
                <Text key={idx} style={styles.bulletItem}>• {item}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>No registered bio-control agents listed for this stage.</Text>
            )}
          </View>
        )}

        {activeTab === 'treatment' && (
          <View>
            <Text style={styles.sectionHeading}>💊 Chemical & Curative Guidance</Text>
            {guidance.treatmentGuidance.length > 0 ? (
              guidance.treatmentGuidance.map((item, idx) => (
                <Text key={idx} style={styles.bulletItem}>• {item}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>Standard recommended actions unavailable.</Text>
            )}
          </View>
        )}

        {activeTab === 'prevention' && (
          <View>
            <Text style={styles.sectionHeading}>🛡️ Prophylactic & Cultural Prevention</Text>
            {guidance.prevention.length > 0 ? (
              guidance.prevention.map((item, idx) => (
                <Text key={idx} style={styles.bulletItem}>• {item}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>Follow general field hygiene and crop rotation.</Text>
            )}
          </View>
        )}

        {activeTab === 'precautions' && (
          <View>
            <Text style={styles.sectionHeading}>⚠️ Agronomic Precautions & CIBRC Compliance</Text>
            {guidance.precautions.length > 0 ? (
              guidance.precautions.map((item, idx) => (
                <Text key={idx} style={styles.bulletItem}>• {item}</Text>
              ))
            ) : (
              <Text style={styles.emptyText}>Always follow standard pesticide label and waiting instructions.</Text>
            )}
          </View>
        )}
      </View>

      {/* Footer Info */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Standard: {guidance.sourceVersion}</Text>
        <Text style={styles.footerText}>Severity: {guidance.severity}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  unavailableBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unavailableIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  unavailableText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#475569',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#166534',
    fontWeight: '700',
  },
  contentContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  bulletItem: {
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerText: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
