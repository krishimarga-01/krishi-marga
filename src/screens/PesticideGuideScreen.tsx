import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';

interface PesticideRecord {
  id: string;
  name: string;
  manufacturer: string;
  activeIngredient: string;
  formulation: string;
  targetCrops: string;
  targetPestOrDisease: string;
  dosage: string;
  waitingPeriod: string;
  toxicityTriangle: 'Green' | 'Blue' | 'Yellow' | 'Red';
  safetyNotice: string;
  cibrcReg: string;
  isBanned?: boolean;
}

const PESTICIDE_DATABASE: PesticideRecord[] = [
  {
    id: 'coragen',
    name: 'Coragen 18.5 SC',
    manufacturer: 'FMC India Private Limited',
    activeIngredient: 'Chlorantraniliprole 18.5% SC',
    formulation: 'SC (Suspension Concentrate)',
    targetCrops: 'Paddy, Tomato, Cotton, Sugarcane, Maize, Chilli',
    targetPestOrDisease: 'Stem Borer, Fruit Borer, Bollworm, Shoot Borer, FAW',
    dosage: '150 ml/ha (0.3 ml/L water)',
    waitingPeriod: 'Tomato: 3 days · Chilli: 3 days · Cotton: 9 days · Rice: 47 days',
    toxicityTriangle: 'Green',
    safetyNotice: 'Very safe to non-target predatory beneficials, spiders, and honeybees.',
    cibrcReg: 'CIBRC Reg. CIR-61,789/2009-Chlorantraniliprole-182',
  },
  {
    id: 'dithane_m45',
    name: 'Dithane M-45 / Indofil M-45',
    manufacturer: 'Indofil Industries / UPL Limited',
    activeIngredient: 'Mancozeb 75% WP',
    formulation: 'WP (Wettable Powder)',
    targetCrops: 'Tomato, Chilli, Paddy, Potato, Groundnut, Grapes',
    targetPestOrDisease: 'Early Blight, Late Blight, Anthracnose, Brown Spot, Tikka',
    dosage: '1.5 - 2.0 kg/ha (2.0 - 2.5 g/L water)',
    waitingPeriod: 'Tomato: 3-5 days · Chilli: 7 days · Paddy: 15 days',
    toxicityTriangle: 'Blue',
    safetyNotice: 'Prophylactic contact fungicide. Irritating to eyes; wear mask and goggles.',
    cibrcReg: 'CIBRC Reg. CIR-1,234/71-Mancozeb-8',
  },
  {
    id: 'baan_beam',
    name: 'Baan 75 WP / Beam 75 WP',
    manufacturer: 'Indofil Industries / Corteva Agriscience',
    activeIngredient: 'Tricyclazole 75% WP',
    formulation: 'WP (Wettable Powder)',
    targetCrops: 'Paddy / Rice',
    targetPestOrDisease: 'Leaf Blast, Neck Blast, Node Blast (Pyricularia oryzae)',
    dosage: '300 - 400 g/ha (0.6 g/L water)',
    waitingPeriod: '30 days before harvest',
    toxicityTriangle: 'Yellow',
    safetyNotice: 'Systemic blast specialist. Poisonous to aquatic fish; do not spray near ponds.',
    cibrcReg: 'CIBRC Reg. CIR-54,231/99-Tricyclazole-412',
  },
  {
    id: 'contaf_plus',
    name: 'Contaf Plus 5 SC',
    manufacturer: 'Rallis India Limited (Tata Enterprises)',
    activeIngredient: 'Hexaconazole 5% SC',
    formulation: 'SC (Suspension Concentrate)',
    targetCrops: 'Paddy / Rice, Mango, Groundnut',
    targetPestOrDisease: 'Sheath Blight (Rhizoctonia), Powdery Mildew, Tikka spot',
    dosage: '1000 ml/ha (2.0 ml/L water directed at tiller bases)',
    waitingPeriod: '30 days for rice · 40 days for mango',
    toxicityTriangle: 'Blue',
    safetyNotice: 'Broad-spectrum triazole fungicide. Harmful if swallowed or absorbed.',
    cibrcReg: 'CIBRC Reg. CIR-28,912/98-Hexaconazole-114',
  },
  {
    id: 'pegasus',
    name: 'Pegasus 50 WP',
    manufacturer: 'Syngenta India Limited',
    activeIngredient: 'Diafenthiuron 50% WP',
    formulation: 'WP (Wettable Powder)',
    targetCrops: 'Cotton, Chilli, Tomato, Brinjal, Cabbage',
    targetPestOrDisease: 'Whitefly, Chilli Thrips, Yellow Mites, DBM',
    dosage: '600 g/ha (1.2 g/L water)',
    waitingPeriod: 'Tomato: 5 days · Chilli: 7 days · Cotton: 30 days',
    toxicityTriangle: 'Blue',
    safetyNotice: 'Apply during bright sunlight for optimum photolytic activation.',
    cibrcReg: 'CIBRC Reg. CIR-48,512/2004-Diafenthiuron-219',
  },
  {
    id: 'blitox',
    name: 'Blitox 50 WP / Blue Copper',
    manufacturer: 'Tata Rallis / Crystal Crop Protection',
    activeIngredient: 'Copper Oxychloride 50% WP',
    formulation: 'WP (Wettable Powder)',
    targetCrops: 'Coconut, Arecanut, Black Pepper, Cardamom, Coffee, Rubber',
    targetPestOrDisease: 'Bud Rot, Koleroga/Mahali, Quick Wilt, Leaf Rust, Abnormal Fall',
    dosage: '2.5 - 3.0 g/L water (or 10% paste for trunk wounds)',
    waitingPeriod: 'Tomato: 3 days · Plantation: 15-30 days',
    toxicityTriangle: 'Blue',
    safetyNotice: 'Corrosive to metal tanks; rinse sprayers after use. Essential pre-monsoon.',
    cibrcReg: 'CIBRC Reg. CIR-892/71-Copper Oxychloride-12',
  },
  {
    id: 'pexalon',
    name: 'Pexalon 10 SC',
    manufacturer: 'Corteva Agriscience India',
    activeIngredient: 'Triflumezopyrim 10% SC',
    formulation: 'SC (Suspension Concentrate)',
    targetCrops: 'Paddy / Rice',
    targetPestOrDisease: 'Brown Plant Hopper (BPH), Whitebacked Plant Hopper (WBPH)',
    dosage: '235 ml/ha (0.48 ml/L water)',
    waitingPeriod: '21 days before harvest',
    toxicityTriangle: 'Blue',
    safetyNotice: 'Single application per season. Direct spray strictly to base of tillers.',
    cibrcReg: 'CIBRC Reg. CIR-142,390/2017-Triflumezopyrim-481',
  },
  {
    id: 'ridomil_gold',
    name: 'Ridomil Gold MZ 68 WG',
    manufacturer: 'Syngenta India / UPL Limited',
    activeIngredient: 'Metalaxyl-M 4% + Mancozeb 64% WG',
    formulation: 'WG (Water Dispersible Granule)',
    targetCrops: 'Tomato, Potato, Black Pepper, Cardamom, Grapes',
    targetPestOrDisease: 'Late Blight, Foot Rot (Quick Wilt), Azhukal, Downy Mildew',
    dosage: '1.5 - 2.0 kg/ha (2.0 g/L water)',
    waitingPeriod: 'Tomato: 5 days · Black Pepper: 30 days',
    toxicityTriangle: 'Blue',
    safetyNotice: 'Dual systemic & contact action. Do not exceed 2 consecutive applications.',
    cibrcReg: 'CIBRC Reg. CIR-25,618/97-Metalaxyl+Mancozeb-142',
  },
  {
    id: 'banned_alert',
    name: 'BANNED CHEMICALS REGULATORY ALERT',
    manufacturer: 'Central Insecticides Board (CIBRC / DPPQS)',
    activeIngredient: 'Endosulfan, Monocrotophos (vegetables), Phorate',
    formulation: 'PROHIBITED FORMULATIONS',
    targetCrops: 'Strictly prohibited on food crops',
    targetPestOrDisease: 'ILLEGAL TO RECOMMEND OR APPLY',
    dosage: 'ZERO DOSAGE (BANNED NATIONWIDE)',
    waitingPeriod: 'NOT APPLICABLE',
    toxicityTriangle: 'Red',
    safetyNotice: 'Endosulfan is banned nationwide by the Supreme Court of India. Monocrotophos is banned for vegetables under Gazette S.O. 3951(E). Krishi Marga never recommends banned pesticides.',
    cibrcReg: 'Gazette S.O. 3951(E) & DPPQS Banned List',
    isBanned: true,
  },
];

export const PesticideGuideScreen = ({ navigation }: any) => {
  const [search, setSearch] = useState('');

  const filtered = PESTICIDE_DATABASE.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.activeIngredient.toLowerCase().includes(search.toLowerCase()) ||
      p.targetCrops.toLowerCase().includes(search.toLowerCase()) ||
      p.targetPestOrDisease.toLowerCase().includes(search.toLowerCase())
  );

  const getToxicityColor = (color: string) => {
    switch (color) {
      case 'Green':
        return { bg: '#E8F8EE', text: '#1E7E34', border: '#C3E6CB' };
      case 'Blue':
        return { bg: '#EBF2FA', text: '#1D6FBA', border: '#BEE5EB' };
      case 'Yellow':
        return { bg: '#FFF9E6', text: '#B7791F', border: '#FFEEBA' };
      case 'Red':
        return { bg: '#FDF2E9', text: '#C53030', border: '#F5C6CB' };
      default:
        return { bg: '#F7FAF8', text: '#5A6E60', border: '#E2E8E2' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <TopLeafDecoration />
      <GlobalHeader />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
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

            {/* Screen Title */}
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>Pesticide & Fungicide Guide</Text>
              <Text style={styles.screenSubtitle}>
                Verified CIBRC approved dosages, waiting periods & safety
              </Text>
            </View>

            {/* Label Scanner Shortcut Card */}
            <TouchableOpacity
              style={styles.scannerShortcutCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('PesticideScanner')}
            >
              <View style={styles.scanIconCircle}>
                <Text style={styles.scanEmoji}>📷</Text>
              </View>
              <View style={styles.scanTextWrap}>
                <Text style={styles.scanCardTitle}>Scan Pesticide Label</Text>
                <Text style={styles.scanCardSub}>
                  Take a photo of container label for verification
                </Text>
              </View>
              <Text style={styles.scanChevron}>›</Text>
            </TouchableOpacity>

            {/* Search Input */}
            <View style={styles.searchWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search pesticide, active ingredient, crop..."
                placeholderTextColor="#78909C"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const tox = getToxicityColor(item.toxicityTriangle);

          return (
            <View
              style={[
                styles.pesticideCard,
                item.isBanned && styles.bannedCardBorder,
              ]}
            >
              {/* Header: Product Name + Toxicity Pill */}
              <View style={styles.cardTopRow}>
                <View style={styles.nameWrap}>
                  <Text
                    style={[
                      styles.productName,
                      item.isBanned && { color: '#C53030' },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.manufacturer}>{item.manufacturer}</Text>
                </View>
                <View
                  style={[
                    styles.toxBadge,
                    { backgroundColor: tox.bg, borderColor: tox.border },
                  ]}
                >
                  <Text style={[styles.toxText, { color: tox.text }]}>
                    {item.toxicityTriangle} Label
                  </Text>
                </View>
              </View>

              {/* Active Ingredient */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Active Chemical:</Text>
                <Text style={styles.infoValue}>{item.activeIngredient}</Text>
              </View>

              {/* Target Crops */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Approved Crops:</Text>
                <Text style={styles.infoValue}>{item.targetCrops}</Text>
              </View>

              {/* Target Pests */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Target Pests/Disease:</Text>
                <Text style={styles.infoValue}>
                  {item.targetPestOrDisease}
                </Text>
              </View>

              {/* Approved Dosage */}
              <View style={styles.dosageBox}>
                <Text style={styles.dosageLabel}>CIBRC Approved Dosage:</Text>
                <Text style={styles.dosageValue}>{item.dosage}</Text>
              </View>

              {/* Pre-Harvest Waiting Period (PHI) */}
              <View style={styles.phiRow}>
                <Text style={styles.phiLabel}>Waiting Period (PHI):</Text>
                <Text style={styles.phiValue}>{item.waitingPeriod}</Text>
              </View>

              {/* Safety Advisory */}
              <View style={styles.safetyBox}>
                <Text style={styles.safetyLabel}>Farmer Safety:</Text>
                <Text style={styles.safetyText}>{item.safetyNotice}</Text>
              </View>

              {/* Regulatory Registration */}
              <Text style={styles.cibrcFooter}>{item.cibrcReg}</Text>
            </View>
          );
        }}
        ListFooterComponent={<LandscapeBanner />}
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
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#162836',
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#5A6E60',
    marginTop: 3,
  },
  scannerShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  scanIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanEmoji: {
    fontSize: 20,
  },
  scanTextWrap: {
    flex: 1,
  },
  scanCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#162836',
  },
  scanCardSub: {
    fontSize: 12,
    color: '#5A6E60',
    marginTop: 2,
  },
  scanChevron: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2E7D32',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8E2',
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#162836',
  },
  clearText: {
    fontSize: 14,
    color: '#9EABB2',
    padding: 4,
  },
  pesticideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    elevation: 1,
  },
  bannedCardBorder: {
    borderColor: '#F5C6CB',
    backgroundColor: '#FFF8F8',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nameWrap: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#162836',
  },
  manufacturer: {
    fontSize: 12,
    color: '#78909C',
    marginTop: 2,
  },
  toxBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  toxText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6E60',
  },
  infoValue: {
    fontSize: 13.5,
    color: '#162836',
    marginTop: 1,
  },
  dosageBox: {
    backgroundColor: '#F0F9F3',
    padding: 10,
    borderRadius: 12,
    marginVertical: 8,
  },
  dosageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B5E20',
  },
  dosageValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#162836',
    marginTop: 2,
  },
  phiRow: {
    marginBottom: 8,
  },
  phiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  phiValue: {
    fontSize: 12.5,
    color: '#162836',
    marginTop: 1,
  },
  safetyBox: {
    backgroundColor: '#F7FAF8',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  safetyLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5A6E60',
  },
  safetyText: {
    fontSize: 12,
    color: '#334E68',
    lineHeight: 16,
    marginTop: 2,
  },
  cibrcFooter: {
    fontSize: 10.5,
    color: '#9EABB2',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
