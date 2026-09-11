# KRISHI MARGA — AGRICULTURAL KNOWLEDGE & MULTI-MODAL SYSTEM ARCHITECTURE
**Document Version**: 2.0.0  
**Date**: 2026-09-11  
**Author**: Antigravity Agricultural AI Engineering & agronomy Design Team  
**Scope**: Production System Architecture for Farmer-Facing Crop Health Assistance

---

## 1. Architectural Vision

KRISHI MARGA is architected to transition from a single-image leaf classifier into an **Integrated Agricultural Decision Support System** specifically engineered for smallholder farmers across South India (Karnataka, Kerala, Tamil Nadu, Andhra Pradesh, Telangana, Puducherry).

The architecture balances three core principles:
1. **Multimodal Evidence Fusion**: Visual computer vision inference is never trusted in isolation; it is triangulated against crop growth stage, regional weather, season, and soil characteristics.
2. **Strict Verification Hierarchy**: AI suggestions are separated into **Visual Hypothesis** vs **Laboratory/Soil Confirmed Truth**.
3. **Graceful Degradation**: Zero hallucination. If a disease, pest, nutrient deficiency, pesticide, or crop doctor contact cannot be verified, the system displays an honest `"UNVERIFIED / CONSULT SPECIALIST"` advisory.

---

## 2. End-to-End System Topology

```
+───────────────────────────────────────────────────────────────────────────+
|                         FARMER CLIENT (React Native)                      |
|  [ Camera Capture ] [ 1-10 Images ] [ Crop Select: 17 Crops ] [ Language ]|
|  [ Offline ONNX Engine: MobileNetV3 (2.5ms) ] [ SQLite Offline Cache ]    |
+───────────────────────────────────────────────────────────────────────────+
                                      │
                         Multipart HTTP Upload (3.2s avg)
                                      ▼
+───────────────────────────────────────────────────────────────────────────+
|                       n8n DIAGNOSIS & REASONING SERVER                     |
|                                                                           |
|  1. Ingress Validation: Whitelist 17 Crops, Image Binary Check, Req ID    |
|  2. Image Preprocessing: Dynamic Quality, Aspect-Ratio Preserve Resizing  |
|  3. Multi-Model Gemini Failover Chain:                                    |
|     - Model 1: Gemini 3.5 Flash Lite (Primary Low-Latency Engine)         |
|     - Model 2: Gemini 2.5 Flash (First Resilient Fallback)                |
|     - Model 3: Gemini 1.5 Pro (Deep Agronomic Reasoning Fallback)         |
|  4. Structured Response Validation & Bounds Checking (0.0 <= c <= 1.0)    |
+───────────────────────────────────────────────────────────────────────────+
                                      │
                                      ▼
+───────────────────────────────────────────────────────────────────────────+
|                      KNOWLEDGE FUSION & DECISION MATRIX                   |
|                                                                           |
|  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐  |
|  │  CROP_DISEASE_   │  │   CROP_PEST_     │  │ CROP_NUTRIENT_DEFICIENCY│  |
|  │    MASTER.csv    │  │   MASTER.csv     │  │       MASTER.csv        │  |
|  └──────────────────┘  └──────────────────┘  └─────────────────────────┘  |
|  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐  |
|  │ SOIL_HEALTH_     │  │   PESTICIDE_     │  │   SOUTH_INDIA_CROP_     │  |
|  │   MASTER.csv     │  │   MASTER.csv     │  │   DOCTOR_DIRECTORY.csv  │  |
|  └──────────────────┘  └──────────────────┘  └─────────────────────────┘  |
+───────────────────────────────────────────────────────────────────────────+
                                      │
                                      ▼
+───────────────────────────────────────────────────────────────────────────+
|                           FARMER RESULT INTERFACE                         |
|  - Crop & Health Status: Diseased / Pest Infested / Nutrient Stress       |
|  - Model Confidence: High / Medium / Low / Uncertain                      |
|  - Likely Cause: Pathogen | Pest | Nutrient | Soil | Water | Environmental|
|  - Organic / Non-Pesticidal Prevention Advice                             |
|  - Approved CIBRC Agrochemical Guidance (Only When Verified)              |
|  - Nearby Accredited Crop Doctor Escalation (Phone, Directions)           |
+───────────────────────────────────────────────────────────────────────────+
```

---

## 3. Data Lifecycle Progression Standard (Section 27)

To prevent premature claims or shipping unverified models, every agricultural disorder must progress through **Six Audited Lifecycle Gates**:

```
[ Gate 1: DATASET_FOUND ] 
       │ Research inventory identifies public images (Kaggle, ICAR, SAUs).
       ▼
[ Gate 2: DATASET_CLEANED ] 
       │ Zero corruptions, duplicate hashes purged, 0% cross-split leakage verified.
       ▼
[ Gate 3: MODEL_TRAINED ] 
       │ Loss converges on training split, checkpoint saved (e.g. MobileNetV3).
       ▼
[ Gate 4: MODEL_VALIDATED ] 
       │ Evaluated on out-of-sample test partition (Accuracy, Macro F1, ONNX parity).
       ▼
[ Gate 5: MODEL_DEPLOYED ] 
       │ ONNX runtime package compiled into app assets / edge runtime.
       ▼
[ Gate 6: APP_SUPPORTED ] 
       │ Live frontend UI exposes verified diagnosis and agronomic recommendations.
```

> **Rule**: An item at `DATASET_FOUND` status must NEVER be advertised in the UI as `APP_SUPPORTED`.

---

## 4. Staged Implementation Prioritization (Section 28)

1. **Priority 1 (Core Field Crops — Active Models)**:
   - **Cotton**: MobileNetV3 ONNX active (98.04% acc, 4 classes: bacterial blight, curl virus, fusarium wilt, healthy).
   - **Tomato**: 11 classes benchmarked on 32,500+ images.
   - **Coconut**: 5 classes verified on 5,735 images (Bud rot, gray leaf spot, leaf rot, stem bleeding).
   - **Paddy / Rice**: Leaf blast, neck blast, sheath blight, bacterial leaf blight.
2. **Priority 2 (High-Value South Indian Commercial & Plantation Crops)**:
   - Chilli (Fruit rot / dieback, leaf curl virus complex).
   - Sugarcane (Red rot, shoot borer).
   - Coffee (Leaf rust *Hemileia vastatrix*).
   - Tea (Blister blight *Exobasidium vexans*).
   - Arecanut (Koleroga fruit rot *Phytophthora meadii*).
   - Black Pepper (Quick wilt foot rot *Phytophthora capsici*).
3. **Priority 3 (High-Impact Insect Pest Recognition)**:
   - Rice Brown Plant Hopper (BPH) and Yellow Stem Borer.
   - Fall Armyworm (FAW) in Maize.
   - Pink Bollworm in Cotton.
   - Coconut Rhinoceros Beetle and Red Palm Weevil.
4. **Priority 4 (Nutrient Deficiency vs Disease Differential)**:
   - Visual N, P, K, Zn deficiency recognition in Maize.
   - Blossom End Rot (Calcium deficiency) in Tomato.
   - Iron chlorosis in Sugarcane (calcareous soil differentiation).
   - Mandatory rule: Visual symptom must present lab soil-test recommendation disclaimer.
5. **Priority 5 (Pesticide Package & Label OCR Reader)**:
   - On-device text recognition (OCR) of printed active ingredient strings.
   - Exact entity mapping against [`PESTICIDE_MASTER.csv`](file:///C:/Users/Prathach%20Raj%20P/.gemini/antigravity/scratch/krishi-marga/agricultural_knowledge/PESTICIDE_MASTER.csv) (CIBRC regulatory schedules).
   - Zero guessing: Reject blurry or partial labels.

---

## 5. Farmer-Friendly Navigation & Modular UI Specification (Section 22)

The mobile application architecture provides a dedicated **"CROP HEALTH"** hub containing 8 farmer-friendly modules:

```
┌────────────────────────────────────────────────────────┐
│                      KRISHI MARGA                      │
│                  CROP HEALTH PLATFORM                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [ 🔬 1. Diagnose Crop ]    [ 🐛 2. Identify Pest ]    │
│  Take photo of leaf         Photograph insect or larva │
│                                                        │
│  [ 🏷️ 3. Identify Pesticide ] [ 🧪 4. Nutrient Check ]  │
│  Scan chemical container    Identify yellowing leaves  │
│                                                        │
│  [ 🌾 5. Fertilizer Guide ]  [ 📚 6. Pest/Disease Lib ] │
│  Soil test based nutrition  Comprehensive 17 crops lib │
│                                                        │
│  [ 👨‍⚕️ 7. Nearby Crop Doctor] [ ⚠️ 8. Local Alerts ]     │
│  Call verified specialists  Active regional outbreaks  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Module Specifications:
1. **Diagnose Crop**: Online Gemini failover pipeline or offline MobileNetV3 inference.
2. **Identify Pest**: Insect identification with damage symptoms and biological control.
3. **Identify Pesticide**: OCR chemical label reader displaying CIBRC approved uses, toxicity triangle, and waiting period (PHI).
4. **Nutrient Deficiency**: Visual deficiency diagnostic with leaf position breakdown and disclaimer.
5. **Fertilizer Guidance**: Package of practices guidance cross-referenced with soil type.
6. **Pest & Disease Library**: Encyclopedic offline reference covering all 17 South Indian crops in 6 languages.
7. **Nearby Crop Doctors**: Directory of verified university plant pathology departments and ICAR institutes.
8. **Local Crop Alerts**: Privacy-preserving regional outbreak notifications.

---

## 6. Diagnosis Result Presentation Matrix (Section 23 & 24)

When a diagnosis is rendered, the UI renders only verified data blocks:

| UI Block | Field Name | Presentation Standard | Mandatory Disclosure / Formatting |
|---|---|---|---|
| **Header** | Crop & Health Status | Bold Green (Healthy) / Amber (Moderate) / Red (Severe) | 17 verified crops only |
| **Identity** | Condition Name | Common Local Name + Latin Binomial in italics | e.g. *Anthracnose (Colletotrichum capsici)* |
| **Confidence** | Model Confidence | Visual meter: High (>0.80), Medium (0.50-0.80), Low (<0.50) | Explicitly labeled: **"AI Model Confidence"** (never implies 100% field proof) |
| **Diagnosis Type** | Visual vs Laboratory | Icon badge | **"Visual Symptom Analysis — Not a Certified Lab Assay"** |
| **Etiology** | Likely Cause | Category tag | `PATHOGEN` \| `PEST` \| `NUTRIENT` \| `SOIL` \| `WEATHER` |
| **Action** | What To Do | Step 1, 2, 3 actionable bullets | Immediate non-chemical / cultural steps first |
| **Prevention** | Preventive Measures | Bullets | Seed treatment, spacing, resistant varieties, crop rotation |
| **Agrochemical** | Verified Pesticide | Only displayed if verified CIBRC claim exists | Product, active ingredient, dilution, waiting period (PHI) |
| **Specialist** | Crop Doctor Escalation | Card with Name, Institute, Phone, Call Button | Verified contact for farmer's district |
| **Provenance** | Scientific Source | Footnote | e.g. *"Source: ICAR-IIHR Bengaluru / TNAU Agritech Portal"* |

---

## 7. Zero-Hallucination Guardrails Summary

```
                  ┌─────────────────────────────────────┐
                  │    IS CONFIDENCE >= THRESHOLD?      │
                  └──────────────────┬──────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                    YES                              NO
                     │                               │
                     ▼                               ▼
     ┌───────────────────────────────┐  ┌─────────────────────────────────┐
     │ Render Verified Disease/Pest  │  │ Display "Uncertain Diagnosis"   │
     │ Card with Cultural & Bio IPM  │  │ Prompt farmer to take close-up  │
     └───────────────┬───────────────┘  │ or contact nearby Crop Doctor   │
                     │                  └─────────────────────────────────┘
                     ▼
     ┌───────────────────────────────┐
     │ DOES CIBRC HAVE VERIFIED USE? │
     └───────────────┬───────────────┘
                     │
             ┌───────┴───────┐
            YES              NO
             │               │
             ▼               ▼
 ┌──────────────────────┐  ┌────────────────────────────────────────┐
 │ Render Active        │  │ Hide pesticide block. Display:         │
 │ Ingredient & PHI     │  │ "No approved CIBRC chemical label claim│
 │ from PESTICIDE_MASTER│  │ found. Consult your local KVK/AEO."    │
 └──────────────────────┘  └────────────────────────────────────────┘
```
