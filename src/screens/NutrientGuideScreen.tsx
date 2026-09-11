import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { GlobalHeader } from '../components/GlobalHeader';
import { TopLeafDecoration } from '../components/TopLeafDecoration';
import { LandscapeBanner } from '../components/LandscapeBanner';

interface NutrientDeficiency {
  id: string;
  crop: string;
  nutrient: string;
  affectedPart: string;
  visualSymptoms: string;
  soilCauses: string;
  prevention: string;
  correctionMeasures: string;
  fertilizerCategory: string;
}

const NUTRIENT_DIRECTORY: NutrientDeficiency[] = [
  {
    id: 'rice_nitrogen',
    crop: 'Paddy / Rice',
    nutrient: 'Nitrogen (N)',
    affectedPart: 'Older / Lower leaves first (Highly mobile)',
    visualSymptoms: 'Uniform pale light-green to yellow chlorosis starting from leaf tip and progressing along midrib; stunted tillering and thin culms.',
    soilCauses: 'Low organic matter, excessive leaching in sandy soils, continuous submerged denitrification.',
    prevention: 'Incorporate green manure (Sesbania / Dhaincha @ 6.25 t/ha) prior to puddling; split nitrogen doses.',
    correctionMeasures: 'Top-dress with Urea or apply 1-2% foliar spray of Urea early morning for rapid greening.',
    fertilizerCategory: 'Straight Nitrogenous Fertilizer',
  },
  {
    id: 'maize_nitrogen',
    crop: 'Maize / Corn',
    nutrient: 'Nitrogen (N)',
    affectedPart: 'Lowest leaves first',
    visualSymptoms: 'Characteristic yellowing starting at leaf tip and progressing in an inverted V-shape along central midrib, leaving margins green longest.',
    soilCauses: 'Heavy rainfall leaching, waterlogging inhibiting root respiration, low soil organic carbon.',
    prevention: 'Band placement of basal nitrogen and split top-dressing at knee-high and tasseling stages.',
    correctionMeasures: 'Foliar spray of 2% Urea or side-dress with Ammonium Sulphate / Urea as per soil test.',
    fertilizerCategory: 'Straight Nitrogenous Fertilizer',
  },
  {
    id: 'rice_phosphorus',
    crop: 'Paddy / Rice',
    nutrient: 'Phosphorus (P)',
    affectedPart: 'Older leaves first (Mobile)',
    visualSymptoms: 'Leaves appear dark dull green with distinct bronze or purplish discoloration along margins; narrow erect leaves; severely restricted tillering.',
    soilCauses: 'Acidic laterite soils (Al/Fe phosphate fixation) or highly calcareous alkaline soils (Ca-P precipitation).',
    prevention: 'Apply Rock Phosphate in acidic soils or Single Super Phosphate (SSP) in neutral soils; use PSB biofertilizer.',
    correctionMeasures: 'Basal application of phosphatic fertilizer; in standing crop, spray 1% DAP or 0.5% 13-0-45.',
    fertilizerCategory: 'Phosphatic Fertilizer',
  },
  {
    id: 'tomato_calcium',
    crop: 'Tomato',
    nutrient: 'Calcium (Ca)',
    affectedPart: 'Growing tips & fruit blossom end (Immobile)',
    visualSymptoms: 'Blossom End Rot (BER) on fruits: dark brown to black flattened sunken leathery patch at blossom end of fruit; apical leaves cup downward.',
    soilCauses: 'Fluctuating soil moisture, excessive ammonium or potassium fertilization interfering with calcium uptake.',
    prevention: 'Maintain uniform soil moisture with drip irrigation; avoid excessive nitrogen top-dressing; apply agricultural lime.',
    correctionMeasures: 'Foliar spray of Calcium Nitrate (18.8% Ca) @ 5g/L or Chelated Calcium (EDTA-Ca) @ 1.5g/L during early fruit set.',
    fertilizerCategory: 'Calcium Fertilizer',
  },
  {
    id: 'chilli_magnesium',
    crop: 'Chilli',
    nutrient: 'Magnesium (Mg)',
    affectedPart: 'Older and middle leaves (Mobile)',
    visualSymptoms: 'Distinct interveinal chlorosis: leaf veins remain green while interveinal tissue turns bright yellow to bronze; margins curl upward.',
    soilCauses: 'Excess potassium or calcium competing for root uptake; leached acidic sandy soils.',
    prevention: 'Soil application of Dolomite or Magnesium Sulphate (Epsom salt) during field preparation.',
    correctionMeasures: 'Foliar spray of Magnesium Sulphate @ 5g/L or 10g/L at 15-day intervals.',
    fertilizerCategory: 'Secondary Nutrient Fertilizer',
  },
  {
    id: 'rice_zinc',
    crop: 'Paddy / Rice',
    nutrient: 'Zinc (Zn)',
    affectedPart: 'Middle and younger leaves (2-4 weeks after transplanting)',
    visualSymptoms: 'Khaira disease: brownish-red or rust-colored blotches/streaks along leaf midrib; plants stunted in patches.',
    soilCauses: 'Calcareous black soils (pH >7.8), continuous submergence causing insoluble zinc sulphide, excessive P fertilizer.',
    prevention: 'Basal soil application of Zinc Sulphate (21% or 33%) @ 25 kg/ha once every 3 seasons.',
    correctionMeasures: 'Foliar spray of Zinc Sulphate @ 5g/L + Lime @ 2.5g/L neutralizer twice at 10-day intervals.',
    fertilizerCategory: 'Micronutrient Fertilizer',
  },
  {
    id: 'cotton_potassium',
    crop: 'Cotton',
    nutrient: 'Potassium (K)',
    affectedPart: 'Older leaves migrating to top leaves during boll load',
    visualSymptoms: 'Yellowish-white mottling between veins followed by marginal necrosis; leaf tips curl downwards and scorch (marginal firing); reddish bronzing.',
    soilCauses: 'High-yielding Bt hybrids depleting soil K reserves; coarse sandy soils with low CEC.',
    prevention: 'Apply split dose of Muriate of Potash (MOP) at sowing and 45-60 days after sowing.',
    correctionMeasures: 'Foliar spray of Potassium Nitrate (13:0:45) @ 10g/L or SOP (0:0:50) @ 10g/L weekly during boll formation.',
    fertilizerCategory: 'Potassic Fertilizer',
  },
];

export const NutrientGuideScreen = ({ navigation }: any) => {
  const [search, setSearch] = useState('');

  const filtered = NUTRIENT_DIRECTORY.filter(
    (n) =>
      n.nutrient.toLowerCase().includes(search.toLowerCase()) ||
      n.crop.toLowerCase().includes(search.toLowerCase()) ||
      n.visualSymptoms.toLowerCase().includes(search.toLowerCase())
  );

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
              <Text style={styles.screenTitle}>Nutrient & Soil Deficiencies</Text>
              <Text style={styles.screenSubtitle}>
                Visual deficiency diagnosis, leaf symptoms & corrective fertilizers
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search nutrient (N, P, K, Ca, Mg, Zn), crop, symptom..."
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.cropBadge}>{item.crop}</Text>
                <Text style={styles.nutrientName}>{item.nutrient} Deficiency</Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>
                  {item.fertilizerCategory}
                </Text>
              </View>
            </View>

            {/* Position */}
            <Text style={styles.positionText}>📍 Affected: {item.affectedPart}</Text>

            {/* Symptoms */}
            <View style={styles.symptomBox}>
              <Text style={styles.boxTitle}>Visual Leaf Symptoms:</Text>
              <Text style={styles.boxBody}>{item.visualSymptoms}</Text>
            </View>

            {/* Soil Causes */}
            <View style={styles.soilBox}>
              <Text style={styles.soilTitle}>Soil & Environmental Causes:</Text>
              <Text style={styles.soilBody}>{item.soilCauses}</Text>
            </View>

            {/* Correction */}
            <View style={styles.correctionBox}>
              <Text style={styles.correctionTitle}>⚡ Corrective Fertilizer Measure:</Text>
              <Text style={styles.correctionBody}>{item.correctionMeasures}</Text>
              <Text style={styles.preventionSub}>Prevention: {item.prevention}</Text>
            </View>
          </View>
        )}
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8ECE8',
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerLeft: {
    flex: 1,
  },
  cropBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    textTransform: 'uppercase',
  },
  nutrientName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#162836',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  positionText: {
    fontSize: 12,
    color: '#78909C',
    fontWeight: '600',
    marginBottom: 10,
  },
  symptomBox: {
    backgroundColor: '#FEF9E7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  boxBody: {
    fontSize: 12.5,
    color: '#4A5568',
    lineHeight: 18,
  },
  soilBox: {
    backgroundColor: '#F7FAF8',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  soilTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5A6E60',
    marginBottom: 2,
  },
  soilBody: {
    fontSize: 12,
    color: '#334E68',
    lineHeight: 17,
  },
  correctionBox: {
    backgroundColor: '#E8F8EE',
    padding: 12,
    borderRadius: 12,
  },
  correctionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 3,
  },
  correctionBody: {
    fontSize: 13,
    fontWeight: '700',
    color: '#162836',
    lineHeight: 18,
  },
  preventionSub: {
    fontSize: 11.5,
    color: '#2E7D32',
    lineHeight: 16,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
