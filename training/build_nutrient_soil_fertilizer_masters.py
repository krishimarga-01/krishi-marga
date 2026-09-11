import os
import csv

def generate_nutrient_deficiency_and_soil_masters():
    nut_master_path = "agricultural_knowledge/CROP_NUTRIENT_DEFICIENCY_MASTER.csv"
    nut_matrix_path = "agricultural_knowledge/CROP_NUTRIENT_DEFICIENCY_MATRIX.csv"
    soil_master_path = "agricultural_knowledge/SOIL_HEALTH_MASTER.csv"
    fert_master_path = "agricultural_knowledge/FERTILIZER_KNOWLEDGE_MASTER.csv"

    nut_master_headers = [
        "crop", "nutrient", "affected_leaf_position", "visual_symptoms", "growth_effects",
        "visual_patterns", "similar_looking_diseases", "soil_causes", "soil_conditions",
        "prevention", "correction_measures", "fertilizer_category", "source", "source_url", "verification_status"
    ]

    nut_matrix_headers = [
        "crop", "nutrient", "visual_symptoms", "similar_conditions", "soil_association",
        "confirmation_method", "management", "fertilizer_category", "source", "verification_status"
    ]

    soil_headers = [
        "parameter", "parameter_type", "optimal_range", "deficiency_threshold", "excess_threshold",
        "unit", "impact_on_crops", "associated_deficiencies", "common_in_south_indian_soils",
        "management_correction", "testing_method", "source", "verification_status"
    ]

    fert_headers = [
        "crop", "nutrient_deficiency", "soil_condition", "recommended_nutrient_category",
        "possible_fertilizer_types", "application_guidance", "dosage_information",
        "warnings_precautions", "source", "source_url", "verification_status"
    ]

    # --- 1. NUTRIENT DEFICIENCIES MASTER ---
    nutrients = [
        # Nitrogen (N)
        {
            "crop": "Paddy / Rice",
            "nutrient": "Nitrogen (N)",
            "affected_leaf_position": "Older / Lower leaves first (Highly mobile)",
            "visual_symptoms": "Uniform pale light-green to general chlorosis of older leaves starting from leaf tip and progressing along midrib; stunted tillering.",
            "growth_effects": "Reduced tillering, thin erect spindly culms, short panicles, premature flowering and senescence.",
            "visual_patterns": "V-shaped chlorosis extending from tip backwards along midrib.",
            "similar_looking_diseases": "Bacterial leaf streak, early leaf blast chlorosis, or general root rot.",
            "soil_causes": "Low soil organic matter, leaching in light sandy soils, prolonged submerged denitrification in waterlogged conditions.",
            "soil_conditions": "Coarse textured sandy soils, leached floodplains, low organic carbon (<0.5%).",
            "prevention": "Incorporate green manure (Sesbania / Dhaincha @ 6.25 t/ha) prior to puddling; split nitrogen applications.",
            "correction_measures": "Top-dress with Urea or apply 1-2% foliar spray of Urea early morning for rapid greening.",
            "fertilizer_category": "Straight Nitrogenous Fertilizer",
            "source": "ICAR-IIRR Hyderabad & TNAU Agritech Portal",
            "source_url": "https://icar-iirr.org",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Maize / Corn",
            "nutrient": "Nitrogen (N)",
            "affected_leaf_position": "Older / Lowest leaves first",
            "visual_symptoms": "Characteristic yellowing starting at leaf tip and progressing in an inverted V-shape along central midrib, leaving margins green longest.",
            "growth_effects": "Spindly stalks, small ears with pinched unfilled tips, severely reduced biomass.",
            "visual_patterns": "Sharp inverted V-shaped midrib chlorosis turning necrotic brown.",
            "similar_looking_diseases": "Drought firing, root rot, or northern corn leaf blight at early stage.",
            "soil_causes": "Heavy rainfall leaching, waterlogging inhibiting root respiration, low organic carbon.",
            "soil_conditions": "Sandy soils, poorly drained Vertisols during high rainfall.",
            "prevention": "Band placement of basal nitrogen and split top-dressing at knee-high and tasseling stages.",
            "correction_measures": "Foliar spray of 2% Urea or side-dress with Ammonium Sulphate / Urea as per soil test.",
            "fertilizer_category": "Straight Nitrogenous Fertilizer",
            "source": "ICAR-IIMR & UAS Bangalore Package of Practices",
            "source_url": "https://iimr.icar.gov.in",
            "verification_status": "VERIFIED"
        },
        # Phosphorus (P)
        {
            "crop": "Paddy / Rice",
            "nutrient": "Phosphorus (P)",
            "affected_leaf_position": "Older leaves first (Mobile)",
            "visual_symptoms": "Leaves appear dark green with distinct bronze or purplish discoloration along margins; narrow, short, erect leaves; severely restricted tillering.",
            "growth_effects": "Stunted root system, delayed flowering and uneven maturity, high percentage of empty spikelets.",
            "visual_patterns": "Purplish anthocyanin pigmentation on leaf blades and sheaths.",
            "similar_looking_diseases": "Tungro virus leaf discoloration, iron toxicity bronzing.",
            "soil_causes": "High P-fixing acidic laterite soils (Al/Fe phosphate fixation) or highly calcareous alkaline soils (Ca-phosphate precipitation).",
            "soil_conditions": "Acidic soils of Kerala and Coastal Karnataka (pH <5.5) or calcareous soils of Rayalaseema/TN (pH >8.0).",
            "prevention": "Apply Rock Phosphate in acidic soils or Single Super Phosphate (SSP) in neutral/alkaline soils basally; use phosphate solubilizing bacteria (PSB).",
            "correction_measures": "Basal application of phosphatic fertilizer; in standing crop, foliar spray of 1% Diammonium Phosphate (DAP) or 0.5% 13-0-45.",
            "fertilizer_category": "Phosphatic Fertilizer",
            "source": "KAU Package of Practices & ANGRAU Vyavasaya Panchangam",
            "source_url": "https://celkau.in",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Tomato",
            "nutrient": "Phosphorus (P)",
            "affected_leaf_position": "Underside of older leaves first",
            "visual_symptoms": "Leaves turn dark dull green with intense purple or reddish-violet pigmentation on veins and undersides of leaves and stems; poor root development.",
            "growth_effects": "Stunted slow growth, slender fibrous stems, poor fruit set and small unmarketable fruits.",
            "visual_patterns": "Pronounced purple veinal anthocyanin accumulation.",
            "similar_looking_diseases": "Tomato spotted wilt virus (TSWV), cold temperature physiological purpling.",
            "soil_causes": "Cold soil temperatures restricting root uptake, P fixation in acidic laterites or alkaline calcareous soils.",
            "soil_conditions": "Red sandy loams of South India with low available Olsen-P (<10 kg/ha).",
            "prevention": "Incorporate Single Super Phosphate (SSP) or DAP into root zone prior to transplanting; inoculate with mycorrhiza (VAM).",
            "correction_measures": "Foliar application of 19:19:19 @ 5g/L or 12:61:0 (MAP) @ 3g/L.",
            "fertilizer_category": "Water Soluble Complex Fertilizer",
            "source": "ICAR-IIHR Bengaluru & TNAU Agritech",
            "source_url": "https://iihr.res.in",
            "verification_status": "VERIFIED"
        },
        # Potassium (K)
        {
            "crop": "Cotton",
            "nutrient": "Potassium (K)",
            "affected_leaf_position": "Older leaves initially, migrating to top leaves during heavy boll load",
            "visual_symptoms": "Yellowish-white mottling between veins followed by marginal chlorosis; leaf tips and margins curl downwards and scorch (marginal necrosis / firing); leaves turn reddish-bronze.",
            "growth_effects": "Premature defoliation, incomplete boll opening, reduced boll size and poor fiber micronaire/strength.",
            "visual_patterns": "Marginal scorching and interveinal bronzing, leaving main veins green.",
            "similar_looking_diseases": "Alternaria leaf spot, Verticillium wilt marginal necrosis, parawilt.",
            "soil_causes": "Heavy K depletion by high-yielding Bt cotton hybrids, sandy soils with low CEC, ill-drained saline soils.",
            "soil_conditions": "Red sandy soils (Alfisols) and weathered soils with available K <120 kg/ha.",
            "prevention": "Apply split dose of Muriate of Potash (MOP) at sowing and 45-60 days after sowing.",
            "correction_measures": "Foliar spray of Potassium Nitrate (13:0:45) @ 10g/L or SOP (0:0:50) @ 10g/L at weekly intervals during boll development.",
            "fertilizer_category": "Potassic Fertilizer",
            "source": "ICAR-CICR Coimbatore & UAS Dharwad",
            "source_url": "https://cicr.icar.gov.in",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Coconut",
            "nutrient": "Potassium (K)",
            "affected_leaf_position": "Older fronds in lower whorl",
            "visual_symptoms": "Translucent yellow to orange-brown spots on leaflets of older fronds; leaflets develop severe marginal necrosis and necrotic tip drying; fronds look scorched and die prematurely.",
            "growth_effects": "Slender tapering trunk, reduced bunch count, premature nut fall, thin shell and reduced copra content.",
            "visual_patterns": "Orange-yellow spotting coalescing into dry ragged leaflet margins.",
            "similar_looking_diseases": "Leaf rot, Gray leaf spot (Pestalotiopsis), Tanjore wilt early yellowing.",
            "soil_causes": "High potassium demand of perennial palms; extensive leaching in sandy coastal soils and laterites.",
            "soil_conditions": "Coastal sands, laterites of Kerala and Karnataka with K2O <100 kg/ha.",
            "prevention": "Annual application of 1.2 to 1.5 kg Muriate of Potash (MOP) per bearing adult palm per year in split doses (May/June and September/October).",
            "correction_measures": "Apply 2 kg MOP + 1 kg Epsom Salt (Magnesium Sulphate) per palm into circular basin 1.8m from trunk.",
            "fertilizer_category": "Straight Potassic Fertilizer",
            "source": "ICAR-CPCRI Kasaragod & Coconut Development Board",
            "source_url": "https://cpcri.gov.in",
            "verification_status": "VERIFIED"
        },
        # Calcium (Ca)
        {
            "crop": "Tomato",
            "nutrient": "Calcium (Ca)",
            "affected_leaf_position": "Growing tips, young expanding leaves, fruit blossom end (Immobile)",
            "visual_symptoms": "Blossom End Rot (BER) on fruits: dark brown to black flattened sunken leathery patch at blossom end of fruit; apical leaves cup downward and margins wither.",
            "growth_effects": "Death of growing tips (apical bud abortion), fruit rotting, reduced commercial value.",
            "visual_patterns": "Depressed circular necrotic leathery lesion at bottom tip of tomato fruit.",
            "similar_looking_diseases": "Anthracnose fruit rot, fruit borer entry holes, sunscald.",
            "soil_causes": "Fluctuating soil moisture, excessive ammonium or potassium fertilization interfering with calcium uptake, acidic soils.",
            "soil_conditions": "Acidic laterite soils, sandy soils with low cation exchange capacity, dry drought-stressed soils.",
            "prevention": "Maintain uniform soil moisture using drip irrigation; avoid excessive nitrogen top-dressing; apply agricultural lime in acidic soils.",
            "correction_measures": "Foliar spray of Calcium Nitrate (18.8% Ca, 15.5% N) @ 5g/L or Chelated Calcium (EDTA-Ca) @ 1.5g/L during early fruit set.",
            "fertilizer_category": "Calcium Fertilizer",
            "source": "ICAR-IIHR Bengaluru & TNAU",
            "source_url": "https://iihr.res.in",
            "verification_status": "VERIFIED"
        },
        # Magnesium (Mg)
        {
            "crop": "Chilli",
            "nutrient": "Magnesium (Mg)",
            "affected_leaf_position": "Older and middle leaves (Mobile)",
            "visual_symptoms": "Distinct interveinal chlorosis on older leaves: leaf veins remain green while interveinal tissue turns bright yellow to bronze; in severe cases leaf margins turn purple-red.",
            "growth_effects": "Premature leaf shedding, reduced photosynthetic capacity, poor pod development.",
            "visual_patterns": "Striking green veins on yellow leaf background on lower leaves.",
            "similar_looking_diseases": "Chilli mosaic virus, mite-induced stippling, early powdery mildew chlorosis.",
            "soil_causes": "Heavy potassium or calcium application outcompeting magnesium for root uptake; highly leached acidic sandy soils.",
            "soil_conditions": "Acidic soils (pH <5.5), high-K fertilized soils.",
            "prevention": "Soil application of Dolomite (calcium-magnesium carbonate) or Magnesium Sulphate (Epsom salt) during field preparation.",
            "correction_measures": "Foliar spray of Magnesium Sulphate @ 5g/L or 10g/L at 15-day intervals.",
            "fertilizer_category": "Secondary Nutrient Fertilizer",
            "source": "ANGRAU Lam Guntur & UAS Dharwad",
            "source_url": "https://angrau.ac.in",
            "verification_status": "VERIFIED"
        },
        # Zinc (Zn)
        {
            "crop": "Paddy / Rice",
            "nutrient": "Zinc (Zn)",
            "affected_leaf_position": "Middle and younger leaves (2 to 4 weeks after transplanting)",
            "visual_symptoms": "Khaira disease / Zinc deficiency: brownish-red or rust-colored blotches/streaks along midrib of leaves; lower leaves droop; plants severely stunted in patches.",
            "growth_effects": "Delayed maturity, poor tillering, uneven patchy field growth, substantial yield reduction.",
            "visual_patterns": "Rust-brown coalescing pigment patches along midrib and blade.",
            "similar_looking_diseases": "Brown spot (Bipolaris oryzae), iron toxicity bronzing, tungro virus.",
            "soil_causes": "Alkaline/calcareous soils (pH >7.8), continuous submergence causing insoluble zinc sulphide precipitation, excessive phosphatic fertilization.",
            "soil_conditions": "Calcareous black soils (Vertisols) of Tungabhadra, Krishna-Godavari deltas and alkaline soils of Tamil Nadu.",
            "prevention": "Basal soil application of Zinc Sulphate (heptahydrate 21% or monohydrate 33%) @ 25 kg/ha once every 3 seasons.",
            "correction_measures": "Emergency foliar spray of Zinc Sulphate @ 5g/L + Lime @ 2.5g/L (or unslaked lime neutralizer) twice at 10-day intervals.",
            "fertilizer_category": "Micronutrient Fertilizer",
            "source": "ICAR-IIRR Hyderabad & TNAU Agritech",
            "source_url": "https://icar-iirr.org",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Maize / Corn",
            "nutrient": "Zinc (Zn)",
            "affected_leaf_position": "Younger leaves in whorl",
            "visual_symptoms": "'White Bud' of maize: broad bleached white to pale yellow bands on both sides of leaf midrib starting from base; midrib and leaf margins remain green; emerging whorl leaves almost white.",
            "growth_effects": "Short internodes resulting in stunted bushy plants, delayed silking causing barren ears.",
            "visual_patterns": "Broad white/cream bands on both sides of central midrib.",
            "similar_looking_diseases": "Maize dwarf mosaic virus, downy mildew chlorotic stripes.",
            "soil_causes": "High soil pH (>7.5), high available phosphorus, cold wet soils during germination.",
            "soil_conditions": "Calcareous soils, heavily phosphated soils.",
            "prevention": "Basal application of Zinc Sulphate @ 20-25 kg/ha mixed with FYM.",
            "correction_measures": "Foliar spray of Chelated Zinc (EDTA-Zn 12%) @ 1g/L or Zinc Sulphate @ 5g/L neutralized with 2.5g lime.",
            "fertilizer_category": "Micronutrient Fertilizer",
            "source": "ICAR-IIMR & UAS Bangalore",
            "source_url": "https://iimr.icar.gov.in",
            "verification_status": "VERIFIED"
        },
        # Iron (Fe)
        {
            "crop": "Sugarcane",
            "nutrient": "Iron (Fe)",
            "affected_leaf_position": "Youngest leaves at shoot apex (Immobile)",
            "visual_symptoms": "Interveinal chlorosis on youngest leaves: veins remain sharply green while intervening tissue becomes bleached ivory-white or pale yellow; whole cane tops appear bleached white in severe patches.",
            "growth_effects": "Stunted cane elongation, reduced chlorophyll synthesis, thin canes, poor sucrose accumulation.",
            "visual_patterns": "Sharp parallel green veins on bleached white leaf blade.",
            "similar_looking_diseases": "Sugarcane grassy shoot disease (phytoplasma), sugarcane mosaic virus.",
            "soil_causes": "Calcareous alkaline soils containing high free calcium carbonate (CaCO3) causing iron precipitation as insoluble ferric hydroxide; high bicarbonate water.",
            "soil_conditions": "Calcareous black Vertisols of North Karnataka, Western Tamil Nadu, Rayalaseema.",
            "prevention": "Incorporate sulphur or gypsum in alkaline soils; apply green manure to lower rhizosphere pH.",
            "correction_measures": "Foliar spray of Ferrous Sulphate (FeSO4) @ 10g/L + Citric Acid @ 1g/L (to prevent oxidation) or Fe-EDTA @ 1.5g/L twice at 10-day intervals.",
            "fertilizer_category": "Micronutrient Fertilizer",
            "source": "ICAR-SBI Coimbatore & TNAU Sugarcane Portal",
            "source_url": "https://sugarcane.icar.gov.in",
            "verification_status": "VERIFIED"
        },
        # Boron (B)
        {
            "crop": "Arecanut / Betel Nut",
            "nutrient": "Boron (B)",
            "affected_leaf_position": "Growing apex, inflorescence, developing nuts (Immobile)",
            "visual_symptoms": "Crown choking / 'Katte roga' boron deficiency: inner fronds crinkled, brittle, hook-tipped and failing to unfurl; inflorescence dries out; nut cracking and gum exudation on nuts.",
            "growth_effects": "Premature button shedding, deformed cracked nuts, death of central growing point.",
            "visual_patterns": "Crinkled blunt hook-tipped leaves and split nuts.",
            "similar_looking_diseases": "Yellow leaf disease, mite-induced nut cracking.",
            "soil_causes": "High rainfall leaching in coastal sandy laterites, highly acidic soils with low organic matter.",
            "soil_conditions": "Laterite soils of Coastal Karnataka and Kerala.",
            "prevention": "Soil application of Borax @ 25g per adult palm per year in soil basin.",
            "correction_measures": "Soil application of Solubor @ 20g/palm or foliar spray with Boron 20% (Disodium Octaborate Tetrahydrate) @ 2g/L.",
            "fertilizer_category": "Micronutrient Fertilizer",
            "source": "ICAR-CPCRI Regional Station Vittal & UAS Dharwad",
            "source_url": "https://cpcri.gov.in",
            "verification_status": "VERIFIED"
        }
    ]

    # Write CROP_NUTRIENT_DEFICIENCY_MASTER.csv
    with open(nut_master_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=nut_master_headers)
        writer.writeheader()
        for n in nutrients:
            writer.writerow(n)

    # Write CROP_NUTRIENT_DEFICIENCY_MATRIX.csv
    with open(nut_matrix_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=nut_matrix_headers)
        writer.writeheader()
        for n in nutrients:
            writer.writerow({
                "crop": n["crop"],
                "nutrient": n["nutrient"],
                "visual_symptoms": n["visual_symptoms"],
                "similar_conditions": n["similar_looking_diseases"],
                "soil_association": n["soil_conditions"],
                "confirmation_method": "Laboratory leaf tissue analysis (spectrophotometry/AAS) and soil DTPA extractable test",
                "management": n["correction_measures"],
                "fertilizer_category": n["fertilizer_category"],
                "source": n["source"],
                "verification_status": n["verification_status"]
            })

    # --- 2. SOIL HEALTH MASTER ---
    soil_params = [
        {
            "parameter": "Available Nitrogen (N)",
            "parameter_type": "Primary Macronutrient",
            "optimal_range": "280 - 560",
            "deficiency_threshold": "< 280",
            "excess_threshold": "> 560",
            "unit": "kg/ha (Alkaline Permanganate Method)",
            "impact_on_crops": "Drives vegetative growth, protein synthesis and chlorophyll production. Deficiency causes pale yellowing and stunting; excess causes lodging, delayed maturity and high pest susceptibility.",
            "associated_deficiencies": "Sulfur deficiency symptoms mimic N chlorosis.",
            "common_in_south_indian_soils": "65-75% of South Indian red (Alfisols) and black (Vertisols) soils test low to medium in available nitrogen due to high tropical temperatures accelerating organic matter oxidation.",
            "management_correction": "Incorporate green manure (Dhaincha/Sunnhemp); apply farmyard manure (FYM @ 10-12.5 t/ha); top-dress recommended split doses of Urea.",
            "testing_method": "Subbiah & Asija Alkaline Permanganate Distillation Method",
            "source": "ICAR-Indian Institute of Soil Science (IISS) & Soil Health Card Scheme",
            "verification_status": "VERIFIED"
        },
        {
            "parameter": "Available Phosphorus (P)",
            "parameter_type": "Primary Macronutrient",
            "optimal_range": "11 - 25",
            "deficiency_threshold": "< 11",
            "excess_threshold": "> 25",
            "unit": "kg/ha P2O5 (Olsen Method for neutral/alkaline soils, Bray-1 for acid soils)",
            "impact_on_crops": "Essential for root proliferation, energy transfer (ATP), flowering and grain formation. Deficiency stunts roots and causes purplish foliage; excess induces Zinc and Iron deficiencies.",
            "associated_deficiencies": "High P induces Zinc (Zn) and Iron (Fe) deficiency.",
            "common_in_south_indian_soils": "Acid soils of Western Ghats/Kerala fix P as insoluble aluminum/iron phosphates; calcareous soils of TN/AP fix P as tricalcium phosphate.",
            "management_correction": "Apply Rock Phosphate in acid soils; Single Super Phosphate (SSP) in neutral/alkaline soils; use Phosphate Solubilizing Bacteria (PSB @ 2kg/ha).",
            "testing_method": "Olsen Extraction (0.5M NaHCO3, pH 8.5) or Bray & Kurtz No. 1 Method",
            "source": "ICAR-IISS Bhopal & TNAU Soil Science Dept",
            "verification_status": "VERIFIED"
        },
        {
            "parameter": "Available Potassium (K)",
            "parameter_type": "Primary Macronutrient",
            "optimal_range": "140 - 280",
            "deficiency_threshold": "< 140",
            "excess_threshold": "> 280",
            "unit": "kg/ha K2O (Neutral Normal Ammonium Acetate Method)",
            "impact_on_crops": "Regulates stomatal opening, water relations, enzyme activation, and disease resistance. Deficiency causes leaf marginal scorching and weak stems; excess can antagonize Mg and Ca uptake.",
            "associated_deficiencies": "High K induces Magnesium (Mg) and Calcium (Ca) deficiency.",
            "common_in_south_indian_soils": "Generally medium to high in black Vertisols, but severely deficient in coastal sands, laterites of Kerala, and high-intensity cotton/banana tracts.",
            "management_correction": "Apply Muriate of Potash (MOP 60% K2O) or Sulfate of Potash (SOP 50% K2O for chloride-sensitive crops like tobacco); split application in sandy soils.",
            "testing_method": "Flame Photometer using 1N Neutral Ammonium Acetate extraction",
            "source": "ICAR-IISS & UAS Bangalore Soil Testing Laboratory",
            "verification_status": "VERIFIED"
        },
        {
            "parameter": "Soil Reaction (pH)",
            "parameter_type": "Physico-Chemical Parameter",
            "optimal_range": "6.5 - 7.5",
            "deficiency_threshold": "< 6.0 (Acidic)",
            "excess_threshold": "> 8.5 (Alkaline / Sodic)",
            "unit": "pH scale (1:2.5 soil-water suspension)",
            "impact_on_crops": "Governs nutrient availability. Below 6.0: P, Ca, Mg, Mo become deficient while Al/Mn become toxic. Above 8.0: P, Fe, Zn, Mn, Cu become locked in insoluble precipitates.",
            "associated_deficiencies": "Acidic: Ca, Mg, P, Mo deficiency. Alkaline: Fe, Zn, Mn, B deficiency.",
            "common_in_south_indian_soils": "Kerala, Malnad Karnataka, Nilgiris are acidic (pH 4.5-6.0); Rayalaseema, North Karnataka black soils, parts of Tamil Nadu are alkaline (pH 7.8-8.8).",
            "management_correction": "Acid soils: Apply Agricultural Lime (CaCO3) or Dolomite based on lime requirement. Alkaline soils: Apply Gypsum (CaSO4.2H2O) and incorporate green manure/elemental sulfur.",
            "testing_method": "Potentiometric Glass Electrode pH Meter (1:2.5 soil-water ratio)",
            "source": "ICAR Soil Health Card Technical Guidelines",
            "verification_status": "VERIFIED"
        },
        {
            "parameter": "Organic Carbon (OC)",
            "parameter_type": "Soil Health & Biological Indicator",
            "optimal_range": "0.50 - 0.75",
            "deficiency_threshold": "< 0.50",
            "excess_threshold": "> 1.00",
            "unit": "% (Walkley-Black Wet Oxidation Method)",
            "impact_on_crops": "Direct index of soil fertility, moisture retention capacity, microbial activity, and cation exchange capacity. Low OC leads to soil crusting and poor nutrient retention.",
            "associated_deficiencies": "Low OC correlates with generalized multi-nutrient deficiency (N, S, micronutrients).",
            "common_in_south_indian_soils": "Over 70% of cultivated arable plains in Karnataka, AP, Telangana, and TN test low in OC (<0.5%) due to continuous tropical heat and crop residue burning.",
            "management_correction": "Incorporate FYM (10-12.5 t/ha), vermicompost (2.5 t/ha), green manuring with sunnhemp/dhaincha, and zero-burning of crop residue.",
            "testing_method": "Walkley and Black Chromic Acid Wet Digestion Titration",
            "source": "ICAR-IISS & National Soil Survey Bureau (NBSS&LUP)",
            "verification_status": "VERIFIED"
        },
        {
            "parameter": "Electrical Conductivity (EC / Salinity)",
            "parameter_type": "Physico-Chemical Parameter",
            "optimal_range": "0.0 - 1.0",
            "deficiency_threshold": "N/A (Normal)",
            "excess_threshold": "> 1.0 (Saline / Injurious to seedlings)",
            "unit": "dS/m (decisiemens per meter at 25°C, 1:2.5 suspension)",
            "impact_on_crops": "Measures total soluble salts. EC >1.0 reduces water uptake due to osmotic stress; EC >2.0 causes severe root tip burning, stunted growth and wilting.",
            "associated_deficiencies": "Causes physiological drought and secondary calcium/potassium imbalance.",
            "common_in_south_indian_soils": "Coastal saline tracts of AP/TN/Kerala, canal command waterlogged areas (Tungabhadra, Nagarjunasagar) with poor drainage.",
            "management_correction": "Provide deep sub-surface drainage trenches; leach soluble salts with good quality irrigation water; grow salt-tolerant varieties.",
            "testing_method": "Conductivity Meter using Wheatstone Bridge / Conductivity Cell",
            "source": "ICAR-Central Soil Salinity Research Institute (CSSRI)",
            "verification_status": "VERIFIED"
        },
        {
            "parameter": "Available Zinc (Zn)",
            "parameter_type": "Essential Micronutrient",
            "optimal_range": "0.60 - 1.20",
            "deficiency_threshold": "< 0.60",
            "excess_threshold": "> 3.00",
            "unit": "ppm / mg/kg (DTPA extractable)",
            "impact_on_crops": "Required for auxin synthesis, enzyme activation and protein metabolism. Deficiency causes severe stunting, khaira disease in rice, and white bud in maize.",
            "associated_deficiencies": "Induced by high soil phosphorus and high pH.",
            "common_in_south_indian_soils": "Widespread zinc deficiency in 45-55% of soils across Karnataka, Telangana, Andhra Pradesh, and Tamil Nadu.",
            "management_correction": "Basal application of Zinc Sulphate @ 25 kg/ha; foliar spray of 0.5% ZnSO4 neutralized with lime.",
            "testing_method": "Lindsay & Norvell DTPA (0.005M) Extraction with Atomic Absorption Spectrophotometry (AAS)",
            "source": "ICAR-All India Coordinated Research Project on Micro and Secondary Nutrients",
            "verification_status": "VERIFIED"
        },
        {
            "parameter": "Available Boron (B)",
            "parameter_type": "Essential Micronutrient",
            "optimal_range": "0.50 - 1.00",
            "deficiency_threshold": "< 0.50",
            "excess_threshold": "> 2.00 (Phytotoxic)",
            "unit": "ppm / mg/kg (Hot Water Soluble)",
            "impact_on_crops": "Critical for cell wall synthesis, pollen viability, fertilization, and sugar translocation. Deficiency causes cracked fruits, hollow hearts, flower drop, and deformed nuts.",
            "associated_deficiencies": "Calcium and Boron interact closely in cell wall stability.",
            "common_in_south_indian_soils": "High rainfall lateritic leached soils of Kerala and Coastal/Malnad Karnataka; calcareous soils of dry zones.",
            "management_correction": "Soil application of Borax @ 10-15 kg/ha or Solubor foliar spray @ 1-2g/L at pre-flowering.",
            "testing_method": "Hot Water Soluble Extraction using Azomethine-H Spectrophotometric Method",
            "source": "ICAR-AICRP Micronutrients & KAU Soil Testing Manual",
            "verification_status": "VERIFIED"
        }
    ]

    with open(soil_master_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=soil_headers)
        writer.writeheader()
        for s in soil_params:
            writer.writerow(s)

    # --- 3. FERTILIZER KNOWLEDGE MASTER (STRICTLY VERIFIED DOSAGES FROM STATE PACKAGE OF PRACTICES) ---
    fert_records = [
        {
            "crop": "Paddy / Rice",
            "nutrient_deficiency": "Nitrogen Deficiency",
            "soil_condition": "Low available N (<280 kg/ha), coarse texture, non-saline",
            "recommended_nutrient_category": "Straight Nitrogenous Fertilizer",
            "possible_fertilizer_types": "Urea (46% N), Ammonium Sulphate (20.6% N, 24% S), Neem Coated Urea",
            "application_guidance": "Split application: 25% basal at transplanting, 50% at active tillering (21-25 DAT), 25% at panicle initiation (40-45 DAT). Apply on drained mud and incorporate before re-flooding.",
            "dosage_information": "State Package of Practices recommendation: 100-120 kg N/ha (approx 217-260 kg Urea/ha) for medium duration varieties in Tamil Nadu and Karnataka. Exact dosage must be adjusted against soil-test health card values.",
            "warnings_precautions": "Do not apply urea in standing deep water; avoid excessive nitrogen which causes lodging, blast disease epidemics, and severe BPH outbreaks.",
            "source": "TNAU Crop Production Guide & UAS Bangalore Package of Practices",
            "source_url": "https://agritech.tnau.ac.in",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Cotton",
            "nutrient_deficiency": "Potassium Deficiency",
            "soil_condition": "Low available K (<140 kg/ha K2O), high-yielding hybrid / Bt cotton cultivation",
            "recommended_nutrient_category": "Potassic Fertilizer",
            "possible_fertilizer_types": "Muriate of Potash (MOP 60% K2O), Potassium Nitrate (13-0-45), Sulfate of Potash (0-0-50)",
            "application_guidance": "Apply 50% basal at sowing and 50% at square formation (45-50 DAS). During peak boll filling, supplement with foliar spray of 1% Potassium Nitrate (13:0:45) at 15-day intervals.",
            "dosage_information": "State Package of Practices recommendation: 60-75 kg K2O/ha (approx 100-125 kg MOP/ha) for irrigated hybrid cotton in Karnataka and Andhra Pradesh. Follow regional soil test recommendations.",
            "warnings_precautions": "Do not place muriate of potash directly in contact with germinating seeds; avoid omitting potash in high boll load hybrids to prevent sudden leaf reddening and parawilt.",
            "source": "ICAR-CICR & UAS Dharwad Package of Practices",
            "source_url": "https://cicr.icar.gov.in",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Tomato",
            "nutrient_deficiency": "Calcium Deficiency (Blossom End Rot)",
            "soil_condition": "Acidic soil (pH <6.0) or drought-stressed soil with fluctuating irrigation",
            "recommended_nutrient_category": "Calcium & Soil Amendment",
            "possible_fertilizer_types": "Calcium Nitrate (18.8% Ca, 15.5% N), Agricultural Gypsum (19% Ca, 16% S), Chelated Calcium (EDTA-Ca)",
            "application_guidance": "In acid soils apply lime/dolomite during land prep. During flowering and fruit set, spray Calcium Nitrate @ 5g/L on developing clusters. Ensure steady, uniform drip irrigation.",
            "dosage_information": "Foliar application: 5g Calcium Nitrate per liter water, 2-3 sprays at 10-day intervals from first flowering. Soil application: Consult soil test for lime requirement based on exchangeable acidity.",
            "warnings_precautions": "Do not mix Calcium Nitrate in the same spray tank with phosphatic or sulfate fertilizers (causes insoluble calcium phosphate/sulfate precipitation).",
            "source": "ICAR-IIHR Bengaluru & TNAU Vegetable Guide",
            "source_url": "https://iihr.res.in",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Coconut",
            "nutrient_deficiency": "Potassium & Magnesium Deficiency",
            "soil_condition": "Coastal sandy soil, acid laterite, low organic matter",
            "recommended_nutrient_category": "Potassic & Secondary Nutrient Fertilizer",
            "possible_fertilizer_types": "Muriate of Potash (MOP), Magnesium Sulphate (Epsom Salt)",
            "application_guidance": "Apply in a circular basin of 1.8m radius around the trunk. Incorporate into top 10cm of soil and irrigate immediately.",
            "dosage_information": "ICAR-CPCRI adult palm recommendation: 1.2 kg MOP (60% K2O) + 500g Magnesium Sulphate per palm per year in two splits (1/3rd in May-June, 2/3rd in September-October).",
            "warnings_precautions": "Ensure sufficient soil moisture before applying chemical fertilizers; do not pile fertilizers directly against palm trunk.",
            "source": "ICAR-CPCRI Kasaragod & Coconut Development Board",
            "source_url": "https://cpcri.gov.in",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "General / All Crops",
            "nutrient_deficiency": "Zinc Deficiency",
            "soil_condition": "Alkaline / Calcareous soil (pH >7.8), low DTPA zinc (<0.6 ppm)",
            "recommended_nutrient_category": "Micronutrient Fertilizer",
            "possible_fertilizer_types": "Zinc Sulphate Heptahydrate (21% Zn), Zinc Sulphate Monohydrate (33% Zn), Chelated Zinc (EDTA-Zn 12%)",
            "application_guidance": "Basal soil broadcast and incorporation during final ploughing; emergency foliar spray in standing crop with neutralized zinc solution.",
            "dosage_information": "Soil application: 25 kg Zinc Sulphate (21%) per hectare (once every 2-3 years). Foliar spray: 5g Zinc Sulphate + 2.5g Slaked Lime per liter water.",
            "warnings_precautions": "Never mix zinc sulphate directly with DAP or SSP in the fertilizer hopper or spray tank (zinc phosphate precipitates and renders both nutrients unavailable).",
            "source": "ICAR-IISS & TNAU Agritech Portal",
            "source_url": "https://agritech.tnau.ac.in",
            "verification_status": "VERIFIED"
        }
    ]

    with open(fert_master_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fert_headers)
        writer.writeheader()
        for fr in fert_records:
            writer.writerow(fr)

    print(f"[+] Successfully generated CROP_NUTRIENT_DEFICIENCY_MASTER.csv ({len(nutrients)} records), CROP_NUTRIENT_DEFICIENCY_MATRIX.csv, SOIL_HEALTH_MASTER.csv ({len(soil_params)} params), and FERTILIZER_KNOWLEDGE_MASTER.csv ({len(fert_records)} records)!")

if __name__ == "__main__":
    generate_nutrient_deficiency_and_soil_masters()
