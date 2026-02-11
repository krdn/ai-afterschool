#!/usr/bin/env python3
"""
한국 연예인 사진을 다운로드하여 증명사진 형태로 편집하는 스크립트
"""
import os
import requests
from PIL import Image
from io import BytesIO
import sys

# 출력 디렉토리
OUTPUT_DIR = "docs/images/teachers"

# 연예인 정보 (이름, 이미지 URL)
# Unsplash와 같은 물론 이미지 소스 사용
CELEBRITIES = [
    {
        "name": "전지현",
        # Unsplash - 아시아 여성 프로필
        "url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "강동원", 
        # Unsplash - 아시아 남성 프로필
        "url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "손석구",
        # Unsplash - 아시아 남성 프로필  
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "김동욱",
        # Unsplash - 아시아 남성 프로필
        "url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "강하늘",
        # Unsplash - 아시아 남성 프로필
        "url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face"
    }
]

def create_id_photo(image_url, output_path):
    """
    이미지를 다운로드하여 증명사진 형태(3.5cm x 4.5cm 비율, 얼굴 중심)로 편집
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # 이미지 열기
        img = Image.open(BytesIO(response.content))
        
        # RGBA를 RGB로 변환 (필요한 경우)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            if img.mode in ('RGBA', 'LA'):
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            else:
                img = img.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 원본 크기
        width, height = img.size
        
        # 증명사진 비율: 3.5:4.5 = 7:9 (너비:높이)
        target_ratio = 3.5 / 4.5
        current_ratio = width / height
        
        # 중앙을 기준으로 크롭
        if current_ratio > target_ratio:
            # 이미지가 너무 넓음 - 좌우 자름
            new_width = int(height * target_ratio)
            left = (width - new_width) // 2
            img = img.crop((left, 0, left + new_width, height))
        else:
            # 이미지가 너무 높음 - 상하 자름 (얼굴 중심, 약간 위쪽)
            new_height = int(width / target_ratio)
            # 얼굴 위치 고려: 약간 위쪽에서 시작 (30% 지점)
            top = int((height - new_height) * 0.25)
            img = img.crop((0, top, width, top + new_height))
        
        # 증명사진 크기로 리사이즈 (높은 해상도 유지)
        # 35mm x 45mm @ 300dpi = 413 x 531 픽셀
        # 더 높은 품질을 위해 2배 크기로
        id_photo_size = (826, 1062)
        img = img.resize(id_photo_size, Image.Resampling.LANCZOS)
        
        # 저장
        img.save(output_path, 'JPEG', quality=95)
        print(f"✓ 저장 완료: {output_path}")
        return True
        
    except Exception as e:
        print(f"✗ 오류 발생 ({output_path}): {e}")
        return False

def main():
    # 출력 디렉토리 생성
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("=" * 50)
    print("연예인 증명사진 생성 시작")
    print("=" * 50)
    
    success_count = 0
    for celeb in CELEBRITIES:
        output_path = os.path.join(OUTPUT_DIR, f"{celeb['name']}.jpg")
        print(f"\n처리 중: {celeb['name']}")
        if create_id_photo(celeb['url'], output_path):
            success_count += 1
    
    print("\n" + "=" * 50)
    print(f"완료: {success_count}/{len(CELEBRITIES)} 개 저장됨")
    print(f"저장 위치: {OUTPUT_DIR}")
    print("=" * 50)

if __name__ == "__main__":
    main()
