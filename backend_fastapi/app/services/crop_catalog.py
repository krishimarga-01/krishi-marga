import re
from typing import Optional, Tuple

TARGET_75_CROPS = [
    'paddy', 'maize', 'ragi', 'sorghum', 'pearl_millet', 'foxtail_millet', 'little_millet',
    'kodo_millet', 'barnyard_millet', 'proso_millet', 'wheat', 'red_gram', 'black_gram',
    'green_gram', 'bengal_gram', 'cowpea', 'field_bean', 'groundnut', 'sesame', 'sunflower',
    'castor', 'safflower', 'soybean', 'cotton', 'sugarcane', 'tobacco', 'tomato', 'chilli',
    'brinjal', 'onion', 'okra', 'potato', 'tapioca', 'sweet_potato', 'drumstick', 'cucumber',
    'pumpkin', 'bitter_gourd', 'bottle_gourd', 'ridge_gourd', 'beans', 'cabbage', 'cauliflower',
    'carrot', 'beetroot', 'banana', 'mango', 'papaya', 'pomegranate', 'guava', 'sapota',
    'pineapple', 'grapes', 'jackfruit', 'watermelon', 'muskmelon', 'citrus_lime', 'coconut',
    'arecanut', 'cashew', 'coffee', 'tea', 'rubber', 'cocoa', 'oil_palm', 'palmyrah',
    'black_pepper', 'cardamom', 'turmeric', 'ginger', 'clove', 'coriander', 'cumin',
    'fenugreek', 'betel_vine'
]

CROP_ALIASES = {
    'rice': 'paddy',
    'dhan': 'paddy',
    'corn': 'maize',
    'chili': 'chilli',
    'pepper_bell': 'chilli',
    'capsicum': 'chilli',
    'acid_lime': 'citrus_lime',
    'lemon': 'citrus_lime',
    'lime': 'citrus_lime',
    'cassava': 'tapioca',
    'betel_nut': 'arecanut',
    'betel_leaf': 'betel_vine',
    'pigeon_pea': 'red_gram',
    'arhar': 'red_gram',
    'tur': 'red_gram',
    'mung_bean': 'green_gram',
    'moong': 'green_gram',
    'urad': 'black_gram',
    'chickpea': 'bengal_gram',
    'chana': 'bengal_gram',
    'grape': 'grapes',
    'black pepper': 'black_pepper',
    'pearl millet': 'pearl_millet',
    'foxtail millet': 'foxtail_millet',
    'little millet': 'little_millet',
    'kodo millet': 'kodo_millet',
    'barnyard millet': 'barnyard_millet',
    'proso millet': 'proso_millet',
    'red gram': 'red_gram',
    'black gram': 'black_gram',
    'green gram': 'green_gram',
    'bengal gram': 'bengal_gram',
    'field bean': 'field_bean',
    'sweet potato': 'sweet_potato',
    'bitter gourd': 'bitter_gourd',
    'bottle gourd': 'bottle_gourd',
    'ridge gourd': 'ridge_gourd',
    'oil palm': 'oil_palm',
    'betel vine': 'betel_vine'
}

LANG_MAP = {
    'en': 'English',
    'kn': 'Kannada',
    'ta': 'Tamil',
    'te': 'Telugu',
    'ml': 'Malayalam',
    'hi': 'Hindi'
}

def resolve_language(raw_lang: Optional[str]) -> Tuple[str, str]:
    if not raw_lang:
        return 'en', 'English'
    clean = str(raw_lang).lower().strip()
    if clean in LANG_MAP:
        return clean, LANG_MAP[clean]
    for code, name in LANG_MAP.items():
        if name.lower() == clean:
            return code, name
    return 'en', 'English'

def match_crop(raw_crop: str) -> Optional[str]:
    if not raw_crop or not raw_crop.strip():
        return None
    crop_trimmed = raw_crop.strip()
    norm = re.sub(r'[\s\-_]+', '_', crop_trimmed.lower())
    
    # 1. Exact canonical
    if norm in TARGET_75_CROPS:
        return norm
        
    # 2. Aliases
    if crop_trimmed.lower() in CROP_ALIASES:
        return CROP_ALIASES[crop_trimmed.lower()]
    if norm in CROP_ALIASES:
        return CROP_ALIASES[norm]
        
    # 3. Substring matching
    for c in TARGET_75_CROPS:
        if norm in c or c in norm:
            return c
            
    return None
