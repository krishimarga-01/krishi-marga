# Krishi Marga — Dataset Sources & References

This document records the external dataset sources, provenance, and setup instructions for the machine learning pipelines in Krishi Marga.

> **IMPORTANT NOTICE**:
> In accordance with repository best practices, large image datasets (multi-gigabyte archives) are **not stored** in this source control repository. Datasets must be downloaded directly from their respective upstream sources using the references below.

---

## Primary Dataset References

### Dataset 1: Plant Disease Classification Merged Dataset
- **Kaggle Source**: [https://www.kaggle.com/datasets/alinedobrovsky/plant-disease-classification-merged-dataset](https://www.kaggle.com/datasets/alinedobrovsky/plant-disease-classification-merged-dataset)
- **Scope**: Multi-crop plant pathology dataset covering field and greenhouse conditions.
- **Coverage**: Tomato, Potato, Pepper Bell, Grape, Corn, Apple, Cherry, Peach, Strawberry, and related foliage classes.

### Dataset 2: Master Plant Disease Processed Dataset
- **Kaggle Source**: [https://www.kaggle.com/datasets/harisri2005/plant-disease-processed](https://www.kaggle.com/datasets/harisri2005/plant-disease-processed)
- **Scope**: Curated, deduplicated multi-crop plant pathology dataset with verified split manifests and 89 canonical disease classes.
- **Coverage**: Tomato, Paddy/Rice, Cotton, Sugarcane, Banana, Chilli, Mango, Groundnut, and other regional crops.

---

## Dataset Directory Convention for Local Training

When training or evaluating models locally using the scripts in `training/`:

1. Download the dataset archives from the above Kaggle links.
2. Extract the dataset to an external storage directory or into `training/dataset/` (which is excluded from Git tracking via `.gitignore`).
3. Point the training scripts to your local dataset path:
   ```bash
   python training/scripts/train.py --dataset "path/to/extracted/dataset" --crop "crop_name"
   ```

Refer to `training/dataset/README.md` for supported directory layouts and preprocessing options.
