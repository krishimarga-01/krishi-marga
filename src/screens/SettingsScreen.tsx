import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useI18n, SupportedLanguage } from '../services/i18n';
import { AuthService } from '../services/authService';
import { UserProfile } from '../models/index';
import { OnnxEngine } from '../offline/onnxEngine';

export const SettingsScreen = ({ navigation }: any) => {
  const { language, setLanguage, t } = useI18n();
  const [user, setUser] = useState<UserProfile>({ isLoggedIn: false });
  const [phoneInput, setPhoneInput] = useState('');
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [devTapCount, setDevTapCount] = useState(0);

  useEffect(() => {
    loadUser();
  }, []);

  const handleDevTap = () => {
    const nextCount = devTapCount + 1;
    setDevTapCount(nextCount);
    if (nextCount >= 5) {
      setDevTapCount(0);
      navigation.navigate('DevBuildStatus');
    }
  };

  const loadUser = async () => {
    const u = await AuthService.getUserProfile();
    setUser(u);
  };

  const handleGoogleLogin = async () => {
    const u = await AuthService.loginWithGoogle('Farmer (Google)', 'farmer@example.com');
    setUser(u);
    Alert.alert(t('loginSuccessTitle'), t('googleLoginSuccessDesc'));
  };

  const handlePhoneLogin = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      Alert.alert(t('invalidPhoneTitle'), t('invalidPhoneDesc'));
      return;
    }
    const u = await AuthService.loginWithPhone(phoneInput);
    setUser(u);
    setShowPhoneLogin(false);
    Alert.alert(t('loginSuccessTitle'), t('phoneLoginSuccessDesc'));
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser({ isLoggedIn: false });
    Alert.alert(t('guestMode'), t('guestModeSwitchedDesc'));
  };

  const languages: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('settings')}</Text>
        <Text style={styles.subtitle}>{t('settingsSubtitle')}</Text>

        {/* Account / Authentication Status Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>👤 {t('accountBackup')}</Text>
          {user.isLoggedIn ? (
            <View>
              <Text style={styles.userStatus}>{t('statusLabel')}: <Text style={styles.loggedText}>{t('loggedInAs')} ({user.name})</Text></Text>
              <Text style={styles.userInfo}>{t('identifier')}: {user.phoneOrEmail}</Text>
              <Text style={styles.syncStatus}>✓ {t('cloudSyncActive')}</Text>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>{t('switchToGuest')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.userStatus}>{t('statusLabel')}: <Text style={styles.guestStatus}>{t('guestMode')}</Text></Text>
              <Text style={styles.guestNotice}>{t('guestNotice')}</Text>

              <View style={styles.authRow}>
                <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85} onPress={handleGoogleLogin}>
                  <Text style={styles.authBtnText}>{t('googleLogin')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.phoneBtn} activeOpacity={0.85} onPress={() => setShowPhoneLogin(!showPhoneLogin)}>
                  <Text style={styles.authBtnText}>{t('phoneLogin')}</Text>
                </TouchableOpacity>
              </View>

              {showPhoneLogin && (
                <View style={styles.phoneInputWrap}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder={t('enterPhonePlaceholder')}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType='phone-pad'
                    maxLength={10}
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                  />
                  <TouchableOpacity style={styles.submitPhoneBtn} onPress={handlePhoneLogin}>
                    <Text style={styles.submitPhoneText}>{t('verifyOtpLogin')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Language Selection Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>🌐 {t('languageSectionTitle')}</Text>
          {languages.map((l) => {
            const isSelected = language === l.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.langItem, isSelected && styles.selectedLang]}
                onPress={() => setLanguage(l.code)}
              >
                <Text style={[styles.langText, isSelected && styles.selectedLangText]}>
                  {l.native} ({l.label})
                </Text>
                {isSelected && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Offline Engine Status Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📡 {t('offlineModelStatus')}</Text>
          <View style={styles.statusBadgeRow}>
            <View style={styles.offlineStatusPill}>
              <Text style={styles.offlineStatusText}>{OnnxEngine.isModelAvailable() ? t('modelReady') : t('modelAwaiting')}</Text>
            </View>
          </View>
          <Text style={styles.infoDesc}>
            {t('offlineEngineDesc')}
          </Text>
        </View>

        {/* About App */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>ℹ️ {t('aboutKrishiMarga')}</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleDevTap}>
            <Text style={styles.infoText}>{t('appEdition')}</Text>
          </TouchableOpacity>
          <Text style={styles.infoDesc}>
            {t('appMission')}
          </Text>
          <Text style={styles.privacyLink}>{t('privacyTerms')}</Text>

          {/* Discreet Developer Panel Entry */}
          <TouchableOpacity
            style={styles.devEntryBtn}
            onPress={() => navigation.navigate('DevBuildStatus')}
            activeOpacity={0.6}
          >
            <Text style={styles.devEntryText}>🛠️ Developer Build Status & Diagnostics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 18 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2, marginBottom: 14 },
  card: { backgroundColor: Colors.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 14 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 10 },
  userStatus: { fontSize: 14, color: Colors.textPrimary, marginBottom: 4 },
  loggedText: { color: Colors.primary, fontWeight: '700' },
  guestStatus: { color: Colors.textSecondary, fontWeight: '700' },
  userInfo: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  syncStatus: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginVertical: 6 },
  guestNotice: { fontSize: 13, color: Colors.textSecondary, marginVertical: 6 },
  logoutBtn: { marginTop: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 10 },
  logoutBtnText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  authRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  googleBtn: { flex: 0.48, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  phoneBtn: { flex: 0.48, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  authBtnText: { color: Colors.textPrimary, fontSize: 14, fontWeight: '700' },
  phoneInputWrap: { marginTop: 12 },
  phoneInput: { backgroundColor: Colors.earthBeige, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: Colors.textPrimary, marginBottom: 8 },
  submitPhoneBtn: { backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitPhoneText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  langItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  selectedLang: { backgroundColor: Colors.primarySoft, paddingHorizontal: 10, borderRadius: 8 },
  langText: { fontSize: 15, color: Colors.textPrimary },
  selectedLangText: { fontWeight: '700', color: Colors.primary },
  check: { fontSize: 18, color: Colors.primary, fontWeight: '700' },
  statusBadgeRow: { marginBottom: 6 },
  offlineStatusPill: { alignSelf: 'flex-start', backgroundColor: Colors.earthBeige, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  offlineStatusText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  infoText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  infoDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginTop: 4 },
  privacyLink: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  devEntryBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.earthBeige,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  devEntryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});