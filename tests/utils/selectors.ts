/**
 * 공통 UI 셀렉터 상수
 * 실제 UI 구조에 맞게 업데이트 필요
 */

export const SELECTORS = {
    // 인증 (Authentication)
    auth: {
        emailInput: 'input[name="email"]',
        passwordInput: 'input[name="password"]',
        loginButton: 'button[type="submit"]',
        logoutButton: 'button:has-text("로그아웃"), a:has-text("로그아웃")',
    },

    // 네비게이션 (Navigation)
    nav: {
        dashboard: 'a[href="/dashboard"]',
        students: 'a[href*="/students"]',
        teachers: 'a[href*="/teachers"]',
        consultations: 'a[href*="/consultations"]',
        grades: 'a[href*="/grades"]',
        analytics: 'a[href*="/analytics"]',
        settings: 'a[href*="/settings"]',
    },

    // 학생 관리 (Student Management)
    students: {
        addButton: 'a[href="/students/new"]:has-text("학생 등록")',
        searchInput: 'input[placeholder*="학생 이름 검색"]',
        searchButton: 'button:has-text("검색")',
        filterGrade: 'select[name="grade"]',
        filterSchool: 'select[name="school"]',
        studentCard: '[data-testid="student-card"], a[href^="/students/"]',
        studentRow: 'tr[data-student-id]',
        studentName: '[data-testid="student-name"]',
        studentGrade: '[data-testid="student-grade"]',
        studentSchool: '[data-testid="student-school"]',
    },

    // 학생 상세 (Student Detail)
    studentDetail: {
        nameField: 'input[name="name"]',
        phoneField: 'input[name="phone"]',
        gradeSelect: 'select[name="grade"]',
        schoolField: 'input[name="school"]',
        birthDateField: 'input[name="birthDate"]',
        photoUpload: 'input[type="file"]',
        saveButton: 'button[type="submit"], button:has-text("저장")',
        deleteButton: 'button:has-text("삭제")',
        tabInfo: 'button:has-text("기본 정보"), [role="tab"]:has-text("기본 정보")',
        tabGrades: 'button:has-text("성적"), [role="tab"]:has-text("성적")',
        tabConsultations: 'button:has-text("상담"), [role="tab"]:has-text("상담")',
        tabAnalysis: 'button:has-text("분석"), [role="tab"]:has-text("분석")',
    },

    // 상담 (Consultations)
    consultations: {
        addButton: 'button:has-text("상담 예약"), button:has-text("신규 상담")',
        calendar: '[data-testid="consultation-calendar"]',
        dateSelect: 'input[type="date"]',
        timeSelect: 'input[type="time"]',
        typeSelect: 'select[name="type"]',
        studentSelect: 'select[name="studentId"]',
        notesField: 'textarea[name="notes"]',
        summaryField: 'textarea[name="summary"]',
        saveButton: 'button[type="submit"], button:has-text("저장")',
    },

    // 성적 (Grades)
    grades: {
        addButton: 'button:has-text("성적 추가"), button:has-text("성적 입력")',
        subjectField: 'input[name="subject"]',
        scoreField: 'input[name="score"]',
        maxScoreField: 'input[name="maxScore"]',
        gradeTypeSelect: 'select[name="gradeType"]',
        testDateField: 'input[name="testDate"]',
        saveButton: 'button[type="submit"], button:has-text("저장")',
        deleteButton: 'button:has-text("삭제")',
        chart: '[data-testid="grade-chart"]',
    },

    // 분석 (Analytics)
    analytics: {
        aiAnalysisButton: 'button:has-text("AI 분석"), button:has-text("분석 실행")',
        reportSection: '[data-testid="analysis-report"]',
        downloadButton: 'button:has-text("다운로드")',
        pdfButton: 'button:has-text("PDF")',
    },

    // 시스템 설정 (System Settings)
    settings: {
        aiModelSelect: 'select[name="aiModel"]',
        apiKeyField: 'input[name="apiKey"]',
        saveButton: 'button[type="submit"], button:has-text("저장")',
        testButton: 'button:has-text("테스트"), button:has-text("연결 테스트")',
    },

    // 공통 UI 요소 (Common UI Elements)
    common: {
        modal: '[role="dialog"]',
        modalClose: 'button[aria-label="Close"], button:has-text("닫기")',
        confirmButton: 'button:has-text("확인"), button:has-text("예")',
        cancelButton: 'button:has-text("취소"), button:has-text("아니오")',
        toast: '[data-testid="toast"], [role="alert"]',
        loading: '[data-testid="loading"], .loading',
        errorMessage: '[data-testid="error"], .error-message',
        successMessage: '[data-testid="success"], .success-message',
    },

    // 테이블 (Tables)
    table: {
        header: 'thead',
        body: 'tbody',
        row: 'tr',
        cell: 'td',
        headerCell: 'th',
        actionButton: 'button[aria-label*="작업"], button:has-text("⋮")',
        editButton: 'button:has-text("수정")',
        deleteButton: 'button:has-text("삭제")',
        viewButton: 'button:has-text("보기")',
    },
} as const;

/**
 * 동적 셀렉터 생성 헬퍼
 */
export const dynamicSelectors = {
    /**
     * 특정 학생 ID의 행 선택
     */
    studentRow: (studentId: string) => `tr[data-student-id="${studentId}"]`,

    /**
     * 특정 텍스트를 포함하는 버튼
     */
    buttonWithText: (text: string) => `button:has-text("${text}")`,

    /**
     * 특정 name 속성을 가진 input
     */
    inputByName: (name: string) => `input[name="${name}"]`,

    /**
     * 특정 placeholder를 가진 input
     */
    inputByPlaceholder: (placeholder: string) => `input[placeholder*="${placeholder}"]`,

    /**
     * 특정 href를 가진 링크
     */
    linkByHref: (href: string) => `a[href="${href}"]`,
} as const;
