import os
import json
import time
import csv
from kaggle.api.kaggle_api_extended import KaggleApi

def main():
    api = KaggleApi()
    api.authenticate()

    with open('76_CROP_COVERAGE_MATRIX.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        crops = [row['crop_id'] for row in reader]

    results = {}
    print(f'[*] Searching Kaggle datasets for {len(crops)} crops...')

    for i, crop_id in enumerate(crops):
        crop_clean = crop_id.replace('_', ' ')
        query = f'{crop_clean} disease'
        try:
            datasets = api.dataset_list(search=query, sort_by='votes', page=1)
            candidates = []
            for d in datasets[:5]:
                candidates.append({
                    'ref': d.ref,
                    'title': d.title,
                    'size_bytes': getattr(d, 'size', 0),
                    'vote_count': getattr(d, 'voteCount', 0),
                    'download_count': getattr(d, 'downloadCount', 0),
                    'license_name': getattr(d, 'licenseName', 'unknown')
                })
            results[crop_id] = {
                'query': query,
                'count': len(datasets),
                'candidates': candidates
            }
            print(f'[{i+1}/{len(crops)}] {crop_id}: found {len(datasets)} candidate datasets')
        except Exception as e:
            print(f'[!] Error searching for {crop_id}: {e}')
            results[crop_id] = {'error': str(e), 'candidates': []}
        time.sleep(0.2)

    os.makedirs('reports', exist_ok=True)
    with open('reports/kaggle_76_crop_search_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    print('[+] Wrote reports/kaggle_76_crop_search_results.json')

if __name__ == '__main__':
    main()
