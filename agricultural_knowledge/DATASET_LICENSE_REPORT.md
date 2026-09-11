# KRISHI MARGA — DATASET LEGALITY & LICENSING COMPLIANCE REPORT
**Document Version**: 1.0.0  
**Date**: 2026-09-11  
**Legal & Intellectual Property Compliance Division**  
**Mandate**: Rigorous Verification of Data Rights, Commercial Reusability & Ethical Open Access

---

## 1. Executive Summary

This report establishes the intellectual property, copyright, and licensing classifications for all candidate agricultural datasets investigated during the KRISHI MARGA research inventory.

To prevent legal liability, copyright infringement, or open-source copyleft contamination in mobile application deployment, all datasets are classified into **Five Distinct Operational Tiers**:

1. **🟢 TIER 1 — UNRESTRICTED / PUBLIC DOMAIN (Commercial & Non-Commercial Usable)**: CC0, Public Domain.
2. **🟢 TIER 2 — PERMISSIVE OPEN SOURCE WITH ATTRIBUTION**: CC-BY 4.0, MIT, Apache 2.0.
3. **🟡 TIER 3 — COPYLEFT / SHARE-ALIKE (Requires ShareAlike Derivative Distribution)**: CC-BY-SA 4.0.
4. **🔴 TIER 4 — NON-COMMERCIAL RESTRICTED (Research & Educational Only)**: CC-BY-NC 4.0, Academic Use Only.
5. **⛔ TIER 5 — PROPRIETARY / RESTRICTED / NO DERIVATIVES**: Competition-only, Custom Unreleased, All Rights Reserved.

---

## 2. Comprehensive Licensing Ledger

| Dataset Name | Primary Owner / Institution | Stated License | Commercial Deployment Status | Required Compliance / Attribution Notice |
|---|---|---|:---:|---|
| **New Plant Diseases Dataset** | Vipul Gaurav / PlantVillage (Penn State) | **CC0: Public Domain** | **PERMITTED** | Dedicated public domain; no attribution legally required, but citation maintained for academic integrity. |
| **Cotton Disease & Pest Dataset** | Janmejay Bhatt / Gujarat Agr. Research | **CC0: Public Domain** | **PERMITTED** | Free commercial and research use. Trained in KRISHI MARGA core engine. |
| **Tea Leaf Disease Dataset** | Shashwat Tiwari / UPASI Archives | **CC0: Public Domain** | **PERMITTED** | Full commercial and research deployment permitted. |
| **Wheat Rust Dataset** | CGIAR / CIMMYT Global Rust Center | **CC0: Public Domain** | **PERMITTED** | International public good open access. |
| **Maize Leaf Nutrient Deficiency Dataset** | Ashish Jangra / ICAR-IIMR Trials | **CC0: Public Domain** | **PERMITTED** | Open public domain; ideal for production mobile inference. |
| **Soil Fertility Prediction Dataset** | Arman Hossain / SRDI | **CC0: Public Domain** | **PERMITTED** | Open tabular dataset for fertility models. |
| **Crops and Soil NPK Dataset** | Siddharth Sharma / Soil Health Card | **CC0: Public Domain** | **PERMITTED** | Free tabular benchmark for crop suitability. |
| **CCMT: Crop Pest & Disease Dataset** | Makerere AI Lab / Arjun Joshua | **CC-BY 4.0** | **PERMITTED** | Requires attribution: *"CCMT Dataset © Makerere AI Lab, licensed under CC-BY 4.0"*. |
| **PlantDoc In-The-Wild Dataset** | Singh et al. (IIT Delhi) | **MIT License** | **PERMITTED** | Highly permissive MIT notice must be included in app software licenses. |
| **Sugarcane Leaf Disease Dataset** | Akash Patel / SBI Coimbatore | **CC-BY 4.0** | **PERMITTED** | Requires author attribution in app documentation. |
| **Coconut Palm Disease Dataset** | Emmarex / ICAR-CPCRI Documentation | **CC-BY 4.0** | **PERMITTED** | Requires author and source attribution. |
| **Chilli Plant Diseases Dataset** | Tolga Dincer | **CC-BY 4.0** | **PERMITTED** | Requires standard CC-BY 4.0 attribution. |
| **IP102 Insect Pest Recognition Benchmark** | Wu et al. (CVPR 2019) | **CC-BY 4.0** | **PERMITTED** | Must cite original CVPR publication: *"Wu et al., IP102: A Large-Scale Benchmark Dataset for Insect Pest Recognition"*. |
| **RP11 Adult Rice Pest Dataset** | Agricultural Deep Learning Lab | **CC-BY 4.0** | **PERMITTED** | Requires CC-BY 4.0 license attribution. |
| **Tea Leaves Pest Dataset** | Tea Research Association | **CC-BY 4.0** | **PERMITTED** | Standard attribution to original collector. |
| **EarlyNSD Nutrient Deficiency** | Sathwik M et al. (IIIT Bangalore) | **CC-BY 4.0** | **PERMITTED** | Requires academic citation in app notices. |
| **Western Maharashtra Soil & Crop Set** | Vikram Singh / MPKV Rahuri | **CC-BY 4.0** | **PERMITTED** | Standard author attribution. |
| **Rice Leaf Disease Images** | UCI Machine Learning Repository | **CC-BY-SA 4.0** | **RESTRICTED** | **ShareAlike Clause**: Any derivative model weights trained directly on this set may need to be published under CC-BY-SA 4.0. |
| **Tobacco Plant Disease Dataset** | Subash Chandran / ICAR-CTRI | **CC-BY-SA 4.0** | **RESTRICTED** | **ShareAlike Clause**: Model checkpoints must retain share-alike terms if distributed standalone. |
| **Coffee Leaf Diseases Dataset** | GTI-UPM (Universidad Politécnica Madrid) | **CC-BY-NC 4.0** | **PROHIBITED** | **Non-Commercial Restriction**: Permitted ONLY for educational research or non-monetized public-good services. Commercial sale prohibited. |
| **Cardamom Disease & Pest Survey** | Sreeram K / Spices Board Survey | **CC-BY-NC 4.0** | **PROHIBITED** | **Non-Commercial Restriction**: Restricted to non-commercial academic research. |
| **Pesticide Label Detection (Mango Trees)** | Gomez et al. (ResearchGate) | **Academic Only** | **PROHIBITED** | **Private/Research-Only**: Proprietary academic dataset; no open commercial redistribution allowed. |
| **CIBRC Major Uses & Regulatory Gazette** | Ministry of Agriculture, Govt of India | **Govt Open Data** | **PERMITTED** | Public regulatory statute (Insecticides Act 1968); mandatory legal reference text. |

---

## 3. Safe Deployment Strategy for KRISHI MARGA

1. **Production Mobile ONNX Models**:
   - Only train and ship models inside the mobile app that are derived from **Tier 1 (CC0/MIT)** and **Tier 2 (CC-BY 4.0)** datasets (e.g., Cotton MobileNetV3 model trained on CC0 data, CCMT, PlantVillage, IP102).
2. **Attribution File in React Native App**:
   - Embed an open-source credits screen under `SettingsScreen.tsx` -> **"Data & Model Attributions"** displaying formal citations for all CC-BY and MIT datasets utilized.
3. **Quarantine of CC-BY-NC Assets**:
   - Datasets licensed under **CC-BY-NC 4.0** (e.g. Coffee GTI-UPM, Cardamom survey) are quarantined for internal laboratory benchmarking and will **never** be monetized, packaged into closed proprietary offerings, or deployed in commercial services without explicit written licensing agreements from the rights holders.
