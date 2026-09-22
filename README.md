# 🏆 Smart India Hackathon 2026

- **Team Name**: `P_Hackaathon Hashiras`
- **Team ID**: `143514`
- **Team Members**:
  - **LEADER** — Prathick Raj P
  - **TEAM_MEMBER** — Kushal. N
  - **TEAM_MEMBER** — Preetham
  - **TEAM_MEMBER** — Sangeetha
  - **TEAM_MEMBER** — Vineeth
  - **TEAM_MEMBER** — Adhisheshan

---

# 🌾 Krishi Marga

AI-Powered Crop Disease, Pest & Agricultural Intelligence Platform for South Indian Farmers

---

## 🌾 Overview

**Krishi Marga** is a mobile and AI-powered agricultural health assistant designed specifically for South Indian farming ecosystems (Karnataka, Tamil Nadu, Andhra Pradesh, Telangana, Kerala). It empowers farmers with instant, high-precision crop disease diagnosis, pest identification, nutrient deficiency analysis, and actionable regional treatments in their native languages.

### 🌟 Key Capabilities
- **76 South Indian Crop Catalogue**: Complete agro-climatic coverage across Cereals, Pulses, Oilseeds, Commercial crops, Vegetables, Fruits, Plantation crops, Spices, and others.
- **Multi-Image Diagnosis (1–10 Images)**: Farmers can upload up to 10 leaves or disease angles with client-side image compression, sharpness validation, and ensembled consensus diagnosis.
- **Dual Diagnosis Architecture**:
  - **Online Cloud AI**: Powered by an automated **n8n workflow** orchestrating **Gemini 3.5 Flash Lite** with strict JSON schemas, multi-model failover, and regional treatment advice.
  - **Offline Edge AI**: Powered by lightweight **ONNX MobileNetV3** models running locally on-device without internet connectivity (8 trained and verified crop models ready on-device).
- **Comprehensive Agricultural Knowledge**: Curated masters covering diseases, pests, bio-pesticides, chemical controls, fertilizer schedules, and soil health guidelines.
- **Crop Doctor Directory**: Verified agricultural university scientists, KVK (Krishi Vigyan Kendra) extension officers, and district-level specialists.
- **6 Vernacular Languages**: Fully localized in English, Kannada (ಕನ್ನಡ), Tamil (தமிழ்), Telugu (తెలుగు), Malayalam (മലയാളം), and Hindi (हिन्दी).

---

## 🏗️ Architecture & Technology Stack

```
                               Mobile Application (React Native / Expo SDK 57)
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
        [Internet Available]                     [No Internet / Offline]
                 │                                         │
                 ▼                                         ▼
         n8n Cloud Webhook                        Local ONNX Engine
        (/webhook/detect-disease)                 (onnxEngine.ts)
                 │                                         │
                 ▼                                         ▼
      Gemini 3.5 Flash Lite                   8x MobileNetV3 ONNX Models
      (Structured JSON Schema)                (Sub-10ms CPU latency)
                 │                                         │
                 └────────────────────┬────────────────────┘
                                      │
                                      ▼
                        Standardized Diagnosis Result
                        (Disease, Severity, Care, Audio)
```

- **Frontend**: React Native, Expo SDK 57, TypeScript, React Navigation (Native Stack & Bottom Tabs), Expo Camera, Safe Area Context, Async Storage.
- **Cloud AI / Backend**: n8n workflow engine (`current_wf.json`), Google Gemini API (`gemini-2.5-flash-lite`), Webhooks, RESTful JSON.
- **Edge AI & Machine Learning**: PyTorch 2.14, Torchvision, ONNX Runtime (`opset 14/18`), MobileNetV3-Small architectures.
- **Knowledge Base**: Curated South Indian agricultural data matrices (ICAR, TNAU, UAS Bangalore, ANGRAU guidelines).

---

## 📁 Repository Structure

```
krishi-marga/
├── assets/                           # App icons, splash video, and 76 crop illustrations
│   ├── crops/                        # 76 high-resolution crop icons
│   ├── logo/                         # Krishi Marga branding logo
│   └── splash/                       # Splash video animation
├── src/                              # React Native / Expo Source Code
│   ├── config/                       # Crop catalogue and application configuration
│   │   └── crops.ts                  # 76 South Indian crop definitions & vernacular labels
│   ├── screens/                      # Mobile application screens
│   │   ├── SplashScreen.tsx          # Initial onboarding splash animation
│   │   ├── HomeScreen.tsx            # Main dashboard with crop stats and quick action
│   │   ├── CropSelectScreen.tsx      # 76-crop search, category filtering & selection
│   │   ├── CameraCaptureScreen.tsx   # Multi-image capture, preview & quality checks
│   │   ├── ResultScreen.tsx          # Structured diagnosis, treatments & remedies
│   │   ├── NearbyHelpScreen.tsx      # District KVKs & agricultural university contacts
│   │   ├── HistoryScreen.tsx         # Cached past diagnoses with offline storage
│   │   └── SettingsScreen.tsx        # Language switch and connection preferences
│   ├── services/                     # Backend and helper APIs
│   │   ├── config.ts                 # Dynamic IP and production backend resolver
│   │   ├── diagnosisApi.ts           # Multipart image upload & n8n webhook caller
│   │   ├── expertService.ts          # Crop doctor and KVK directory queries
│   │   ├── i18n.tsx                  # Multilingual translation provider
│   │   └── imageQualityService.ts    # Blur, brightness & dimension validator
│   ├── offline/                      # Local on-device AI inference
│   │   └── onnxEngine.ts             # ONNX Runtime model loader and predictor
│   ├── storage/                      # SQLite / AsyncStorage case persistence
│   ├── locales/                      # Multilingual JSON dictionaries (en, hi, kn, ml, ta, te)
│   └── theme/                        # Design system tokens, color palettes & spacing
├── models/                           # Machine Learning & ONNX artifacts
│   ├── onnx/                         # 8 Production MobileNetV3 ONNX models & metadata
│   │   ├── banana/                   # Banana disease model, labels, metadata
│   │   ├── chilli/                   # Chilli disease model, labels, metadata
│   │   ├── cotton/                   # Cotton disease model (98.04% acc)
│   │   ├── maize/                    # Maize disease model, labels, metadata
│   │   ├── paddy/                    # Paddy rice disease model, labels, metadata
│   │   ├── potato/                   # Potato disease model, labels, metadata
│   │   ├── sugarcane/                # Sugarcane disease model, labels, metadata
│   │   └── tomato/                   # Tomato disease model, labels, metadata
├── agricultural_knowledge/           # Curated South Indian agricultural data masters
│   ├── CROP_DISEASE_MASTER.csv       # Complete disease symptoms & treatments
│   ├── CROP_PEST_MASTER.csv          # Pest identification & lifecycle management
│   ├── PESTICIDE_MASTER.csv          # Approved CIBRC chemical & biological controls
│   ├── FERTILIZER_KNOWLEDGE_MASTER.csv # Recommended NPK & micronutrient schedules
│   └── SOUTH_INDIA_CROP_DOCTOR_DIRECTORY.csv # District-level agricultural officers
├── training/                         # Python model training & ONNX export scripts
│   ├── train_crop_model.py           # PyTorch MobileNetV3 fine-tuning pipeline
│   ├── export_and_validate_onnx.py   # PyTorch to ONNX export & latency benchmarking
│   └── audit_and_clean_datasets.py   # Exact & perceptual image deduplication
├── current_wf.json                   # Production-hardened n8n diagnosis workflow
├── .env.example                      # Template for environment configuration
├── package.json                      # Project dependencies & scripts
├── tsconfig.json                     # TypeScript compiler configuration
└── app.json                          # Expo project manifest and permissions
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0 or higher
- **npm** or **yarn**
- **Python**: 3.10+ (for model training/testing)
- **Expo Go App** (installed on an Android/iOS physical device) OR Android Studio Emulator

### 2. Frontend Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/krishimarga-01/krishi-marga.git
   cd krishi-marga
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   Set `EXPO_PUBLIC_BACKEND_URL` to your machine's LAN IP if testing with a physical device:
   ```env
   EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:5678/webhook/detect-disease
   ```

4. **Start the Expo Development Server**:
   ```bash
   npx expo start
   ```
   - Press `a` for Android Emulator.
   - Scan the QR code with the **Expo Go** app on your physical phone.

---

### 3. Backend (n8n Cloud AI) Setup
1. **Install n8n**:
   ```bash
   npm install -g n8n
   ```
2. **Start n8n**:
   ```bash
   n8n start
   ```
   n8n will be accessible at `http://localhost:5678`.
3. **Import Workflow**:
   - Open n8n in your browser.
   - Go to **Workflows** → **Import from File**.
   - Select `current_wf.json` from this repository.
   - Add your **Google Gemini API Key** under Credentials.
   - Click **Activate Workflow**.

---

### 4. Running Offline ONNX Models
To run inference directly with Python on any of the 8 included models:
```bash
python -c "
import onnxruntime as ort, numpy as np
session = ort.InferenceSession('models/onnx/cotton/model.onnx')
dummy = np.random.randn(1, 3, 224, 224).astype(np.float32)
output = session.run(None, {session.get_inputs()[0].name: dummy})
print('Output logits shape:', output[0].shape)
"
```

---

## 📊 Offline ONNX Models Performance

| Crop Model | Architecture | Classes | Latency (1 img) | Latency (10 imgs) | File Size | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cotton** | MobileNetV3 | 4 | 1.06 ms | 8.86 ms | 5.82 MB | Production Ready (98.04% acc) |
| **Paddy / Rice** | MobileNetV3 | 3 | 1.13 ms | 8.24 ms | 5.81 MB | Baseline Verified |
| **Sugarcane** | MobileNetV3 | 3 | 1.16 ms | 8.34 ms | 5.81 MB | Baseline Verified |
| **Tomato** | MobileNetV3 | 11 | 1.25 ms | 13.05 ms | 5.81 MB | Baseline Verified |
| **Chilli** | MobileNetV3 | 8 | 1.34 ms | 8.93 ms | 5.81 MB | Baseline Verified |
| **Maize** | MobileNetV3 | 4 | 1.25 ms | 8.83 ms | 5.81 MB | Baseline Verified |
| **Banana** | MobileNetV3 | 4 | 1.02 ms | 8.80 ms | 5.81 MB | Baseline Verified |
| **Potato** | MobileNetV3 | 3 | 0.98 ms | 8.40 ms | 5.81 MB | Baseline Verified |

---

## 🔒 Security & Data Privacy
- No hardcoded API keys or personal credentials are stored in this repository.
- Sensitive environment variables are read dynamically via `process.env` and `.env`.
- Heavy training image datasets (>1.9 GB) are intentionally excluded from the Git tree; complete dataset inventories and provenance records are documented under `agricultural_knowledge/` and `dataset_research/`.

---

## 📄 License
This project is developed for the Smart India Hackathon (SIH) 2024. All rights reserved.
