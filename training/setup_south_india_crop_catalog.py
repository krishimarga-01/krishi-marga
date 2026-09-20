import os
import json
from PIL import Image, ImageDraw, ImageFont

# Complete 76 South Indian Agricultural Crops Master Specification
SOUTH_INDIA_CROPS = [
    # ----------------------------------------------------
    # 1. FOOD GRAINS / CEREALS & MILLETS (11)
    # ----------------------------------------------------
    {
        "id": "paddy", "nameKey": "crop.paddy", "rawName": "Paddy", "category": "cereal",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": True, "nutrientModelAvailable": True,
        "keywords": ["paddy", "rice", "oryza", "dhan", "chawal", "nel", "arisi", "bhatta", "akki", "vari", "vadlu", "nellu"],
        "names": {
            "en": "Paddy / Rice", "kn": "ಭತ್ತ (Paddy / Rice)", "ta": "நெல் / அரிசி (Paddy / Rice)",
            "te": "వరి (Paddy / Rice)", "ml": "നെല്ല് (Paddy / Rice)", "hi": "धान / चावल (Paddy / Rice)"
        },
        "color": (212, 175, 55)
    },
    {
        "id": "maize", "nameKey": "crop.maize", "rawName": "Maize", "category": "cereal",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": True, "nutrientModelAvailable": True,
        "keywords": ["maize", "corn", "zea mays", "makka", "bhutta", "makkacholam", "mekkejola", "musukinajola", "mokkajonna"],
        "names": {
            "en": "Maize / Corn", "kn": "ಮೆಕ್ಕೆಜೋಳ (Maize / Corn)", "ta": "மக்காச்சோளம் (Maize / Corn)",
            "te": "మొక్కజొన్న (Maize / Corn)", "ml": "മക്കച്ചോളം (Maize / Corn)", "hi": "मक्का (Maize / Corn)"
        },
        "color": (244, 196, 48)
    },
    {
        "id": "ragi", "nameKey": "crop.ragi", "rawName": "Ragi", "category": "cereal",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["ragi", "finger millet", "eleusine coracana", "kezhvaragu", "keppai", "ragulu", "mandia"],
        "names": {
            "en": "Ragi / Finger Millet", "kn": "ರಾಗಿ (Finger Millet)", "ta": "கேழ்வரகு / ராகி (Finger Millet)",
            "te": "రాగులు (Finger Millet)", "ml": "റാഗി / കൂവരക് (Finger Millet)", "hi": "रागी / मडुआ (Finger Millet)"
        },
        "color": (160, 82, 45)
    },
    {
        "id": "sorghum", "nameKey": "crop.sorghum", "rawName": "Sorghum", "category": "cereal",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["sorghum", "jowar", "sorghum bicolor", "cholam", "jola", "bili jola", "jonna"],
        "names": {
            "en": "Sorghum / Jowar", "kn": "ಜೋಳ (Sorghum / Jowar)", "ta": "சோளம் (Sorghum / Jowar)",
            "te": "జొన్నలు (Sorghum / Jowar)", "ml": "ചോളം (Sorghum / Jowar)", "hi": "ज्वार (Sorghum / Jowar)"
        },
        "color": (218, 165, 32)
    },
    {
        "id": "pearl_millet", "nameKey": "crop.pearlMillet", "rawName": "Pearl Millet", "category": "cereal",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["pearl millet", "bajra", "pennisetum glaucum", "kambu", "sajje", "sajjalu"],
        "names": {
            "en": "Pearl Millet / Bajra", "kn": "ಸಜ್ಜೆ (Bajra / Pearl Millet)", "ta": "கம்பு (Bajra / Pearl Millet)",
            "te": "సజ్జలు (Bajra / Pearl Millet)", "ml": "കമ്പം (Pearl Millet)", "hi": "बाजरा (Pearl Millet)"
        },
        "color": (189, 183, 107)
    },
    {
        "id": "foxtail_millet", "nameKey": "crop.foxtailMillet", "rawName": "Foxtail Millet", "category": "cereal",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["foxtail millet", "setaria italica", "navane", "tenai", "korra", "kangni", "thina"],
        "names": {
            "en": "Foxtail Millet", "kn": "ನವಣೆ (Foxtail Millet)", "ta": "தினை (Foxtail Millet)",
            "te": "కొర్రలు (Foxtail Millet)", "ml": "തിന (Foxtail Millet)", "hi": "कंगनी (Foxtail Millet)"
        },
        "color": (205, 133, 63)
    },
    {
        "id": "little_millet", "nameKey": "crop.littleMillet", "rawName": "Little Millet", "category": "cereal",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["little millet", "panicum sumatrense", "same", "samai", "sama", "samalu", "kutki"],
        "names": {
            "en": "Little Millet", "kn": "ಸಾಮೆ (Little Millet)", "ta": "சாமை (Little Millet)",
            "te": "సామలు (Little Millet)", "ml": "ചാമ (Little Millet)", "hi": "कुटकी (Little Millet)"
        },
        "color": (210, 180, 140)
    },
    {
        "id": "kodo_millet", "nameKey": "crop.kodoMillet", "rawName": "Kodo Millet", "category": "cereal",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["kodo millet", "paspalum scrobiculatum", "harka", "varagu", "arikelu", "kodra"],
        "names": {
            "en": "Kodo Millet", "kn": "ಹಾರಕ (Kodo Millet)", "ta": "வரகு (Kodo Millet)",
            "te": "అరికెలు (Kodo Millet)", "ml": "വരക് (Kodo Millet)", "hi": "कोदो (Kodo Millet)"
        },
        "color": (165, 42, 42)
    },
    {
        "id": "barnyard_millet", "nameKey": "crop.barnyardMillet", "rawName": "Barnyard Millet", "category": "cereal",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["barnyard millet", "echinochloa frumentacea", "oodalu", "kuthiraivali", "udhalu", "oodalu", "sanwa"],
        "names": {
            "en": "Barnyard Millet", "kn": "ಊದಲು (Barnyard Millet)", "ta": "குதிரைவாலி (Barnyard Millet)",
            "te": "ఊదలు (Barnyard Millet)", "ml": "കുതിരവാലി (Barnyard Millet)", "hi": "सांवां (Barnyard Millet)"
        },
        "color": (188, 143, 143)
    },
    {
        "id": "proso_millet", "nameKey": "crop.prosoMillet", "rawName": "Proso Millet", "category": "cereal",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["proso millet", "panicum miliaceum", "baragu", "panivaragu", "variga", "chena"],
        "names": {
            "en": "Proso Millet", "kn": "ಬರಗು (Proso Millet)", "ta": "பனிவரகு (Proso Millet)",
            "te": "వరిగెలు (Proso Millet)", "ml": "പനിവരക് (Proso Millet)", "hi": "चीना (Proso Millet)"
        },
        "color": (222, 184, 135)
    },
    {
        "id": "wheat", "nameKey": "crop.wheat", "rawName": "Wheat", "category": "cereal",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["wheat", "triticum", "gehun", "godhi", "godhumai", "godhuma", "gothambu"],
        "names": {
            "en": "Wheat", "kn": "ಗೋಧಿ (Wheat)", "ta": "கோதுமை (Wheat)",
            "te": "గోధుమ (Wheat)", "ml": "ഗോതമ്പ് (Wheat)", "hi": "गेहूं (Wheat)"
        },
        "color": (238, 207, 110)
    },

    # ----------------------------------------------------
    # 2. PULSES (6)
    # ----------------------------------------------------
    {
        "id": "red_gram", "nameKey": "crop.redGram", "rawName": "Red Gram", "category": "pulse",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["red gram", "pigeon pea", "tur", "arhar", "cajanus cajan", "togari", "thuvaram", "kandi"],
        "names": {
            "en": "Red Gram / Pigeon Pea", "kn": "ತೊಗರಿ (Red Gram / Tur)", "ta": "துவரை (Red Gram / Pigeon Pea)",
            "te": "కందులు (Red Gram / Tur)", "ml": "തുവര (Red Gram)", "hi": "अरहर / तूर (Red Gram)"
        },
        "color": (205, 92, 92)
    },
    {
        "id": "black_gram", "nameKey": "crop.blackGram", "rawName": "Black Gram", "category": "pulse",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["black gram", "urad", "vigna mungo", "uddu", "ulundu", "minumulu", "uzhunnu"],
        "names": {
            "en": "Black Gram / Urad", "kn": "ಉದ್ದು (Black Gram / Urad)", "ta": "உளுந்து (Black Gram / Urad)",
            "te": "మినుములు (Black Gram / Urad)", "ml": "ഉഴുന്ന് (Black Gram)", "hi": "उड़द (Black Gram)"
        },
        "color": (47, 79, 79)
    },
    {
        "id": "green_gram", "nameKey": "crop.greenGram", "rawName": "Green Gram", "category": "pulse",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["green gram", "moong", "vigna radiata", "hesaru", "paasi payaru", "pesalu", "cherupayar"],
        "names": {
            "en": "Green Gram / Moong", "kn": "ಹೆಸರು ಕಾಳು (Green Gram / Moong)", "ta": "பாசிப்பயறு (Green Gram / Moong)",
            "te": "పెసలు (Green Gram / Moong)", "ml": "ചെറുപയർ (Green Gram)", "hi": "मूंग (Green Gram)"
        },
        "color": (85, 107, 47)
    },
    {
        "id": "bengal_gram", "nameKey": "crop.bengalGram", "rawName": "Bengal Gram", "category": "pulse",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["bengal gram", "chickpea", "chana", "cicer arietinum", "kadale", "konda kadalai", "senagalu", "kadala"],
        "names": {
            "en": "Bengal Gram / Chickpea", "kn": "ಕಡಲೆ (Bengal Gram / Chana)", "ta": "கொண்டைக்கடலை (Bengal Gram)",
            "te": "శనగలు (Bengal Gram / Chana)", "ml": "കടല (Bengal Gram)", "hi": "चना (Bengal Gram)"
        },
        "color": (210, 105, 30)
    },
    {
        "id": "cowpea", "nameKey": "crop.cowpea", "rawName": "Cowpea", "category": "pulse",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["cowpea", "lobia", "vigna unguiculata", "alasande", "karamani", "thatta payaru", "alasandalu", "payar"],
        "names": {
            "en": "Cowpea / Lobia", "kn": "ಅಲಸಂದೆ (Cowpea / Lobia)", "ta": "காராமணி / தட்டப்பயறு (Cowpea)",
            "te": "అలసందలు (Cowpea / Lobia)", "ml": "വൻപയർ (Cowpea)", "hi": "लोबिया (Cowpea)"
        },
        "color": (178, 34, 34)
    },
    {
        "id": "field_bean", "nameKey": "crop.fieldBean", "rawName": "Field Bean", "category": "pulse",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["field bean", "hyacinth bean", "avarekalu", "lablab purpureus", "mochai", "chikkudu", "amara"],
        "names": {
            "en": "Field Bean / Avarekalu", "kn": "ಅವರೆಕಾಳು (Field Bean / Avare)", "ta": "மொச்சை (Field Bean / Mochai)",
            "te": "చిక్కుడు (Field Bean / Chikkudu)", "ml": "അമരപ്പയർ (Field Bean)", "hi": "सेम फली (Field Bean)"
        },
        "color": (107, 142, 35)
    },

    # ----------------------------------------------------
    # 3. OILSEEDS (6)
    # ----------------------------------------------------
    {
        "id": "groundnut", "nameKey": "crop.groundnut", "rawName": "Groundnut", "category": "oilseed",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["groundnut", "peanut", "arachis hypogaea", "mungphali", "shenga", "kadalakkai", "verukadalai", "verusenaga"],
        "names": {
            "en": "Groundnut / Peanut", "kn": "ಕಡಲೆಕಾಯಿ / ಶೇಂಗಾ (Groundnut)", "ta": "வேர்க்கடலை / நிலக்கடலை (Groundnut)",
            "te": "వేరుశనగ (Groundnut / Peanut)", "ml": "നിലക്കടല (Groundnut)", "hi": "मूंगफली (Groundnut)"
        },
        "color": (218, 165, 32)
    },
    {
        "id": "sesame", "nameKey": "crop.sesame", "rawName": "Sesame", "category": "oilseed",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["sesame", "gingelly", "til", "sesamum indicum", "ellu", "nuvvulu"],
        "names": {
            "en": "Sesame / Gingelly", "kn": "ಎಳ್ಳು (Sesame / Til)", "ta": "எள்ளு (Sesame / Gingelly)",
            "te": "నువ్వులు (Sesame / Til)", "ml": "എള്ള് (Sesame)", "hi": "तिल (Sesame / Til)"
        },
        "color": (139, 69, 19)
    },
    {
        "id": "sunflower", "nameKey": "crop.sunflower", "rawName": "Sunflower", "category": "oilseed",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["sunflower", "helianthus annuus", "surajmukhi", "suryakanti", "sooriyaganthi", "proddutirugudu"],
        "names": {
            "en": "Sunflower", "kn": "ಸೂರ್ಯಕಾಂತಿ (Sunflower)", "ta": "சூரியகாந்தி (Sunflower)",
            "te": "పొద్దుతిరుగుడు (Sunflower)", "ml": "സൂര്യകാന്തി (Sunflower)", "hi": "सूरजमुखी (Sunflower)"
        },
        "color": (255, 215, 0)
    },
    {
        "id": "castor", "nameKey": "crop.castor", "rawName": "Castor", "category": "oilseed",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["castor", "ricinus communis", "arandi", "haralu", "aamanakku", "aamudamu", "aavanakku"],
        "names": {
            "en": "Castor", "kn": "ಹರಳು (Castor)", "ta": "ஆமணக்கு (Castor)",
            "te": "ఆముదం (Castor)", "ml": "ആവണക്ക് (Castor)", "hi": "अरंडी (Castor)"
        },
        "color": (128, 128, 0)
    },
    {
        "id": "safflower", "nameKey": "crop.safflower", "rawName": "Safflower", "category": "oilseed",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["safflower", "carthamus tinctorius", "kusube", "kardi", "kusum", "sendurakam", "kusumalu"],
        "names": {
            "en": "Safflower", "kn": "ಕುಸುಬೆ (Safflower)", "ta": "செந்தூshared / குசும்பை (Safflower)",
            "te": "కుసుమలు (Safflower)", "ml": "കുസുംബപ്പൂവ് (Safflower)", "hi": "कुसुम (Safflower)"
        },
        "color": (255, 140, 0)
    },
    {
        "id": "soybean", "nameKey": "crop.soybean", "rawName": "Soybean", "category": "oilseed",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["soybean", "soya", "glycine max", "soyachikkudu", "soya bean"],
        "names": {
            "en": "Soybean", "kn": "ಸೋಯಾಬೀನ್ (Soybean)", "ta": "சோயாபீன் (Soybean)",
            "te": "సోయాచిక్కుడు (Soybean)", "ml": "സോയാബീൻ (Soybean)", "hi": "सोयाबीन (Soybean)"
        },
        "color": (143, 188, 143)
    },

    # ----------------------------------------------------
    # 4. COMMERCIAL, FIBRE & INDUSTRIAL (3)
    # ----------------------------------------------------
    {
        "id": "cotton", "nameKey": "crop.cotton", "rawName": "Cotton", "category": "commercial",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": True, "nutrientModelAvailable": True,
        "keywords": ["cotton", "kapas", "gossypium", "hatti", "paruthi", "pratti", "panji"],
        "names": {
            "en": "Cotton", "kn": "ಹತ್ತಿ (Cotton)", "ta": "பருத்தி (Cotton)",
            "te": "ప్రత్తి (Cotton)", "ml": "പരുത്തി (Cotton)", "hi": "कपास (Cotton)"
        },
        "color": (245, 245, 245)
    },
    {
        "id": "sugarcane", "nameKey": "crop.sugarcane", "rawName": "Sugarcane", "category": "commercial",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["sugarcane", "saccharum", "ganna", "kabbu", "karumbu", "cheraku", "karimbu"],
        "names": {
            "en": "Sugarcane", "kn": "ಕಬ್ಬು (Sugarcane)", "ta": "கரும்பு (Sugarcane)",
            "te": "చెరకు (Sugarcane)", "ml": "കരിമ്പ് (Sugarcane)", "hi": "गन्ना (Sugarcane)"
        },
        "color": (46, 139, 87)
    },
    {
        "id": "tobacco", "nameKey": "crop.tobacco", "rawName": "Tobacco", "category": "commercial",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["tobacco", "nicotiana", "tambaku", "hogesoppu", "pugaielai", "pogaku", "pukayila"],
        "names": {
            "en": "Tobacco", "kn": "ತಂಬಾಕು / ಹೊಗೆಸೊಪ್ಪು (Tobacco)", "ta": "புகையிலை (Tobacco)",
            "te": "పొగాకు (Tobacco)", "ml": "പുകയില (Tobacco)", "hi": "तंबाकू (Tobacco)"
        },
        "color": (184, 134, 11)
    },

    # ----------------------------------------------------
    # 5. VEGETABLES (19)
    # ----------------------------------------------------
    {
        "id": "tomato", "nameKey": "crop.tomato", "rawName": "Tomato", "category": "vegetable",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": True, "nutrientModelAvailable": True,
        "keywords": ["tomato", "tamatar", "solanum lycopersicum", "thakkali", "tometo", "tamata"],
        "names": {
            "en": "Tomato", "kn": "ಟೊಮೇಟೊ (Tomato)", "ta": "தக்காளி (Tomato)",
            "te": "టమాటా (Tomato)", "ml": "തക്കാളി (Tomato)", "hi": "टमाटर (Tomato)"
        },
        "color": (255, 99, 71)
    },
    {
        "id": "chilli", "nameKey": "crop.chilli", "rawName": "Chilli", "category": "vegetable",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": True, "nutrientModelAvailable": True,
        "keywords": ["chilli", "chili", "capsicum", "mirch", "menasinakayi", "milagai", "mirapakaya", "mulaku"],
        "names": {
            "en": "Chilli", "kn": "ಮೆಣಸಿನಕಾಯಿ (Chilli)", "ta": "மிளகாய் (Chilli)",
            "te": "మిరపకాయ (Chilli)", "ml": "പച്ചമുളക് (Chilli)", "hi": "हरी मिर्च (Chilli)"
        },
        "color": (220, 20, 60)
    },
    {
        "id": "brinjal", "nameKey": "crop.brinjal", "rawName": "Brinjal", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["brinjal", "eggplant", "aubergine", "solanum melongena", "baingan", "badanekayi", "kathirikai", "vankaya", "vazhuthananga"],
        "names": {
            "en": "Brinjal / Eggplant", "kn": "ಬದನೆಕಾಯಿ (Brinjal)", "ta": "கத்திரிக்காய் (Brinjal)",
            "te": "వంకాయ (Brinjal / Eggplant)", "ml": "വഴുതനങ്ങ (Brinjal)", "hi": "बैंगन (Brinjal)"
        },
        "color": (75, 0, 130)
    },
    {
        "id": "onion", "nameKey": "crop.onion", "rawName": "Onion", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["onion", "allium cepa", "pyaz", "eerulli", "vengayam", "ullipayalu", "ulli", "savala"],
        "names": {
            "en": "Onion", "kn": "ಈರುಳ್ಳಿ (Onion)", "ta": "வெங்காயம் (Onion)",
            "te": "ఉల్లిపాయ (Onion)", "ml": "സവാള / ഉള്ളി (Onion)", "hi": "प्याज (Onion)"
        },
        "color": (199, 21, 133)
    },
    {
        "id": "okra", "nameKey": "crop.okra", "rawName": "Okra", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["okra", "bhindi", "bhendi", "lady finger", "abelmoschus esculentus", "bende", "vendakkai", "bhendakaya"],
        "names": {
            "en": "Okra / Lady's Finger", "kn": "ಬೆಂಡೆಕಾಯಿ (Okra / Bhendi)", "ta": "வெண்டைக்காய் (Okra / Lady's Finger)",
            "te": "బెండకాయ (Okra / Lady's Finger)", "ml": "വെണ്ടയ്ക്ക (Okra)", "hi": "भिंडी (Okra)"
        },
        "color": (46, 139, 87)
    },
    {
        "id": "potato", "nameKey": "crop.potato", "rawName": "Potato", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["potato", "solanum tuberosum", "aaloo", "aloo", "alugadde", "urulaikizhangu", "bangaladumpa", "urulakizhangu"],
        "names": {
            "en": "Potato", "kn": "ಆಲೂಗಡ್ಡೆ (Potato)", "ta": "உருளைக்கிழங்கு (Potato)",
            "te": "బంగాళాదుంప (Potato)", "ml": "ഉരുളക്കിഴങ്ങ് (Potato)", "hi": "आलू (Potato)"
        },
        "color": (210, 180, 140)
    },
    {
        "id": "tapioca", "nameKey": "crop.tapioca", "rawName": "Tapioca", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["tapioca", "cassava", "manihot esculenta", "maravalli kizhangu", "maragenasu", "karra pendalam", "kappa"],
        "names": {
            "en": "Tapioca / Cassava", "kn": "ಮರಗೆಣಸು (Tapioca / Cassava)", "ta": "மரவள்ளிக்கிழங்கு (Tapioca)",
            "te": "కర్రపెండలం (Tapioca / Cassava)", "ml": "കപ്പ / മരച്ചീനി (Tapioca)", "hi": "कसावा / कसावा (Tapioca)"
        },
        "color": (160, 82, 45)
    },
    {
        "id": "sweet_potato", "nameKey": "crop.sweetPotato", "rawName": "Sweet Potato", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["sweet potato", "ipomoea batatas", "shakarkand", "sihi genasu", "sakkaravalli kizhangu", "chilagada dumpa", "madhurakkizhangu"],
        "names": {
            "en": "Sweet Potato", "kn": "ಸಿಹಿ ಗೆಣಸು (Sweet Potato)", "ta": "சர்க்கரைவள்ளிக்கிழங்கு (Sweet Potato)",
            "te": "చిలగడదుంప (Sweet Potato)", "ml": "മധുരക്കിഴങ്ങ് (Sweet Potato)", "hi": "शकरकंद (Sweet Potato)"
        },
        "color": (178, 34, 34)
    },
    {
        "id": "drumstick", "nameKey": "crop.drumstick", "rawName": "Drumstick", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["drumstick", "moringa", "moringa oleifera", "sehjan", "nuggekayi", "murungakkai", "mulakkada", "muringakka"],
        "names": {
            "en": "Drumstick / Moringa", "kn": "ನುಗ್ಗೆಕಾಯಿ (Moringa / Drumstick)", "ta": "முருங்கைக்காய் (Moringa / Drumstick)",
            "te": "మునగకాయ (Moringa / Drumstick)", "ml": "മുരിങ്ങക്കായ (Moringa)", "hi": "सहजन (Moringa / Drumstick)"
        },
        "color": (34, 139, 34)
    },
    {
        "id": "cucumber", "nameKey": "crop.cucumber", "rawName": "Cucumber", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["cucumber", "cucumis sativus", "kheera", "southekayi", "vellarikkai", "dosakaya", "vellarikka"],
        "names": {
            "en": "Cucumber", "kn": "ಸೌತೆಕಾಯಿ (Cucumber)", "ta": "வெள்ளரிக்காய் (Cucumber)",
            "te": "దోసకాయ (Cucumber)", "ml": "വെള്ളരിക്ക (Cucumber)", "hi": "खीरा (Cucumber)"
        },
        "color": (60, 179, 113)
    },
    {
        "id": "pumpkin", "nameKey": "crop.pumpkin", "rawName": "Pumpkin", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["pumpkin", "cucurbita moschata", "kaddu", "kumbalakayi", "parangikkai", "gummadikaya", "matthan"],
        "names": {
            "en": "Pumpkin", "kn": "ಕುಂಬಳಕಾಯಿ (Pumpkin)", "ta": "பூசணிக்காய் / பரங்கிக்காய் (Pumpkin)",
            "te": "గుమ్మడికాయ (Pumpkin)", "ml": "മത്തങ്ങ (Pumpkin)", "hi": "कद्दू (Pumpkin)"
        },
        "color": (255, 140, 0)
    },
    {
        "id": "bitter_gourd", "nameKey": "crop.bitterGourd", "rawName": "Bitter Gourd", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["bitter gourd", "momordica charantia", "karela", "hagalakayi", "paavakkai", "kakarakaya", "pavakka"],
        "names": {
            "en": "Bitter Gourd", "kn": "ಹಾಗಲಕಾಯಿ (Bitter Gourd)", "ta": "பாகற்காய் (Bitter Gourd)",
            "te": "కాకరకాయ (Bitter Gourd)", "ml": "പാവയ്ക്ക (Bitter Gourd)", "hi": "करेला (Bitter Gourd)"
        },
        "color": (47, 79, 79)
    },
    {
        "id": "bottle_gourd", "nameKey": "crop.bottleGourd", "rawName": "Bottle Gourd", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["bottle gourd", "lagenaria siceraria", "lauki", "sorekayi", "suraikkai", "sorakaya", "churakka"],
        "names": {
            "en": "Bottle Gourd", "kn": "ಸೋರೆಕಾಯಿ (Bottle Gourd)", "ta": "சுரைக்காய் (Bottle Gourd)",
            "te": "సొరకాయ (Bottle Gourd)", "ml": "ചുരയ്ക്ക (Bottle Gourd)", "hi": "लौकी (Bottle Gourd)"
        },
        "color": (144, 238, 144)
    },
    {
        "id": "ridge_gourd", "nameKey": "crop.ridgeGourd", "rawName": "Ridge Gourd", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["ridge gourd", "luffa acutangula", "turai", "hirekayi", "peerkangai", "beerakaya", "peechinga"],
        "names": {
            "en": "Ridge Gourd", "kn": "ಹೀರೆಕಾಯಿ (Ridge Gourd)", "ta": "பீர்க்கங்காய் (Ridge Gourd)",
            "te": "బీరకాయ (Ridge Gourd)", "ml": "പീച്ചിങ്ങ (Ridge Gourd)", "hi": "तोरई (Ridge Gourd)"
        },
        "color": (46, 139, 87)
    },
    {
        "id": "beans", "nameKey": "crop.beans", "rawName": "Beans", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["beans", "french beans", "phaseolus vulgaris", "huralikayi", "beans", "chikkudukai"],
        "names": {
            "en": "Beans (French Beans)", "kn": "ಹುರುಳಿಕಾಯಿ / ಬೀನ್ಸ್ (French Beans)", "ta": "பீன்ஸ் (French Beans)",
            "te": "బీన్స్ (French Beans)", "ml": "പയർ / ബീൻസ് (French Beans)", "hi": "फ्रेंच बीन्स (Beans)"
        },
        "color": (50, 205, 50)
    },
    {
        "id": "cabbage", "nameKey": "crop.cabbage", "rawName": "Cabbage", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["cabbage", "brassica oleracea", "patta gobhi", "kosu", "muttaikose", "cabbage", "muttakose"],
        "names": {
            "en": "Cabbage", "kn": "ಎಲೆಕೋಸು (Cabbage)", "ta": "முட்டைக்கோஸ் (Cabbage)",
            "te": "క్యాబేజీ (Cabbage)", "ml": "മുട്ടക്കോസ് (Cabbage)", "hi": "पत्ता गोभी (Cabbage)"
        },
        "color": (152, 251, 152)
    },
    {
        "id": "cauliflower", "nameKey": "crop.cauliflower", "rawName": "Cauliflower", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["cauliflower", "brassica oleracea var botrytis", "phool gobhi", "hookosu", "kaaliflavar", "gobi"],
        "names": {
            "en": "Cauliflower", "kn": "ಹೂಕೋಸು (Cauliflower)", "ta": "காலிஃபிளவர் (Cauliflower)",
            "te": "కాలీఫ్లవర్ (Cauliflower)", "ml": "കോളിഫ്ലവർ (Cauliflower)", "hi": "फूलगोभी (Cauliflower)"
        },
        "color": (245, 245, 220)
    },
    {
        "id": "carrot", "nameKey": "crop.carrot", "rawName": "Carrot", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["carrot", "daucus carota", "gajar", "gaajare", "kerat", "carrot"],
        "names": {
            "en": "Carrot", "kn": "ಕ್ಯಾರೆಟ್ (Carrot)", "ta": "கேரட் (Carrot)",
            "te": "క్యారెట్ (Carrot)", "ml": "കാരറ്റ് (Carrot)", "hi": "गाजर (Carrot)"
        },
        "color": (255, 127, 80)
    },
    {
        "id": "beetroot", "nameKey": "crop.beetroot", "rawName": "Beetroot", "category": "vegetable",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["beetroot", "beta vulgaris", "chukandar", "beetroot"],
        "names": {
            "en": "Beetroot", "kn": "ಬೀಟ್‌ರೂಟ್ (Beetroot)", "ta": "பீட்ரூட் (Beetroot)",
            "te": "బీట్‌రూట్ (Beetroot)", "ml": "ബീറ്റ്‌റൂട്ട് (Beetroot)", "hi": "चुकंदर (Beetroot)"
        },
        "color": (139, 0, 0)
    },

    # ----------------------------------------------------
    # 6. FRUITS (12)
    # ----------------------------------------------------
    {
        "id": "banana", "nameKey": "crop.banana", "rawName": "Banana", "category": "fruit",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["banana", "plantain", "musa", "kela", "baale", "vazhai", "arati", "vazha"],
        "names": {
            "en": "Banana", "kn": "ಬಾಳೆ (Banana)", "ta": "வாழை (Banana)",
            "te": "అరటి (Banana)", "ml": "വാഴ (Banana)", "hi": "केला (Banana)"
        },
        "color": (255, 225, 53)
    },
    {
        "id": "mango", "nameKey": "crop.mango", "rawName": "Mango", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["mango", "mangifera indica", "aam", "maavu", "maanga", "maamidikaya"],
        "names": {
            "en": "Mango", "kn": "ಮಾವಿನ ಹಣ್ಣು (Mango)", "ta": "மாம்பழம் (Mango)",
            "te": "మామిడి (Mango)", "ml": "മാങ്ങ (Mango)", "hi": "आम (Mango)"
        },
        "color": (255, 165, 0)
    },
    {
        "id": "papaya", "nameKey": "crop.papaya", "rawName": "Papaya", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["papaya", "carica papaya", "papita", "parangi", "pappali", "boppayi", "omakkaya"],
        "names": {
            "en": "Papaya", "kn": "ಪರಂಗಿ ಹಣ್ಣು (Papaya)", "ta": "பப்பாளி (Papaya)",
            "te": "బొప్పాయి (Papaya)", "ml": "പപ്പായ (Papaya)", "hi": "पपीता (Papaya)"
        },
        "color": (255, 127, 80)
    },
    {
        "id": "pomegranate", "nameKey": "crop.pomegranate", "rawName": "Pomegranate", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["pomegranate", "punica granatum", "anaar", "dalimbe", "madhulai", "danimma", "mathalam"],
        "names": {
            "en": "Pomegranate", "kn": "ದಾಳಿಂಬೆ (Pomegranate)", "ta": "மாதுளை (Pomegranate)",
            "te": "దానిమ్మ (Pomegranate)", "ml": "മാതളം (Pomegranate)", "hi": "अनार (Pomegranate)"
        },
        "color": (178, 34, 34)
    },
    {
        "id": "guava", "nameKey": "crop.guava", "rawName": "Guava", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["guava", "psidium guajava", "amrood", "seebe", "koyya", "jama", "pera"],
        "names": {
            "en": "Guava", "kn": "ಸೀಬೆಹಣ್ಣು (Guava)", "ta": "கொய்யா (Guava)",
            "te": "జామకాయ (Guava)", "ml": "പേരയ്ക്ക (Guava)", "hi": "अमरूद (Guava)"
        },
        "color": (154, 205, 50)
    },
    {
        "id": "sapota", "nameKey": "crop.sapota", "rawName": "Sapota", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["sapota", "chikoo", "manilkara zapota", "chiku", "sapota"],
        "names": {
            "en": "Sapota / Chikoo", "kn": "ಸಪೋಟ / ಚಿಕ್ಕು (Sapota)", "ta": "சப்போட்டா (Sapota)",
            "te": "సపోటా (Sapota)", "ml": "സപ്പോട്ട (Sapota)", "hi": "चीकू / सपोटा (Sapota)"
        },
        "color": (139, 69, 19)
    },
    {
        "id": "pineapple", "nameKey": "crop.pineapple", "rawName": "Pineapple", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["pineapple", "ananas comosus", "ananas", "parangi", "annasi", "kaithachakka"],
        "names": {
            "en": "Pineapple", "kn": "ಅನಾನಸ್ (Pineapple)", "ta": "அன்னாசி (Pineapple)",
            "te": "అనాసపండు (Pineapple)", "ml": "കൈതച്ചക്ക (Pineapple)", "hi": "अनानास (Pineapple)"
        },
        "color": (218, 165, 32)
    },
    {
        "id": "grapes", "nameKey": "crop.grapes", "rawName": "Grapes", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["grapes", "vitis vinifera", "angoor", "drakshi", "thiratchai", "draksha", "muntiringa"],
        "names": {
            "en": "Grapes", "kn": "ದ್ರಾಕ್ಷಿ (Grapes)", "ta": "திராட்சை (Grapes)",
            "te": "ద్రాక్ష (Grapes)", "ml": "മുന്തിരി (Grapes)", "hi": "अंगूर (Grapes)"
        },
        "color": (128, 0, 128)
    },
    {
        "id": "jackfruit", "nameKey": "crop.jackfruit", "rawName": "Jackfruit", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["jackfruit", "artocarpus heterophyllus", "kathal", "halasu", "pala", "panasa", "chakka"],
        "names": {
            "en": "Jackfruit", "kn": "ಹಲಸಿನ ಹಣ್ಣು (Jackfruit)", "ta": "பலாப்பழம் (Jackfruit)",
            "te": "పనసపండు (Jackfruit)", "ml": "ചക്ക (Jackfruit)", "hi": "कटहल (Jackfruit)"
        },
        "color": (107, 142, 35)
    },
    {
        "id": "watermelon", "nameKey": "crop.watermelon", "rawName": "Watermelon", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["watermelon", "citrullus lanatus", "tarbooz", "kallangadi", "tharpoosani", "puchakaya", "thannimathan"],
        "names": {
            "en": "Watermelon", "kn": "ಕಲ್ಲಂಗಡಿ (Watermelon)", "ta": "தர்பூசணி (Watermelon)",
            "te": "పుచ్చకాయ (Watermelon)", "ml": "തണ്ണിമത്തൻ (Watermelon)", "hi": "तरबूज (Watermelon)"
        },
        "color": (220, 20, 60)
    },
    {
        "id": "muskmelon", "nameKey": "crop.muskmelon", "rawName": "Muskmelon", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["muskmelon", "cantaloupe", "cucumis melo", "kharbooja", "kirni", "kekkarikke"],
        "names": {
            "en": "Muskmelon", "kn": "ಖರಬೂಜ (Muskmelon)", "ta": "முலாம் பழம் / கிர்ணி (Muskmelon)",
            "te": "ఖర్బూజ (Muskmelon)", "ml": "തണ്ണീർപന്തൽ / മസ്ക്മെലൻ (Muskmelon)", "hi": "खरबूजा (Muskmelon)"
        },
        "color": (244, 164, 96)
    },
    {
        "id": "citrus_lime", "nameKey": "crop.citrusLime", "rawName": "Acid Lime", "category": "fruit",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["citrus", "lime", "lemon", "citrus aurantifolia", "nimbu", "nimbe", "elumichai", "nimmakaya", "cherunaranga"],
        "names": {
            "en": "Citrus / Acid Lime", "kn": "ನಿಂಬೆ (Citrus / Acid Lime)", "ta": "எலுமிச்சை (Citrus / Acid Lime)",
            "te": "నిమ్మకాయ (Citrus / Acid Lime)", "ml": "ചെറുനാരങ്ങ (Citrus / Lime)", "hi": "नींबू (Citrus / Acid Lime)"
        },
        "color": (255, 255, 0)
    },

    # ----------------------------------------------------
    # 7. PLANTATION CROPS (9)
    # ----------------------------------------------------
    {
        "id": "coconut", "nameKey": "crop.coconut", "rawName": "Coconut", "category": "plantation",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": True, "nutrientModelAvailable": True,
        "keywords": ["coconut", "cocos nucifera", "nariyal", "tengu", "thennai", "kobbari", "thengu"],
        "names": {
            "en": "Coconut", "kn": "ತೆಂಗು (Coconut)", "ta": "தென்னை (Coconut)",
            "te": "కొబ్బరి (Coconut)", "ml": "തെങ്ങ് (Coconut)", "hi": "नारियल (Coconut)"
        },
        "color": (139, 69, 19)
    },
    {
        "id": "arecanut", "nameKey": "crop.arecanut", "rawName": "Arecanut", "category": "plantation",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["arecanut", "betel nut", "areca catechu", "supari", "adike", "pakku", "vakka", "adakka"],
        "names": {
            "en": "Arecanut / Betel Nut", "kn": "ಅಡಿಕೆ (Arecanut / Betel Nut)", "ta": "பாக்கு (Arecanut / Betel Nut)",
            "te": "పోక చెట్టు / వక్క (Arecanut)", "ml": "അടയ്ക്ക / കമുകു (Arecanut)", "hi": "सुपारी (Arecanut)"
        },
        "color": (205, 133, 63)
    },
    {
        "id": "cashew", "nameKey": "crop.cashew", "rawName": "Cashew", "category": "plantation",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["cashew", "anacardium occidentale", "kaju", "geru", "munthiri", "jeedipappu", "kasu"],
        "names": {
            "en": "Cashew", "kn": "ಗೇರು / ಗೋಡಂಬಿ (Cashew)", "ta": "முந்திரி (Cashew)",
            "te": "జీడిమామిడి (Cashew)", "ml": "കശുമാവ് (Cashew)", "hi": "काजू (Cashew)"
        },
        "color": (244, 164, 96)
    },
    {
        "id": "coffee", "nameKey": "crop.coffee", "rawName": "Coffee", "category": "plantation",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["coffee", "coffea arabica", "coffea canephora", "kaapi", "coffee"],
        "names": {
            "en": "Coffee", "kn": "ಕಾಫಿ (Coffee)", "ta": "காபி (Coffee)",
            "te": "కాఫీ (Coffee)", "ml": "കാപ്പി (Coffee)", "hi": "कॉफ़ी (Coffee)"
        },
        "color": (111, 78, 55)
    },
    {
        "id": "tea", "nameKey": "crop.tea", "rawName": "Tea", "category": "plantation",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["tea", "camellia sinensis", "chai", "theila", "chaha"],
        "names": {
            "en": "Tea", "kn": "ಚಹಾ (Tea)", "ta": "தேயிலை (Tea)",
            "te": "తేయాకు (Tea)", "ml": "തേയില (Tea)", "hi": "चाय (Tea)"
        },
        "color": (34, 139, 34)
    },
    {
        "id": "rubber", "nameKey": "crop.rubber", "rawName": "Rubber", "category": "plantation",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["rubber", "hevea brasiliensis", "rubber", "latex"],
        "names": {
            "en": "Rubber", "kn": "ರಬ್ಬರ್ (Rubber)", "ta": "ரப்பர் (Rubber)",
            "te": "రబ్బరు (Rubber)", "ml": "റബ്ബർ (Rubber)", "hi": "रबर (Rubber)"
        },
        "color": (119, 136, 153)
    },
    {
        "id": "cocoa", "nameKey": "crop.cocoa", "rawName": "Cocoa", "category": "plantation",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["cocoa", "theobroma cacao", "cacao", "cocoa"],
        "names": {
            "en": "Cocoa", "kn": "ಕೋಕೋ (Cocoa)", "ta": "கோகோ (Cocoa)",
            "te": "కోకో (Cocoa)", "ml": "കൊക്കോ (Cocoa)", "hi": "कोको (Cocoa)"
        },
        "color": (92, 51, 23)
    },
    {
        "id": "oil_palm", "nameKey": "crop.oilPalm", "rawName": "Oil Palm", "category": "plantation",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["oil palm", "elaeis guineensis", "palm oil", "thalamaram"],
        "names": {
            "en": "Oil Palm", "kn": "ಎಣ್ಣೆ ತಾಳೆ (Oil Palm)", "ta": "எண்ணெய் பனை (Oil Palm)",
            "te": "ఆయిల్ పామ్ (Oil Palm)", "ml": "ഓയിൽ പാം (Oil Palm)", "hi": "ऑयल पाम (Oil Palm)"
        },
        "color": (184, 115, 51)
    },
    {
        "id": "palmyrah", "nameKey": "crop.palmyrah", "rawName": "Palmyrah", "category": "plantation",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["palmyrah", "borassus flabellifer", "tale", "panai", "thati", "pana"],
        "names": {
            "en": "Palmyrah Palm", "kn": "ತಾಳೆ ಮರ (Palmyrah Palm)", "ta": "பனை மரம் (Palmyrah Palm)",
            "te": "తాటి చెట్టు (Palmyrah Palm)", "ml": "പന (Palmyrah Palm)", "hi": "ताड़ का पेड़ (Palmyrah Palm)"
        },
        "color": (85, 107, 47)
    },

    # ----------------------------------------------------
    # 8. SPICES & CONDIMENTS (8)
    # ----------------------------------------------------
    {
        "id": "black_pepper", "nameKey": "crop.blackPepper", "rawName": "Black Pepper", "category": "spice",
        "modelAvailable": True, "diseaseModelAvailable": True, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["black pepper", "piper nigrum", "kalimirch", "menasu", "karumilagu", "miriyalu", "kurumulaku"],
        "names": {
            "en": "Black Pepper", "kn": "ಕರಿಮೆಣಸು (Black Pepper)", "ta": "கருமிளகு (Black Pepper)",
            "te": "మిరియాలు (Black Pepper)", "ml": "കുരുമുളക് (Black Pepper)", "hi": "काली मिर्च (Black Pepper)"
        },
        "color": (47, 79, 79)
    },
    {
        "id": "cardamom", "nameKey": "crop.cardamom", "rawName": "Cardamom", "category": "spice",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["cardamom", "elettaria cardamomum", "elaichi", "yelakki", "elakkai", "elakulu", "elakka"],
        "names": {
            "en": "Cardamom", "kn": "ಏಲಕ್ಕಿ (Cardamom)", "ta": "ஏலக்காய் (Cardamom)",
            "te": "యాలకులు (Cardamom)", "ml": "ഏലക്ക (Cardamom)", "hi": "इलायची (Cardamom)"
        },
        "color": (143, 188, 143)
    },
    {
        "id": "turmeric", "nameKey": "crop.turmeric", "rawName": "Turmeric", "category": "spice",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["turmeric", "curcuma longa", "haldi", "arishina", "manjal", "pasupu", "manjal"],
        "names": {
            "en": "Turmeric", "kn": "ಅರಿಶಿನ (Turmeric)", "ta": "மஞ்சள் (Turmeric)",
            "te": "పసుపు (Turmeric)", "ml": "മഞ്ഞൾ (Turmeric)", "hi": "हल्दी (Turmeric)"
        },
        "color": (255, 191, 0)
    },
    {
        "id": "ginger", "nameKey": "crop.ginger", "rawName": "Ginger", "category": "spice",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["ginger", "zingiber officinale", "adrak", "shunti", "inji", "allam", "inji"],
        "names": {
            "en": "Ginger", "kn": "ಶುಂಠಿ (Ginger)", "ta": "இஞ்சி (Ginger)",
            "te": "అల్లం (Ginger)", "ml": "ഇഞ്ചി (Ginger)", "hi": "अदरक (Ginger)"
        },
        "color": (218, 165, 32)
    },
    {
        "id": "clove", "nameKey": "crop.clove", "rawName": "Clove", "category": "spice",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["clove", "syzygium aromaticum", "laung", "lavanga", "krambu", "lavangalu", "karambu"],
        "names": {
            "en": "Clove", "kn": "ಲವಂಗ (Clove)", "ta": "கிராம்பு (Clove)",
            "te": "లవంగాలు (Clove)", "ml": "ഗ്രാമ്പൂ (Clove)", "hi": "लौंग (Clove)"
        },
        "color": (139, 69, 19)
    },
    {
        "id": "coriander", "nameKey": "crop.coriander", "rawName": "Coriander", "category": "spice",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["coriander", "coriandrum sativum", "dhaniya", "kothambari", "kothamalli", "dhaniyalu", "malli"],
        "names": {
            "en": "Coriander", "kn": "ಕೊತ್ತಂಬರಿ (Coriander)", "ta": "கொத்தமல்லி (Coriander)",
            "te": "కొత్తిమీర / ధనియాలు (Coriander)", "ml": "മല്ലി / കൊത്തമല്ലി (Coriander)", "hi": "धनिया (Coriander)"
        },
        "color": (60, 179, 113)
    },
    {
        "id": "cumin", "nameKey": "crop.cumin", "rawName": "Cumin", "category": "spice",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["cumin", "cuminum cyminum", "jeera", "jeerige", "seeragam", "jeelakarra", "jeerakam"],
        "names": {
            "en": "Cumin / Jeera", "kn": "ಜೀರಿಗೆ (Cumin / Jeera)", "ta": "சீரகம் (Cumin / Jeera)",
            "te": "జీలకర్ర (Cumin / Jeera)", "ml": "ജീരകം (Cumin / Jeera)", "hi": "जीरा (Cumin / Jeera)"
        },
        "color": (160, 82, 45)
    },
    {
        "id": "fenugreek", "nameKey": "crop.fenugreek", "rawName": "Fenugreek", "category": "spice",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["fenugreek", "trigonella foenum-graecum", "methi", "menthya", "vendhayam", "menthulu", "uluva"],
        "names": {
            "en": "Fenugreek / Methi", "kn": "ಮೆಂತ್ಯ (Fenugreek / Methi)", "ta": "வெந்தயம் (Fenugreek / Methi)",
            "te": "మెంతులు (Fenugreek / Methi)", "ml": "ഉലുവ (Fenugreek / Methi)", "hi": "मेथी (Fenugreek / Methi)"
        },
        "color": (189, 183, 107)
    },

    # ----------------------------------------------------
    # 9. OTHER REGIONAL SPECIALTIES (2)
    # ----------------------------------------------------
    {
        "id": "betel_vine", "nameKey": "crop.betelVine", "rawName": "Betel Vine", "category": "other",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["betel vine", "piper betle", "paan", "veelyada yele", "vetrilai", "tamalapaaku", "vettila"],
        "names": {
            "en": "Betel Vine / Paan", "kn": "ವೀಳ್ಯದೆಲೆ (Betel Vine / Paan)", "ta": "வெற்றிலை (Betel Vine / Paan)",
            "te": "తమలపాకు (Betel Vine / Paan)", "ml": "വെറ്റില (Betel Vine / Paan)", "hi": "पान (Betel Vine / Paan)"
        },
        "color": (34, 139, 34)
    },
    {
        "id": "tamarind", "nameKey": "crop.tamarind", "rawName": "Tamarind", "category": "other",
        "modelAvailable": False, "diseaseModelAvailable": False, "pestModelAvailable": False, "nutrientModelAvailable": False,
        "keywords": ["tamarind", "tamarindus indica", "imli", "hunase", "puli", "chintha", "vaalanpuli"],
        "names": {
            "en": "Tamarind", "kn": "ಹುಣಸೆಹಣ್ಣು (Tamarind)", "ta": "புளி (Tamarind)",
            "te": "చింతపండు (Tamarind)", "ml": "വാളൻപുളി (Tamarind)", "hi": "इमली (Tamarind)"
        },
        "color": (139, 69, 19)
    }
]

def generate_crop_artwork():
    assets_dir = "assets/crops"
    os.makedirs(assets_dir, exist_ok=True)
    
    for c in SOUTH_INDIA_CROPS:
        fpath = os.path.join(assets_dir, f"{c['id']}.png")
        if os.path.exists(fpath):
            continue # Keep existing hand-curated art
        
        # Create crisp 256x256 icon
        img = Image.new('RGBA', (256, 256), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Background badge circle
        bg_col = c['color'] + (235,)
        draw.ellipse([16, 16, 240, 240], fill=bg_col, outline=(255, 255, 255, 200), width=4)
        
        # Inner decorative circle
        draw.ellipse([26, 26, 230, 230], outline=(255, 255, 255, 120), width=2)
        
        # Draw botanical stylized initial / monogram
        text = c['rawName'][:2].upper()
        # Draw simple stylized leaf shapes
        draw.polygon([(128, 45), (150, 85), (106, 85)], fill=(255, 255, 255, 220))
        draw.line([(128, 60), (128, 120)], fill=(255, 255, 255, 240), width=4)
        
        # Category glyph indicator (seed, pod, foliage)
        draw.rectangle([90, 130, 166, 180], fill=(255, 255, 255, 240), outline=(0, 0, 0, 40), width=2)
        
        img.save(fpath, 'PNG')
        print(f"[+] Created artwork for: {c['id']}.png")

def update_locale_files():
    locales = ['en', 'kn', 'ta', 'te', 'ml', 'hi']
    for lang in locales:
        loc_path = f"src/locales/{lang}.json"
        with open(loc_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for c in SOUTH_INDIA_CROPS:
            # Key format: crop.<id>
            k = c['nameKey']
            data[k] = c['names'].get(lang, c['names']['en'])
            # Ensure category tabs localized
            data["cropCategory.all"] = "All Crops" if lang == "en" else data.get("cropCategory.all", "All")
            data["cropCategory.cereal"] = "Grains & Millets" if lang == "en" else "ಧಾನ್ಯಗಳು" if lang == "kn" else "தானியங்கள்" if lang == "ta" else "ధాన్యాలు" if lang == "te" else "ധാന്യങ്ങൾ" if lang == "ml" else "अनाज व बाजरा"
            data["cropCategory.pulse"] = "Pulses" if lang == "en" else "ಕಾಳುಗಳು" if lang == "kn" else "பருப்பு வகைகள்" if lang == "ta" else "పప్పు ధాన్యాలు" if lang == "te" else "പയറുവർഗ്ഗങ്ങൾ" if lang == "ml" else "दालें"
            data["cropCategory.oilseed"] = "Oilseeds" if lang == "en" else "ಎಣ್ಣೆಕಾಳುಗಳು" if lang == "kn" else "எண்ணெய் வித்துக்கள்" if lang == "ta" else "నూనె గింజలు" if lang == "te" else "എണ്ണക്കുരുക്കൾ" if lang == "ml" else "तिलहन"
            data["cropCategory.commercial"] = "Commercial" if lang == "en" else "ವಾಣಿಜ್ಯ ಬೆಳೆಗಳು" if lang == "kn" else "வணிகப் பயிர்கள்" if lang == "ta" else "వాణిజ్య పంటలు" if lang == "te" else "വാണിജ്യ വിളകൾ" if lang == "ml" else "व्यावसायिक फसलें"
            data["cropCategory.vegetable"] = "Vegetables" if lang == "en" else "ತರಕಾರಿಗಳು" if lang == "kn" else "காய்கறிகள்" if lang == "ta" else "కూరగాయలు" if lang == "te" else "പച്ചക്കറികൾ" if lang == "ml" else "सब्जियां"
            data["cropCategory.fruit"] = "Fruits" if lang == "en" else "ಹಣ್ಣುಗಳು" if lang == "kn" else "பழங்கள்" if lang == "ta" else "పండ్లు" if lang == "te" else "പഴങ്ങൾ" if lang == "ml" else "फल"
            data["cropCategory.plantation"] = "Plantation" if lang == "en" else "ತೋಟದ ಬೆಳೆಗಳು" if lang == "kn" else "தோட்டப் பயிர்கள்" if lang == "ta" else "తోట పంటలు" if lang == "te" else "തോട്ടവിളകൾ" if lang == "ml" else "बागवानी फसलें"
            data["cropCategory.spice"] = "Spices" if lang == "en" else "ಮಸಾಲೆ ಬೆಳೆಗಳು" if lang == "kn" else "மசாலாப் பொருட்கள்" if lang == "ta" else "మసాలా దినుసులు" if lang == "te" else "സുഗന്ധവ്യഞ്ജനങ്ങൾ" if lang == "ml" else "मसाले"
            data["cropCategory.other"] = "Regional" if lang == "en" else "ಪ್ರಾದೇಶಿಕ" if lang == "kn" else "பிராந்திய" if lang == "ta" else "ప్రాంతీయ" if lang == "te" else "പ്രാദേശിക" if lang == "ml" else "क्षेत्रीय"
            
            # Badges
            data["badge.diseaseAi"] = "Disease AI"
            data["badge.pestAi"] = "Pest AI"
            data["badge.nutrientAi"] = "Nutrient AI"
            data["badge.comingSoon"] = "Coming Soon" if lang == "en" else "ಶೀಘ್ರದಲ್ಲೇ ಲಭ್ಯ" if lang == "kn" else "விரைவில்" if lang == "ta" else "త్వరలో" if lang == "te" else "ഉടൻ ലഭ്യമാകും" if lang == "ml" else "जल्द उपलब्ध"

        with open(loc_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"[+] Updated locale: {lang}.json with 76 crop names and category filters")

def update_crops_config():
    crops_ts_path = "src/config/crops.ts"
    lines = []
    lines.append("export interface CropConfig {")
    lines.append("  id: string;")
    lines.append("  nameKey: string;")
    lines.append("  rawName: string;")
    lines.append("  image: any;")
    lines.append("  modelAvailable: boolean;")
    lines.append("  diseaseModelAvailable?: boolean;")
    lines.append("  pestModelAvailable?: boolean;")
    lines.append("  nutrientModelAvailable?: boolean;")
    lines.append("  category: 'cereal' | 'pulse' | 'oilseed' | 'commercial' | 'vegetable' | 'fruit' | 'plantation' | 'spice' | 'other';")
    lines.append("  searchKeywords: string[];")
    lines.append("}\n")
    lines.append("export const CROPS_CONFIG: CropConfig[] = [")

    for c in SOUTH_INDIA_CROPS:
        lines.append("  {")
        lines.append(f"    id: '{c['id']}',")
        lines.append(f"    nameKey: '{c['nameKey']}',")
        lines.append(f"    rawName: '{c['rawName']}',")
        lines.append(f"    image: require('../../assets/crops/{c['id']}.png'),")
        lines.append(f"    modelAvailable: {str(c['modelAvailable']).lower()},")
        lines.append(f"    diseaseModelAvailable: {str(c['diseaseModelAvailable']).lower()},")
        lines.append(f"    pestModelAvailable: {str(c['pestModelAvailable']).lower()},")
        lines.append(f"    nutrientModelAvailable: {str(c['nutrientModelAvailable']).lower()},")
        lines.append(f"    category: '{c['category']}',")
        kw_json = json.dumps(c['keywords'], ensure_ascii=False)
        lines.append(f"    searchKeywords: {kw_json},")
        lines.append("  },")

    lines.append("];\n")
    lines.append("export const getCropById = (id: string): CropConfig | undefined => {")
    lines.append("  const norm = id.toLowerCase().trim();")
    lines.append("  return CROPS_CONFIG.find((c) => c.id === norm || c.rawName.toLowerCase() === norm);")
    lines.append("};\n")

    with open(crops_ts_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))
    print(f"[+] Successfully wrote {len(SOUTH_INDIA_CROPS)} crops into src/config/crops.ts!")

if __name__ == '__main__':
    generate_crop_artwork()
    update_locale_files()
    update_crops_config()
