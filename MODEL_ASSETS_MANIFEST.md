# KRISHI MARGA — OFFLINE ONNX MODEL ASSETS MANIFEST

> **Notice for Claude / Code Reviewers**:
> The large binary weight files (`disease.onnx` and `disease.onnx.data`) have been intentionally omitted from this lightweight source code archive (`Krishi-Marga-Claude-Source-Code.zip`) to keep the zip file small and compliant with upload limits.
> All architecture files, metadata registries, class maps, tensor preprocessors, and runtime TypeScript engines are fully included in the zip.

## 1. Summary Statistics
- Total Crops with Trained ONNX Models: 36
- Typical Architecture: MobileNetV3 / EfficientNet-Lite quantized / FP32
- Input Contract: `[1, 3, 224, 224]` (NCHW, RGB, ImageNet normalized)
- Runtime Engine in App: `src/offline/onnxEngine.ts`
- Central Registry: `src/models/model_registry.json` and `assets/models/model_registry.json`

## 2. Excluded Model Weights Inventory

| Crop Name | Model Path | Filename | Approx Size | Classes JSON | Referenced in Code? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **apple** | `assets/models/apple/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **ash_gourd** | `assets/models/ash_gourd/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **banana_fruit** | `assets/models/banana_fruit/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **banana_leaf** | `assets/models/banana_leaf/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **bitter_gourd** | `assets/models/bitter_gourd/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **black_pepper** | `assets/models/black_pepper/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **brinjal** | `assets/models/brinjal/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **cabbage** | `assets/models/cabbage/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **cassava** | `assets/models/cassava/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **cherry** | `assets/models/cherry/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **chilli** | `assets/models/chilli/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **coconut** | `assets/models/coconut/` | `disease.onnx` + `.data` | ~6.13 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **coffee** | `assets/models/coffee/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **corn** | `assets/models/corn/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **cotton** | `assets/models/cotton/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **cucumber** | `assets/models/cucumber/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **ginger** | `assets/models/ginger/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **grape** | `assets/models/grape/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **guava** | `assets/models/guava/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **jamun** | `assets/models/jamun/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **lemon** | `assets/models/lemon/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **mango** | `assets/models/mango/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **peach** | `assets/models/peach/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **pepper_bell** | `assets/models/pepper_bell/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **pomegranate** | `assets/models/pomegranate/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **potato** | `assets/models/potato/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **ragi** | `assets/models/ragi/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **rice_grain** | `assets/models/rice_grain/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **rice_leaf** | `assets/models/rice_leaf/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **snake_gourd** | `assets/models/snake_gourd/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **soybean** | `assets/models/soybean/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **strawberry** | `assets/models/strawberry/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **sugarcane** | `assets/models/sugarcane/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **tea** | `assets/models/tea/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **tomato** | `assets/models/tomato/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |
| **wheat** | `assets/models/wheat/` | `disease.onnx` + `.data` | ~6.12 MB | Present | Yes (`crops.ts`, `onnxEngine.ts`) |

### Extra ONNX Models (models/ directory)
| Model Name | Path | Approx Size | Referenced in Code? |
| :--- | :--- | :--- | :--- |
| **banana_disease.onnx** | `models/onnx/banana_disease.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **chilli_disease.onnx** | `models/onnx/chilli_disease.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **cotton_disease.onnx** | `models/onnx/cotton_disease.onnx` | ~5.82 MB | Auxiliary / Experimental |
| **maize_disease.onnx** | `models/onnx/maize_disease.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **nutrient_classifier.onnx** | `models/onnx/nutrient_classifier.onnx` | ~3.8 MB | Auxiliary / Experimental |
| **paddy_disease.onnx** | `models/onnx/paddy_disease.onnx` | ~5.81 MB | Auxiliary / Experimental |
| **pest_classifier.onnx** | `models/onnx/pest_classifier.onnx` | ~3.8 MB | Auxiliary / Experimental |
| **potato_disease.onnx** | `models/onnx/potato_disease.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **sugarcane_disease.onnx** | `models/onnx/sugarcane_disease.onnx` | ~5.81 MB | Auxiliary / Experimental |
| **tomato_disease.onnx** | `models/onnx/tomato_disease.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **model.onnx** | `models/onnx/banana/model.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **model.onnx** | `models/onnx/chilli/model.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **model.onnx** | `models/onnx/cotton/model.onnx` | ~5.82 MB | Auxiliary / Experimental |
| **model.onnx** | `models/onnx/maize/model.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **model.onnx** | `models/onnx/paddy/model.onnx` | ~5.81 MB | Auxiliary / Experimental |
| **model.onnx** | `models/onnx/potato/model.onnx` | ~0.31 MB | Auxiliary / Experimental |
| **model.onnx** | `models/onnx/sugarcane/model.onnx` | ~5.81 MB | Auxiliary / Experimental |
| **model.onnx** | `models/onnx/tomato/model.onnx` | ~0.31 MB | Auxiliary / Experimental |
