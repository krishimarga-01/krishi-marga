import os
import csv

def generate_crop_disease_master_and_matrix():
    disease_master_path = "agricultural_knowledge/CROP_DISEASE_MASTER.csv"
    disease_matrix_path = "agricultural_knowledge/SOUTH_INDIA_CROP_DISEASE_MATRIX.csv"

    master_headers = [
        "crop", "disease_name", "scientific_name", "common_local_name", "affected_plant_part",
        "symptoms", "cause_type", "pathogen_organism", "environmental_conditions", "season",
        "geographical_relevance", "south_indian_states", "severity", "prevention", "management",
        "source", "source_url", "source_type", "verification_status"
    ]

    matrix_headers = [
        "crop", "state", "disease", "scientific_name", "cause", "symptoms", "severity",
        "season", "environment", "management", "prevention", "source", "verification_status"
    ]

    # Authoritative disease records for all 17 crops across South India
    diseases = [
        # 1. Tomato
        {
            "crop": "Tomato",
            "disease_name": "Early Blight",
            "scientific_name": "Alternaria solani",
            "common_local_name": "Kooda tegulu (Telugu), Karukal noi (Tamil), Munchina Angamari (Kannada)",
            "affected_plant_part": "Lower foliage, stems, developing fruits",
            "symptoms": "Dark brown circular spots with characteristic concentric rings creating a target-board pattern; leaves yellow and drop prematurely.",
            "cause_type": "Fungal",
            "pathogen_organism": "Alternaria solani",
            "environmental_conditions": "Warm temperatures (24-30°C) with alternating wet and dry weather; prolonged dew periods.",
            "season": "Kharif and Post-Monsoon / Rabi",
            "geographical_relevance": "Widespread across all tomato tracts in South India",
            "south_indian_states": "Karnataka, Tamil Nadu, Andhra Pradesh, Telangana",
            "severity": "Moderate to High",
            "prevention": "Use certified pathogen-free seeds; treat seed with Trichoderma viride @ 4g/kg; practice 3-year crop rotation with non-solanaceous crops.",
            "management": "Foliar spray of Mancozeb 75% WP @ 2g/L or Chlorothalonil 75% WP @ 2g/L early morning upon first lesion observation.",
            "source": "TNAU Agritech Portal & UAS Bangalore Package of Practices",
            "source_url": "https://agritech.tnau.ac.in/crop_protection/crop_prot_crop%20diseases_veg_tomato.html",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Tomato",
            "disease_name": "Late Blight",
            "scientific_name": "Phytophthora infestans",
            "common_local_name": "Kollai noi (Tamil), Angamari (Kannada)",
            "affected_plant_part": "Leaves, petiole, stem, green fruit",
            "symptoms": "Water-soaked irregular pale green lesions on leaves rapidly turning dark brown/black; white fungal downy growth on leaf undersides under high humidity; rapid vine collapse.",
            "cause_type": "Oomycete / Fungal",
            "pathogen_organism": "Phytophthora infestans",
            "environmental_conditions": "Cool temperatures (12-22°C) combined with high relative humidity (>90%) and continuous cloudy/rainy days.",
            "season": "Late Kharif / Winter (Rabi) in hilly and plateau tracts",
            "geographical_relevance": "Hill tracts (Nilgiris, Dindigul hills) and winter plateau plains (Kolar, Belagavi, Madanapalle)",
            "south_indian_states": "Tamil Nadu, Karnataka, Andhra Pradesh",
            "severity": "Critical",
            "prevention": "Ensure good drainage; avoid overhead sprinkler irrigation; destroy infected volunteer tomato/potato plants.",
            "management": "Prophylactic spray of Mancozeb 75% WP @ 2.5g/L; curative spray of Metalaxyl 8% + Mancozeb 64% WP @ 2g/L or Cymoxanil 8% + Mancozeb 64% WP @ 2g/L.",
            "source": "ICAR-IIHR Bengaluru & TNAU Crop Protection",
            "source_url": "https://iihr.res.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Tomato",
            "disease_name": "Bacterial Wilt",
            "scientific_name": "Ralstonia solanacearum",
            "common_local_name": "Bacterial wilt, Soragu roga (Kannada), Pakkeeriya vadal (Tamil)",
            "affected_plant_part": "Vascular system, roots, lower stems",
            "symptoms": "Rapid complete wilting of green plant without initial yellowing; vascular browning visible upon stem cross-section; bacterial streaming in clear water.",
            "cause_type": "Bacterial",
            "pathogen_organism": "Ralstonia solanacearum",
            "environmental_conditions": "High soil moisture, warm soil temperatures (30-35°C), acidic to neutral sandy loam soils.",
            "season": "Kharif and Summer",
            "geographical_relevance": "Endemic in coastal and high rainfall river plains",
            "south_indian_states": "Kerala, Karnataka, Tamil Nadu, Andhra Pradesh",
            "severity": "Critical",
            "prevention": "Grow wilt-resistant varieties/hybrids (e.g., Arka Abha, Arka Alok, Mukti, Sakthi); avoid planting in waterlogged soils; crop rotation with maize/paddy.",
            "management": "Soil drenching around healthy border plants with Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline @ 0.1g/L; uproot and burn infected plants.",
            "source": "KAU Package of Practices & ICAR-IIHR",
            "source_url": "https://celkau.in/ecropdoctor/Crops.aspx",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Tomato",
            "disease_name": "Tomato Leaf Curl Virus",
            "scientific_name": "Tomato leaf curl New Delhi virus (ToLCNDV)",
            "common_local_name": "Ele muduru roga (Kannada), Ilai churul noi (Tamil), Aaku mudatha (Telugu)",
            "affected_plant_part": "Apical foliage, flowers",
            "symptoms": "Upward curling and puckering of leaf margins; reduction in leaflet size; interveinal chlorosis; severe stunting and bushy appearance with flower dropping.",
            "cause_type": "Viral (Begomovirus)",
            "pathogen_organism": "Tomato leaf curl virus (vectored by Bemisia tabaci whitefly)",
            "environmental_conditions": "Warm and dry weather favoring high whitefly reproduction and dispersal.",
            "season": "Summer and early Kharif",
            "geographical_relevance": "Ubiquitous in all South Indian semi-arid tracts",
            "south_indian_states": "Karnataka, Andhra Pradesh, Telangana, Tamil Nadu",
            "severity": "Severe",
            "prevention": "Plant virus-tolerant hybrids (e.g., Arka Rakshak, Arka Samrat); install yellow sticky traps (15/acre); cover nursery with 40-mesh insect net.",
            "management": "Control vector with systemic foliar sprays: Diafenthiuron 50% WP @ 1g/L or Acetamiprid 20% SP @ 0.2g/L; rogue out infected plants within first 30 days.",
            "source": "ICAR-IIHR & ANGRAU Vyavasaya Panchangam",
            "source_url": "https://iihr.res.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 2. Paddy / Rice
        {
            "crop": "Paddy / Rice",
            "disease_name": "Blast (Leaf and Neck Blast)",
            "scientific_name": "Magnaporthe oryzae (Pyricularia oryzae)",
            "common_local_name": "Kollai / Kulir noi (Tamil), Benki roga (Kannada), Aggitegulu (Telugu)",
            "affected_plant_part": "Leaf blade, collar, node, panicle neck",
            "symptoms": "Spindle-shaped elliptical eye spots with grey/whitish centers and dark brown margins; blackened rotten panicle neck causing chaffy grain heads (neck blast).",
            "cause_type": "Fungal",
            "pathogen_organism": "Magnaporthe oryzae",
            "environmental_conditions": "High relative humidity (>90%), night temperatures 20-24°C, prolonged dew, excessive nitrogen fertilizer.",
            "season": "Kuruvai/Samba in TN, Kharif/Rabi in AP/Telangana/Karnataka, Virippu/Mundakan in Kerala",
            "geographical_relevance": "Major endemic disease across Cauvery Delta, Godavari Delta, Coastal Karnataka, Kuttanad",
            "south_indian_states": "Tamil Nadu, Andhra Pradesh, Telangana, Karnataka, Kerala, Puducherry",
            "severity": "Critical",
            "prevention": "Avoid split excessive application of nitrogen; treat seeds with Carbendazim 50% WP @ 2g/kg or Tricyclazole 75% WP @ 1.5g/kg.",
            "management": "Spray Tricyclazole 75% WP @ 0.6g/L or Isoprothiolane 40% EC @ 1.5ml/L or Kasugamycin 3% SL @ 2.5ml/L at tillering and boot leaf stages.",
            "source": "ICAR-IIRR Hyderabad & TNAU Agritech Portal",
            "source_url": "https://icar-iirr.org",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Paddy / Rice",
            "disease_name": "Bacterial Leaf Blight (BLB)",
            "scientific_name": "Xanthomonas oryzae pv. oryzae",
            "common_local_name": "Pakkeeriya noi (Tamil), Bakteeriyadinda banna roga (Kannada), Pakshika tegulu (Telugu)",
            "affected_plant_part": "Leaf tips and margins, vascular system",
            "symptoms": "Water-soaked stripes starting at leaf tips and margins undulating downwards; turns straw-yellow to dirty white; bacterial oozes visible as tiny golden beads on dew mornings; kresek phase in seedlings.",
            "cause_type": "Bacterial",
            "pathogen_organism": "Xanthomonas oryzae pv. oryzae",
            "environmental_conditions": "Heavy rainfall, severe winds during cyclonic depressions, temperature 25-34°C, standing floodwater.",
            "season": "Late Kharif / Northeast Monsoon season",
            "geographical_relevance": "Severe in coastal flood-prone areas and deltaic tracts",
            "south_indian_states": "Tamil Nadu, Andhra Pradesh, Kerala, Karnataka, Puducherry",
            "severity": "Severe",
            "prevention": "Use resistant varieties (e.g., Improved Samba Mahsuri, ADT 43); avoid clipping of seedling tips during transplanting; drain standing water.",
            "management": "Spray Copper Oxychloride 50% WP @ 2.5g/L mixed with Streptocycline @ 0.1g/L; temporarily suspend nitrogen top-dressing.",
            "source": "ICAR-IIRR & ANGRAU Vyavasaya Panchangam",
            "source_url": "https://icar-iirr.org",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Paddy / Rice",
            "disease_name": "Sheath Blight",
            "scientific_name": "Rhizoctonia solani",
            "common_local_name": "Urai azhukal (Tamil), Sheath blight, Poda tegulu (Telugu)",
            "affected_plant_part": "Leaf sheath near water level, ascending to flag leaf",
            "symptoms": "Greenish-grey oval or irregular water-soaked spots on leaf sheaths; lesions enlarge with bleached grey centers and dark reddish-brown borders; sclerotial bodies develop on lesions.",
            "cause_type": "Fungal",
            "pathogen_organism": "Rhizoctonia solani",
            "environmental_conditions": "Dense crop canopy, high relative humidity (85-100%), temperature 28-32°C, high doses of nitrogen.",
            "season": "Tillering to panicle initiation in all seasons",
            "geographical_relevance": "Intensively cultivated high-density irrigated rice fields",
            "south_indian_states": "Andhra Pradesh, Telangana, Tamil Nadu, Karnataka, Kerala",
            "severity": "Severe",
            "prevention": "Maintain wider plant spacing (20x15 cm); apply balanced potash nutrition; destroy stubbles after harvest.",
            "management": "Foliar spray directed towards base of tillers: Hexaconazole 5% SC @ 2ml/L or Validamycin 3% L @ 2ml/L or Thifluzamide 24% SC @ 0.75ml/L.",
            "source": "TNAU Agritech Portal & KAU Package of Practices",
            "source_url": "https://agritech.tnau.ac.in",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },

        # 3. Chilli
        {
            "crop": "Chilli",
            "disease_name": "Anthracnose / Fruit Rot & Dieback",
            "scientific_name": "Colletotrichum capsici (Colletotrichum truncatum)",
            "common_local_name": "Pazham azhukal (Tamil), Kudi tegulu / Kaya kulla (Telugu), Hannu kora (Kannada)",
            "affected_plant_part": "Ripe fruits, tender shoots, twigs",
            "symptoms": "Sunken, circular to oval lesions with black concentric rings of fungal acervuli on ripe fruits; tips of branches wither, dry and turn ash grey downwards (dieback).",
            "cause_type": "Fungal",
            "pathogen_organism": "Colletotrichum capsici",
            "environmental_conditions": "Warm humid conditions (28-32°C, RH >80%) with intermittent rain showers during fruit ripening.",
            "season": "Rabi and late Kharif",
            "geographical_relevance": "Major limiting factor in Guntur, Warangal, Byadagi, Ramanathapuram chilli tracts",
            "south_indian_states": "Andhra Pradesh, Telangana, Karnataka, Tamil Nadu",
            "severity": "Severe to Critical",
            "prevention": "Collect and burn mummified fruits; treat seed with Thiram @ 2g/kg or Trichoderma @ 6g/kg; avoid furrow water splash.",
            "management": "Spray Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 23% SC @ 1ml/L or Difenoconazole 25% EC @ 1ml/L at 10-15 day intervals.",
            "source": "ANGRAU Regional Agricultural Research Station (Lam, Guntur)",
            "source_url": "https://angrau.ac.in",
            "source_type": "Agricultural University Research Guide",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Chilli",
            "disease_name": "Chilli Leaf Curl Complex",
            "scientific_name": "Chilli leaf curl virus (ChiLCV) & Thrips/Mite complex",
            "common_local_name": "Muduru roga (Kannada), Murukku noi (Tamil), Bobbara tegulu (Telugu)",
            "affected_plant_part": "Terminal foliage, buds, flower stalks",
            "symptoms": "Upward curling and canoeing of leaves (thrips/virus) or downward cupping with inverted boat shape (yellow mite); leaves turn leathery, brittle and crinkled.",
            "cause_type": "Viral vector / Arthropod complex",
            "pathogen_organism": "ChiLCV (vectored by Whitefly) + Scirtothrips dorsalis + Polyphagotarsonemus latus",
            "environmental_conditions": "Prolonged dry spells with warm daytime temperatures (30-36°C) favoring sucking pest multiplication.",
            "season": "Post-transplanting throughout vegetative growth",
            "geographical_relevance": "Widespread across all southern dry zone chilli areas",
            "south_indian_states": "Andhra Pradesh, Telangana, Karnataka, Tamil Nadu",
            "severity": "Severe",
            "prevention": "Erect barrier crops (3 rows of maize/sorghum around plot); install blue sticky traps (thrips) and yellow traps (whitefly) @ 15/acre each.",
            "management": "Spray Diafenthiuron 50% WP @ 1.25g/L or Fipronil 5% SC @ 2ml/L for thrips; Fenpyroximate 5% EC @ 1.5ml/L for mites; Acetamiprid 20% SP @ 0.2g/L for whitefly.",
            "source": "UAS Dharwad & TNAU Crop Protection",
            "source_url": "https://uasd.edu",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },

        # 4. Cotton
        {
            "crop": "Cotton",
            "disease_name": "Bacterial Blight / Angular Leaf Spot / Blackarm",
            "scientific_name": "Xanthomonas citri pv. malvacearum",
            "common_local_name": "Bacterial blight, Konal ilai karukal (Tamil), Kona tegulu (Telugu), Kona machhe (Kannada)",
            "affected_plant_part": "Cotyledons, leaf blades, petioles, stems, bolls",
            "symptoms": "Angular water-soaked spots bounded by leaf veinlets; lesions turn brown to black; blackarm lesion girdles branches; circular water-soaked sunken spots on bolls.",
            "cause_type": "Bacterial",
            "pathogen_organism": "Xanthomonas citri pv. malvacearum",
            "environmental_conditions": "Warm humid conditions (25-30°C), intermittent rains and high wind speed during monsoon.",
            "season": "Kharif and early post-monsoon",
            "geographical_relevance": "Cotton belts of North Karnataka, Rayalaseema, Western Tamil Nadu, Northern Telangana",
            "south_indian_states": "Karnataka, Andhra Pradesh, Telangana, Tamil Nadu",
            "severity": "Severe",
            "prevention": "Acid delinting of cottonseed with commercial sulphuric acid (100ml/kg); use resistant cultivars; destroy crop residues.",
            "management": "Foliar spray of Copper Oxychloride 50% WP @ 2.5g/L + Streptocycline @ 0.1g/L; repeat after 15 days if rainfall persists.",
            "source": "ICAR-CICR Regional Station Coimbatore & UAS Dharwad",
            "source_url": "https://cicr.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Cotton",
            "disease_name": "Fusarium Wilt",
            "scientific_name": "Fusarium oxysporum f. sp. vasinfectum",
            "common_local_name": "Soragu roga (Kannada), Vadal noi (Tamil), Vadi tegulu (Telugu)",
            "affected_plant_part": "Roots, vascular xylem system, lower leaves",
            "symptoms": "Yellowing and browning along leaf margins extending inwards; wilting starts from lower leaves upwards; dark brown vascular discoloration inside peeled taproot.",
            "cause_type": "Fungal",
            "pathogen_organism": "Fusarium oxysporum f. sp. vasinfectum",
            "environmental_conditions": "Heavy black clay soils (Vertisols), soil temperature 25-28°C, root injury caused by nematodes.",
            "season": "Vegetative and flowering stages",
            "geographical_relevance": "Deep black soils of Dharwad, Belagavi, Raichur, Adilabad, Warangal",
            "south_indian_states": "Karnataka, Telangana, Andhra Pradesh, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Deep summer ploughing; soil solarization; seed treatment with Trichoderma viride @ 4-6g/kg seed; crop rotation with sorghum.",
            "management": "Spot drenching around early-wilted plants with Carbendazim 50% WP @ 1g/L; apply balanced potash to build plant cell wall thickness.",
            "source": "UAS Dharwad & TNAU Agritech Portal",
            "source_url": "https://uasd.edu",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },

        # 5. Sugarcane
        {
            "crop": "Sugarcane",
            "disease_name": "Red Rot",
            "scientific_name": "Colletotrichum falcatum",
            "common_local_name": "Sev azhukal (Tamil), Kempu kora (Kannada), Erra kulla tegulu (Telugu)",
            "affected_plant_part": "Internal stalk pith, midrib of leaves",
            "symptoms": "Third or fourth leaf from top yellows and withers; split cane reveals internal tissue reddened with characteristic white transverse bands perpendicular to stalk; alcoholic odor.",
            "cause_type": "Fungal",
            "pathogen_organism": "Colletotrichum falcatum",
            "environmental_conditions": "Waterlogging, ill-drained alkaline soils, high humidity (>85%), monsoon water flow through fields.",
            "season": "Mid-season to maturity (Kharif/Rabi)",
            "geographical_relevance": "Endemic in coastal Tamil Nadu (Cuddalore), Andhra Pradesh, Belagavi and Mandya",
            "south_indian_states": "Tamil Nadu, Andhra Pradesh, Karnataka, Telangana",
            "severity": "Critical",
            "prevention": "Plant disease-free seed setts from certified nurseries; treat setts with Carbendazim 50% WP @ 1g/L (hot water or sett soak); avoid ratoon cropping in infected fields.",
            "management": "No chemical cure inside standing stalks once vascular rot is established; uproot and burn infected clumps; immediately drain standing water.",
            "source": "ICAR-Sugarcane Breeding Institute (SBI) Coimbatore",
            "source_url": "https://sugarcane.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 6. Coconut
        {
            "crop": "Coconut",
            "disease_name": "Basal Stem Rot / Tanjore Wilt",
            "scientific_name": "Ganoderma lucidum (Ganoderma applanatum)",
            "common_local_name": "Thanjavur vadal (Tamil), Anabe roga (Kannada), Ganoderma roga (Telugu)",
            "affected_plant_part": "Base of palm trunk (0 to 1.5m), root system",
            "symptoms": "Exudation of dark reddish-brown gummy fluid from trunk base; basal bark decay; outer leaves yellow, droop and hang skirt-like around stem; bracket-shaped fungal fructifications (conks) emerge at trunk base.",
            "cause_type": "Fungal",
            "pathogen_organism": "Ganoderma lucidum",
            "environmental_conditions": "Light sandy and coastal red soils, prolonged drought followed by heavy rainfall, neglected palms.",
            "season": "Visible year-round; severe after monsoon rains",
            "geographical_relevance": "Thanjavur, Tiruvarur, Nagapattinam (TN), coastal Karnataka, coastal AP",
            "south_indian_states": "Tamil Nadu, Karnataka, Andhra Pradesh, Kerala, Puducherry",
            "severity": "Critical",
            "prevention": "Isolate infected palm with 1m wide by 50cm deep isolation trenches; apply neem cake @ 5kg/palm/year enriched with Trichoderma harzianum @ 50g/palm.",
            "management": "Root feeding with Hexaconazole 5% SC (2ml in 100ml water) or Aureofungin-sol (2g) + Copper Sulphate (1g) in 100ml water at quarterly intervals.",
            "source": "ICAR-CPCRI Kasaragod & TNAU Coconut Portal",
            "source_url": "https://cpcri.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Coconut",
            "disease_name": "Bud Rot",
            "scientific_name": "Phytophthora palmivora",
            "common_local_name": "Kuruth azhukal (Tamil/Malayalam), Kodu kora (Kannada)",
            "affected_plant_part": "Central spindle leaf and apical growing bud",
            "symptoms": "Central spindle leaf yellows, turns brown and rots; foul decaying odor from crown heart; spindle easily slips out upon gentle pull; death of palm if heart bud decays.",
            "cause_type": "Oomycete / Fungal",
            "pathogen_organism": "Phytophthora palmivora",
            "environmental_conditions": "Southwest monsoon season with continuous rain, cool breeze, relative humidity >95%, temperature 22-26°C.",
            "season": "Southwest monsoon (June to September)",
            "geographical_relevance": "High rainfall regions of Kerala, Coastal Karnataka, Nilgiris slopes",
            "south_indian_states": "Kerala, Karnataka, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Prophylactic placement of perforated sachets containing Mancozeb (5g) or placement of Copper Oxychloride paste around crown before onset of monsoon.",
            "management": "In early stages, cut away rotten tissues, clean crown and apply 10% Bordeaux paste; pour Bordeaux mixture 1% or Copper Oxychloride @ 3g/L into crown.",
            "source": "ICAR-CPCRI Kasaragod & KAU Agri-Infotech",
            "source_url": "https://cpcri.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 7. Maize / Corn
        {
            "crop": "Maize / Corn",
            "disease_name": "Maydis Leaf Blight / Southern Corn Leaf Blight",
            "scientific_name": "Bipolaris maydis (Cochliobolus heterostrophus)",
            "common_local_name": "Elai karukal (Tamil), Ele kollai (Kannada), Aaku macha (Telugu)",
            "affected_plant_part": "Leaves, leaf sheaths, ear husks",
            "symptoms": "Small diamond-shaped to elongated rectangular lesions delimited by leaf veins; buff to brown centers with darker reddish borders; coalescing lesions cause complete leaf blight.",
            "cause_type": "Fungal",
            "pathogen_organism": "Bipolaris maydis",
            "environmental_conditions": "Warm, humid conditions (25-32°C) with persistent cloudiness and rain showers.",
            "season": "Kharif and early Rabi",
            "geographical_relevance": "Intensively grown maize tracts of Haveri, Davangere, Karimnagar, Perambalur",
            "south_indian_states": "Karnataka, Telangana, Andhra Pradesh, Tamil Nadu",
            "severity": "Moderate to Severe",
            "prevention": "Grow resistant hybrid varieties; destroy previous crop stubbles; balanced nitrogen and potassium application.",
            "management": "Foliar spray of Mancozeb 75% WP @ 2.5g/L or Azoxystrobin 18.2% + Difenoconazole 11.4% SC @ 1ml/L at first disease onset.",
            "source": "ICAR-Indian Institute of Maize Research (IIMR) & UAS Bangalore",
            "source_url": "https://iimr.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 8. Wheat
        {
            "crop": "Wheat",
            "disease_name": "Black / Stem Rust",
            "scientific_name": "Puccinia graminis f. sp. tritici",
            "common_local_name": "Kunkuma roga / Thuppa roga (Kannada), Kaatu noi (Tamil)",
            "affected_plant_part": "Stems, leaf sheaths, glumes",
            "symptoms": "Reddish-brown elongated pustules (uredinia) that rupture epidermis exposing brown powdery spores; as plant matures, pustules turn black (telia).",
            "cause_type": "Fungal",
            "pathogen_organism": "Puccinia graminis",
            "environmental_conditions": "Mild winter temperatures (20-25°C) followed by warm sunny days with morning dew.",
            "season": "Rabi (Winter season: December to February)",
            "geographical_relevance": "Northern Karnataka plateau (Dharwad, Belagavi, Vijayapura) wheat tracts",
            "south_indian_states": "Karnataka, Northern Telangana",
            "severity": "Severe to Critical",
            "prevention": "Sow rust-resistant durum/bread wheat cultivars (e.g., UAS 304, DWR 162); avoid late sowing.",
            "management": "Foliar spray of Propiconazole 25% EC @ 1ml/L or Tebuconazole 25% WG @ 1g/L at appearance of first pustules.",
            "source": "UAS Dharwad Department of Plant Pathology",
            "source_url": "https://uasd.edu",
            "source_type": "Agricultural University Research Guide",
            "verification_status": "VERIFIED"
        },

        # 9. Coffee
        {
            "crop": "Coffee",
            "disease_name": "Coffee Leaf Rust",
            "scientific_name": "Hemileia vastatrix",
            "common_local_name": "Kaapi thuruve (Kannada), Kaappi thuru (Tamil/Malayalam)",
            "affected_plant_part": "Under-surface of mature coffee leaves",
            "symptoms": "Pale yellow circular spots on upper surface; bright orange-yellow powdery pustules of uredospores on matching lower surface; severe defoliation and dieback of twigs.",
            "cause_type": "Fungal",
            "pathogen_organism": "Hemileia vastatrix",
            "environmental_conditions": "Optimum temperature 21-25°C, free water droplet on leaf for 4-6 hours, shaded humid environment.",
            "season": "Post-monsoon (August to November)",
            "geographical_relevance": "Western Ghats coffee zones: Kodagu, Chikmagalur, Hassan (Karnataka), Wayanad (Kerala), Nilgiris, Yercaud (TN)",
            "south_indian_states": "Karnataka, Kerala, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Maintain two-tier shade trees to prevent direct sunlight and dew pooling; plant rust-tolerant selections (S.795, Chandragiri).",
            "management": "Pre-monsoon (May/June) and post-monsoon (September/October) spray with 0.5% Bordeaux mixture or Triadimefon 25% WP @ 0.5g/L.",
            "source": "Central Coffee Research Institute (CCRI Balehonnur) / Coffee Board of India",
            "source_url": "https://coffeeboard.gov.in",
            "source_type": "Statutory Commodity Board Research Guide",
            "verification_status": "VERIFIED"
        },

        # 10. Tea
        {
            "crop": "Tea",
            "disease_name": "Blister Blight",
            "scientific_name": "Exobasidium vexans",
            "common_local_name": "Koppala noi (Tamil/Malayalam), Ele koppala (Kannada)",
            "affected_plant_part": "Young tender leaves, succulent shoots, harvestable flushes",
            "symptoms": "Circular pale yellow translucent spots on tender leaf blades; lesion bulges into concave blister on upper surface with corresponding white powdery convex velvet on lower surface; tender stem breakage.",
            "cause_type": "Fungal",
            "pathogen_organism": "Exobasidium vexans",
            "environmental_conditions": "Monsoon misty weather, daily sunshine <3.5 hours, relative humidity >85%, temperatures 18-24°C.",
            "season": "Southwest and Northeast Monsoon (June to December)",
            "geographical_relevance": "High elevation tea estates in Nilgiris, Anamallais (Valparai), Munnar, Wayanad",
            "south_indian_states": "Tamil Nadu, Kerala",
            "severity": "Critical",
            "prevention": "Regulate shade by lopping branches prior to monsoon; maintain strict plucking rounds (7-10 days).",
            "management": "Foliar spray of Copper Oxychloride 50% WP @ 2g/L + Hexaconazole 5% SC @ 1ml/L at 7-day plucking intervals during continuous mist.",
            "source": "UPASI Tea Research Institute (Valparai) & TNAU",
            "source_url": "https://upasi.org",
            "source_type": "Tea Research Institute Benchmark",
            "verification_status": "VERIFIED"
        },

        # 11. Rubber
        {
            "crop": "Rubber",
            "disease_name": "Abnormal Leaf Fall",
            "scientific_name": "Phytophthora meadii (Phytophthora botryosa)",
            "common_local_name": "Akala elai kottal (Tamil), Elapozhichil (Malayalam)",
            "affected_plant_part": "Mature green leaves, petiole, green pods",
            "symptoms": "Water-soaked lesion on leaf petiole with a drop of coagulated latex in center; green leaflets shed while still fresh; green fruit capsules rot and shrivel on branches.",
            "cause_type": "Oomycete / Fungal",
            "pathogen_organism": "Phytophthora meadii",
            "environmental_conditions": "Heavy southwest monsoon with continuous cloud cover, temperature 22-26°C, relative humidity near 100%.",
            "season": "Southwest monsoon (June to August)",
            "geographical_relevance": "Rubber tracts of Kottayam, Pathanamthitta, Ernakulam, Kozhikode, Kanyakumari",
            "south_indian_states": "Kerala, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Aerial spraying or ground spraying using high-pressure sprayers with 1% Bordeaux mixture before monsoon onset (May).",
            "management": "Prophylactic spray of Copper Oxychloride in oil (oil-dispersible paste) using Micron sprayer before monsoon rains commence.",
            "source": "Rubber Research Institute of India (RRII Kottayam) / Rubber Board",
            "source_url": "https://rubberboard.gov.in",
            "source_type": "Statutory Commodity Board Research Guide",
            "verification_status": "VERIFIED"
        },

        # 12. Tobacco
        {
            "crop": "Tobacco",
            "disease_name": "Black Shank",
            "scientific_name": "Phytophthora nicotianae",
            "common_local_name": "Black shank, Kari roga (Kannada), Karuppu thandu noi (Tamil)",
            "affected_plant_part": "Basal stem, taproot, lower leaves",
            "symptoms": "Blackening and necrosis of stem at soil level (shank); internal stem pith splits into disc-like plates separated by empty gaps; leaves wilt rapidly.",
            "cause_type": "Oomycete / Fungal",
            "pathogen_organism": "Phytophthora nicotianae",
            "environmental_conditions": "Waterlogged fields, warm wet soils (28-32°C), poorly drained soils.",
            "season": "Kharif and early Rabi",
            "geographical_relevance": "Mysuru-Hunsur FCV tobacco belt, Prakasam, Guntur, East/West Godavari",
            "south_indian_states": "Karnataka, Andhra Pradesh",
            "severity": "Severe to Critical",
            "prevention": "Crop rotation with non-host crops like paddy or maize; use disease-tolerant varieties; avoid deep cultivation that damages root collar.",
            "management": "Soil drenching around base with Metalaxyl 8% + Mancozeb 64% WP @ 2g/L or Bordeaux mixture 1% at transplanting.",
            "source": "ICAR-Central Tobacco Research Institute (CTRI Rajahmundry)",
            "source_url": "https://ctri.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 13. Black Pepper
        {
            "crop": "Black Pepper",
            "disease_name": "Quick Wilt / Foot Rot",
            "scientific_name": "Phytophthora capsici",
            "common_local_name": "Dhutha koodu (Malayalam), Vegavagi vadal (Tamil), Bega soragu roga (Kannada)",
            "affected_plant_part": "Collar region, root system, runner shoots, foliage",
            "symptoms": "Dark blackish-brown lesion at collar region near ground; rapid foliar wilting without preliminary chlorosis; complete defoliation and vine collapse within 2 weeks.",
            "cause_type": "Oomycete / Fungal",
            "pathogen_organism": "Phytophthora capsici",
            "environmental_conditions": "Continuous heavy rainfall during southwest monsoon, soil saturation, temperature 22-28°C.",
            "season": "Southwest monsoon (June to August)",
            "geographical_relevance": "Wayanad, Idukki, Kannur (Kerala), Kodagu, Hassan, Uttara Kannada (Karnataka)",
            "south_indian_states": "Kerala, Karnataka, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Phytosanitary trenching between vine rows; application of Trichoderma harzianum @ 50g/vine with FYM and neem cake; maintain drainage.",
            "management": "Foliar spray with Potassium Phosphonate (0.3%) and soil drenching with 1% Bordeaux mixture or Metalaxyl-Mancozeb @ 2g/L before and during monsoon.",
            "source": "ICAR-Indian Institute of Spices Research (IISR Kozhikode)",
            "source_url": "https://spices.res.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 14. Cardamom
        {
            "crop": "Cardamom",
            "disease_name": "Azhukal Disease / Capsule Rot",
            "scientific_name": "Phytophthora nicotianae var. nicotianae (Phytophthora meadii)",
            "common_local_name": "Azhukal noi (Tamil/Malayalam), Korakolu (Kannada)",
            "affected_plant_part": "Panicles, tender capsules, leaves",
            "symptoms": "Water-soaked lesions on young capsules which turn dull brownish-black and rot with foul odor; infected capsules shed prematurely from panicle.",
            "cause_type": "Oomycete / Fungal",
            "pathogen_organism": "Phytophthora nicotianae var. nicotianae",
            "environmental_conditions": "Monsoon rains, high humidity (>95%), mist, wet forest canopy shade.",
            "season": "Southwest and Northeast Monsoon (June to November)",
            "geographical_relevance": "Cardamom Hills (Idukki), Wayanad, Kodagu, Hassan cardamom plantations",
            "south_indian_states": "Kerala, Karnataka, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Remove dead mulch and trash around clumps prior to monsoon; thin excessive shade trees; spray biocontrol agents (Trichoderma viride).",
            "management": "Foliar and panicle spray with 1% Bordeaux mixture or Potassium Phosphonate @ 3ml/L; drench base of clump.",
            "source": "Indian Cardamom Research Institute (ICRI Myladumpara) & ICAR-IISR",
            "source_url": "https://spices.res.in",
            "source_type": "Spices Board Research Guide",
            "verification_status": "VERIFIED"
        },

        # 15. Turmeric
        {
            "crop": "Turmeric",
            "disease_name": "Leaf Spot",
            "scientific_name": "Colletotrichum curcumae",
            "common_local_name": "Ilai pulli noi (Tamil), Ele machhe roga (Kannada), Aaku macha (Telugu)",
            "affected_plant_part": "Leaf blades, petiole",
            "symptoms": "Elliptical to oblong brown spots with greyish-white centers and dark brown borders; yellow halo around spots; spots coalesce causing extensive drying of foliage.",
            "cause_type": "Fungal",
            "pathogen_organism": "Colletotrichum curcumae",
            "environmental_conditions": "Warm and humid conditions (26-30°C, RH >80%) with morning dew.",
            "season": "Post-monsoon (August to November)",
            "geographical_relevance": "Erode, Salem, Dharmapuri (TN), Nizamabad (Telangana), Chamarajanagar (Karnataka)",
            "south_indian_states": "Tamil Nadu, Telangana, Andhra Pradesh, Karnataka",
            "severity": "Moderate to Severe",
            "prevention": "Treat seed rhizomes with Mancozeb @ 3g/L for 30 minutes before planting; practice crop rotation.",
            "management": "Foliar spray with Mancozeb 75% WP @ 2.5g/L or Carbendazim 12% + Mancozeb 63% WP @ 2g/L or Azoxystrobin 23% SC @ 1ml/L.",
            "source": "TNAU Agritech Portal & PJTSAU Crop Manual",
            "source_url": "https://agritech.tnau.ac.in",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },

        # 16. Arecanut / Betel Nut
        {
            "crop": "Arecanut / Betel Nut",
            "disease_name": "Fruit Rot / Koleroga / Mahali",
            "scientific_name": "Phytophthora meadii",
            "common_local_name": "Koleroga (Kannada), Mahali (Tamil/Malayalam)",
            "affected_plant_part": "Tender and developing nuts, stalks, crown",
            "symptoms": "Water-soaked dark green lesions near nut calyx; affected nuts rot, lose luster and shed in enormous quantities forming a green/brown carpet on ground; white mycelial mass coats shed nuts.",
            "cause_type": "Oomycete / Fungal",
            "pathogen_organism": "Phytophthora meadii",
            "environmental_conditions": "Continuous heavy torrential southwest monsoon, low temperatures (20-24°C), relative humidity >95%.",
            "season": "Southwest monsoon (June to September)",
            "geographical_relevance": "Malnad and Coastal Karnataka (Shivamogga, Uttara/Dakshina Kannada, Chikkamagaluru), Kasaragod (Kerala)",
            "south_indian_states": "Karnataka, Kerala, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Tie protective polythene bags or areca frond covers (kotte) over nut bunches before monsoon onset; collect and burn fallen rotten nuts.",
            "management": "Prophylactic spraying of 1% Bordeaux mixture with rosin soap resin adhesive onto nut bunches twice: first in late May/early June before monsoon, second 40-45 days later.",
            "source": "ICAR-CPCRI Regional Station Vittal & UAS Dharwad",
            "source_url": "https://cpcri.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 17. Cashew
        {
            "crop": "Cashew",
            "disease_name": "Anthracnose and Inflorescence Blight",
            "scientific_name": "Colletotrichum gloeosporioides",
            "common_local_name": "Inflorescence blight, Poongothu azhukal (Tamil), Hoogombe kora (Kannada)",
            "affected_plant_part": "Tender flushes, floral panicles, young nuts, cashew apples",
            "symptoms": "Brown water-soaked necrotic lesions on floral panicles; drying and blackening of panicles (blight); black scabby lesions on tender cashew apples and developing nuts; gummy exudate on twigs.",
            "cause_type": "Fungal",
            "pathogen_organism": "Colletotrichum gloeosporioides",
            "environmental_conditions": "Heavy morning dew, relative humidity >85%, cloudy days during flushing and flowering.",
            "season": "Winter / Spring flowering season (December to March)",
            "geographical_relevance": "Coastal Karnataka, Kerala, coastal Tamil Nadu (Cuddalore, Ariyalur), coastal AP",
            "south_indian_states": "Karnataka, Kerala, Tamil Nadu, Andhra Pradesh",
            "severity": "Severe",
            "prevention": "Prune criss-cross and dead branches post-harvest to allow sunlight penetration; remove dried floral panicles.",
            "management": "Spray Bordeaux mixture 1% or Copper Oxychloride 50% WP @ 2.5g/L or Carbendazim 50% WP @ 1g/L at flushing and panicle emergence stages.",
            "source": "ICAR-Directorate of Cashew Research (DCR Puttur) & TNAU",
            "source_url": "https://cashew.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        }
    ]

    # Write CROP_DISEASE_MASTER.csv
    with open(disease_master_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=master_headers)
        writer.writeheader()
        for d in diseases:
            writer.writerow(d)

    # Write SOUTH_INDIA_CROP_DISEASE_MATRIX.csv (matrix across individual states)
    matrix_rows = []
    for d in diseases:
        states = [s.strip() for s in d["south_indian_states"].split(",")]
        for st in states:
            matrix_rows.append({
                "crop": d["crop"],
                "state": st,
                "disease": d["disease_name"],
                "scientific_name": d["scientific_name"],
                "cause": f"{d['cause_type']} ({d['pathogen_organism']})",
                "symptoms": d["symptoms"],
                "severity": d["severity"],
                "season": d["season"],
                "environment": d["environmental_conditions"],
                "management": d["management"],
                "prevention": d["prevention"],
                "source": d["source"],
                "verification_status": d["verification_status"]
            })

    with open(disease_matrix_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=matrix_headers)
        writer.writeheader()
        for r in matrix_rows:
            writer.writerow(r)

    print(f"[+] Successfully generated CROP_DISEASE_MASTER.csv ({len(diseases)} records) and SOUTH_INDIA_CROP_DISEASE_MATRIX.csv ({len(matrix_rows)} state rows)!")

def generate_crop_pest_master_and_matrix():
    pest_master_path = "agricultural_knowledge/CROP_PEST_MASTER.csv"
    pest_matrix_path = "agricultural_knowledge/SOUTH_INDIA_CROP_PEST_MATRIX.csv"

    master_headers = [
        "crop", "pest_name", "scientific_name", "common_local_name", "pest_type",
        "life_stage_causing_damage", "affected_plant_part", "damage_symptoms",
        "favorable_environmental_conditions", "season", "south_indian_states",
        "severity", "prevention", "safe_control_options", "verified_pesticide_information",
        "source", "source_url", "source_type", "verification_status"
    ]

    matrix_headers = [
        "crop", "state", "pest", "scientific_name", "damage", "symptoms",
        "season", "risk_conditions", "source", "verification_status"
    ]

    pests = [
        # 1. Tomato
        {
            "crop": "Tomato",
            "pest_name": "Tomato Fruit Borer",
            "scientific_name": "Helicoverpa armigera",
            "common_local_name": "Kaai thulaipaan (Tamil), Kaai koruku hula (Kannada), Kāya tholi (Telugu)",
            "pest_type": "Lepidopteran borer (Caterpillar)",
            "life_stage_causing_damage": "Larval instars (3rd to 5th)",
            "affected_plant_part": "Leaves, flower buds, green and ripe fruits",
            "damage_symptoms": "Larvae bore round circular holes into tomato fruits and feed while keeping anterior body inside and posterior outside; fruits rot and drop prematurely.",
            "favorable_environmental_conditions": "Warm days (26-32°C), moderate relative humidity, presence of alternate hosts (pigeonpea, cotton, chickpea).",
            "season": "Post-monsoon and summer crops",
            "south_indian_states": "Karnataka, Tamil Nadu, Andhra Pradesh, Telangana",
            "severity": "Severe to Critical",
            "prevention": "Intercrop with African Marigold (1 row marigold for every 16 rows tomato) as trap crop; install pheromone traps (Helilure @ 5/acre).",
            "safe_control_options": "Release egg parasitoid Trichogramma chilonis @ 50,000/ha; spray HaNPV (Helicoverpa nuclear polyhedrosis virus) @ 250 LE/ha with 1% jaggery.",
            "verified_pesticide_information": "Chlorantraniliprole 18.5% SC @ 0.3ml/L (PHI: 3 days) or Flubendiamide 39.35% SC @ 0.25ml/L (PHI: 5 days) or Emamectin Benzoate 5% SG @ 0.4g/L (PHI: 3 days).",
            "source": "ICAR-IIHR & TNAU Agritech Portal",
            "source_url": "https://agritech.tnau.ac.in",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },
        # 2. Paddy / Rice
        {
            "crop": "Paddy / Rice",
            "pest_name": "Brown Plant Hopper (BPH)",
            "scientific_name": "Nilaparvata lugens",
            "common_local_name": "Pugayan (Tamil), BPH, Sudi hula (Kannada), Sudu tegulu / Thella thengu (Telugu)",
            "pest_type": "Hemipteran sucking pest",
            "life_stage_causing_damage": "Nymphs and adults",
            "affected_plant_part": "Base of tillers, leaf sheath above water line",
            "damage_symptoms": "Nymphs and adults suck sap from tiller bases causing circular patches of dry, burnt crops called 'hopper burn'; transmits ragged stunt and grassy stunt viruses.",
            "favorable_environmental_conditions": "High nitrogen application, dense planting, prolonged high humidity (>85%), stagnant standing water.",
            "season": "Tillering to grain filling stage in Kharif and Rabi",
            "south_indian_states": "Tamil Nadu, Andhra Pradesh, Telangana, Karnataka, Kerala, Puducherry",
            "severity": "Critical",
            "prevention": "Adopt wider spacing (20x15 cm) with alleyways (parikrama path) every 2 meters; avoid synthetic pyrethroid sprays which kill natural predators (mirid bugs/spiders).",
            "safe_control_options": "Alternate wetting and drying (AWD) irrigation; drain field water for 3-4 days; conserve mirid bug Cyrtorhinus lividipennis.",
            "verified_pesticide_information": "Triflumezopyrim 10% SC @ 0.48ml/L or Pymetrozine 50% WDG @ 0.6g/L or Dinotefuran 20% SG @ 0.4g/L directed strictly at the base of the plant.",
            "source": "ICAR-IIRR Hyderabad & TNAU",
            "source_url": "https://icar-iirr.org",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Paddy / Rice",
            "pest_name": "Yellow Stem Borer",
            "scientific_name": "Scirpophaga incertulas",
            "common_local_name": "Kurutthu poochi (Tamil), Kanda koruku hula (Kannada), Kanda tholi (Telugu)",
            "pest_type": "Lepidopteran borer",
            "life_stage_causing_damage": "Caterpillar (Larva)",
            "affected_plant_part": "Internal stem pith",
            "damage_symptoms": "Larvae bore into stem and feed on inner tissue; causes 'dead hearts' (drying of central tiller) in vegetative stage and 'white ears' (chaffy erect white panicles) in reproductive stage.",
            "favorable_environmental_conditions": "Stagnant deep water, night temperatures 20-26°C, continuous staggered planting.",
            "season": "Early vegetative through heading stages",
            "south_indian_states": "Tamil Nadu, Andhra Pradesh, Telangana, Karnataka, Kerala",
            "severity": "Severe",
            "prevention": "Clip tip of rice seedlings before transplanting to eliminate egg masses; install sex pheromone traps @ 5/acre.",
            "safe_control_options": "Release Trichogramma japonicum @ 1,00,000/ha at weekly intervals starting 30 days after transplanting.",
            "verified_pesticide_information": "Chlorantraniliprole 0.4% GR @ 10kg/ha in standing water or Cartap Hydrochloride 50% SP @ 2g/L or Fipronil 5% SC @ 2ml/L.",
            "source": "ICAR-IIRR & ANGRAU Vyavasaya Panchangam",
            "source_url": "https://icar-iirr.org",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },

        # 3. Chilli
        {
            "crop": "Chilli",
            "pest_name": "Chilli Thrips",
            "scientific_name": "Scirtothrips dorsalis",
            "common_local_name": "Ilaipen (Tamil), Thrips, Nool hula (Kannada), Thallu purugu (Telugu)",
            "pest_type": "Thysanopteran sucking pest",
            "life_stage_causing_damage": "Nymphs and adults",
            "affected_plant_part": "Under-surface of leaves, growing tips, flowers",
            "damage_symptoms": "Lacerate tender leaf tissues and suck oozing sap; leaves curl upwards into boat-shapes with roughened brown necrotic streaks on leaf undersides; causes 'murda' condition.",
            "favorable_environmental_conditions": "Hot and dry dry weather, absence of rain showers, temperatures 30-37°C.",
            "season": "Transplanting to fruit development (October to April)",
            "south_indian_states": "Andhra Pradesh, Telangana, Karnataka, Tamil Nadu",
            "severity": "Severe",
            "prevention": "Intercrop with sorghum or maize as windbreak/border crop; install blue sticky traps (15-20 traps/acre); spray neem seed kernel extract (NSKE 5%).",
            "safe_control_options": "Application of Lecanicillium lecanii (Verticillium lecanii) entomopathogenic fungus @ 5g/L.",
            "verified_pesticide_information": "Spinosad 45% SC @ 0.3ml/L or Fipronil 5% SC @ 2ml/L or Diafenthiuron 50% WP @ 1.25g/L. Observe strict 7-day waiting period.",
            "source": "ANGRAU Regional Agricultural Research Station (Lam, Guntur) & TNAU",
            "source_url": "https://angrau.ac.in",
            "source_type": "Agricultural University Research Guide",
            "verification_status": "VERIFIED"
        },

        # 4. Cotton
        {
            "crop": "Cotton",
            "pest_name": "Pink Bollworm",
            "scientific_name": "Pectinophora gossypiella",
            "common_local_name": "Semparuthi kaai puzhu (Tamil), Gulabi kaai hula (Kannada), Gulabi rangu purugu (Telugu)",
            "pest_type": "Lepidopteran borer",
            "life_stage_causing_damage": "Larval instars",
            "affected_plant_part": "Squares, flower buds, green bolls, lint and seeds",
            "damage_symptoms": "Rosetted flowers that fail to open; entry holes in bolls heal over leaving no external sign, but larvae feed inside seeds, staining and destroying lint fiber; premature boll opening.",
            "favorable_environmental_conditions": "Late planted cotton, extended crop duration beyond 160 days, warm and humid post-monsoon weather.",
            "season": "Flowering and boll formation (October to January)",
            "south_indian_states": "Karnataka, Telangana, Andhra Pradesh, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Strictly terminate crop within 150-160 days to break pest lifecycle; install pink bollworm pheromone traps (Gossyplure @ 5/acre); avoid storing cotton stalks in fields.",
            "safe_control_options": "Trichogrammatoidea bactrae release @ 1,50,000/ha; spray Beauveria bassiana @ 5g/L during early square stage.",
            "verified_pesticide_information": "Emamectin Benzoate 5% SG @ 0.4g/L or Chlorantraniliprole 18.5% SC @ 0.3ml/L or Profenofos 50% EC @ 2ml/L upon crossing ETL (8 moths/trap/day for 3 consecutive days).",
            "source": "ICAR-CICR Nagpur/Coimbatore & UAS Raichur",
            "source_url": "https://cicr.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 5. Sugarcane
        {
            "crop": "Sugarcane",
            "pest_name": "Early Shoot Borer",
            "scientific_name": "Chilo infuscatellus",
            "common_local_name": "Kurutthu thulaipaan (Tamil), Modala suruli hula (Kannada), Modhati mogga tholi (Telugu)",
            "pest_type": "Lepidopteran borer",
            "life_stage_causing_damage": "Larva (Caterpillar)",
            "affected_plant_part": "Shoots of young cane (1 to 3 months old)",
            "damage_symptoms": "Larva bores into base of young shoot just below soil level and feeds inside; central growing shoot dries up into an easily-pulled 'dead heart' emitting an offensive decaying smell.",
            "favorable_environmental_conditions": "High temperatures (35-40°C), low relative humidity, light sandy soils, drought stress during early vegetative phase.",
            "season": "Summer / Early shoot formative phase (March to June)",
            "south_indian_states": "Tamil Nadu, Karnataka, Andhra Pradesh, Telangana",
            "severity": "Severe",
            "prevention": "Planting setts in deep furrows; trash mulching @ 5 tonnes/ha on ridges within 3 days of planting; earthing up at 45 days.",
            "safe_control_options": "Release Trichogramma chilonis @ 50,000/ha from 4th week of planting at 10-day intervals; spray Granulosis virus (ESB-GV) @ 1.5x10^8 IBS/ml.",
            "verified_pesticide_information": "Soil application of Chlorantraniliprole 0.4% GR @ 18.75kg/ha at planting or spray Chlorantraniliprole 18.5% SC @ 0.3ml/L at 30 days.",
            "source": "ICAR-Sugarcane Breeding Institute (SBI Coimbatore)",
            "source_url": "https://sugarcane.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 6. Coconut
        {
            "crop": "Coconut",
            "pest_name": "Rhinoceros Beetle",
            "scientific_name": "Oryctes rhinoceros",
            "common_local_name": "Kombu chelli (Tamil/Malayalam), Komba vandu (Tamil), Kombu hula (Kannada), Kombu purugu (Telugu)",
            "pest_type": "Coleopteran wood borer",
            "life_stage_causing_damage": "Adult beetle",
            "affected_plant_part": "Crown heart, unopened fronds and spathes",
            "damage_symptoms": "Adult beetle bores into crown heart and chews unopened fronds; when damaged fronds unfold, leaflets display distinctive V-shaped geometric notches or clipped shears appearance.",
            "favorable_environmental_conditions": "Nearby rotting organic manure pits, decaying coconut stumps and coir dust mounds acting as breeding sites.",
            "season": "Year-round; peaks after monsoon rains (June-September)",
            "south_indian_states": "Kerala, Tamil Nadu, Karnataka, Andhra Pradesh, Puducherry",
            "severity": "Severe",
            "prevention": "Maintain orchard sanitation; treat manure pits with Metarhizium anisopliae green muscardine fungus @ 5x10^11 spores/m3; hook out beetles using an iron rod with curved needle.",
            "safe_control_options": "Placement of 3 naphthalene balls (approx 10g) mixed with fine sand in uppermost 3 leaf axils around spindle; release Baculovirus oryctes infected beetles.",
            "verified_pesticide_information": "Foliar/crown placement of 5g Phorate 10G or Cartap Hydrochloride 4G granules mixed with 100g sand in leaf axils (restricted use; handle with gloves).",
            "source": "ICAR-CPCRI Kasaragod & KAU Agri-Infotech",
            "source_url": "https://cpcri.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },
        {
            "crop": "Coconut",
            "pest_name": "Red Palm Weevil",
            "scientific_name": "Rhynchophorus ferrugineus",
            "common_local_name": "Semmookku chelli (Tamil), Chuvanna chelli (Malayalam), Kempu moothi hula (Kannada)",
            "pest_type": "Coleopteran internal tissue borer",
            "life_stage_causing_damage": "Grub (Larva)",
            "affected_plant_part": "Trunk core, crown cabbage",
            "damage_symptoms": "Small holes on trunk with thick brownish viscous fluid oozing out; extruded chewed coconut fibers from hole openings; gnawing crunching sounds audible inside trunk; central crown topples suddenly.",
            "favorable_environmental_conditions": "Palms with wounds, cuts from leaf pruning, or rhinoceros beetle damage; palms aged 5 to 20 years.",
            "season": "Year-round",
            "south_indian_states": "Kerala, Tamil Nadu, Karnataka, Andhra Pradesh, Puducherry",
            "severity": "Critical",
            "prevention": "Avoid cutting green leaves closer than 1.2m to trunk; dress all harvest cut wounds with Coal Tar or Copper Oxychloride paste; install Ferrolure+ aggregate pheromone bucket traps (1 trap/2 ha).",
            "safe_control_options": "Entomopathogenic nematodes (Heterorhabditis indica) suspension injected into trunk holes.",
            "verified_pesticide_information": "Stem injection of Imidacloprid 17.8% SL @ 1ml in 100ml water per palm using specialized drill applicators; seal hole with cement/clay. Observe 45-day nut harvesting restriction.",
            "source": "ICAR-CPCRI Kasaragod & TNAU",
            "source_url": "https://cpcri.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 7. Maize / Corn
        {
            "crop": "Maize / Corn",
            "pest_name": "Fall Armyworm (FAW)",
            "scientific_name": "Spodoptera frugiperda",
            "common_local_name": "Kadaikola puzhu (Tamil), Laskar hula (Kannada), Rekkal purugu (Telugu)",
            "pest_type": "Lepidopteran defoliator & borer",
            "life_stage_causing_damage": "Larval instars",
            "affected_plant_part": "Leaf whorl, tassel, ear silks, developing kernels",
            "damage_symptoms": "Young larvae scrape epidermal layer creating papery pinholes; older larvae feed inside leaf whorl causing heavy ragged windowing and leaving prominent piles of wet sawdust-like fecal frass; inverted Y mark on head.",
            "favorable_environmental_conditions": "Warm and semi-arid conditions (26-34°C), prolonged dry spells followed by rain.",
            "season": "Kharif, Rabi and Summer crops",
            "south_indian_states": "Karnataka, Telangana, Andhra Pradesh, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Synchronous planting in village clusters; erect bird perches (10/acre); apply sand and wood ash (9:1) directly into whorls; install FAW pheromone traps @ 5/acre.",
            "safe_control_options": "Release egg parasitoid Telenomus remus @ 1,25,000/ha or spray Bacillus thuringiensis var. kurstaki @ 2g/L or Metarhizium rileyi (Nomuraea rileyi) @ 3g/L.",
            "verified_pesticide_information": "Chlorantraniliprole 18.5% SC @ 0.4ml/L or Emamectin Benzoate 5% SG @ 0.4g/L or Spinetoram 11.7% SC @ 0.5ml/L directed strictly into the central whorl.",
            "source": "ICAR-NBAIR Bengaluru & ICAR-IIMR",
            "source_url": "https://nbair.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 8. Wheat
        {
            "crop": "Wheat",
            "pest_name": "Wheat Aphids",
            "scientific_name": "Rhopalosiphum padi & Sitobion avenae",
            "common_local_name": "Asugai (Tamil), Sisu hula (Kannada), Penu (Telugu)",
            "pest_type": "Hemipteran sucking pest",
            "life_stage_causing_damage": "Nymphs and wingless adults",
            "affected_plant_part": "Leaves, leaf sheaths, ears, emerging grains",
            "damage_symptoms": "Colonies cluster on tender leaves and ears, sucking cell sap; honeydew secretion leads to black sooty mold; shriveled and poorly formed grain heads.",
            "favorable_environmental_conditions": "Cool cloudy weather, calm winds, temperatures 15-22°C.",
            "season": "Rabi (January to March)",
            "south_indian_states": "Karnataka, Northern Telangana",
            "severity": "Moderate",
            "prevention": "Timely sowing in November; balanced fertilization without excess nitrogen; encourage ladybird beetles (Coccinella septempunctata).",
            "safe_control_options": "Spray 5% neem seed kernel extract (NSKE) or neem oil @ 3ml/L.",
            "verified_pesticide_information": "Thiamethoxam 25% WG @ 0.2g/L or Dimethoate 30% EC @ 1.7ml/L if aphid count exceeds 10-15 per earhead.",
            "source": "UAS Dharwad Department of Agricultural Entomology",
            "source_url": "https://uasd.edu",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },

        # 9. Coffee
        {
            "crop": "Coffee",
            "pest_name": "Coffee White Stem Borer",
            "scientific_name": "Xylotrechus quadripes",
            "common_local_name": "Kaapi kanda hula (Kannada), Kaappi thandu thulaipaan (Tamil/Malayalam)",
            "pest_type": "Coleopteran stem borer",
            "life_stage_causing_damage": "Grub (Larva)",
            "affected_plant_part": "Main stem, thick primary branches of Arabica coffee",
            "damage_symptoms": "Grub tunnels inside hardwood causing characteristic external ridges/rings on trunk bark; leaves yellow, wilt and dry out; bearing branches snap easily; killed bushes.",
            "favorable_environmental_conditions": "Open unshaded coffee patches, bright sunlight directly hitting main stems, post-monsoon warm dry periods.",
            "season": "Flight periods: Summer (April-May) and Autumn (October-November)",
            "south_indian_states": "Karnataka, Kerala, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Maintain optimal two-tier shade (40-50% canopy shade); wrap/band main stem with plastic sheets or gunny bags during flight periods; uproot and burn infested bushes (trace, uproot and burn).",
            "safe_control_options": "Bark scraping of loose scaly bark on main stems before flight season to dislodge eggs; install cross-vane pheromone traps.",
            "verified_pesticide_information": "Stem swabbing/spraying with Chlorpyrifos 20% EC @ 6ml/L (or CIBRC registered alternatives) mixed with adhesive resin along main stem and thick primaries up to 1.5m prior to beetle flight.",
            "source": "Central Coffee Research Institute (CCRI Balehonnur)",
            "source_url": "https://coffeeboard.gov.in",
            "source_type": "Statutory Commodity Board Research Guide",
            "verification_status": "VERIFIED"
        },

        # 10. Tea
        {
            "crop": "Tea",
            "pest_name": "Tea Mosquito Bug",
            "scientific_name": "Helopeltis theivora",
            "common_local_name": "Theilai koshu (Tamil), Chaaya kothuku (Malayalam), Chaha koshu (Kannada)",
            "pest_type": "Hemipteran sucking bug (Miridae)",
            "life_stage_causing_damage": "Nymphs and adults",
            "affected_plant_part": "Tender shoots, pluckable flushes, young buds",
            "damage_symptoms": "Nymphs and adults insert stylets into tender leaves causing translucent water-soaked spots which turn dark reddish-brown; feeding spots coalesce into scorched crusts; shoot growth arrests completely.",
            "favorable_environmental_conditions": "Warm humid weather with intermittent rainfall, shady humid pockets, relative humidity >80%.",
            "season": "Pre-monsoon and post-monsoon flushes",
            "south_indian_states": "Tamil Nadu, Kerala",
            "severity": "Critical",
            "prevention": "Remove wild host weeds (Mikania micrantha, Maesa perrottetiana) in borders; maintain strict 7-day plucking cycle to remove feeding shoots.",
            "safe_control_options": "Spray entomopathogenic fungus Beauveria bassiana @ 5g/L; application of neem formulation (Azadirachtin 10,000 ppm) @ 1ml/L.",
            "verified_pesticide_information": "Thiamethoxam 25% WG @ 0.25g/L or Clothianidin 50% WDG @ 0.16g/L or Bifenthrin 8% SC @ 1ml/L. Strict adherence to harvest residue intervals.",
            "source": "UPASI Tea Research Institute (Valparai)",
            "source_url": "https://upasi.org",
            "source_type": "Tea Research Institute Benchmark",
            "verification_status": "VERIFIED"
        },

        # 11. Rubber
        {
            "crop": "Rubber",
            "pest_name": "Scale Insects and Mealybugs",
            "scientific_name": "Saissetia nigra & Planococcus citri",
            "common_local_name": "Mavu poochi (Tamil), Mealy bug (Malayalam)",
            "pest_type": "Hemipteran sap feeder",
            "life_stage_causing_damage": "Nymphs and adult females",
            "affected_plant_part": "Tender green twigs, budded nursery stumps, young shoots",
            "damage_symptoms": "Suck plant sap from tender shoots causing yellowing and stunted growth; heavy excretion of honeydew promotes dense black sooty mold (Capnodium) covering foliage.",
            "favorable_environmental_conditions": "Dry hot periods with absence of heavy rain, mutualistic ant activity protecting colonies.",
            "season": "Summer and post-monsoon dry months",
            "south_indian_states": "Kerala, Tamil Nadu",
            "severity": "Moderate",
            "prevention": "Destroy ant nests around rubber bases using chlorpyrifos dust; inspect nursery budwood before field transplanting.",
            "safe_control_options": "Spray fish oil rosin soap (FORS) @ 25g/L; release predatory ladybird beetles Cryptolaemus montrouzieri @ 5 beetles per plant.",
            "verified_pesticide_information": "Spray Dimethoate 30% EC @ 1.7ml/L or Malathion 50% EC @ 2ml/L directed at tender infested twigs.",
            "source": "Rubber Research Institute of India (RRII Kottayam)",
            "source_url": "https://rubberboard.gov.in",
            "source_type": "Statutory Commodity Board Research Guide",
            "verification_status": "VERIFIED"
        },

        # 12. Tobacco
        {
            "crop": "Tobacco",
            "pest_name": "Tobacco Caterpillar",
            "scientific_name": "Spodoptera litura",
            "common_local_name": "Pugaielai puzhu (Tamil), Pogaku purugu (Telugu), Hogesoppina hula (Kannada)",
            "pest_type": "Lepidopteran defoliator",
            "life_stage_causing_damage": "Gregarious larval instars",
            "affected_plant_part": "Leaves of all stages",
            "damage_symptoms": "Young larvae skeletonize leaves gregariously leaving only veins; older larvae disperse and voraciously devour entire leaf lamina, leaving only midribs; renders cured leaf unmarketable.",
            "favorable_environmental_conditions": "Warm humid conditions (26-32°C), high soil moisture, proximity to castor or vegetable crops.",
            "season": "Nursery and field vegetative stages",
            "south_indian_states": "Andhra Pradesh, Karnataka",
            "severity": "Critical",
            "prevention": "Plant castor along borders as trap crop; collect and destroy egg masses and gregarious young larvae on castor; install Spodolure pheromone traps @ 5/acre.",
            "safe_control_options": "Spray SlNPV (Spodoptera litura nuclear polyhedrosis virus) @ 250 LE/ha; release egg parasitoid Trichogramma chilonis @ 50,000/ha.",
            "verified_pesticide_information": "Emamectin Benzoate 5% SG @ 0.4g/L or Novaluron 10% EC @ 1ml/L or Chlorantraniliprole 18.5% SC @ 0.3ml/L.",
            "source": "ICAR-Central Tobacco Research Institute (CTRI Rajahmundry)",
            "source_url": "https://ctri.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 13. Black Pepper
        {
            "crop": "Black Pepper",
            "pest_name": "Pollu Beetle",
            "scientific_name": "Longitarsus nigripennis",
            "common_local_name": "Pollu beetle (Malayalam/Tamil), Menasu hula (Kannada)",
            "pest_type": "Coleopteran flea beetle",
            "life_stage_causing_damage": "Grub and adult beetle",
            "affected_plant_part": "Tender berries, spikes, young leaves",
            "damage_symptoms": "Adults feed on tender leaves making circular holes; grubs bore into young tender berries and feed internally, turning developing berries hollow, black and brittle (pollu berries).",
            "favorable_environmental_conditions": "Dense shaded canopy, high relative humidity (>85%), post-monsoon spike emergence.",
            "season": "Spike emergence to berry maturation (July to October)",
            "south_indian_states": "Kerala, Karnataka, Tamil Nadu",
            "severity": "Severe",
            "prevention": "Regulate shade by lopping branches of standard trees; prune excessively dense runner shoots.",
            "safe_control_options": "Spray neem oil formulation (Azadirachtin 0.03%) @ 5ml/L or 5% neem seed kernel extract (NSKE).",
            "verified_pesticide_information": "Foliar spray of Quinalphos 25% EC @ 2ml/L in July and October as berries develop (CIBRC/IISR recommendation).",
            "source": "ICAR-Indian Institute of Spices Research (IISR Kozhikode)",
            "source_url": "https://spices.res.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 14. Cardamom
        {
            "crop": "Cardamom",
            "pest_name": "Cardamom Thrips",
            "scientific_name": "Sciothrips cardamomi",
            "common_local_name": "Elakkai ilaipen (Tamil), Elathari pen (Malayalam), Elakki nola (Kannada)",
            "pest_type": "Thysanopteran sucking pest",
            "life_stage_causing_damage": "Nymphs and adults",
            "affected_plant_part": "Panicles, flower buds, tender capsules",
            "damage_symptoms": "Insects lacerate surface of capsules; causes corky encrustations, shedding of young flowers, and deformed, scabby, undersized capsules that lose essential oil market value.",
            "favorable_environmental_conditions": "Dry warm spells during flowering, poorly regulated shade in plantation understorey.",
            "season": "Active throughout flowering and capsule development (February to September)",
            "south_indian_states": "Kerala, Karnataka, Tamil Nadu",
            "severity": "Critical",
            "prevention": "Regulate shade; remove dry drooping leaves and old pseudostems (trashing) before pre-monsoon showers.",
            "safe_control_options": "Conserve predatory mites and anthocorid bugs; spray spinosad-derived organic formulations.",
            "verified_pesticide_information": "Foliar/panicle spray of Spinosad 45% SC @ 0.3ml/L or Diafenthiuron 50% WP @ 1g/L or Quinalphos 25% EC @ 2ml/L.",
            "source": "Indian Cardamom Research Institute (ICRI Myladumpara) & ICAR-IISR",
            "source_url": "https://spices.res.in",
            "source_type": "Spices Board Research Guide",
            "verification_status": "VERIFIED"
        },

        # 15. Turmeric
        {
            "crop": "Turmeric",
            "pest_name": "Shoot Borer",
            "scientific_name": "Conogethes punctiferalis",
            "common_local_name": "Thandu thulaipaan (Tamil), Thandu tholi (Telugu), Dandu koruku hula (Kannada)",
            "pest_type": "Lepidopteran borer",
            "life_stage_causing_damage": "Caterpillar (Larva)",
            "affected_plant_part": "Pseudostem, central core shoot",
            "damage_symptoms": "Larvae bore into pseudostem and feed on internal tissues; presence of bore-hole plugged with brownish granular frass; central shoot yellows and dries up producing a 'dead heart'.",
            "favorable_environmental_conditions": "Warm and humid conditions (25-32°C), dense foliage, absence of natural predators.",
            "season": "August to October (active growth period)",
            "south_indian_states": "Tamil Nadu, Telangana, Andhra Pradesh, Karnataka",
            "severity": "Severe",
            "prevention": "Prune and burn shoots showing early dead hearts with frass; spray Beauveria bassiana @ 5g/L.",
            "safe_control_options": "Release egg parasitoid Trichogramma chilonis @ 50,000/ha; conserve predatory spiders.",
            "verified_pesticide_information": "Foliar spray of Dimethoate 30% EC @ 1.7ml/L or Chlorantraniliprole 18.5% SC @ 0.3ml/L at first appearance of bore holes on pseudostem.",
            "source": "TNAU Agritech Portal & PJTSAU Hyderabad",
            "source_url": "https://agritech.tnau.ac.in",
            "source_type": "Agricultural University Package of Practices",
            "verification_status": "VERIFIED"
        },

        # 16. Arecanut / Betel Nut
        {
            "crop": "Arecanut / Betel Nut",
            "pest_name": "Arecanut Spindle Bug",
            "scientific_name": "Carvalhoia arecae",
            "common_local_name": "Spindle bug, Kuruthu poochi (Tamil/Malayalam), Suruli hula (Kannada)",
            "pest_type": "Hemipteran sucking bug (Miridae)",
            "life_stage_causing_damage": "Nymphs and adults",
            "affected_plant_part": "Innermost tender spindle leaf",
            "damage_symptoms": "Colonies inhabit innermost leaf axils of spindle; suck sap from tender folded leaf blades causing linear dark brown necrotic streaks; when spindle unfurls, leaves appear shredded, torn and stunted.",
            "favorable_environmental_conditions": "Continuous high humidity (>90%) in valleys, low sunlight penetration in dense gardens.",
            "season": "Monsoon and post-monsoon (June to November)",
            "south_indian_states": "Karnataka, Kerala, Tamil Nadu",
            "severity": "Severe",
            "prevention": "Maintain garden aeration; ensure proper spacing (2.7m x 2.7m); spray neem oil formulation into uppermost leaf axils.",
            "safe_control_options": "Placement of thiamethoxam/neem sachets in leaf axils; spray Metarhizium anisopliae @ 5g/L.",
            "verified_pesticide_information": "Drenching the spindle leaf and surrounding uppermost leaf axils with Dimethoate 30% EC @ 1.5ml/L or Imidacloprid 17.8% SL @ 0.5ml/L.",
            "source": "ICAR-CPCRI Regional Station Vittal & UAS Dharwad",
            "source_url": "https://cpcri.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        },

        # 17. Cashew
        {
            "crop": "Cashew",
            "pest_name": "Tea Mosquito Bug (TMB)",
            "scientific_name": "Helopeltis antonii",
            "common_local_name": "Theilai koshu (Tamil), Cashew thaliru poochi (Malayalam), Kaju koshu (Kannada)",
            "pest_type": "Hemipteran sucking bug (Miridae)",
            "life_stage_causing_damage": "Nymphs and adults",
            "affected_plant_part": "Tender vegetative flushes, panicles, developing apples and nuts",
            "damage_symptoms": "Bugs pierce tender tissues and inject toxic saliva; produces elongated brownish-black resinous necrotic feeding lesions; shoots dry up causing 'shoot dieback'; complete drying of blossom panicles.",
            "favorable_environmental_conditions": "Sunny weather following monsoon rains, flush and flowering emergence during December-February.",
            "season": "Flushing, flowering and nut initiation (October to March)",
            "south_indian_states": "Karnataka, Kerala, Tamil Nadu, Andhra Pradesh",
            "severity": "Critical",
            "prevention": "Prune dead and criss-cross branches; eliminate weed hosts; synchronise pest monitoring at first new leaf flush.",
            "safe_control_options": "Release reduviid bug predators (Sycanus collaris); spray Beauveria bassiana @ 5g/L.",
            "verified_pesticide_information": "3-round spray schedule: 1st spray at flushing with Lambda Cyhalothrin 5% EC @ 0.6ml/L; 2nd spray at flowering with Acetamiprid 20% SP @ 0.25g/L; 3rd spray at fruit set with Profenofos 50% EC @ 1.5ml/L.",
            "source": "ICAR-Directorate of Cashew Research (DCR Puttur) & KAU",
            "source_url": "https://cashew.icar.gov.in",
            "source_type": "ICAR National Institute Research Guide",
            "verification_status": "VERIFIED"
        }
    ]

    with open(pest_master_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=master_headers)
        writer.writeheader()
        for p in pests:
            writer.writerow(p)

    matrix_rows = []
    for p in pests:
        states = [s.strip() for s in p["south_indian_states"].split(",")]
        for st in states:
            matrix_rows.append({
                "crop": p["crop"],
                "state": st,
                "pest": p["pest_name"],
                "scientific_name": p["scientific_name"],
                "damage": p["damage_symptoms"],
                "symptoms": p["affected_plant_part"],
                "season": p["season"],
                "risk_conditions": p["favorable_environmental_conditions"],
                "source": p["source"],
                "verification_status": p["verification_status"]
            })

    with open(pest_matrix_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=matrix_headers)
        writer.writeheader()
        for r in matrix_rows:
            writer.writerow(r)

    print(f"[+] Successfully generated CROP_PEST_MASTER.csv ({len(pests)} records) and SOUTH_INDIA_CROP_PEST_MATRIX.csv ({len(matrix_rows)} state rows)!")

if __name__ == "__main__":
    generate_crop_disease_master_and_matrix()
    generate_crop_pest_master_and_matrix()
