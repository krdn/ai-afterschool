# ai-afterschool

## AI AfterSchool 프로젝트
- 초.중.고.학원에서 대학입시를 목표로 학생을 효율적으로 관리하기 위해 AI를 활용하여 다양한 서비스 제공을 목표로 한다.
- 이를 위해 다양한 정보를 정기적으로 수집하여 활용한다. 정보제공 사이트 자동 추가, 수동추가 등이 필요함.
- 최고의 교육 전문가 AI가 기능 추가 등을 제안하고 생성한다.
- 학생의 성적 향상을 목표로 한다. 
- 이에 필요한 서비스를 AI가 제안하세요.

1. 학생 정보 성향 분석
- 학생 정보 관리: 기본 인적사항(이름, 생년월일 옵션:시간, 연락처), 사진 등록, 학교, 학년, 목표, 취미, 관심분야, 등등... AI가 필요하다 판단하면 추
- 사주 분석: 생년월일시 기반 사주팔자(Year/Month/Day/Hour) 자동 계산
- 성명학 분석: 한글, 한자 성명 입력 시 획수 및 수리(원격, 형격, 이격, 정격) 분석 결과 제공
- 관상 분석: 학생 사진 업로드 시 성향 키워드 및 요약 정보 제공
- 손금 분석: 손바닥 사진 업로드 시 성향 분석 정보 제공
- MBTI 분석
- 학생 통합 성향 분석 : 위의 정보를 기반으로 성향을 판단하여 제공,  개발되는 모든 서비스에서 이 기준을 활용, 향후 발전 가능한 방향을 제시한다. 
- 전문가 AI 관점에서 추가 제안함.



## 개발 환경 설정 (Development Setup)

이 프로젝트는 Next.js와 Docker를 기반으로 설정되었습니다.

### 시작하기 (Getting Started)

1. **Docker 실행**:
   ```bash
   docker-compose up --build
   ```
   - 애플리케이션은 `http://localhost:3000` 에서 실행됩니다.
   - 데이터는 `./data` 디렉토리에 마운트됩니다.

2. **로컬 개발 (Local Development)**:
   ```bash
   npm install
   npm run dev
   ```
   - 개발 서버는 `http://localhost:3000` 에서 실행됩니다.

### 기술 스택 (Tech Stack)
- Framework: Next.js (App Router)
- Language: JavaScript
- Styling: CSS Modules
- Linter: ESLint
