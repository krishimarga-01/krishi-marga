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
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Crops' },
  { id: 'vegetable', label: 'Vegetables' },
  { id: 'fruit', label: 'Fruits' },
  { id: 'cereal', label: 'Cereals' },
  { id: 'pulse', label: 'Pulses' },
  { id: 'plantation', label: 'Plantation' },
  { id: 'spice', label: 'Spices' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'oilseed', label: 'Oilseeds' },
];

export const CropSelectScreen = ({ navigation }: any) => {
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Priority crops for default view matching Reference 4
  const PRIORITY_FIRST_ORDER = [
    'banana',
    'tomato',
    'chilli',
    'brinjal',
    'potato',
    'paddy',
    'maize',
    'cotton',
    'sugarcane',
  ];

  // Filtered crops based on search query and category
  const filteredCrops = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = CROPS_CONFIG.filter((c) => {
      // Category filter
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (!q) return true;
      const localized = t(c.nameKey).toLowerCase();
      const raw = c.rawName.toLowerCase();
      const matchesKeyword =
        c.searchKeywords &&
        c.searchKeywords.some((k) => k.toLowerCase().includes(q));

      return localized.includes(q) || raw.includes(q) || matchesKeyword;
    });

    // When viewing All Crops without search query, present the 9 showcase crops first
    if (selectedCategory === 'all' && !q) {
      const top9: CropConfig[] = [];
      const remainder: CropConfig[] = [];
      const priorityMap = new Map<string, CropConfig>();

      list.forEach((crop) => {
        if (PRIORITY_FIRST_ORDER.includes(crop.id)) {
          priorityMap.set(crop.id, crop);
        } else {
          remainder.push(crop);
        }
      });

      PRIORITY_FIRST_ORDER.forEach((id) => {
        const c = priorityMap.get(id);
        if (c) top9.push(c);
      });

      return [...top9, ...remainder];
    }

    return list;
  }, [selectedCategory, search, t]);

  const handleSelectCrop = (crop: CropConfig) => {
    if (!crop.modelAvailable) {
      Alert.alert(
        'Model Under Preparation',
        `AI disease detection for ${t(crop.nameKey)} is currently being trained. You can still scan and consult crop experts in Nearby Help.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Consult Expert',
            onPress: () => navigation.navigate('Nearby Help'),
          },
        ]
      );
      return;
    }

    navigation.navigate('CameraCapture', {
      crop: crop.rawName,
      cropDisplayName: t(crop.nameKey),
      cropId: crop.id,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader onNotificationPress={() => navigation.navigate('Settings')} />

      <FlatList
        data={filteredCrops}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Screen Title & Subtitle */}
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>Select Your Crop</Text>
              <Text style={styles.screenSubtitle}>
                Choose the crop you want to inspect
              </Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search crops..."
                placeholderTextColor="#78909C"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  style={styles.clearBtn}
                >
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Horizontal Category Chips */}
            <View style={styles.categoryContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        isActive && styles.categoryChipActive,
                      ]}
                      onPress={() => setSelectedCategory(cat.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isActive && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Count indicator */}
            <View style={styles.countRow}>
              <Text style={styles.countText}>
                Showing {filteredCrops.length} of {CROPS_CONFIG.length} crops
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          // Cycle through soft pastel tint backgrounds matching Reference 4
          const tintBg =
            Colors.pastelTints[index % Colors.pastelTints.length] || '#FFF8E1';

          return (
            <TouchableOpacity
              style={[styles.cropCard, { backgroundColor: tintBg }]}
              activeOpacity={0.82}
              onPress={() => handleSelectCrop(item)}
            >
              {/* Crop Representative Image */}
              <View style={styles.cropImageWrapper}>
                <Image
                  source={item.image}
                  style={styles.cropImage}
                  resizeMode="contain"
                />
              </View>

              {/* Card Footer: Crop Name & Right Chevron */}
              <View style={styles.cardFooter}>
                <Text style={styles.cropName} numberOfLines={1}>
                  {t(item.nameKey)}
                </Text>
                <Text style={styles.cropChevron}>›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View>
            {/* Don't See Your Crop Card */}
            <TouchableOpacity
              style={styles.moreCropsCard}
              activeOpacity={0.85}
              onPress={() => {
                Alert.alert(
                  'Crop Catalogue',
                  `Krishi Marga covers 76 crops across South India. If your crop is missing, our agronomy team will add it in the next update.`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.moreCropIconCircle}>
                <Text style={styles.moreCropEmoji}>🌱</Text>
              </View>
              <View style={styles.moreCropTextWrap}>
                <Text style={styles.moreCropTitle}>Don't see your crop?</Text>
                <Text style={styles.moreCropSubtitle}>
                  More crops coming soon!
                </Text>
              </View>
              <Text style={styles.moreChevron}>›</Text>
            </TouchableOpacity>

            {/* Bottom Landscape Illustration */}
            <LandscapeBanner />
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
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
  titleSection: {
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8E2',
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#162836',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#9EABB2',
    fontWeight: '700',
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryScroll: {
    paddingRight: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8E2',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#5A6E60',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  countRow: {
    marginBottom: 12,
  },
  countText: {
    fontSize: 12,
    color: '#78909C',
    fontWeight: '500',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cropCard: {
    flex: 0.31,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cropImageWrapper: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cropImage: {
    width: '100%',
    height: '100%',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  cropName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#162836',
    flex: 1,
  },
  cropChevron: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2E7D32',
    marginLeft: 2,
  },
  moreCropsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F3',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D3ECDB',
    marginTop: 14,
    marginBottom: 10,
  },
  moreCropIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCF1E3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  moreCropEmoji: {
    fontSize: 22,
  },
  moreCropTextWrap: {
    flex: 1,
  },
  moreCropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#162836',
    marginBottom: 2,
  },
  moreCropSubtitle: {
    fontSize: 12.5,
    color: '#5A6E60',
  },
  moreChevron: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },
});