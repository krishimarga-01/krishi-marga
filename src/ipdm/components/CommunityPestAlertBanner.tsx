import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { PestAlert } from '../models/ipdm.types';
import { PestAlertService } from '../geo/pestAlert.service';

interface CommunityPestAlertBannerProps {
  latitude?: number;
  longitude?: number;
}

export const CommunityPestAlertBanner: React.FC<CommunityPestAlertBannerProps> = ({
  latitude,
  longitude,
}) => {
  const [alerts, setAlerts] = useState<PestAlert[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
      if (latitude && longitude) {
        const list = await PestAlertService.getNearbyAlerts(latitude, longitude, 10);
        if (isMounted) setAlerts(list);
      }
    }
    loadAlerts();
    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  if (dismissed || alerts.length === 0) return null;

  const topAlert = alerts[0];

  return (
    <View style={styles.banner}>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.badge}>⚠️ COMMUNITY ALERT ({topAlert.distanceKm} km away)</Text>
        </View>
        <Text style={styles.pestText}>
          High <Text style={styles.bold}>{topAlert.pest}</Text> activity reported in nearby {topAlert.crop} fields.
        </Text>
        <Text style={styles.actionPrompt}>Inspect your crops today and prepare recommended bio-controls.</Text>
      </View>
      <TouchableOpacity style={styles.dismissBtn} onPress={() => setDismissed(true)}>
        <Text style={styles.dismissText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    marginBottom: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  pestText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
  },
  actionPrompt: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  dismissBtn: {
    padding: 4,
  },
  dismissText: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
