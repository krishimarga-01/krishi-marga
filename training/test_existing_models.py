import os
import json
import numpy as np
import onnxruntime as ort

base = r"C:\Users\Prathach Raj P\.gemini\antigravity\scratch\krishi-marga\assets\models"
crops = [d for d in os.listdir(base) if os.path.isdir(os.path.join(base, d))]

dummy_input = np.random.randn(1, 3, 224, 224).astype(np.float32)

print(f"{'Crop':<18} | {'ONNX Status':<12} | {'Input Shape':<18} | {'Num Classes':<12} | {'Inference Latency':<18}")
print("-" * 85)

for crop in sorted(crops):
    model_path = os.path.join(base, crop, "disease.onnx")
    classes_path = os.path.join(base, crop, "classes.json")
    
    if not os.path.exists(model_path):
        print(f"{crop:<18} | MISSING      | N/A                | N/A          | N/A")
        continue
        
    num_classes = "N/A"
    if os.path.exists(classes_path):
        try:
            with open(classes_path, 'r') as f:
                c_data = json.load(f)
                num_classes = len(c_data)
        except Exception:
            pass

    try:
        import time
        t0 = time.time()
        sess = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        input_name = sess.get_inputs()[0].name
        output_name = sess.get_outputs()[0].name
        input_shape = str(sess.get_inputs()[0].shape)
        
        preds = sess.run([output_name], {input_name: dummy_input})[0]
        dt = (time.time() - t0) * 1000
        print(f"{crop:<18} | VALID        | {input_shape:<18} | {num_classes:<12} | {dt:.2f} ms")
    except Exception as e:
        print(f"{crop:<18} | ERROR        | {str(e)[:25]:<18} | {num_classes:<12} | N/A")
