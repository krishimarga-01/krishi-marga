import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useI18n } from '../services/i18n';
import { CROPS_CONFIG, CropConfig } from '../config/crops';

const CATEGORIES: { id: string; labelKey: string }[] = [
  { id: 'all', labelKey: 'cropCategory.all' },
  { id: 'cereal', labelKey: 'cropCategory.cereal' },
  { id: 'pulse', labelKey: 'cropCategory.pulse' },
  { id: 'oilseed', labelKey: 'cropCategory.oilseed' },
  { id: 'commercial', labelKey: 'cropCategory.commercial' },
  { id: 'vegetable', labelKey: 'cropCategory.vegetable' },
  { id: 'fruit', labelKey: 'cropCategory.fruit' },
  { id: 'plantation', labelKey: 'cropCategory.plantation' },
  { id: 'spice', labelKey: 'cropCategory.spice' },
  { id: 'other', labelKey: 'cropCategory.other' },
];

export const CropSelectScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCrop, setSelectedCrop] = useState<CropConfig | null>(null);
  const [search, setSearch] = useState('');

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CROPS_CONFIG.length };
    CROPS_CONFIG.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered crops based on search and category
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CROPS_CONFIG.filter((c) => {
      // Category filter
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (!q) return true;
      const localizedName = t(c.nameKey).toLowerCase();
      const rawName = c.rawName.toLowerCase();
      const matchesKeyword = c.searchKeywords && c.searchKeywords.some((k) => k.toLowerCase().includes(q));

      return localizedName.includes(q) || rawName.includes(q) || matchesKeyword;
    });
  }, [selectedCategory, search, t]);

  const handleSelectCrop = (crop: CropConfig) => {
    setSelectedCrop(crop);
    if (!crop.modelAvailable) {
      Alert.alert(
        t('cropUnderPreparationTitle'),
        `${t('cropUnderPreparationNotice')} (${t(crop.nameKey)})`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleContinue = () => {
    if (!selectedCrop) return;

    if (!selectedCrop.modelAvailable) {
      Alert.alert(
        t('cropUnderPreparationTitle'),
        t('cropUnderPreparationNotice'),
        [{ text: 'OK' }]
      );
      return;
    }

    // Strictly pass exactly ONE crop to enforce 1-crop-per-diagnosis
    navigation.navigate('CameraCapture', {
      crop: selectedCrop.rawName,
      cropDisplayName: t(selectedCrop.nameKey),
      cropId: selectedCrop.id,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Title & Subtitle */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('selectCropTitle')}</Text>
          <Text style={styles.notice}>{t('selectCropNotice')}</Text>
        </View>

        {/* Search Input with Clear Button */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchBar}
            placeholder={t('searchCropPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="never"
          />
          {search.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearch('')}
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Horizontal Filter Chips */}
        <View style={styles.categoryContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                    {t(cat.labelKey)} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Result Count Indicator */}
        <View style={styles.resultInfoRow}>
          <Text style={styles.resultInfoText}>
            {filtered.length} {t('cropCategory.all')}
          </Text>
          <View style={styles.legendRow}>
            <View style={[styles.miniDot, { backgroundColor: '#2E7D32' }]} />
            <Text style={styles.legendText}>{t('cropModelReadyBadge')}</Text>
            <View style={[styles.miniDot, { backgroundColor: '#D97706', marginLeft: 8 }]} />
            <Text style={styles.legendText}>{t('cropModelPrepBadge')}</Text>
          </View>
        </View>

        {/* 2-Column Crop Grid */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedCrop?.id === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.cropCard,
                  isSelected && (item.modelAvailable ? styles.selectedCropCard : styles.selectedPrepCard),
                  !item.modelAvailable && styles.prepCropCard,
                ]}
                activeOpacity={0.8}
                onPress={() => handleSelectCrop(item)}
              >
                {/* Top Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    item.modelAvailable ? styles.statusBadgeReady : styles.statusBadgePrep,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      item.modelAvailable ? styles.statusBadgeTextReady : styles.statusBadgeTextPrep,
                    ]}
                  >
                    {item.modelAvailable ? t('cropModelReadyBadge') : t('cropModelPrepBadge')}
                  </Text>
                </View>

                {/* Crop Representative Artwork */}
                <Image source={item.image} style={styles.cropImage} resizeMode="contain" />

                {/* Localized Crop Name */}
                <Text
                  style={[
                    styles.cropName,
                    isSelected && (item.modelAvailable ? styles.selectedCropName : styles.selectedPrepName),
                  ]}
                  numberOfLines={2}
                >
                  {t(item.nameKey)}
                </Text>

                {/* Subtitle / Botanical or English Name */}
                <Text style={styles.cropRawName} numberOfLines={1}>
                  {item.rawName}
                </Text>

                {/* Granular Model Capability Badges */}
                <View style={styles.capabilitiesRow}>
                  {item.diseaseModelAvailable && (
                    <View style={styles.capBadgeGreen}>
                      <Text style={styles.capBadgeTextGreen}>{t('badge.diseaseAi')}</Text>
                    </View>
                  )}
                  {item.pestModelAvailable && (
                    <View style={styles.capBadgeGreen}>
                      <Text style={styles.capBadgeTextGreen}>{t('badge.pestAi')}</Text>
                    </View>
                  )}
                  {item.nutrientModelAvailable && (
                    <View style={styles.capBadgeGreen}>
                      <Text style={styles.capBadgeTextGreen}>{t('badge.nutrientAi')}</Text>
                    </View>
                  )}
                  {!item.modelAvailable && (
                    <View style={styles.capBadgeAmber}>
                      <Text style={styles.capBadgeTextAmber}>{t('cropModelPrepBadge')}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No crops found for "{search}"</Text>
              <TouchableOpacity style={styles.resetSearchBtn} onPress={() => { setSearch(''); setSelectedCategory('all'); }}>
                <Text style={styles.resetSearchText}>View All Crops</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Selected Crop Preparation Notice (if non-model crop selected) */}
        {selectedCrop && !selectedCrop.modelAvailable && (
          <View style={styles.prepNoticeBanner}>
            <Text style={styles.prepNoticeTitle}>⚠️ {t('cropUnderPreparationTitle')}</Text>
            <Text style={styles.prepNoticeBody}>
              {t('cropUnderPreparationNotice')} ({t(selectedCrop.nameKey)}).
              Research and South India field dataset collection is in progress.
            </Text>
          </View>
        )}

        {/* Bottom Continue Action Button */}
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedCrop || !selectedCrop.modelAvailable) && styles.disabledButton,
          ]}
          disabled={!selectedCrop || !selectedCrop.modelAvailable}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {selectedCrop
              ? selectedCrop.modelAvailable
                ? `${t('continueWithCrop')} ${t(selectedCrop.nameKey)}`
                : t('cropUnderPreparationNotice')
              : t('selectCropTitle')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notice: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  searchWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 10,
  },
  searchBar: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingRight: 40,
    paddingVertical: 9,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryScroll: {
    paddingRight: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  resultInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cropCard: {
    flex: 0.485,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    minHeight: 168,
  },
  selectedCropCard: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
    borderWidth: 2,
  },
  selectedPrepCard: {
    borderColor: '#D97706',
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
  },
  prepCropCard: {
    opacity: 0.92,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 1,
  },
  statusBadgeReady: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgePrep: {
    backgroundColor: '#FFF3E0',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusBadgeTextReady: {
    color: '#2E7D32',
  },
  statusBadgeTextPrep: {
    color: '#D97706',
  },
  cropImage: {
    width: 62,
    height: 62,
    marginTop: 10,
    marginBottom: 8,
  },
  cropName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
    minHeight: 36,
  },
  selectedCropName: {
    color: Colors.primary,
    fontWeight: '700',
  },
  selectedPrepName: {
    color: '#B45309',
    fontWeight: '700',
  },
  cropRawName: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 6,
  },
  capabilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    marginTop: 2,
  },
  capBadgeGreen: {
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  capBadgeTextGreen: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2E7D32',
  },
  capBadgeAmber: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  capBadgeTextAmber: {
    fontSize: 9,
    fontWeight: '600',
    color: '#92400E',
  },
  prepNoticeBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  prepNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginBottom: 2,
  },
  prepNoticeBody: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  resetSearchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primarySoft,
  },
  resetSearchText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});