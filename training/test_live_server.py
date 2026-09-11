import urllib.request
import time
import json
import uuid

def send_test():
    url = 'http://localhost:5678/webhook/detect-disease'
    boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
    
    with open(r'C:\Users\Prathach Raj P\Desktop\Chilli.jpg', 'rb') as f:
        img_bytes = f.read()

    body = bytearray()
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="crop"\r\n\r\nChilli\r\n'.encode('utf-8'))
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nen\r\n'.encode('utf-8'))
    body.extend(f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="Chilli.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'.encode('utf-8'))
    body.extend(img_bytes)
    body.extend(f'\r\n--{boundary}--\r\n'.encode('utf-8'))

    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
    )
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            dur = time.time() - t0
            raw = resp.read().decode('utf-8')
            print(f"HTTP {resp.status} in {dur:.2f}s")
            data = json.loads(raw)
            print("Response:", json.dumps(data, indent=2))
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    send_test()
