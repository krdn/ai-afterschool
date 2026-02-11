import os
import requests
from PIL import Image
from io import BytesIO

OUTPUT_DIR = "docs/images/students"

# 조현우용 대체 이미지 - 젊은 남학생
url = "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&h=500&fit=crop&crop=face"
output_path = os.path.join(OUTPUT_DIR, "조현우.jpg")

try:
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    
    img = Image.open(BytesIO(response.content))
    
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        if img.mode in ('RGBA', 'LA'):
            background.paste(img, mask=img.split()[-1])
            img = background
        else:
            img = img.convert('RGB')
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    width, height = img.size
    target_ratio = 3.5 / 4.5
    current_ratio = width / height
    
    if current_ratio > target_ratio:
        new_width = int(height * target_ratio)
        left = (width - new_width) // 2
        img = img.crop((left, 0, left + new_width, height))
    else:
        new_height = int(width / target_ratio)
        top = int((height - new_height) * 0.25)
        img = img.crop((0, top, width, top + new_height))
    
    img = img.resize((826, 1062), Image.Resampling.LANCZOS)
    img.save(output_path, 'JPEG', quality=95)
    print(f"✓ 저장 완료: {output_path}")
except Exception as e:
    print(f"오류: {e}")
