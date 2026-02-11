#!/usr/bin/env python3
"""
한국 중고생 연령대(13~18세) 학생 증명사진 생성 스크립트
더 젊은 10대 모습의 이미지 사용
"""
import os
import requests
from PIL import Image
from io import BytesIO

# 출력 디렉토리
OUTPUT_DIR = "docs/images/students"

# 중고생 연령대 학생 정보 - 더 젊은 10대 이미지 사용
STUDENTS = [
    {
        "name": "김민준",
        "gender": "남",
        "grade": "중3",
        "age": "15세",
        # 젊은 남성 학생
        "url": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "이서연",
        "gender": "여",
        "grade": "중2",
        "age": "14세",
        # 젊은 여학생
        "url": "https://images.unsplash.com/photo-1517254797898-04edd251bfb3?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "박지훈",
        "gender": "남",
        "grade": "고1",
        "age": "16세",
        # 10대 남학생
        "url": "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "최수아",
        "gender": "여",
        "grade": "중3",
        "age": "15세",
        # 젊은 여학생
        "url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "정우진",
        "gender": "남",
        "grade": "고2",
        "age": "17세",
        # 10대 후반
        "url": "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "강예은",
        "gender": "여",
        "grade": "고1",
        "age": "16세",
        # 10대 여학생
        "url": "https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "조현우",
        "gender": "남",
        "grade": "중1",
        "age": "13세",
        # 어린 남학생
        "url": "https://images.unsplash.com/photo-1628155244520-9d1c5a45fe64?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "윤지민",
        "gender": "여",
        "grade": "고3",
        "age": "18세",
        # 10대 후반 여학생
        "url": "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "장도윤",
        "gender": "남",
        "grade": "고2",
        "age": "17세",
        # 10대 남학생
        "url": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "한채원",
        "gender": "여",
        "grade": "중2",
        "age": "14세",
        # 젊은 여학생
        "url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face"
    }
]

def create_id_photo(image_url, output_path):
    """이미지를 다운로드하여 증명사진 형태로 편집"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(image_url, headers=headers, timeout=10)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content))
        
        # RGBA를 RGB로 변환
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
        
        # 증명사진 비율: 3.5:4.5
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
        
        # 고해상도 리사이즈
        id_photo_size = (826, 1062)
        img = img.resize(id_photo_size, Image.Resampling.LANCZOS)
        
        img.save(output_path, 'JPEG', quality=95)
        return True
        
    except Exception as e:
        print(f"  오류: {e}")
        return False

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("=" * 65)
    print("한국 중고생 연령대 학생 증명사진 생성 (10대 이미지)")
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
    print(f"저장 위치: {OUTPUT_DIR}")
    print("=" * 65)

if __name__ == "__main__":
    main()
