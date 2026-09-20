# Krishi Marga — Dataset Sources & Setup Guide

This directory can hold your downloaded and extracted Kaggle datasets, OR you can store them anywhere else on your computer (e.g. `D:\Datasets\PlantDisease`) and pass that folder path using `--dataset "<path>"`.

---

## 1. Supported Kaggle Datasets

### Dataset 1: Plant Disease Classification Merged Dataset
- **URL**: https://www.kaggle.com/datasets/alinedobrovsky/plant-disease-classification-merged-dataset
- **Description**: High-diversity multi-crop plant pathology dataset covering field and greenhouse conditions.
- **Common Crops**: Tomato, Potato, Pepper Bell, Grape, Corn, Apple, Cherry, Peach, Strawberry.

### Dataset 2: Master Plant Disease Processed Dataset
- **URL**: https://www.kaggle.com/datasets/harisri2005/plant-disease-processed
- **Description**: Curated, deduplicated multi-crop plant pathology dataset with verified split manifests and 89 canonical disease classes.
- **Common Crops**: Tomato, Paddy/Rice, Cotton, Sugarcane, Banana, Chilli, Mango, Groundnut.

---

## 2. Supported Folder Layouts

The Krishi Marga training pipeline automatically detects any of the following directory structures:

### Layout A: Flat ImageFolder format (PlantVillage style)
```
DatasetRoot/
├── Tomato___Early_blight/
│   ├── image1.jpg
│   └── image2.jpg
├── Tomato___Late_blight/
├── Tomato___healthy/
├── Pepper__bell___Bacterial_spot/
└── Potato___Early_blight/
```

### Layout B: Nested Crop/Disease format
```
DatasetRoot/
├── Tomato/
│   ├── Early Blight/
│   │   └── img1.jpg
│   ├── Late Blight/
│   └── Healthy/
├── Rice/
│   ├── Blast/
│   ├── Brown Spot/
│   └── Healthy/
```

### Layout C: Pre-split Train/Val/Test directories
```
DatasetRoot/
├── train/
│   ├── Tomato___Early_blight/
│   └── Tomato___healthy/
├── val/
└── test/
```

---

## 3. How to Run Inspection

```bash
python scripts/inspect_dataset.py --dataset "path/to/extracted/dataset"
```