import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { GlobalHeader } from '../components/GlobalHeader';

export const PesticideScannerScreen = ({ navigation }: any) => {
  const [flashlight, setFlashlight] = useState(false);

  const handleCapture = () => {
    Alert.alert(
      'Label Scanner Preparation',
      'The optical label recognition and CIBRC chemical verification pipeline is currently in field testing with agricultural universities. You can browse and search the verified pesticide database directly.',
      [
        {
          text: 'Browse Verified Pesticides',
          onPress: () => navigation.replace('PesticideGuide'),
        },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <GlobalHeader />

      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>Pesticide Label Scanner</Text>
        <View style={styles.badgePill}>
          <Text style={styles.badgeText}>Scanner Preparation / UI Mode</Text>
        </View>

        {/* Viewfinder Target Frame */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.cameraBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            <View style={styles.centerIconWrap}>
              <Text style={styles.centerIconEmoji}>🧪</Text>
              <Text style={styles.frameInstruction}>
                Align bottle label & active ingredient
              </Text>
            </View>
          </View>
        </View>

        {/* Flashlight & Controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlBtn, flashlight && styles.controlBtnActive]}
            onPress={() => setFlashlight(!flashlight)}
          >
            <Text style={styles.controlBtnText}>
              {flashlight ? '🔦 Flashlight On' : '🔦 Flashlight Off'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions Card */}
        <View style={styles.instructionsCard}>
          <Text style={styles.cardHeader}>Guidelines for Label Verification:</Text>
          <Text style={styles.bulletItem}>
            • Ensure product name, batch number, and CIBRC registration number are legible.
          </Text>
          <Text style={styles.bulletItem}>
            • Check the toxicity triangle (Green, Blue, Yellow, or Red).
          </Text>
          <Text style={styles.bulletItem}>
            • Never use unverified or counterfeit chemicals without CIBRC approval.
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.captureBtn}
          activeOpacity={0.88}
          onPress={handleCapture}
        >
          <Text style={styles.captureBtnText}>📷 Capture Label</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.browseDirectBtn}
          onPress={() => navigation.replace('PesticideGuide')}
        >
          <Text style={styles.browseDirectText}>
            Search Verified Database Directly →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  backArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E7D32',
    marginRight: 6,
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#162836',
    marginTop: 6,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  cameraBox: {
    width: '100%',
    height: 220,
    backgroundColor: '#1C2826',
    borderRadius: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#4CAF50',
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  centerIconWrap: {
    alignItems: 'center',
  },
  centerIconEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  frameInstruction: {
    fontSize: 13,
    color: '#D4EAD9',
    fontWeight: '600',
  },
  controlsRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  controlBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E2',
  },
  controlBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  controlBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#162836',
  },
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E8ECE8',
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 6,
  },
  bulletItem: {
    fontSize: 12,
    color: '#5A6E60',
    lineHeight: 18,
    marginBottom: 3,
  },
  captureBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  captureBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  browseDirectBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  browseDirectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
});
