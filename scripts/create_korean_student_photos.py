#!/usr/bin/env python3
"""
한국 중고생 연령대 학생 증명사진 생성
증명사진 스타일의 젊은 이미지 사용
"""
import os
import requests
from PIL import Image
from io import BytesIO

OUTPUT_DIR = "docs/images/students"

# 증명사진 스타일의 젊은 이미지
STUDENTS = [
    {
        "name": "김민준",
        "gender": "남",
        "grade": "중3",
        "age": "15세",
        # young asian male portrait
        "url": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "이서연",
        "gender": "여",
        "grade": "중2",
        "age": "14세",
        # young asian female portrait
        "url": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "박지훈",
        "gender": "남",
        "grade": "고1",
        "age": "16세",
        # young man portrait
        "url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "최수아",
        "gender": "여",
        "grade": "중3",
        "age": "15세",
        # young woman portrait
        "url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "정우진",
        "gender": "남",
        "grade": "고2",
        "age": "17세",
        # young man
        "url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "강예은",
        "gender": "여",
        "grade": "고1",
        "age": "16세",
        # young woman
        "url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "조현우",
        "gender": "남",
        "grade": "중1",
        "age": "13세",
        # boy portrait
        "url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "윤지민",
        "gender": "여",
        "grade": "고3",
        "age": "18세",
        # young woman portrait
        "url": "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "장도윤",
        "gender": "남",
        "grade": "고2",
        "age": "17세",
        # young man
        "url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "한채원",
        "gender": "여",
        "grade": "중2",
        "age": "14세",
        # girl portrait
        "url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face"
    }
]

def create_id_photo(image_url, output_path):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=10)
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
        return True
        
    except Exception as e:
        print(f"  오류: {e}")
        return False

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("=" * 65)
    print("중고생 증명사진 생성")
    print("=" * 65)
    
    success_count = 0
    for student in STUDENTS:
        output_path = os.path.join(OUTPUT_DIR, f"{student['name']}.jpg")
        print(f"\n처리 중: {student['name']} ({student['gender']}, {student['grade']}, {student['age']})")
        if create_id_photo(student['url'], output_path):
            success_count += 1
            print(f"  ✓ 저장 완료")
        
    print("\n" + "=" * 65)
    print(f"완료: {success_count}/{len(STUDENTS)} 개 저장됨")
    print("=" * 65)

if __name__ == "__main__":
    main()
