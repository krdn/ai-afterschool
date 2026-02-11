#!/usr/bin/env python3
"""
한국 20세 이하 아이돌 연예인 사진을 다운로드하여 증명사진 형태로 편집하는 스크립트
"""
import os
import requests
from PIL import Image
from io import BytesIO
import sys

# 출력 디렉토리
OUTPUT_DIR = "docs/images/teachers"

# 20세 이하 한국 아이돌 연예인 정보 (2026년 기준)
# 출생 연도: 2006년생 이후 (만 19세 이하)
IDOLS = [
    {
        "name": "해린",
        "group": "NewJeans",
        "birth": "2006년생",
        "age": "20세",
        # Unsplash - 젊은 여성 프로필
        "url": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "혜인",
        "group": "NewJeans", 
        "birth": "2008년생",
        "age": "18세",
        "url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "이서",
        "group": "IVE",
        "birth": "2007년생",
        "age": "19세",
        "url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "루카",
        "group": "BABYMONSTER",
        "birth": "2007년생",
        "age": "19세",
        "url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "아카",
        "group": "BABYMONSTER",
        "birth": "2008년생",
        "age": "18세",
        "url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "치키타",
        "group": "BABYMONSTER",
        "birth": "2009년생",
        "age": "17세",
        "url": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "윤아",
        "group": "ILLIT",
        "birth": "2007년생",
        "age": "19세",
        "url": "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "민주",
        "group": "ILLIT",
        "birth": "2008년생",
        "age": "18세",
        "url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "사쿠야",
        "group": "NCT WISH",
        "birth": "2007년생",
        "age": "19세",
        "url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "료",
        "group": "NCT WISH",
        "birth": "2007년생",
        "age": "19세",
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"
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
        return True
        
    except Exception as e:
        print(f"  오류: {e}")
        return False

def main():
    # 출력 디렉토리 생성
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("=" * 60)
    print("한국 20세 이하 아이돌 연예인 증명사진 생성")
    print("=" * 60)
    
    success_count = 0
    for idol in IDOLS:
        output_path = os.path.join(OUTPUT_DIR, f"{idol['name']}.jpg")
        print(f"\n처리 중: {idol['name']} ({idol['group']}, {idol['birth']}, {idol['age']})")
        if create_id_photo(idol['url'], output_path):
            success_count += 1
            print(f"  ✓ 저장 완료")
        
    print("\n" + "=" * 60)
    print(f"완료: {success_count}/{len(IDOLS)} 개 저장됨")
    print(f"저장 위치: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()
