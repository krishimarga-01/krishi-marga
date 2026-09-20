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

interface PestItem {
  id: string;
  crop: string;
  pestName: string;
  scientificName: string;
  localName: string;
  symptoms: string;
  favorableWeather: string;
  severity: 'Critical' | 'Severe' | 'Moderate';
  prevention: string;
  biologicalControl: string;
  chemicalManagement: string;
}

const PEST_DIRECTORY: PestItem[] = [
  {
    id: 'faw',
    crop: 'Maize / Corn',
    pestName: 'Fall Armyworm (FAW)',
    scientificName: 'Spodoptera frugiperda',
    localName: 'Kadaikola puzhu (Tamil) · Laskar hula (Kannada) · Rekkal purugu (Telugu)',
    symptoms: 'Young larvae scrape leaf pinholes; older larvae feed inside whorl leaving heavy windowing and dense piles of sawdust-like fecal frass; inverted Y on head.',
    favorableWeather: 'Warm semi-arid days (26-34°C), dry spells followed by rain.',
    severity: 'Critical',
    prevention: 'Synchronous planting in village clusters; erect bird perches (10/acre); whorl application of sand + wood ash (9:1).',
    biologicalControl: 'Release egg parasitoid Telenomus remus @ 1,25,000/ha; spray Bt var. kurstaki @ 2g/L or Metarhizium rileyi @ 3g/L.',
    chemicalManagement: 'Chlorantraniliprole 18.5% SC @ 0.4ml/L or Emamectin Benzoate 5% SG @ 0.4g/L directed into central whorl.',
  },
  {
    id: 'bph',
    crop: 'Paddy / Rice',
    pestName: 'Brown Plant Hopper (BPH)',
    scientificName: 'Nilaparvata lugens',
    localName: 'Pugayan (Tamil) · Sudi hula (Kannada) · Thella thengu (Telugu)',
    symptoms: 'Nymphs and adults suck sap from tiller bases causing circular patches of dry, burnt crops known as "hopper burn". Transmits grassy stunt virus.',
    favorableWeather: 'High nitrogen doses, dense planting, high humidity (>85%), standing water.',
    severity: 'Critical',
    prevention: 'Wider spacing (20x15 cm) with 30cm alleyways every 2 meters; avoid synthetic pyrethroids.',
    biologicalControl: 'Alternate wetting and drying (AWD); drain water for 3-4 days; conserve mirid bugs (Cyrtorhinus).',
    chemicalManagement: 'Triflumezopyrim 10% SC @ 0.48ml/L or Pymetrozine 50% WDG @ 0.6g/L strictly at base of tillers.',
  },
  {
    id: 'stem_borer',
    crop: 'Paddy / Rice',
    pestName: 'Yellow Stem Borer',
    scientificName: 'Scirpophaga incertulas',
    localName: 'Kurutthu poochi (Tamil) · Kanda koruku hula (Kannada) · Kanda tholi (Telugu)',
    symptoms: 'Larvae bore into stem pith; causes "dead hearts" (drying central tiller) during vegetative stage and "white ears" (empty erect chaffy panicles) at heading.',
    favorableWeather: 'Stagnant deep water, night temperatures 20-26°C.',
    severity: 'Severe',
    prevention: 'Clip seedling tips before transplanting to destroy egg clusters; install sex pheromone traps @ 5/acre.',
    biologicalControl: 'Release Trichogramma japonicum @ 1,00,000/ha weekly from 30 days after transplanting.',
    chemicalManagement: 'Chlorantraniliprole 0.4% GR @ 10kg/ha or Cartap Hydrochloride 50% SP @ 2g/L.',
  },
  {
    id: 'chilli_thrips',
    crop: 'Chilli',
    pestName: 'Chilli Thrips',
    scientificName: 'Scirtothrips dorsalis',
    localName: 'Ilaipen (Tamil) · Nool hula (Kannada) · Thallu purugu (Telugu)',
    symptoms: 'Lacerate tender leaf tissue and suck cell sap; leaves curl upward into boat shapes with brown necrotic streaks on undersides; causes "murda" stunting.',
    favorableWeather: 'Hot and dry weather (30-37°C), prolonged absence of rain.',
    severity: 'Severe',
    prevention: 'Intercrop with sorghum or maize as windbreaks; install blue sticky traps (15-20 traps/acre); spray neem seed kernel extract (NSKE 5%).',
    biologicalControl: 'Spray Lecanicillium lecanii entomopathogenic fungus @ 5g/L.',
    chemicalManagement: 'Spinosad 45% SC @ 0.3ml/L or Diafenthiuron 50% WP @ 1.25g/L. Observe 7-day waiting period.',
  },
  {
    id: 'fruit_borer',
    crop: 'Tomato',
    pestName: 'Tomato Fruit Borer',
    scientificName: 'Helicoverpa armigera',
    localName: 'Kaai thulaipaan (Tamil) · Kaai koruku hula (Kannada) · Kāya tholi (Telugu)',
    symptoms: 'Larvae bore circular entry holes into tomato fruits and feed with anterior body inside; fruits rot and drop prematurely.',
    favorableWeather: 'Moderate temperatures (26-32°C), presence of alternate hosts (pigeonpea, chickpea).',
    severity: 'Critical',
    prevention: 'Intercrop with African Marigold (1 row marigold for every 16 rows tomato) as trap crop; install Helilure pheromone traps @ 5/acre.',
    biologicalControl: 'Release egg parasitoid Trichogramma chilonis @ 50,000/ha; spray HaNPV @ 250 LE/ha with 1% jaggery.',
    chemicalManagement: 'Chlorantraniliprole 18.5% SC @ 0.3ml/L (PHI: 3 days) or Emamectin Benzoate 5% SG @ 0.4g/L (PHI: 3 days).',
  },
  {
    id: 'pink_bollworm',
    crop: 'Cotton',
    pestName: 'Pink Bollworm',
    scientificName: 'Pectinophora gossypiella',
    localName: 'Semparuthi kaai puzhu (Tamil) · Gulabi kaai hula (Kannada) · Gulabi rangu purugu (Telugu)',
    symptoms: 'Rosetted flowers that fail to bloom; larvae feed on developing seeds inside bolls, staining and destroying cotton fiber lint.',
    favorableWeather: 'Extended crop duration beyond 160 days, warm humid post-monsoon weather.',
    severity: 'Critical',
    prevention: 'Strictly terminate cotton crop within 150-160 days; install Gossyplure pheromone traps @ 5/acre.',
    biologicalControl: 'Trichogrammatoidea bactrae release @ 1,50,000/ha; spray Beauveria bassiana @ 5g/L during square formation.',
    chemicalManagement: 'Chlorantraniliprole 18.5% SC @ 0.3ml/L or Emamectin Benzoate 5% SG @ 0.4g/L upon crossing ETL.',
  },
  {
    id: 'rhino_beetle',
    crop: 'Coconut',
    pestName: 'Rhinoceros Beetle',
    scientificName: 'Oryctes rhinoceros',
    localName: 'Kombu chelli (Tamil/Malayalam) · Kombu hula (Kannada) · Kombu purugu (Telugu)',
    symptoms: 'Adult beetle bores into crown heart; unfolded fronds exhibit geometric V-shaped clippings or shears pattern.',
    favorableWeather: 'Decaying manure pits or rotting stumps nearby; peaks post-monsoon.',
    severity: 'Severe',
    prevention: 'Treat manure pits with Metarhizium anisopliae; hook out beetles with curved iron needle.',
    biologicalControl: 'Place 3 naphthalene balls (10g) mixed with sand in top 3 leaf axils; release Baculovirus oryctes.',
    chemicalManagement: 'Crown placement of 5g Cartap Hydrochloride 4G granules mixed with sand in axils.',
  },
];

export const PestExplorerScreen = ({ navigation }: any) => {
  const [search, setSearch] = useState('');

  const filtered = PEST_DIRECTORY.filter(
    (p) =>
      p.pestName.toLowerCase().includes(search.toLowerCase()) ||
      p.crop.toLowerCase().includes(search.toLowerCase()) ||
      p.scientificName.toLowerCase().includes(search.toLowerCase()) ||
      p.localName.toLowerCase().includes(search.toLowerCase())
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

            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.screenTitle}>Pests & Crop Diseases</Text>
              <Text style={styles.screenSubtitle}>
                Verified symptoms, life stages & safe integrated management
              </Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search pest, crop, symptoms, regional name..."
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
          const isCritical = item.severity === 'Critical';

          return (
            <View style={styles.pestCard}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.pestTitleWrap}>
                  <Text style={styles.pestCropBadge}>{item.crop}</Text>
                  <Text style={styles.pestName}>{item.pestName}</Text>
                  <Text style={styles.scientificName}>
                    {item.scientificName}
                  </Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: isCritical ? '#FEE2E2' : '#FEF3C7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      { color: isCritical ? '#B91C1C' : '#92400E' },
                    ]}
                  >
                    {item.severity}
                  </Text>
                </View>
              </View>

              {/* Regional Names */}
              <Text style={styles.localNameText}>🏷️ {item.localName}</Text>

              {/* Damage Symptoms */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionHeading}>Damage Symptoms:</Text>
                <Text style={styles.sectionBody}>{item.symptoms}</Text>
              </View>

              {/* Favorable Weather */}
              <View style={styles.weatherBox}>
                <Text style={styles.weatherHeading}>Favorable Weather:</Text>
                <Text style={styles.weatherBody}>{item.favorableWeather}</Text>
              </View>

              {/* Non-Chemical Biological Prevention */}
              <View style={styles.bioBox}>
                <Text style={styles.bioHeading}>🌱 Biological & Cultural Prevention:</Text>
                <Text style={styles.bioBody}>{item.prevention}</Text>
                <Text style={styles.bioSubBody}>{item.biologicalControl}</Text>
              </View>

              {/* Safe Chemical Control */}
              <View style={styles.chemicalBox}>
                <Text style={styles.chemicalHeading}>🧪 CIBRC Chemical Management:</Text>
                <Text style={styles.chemicalBody}>{item.chemicalManagement}</Text>
              </View>
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
  pestCard: {
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
    marginBottom: 8,
  },
  pestTitleWrap: {
    flex: 1,
  },
  pestCropBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pestName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#162836',
  },
  scientificName: {
    fontSize: 12,
    color: '#78909C',
    fontStyle: 'italic',
    marginTop: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 11,
    fontWeight: '700',
  },
  localNameText: {
    fontSize: 12,
    color: '#4B6B55',
    backgroundColor: '#F0F9F3',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#162836',
    marginBottom: 2,
  },
  sectionBody: {
    fontSize: 12.5,
    color: '#4A5568',
    lineHeight: 18,
  },
  weatherBox: {
    backgroundColor: '#F7FAF8',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  weatherHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5A6E60',
  },
  weatherBody: {
    fontSize: 12,
    color: '#334E68',
    marginTop: 1,
  },
  bioBox: {
    backgroundColor: '#E8F8EE',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  bioHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 2,
  },
  bioBody: {
    fontSize: 12,
    color: '#2E7D32',
    lineHeight: 17,
  },
  bioSubBody: {
    fontSize: 11.5,
    color: '#2E7D32',
    lineHeight: 16,
    marginTop: 4,
    fontStyle: 'italic',
  },
  chemicalBox: {
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
  },
  chemicalHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 2,
  },
  chemicalBody: {
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 17,
  },
});
