#!/usr/bin/env python3
"""
한국 중고생 연령대(13~18세) 학생 증명사진 생성
더 어린 10대(teenager) 모습의 이미지 사용
"""
import os
import requests
from PIL import Image
from io import BytesIO

OUTPUT_DIR = "docs/images/students"

# teenager, youth 키워드로 더 젊은 이미지 선택
STUDENTS = [
    {
        "name": "김민준",
        "gender": "남",
        "grade": "중3",
        "age": "15세",
        "url": "https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "이서연",
        "gender": "여",
        "grade": "중2",
        "age": "14세",
        "url": "https://images.unsplash.com/photo-1542596594-649edbc13630?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "박지훈",
        "gender": "남",
        "grade": "고1",
        "age": "16세",
        "url": "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "최수아",
        "gender": "여",
        "grade": "중3",
        "age": "15세",
        "url": "https://images.unsplash.com/photo-1542596768-5d1d21f1cf98?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "정우진",
        "gender": "남",
        "grade": "고2",
        "age": "17세",
        "url": "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "강예은",
        "gender": "여",
        "grade": "고1",
        "age": "16세",
        "url": "https://images.unsplash.com/photo-1512310604669-443f26c35f52?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "조현우",
        "gender": "남",
        "grade": "중1",
        "age": "13세",
        "url": "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "윤지민",
        "gender": "여",
        "grade": "고3",
        "age": "18세",
        "url": "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "장도윤",
        "gender": "남",
        "grade": "고2",
        "age": "17세",
        "url": "https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=400&h=500&fit=crop&crop=face"
    },
    {
        "name": "한채원",
        "gender": "여",
        "grade": "중2",
        "age": "14세",
        "url": "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=500&fit=crop&crop=face"
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
    print("중고생 증명사진 생성 (10대 teenager 이미지)")
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
