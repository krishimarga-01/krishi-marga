# Krishi Marga — Offline ONNX Training Package

This is a standalone, portable training suite designed to train lightweight, high-accuracy plant disease classification models on any external computer (with either a **NVIDIA GPU** or standard **CPU**).

The exported model (`krishi_marga_disease_model.onnx`) uses **MobileNetV3-Small** architecture, running at **224x224 RGB**, perfectly calibrated for the **Krishi Marga React Native / Expo** mobile offline inference engine.

---

## 📋 Step-by-Step Instructions for Friends

### STEP 1 — Install Python
- Install **Python 3.10** or **Python 3.11** (64-bit) from [python.org](https://www.python.org/downloads/).
- ⚠️ During installation, check the box: **"Add python.exe to PATH"**.

### STEP 2 — Create Virtual Environment (Recommended)
Open Command Prompt (`cmd.exe`) in this folder and run:
```cmd
python -m venv venv
venv\Scripts\activate
```

### STEP 3 — Install Dependencies
```cmd
pip install -r requirements.txt
```
*(If your computer has an NVIDIA GPU with CUDA, PyTorch will automatically use it for fast training. Otherwise, it runs smoothly on CPU).*

### STEP 4 — Download the Kaggle Datasets
Download either (or both) of the official plant disease datasets from Kaggle:
1. **Dataset 1 (Merged Dataset)**: [https://www.kaggle.com/datasets/alinedobrovsky/plant-disease-classification-merged-dataset](https://www.kaggle.com/datasets/alinedobrovsky/plant-disease-classification-merged-dataset)
2. **Dataset 2 (Processed Dataset)**: [https://www.kaggle.com/datasets/harisri2005/plant-disease-processed](https://www.kaggle.com/datasets/harisri2005/plant-disease-processed)

### STEP 5 — Extract the Dataset
Extract the downloaded ZIP file anywhere on your drive, for example:
- `D:\Datasets\PlantDisease`
- OR `C:\Users\Friend\Downloads\PlantDisease`

---

## 🚀 Easy 1-Click Option (Windows)

Just double-click **`train_onnx.bat`**!

It will prompt you for the folder path where you extracted the dataset, and automatically run:
1. Inspection
2. Cleaning & Stratified Splitting (80% Train, 10% Val, 10% Test)
3. Model Training (MobileNetV3-Small with Early Stopping)
4. Held-out Test Evaluation & Confusion Matrix
5. ONNX Export & Parity Verification

---

## 🛠️ Manual Command-by-Command Option

If you prefer running step-by-step in terminal:

### Step 6: Inspect Dataset
```cmd
python scripts\inspect_dataset.py --dataset "D:\Datasets\PlantDisease"
```

### Step 7: Prepare & Split Dataset
```cmd
python scripts\prepare_dataset.py --dataset "D:\Datasets\PlantDisease"
```
*(To train on a specific crop only, e.g. Tomato: add `--crop Tomato`)*

### Step 8: Train Model
```cmd
python scripts\train.py --arch mobilenet_v3_small --epochs 15 --batch-size 32
```

### Step 9: Evaluate Model on Test Set
```cmd
python scripts\evaluate.py
```

### Step 10: Export to ONNX
```cmd
python scripts\export_onnx.py
```

### Step 11: Test the ONNX Model with a Real Photo
```cmd
python scripts\test_onnx.py --model models\onnx\krishi_marga_disease_model.onnx --image "path\to\test_leaf.jpg"
```

---

## 📦 STEP 12 — Files to Send Back to Me

Once training completes, please send me these **4 generated files**:

1. `models/onnx/krishi_marga_disease_model.onnx` *(The final trained model)*
2. `outputs/class_names.json` *(The exact class mapping)*
3. `outputs/model_metadata.json` *(Model specification & dimensions)*
4. `outputs/evaluation_report.json` *(Test accuracy and F1 metrics)*

---

## 📲 How I Will Integrate Your Model into Krishi Marga

Once you send me the files:
1. Place `krishi_marga_disease_model.onnx` into:
   `krishi-marga/assets/models/<crop>/disease.onnx`
2. Update the corresponding crop entry in `src/models/model_registry.json` with the classes from `class_names.json`.
3. The Krishi Marga app will automatically detect the offline model and run on-device inference when farmers have no internet connection!