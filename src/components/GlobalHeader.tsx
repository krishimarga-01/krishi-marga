import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';

interface GlobalHeaderProps {
  onNotificationPress?: () => void;
  showSubtitle?: boolean;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  onNotificationPress,
  showSubtitle = true,
}) => {
  const { t } = useI18n();
  const [isOnline, setIsOnline] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.headerContainer}>
      {/* Brand Column */}
      <View style={styles.brandRow}>
        <Image
          source={require('../../assets/logo/km_brand_icon.png')}
          style={styles.logoIcon}
          resizeMode="contain"
        />
        <View style={styles.textWrap}>
          <Text style={styles.brandTitle}>KRISHI MARGA</Text>
          {showSubtitle && (
            <Text style={styles.brandSubtitle}>Your Trusted Crop Companion</Text>
          )}
        </View>
      </View>

      {/* Action Controls */}
      <View style={styles.rightControls}>
        {/* Status Pill */}
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOnline ? '#2E7D32' : '#D97706' },
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline ? t('online') : t('offline')}
          </Text>
        </View>

        {/* Notification Bell Button */}
        <TouchableOpacity
          style={styles.bellButton}
          activeOpacity={0.7}
          onPress={onNotificationPress}
          accessibilityLabel="Notifications"
        >
          <Text style={styles.bellIcon}>🔔</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginRight: 10,
  },
  textWrap: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#162836',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#607274',
    marginTop: 1,
    fontWeight: '500',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#162836',
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bellIcon: {
    fontSize: 16,
  },
});
