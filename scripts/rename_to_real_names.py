#!/usr/bin/env python3
"""
연예인 사진 파일명을 본명으로 변경하는 스크립트
"""
import os

# 출력 디렉토리
OUTPUT_DIR = "docs/images/teachers"

# 파일명 변경 매핑 (현재 이름 → 본명)
RENAME_MAP = {
    # 35세 이상 연예인
    "전지현.jpg": "왕지현.jpg",      # 전지현 본명: 왕지현
    "강동원.jpg": "강동원.jpg",      # 본명 동일
    "손석구.jpg": "손석구.jpg",      # 본명 동일
    "김동욱.jpg": "김동욱.jpg",      # 본명 동일
    "강하늘.jpg": "김하늘.jpg",      # 강하늘 본명: 김하늘
    
    # 20세 이하 아이돌 (한국어 이름)
    "혜인.jpg": "이혜인.jpg",        # NewJeans 혜인 본명: 이혜인
    "이서.jpg": "이현서.jpg",        # IVE 이서 본명: 이현서
    "로라.jpg": "이채영.jpg",        # BABYMONSTER 로라 본명: 이채영
    "윤아.jpg": "노윤아.jpg",        # ILLIT 윤아 본명: 노윤아 (일본계)
    "민주.jpg": "박민주.jpg",        # ILLIT 민주 본명: 박민주
    "원희.jpg": "이원희.jpg",        # ILLIT 원희 본명: 이원희
    "아이사.jpg": "야마구치아이사.jpg",  # ILLIT 아이사 본명: 야마구치 아이사 (일본인)
    "경민.jpg": "김경민.jpg",        # TWS 경민 본명: 김경민 (혹은 신경민, 확인 필요)
    "은석.jpg": "송은석.jpg",        # RIIZE 은석 본명: 송은석
    "나경.jpg": "김나경.jpg",        # tripleS 나경 본명: 김나경
}

def main():
    print("=" * 60)
    print("연예인 사진 파일명을 본명으로 변경")
    print("=" * 60)
    
    renamed_count = 0
    skipped_count = 0
    
    for old_name, new_name in RENAME_MAP.items():
        old_path = os.path.join(OUTPUT_DIR, old_name)
        new_path = os.path.join(OUTPUT_DIR, new_name)
        
        if not os.path.exists(old_path):
            print(f"\n✗ 파일 없음: {old_name}")
            continue
            
        if old_name == new_name:
            print(f"\n→ 동일 (변경 없음): {old_name}")
            skipped_count += 1
            continue
            
        try:
            os.rename(old_path, new_path)
            print(f"\n✓ 변경 완료: {old_name} → {new_name}")
            renamed_count += 1
        except Exception as e:
            print(f"\n✗ 오류 ({old_name}): {e}")
    
    print("\n" + "=" * 60)
    print(f"완료: {renamed_count}개 변경, {skipped_count}개 동일")
    print("=" * 60)
    
    # 변경 후 파일 목록 출력
    print("\n[변경 후 파일 목록]")
    files = sorted(os.listdir(OUTPUT_DIR))
    for f in files:
        if f.endswith('.jpg'):
            size = os.path.getsize(os.path.join(OUTPUT_DIR, f))
            print(f"  • {f} ({size/1024:.1f} KB)")

if __name__ == "__main__":
    main()
