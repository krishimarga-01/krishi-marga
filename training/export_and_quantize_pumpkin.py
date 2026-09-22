import os
import json
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
import onnx
import onnxruntime as ort
from onnxruntime.quantization import quantize_dynamic, QuantType

DATA_DIR = r"D:\krishi_marga_data\processed\pumpkin"
TEST_DIR = os.path.join(DATA_DIR, "test")
OUTPUT_DIR = r"training_output"
CANDIDATES_DIR = os.path.join(OUTPUT_DIR, "onnx_candidates", "pumpkin")
os.makedirs(CANDIDATES_DIR, exist_ok=True)

best_model_path = os.path.join(OUTPUT_DIR, "checkpoints", "pumpkin_best.pth")

eval_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

test_ds = datasets.ImageFolder(TEST_DIR, transform=eval_transform)
class_names = test_ds.classes
num_classes = len(class_names)
print(f"[*] Detected {num_classes} classes: {class_names}")
print(f"[*] Test samples: {len(test_ds)}")

test_loader = DataLoader(test_ds, batch_size=32, shuffle=False, num_workers=0)

# Build architecture and load weights
device = torch.device("cpu")
model = models.mobilenet_v3_small(weights=None)
in_features = model.classifier[3].in_features
model.classifier[3] = nn.Linear(in_features, num_classes)
model.load_state_dict(torch.load(best_model_path, map_location=device))
model.eval()
print(f"[+] Loaded trained weights from {best_model_path}")

# PyTorch Test Accuracy
correct = 0
total = 0
with torch.no_grad():
    for images, labels in test_loader:
        outputs = model(images)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels).item()
        total += labels.size(0)

py_acc = correct / total
print(f"[+] PyTorch Test Accuracy: {py_acc * 100:.2f}% ({correct}/{total})")

# Export to ONNX with Softmax attached as required by mobile contract
class ModelWithSoftmax(nn.Module):
    def __init__(self, base):
        super().__init__()
        self.base = base
        self.softmax = nn.Softmax(dim=1)
    def forward(self, x):
        return self.softmax(self.base(x))

export_model = ModelWithSoftmax(model)
export_model.eval()

fp32_onnx_path = os.path.join(CANDIDATES_DIR, "disease_fp32.onnx")
dummy_input = torch.randn(1, 3, 224, 224, device=device)

torch.onnx.export(
    export_model,
    dummy_input,
    fp32_onnx_path,
    input_names=["input_image"],
    output_names=["probabilities"],
    opset_version=14,
    do_constant_folding=True
)
print(f"[+] Exported FP32 ONNX to {fp32_onnx_path}")

# Validate FP32 with onnxruntime
sess_fp32 = ort.InferenceSession(fp32_onnx_path, providers=['CPUExecutionProvider'])
out_fp32 = sess_fp32.run(["probabilities"], {"input_image": dummy_input.numpy()})[0]
assert out_fp32.shape == (1, num_classes), f"Shape mismatch: {out_fp32.shape}"
print("[+] FP32 ONNX Runtime validation passed!")

# Quantize to INT8
int8_onnx_path = os.path.join(CANDIDATES_DIR, "disease_int8.onnx")
quantize_dynamic(
    model_input=fp32_onnx_path,
    model_output=int8_onnx_path,
    weight_type=QuantType.QUInt8
)
print(f"[+] Quantized INT8 ONNX to {int8_onnx_path}")

sess_int8 = ort.InferenceSession(int8_onnx_path, providers=['CPUExecutionProvider'])
out_int8 = sess_int8.run(["probabilities"], {"input_image": dummy_input.numpy()})[0]
assert out_int8.shape == (1, num_classes), f"INT8 Shape mismatch: {out_int8.shape}"
print("[+] INT8 ONNX Runtime validation passed!")

# Empirical validation on the test split
print("[*] Running full test split validation on both FP32 and INT8 ONNX graphs...")
fp32_corr = 0
int8_corr = 0
for images, labels in test_loader:
    imgs_np = images.numpy()
    lbls_np = labels.numpy()
    for i in range(len(imgs_np)):
        inp = imgs_np[i:i+1]
        t = lbls_np[i]
        p32 = np.argmax(sess_fp32.run(["probabilities"], {"input_image": inp})[0])
        p8 = np.argmax(sess_int8.run(["probabilities"], {"input_image": inp})[0])
        if p32 == t:
            fp32_corr += 1
        if p8 == t:
            int8_corr += 1

fp32_acc = fp32_corr / total
int8_acc = int8_corr / total
fp32_size = os.path.getsize(fp32_onnx_path) / (1024 * 1024)
int8_size = os.path.getsize(int8_onnx_path) / (1024 * 1024)

print(f"\n--- ONNX EMPIRICAL METRICS ---")
print(f"FP32 Size: {fp32_size:.2f} MB | Test Acc: {fp32_acc * 100:.2f}%")
print(f"INT8 Size: {int8_size:.2f} MB | Test Acc: {int8_acc * 100:.2f}%")

if int8_acc >= fp32_acc - 0.02:
    selected = "INT8"
    selected_path = int8_onnx_path
    selected_acc = int8_acc
    selected_size = int8_size
else:
    selected = "FP32"
    selected_path = fp32_onnx_path
    selected_acc = fp32_acc
    selected_size = fp32_size

print(f"[+] Selected Model: {selected} ({selected_size:.2f} MB, {selected_acc * 100:.2f}% acc)")

# Save final self-contained ONNX
prod_onnx = os.path.join(CANDIDATES_DIR, "disease.onnx")
import shutil
shutil.copy2(selected_path, prod_onnx)

display_classes = [c.replace('_', ' ').title() for c in class_names]
with open(os.path.join(CANDIDATES_DIR, "classes.json"), 'w', encoding='utf-8') as f:
    json.dump(display_classes, f, indent=2)

report = {
    "crop": "pumpkin",
    "dataset_id": "tahmidmir/pumpkin-leaf-diseases-dataset-from-bangladesh",
    "license": "CC BY 4.0",
    "architecture": "MobileNetV3-Small",
    "classes": display_classes,
    "num_classes": num_classes,
    "raw_images": 2000,
    "usable_images": 1999,
    "train_images": 1399,
    "val_images": 299,
    "test_images": 301,
    "fp32_size_mb": round(fp32_size, 2),
    "fp32_test_accuracy": round(fp32_acc * 100, 2),
    "int8_size_mb": round(int8_size, 2),
    "int8_test_accuracy": round(int8_acc * 100, 2),
    "selected_model_type": selected,
    "selected_model_size_mb": round(selected_size, 2),
    "selected_model_test_accuracy": round(selected_acc * 100, 2),
    "final_onnx_path": prod_onnx
}

with open("reports/pumpkin_training_results.json", 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print("\n=== SUCCESS: ONNX PIPELINE COMPLETE FOR PUMPKIN ===")
print(json.dumps(report, indent=2))
