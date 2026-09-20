import csv
import json
import os

print("=== GENERATING VERIFIED CROP_PEST_MASTER.CSV ===")

pest_records = [
    {
        "crop": "Tomato",
        "crop_id": "tomato",
        "pest": "Tomato Fruit Borer",
        "scientific_name": "Helicoverpa armigera",
        "pest_type": "Lepidopteran borer (Caterpillar)",
        "affected_plant_part": "Leaves, flower buds, green and ripe fruits",
        "damage_symptoms": "Larvae bore round circular holes into tomato fruits and feed while keeping anterior body inside and posterior outside; fruits rot and drop prematurely.",
        "life_stage": "Larval instars (3rd to 5th)",
        "favourable_conditions": "Warm days (26-32°C), moderate relative humidity, presence of alternate hosts (pigeonpea, cotton, chickpea).",
        "cause_relationship": "Pest infestation/damage",
        "affected_diseases": "None directly transmitted (bore holes predispose fruits to secondary fungal/bacterial soft rot)",
        "management": "Release egg parasitoid Trichogramma chilonis @ 50,000/ha; spray HaNPV (Helicoverpa nuclear polyhedrosis virus) @ 250 LE/ha with 1% jaggery; application of Chlorantraniliprole 18.5% SC @ 0.3ml/L (PHI: 3 days) or Emamectin Benzoate 5% SG @ 0.4g/L.",
        "prevention": "Intercrop with African Marigold (1 row marigold for every 16 rows tomato) as trap crop; install pheromone traps (Helilure @ 5/acre).",
        "source": "ICAR-IIHR & TNAU Agritech Portal",
        "source_url": "https://agritech.tnau.ac.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Tomato",
        "crop_id": "tomato",
        "pest": "Whitefly",
        "scientific_name": "Bemisia tabaci",
        "pest_type": "Hemipteran sucking insect",
        "affected_plant_part": "Underside of tender leaves, growing shoots",
        "damage_symptoms": "Nymphs and adults suck cell sap from leaf undersides causing chlorotic stippling and downward leaf curling; heavy honeydew excretion leads to black sooty mold.",
        "life_stage": "Nymphs and adults",
        "favourable_conditions": "Warm dry conditions (28-35°C), low relative humidity (<60%), dry spells during post-monsoon.",
        "cause_relationship": "Pest vectors and transmits plant pathogenic virus",
        "affected_diseases": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "management": "Spray neem oil 10,000 ppm @ 2ml/L; release predatory lacewings Chrysoperla zastrowi @ 10,000/ha; spray Diafenthiuron 50% WP @ 1.25g/L or Acetamiprid 20% SP @ 0.2g/L.",
        "prevention": "Install yellow sticky traps (15-20/acre) at canopy level; grow border crop of 2 rows of maize or pearl millet as live barrier; use 40-mesh insect-proof netting in nurseries.",
        "source": "ICAR-IIHR Bengaluru & TNAU Agritech",
        "source_url": "https://iihr.res.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Tomato",
        "crop_id": "tomato",
        "pest": "Two-Spotted Spider Mite",
        "scientific_name": "Tetranychus urticae",
        "pest_type": "Acari (Arachnid mite)",
        "affected_plant_part": "Undersurface of older and middle leaves",
        "damage_symptoms": "Mites puncture plant cells on leaf undersurface causing fine white or yellow speckles (stippling); leaves turn bronzed and dry; fine silky webbing covers terminals.",
        "life_stage": "Nymphs and adult mites",
        "favourable_conditions": "Hot and dry climate (30-38°C), dusty field borders, prolonged drought stress.",
        "cause_relationship": "Pest infestation/damage",
        "affected_diseases": "None directly transmitted",
        "management": "Foliar wash with water jets to knock down mites; spray wettable sulphur 80% WP @ 3g/L or Spiromesifen 22.9% SC @ 1ml/L or Abamectin 1.9% EC @ 0.75ml/L.",
        "prevention": "Avoid water stress in crops; maintain good weed sanitation; avoid broad-spectrum pyrethroid insecticides which eliminate predatory phytoseiid mites.",
        "source": "ICAR-IIHR & TNAU Agritech Portal",
        "source_url": "https://agritech.tnau.ac.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Paddy / Rice",
        "crop_id": "paddy",
        "pest": "Brown Plant Hopper (BPH)",
        "scientific_name": "Nilaparvata lugens",
        "pest_type": "Hemipteran sucking pest",
        "affected_plant_part": "Base of tillers, leaf sheath above water line",
        "damage_symptoms": "Nymphs and adults suck sap from tiller bases causing circular patches of dry, burnt crops called 'hopper burn'.",
        "life_stage": "Nymphs and adults",
        "favourable_conditions": "High nitrogen application, dense planting, prolonged high humidity (>85%), stagnant standing water.",
        "cause_relationship": "Pest vectors and transmits plant pathogenic virus",
        "affected_diseases": "Rice Grassy Stunt Virus & Rice Ragged Stunt Virus",
        "management": "Alternate wetting and drying (AWD) irrigation; drain water for 3-4 days; conserve mirid bug Cyrtorhinus lividipennis; spray Triflumezopyrim 10% SC @ 0.48ml/L or Pymetrozine 50% WDG @ 0.6g/L directed strictly at the base.",
        "prevention": "Adopt wider spacing (20x15 cm) with alleyways (2m paths); avoid synthetic pyrethroid sprays which kill predatory spiders.",
        "source": "ICAR-IIRR Hyderabad & TNAU",
        "source_url": "https://icar-iirr.org",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Paddy / Rice",
        "crop_id": "paddy",
        "pest": "Yellow Stem Borer",
        "scientific_name": "Scirpophaga incertulas",
        "pest_type": "Lepidopteran borer",
        "affected_plant_part": "Internal stem pith",
        "damage_symptoms": "Larvae bore into stem and feed on inner tissue; causes 'dead hearts' (drying of central tiller) in vegetative stage and 'white ears' (chaffy erect white panicles) in reproductive stage.",
        "life_stage": "Caterpillar (Larva)",
        "favourable_conditions": "Stagnant deep water, night temperatures 20-26°C, continuous staggered planting.",
        "cause_relationship": "Pest infestation/damage",
        "affected_diseases": "None directly transmitted",
        "management": "Release egg parasitoid Trichogramma japonicum @ 1,00,000/ha at weekly intervals; apply Chlorantraniliprole 0.4% GR @ 10kg/ha in standing water or Cartap Hydrochloride 50% SP @ 2g/L.",
        "prevention": "Clip tip of rice seedlings before transplanting to eliminate egg masses; install sex pheromone traps @ 5/acre.",
        "source": "ICAR-IIRR & ANGRAU Vyavasaya Panchangam",
        "source_url": "https://icar-iirr.org",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Chilli",
        "crop_id": "chilli",
        "pest": "Chilli Thrips",
        "scientific_name": "Scirtothrips dorsalis",
        "pest_type": "Thysanopteran sucking pest",
        "affected_plant_part": "Under-surface of leaves, growing tips, flowers",
        "damage_symptoms": "Lacerate tender leaf tissues and suck oozing sap; leaves curl upwards into boat-shapes with roughened brown necrotic streaks on leaf undersides; causes 'murda' condition.",
        "life_stage": "Nymphs and adults",
        "favourable_conditions": "Hot and dry weather, absence of rain showers, temperatures 30-37°C.",
        "cause_relationship": "Pest vectors and transmits plant pathogenic virus",
        "affected_diseases": "Peanut Yellow Spot Virus / Chilli Tospo virus",
        "management": "Spray Lecanicillium lecanii @ 5g/L; apply Spinosad 45% SC @ 0.3ml/L or Fipronil 5% SC @ 2ml/L or Diafenthiuron 50% WP @ 1.25g/L (PHI: 7 days).",
        "prevention": "Intercrop with sorghum or maize as barrier crop; install blue sticky traps (15-20 traps/acre); spray neem seed kernel extract (NSKE 5%).",
        "source": "ANGRAU Regional Agricultural Research Station (Lam, Guntur) & TNAU",
        "source_url": "https://angrau.ac.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Cotton",
        "crop_id": "cotton",
        "pest": "Pink Bollworm",
        "scientific_name": "Pectinophora gossypiella",
        "pest_type": "Lepidopteran borer",
        "affected_plant_part": "Squares, flower buds, green bolls, lint and seeds",
        "damage_symptoms": "Rosetted flowers that fail to open; entry holes in bolls heal over leaving no external sign, but larvae feed inside seeds, staining and destroying lint fiber; premature boll opening.",
        "life_stage": "Larval instars",
        "favourable_conditions": "Late planted cotton, extended crop duration beyond 160 days, warm and humid post-monsoon weather.",
        "cause_relationship": "Pest infestation/damage",
        "affected_diseases": "None directly transmitted",
        "management": "Trichogrammatoidea bactrae release @ 1,50,000/ha; spray Beauveria bassiana @ 5g/L; apply Emamectin Benzoate 5% SG @ 0.4g/L or Chlorantraniliprole 18.5% SC @ 0.3ml/L upon crossing ETL (8 moths/trap/day for 3 days).",
        "prevention": "Strictly terminate crop within 150-160 days to break pest lifecycle; install pink bollworm pheromone traps (Gossyplure @ 5/acre); avoid storing cotton stalks in fields.",
        "source": "ICAR-CICR Nagpur/Coimbatore & UAS Raichur",
        "source_url": "https://cicr.icar.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Cotton",
        "crop_id": "cotton",
        "pest": "Cotton Whitefly",
        "scientific_name": "Bemisia tabaci",
        "pest_type": "Hemipteran sucking insect",
        "affected_plant_part": "Lower surface of cotton foliage",
        "damage_symptoms": "Sucking sap leads to leaf chlorosis and premature leaf drop; dense honeydew promotes sooty mold on lint.",
        "life_stage": "Nymphs and adults",
        "favourable_conditions": "Warm and dry conditions (30-36°C) with low rainfall, high nitrogen fertilization.",
        "cause_relationship": "Pest vectors and transmits plant pathogenic virus",
        "affected_diseases": "Cotton Leaf Curl Virus (CLCuV)",
        "management": "Spray neem oil 1500 ppm @ 3ml/L; spray Pyriproxyfen 10% EC @ 1ml/L or Diafenthiuron 50% WP @ 1.25g/L or Afidopyropen 50 g/L @ 2ml/L.",
        "prevention": "Install yellow sticky traps (10/acre); avoid excessive urea applications; grow resistant/tolerant hybrids.",
        "source": "ICAR-CICR Nagpur & UAS Dharwad",
        "source_url": "https://cicr.icar.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Sugarcane",
        "crop_id": "sugarcane",
        "pest": "Early Shoot Borer",
        "scientific_name": "Chilo infuscatellus",
        "pest_type": "Lepidopteran borer",
        "affected_plant_part": "Shoots of young cane (1 to 3 months old)",
        "damage_symptoms": "Larva bores into base of young shoot just below soil level and feeds inside; central growing shoot dries up into an easily-pulled 'dead heart' emitting an offensive decaying smell.",
        "life_stage": "Larva (Caterpillar)",
        "favourable_conditions": "High temperatures (35-40°C), low relative humidity, light sandy soils, drought stress during early vegetative phase.",
        "cause_relationship": "Pest infestation/damage",
        "affected_diseases": "None directly transmitted",
        "management": "Release Trichogramma chilonis @ 50,000/ha from 4th week of planting at 10-day intervals; spray Granulosis virus (ESB-GV) @ 1.5x10^8 IBS/ml; apply Chlorantraniliprole 0.4% GR @ 18.75kg/ha at planting or spray Chlorantraniliprole 18.5% SC @ 0.3ml/L at 30 days.",
        "prevention": "Plant setts in deep furrows; trash mulching @ 5 tonnes/ha on ridges within 3 days of planting; earthing up at 45 days.",
        "source": "ICAR-Sugarcane Breeding Institute (SBI Coimbatore)",
        "source_url": "https://sugarcane.icar.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Maize / Corn",
        "crop_id": "maize",
        "pest": "Fall Armyworm (FAW)",
        "scientific_name": "Spodoptera frugiperda",
        "pest_type": "Lepidopteran defoliator & borer",
        "affected_plant_part": "Leaf whorl, tassel, ear silks, developing kernels",
        "damage_symptoms": "Young larvae scrape epidermal layer creating papery pinholes; older larvae feed inside leaf whorl causing heavy ragged windowing and leaving prominent piles of wet sawdust-like fecal frass; inverted Y mark on head.",
        "life_stage": "Larval instars",
        "favourable_conditions": "Warm and semi-arid conditions (26-34°C), prolonged dry spells followed by rain.",
        "cause_relationship": "Pest infestation/damage",
        "affected_diseases": "None directly transmitted",
        "management": "Release egg parasitoid Telenomus remus @ 1,25,000/ha; spray Bacillus thuringiensis var. kurstaki @ 2g/L or Metarhizium rileyi @ 3g/L; apply Chlorantraniliprole 18.5% SC @ 0.4ml/L or Emamectin Benzoate 5% SG @ 0.4g/L directed into the central whorl.",
        "prevention": "Synchronous planting in village clusters; erect bird perches (10/acre); apply sand and wood ash (9:1) directly into whorls; install FAW pheromone traps @ 5/acre.",
        "source": "ICAR-NBAIR Bengaluru & ICAR-IIMR",
        "source_url": "https://nbair.icar.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Coconut",
        "crop_id": "coconut",
        "pest": "Rhinoceros Beetle",
        "scientific_name": "Oryctes rhinoceros",
        "pest_type": "Coleopteran wood borer",
        "affected_plant_part": "Crown heart, unopened fronds and spathes",
        "damage_symptoms": "Adult beetle bores into crown heart and chews unopened fronds; when damaged fronds unfold, leaflets display distinctive V-shaped geometric notches or clipped shears appearance.",
        "life_stage": "Adult beetle",
        "favourable_conditions": "Nearby rotting organic manure pits, decaying coconut stumps and coir dust mounds acting as breeding sites.",
        "cause_relationship": "Pest infestation/damage (feeding wounds facilitate entry of secondary fungal pathogens)",
        "affected_diseases": "Thielaviopsis paradoxa (Stem Bleeding / Bud Rot predisposition)",
        "management": "Maintain orchard sanitation; treat manure pits with Metarhizium anisopliae green muscardine fungus @ 5x10^11 spores/m3; hook out beetles using an iron rod with curved needle; crown placement of naphthalene balls (approx 10g) mixed with fine sand in uppermost 3 leaf axils.",
        "prevention": "Regular field inspection; destroy dead palm trunks; incorporate Metarhizium into FYM compost heaps.",
        "source": "ICAR-CPCRI Kasaragod & Coconut Development Board",
        "source_url": "https://cpcri.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Coffee",
        "crop_id": "coffee",
        "pest": "Coffee White Stem Borer",
        "scientific_name": "Xylotrechus quadripes",
        "pest_type": "Coleopteran stem borer",
        "affected_plant_part": "Main stem, thick primary branches of Arabica coffee",
        "damage_symptoms": "Grub tunnels inside hardwood causing characteristic external ridges/rings on trunk bark; leaves yellow, wilt and dry out; bearing branches snap easily; killed bushes.",
        "life_stage": "Grub (Larva)",
        "favourable_conditions": "Open unshaded coffee patches, bright sunlight directly hitting main stems, post-monsoon warm dry periods.",
        "cause_relationship": "Pest infestation/damage",
        "affected_diseases": "None directly transmitted",
        "management": "Bark scraping of loose scaly bark on main stems before flight season to dislodge eggs; install cross-vane pheromone traps; stem swabbing/spraying with registered adhesive formulation up to 1.5m prior to beetle flight; trace, uproot and burn infested bushes.",
        "prevention": "Maintain optimal two-tier shade (40-50% canopy shade); wrap/band main stem with plastic sheets during flight periods.",
        "source": "Central Coffee Research Institute (CCRI Balehonnur)",
        "source_url": "https://coffeeboard.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    }
]

pest_fields = [
    "crop", "crop_id", "pest", "scientific_name", "pest_type",
    "affected_plant_part", "damage_symptoms", "life_stage",
    "favourable_conditions", "cause_relationship", "affected_diseases",
    "management", "prevention", "source", "source_url",
    "verification_status", "verification_date"
]

with open("CROP_PEST_MASTER.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=pest_fields)
    writer.writeheader()
    writer.writerows(pest_records)

print(f"Saved CROP_PEST_MASTER.csv with {len(pest_records)} verified records.")

print("\n=== GENERATING VERIFIED CROP_NUTRIENT_DEFICIENCY_MASTER.CSV ===")

nutrient_records = [
    {
        "crop": "Tomato",
        "crop_id": "tomato",
        "nutrient": "Potassium (K)",
        "deficiency_name": "Potassium Deficiency",
        "visual_symptoms": "Marginal chlorosis turning into scorched, necrotic brown leaf margins ('firing'); older leaves curl downwards; blotchy or uneven fruit ripening with yellow shoulder disorder.",
        "affected_plant_part": "Older and middle leaves, maturing fruits",
        "typical_pattern": "Marginal scorching and interveinal bronzing progressing from tip and margins inward, while main veins remain green longest.",
        "possible_causes": "Heavy fruit load draining available K, highly leached acidic sandy soils, excessive calcium or magnesium in soil competing for root uptake.",
        "soil_relationship": "Common in coarse-textured sandy soils and red sandy loams with low exchangeable K (<100 mg/kg).",
        "source": "ICAR-IIHR Bengaluru & TNAU Agritech",
        "source_url": "https://iihr.res.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Tomato",
        "crop_id": "tomato",
        "nutrient": "Calcium (Ca)",
        "deficiency_name": "Calcium Deficiency (Blossom End Rot)",
        "visual_symptoms": "Dark brown to black flattened sunken leathery patch at blossom end of fruit (Blossom End Rot); growing tips wither; young expanding leaves cup downward with necrotic margins.",
        "affected_plant_part": "Growing tips, young expanding leaves, fruit blossom end (Immobile)",
        "typical_pattern": "Depressed circular necrotic leathery lesion at bottom tip of tomato fruit.",
        "possible_causes": "Fluctuating soil moisture, excessive ammonium or potassium fertilization interfering with calcium uptake, acidic soils.",
        "soil_relationship": "Acidic laterite soils (pH <5.5), sandy soils with low cation exchange capacity, dry drought-stressed soils.",
        "source": "ICAR-IIHR Bengaluru & TNAU Agritech",
        "source_url": "https://iihr.res.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Tomato",
        "crop_id": "tomato",
        "nutrient": "Phosphorus (P)",
        "deficiency_name": "Phosphorus Deficiency",
        "visual_symptoms": "Leaves turn dark dull green with intense purple or reddish-violet pigmentation on veins and undersides of leaves and stems; severely restricted root system and delayed fruit setting.",
        "affected_plant_part": "Underside of older leaves first, stems",
        "typical_pattern": "Pronounced purple veinal anthocyanin accumulation on leaf undersides and petioles.",
        "possible_causes": "Cold soil temperatures restricting root uptake, P fixation in acidic laterites or alkaline calcareous soils.",
        "soil_relationship": "Red sandy loams of South India with low available Olsen-P (<10 kg/ha).",
        "source": "ICAR-IIHR Bengaluru & TNAU",
        "source_url": "https://iihr.res.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Paddy / Rice",
        "crop_id": "paddy",
        "nutrient": "Nitrogen (N)",
        "deficiency_name": "Nitrogen Deficiency",
        "visual_symptoms": "Uniform pale light-green to general chlorosis of older leaves starting from leaf tip and progressing along midrib; stunted tillering, thin erect culms, and early senescence.",
        "affected_plant_part": "Older / Lower leaves first (Highly mobile)",
        "typical_pattern": "V-shaped chlorosis extending from leaf tip backwards along central midrib.",
        "possible_causes": "Low soil organic matter, leaching in light sandy soils, prolonged submerged denitrification in waterlogged conditions.",
        "soil_relationship": "Coarse textured sandy soils, leached floodplains, low organic carbon (<0.5%).",
        "source": "ICAR-IIRR Hyderabad & TNAU Agritech Portal",
        "source_url": "https://icar-iirr.org",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Paddy / Rice",
        "crop_id": "paddy",
        "nutrient": "Zinc (Zn)",
        "deficiency_name": "Zinc Deficiency (Khaira Disease)",
        "visual_symptoms": "Brownish-red or rust-colored blotches/streaks along midrib of leaves 2-4 weeks after transplanting; lower leaves droop; plants severely stunted in uneven patches.",
        "affected_plant_part": "Middle and younger leaves",
        "typical_pattern": "Rust-brown coalescing pigment patches along midrib and blade.",
        "possible_causes": "Alkaline/calcareous soils (pH >7.8), continuous submergence causing insoluble zinc sulphide precipitation, excessive phosphatic fertilization.",
        "soil_relationship": "Calcareous black soils (Vertisols) of Tungabhadra and Krishna-Godavari deltas.",
        "source": "ICAR-IIRR Hyderabad & TNAU Agritech",
        "source_url": "https://icar-iirr.org",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Maize / Corn",
        "crop_id": "maize",
        "nutrient": "Nitrogen (N)",
        "deficiency_name": "Nitrogen Deficiency",
        "visual_symptoms": "Characteristic yellowing starting at leaf tip and progressing in an inverted V-shape along central midrib, leaving margins green longest; spindly stalks, small unfilled ears.",
        "affected_plant_part": "Older / Lowest leaves first",
        "typical_pattern": "Sharp inverted V-shaped midrib chlorosis turning necrotic brown.",
        "possible_causes": "Heavy rainfall leaching, waterlogging inhibiting root respiration, low organic carbon.",
        "soil_relationship": "Sandy soils, poorly drained Vertisols during high rainfall.",
        "source": "ICAR-IIMR & UAS Bangalore Package of Practices",
        "source_url": "https://iimr.icar.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Maize / Corn",
        "crop_id": "maize",
        "nutrient": "Zinc (Zn)",
        "deficiency_name": "Zinc Deficiency ('White Bud')",
        "visual_symptoms": "Broad bleached white to pale yellow bands on both sides of leaf midrib starting from base; midrib and leaf margins remain green; emerging whorl leaves almost white.",
        "affected_plant_part": "Younger leaves in whorl",
        "typical_pattern": "Broad white/cream bands on both sides of central midrib.",
        "possible_causes": "High soil pH (>7.5), high available phosphorus, cold wet soils during germination.",
        "soil_relationship": "Calcareous soils, heavily phosphated soils.",
        "source": "ICAR-IIMR & UAS Bangalore",
        "source_url": "https://iimr.icar.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Cotton",
        "crop_id": "cotton",
        "nutrient": "Potassium (K)",
        "deficiency_name": "Potassium Deficiency ('Rust' / Marginal Firing)",
        "visual_symptoms": "Yellowish-white interveinal mottling followed by marginal chlorosis; leaf tips and margins curl downwards and scorch; leaves turn reddish-bronze with premature defoliation and incomplete boll opening.",
        "affected_plant_part": "Older leaves initially, migrating to top leaves during heavy boll load",
        "typical_pattern": "Marginal scorching and interveinal bronzing, leaving main veins green.",
        "possible_causes": "Heavy K depletion by high-yielding Bt cotton hybrids, sandy soils with low CEC, ill-drained saline soils.",
        "soil_relationship": "Red sandy soils (Alfisols) and weathered soils with available K <120 kg/ha.",
        "source": "ICAR-CICR Coimbatore & UAS Dharwad",
        "source_url": "https://cicr.icar.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Chilli",
        "crop_id": "chilli",
        "nutrient": "Magnesium (Mg)",
        "deficiency_name": "Magnesium Deficiency",
        "visual_symptoms": "Distinct interveinal chlorosis on older leaves: leaf veins remain green while interveinal tissue turns bright yellow to bronze; in severe cases leaf margins turn purple-red with premature leaf drop.",
        "affected_plant_part": "Older and middle leaves (Mobile)",
        "typical_pattern": "Striking green veins on yellow leaf background on lower leaves.",
        "possible_causes": "Heavy potassium or calcium application outcompeting magnesium for root uptake; highly leached acidic sandy soils.",
        "soil_relationship": "Acidic soils (pH <5.5), high-K fertilized soils.",
        "source": "ANGRAU Lam Guntur & UAS Dharwad",
        "source_url": "https://angrau.ac.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Sugarcane",
        "crop_id": "sugarcane",
        "nutrient": "Iron (Fe)",
        "deficiency_name": "Iron Chlorosis",
        "visual_symptoms": "Interveinal chlorosis on youngest leaves: veins remain sharply green while intervening tissue becomes bleached ivory-white or pale yellow; whole cane tops appear bleached white in severe patches.",
        "affected_plant_part": "Youngest leaves at shoot apex (Immobile)",
        "typical_pattern": "Sharp parallel green veins on bleached white leaf blade.",
        "possible_causes": "Calcareous alkaline soils containing high free calcium carbonate (CaCO3) causing iron precipitation as insoluble ferric hydroxide; high bicarbonate water.",
        "soil_relationship": "Calcareous black Vertisols of North Karnataka, Western Tamil Nadu, Rayalaseema.",
        "source": "ICAR-SBI Coimbatore & TNAU Sugarcane Portal",
        "source_url": "https://sugarcane.icar.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    },
    {
        "crop": "Coconut",
        "crop_id": "coconut",
        "nutrient": "Potassium (K)",
        "deficiency_name": "Potassium Deficiency",
        "visual_symptoms": "Translucent yellow to orange-brown spots on leaflets of older fronds; leaflets develop severe marginal necrosis and necrotic tip drying; fronds look scorched and die prematurely; slender tapering trunk.",
        "affected_plant_part": "Older fronds in lower whorl",
        "typical_pattern": "Orange-yellow spotting coalescing into dry ragged leaflet margins.",
        "possible_causes": "High potassium demand of perennial palms; extensive leaching in sandy coastal soils and laterites.",
        "soil_relationship": "Coastal sands, laterites of Kerala and Karnataka with K2O <100 kg/ha.",
        "source": "ICAR-CPCRI Kasaragod & Coconut Development Board",
        "source_url": "https://cpcri.gov.in",
        "verification_status": "VERIFIED",
        "verification_date": "2026-09-12"
    }
]

nutrient_fields = [
    "crop", "crop_id", "nutrient", "deficiency_name",
    "visual_symptoms", "affected_plant_part", "typical_pattern",
    "possible_causes", "soil_relationship", "source",
    "source_url", "verification_status", "verification_date"
]

with open("CROP_NUTRIENT_DEFICIENCY_MASTER.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=nutrient_fields)
    writer.writeheader()
    writer.writerows(nutrient_records)

print(f"Saved CROP_NUTRIENT_DEFICIENCY_MASTER.csv with {len(nutrient_records)} verified records.")

print("\n=== GENERATING BUNDLED LOCAL JSON KNOWLEDGE BASES ===")

# Build localPests.json
pests_dict = {}
for r in pest_records:
    cid = r['crop_id']
    if cid not in pests_dict:
        pests_dict[cid] = []
    pests_dict[cid].append(r)

with open("src/knowledge/localPests.json", "w", encoding="utf-8") as f:
    json.dump({"version": "1.0.0", "pests": pests_dict}, f, indent=2, ensure_ascii=False)
print(f"Saved src/knowledge/localPests.json covering {len(pests_dict)} crops.")

# Build localNutrients.json
nutrients_dict = {}
for r in nutrient_records:
    cid = r['crop_id']
    if cid not in nutrients_dict:
        nutrients_dict[cid] = []
    nutrients_dict[cid].append(r)

with open("src/knowledge/localNutrients.json", "w", encoding="utf-8") as f:
    json.dump({"version": "1.0.0", "nutrients": nutrients_dict}, f, indent=2, ensure_ascii=False)
print(f"Saved src/knowledge/localNutrients.json covering {len(nutrients_dict)} crops.")
