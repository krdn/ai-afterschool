# AI AfterSchool 통합 테스트 시나리오

**문서 버전:** 3.0
**기준일:** 2026-02-06
**대상 스코프:** v2.1 전체 (인증, 학생/선생님/학부모 관리, 성향 분석, 매칭/배정, 상담 예약, 성과 통계, LLM 관리)

---

## 1. 인증 및 세션 관리 (Auth)

선생님(Teacher) 및 관리자(Director)의 계정 수명주기, 세션 관리, 접근 제어를 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **AUTH-01** | 선생님 회원가입 (Happy Path) | High | 없음 | 1. `/auth/register` 이동<br>2. 이메일: `new@test.com`, 비밀번호: `Test1234!`, 이름: `테스트` 입력<br>3. 제출 | 1. `Teacher` 테이블에 row 생성 (role=TEACHER)<br>2. 비밀번호 Argon2 해시 저장 확인<br>3. `/auth/login`으로 리다이렉트 |
| **AUTH-02** | 회원가입 유효성 검증 (Sad Path) | Med | 없음 | 1. 이메일 없이 제출<br>2. 비밀번호 4자 미만 제출<br>3. 이미 존재하는 이메일로 제출 | 1. 각 필드별 Zod validation 에러 메시지 표시<br>2. 중복 이메일 시 "이미 등록된 이메일" 에러 |
| **AUTH-03** | 로그인 성공 및 세션 쿠키 설정 | High | `admin@afterschool.com` / `admin1234` 계정 | 1. `/auth/login` 이동<br>2. 자격증명 입력 후 제출 | 1. JWT 기반 세션 쿠키(`session`) 설정됨<br>2. `/students`로 리다이렉트<br>3. 페이지 새로고침 후에도 로그인 유지 |
| **AUTH-04** | 로그인 실패 (잘못된 자격증명) | Med | 없음 | 1. 존재하지 않는 이메일로 로그인 시도<br>2. 올바른 이메일 + 잘못된 비밀번호 시도 | 1. 동일한 에러 메시지 표시 (이메일 존재 여부 노출 방지)<br>2. 세션 쿠키 미설정 |
| **AUTH-05** | 로그아웃 | High | 로그인 상태 | 1. 로그아웃 버튼 클릭 (POST `/auth/logout`) | 1. 세션 쿠키 삭제<br>2. `/auth/login`으로 리다이렉트<br>3. 뒤로가기 시 대시보드 접근 불가 |
| **AUTH-06** | 비밀번호 재설정 요청 | High | `test@afterschool.com` 가입됨 | 1. `/auth/reset-password` 이동<br>2. 이메일 입력 후 제출 | 1. `PasswordResetToken` 테이블에 row 생성 (24시간 TTL)<br>2. Resend API로 이메일 발송 (또는 콘솔 로그 확인) |
| **AUTH-07** | 비밀번호 재설정 실행 | High | 유효한 토큰 존재 | 1. `/auth/reset-password/[token]` 접속<br>2. 새 비밀번호 입력 후 제출 | 1. 비밀번호 변경 완료<br>2. 토큰 `used=true` 업데이트<br>3. 새 비밀번호로 로그인 성공 |
| **AUTH-08** | 만료/사용된 토큰으로 재설정 시도 | Med | 만료된 토큰 | 1. 24시간 경과된 토큰 URL 접속<br>2. 이미 사용된 토큰 URL 접속 | 1. "토큰이 만료되었습니다" 에러 메시지<br>2. 비밀번호 변경 폼 비활성화 |
| **AUTH-09** | RBAC: 비인가 접근 차단 | High | TEACHER 역할 계정 | 1. `/admin/llm-settings` 직접 URL 접근<br>2. 타 선생님 담당 학생 API 호출 | 1. 관리자 페이지 접근 차단 (리다이렉트 또는 403)<br>2. 다른 선생님 학생 데이터 조회 불가 |
| **AUTH-10** | 미인증 사용자 보호 라우트 접근 | High | 로그아웃 상태 | 1. `/students` 직접 URL 접근<br>2. `/counseling` 직접 URL 접근 | 1. `/auth/login?callbackUrl=%2Fstudents`로 리다이렉트<br>2. 로그인 후 원래 요청 URL로 복귀 |

---

## 2. 학생 데이터 관리 (Student)

학생 정보의 전체 수명주기(등록/조회/수정/삭제) 및 관련 UI를 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **STU-01** | 신규 학생 등록 (필수 필드) | High | 로그인 | 1. `/students/new` 이동<br>2. 이름: `김학생`, 생년월일: `2010-03-15`, 학교: `서울중`, 학년: `2` 입력<br>3. 제출 | 1. `Student` 테이블에 row 생성 (`teacherId` = 현재 로그인 사용자)<br>2. `/students/[id]`로 리다이렉트<br>3. 학생 목록에 노출 |
| **STU-02** | 학생 등록 + 프로필 사진 업로드 | High | 로그인 | 1. `/students/new`에서 기본 정보 + 프로필 사진 첨부<br>2. 제출 | 1. Cloudinary에 이미지 업로드 성공<br>2. `StudentImage` 테이블에 type=`profile` row 생성<br>3. 학생 상세에서 프로필 사진 표시 |
| **STU-03** | 학생 등록 유효성 검증 | Med | 로그인 | 1. 이름 미입력 제출<br>2. 학년 0 또는 13 입력 | 1. 필수 필드 에러 표시<br>2. 학년 범위 검증 에러 표시 |
| **STU-04** | 학생 목록 조회 및 검색 | Med | 5명 이상 학생 존재 | 1. `/students` 이동<br>2. 검색창에 이름 입력<br>3. 학교/학년 필터 적용 | 1. 조건 부합 학생만 필터링 표시<br>2. RBAC: TEACHER는 본인 학생만, DIRECTOR는 전체 조회 |
| **STU-05** | 학생 상세 정보 및 탭 네비게이션 | High | 학생 존재 | 1. `/students/[id]` 진입<br>2. 기본정보/학습/분석/매칭/상담 탭 순서대로 이동 | 1. 각 탭 전환 시 데이터 정상 로딩<br>2. 로딩 에러 없음<br>3. 해당 학생의 데이터만 표시 |
| **STU-06** | 학생 정보 수정 | High | 학생 존재 | 1. `/students/[id]/edit` 이동<br>2. 목표 대학: `서울대`, 전공: `컴퓨터공학` 추가<br>3. 한자이름 입력 (선택)<br>4. 저장 | 1. DB 업데이트 확인<br>2. `calculationRecalculationNeeded=true` 설정 (이름/생일 변경 시)<br>3. 학생 상세 페이지에 변경 내용 반영 |
| **STU-07** | 학생 정보 수정 - 이미지 교체 | Med | 프로필 사진 보유 학생 | 1. 수정 페이지에서 새 프로필/관상/손금 사진 업로드<br>2. 저장 | 1. Cloudinary 기존 이미지 교체<br>2. `StudentImage` 테이블 업데이트<br>3. 상세 페이지에서 새 사진 확인 |
| **STU-08** | 학생 삭제 (Cascade 검증) | High | 분석/성적/상담 데이터 보유 학생 | 1. 학생 상세 -> 삭제 버튼 -> 확인 다이얼로그 | 1. `Student` 삭제<br>2. 연관 데이터 Cascade 삭제: SajuAnalysis, NameAnalysis, MbtiAnalysis, FaceAnalysis, PalmAnalysis, PersonalitySummary, GradeHistory, CounselingSession, Parent, StudentImage, CompatibilityResult<br>3. 목록으로 리다이렉트 |
| **STU-09** | 보안: 타 선생님 학생 접근 시도 (IDOR) | High | TEACHER 계정 A, B | 1. 선생님 A 로그인<br>2. 선생님 B의 학생 `/students/[B의 학생 id]` 직접 접근 | 1. 접근 차단 (404 또는 403)<br>2. 데이터 미노출 |

---

## 3. 학부모 정보 관리 (Parent) - v2.1

학생과 연관된 학부모 정보의 CRUD 및 주 보호자 설정을 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **PRT-01** | 학부모 정보 등록 | High | 학생 상세 페이지 | 1. 학부모 추가 버튼 클릭<br>2. 이름: `김부모`, 관계: `FATHER`, 연락처: `010-1234-5678` 입력<br>3. 저장 | 1. `Parent` 테이블에 row 생성 (`studentId` 연결)<br>2. 학생 상세 페이지에 학부모 정보 표시 |
| **PRT-02** | 복수 학부모 등록 | Med | PRT-01 완료 | 1. 동일 학생에 어머니 정보 추가<br>2. 관계: `MOTHER`, 이름/연락처 입력 | 1. 동일 학생에 2명의 Parent 레코드 생성<br>2. 학생 상세에서 두 학부모 모두 표시 |
| **PRT-03** | 학부모 관계 '기타' 입력 | Low | 학생 상세 | 1. 관계에서 `OTHER` 선택<br>2. `relationOther`에 "이모" 입력 | 1. `relation=OTHER`, `relationOther="이모"` 저장<br>2. UI에 "이모"로 표시 |
| **PRT-04** | 주 보호자 설정 | Med | 복수 학부모 등록됨 | 1. 특정 학부모를 '주 보호자'로 설정 | 1. `Parent.isPrimary=true` 업데이트<br>2. `Student.primaryParentId` 업데이트<br>3. 기존 주 보호자 `isPrimary=false`로 변경<br>4. 상담 예약 시 주 보호자 자동 선택 |
| **PRT-05** | 학부모 정보 수정 | Med | 학부모 존재 | 1. 학부모 정보 수정 버튼<br>2. 연락처 변경 후 저장 | 1. DB 업데이트 확인<br>2. UI 즉시 반영 |
| **PRT-06** | 학부모 정보 삭제 | Med | 학부모 존재 | 1. 학부모 삭제 버튼 -> 확인 | 1. `Parent` 레코드 삭제<br>2. 해당 학부모의 `ParentCounselingReservation` Cascade 삭제<br>3. 주 보호자 삭제 시 `Student.primaryParentId=null` |

---

## 4. 학습 성적 관리 (Grade)

학생의 시험 성적 기록, 추이 분석, 정규화 점수 처리를 검증합니다. (모델: `GradeHistory`)

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **GRD-01** | 성적 추가 (Server Action) | High | 학생 상세 -> 학습 탭 | 1. `+ 성적 추가` 클릭<br>2. 과목: `수학`, 점수: `85`, 만점: `100`, 시험유형: `MIDTERM`, 학년도: `2026`, 학기: `1`, 시험일: `2026-03-15` 입력<br>3. 저장 | 1. `GradeHistory` 테이블에 insert<br>2. `normalizedScore = 85` 자동 계산 (85/100*100)<br>3. 성적 이력 테이블에 행 추가<br>4. 모달 닫힘 |
| **GRD-02** | 성적 추이 그래프 시각화 | Med | 동일 과목 성적 3건 이상 | 1. 학습 탭 조회 | 1. Recharts 꺾은선(Line) 그래프 렌더링<br>2. X축: 시험일 날짜순 정렬<br>3. 과목별 다른 색상 라인 |
| **GRD-03** | 성적 수정 | Med | 성적 존재 | 1. 성적 행 편집 버튼<br>2. 점수 85 -> 90 변경 | 1. DB 업데이트<br>2. `normalizedScore` 재계산<br>3. 그래프 데이터 포인트 갱신 |
| **GRD-04** | 성적 삭제 | Low | 성적 존재 | 1. 성적 행 삭제 아이콘 클릭 -> 확인 | 1. `GradeHistory` row 삭제<br>2. 테이블 및 그래프에서 즉시 제거 |
| **GRD-05** | 예외: 잘못된 점수 입력 | Med | 학습 탭 | 1. 점수에 `101` 입력 (만점 100 기준)<br>2. 점수에 `-1` 입력<br>3. 만점에 `0` 입력 | 1. Form Validation 에러: "점수는 0~만점 사이" 표시<br>2. 음수 점수 거부<br>3. 만점 0 거부 |
| **GRD-06** | 선생님별 성적 추적 | Med | 담당 선생님 변경 이력 | 1. 성적 추가 시 `teacherId` 자동 기록 확인 | 1. `GradeHistory.teacherId` = 현재 로그인 선생님<br>2. 선생님 성과 분석에 반영 |

---

## 5. 선생님 데이터 관리 (Teacher)

선생님 계정 CRUD, 팀 배정, 역할 관리, 성향 분석을 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **TCH-01** | 관리자: 선생님 등록 | High | DIRECTOR 계정 | 1. `/teachers/new` 이동<br>2. 이름, 이메일, 역할(TEACHER), 팀 선택<br>3. 저장 | 1. `Teacher` 테이블에 row 생성<br>2. 해당 팀에 소속 확인<br>3. 선생님 목록에 노출 |
| **TCH-02** | 관리자: 선생님 역할/팀 변경 | High | DIRECTOR 계정 | 1. `/teachers/[id]` -> 수정<br>2. Role을 `TEAM_LEADER`로 변경<br>3. 팀 변경 | 1. DB 업데이트 확인<br>2. 해당 선생님 재로그인 시 변경된 권한 적용<br>3. 네비게이션 메뉴 변경 반영 |
| **TCH-03** | 선생님 본인 프로필 조회 | Med | 로그인 | 1. `/teachers/[myId]` 접근 | 1. 본인 정보 표시 (이름, 이메일, 역할, 팀)<br>2. 담당 학생 수 통계 표시 |
| **TCH-04** | 선생님 성향 분석 실행 (사주) | Med | 선생님 생년월일 등록됨 | 1. `/teachers/[id]` -> 분석 탭<br>2. 사주 분석 실행 | 1. `TeacherSajuAnalysis` 테이블에 결과 저장<br>2. 분석 결과 UI 렌더링 |
| **TCH-05** | 선생님 성향 분석 실행 (MBTI) | Med | 선생님 프로필 | 1. MBTI 설문 탭 이동<br>2. 전체 문항 응답 후 제출 | 1. `TeacherMbtiAnalysis` 테이블에 결과 저장<br>2. MBTI 유형 및 퍼센티지 표시 |
| **TCH-06** | 선생님 성향 분석 실행 (관상/손금) | Med | 선생님 사진 보유 | 1. 관상/손금 사진 업로드<br>2. 분석 요청 | 1. Claude Vision API 호출<br>2. `TeacherFaceAnalysis`/`TeacherPalmAnalysis` 저장<br>3. 분석 결과 표시 |
| **TCH-07** | 선생님 목록 검색 및 필터링 | Med | 다수 선생님 존재 | 1. `/teachers` 진입<br>2. 이름 검색, 팀/역할 필터 적용 | 1. 조건 부합 선생님만 목록 노출<br>2. TEACHER 역할은 제한된 목록만 조회 |
| **TCH-08** | 선생님 담당 학생 목록 | Med | 학생 배정됨 | 1. `/teachers/[id]/students` 이동 | 1. 해당 선생님에게 배정된 학생 목록 표시<br>2. 학생별 기본 정보 및 최근 상담 요약 |
| **TCH-09** | 관리자: 선생님 삭제 | High | DIRECTOR 계정 | 1. 선생님 삭제 시도 | 1. 담당 학생 존재 시 삭제 차단 또는 재배정 안내<br>2. 연관 분석 데이터 Cascade 삭제 확인 |
| **TCH-10** | 권한: TEACHER의 타 선생님 수정 시도 | Med | TEACHER 계정 | 1. 타 선생님 프로필 수정 API 호출 | 1. 권한 부족으로 거부 (403 또는 에러 메시지) |

---

## 6. 성향 분석 시스템 (Analysis)

AI 및 알고리즘 기반 학생 성향 분석 파이프라인을 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **ANL-01** | 사주 분석 실행 및 정확성 | High | 학생 생년월일/시간 등록 | 1. `/students/[id]` -> 분석 탭<br>2. 사주 분석 실행 버튼 | 1. `SajuAnalysis` 테이블에 `inputSnapshot`, `result` 저장<br>2. 오행 분석, 십성 분석 결과 UI 렌더링<br>3. `status=complete` |
| **ANL-02** | 성명학 분석 실행 | High | 학생 이름 + 한자이름 등록 | 1. 성명학 분석 실행 버튼 | 1. `NameAnalysis` 테이블에 결과 저장<br>2. 획수, 수리 분석 결과 표시 |
| **ANL-03** | MBTI 설문 시작 및 임시저장 | High | 학생 존재 | 1. `/students/[id]/mbti` 이동<br>2. 10문항 응답 후 중단 | 1. `MbtiSurveyDraft` 테이블에 `responses` JSON 저장<br>2. `progress` 값 업데이트 (예: 10/60)<br>3. 재방문 시 이어서 진행 가능 |
| **ANL-04** | MBTI 설문 완료 및 결과 산출 | High | 설문 전체 응답 | 1. 전체 문항 응답 후 제출 | 1. `MbtiAnalysis` 테이블에 결과 저장<br>2. `mbtiType` (예: "ENFP") 계산<br>3. 각 차원별 `percentages` 산출<br>4. `MbtiSurveyDraft` 삭제 또는 유지<br>5. MBTI 결과 카드 렌더링 |
| **ANL-05** | AI 관상 분석 (Claude Vision) | High | 학생 얼굴 사진 보유 | 1. 관상 탭 -> 분석 요청 | 1. Claude Vision API 호출<br>2. `FaceAnalysis` 테이블에 `result` JSON 저장<br>3. 로딩 인디케이터 표시 후 결과 텍스트 렌더링<br>4. API 실패 시 `errorMessage` 저장 및 에러 UI |
| **ANL-06** | AI 손금 분석 (Claude Vision) | High | 학생 손금 사진 보유 | 1. 손금 탭 -> 손 방향(좌/우) 선택 -> 분석 요청 | 1. `PalmAnalysis` 테이블에 `hand`, `result` 저장<br>2. 분석 결과 텍스트 렌더링 |
| **ANL-07** | AI 종합 성향 요약 생성 | High | 사주 + MBTI + 1개 이상 분석 완료 | 1. 분석 탭 -> `종합 분석 생성` 클릭 | 1. `PersonalitySummary` 테이블 생성/갱신<br>2. `coreTraits`, `learningStrategy`, `careerGuidance` 필드 채움<br>3. 이전 버전 `PersonalitySummaryHistory`에 아카이빙<br>4. 레이더 차트 및 요약 텍스트 렌더링 |
| **ANL-08** | 종합 분석 생성 전제조건 부족 | Med | 분석 데이터 1개 미만 | 1. 분석 없이 종합 분석 시도 | 1. "최소 3개 분석이 필요합니다" 등 안내 메시지<br>2. 실행 버튼 비활성화 또는 에러 처리 |
| **ANL-09** | 분석 재실행 (버전 갱신) | Med | 기존 분석 결과 존재 | 1. 사주 분석 재실행 (생년월일 변경 후) | 1. `version` 필드 증가<br>2. 새 결과로 덮어쓰기<br>3. 변경된 결과 UI 즉시 반영 |

---

## 7. 매칭 및 배정 시스템 (Matching)

선생님-학생 간 최적 매칭 알고리즘과 배정 워크플로우를 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **MAT-01** | 궁합 점수 산출 | High | 선생님/학생 분석 데이터 보유 | 1. `/students/[id]/matching` 이동<br>2. 또는 `/api/compatibility/calculate` POST | 1. `CompatibilityResult` 테이블에 저장<br>2. `overallScore` = 가중 평균 (MBTI 25%, 학습스타일 25%, 사주 20%, 성명학 15%, 부하분산 15%)<br>3. `breakdown` JSON에 각 항목 점수 |
| **MAT-02** | 궁합 점수 세부 분석 UI | Med | MAT-01 완료 | 1. 매칭 탭에서 궁합 결과 카드 확인 | 1. 전체 점수(%) 표시<br>2. 항목별(MBTI, 학습방식, 사주, 성명학) 점수 바/차트 표시<br>3. 호환성 이유(`reasons`) 텍스트 표시 |
| **MAT-03** | AI 자동 배정 시뮬레이션 | High | 미배정 학생 + 여러 선생님 | 1. `/matching/auto-assign` 이동<br>2. 팀 선택 (선택사항) -> 배정 실행 | 1. `AssignmentProposal` 테이블에 `status=pending` 생성<br>2. `assignments` JSON에 학생-선생님 매핑<br>3. `summary`에 통계 (평균 점수, 분산) |
| **MAT-04** | 배정 제안 검토 및 확정 | High | MAT-03 제안 존재 | 1. 배정 제안 목록 확인<br>2. 특정 제안 `적용` 버튼 | 1. `Student.teacherId` 일괄 업데이트<br>2. `AssignmentProposal.status` 변경<br>3. `/students` 목록에서 배정 반영 확인 |
| **MAT-05** | 배정 공정성 지표 | Med | 자동 배정 완료 | 1. `/matching/fairness` 이동 | 1. Disparity Index 수치 표시<br>2. 선생님별 학생 수 분포 차트<br>3. ABROCA 등 공정성 메트릭 표시 |
| **MAT-06** | 학생 수동 재배정 | Med | 배정된 학생 | 1. 학생 상세에서 담당 선생님 변경 | 1. `Student.teacherId` 업데이트<br>2. 기존/새 선생님의 학생 목록 갱신<br>3. 궁합 점수 재계산 필요 표시 |

---

## 8. 상담 관리 (Counseling) - v2.1

학부모 상담의 예약/캘린더/완료/기록/후속조치 전체 흐름을 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **CNS-01** | 상담 캘린더 월간/주간 뷰 | High | 예약 데이터 존재 | 1. `/counseling` -> 캘린더 탭<br>2. 월간/주간 뷰 전환 | 1. 해당 기간의 예약 일정 셀에 렌더링<br>2. 예약 클릭 시 상세 정보 표시<br>3. react-day-picker v9 기반 UI |
| **CNS-02** | 신규 상담 예약 생성 | High | 학부모 등록됨 | 1. 상담 예약 폼 이동<br>2. 학생: `김학생`, 학부모: `김부모`, 날짜: `2026-02-10 14:00`, 주제: `성적 상담` 입력<br>3. 저장 | 1. `ParentCounselingReservation` 테이블 insert (`status=SCHEDULED`)<br>2. 캘린더에 즉시 반영<br>3. 시간 충돌 체크 (동일 선생님 동일 시간 중복 예약 방지) |
| **CNS-03** | 상담 예약 수정 | Med | 예약 존재 | 1. 예약 상세 -> 수정<br>2. 날짜/시간 변경 | 1. DB 업데이트<br>2. 캘린더에서 이전 위치 제거, 새 위치 표시<br>3. 시간 충돌 재검증 |
| **CNS-04** | 상담 예약 취소 | Med | 예약 존재 (SCHEDULED) | 1. 예약 상세 -> 취소 버튼 | 1. `status` = `CANCELLED`로 변경<br>2. 캘린더에서 취소 표시 (색상 변경 또는 취소선)<br>3. 통계에서 취소건 집계 |
| **CNS-05** | 상담 완료 처리 및 기록 작성 | High | 예약 존재 (SCHEDULED) | 1. 예약 상세 -> `상담 완료` 버튼<br>2. 상담 유형: `ACADEMIC`, 소요시간: `30분`, 요약 입력<br>3. 저장 | 1. `ReservationStatus` = `COMPLETED`<br>2. `CounselingSession` 테이블에 새 레코드 생성<br>3. `ParentCounselingReservation.counselingSessionId` 연결<br>4. 상담 이력에 표시 |
| **CNS-06** | AI 상담 요약 생성 | Med | 상담 기록 존재 | 1. 상담 기록에서 `AI 요약 생성` 클릭 | 1. LLM API 호출 (학생 성향 데이터 포함)<br>2. `CounselingSession.aiSummary` 저장<br>3. AI 생성 요약 텍스트 UI 표시 |
| **CNS-07** | AI 상담 지원 데이터 조회 | Med | 학생 분석 + 궁합 데이터 | 1. 상담 진행 시 AI 지원 패널 확인 | 1. 학생 성향 요약 자동 표시<br>2. 선생님-학생 궁합 점수 참조 표시<br>3. 이전 상담 히스토리 요약 |
| **CNS-08** | 노쇼(No-Show) 처리 | Med | 예약 존재 (SCHEDULED) | 1. 예약 시간 경과 후 `노쇼` 처리 | 1. `status` = `NO_SHOW`<br>2. 통계에서 노쇼율 집계<br>3. 학생/학부모 상담 이력에 기록 |
| **CNS-09** | 후속 조치(Follow-up) 관리 | Med | 상담 완료 + 후속 필요 | 1. 상담 기록 시 `후속 조치 필요` 체크 + 날짜 설정<br>2. 대시보드 위젯 확인 | 1. `CounselingSession.followUpRequired=true`, `followUpDate` 설정<br>2. 대시보드에 "지연된 후속 조치" 하이라이트 표시<br>3. 완료 체크 시 `followUpRequired=false` |
| **CNS-10** | 예약 시간 충돌 검증 | Med | 기존 예약 존재 | 1. 동일 선생님에 동일 시간대 예약 생성 시도 | 1. "해당 시간에 이미 예약이 있습니다" 에러<br>2. 예약 생성 차단 |
| **CNS-11** | 학생별 상담 이력 조회 | Med | 다수 상담 기록 | 1. 학생 상세 -> 상담 탭 | 1. 해당 학생의 모든 상담 기록 시간순 표시<br>2. 다음 예약 일정 표시<br>3. 상담 유형별 아이콘/태그 표시 |

---

## 9. 만족도 조사 (Satisfaction)

선생님이 학생/학부모의 만족도를 대리 입력하는 기능을 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **SAT-01** | 만족도 조사 입력 | Med | 상담 완료된 학생 | 1. `/satisfaction/new` 이동<br>2. 학생/선생님 선택<br>3. 전체 만족도: 4, 강의 질: 5, 의사소통: 4, 지원 수준: 3 입력<br>4. 피드백 텍스트 입력 후 저장 | 1. `StudentSatisfaction` 테이블에 저장<br>2. 중복 방지: 동일 (학생, 선생님, 날짜) 조합 유일 |
| **SAT-02** | 만족도 데이터 성과 반영 | Low | SAT-01 완료 | 1. `/analytics` 페이지 확인 | 1. 선생님별 평균 만족도 통계에 반영<br>2. 만족도 추이 차트에 데이터 포인트 추가 |

---

## 10. AI 및 시스템 설정 (Admin)

LLM 인프라 설정, 예산 관리, Failover 기능을 검증합니다. (DIRECTOR 권한 필요)

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **SYS-01** | LLM 제공자 설정 및 API 키 관리 | High | DIRECTOR 계정 | 1. `/admin/llm-settings` 이동<br>2. Provider(Claude) 카드에서 API 키 입력<br>3. `테스트` 버튼 -> `저장` | 1. `LLMConfig` 테이블에 `apiKeyEncrypted` 암호화 저장<br>2. `isValidated=true`, `validatedAt` 업데이트<br>3. Provider 카드 상태 "활성" 표시 |
| **SYS-02** | LLM 기능별 라우팅 설정 | Med | Provider 설정 완료 | 1. Feature mapping 탭 이동<br>2. `personality_summary` 기능에 주 Provider: `claude`, Fallback: `["ollama"]` 설정 | 1. `LLMFeatureConfig` 테이블 저장<br>2. 해당 기능 실행 시 지정된 Provider 사용 확인 |
| **SYS-03** | 토큰 사용량 및 비용 모니터링 | Med | AI 사용 이력 존재 | 1. `/admin/llm-usage` 이동 | 1. Provider별 토큰 사용량 차트 (Recharts)<br>2. 기능별 사용량 분류<br>3. 예상 비용(USD) 표시 |
| **SYS-04** | 예산 설정 및 알림 | Med | DIRECTOR 계정 | 1. 월별 예산 `$50` 설정<br>2. 80%/100% 알림 활성화 | 1. `LLMBudget` 테이블 저장<br>2. 사용량 80% 도달 시 경고 UI 표시<br>3. 100% 도달 시 강화된 경고 |
| **SYS-05** | AI Provider Failover | High | 복수 Provider 설정 | 1. 주 Provider(Ollama) 비활성화/에러 유발<br>2. AI 기능(성향 요약) 실행 | 1. 에러 없이 Fallback Provider(Claude)로 자동 전환<br>2. `LLMUsage.failoverFrom` 필드에 원본 Provider 기록<br>3. 사용자에게 투명하게 결과 반환 |
| **SYS-06** | 월별 사용량 집계 (Cron) | Low | LLM 사용 이력 | 1. `/api/cron/aggregate-llm-usage` GET 호출 | 1. `LLMUsageMonthly` 테이블에 월별 집계 생성<br>2. `totalRequests`, `totalInputTokens`, `totalOutputTokens`, `totalCostUsd`, `successRate` 계산 |
| **SYS-07** | 비관리자의 LLM 설정 접근 차단 | Med | TEACHER 계정 | 1. `/admin/llm-settings` URL 직접 접근 | 1. 접근 차단 (리다이렉트 또는 403) |

---

## 11. 성과 및 통계 분석 (Analytics)

선생님 성과, 팀 구성 분석, 상담 통계 대시보드를 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **PRF-01** | 종합 성과 대시보드 | High | 상담/성적 데이터 존재 | 1. `/analytics` 이동 | 1. 선생님별 성적 향상률 차트<br>2. 상담 횟수 통계<br>3. 만족도 평균 표시<br>4. DB 데이터와 수치 일치 |
| **PRF-02** | 팀 구성 및 전문성 분석 | Med | 팀 배정 + 분석 데이터 | 1. `/teams/[id]/composition` 이동 | 1. 팀 내 선생님 목록 및 역할<br>2. 성향/전문성 분포 차트<br>3. 학생 배정 현황 |
| **PRF-03** | 상담 통계 대시보드 | Med | 다수 상담 기록 | 1. `/dashboard/statistics` 이동 | 1. 월간/누적 상담 횟수 표시<br>2. 유형별(ACADEMIC/CAREER/PSYCHOLOGICAL/BEHAVIORAL) 파이 차트<br>3. 월별 추이 꺾은선 그래프 |
| **PRF-04** | 학생 성적 향상률 조회 | Med | 성적 데이터 3건 이상 | 1. 학생 상세 -> 학습 탭에서 향상률 확인<br>2. 또는 `/analytics`에서 학생별 필터 | 1. 과목별 향상/하락 퍼센티지 표시<br>2. 선생님 변경 전후 비교 가능 |

---

## 12. 리포트 생성 (Report)

학생별 종합 상담 리포트 PDF 생성 및 상태 관리를 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **RPT-01** | PDF 리포트 생성 요청 | High | 분석 데이터 보유 학생 | 1. 학생 상세 -> 리포트 탭 -> `PDF 생성` 클릭<br>2. 또는 `GET /api/students/[id]/report` | 1. `ReportPDF.status` = `generating`<br>2. 비동기 생성 시작 (after() 패턴)<br>3. 로딩 인디케이터 표시 |
| **RPT-02** | PDF 리포트 생성 완료 및 다운로드 | High | RPT-01 완료 | 1. 상태 폴링: `GET /api/students/[id]/report/status`<br>2. 완료 후 다운로드 링크 클릭 | 1. `ReportPDF.status` = `complete`, `fileUrl` 존재<br>2. MinIO/S3에서 PDF 바이너리 스트림 다운로드<br>3. 한글 폰트 깨짐 없이 렌더링<br>4. @react-pdf/renderer 기반 레이아웃 |
| **RPT-03** | PDF 리포트 생성 실패 처리 | Med | AI API 오류 상황 | 1. LLM 비활성 상태에서 리포트 생성 시도 | 1. `ReportPDF.status` = `error`, `errorMessage` 저장<br>2. 에러 메시지 UI 표시<br>3. 재시도 버튼 제공 |

---

## 13. 인프라 및 엣지 케이스 (Infrastructure)

헬스 체크, 세션 관리, 보안 엣지 케이스를 검증합니다.

| ID | 시나리오 명 | 중요도 | 전제 조건 | 테스트 데이터/단계 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|---|
| **INF-01** | 헬스 체크 API | Med | 서버 구동 | 1. `GET /api/health` 호출<br>2. `HEAD /api/health` 호출 | 1. 200 OK 응답<br>2. DB 연결 상태, 스토리지 상태 포함<br>3. 응답 시간 1초 미만 |
| **INF-02** | Cloudinary 이미지 업로드 서명 | Med | Cloudinary 설정 | 1. `POST /api/cloudinary/sign` 호출 | 1. 서명된 업로드 파라미터 반환<br>2. 인증되지 않은 요청 차단 |
| **INF-03** | 서버 재시작 후 Server Action 복구 | Med | 로컬 개발 환경 | 1. 서버 재시작 직후 Form 제출 | 1. (Expected) Server Action ID mismatch 가능<br>2. 새로고침 후 정상 동작<br>3. 프로덕션에서는 발생하지 않음 |
| **INF-04** | XSS 방어 검증 | High | 로그인 상태 | 1. 학생 이름에 `<script>alert('xss')</script>` 입력<br>2. 상담 요약에 `<img onerror="alert(1)" src=x>` 입력 | 1. HTML 이스케이프 처리되어 스크립트 미실행<br>2. 입력값이 텍스트로만 렌더링 |
| **INF-05** | CSRF 방어 검증 | Med | 로그인 상태 | 1. 외부 사이트에서 학생 삭제 API 직접 호출 시도 | 1. Server Action 기반 CSRF 보호 동작<br>2. 외부 Origin 요청 거부 |

---

## 통합 플로우 시나리오 (End-to-End)

개별 모듈을 넘어 실제 업무 흐름 전체를 검증하는 통합 시나리오입니다.

| ID | 시나리오 명 | 중요도 | 테스트 흐름 | 예상 결과 (Pass Criteria) |
|:---:|---|:---:|---|---|
| **E2E-01** | 신규 학생 전체 온보딩 | High | 1. 회원가입 -> 로그인<br>2. 학생 등록 (사진 포함)<br>3. 학부모 등록 + 주보호자 설정<br>4. 사주/성명학/MBTI 분석 실행<br>5. 관상/손금 분석<br>6. 종합 성향 요약 생성<br>7. PDF 리포트 다운로드 | 모든 단계 에러 없이 완료<br>PDF에 분석 결과 모두 포함 |
| **E2E-02** | 상담 예약~완료~통계 반영 | High | 1. 학부모 상담 예약 생성<br>2. 캘린더에서 확인<br>3. 상담 완료 처리 + 기록 작성<br>4. AI 요약 생성<br>5. 후속 조치 설정<br>6. 통계 페이지에서 반영 확인 | 예약~완료~기록~통계 전체 데이터 정합성 확인 |
| **E2E-03** | 자동 배정~궁합~재배정 | High | 1. 미배정 학생 5명 + 선생님 3명 생성<br>2. 자동 배정 실행<br>3. 궁합 점수 확인<br>4. 공정성 지표 확인<br>5. 1명 수동 재배정<br>6. 공정성 지표 변화 확인 | 배정 알고리즘 정상 동작<br>공정성 지표 범위 내 유지 |
| **E2E-04** | 역할별 접근 제어 전체 흐름 | High | 1. DIRECTOR로 선생님 생성 (TEACHER 역할)<br>2. TEACHER로 로그인<br>3. 본인 학생만 조회 확인<br>4. admin 페이지 접근 차단 확인<br>5. DIRECTOR가 TEAM_LEADER로 승격<br>6. TEAM_LEADER로 팀 데이터 접근 확인 | 각 역할별 권한 정확히 적용 |
