import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useI18n, SupportedLanguage } from '../services/i18n';
import { AuthService } from '../services/authService';
import { UserProfile } from '../models/index';
import { OnnxEngine } from '../offline/onnxEngine';

export const SettingsScreen = () => {
  const { language, setLanguage, t } = useI18n();
  const [user, setUser] = useState<UserProfile>({ isLoggedIn: false });
  const [phoneInput, setPhoneInput] = useState('');
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const u = await AuthService.getUserProfile();
    setUser(u);
  };

  const handleGoogleLogin = async () => {
    const u = await AuthService.loginWithGoogle('Farmer (Google)', 'farmer@example.com');
    setUser(u);
    Alert.alert('Logged In', 'Connected via Google. History will sync across your devices.');
  };

  const handlePhoneLogin = async () => {
    if (!phoneInput || phoneInput.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    const u = await AuthService.loginWithPhone(phoneInput);
    setUser(u);
    setShowPhoneLogin(false);
    Alert.alert('Logged In', 'Connected via Mobile OTP. History sync enabled.');
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser({ isLoggedIn: false });
    Alert.alert('Guest Mode', 'Switched back to Guest Mode.');
  };

  const languages: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t('settings')}</Text>
        <Text style={styles.subtitle}>{t('settingsSubtitle')}</Text>

        {/* Account / Authentication Status Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>👤 Account & Backup</Text>
          {user.isLoggedIn ? (
            <View>
              <Text style={styles.userStatus}>Status: <Text style={styles.loggedText}>Logged in ({user.name})</Text></Text>
              <Text style={styles.userInfo}>Identifier: {user.phoneOrEmail}</Text>
              <Text style={styles.syncStatus}>✓ Cloud synchronization active</Text>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Switch to Guest Mode</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.userStatus}>Status: <Text style={styles.guestStatus}>Guest Mode</Text></Text>
              <Text style={styles.guestNotice}>Diagnosis works completely without login. Connect to backup records:</Text>

              <View style={styles.authRow}>
                <TouchableOpacity style={styles.googleBtn} activeOpacity={0.85} onPress={handleGoogleLogin}>
                  <Text style={styles.authBtnText}>Google Login</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.phoneBtn} activeOpacity={0.85} onPress={() => setShowPhoneLogin(!showPhoneLogin)}>
                  <Text style={styles.authBtnText}>Phone Login</Text>
                </TouchableOpacity>
              </View>

              {showPhoneLogin && (
                <View style={styles.phoneInputWrap}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder='Enter 10-digit mobile number'
                    placeholderTextColor={Colors.textMuted}
                    keyboardType='phone-pad'
                    maxLength={10}
                    value={phoneInput}
                    onChangeText={setPhoneInput}
                  />
                  <TouchableOpacity style={styles.submitPhoneBtn} onPress={handlePhoneLogin}>
                    <Text style={styles.submitPhoneText}>Verify OTP & Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Language Selection Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>🌐 Language / ಭಾಷೆ / மொழி / ഭാഷ / भाषा</Text>
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
          <Text style={styles.sectionHeader}>📡 Offline Model Status</Text>
          <View style={styles.statusBadgeRow}>
            <View style={styles.offlineStatusPill}>
              <Text style={styles.offlineStatusText}>{OnnxEngine.isModelAvailable() ? 'Ready' : 'Awaiting ONNX Model Asset'}</Text>
            </View>
          </View>
          <Text style={styles.infoDesc}>
            Local disease knowledge database is bundled for offline emergency lookup. Full ONNX mobile tensor inference activates upon package compilation.
          </Text>
        </View>

        {/* About App */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>ℹ️ About KRISHI MARGA</Text>
          <Text style={styles.infoText}>Krishi Marga — Smart India Hackathon Edition</Text>
          <Text style={styles.infoDesc}>
            Designed to empower Indian farmers with rapid crop disease inspection, verified agronomic treatments, and agricultural expert support.
          </Text>
          <Text style={styles.privacyLink}>Privacy Policy & Terms: Local-first data protection.</Text>
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
});