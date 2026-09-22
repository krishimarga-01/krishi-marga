import json

with open('reports/kaggle_76_crop_search_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

suitable_crops = []
missing_crops = []

header = f"{'Crop':<18} | {'Count':<6} | {'Top Dataset Ref':<48} | {'Size (MB)':<10} | {'License':<20}"
print(header)
print('-' * len(header))

for crop, info in data.items():
    cands = info.get('candidates', [])
    if cands:
        top = cands[0]
        size_mb = f"{top['size_bytes'] / (1024 * 1024):.1f}"
        lic = top.get('license_name') or 'unknown'
        ref = top['ref']
        print(f"{crop:<18} | {len(cands):<6} | {ref:<48} | {size_mb:<10} | {lic:<20}")
        suitable_crops.append((crop, ref, lic, top['size_bytes']))
    else:
        print(f"{crop:<18} | 0      | NO_DATASET_FOUND                                 | N/A        | N/A")
        missing_crops.append(crop)

print('=' * len(header))
print(f"Total crops with candidate datasets on Kaggle: {len(suitable_crops)} / 76")
print(f"Total crops with NO candidate datasets on Kaggle: {len(missing_crops)} / 76")
