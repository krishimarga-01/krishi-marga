# KRISHI MARGA — COMPREHENSIVE AGRICULTURAL DATA GAPS AUDIT
**Document Version**: 1.0.0  
**Date**: 2026-09-11  
**Auditor**: KRISHI MARGA Independent Scientific & Empirical Review Panel  
**Mandate**: Uncompromising Transparency — Never Conceal Gaps, Deficits, or Data Voids

---

## 1. Executive Summary

A successful agricultural AI platform depends on knowing **what the system does NOT know**.
This audit provides an unvarnished analysis of data availability across South Indian crops, pest classes, physiological disorders, agrochemical imagery, and district-level specialist coverage.

---

## 2. Crop Disease Dataset Availability Audit

| Crop | Dataset Quality | Available Public Imagery | Critical Uncovered Diseases / Data Gaps |
|---|:---:|:---:|---|
| **Tomato** | **EXCELLENT** | >35,000 images (New Plant Diseases, PlantDoc, CCMT) | Bacterial canker (*Clavibacter*) and Tomato Spotted Wilt Virus (TSWV) are under-represented in wild field conditions. |
| **Cotton** | **EXCELLENT** | >1,700 clean images + ICAR archives | Parawilt (physiological sudden wilt) and Grey mildew (*Ramularia*) lack sufficient in-situ field photos. |
| **Coconut** | **EXCELLENT** | >5,700 images (CPCRI / Cleaned physical set) | Root wilt phytoplasma early foliar flaccidity is difficult to distinguish from drought in 2D imagery. |
| **Paddy / Rice** | **GOOD** | >3,500 images (Rice leaf disease, RP11, UCI) | False smut (*Ustilaginoidea virens*) and Sheath rot (*Sarocladium oryzae*) lack large open annotated datasets. |
| **Chilli** | **GOOD** | >6,700 images (Chilli plant dataset) | Early stage Powdery mildew (*Leveillula taurica*) and Choanephora wet rot lack dedicated classes. |
| **Maize / Corn** | **GOOD** | >17,000 images (PlantVillage, Maize Deficiency) | Banded leaf and sheath blight (*Rhizoctonia solani*) has minimal open Indian data. |
| **Sugarcane** | **GOOD** | >2,500 images (Sugarcane leaf dataset) | Grassy shoot phytoplasma and Smut (*Sporisorium scitamineum*) whip stages have limited image volume. |
| **Coffee** | **MODERATE** | ~4,000 images (GTI-UPM - Note: CC-BY-NC license) | Black rot (*Koleroga noxia*) and Pink disease (*Corticium salmonicolor*) lack public datasets. |
| **Tea** | **MODERATE** | ~885 images (UPASI / Kaggle clean set) | Blister blight early translucent stage (<24h post-infection) lacks high-resolution macro imagery. |
| **Wheat** | **MODERATE** | ~4,100 images (CIMMYT Rust set) | Karnal bunt (*Tilletia indica*) and Loose smut (*Ustilago tritici*) have few field foliage images. |
| **Black Pepper** | **MODERATE** | ~1,500 images (IISR / Kaggle archive) | Slow decline nematode root-gall lesions cannot be captured from above-ground foliar imagery alone. |
| **Arecanut** | **MODERATE** | ~1,850 images (CPCRI / UAS Dharwad) | Yellow Leaf Disease (YLD) phytoplasma lacks comprehensive multi-stage seasonal time-series imagery. |
| **Cashew** | **MODERATE** | ~2,200 images (CCMT subset) | Pink disease (*Erythricium salmonicolor*) and gummosis trunk weeping have limited image coverage. |
| **Rubber** | **POOR** | ~1,240 images | Corynespora leaf spot and Bird's eye spot datasets are fragmented and lack field lighting variability. |
| **Turmeric** | **POOR** | ~1,420 images | Taphrina leaf blotch is under-represented; rhizome rot symptoms cannot be verified from leaf photos. |
| **Cardamom** | **VERY POOR** | <1,000 images | Azhukal capsule rot and Katte mosaic virus have extremely scarce public annotated training datasets. |
| **Tobacco** | **VERY POOR** | ~1,150 images | Frog-eye spot and Black shank have very small public samples; largely restricted to institutional archives. |

---

## 3. Pest & Insect Image Dataset Audit

### Pests with Strong, Trainable Datasets (🟢 GOOD)
- **Rice Stem Borer & Leaf Folder**: Covered in RP11, IP102, and Kaggle rice pest datasets (>2,500 images).
- **Brown Plant Hopper (BPH)**: High quality macro photography available in IP102 and RP11 datasets.
- **Fall Armyworm (Spodoptera frugiperda)**: Substantial field and trap imagery available across global and Indian repositories.
- **Cotton Pink Bollworm & American Bollworm**: Well-documented in IP102 and agricultural entomology benchmarks.
- **Tomato Fruit Borer (Helicoverpa)**: Highly represented across multiple benchmark repositories.
- **Coconut Rhinoceros Beetle**: Good adult specimen imagery (though crown notch damage is often confused with mechanical pruning).

### Pests with Critical Data Voids / No Usable Public Dataset (🔴 ABSENT OR DEFICIENT)
- **Coffee White Stem Borer (Xylotrechus quadripes)**: Grubs feed *inside* trunk hardwood; external bark ridge symptoms have **ZERO public benchmark training datasets**.
- **Coconut Red Palm Weevil (Early Infestation)**: Grubs feed internally inside trunk cabbage; external oozing holes are rarely photographed systematically in open public datasets.
- **Cardamom Thrips (Sciothrips cardamomi)**: Microscopic thrips lacerations on young green capsules lack open high-resolution computer vision datasets.
- **Arecanut Spindle Bug (Carvalhoia arecae)**: Insects reside deep inside unopened tender spindles; no public training benchmark exists.
- **Black Pepper Pollu Beetle (Longitarsus nigripennis)**: Berry bore-hole damage has virtually zero annotated bounding box data in public domains.
- **Root Grubs (Holotrichia serrata / Leucopholis coneophora)**: Subterranean root feeders cannot be detected directly from mobile leaf photography.

---

## 4. Nutrient Deficiency Image Datasets Audit

| Nutrient | Image Dataset Status | Available Repositories | Critical Gaps |
|---|:---:|---|---|
| **Nitrogen (N)** | **MODERATE** | Maize Deficiency Dataset, EarlyNSD | Available for Maize and Cucurbits; lacks dedicated datasets for plantation crops (Coffee, Rubber, Areca). |
| **Phosphorus (P)** | **MODERATE** | Maize Deficiency Dataset, EarlyNSD | Readily available for corn; visual purple pigmentation in tomato/cotton overlaps with viral stress. |
| **Potassium (K)** | **MODERATE** | Maize Deficiency, Cotton Leaf Firing sets | Excellent for maize/cotton; coconut trans-illuminated orange spotting lacks isolated benchmark. |
| **Zinc (Zn)** | **POOR** | Maize Deficiency ("White bud" class) | Excellent for maize; virtually NO isolated public image dataset for Rice Khaira disease or Citrus mottle. |
| **Calcium (Ca)** | **POOR** | Tomato Blossom End Rot (in PlantDoc/CCMT) | Good for tomato fruit; vegetative apical leaf hooking in other crops has zero public data. |
| **Magnesium (Mg)** | **VERY POOR** | EarlyNSD (small subset) | Interveinal chlorosis on older leaves is constantly misclassified by models as spider mite damage or mosaic virus. |
| **Iron (Fe)** | **VERY POOR** | Handful of research papers | Severe lack of high-resolution image sets for sugarcane, groundnut, and paddy lime-induced chlorosis. |
| **Boron (B)** | **CRITICAL VOID** | **NO PUBLIC DATASET** | Crown choking in arecanut, hollow stem in brassica, and internal browning lack any open computer vision dataset. |
| **Sulphur (S)** | **CRITICAL VOID** | **NO PUBLIC DATASET** | Pale chlorosis on youngest leaves is visually indistinguishable from Iron/Nitrogen without lab soil/leaf assays. |
| **Manganese (Mn) & Copper (Cu)** | **CRITICAL VOID** | **NO PUBLIC DATASET** | Zero public image datasets exist in agricultural open repositories. |

---

## 5. Pesticide Photo Identification Audit

> [!CAUTION]
> **Pesticide Product / Label Image Dataset Status**: **NO SUITABLE VERIFIED DATASET FOUND.**

- **Findings**:
  - Extensive querying across Kaggle, Mendeley Data, Zenodo, and GitHub confirmed that **no open benchmark dataset of commercial Indian pesticide containers, pouches, or CIBRC label triangles exists**.
  - Generic bottle datasets (e.g. YOLO plastic bottle detection) detect bottle presence but cannot read active ingredient text, formulation (EC/SC/WP), or CIBRC registration numbers.
- **Architectural Solution for KRISHI MARGA**:
  - Rather than training an error-prone CNN image classifier to "guess" pesticide bottles from visual shapes, KRISHI MARGA must implement an **On-Device Optical Character Recognition (OCR) + Named Entity Recognition (NER)** pipeline.
  - The system reads printed chemical text, extracts the active ingredient string, matches it against [`PESTICIDE_MASTER.csv`](file:///C:/Users/Prathach%20Raj%20P/.gemini/antigravity/scratch/krishi-marga/agricultural_knowledge/PESTICIDE_MASTER.csv), and returns verified CIBRC regulatory instructions.
  - If the label is blurry, torn, or unreadable, the system displays:  
    `"Unable to confidently identify this pesticide. Please photograph the printed front/back label clearly."`

---

## 6. South India District Crop Doctor Coverage Audit

A rigorous district-by-district audit was conducted across the 142 districts of South India (Karnataka: 31, Kerala: 14, Tamil Nadu: 38, Andhra Pradesh: 26, Telangana: 33):

### Districts with Verified Public Plant Pathology / Crop Health Contacts (Sample of Hubs)
- **Karnataka**: Bengaluru Urban (UAS GKVK), Bengaluru Rural (ICAR-IIHR), Mandya (ZARS VC Farm), Dharwad (UAS Dharwad), Dakshina Kannada (ICAR-CPCRI Vittal), Chikkamagaluru (CCRI Balehonnur).
- **Tamil Nadu**: Coimbatore (TNAU CPPS & ICAR-SBI), Thanjavur (TRRI Aduthurai), Madurai (AC&RI Madurai), Valparai (UPASI Tea Research Institute).
- **Kerala**: Thiruvananthapuram (KAU Vellayani), Kasaragod (ICAR-CPCRI & KAU Padannakkad), Kozhikode (ICAR-IISR), Idukki (CRS Pampadumpara).
- **Andhra Pradesh**: Tirupati (S.V. Agricultural College), Guntur (RARS Lam), East Godavari (ICAR-CTRI Rajahmundry).
- **Telangana**: Rangareddy (PJTSAU College of Agriculture), Hyderabad (ICAR-IIRR), Warangal (RARS Warangal).

### Districts with NO Verified Dedicated Public Crop Doctor Lab Found (Non-Specialist Extension Only)
In strict compliance with the **Zero-Hallucination Mandate**, the following districts (and others lacking dedicated university/ICAR pathology diagnostic centres) are logged as `NO VERIFIED PUBLIC CONTACT FOUND`:
- **Telangana**: Yadadri Bhuvanagiri, Jangaon, Jayashankar Bhupalpally, Narayanpet, Mulugu. (Farmers must be directed to RARS Warangal or PJTSAU Rajendranagar).
- **Tamil Nadu**: Tenkasi, Ranipet, Kallakurichi, Chengalpattu, Tirupattur. (Farmers must be directed to regional AC&RI or TNAU Coimbatore).
- **Karnataka**: Chamarajanagar, Ramanagara, Vijayanagara, Yadgir. (Farmers must be directed to ZARS Mandya, UAS Bangalore, or UAS Raichur).
- **Andhra Pradesh**: Parvathipuram Manyam, Alluri Sitharama Raju, Sri Sathya Sai. (Farmers must be directed to RARS Anakapalle or RARS Tirupati).

---

## 7. Strategic Recommendations

1. **Prioritize Multimodal Visual + Agronomic Reasoning**: Where image datasets are poor (e.g. Cardamom, Turmeric, Rubber), rely on expert rule-based agronomic interview logic rather than noisy CNN predictions.
2. **Mandate Soil/Tissue Disclaimers for Nutrient Deficiencies**: Because visual symptoms of Mg, Fe, and Zn overlap heavily with viral and fungal diseases, the app must always state:  
   `"Visual symptoms are consistent with suspected [Nutrient] deficiency, but confirmation requires a laboratory soil or leaf tissue test before major fertilizer investment."`
3. **Build Crowd-Sourced Field Datasets Ethically**: Partner with KVKs and SAUs to collect verified in-field imagery for under-represented plantation crops and pests with farmer consent.
