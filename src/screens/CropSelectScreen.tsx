import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';

interface CropItem {
  id: string;
  nameKey: string;
  rawName: string;
  icon: string;
}

const CROPS: CropItem[] = [
  { id: 'tomato', nameKey: 'cropTomato', rawName: 'Tomato', icon: '🍅' },
  { id: 'paddy', nameKey: 'cropPaddy', rawName: 'Paddy', icon: '🌾' },
  { id: 'chilli', nameKey: 'cropChilli', rawName: 'Chilli', icon: '🌶️' },
  { id: 'cotton', nameKey: 'cropCotton', rawName: 'Cotton', icon: '🌱' },
  { id: 'sugarcane', nameKey: 'cropSugarcane', rawName: 'Sugarcane', icon: '🎋' },
  { id: 'coconut', nameKey: 'cropCoconut', rawName: 'Coconut', icon: '🥥' },
  { id: 'maize', nameKey: 'cropMaize', rawName: 'Maize', icon: '🌽' },
  { id: 'wheat', nameKey: 'cropWheat', rawName: 'Wheat', icon: '🌾' },
];

export const CropSelectScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [search, setSearch] = useState('');

  const filtered = CROPS.filter((c) => {
    const name = t(c.nameKey).toLowerCase();
    return name.includes(search.toLowerCase()) || c.rawName.toLowerCase().includes(search.toLowerCase());
  });

  const handleContinue = () => {
    if (!selectedCrop) return;
    // Strictly pass exactly one crop
    navigation.navigate('CameraCapture', {
      crop: selectedCrop.rawName,
      cropDisplayName: t(selectedCrop.nameKey),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('selectCropTitle')}</Text>
        <Text style={styles.notice}>{t('selectCropNotice')}</Text>

        <TextInput
          style={styles.searchBar}
          placeholder={t('searchCropPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const isSelected = selectedCrop?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.cropCard, isSelected && styles.selectedCropCard]}
                activeOpacity={0.8}
                onPress={() => setSelectedCrop(item)}
              >
                <Text style={styles.cropIcon}>{item.icon}</Text>
                <Text style={[styles.cropName, isSelected && styles.selectedCropName]}>
                  {t(item.nameKey)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        <TouchableOpacity
          style={[styles.continueButton, !selectedCrop && styles.disabledButton]}
          disabled={!selectedCrop}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {selectedCrop ? (t('continueWithCrop') + ' ' + t(selectedCrop.nameKey)) : t('selectCropTitle')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  notice: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, marginBottom: 16 },
  searchBar: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: Colors.textPrimary, marginBottom: 16 },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  cropCard: { flex: 0.48, backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.cardBorder, borderRadius: 14, padding: 18, alignItems: 'center' },
  selectedCropCard: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  cropIcon: { fontSize: 36, marginBottom: 8 },
  cropName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  selectedCropName: { color: Colors.primary, fontWeight: '700' },
  continueButton: { backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  disabledButton: { backgroundColor: Colors.cardBorder },
  continueButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});