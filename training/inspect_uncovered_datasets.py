import json
from kaggle.api.kaggle_api_extended import KaggleApi

api = KaggleApi()
api.authenticate()

uncovered = [
    'sorghum', 'pearl_millet', 'groundnut', 'tobacco', 'onion', 'okra',
    'pumpkin', 'bottle_gourd', 'beans', 'cauliflower', 'papaya',
    'watermelon', 'arecanut', 'cashew', 'rubber', 'cocoa', 'turmeric'
]

verified_matches = {}

for crop in uncovered:
    queries = [f"{crop} leaf disease", f"{crop} disease", f"{crop} plant"]
    found = False
    for q in queries:
        try:
            res = api.dataset_list(search=q, sort_by='votes', page=1)
            for d in res[:4]:
                title = d.title.lower()
                ref = d.ref.lower()
                crop_clean = crop.replace('_', ' ')
                crop_compact = crop.replace('_', '')
                
                # Check for relevance
                if (crop_clean in title or crop_compact in title or crop in ref or crop_compact in ref) and ('disease' in title or 'leaf' in title or 'pest' in title):
                    bytes_val = getattr(d, 'total_bytes', 0) or 0
                    size_mb = round(bytes_val / (1024 * 1024), 2)
                    lic = getattr(d, 'license_name', 'unknown') or 'unknown'
                    
                    print(f"[+] Verified {crop:12}: {d.ref:<45} | {size_mb:>6} MB | Lic: {lic}")
                    verified_matches[crop] = {
                        "ref": d.ref,
                        "title": d.title,
                        "size_mb": size_mb,
                        "license": lic,
                        "vote_count": getattr(d, 'vote_count', 0),
                        "download_count": getattr(d, 'download_count', 0)
                    }
                    found = True
                    break
            if found:
                break
        except Exception as e:
            print(f"[!] Error on {crop}: {e}")
            break

with open('reports/verified_uncovered_kaggle_datasets.json', 'w', encoding='utf-8') as f:
    json.dump(verified_matches, f, indent=2)

print(f"\n[+] Total verified crop datasets found: {len(verified_matches)} / {len(uncovered)}")
