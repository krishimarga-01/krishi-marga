import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useI18n, SupportedLanguage } from '../services/i18n';
import { AuthService } from '../services/authService';
import { UserProfile } from '../models/index';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';

export const SettingsScreen = ({ navigation }: any) => {
  const { language, setLanguage, t } = useI18n();
  const [user, setUser] = useState<UserProfile>({ isLoggedIn: false });
  const [fieldModeEnabled, setFieldModeEnabled] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const u = await AuthService.getUserProfile();
    setUser(u);
  };

  const handleDevTap = () => {
    const next = devTapCount + 1;
    setDevTapCount(next);
    if (next >= 5) {
      setDevTapCount(0);
      navigation.navigate('DevBuildStatus');
    }
  };

  const languages: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Settings</Text>
          <Text style={styles.screenSubtitle}>
            Keep your app just the way you like
          </Text>
        </View>

        {/* 6 Large Setting Cards */}

        {/* 1. Your Profile */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.82}
          onPress={() => {
            Alert.alert(
              'Your Profile',
              user.isLoggedIn
                ? `Logged in as: ${user.name || 'Farmer'}\nContact: ${user.phoneOrEmail}`
                : 'You are currently using Krishi Marga in Farmer Guest Mode. All crop scans and cases are stored locally on your device.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#E8F8EE' }]}>
            <Text style={styles.iconEmoji}>👤</Text>
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Your Profile</Text>
            <Text style={styles.settingSubtitle}>
              Manage your name and location
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        {/* 2. App Language */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.82}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#EBF2FA' }]}>
            <Text style={styles.iconEmoji}>🌐</Text>
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>App Language</Text>
            <Text style={styles.settingSubtitle}>
              Choose your preferred language ({languages.find((l) => l.code === language)?.native || 'English'})
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        {/* 3. Field Mode */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.82}
          onPress={() => {
            setFieldModeEnabled(!fieldModeEnabled);
            Alert.alert(
              'Field Mode',
              !fieldModeEnabled
                ? 'Field Mode enabled. The app will prioritize offline crop knowledge and local storage.'
                : 'Field Mode disabled. The app will use online Gemini cloud AI when available.'
            );
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FDF0E6' }]}>
            <Text style={styles.iconEmoji}>📡</Text>
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Field Mode</Text>
            <Text style={styles.settingSubtitle}>
              Use the app without internet
            </Text>
          </View>
          {fieldModeEnabled && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>Enabled</Text>
            </View>
          )}
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        {/* 4. Notifications */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.82}
          onPress={() => {
            Alert.alert(
              'Pest & Weather Notifications',
              'Active for South Indian agricultural zones: monsoon pest alerts, seasonal spray schedules, and disease advisory.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FEF9E7' }]}>
            <Text style={styles.iconEmoji}>🔔</Text>
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingSubtitle}>Get important updates</Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        {/* 5. Help & Support */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.82}
          onPress={() => navigation.navigate('Nearby Help')}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
            <Text style={styles.iconEmoji}>❓</Text>
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>Help & Support</Text>
            <Text style={styles.settingSubtitle}>Get help or contact us</Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        {/* 6. About Krishi Marga */}
        <TouchableOpacity
          style={styles.settingCard}
          activeOpacity={0.82}
          onPress={handleDevTap}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
            <Text style={styles.iconEmoji}>ℹ️</Text>
          </View>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingTitle}>About Krishi Marga</Text>
            <Text style={styles.settingSubtitle}>
              Know more about our mission (v1.0.0)
            </Text>
          </View>
          <Text style={styles.settingChevron}>›</Text>
        </TouchableOpacity>

        {/* Developer Diagnostics Entry */}
        <TouchableOpacity
          style={styles.devButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('DevBuildStatus')}
        >
          <Text style={styles.devButtonText}>
            🛠️ System & Runtime Reality Diagnostics
          </Text>
        </TouchableOpacity>

        {/* Bottom Landscape Illustration */}
        <LandscapeBanner />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Your Language</Text>
            <Text style={styles.modalSubtitle}>
              Select your preferred regional language
            </Text>
            {languages.map((item) => {
              const isSelected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langRow,
                    isSelected && styles.langRowSelected,
                  ]}
                  onPress={() => {
                    setLanguage(item.code);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.langText,
                      isSelected && styles.langTextSelected,
                    ]}
                  >
                    {item.native} ({item.label})
                  </Text>
                  {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  scrollContainer: {
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
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconEmoji: {
    fontSize: 22,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12.5,
    color: '#6F8275',
  },
  badgePill: {
    backgroundColor: '#E8F8EE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E7E34',
  },
  settingChevron: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },
  devButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#F0F4F1',
    borderRadius: 14,
  },
  devButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#5A6E60',
    marginBottom: 16,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F7FAF8',
  },
  langRowSelected: {
    backgroundColor: '#E8F8EE',
    borderWidth: 1.5,
    borderColor: '#2E7D32',
  },
  langText: {
    fontSize: 15,
    color: '#162836',
    fontWeight: '600',
  },
  langTextSelected: {
    color: '#1B5E20',
    fontWeight: '800',
  },
  checkIcon: {
    fontSize: 16,
    color: '#1B5E20',
    fontWeight: '800',
  },
  modalCloseBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
});