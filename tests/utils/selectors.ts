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

    // 학생 탭 (Student Tabs) - data-testid 기반
    studentTabs: {
        // 현재 구현: data-testid={`${tab.id}-tab`} 형태 사용
        learning: '[data-testid="learning-tab"]',
        analysis: '[data-testid="analysis-tab"]',
        matching: '[data-testid="matching-tab"]',
        counseling: '[data-testid="counseling-tab"]',
        report: '[data-testid="report-tab"]',
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

        // AI 분석 관련
        runAnalysisButton: '[data-testid="run-analysis-button"]',
        analysisLoading: '[data-testid="analysis-loading"]',
        analysisResults: '[data-testid="analysis-results"]',

        // 사주 분석
        sajuPanel: '[data-testid="saju-panel"]',
        sajuTab: '[data-testid="saju-tab"]',
        sajuResult: '[data-testid="saju-result"]',
        ohangAnalysis: '[data-testid="ohang-analysis"]',
        suriAnalysis: '[data-testid="suri-analysis"]',
        yearPillar: '[data-testid="year-pillar"]',
        monthPillar: '[data-testid="month-pillar"]',
        dayPillar: '[data-testid="day-pillar"]',
        hourPillar: '[data-testid="hour-pillar"]',
        sajuSummary: '[data-testid="saju-summary"]',

        // 관상 분석
        physiognomyTab: '[data-testid="physiognomy-tab"]',
        physiognomyResult: '[data-testid="physiognomy-result"]',
        imagePreview: '[data-testid="image-preview"]',
        aiLoading: '[data-testid="ai-loading"]',
        physiognomySummary: '[data-testid="physiognomy-summary"]',

        // MBTI 분석
        mbtiTab: '[data-testid="mbti-tab"]',
        mbtiSelect: '[data-testid="mbti-select"]',
        directInputOption: '[data-testid="direct-input-option"]',
        surveyInputOption: '[data-testid="survey-input-option"]',
        mbtiResultCard: '[data-testid="mbti-result-card"]',
        mbtiDescription: '[data-testid="mbti-description"]',
        mbtiStrengths: '[data-testid="mbti-strengths"]',
        mbtiWeaknesses: '[data-testid="mbti-weaknesses"]',
        learningStyle: '[data-testid="learning-style"]',
        mbtiBadge: '[data-testid="mbti-badge"]',

        // 통합 요약
        studentDashboard: '[data-testid="student-dashboard"]',
        aggregationLoading: '[data-testid="aggregation-loading"]',
        analysisProgress: '[data-testid="analysis-progress"]',
        aiSummaryResult: '[data-testid="ai-summary-result"]',
        aiSummaryText: '[data-testid="ai-summary-text"]',
        personalityInsights: '[data-testid="personality-insights"]',
        learningRecommendations: '[data-testid="learning-recommendations"]',
        socialTendencies: '[data-testid="social-tendencies"]',
        strengthsSection: '[data-testid="strengths-section"]',
        areasToDevelop: '[data-testid="areas-to-develop"]',
        summarySavedIndicator: '[data-testid="summary-saved-indicator"]',
        warningNoData: '[data-testid="warning-no-data"]',

        // 분석 히스토리
        analysisHistory: '[data-testid="analysis-history"]',
        historyDetailModal: '[data-testid="history-detail-modal"]',

        // 설문조사
        mbtiQuestion: (index: number) => `[data-testid="mbti-question-${index}"]`,
        draftSavedToast: '[data-testid="draft-saved-toast"]',

        // AI 요약
        aiSummary: '[data-testid="ai-summary"]',
    },

    // 시스템 설정 (System Settings)
    settings: {
        aiModelSelect: 'select[name="aiModel"]',
        apiKeyField: 'input[name="apiKey"]',
        saveButton: 'button[type="submit"], button:has-text("저장")',
        testButton: 'button:has-text("테스트"), button:has-text("연결 테스트")',
    },

    // 관리자 페이지 (Admin Pages) - data-testid 기반
    admin: {
        tabs: '[data-testid="admin-tabs"]',
        llmSettings: 'button[value="llm-settings"]',
        llmUsage: 'button[value="llm-usage"]',
        systemStatus: 'button[value="system-status"]',
        systemLogs: 'button[value="system-logs"]',
        database: 'button[value="database"]',
        auditLogs: 'button[value="audit-logs"]',

        // LLM 설정 관련
        currentProvider: '[data-testid="current-provider"]',
        providerSelect: '[data-testid="provider-select"]',
        apiKeyDisplay: '[data-testid="api-key-display"]',

        // LLM 사용량 관련
        totalTokens: '[data-testid="total-tokens"]',
        estimatedCost: '[data-testid="estimated-cost"]',
        usageChart: '[data-testid="usage-chart"]',
        modelBreakdown: '[data-testid="model-breakdown"]',
        featureBreakdown: '[data-testid="feature-breakdown"]',
        dateRangeSelector: '[data-testid="date-range-selector"]',

        // 시스템 로그 관련
        logsTab: '[data-testid="logs-tab"]',
        systemLogsTable: '[data-testid="system-logs-table"]',
        logRow: '[data-testid="log-row"]',
        logTimestamp: '[data-testid="log-timestamp"]',
        logLevel: '[data-testid="log-level"]',
        logMessage: '[data-testid="log-message"]',

        // 감사 로그 관련
        auditTab: '[data-testid="audit-tab"]',
        auditLogsTable: '[data-testid="audit-logs-table"]',
        auditLogRow: '[data-testid="audit-log-row"]',
    },

    // 상담 관련 (Counseling) - data-testid 기반
    counseling: {
        // 캘린더 및 검색
        searchIcon: '[data-testid="search-icon"]',
        unifiedSearchInput: '[data-testid="unified-search-input"]',
        clearSearchButton: '[data-testid="clear-search-button"]',
        searchButton: '[data-testid="search-button"]',

        // 캘린더 탭
        historyTab: '[data-tab="history"]',
        reservationsTab: '[data-tab="reservations"]',
        calendarTab: '[data-tab="calendar"]',

        // 세션 카드
        session: '[data-testid="counseling-session"]',

        // 통계 카드
        monthlySessions: '[data-testid="monthly-sessions"]',
        totalSessions: '[data-testid="total-sessions"]',
        avgDuration: '[data-testid="avg-duration"]',
        followupCount: '[data-testid="followup-count"]',
    },

    // 에러 페이지 (Error Pages)
    errorPages: {
        notFound: '[data-testid="not-found-page"], text=/404|찾을 수 없습니다|Not Found/i',
        accessDenied: '[data-testid="access-denied-page"], text=/403|권한|access.*denied/i',
        serverError: '[data-testid="server-error-page"], text=/500|서버 오류|server.*error/i',
    },

    // 공통 UI 요소 (Common UI Elements)
    common: {
        modal: '[role="dialog"]',
        modalClose: 'button[aria-label="Close"], button:has-text("닫기")',
        confirmButton: 'button:has-text("확인"), button:has-text("예")',
        cancelButton: 'button:has-text("취소"), button:has-text("아니오")',
        toast: '[data-testid="toast"], [role="alert"]',
        toastSuccess: '[data-testid="toast-success"], .toast-success',
        toastError: '[data-testid="toast-error"], .toast-error',
        loading: '[data-testid="loading"], .loading',
        errorMessage: '[data-testid="error"], [data-testid="error-message"], .error-message',
        successMessage: '[data-testid="success"], [data-testid="success-message"], .success-message',
        formError: '[data-testid="form-error"]',
        confirmModal: '[data-testid="confirm-modal"]',

        // 위젯
        followUpWidget: '[data-widget="follow-up"]',
        upcomingCounseling: '[data-widget="upcoming-counseling"]',
    },

    // 인증 확장 (Authentication Extended)
    authExtended: {
        emailInput: 'input[name="email"]',
        passwordInput: 'input[name="password"]',
        loginButton: 'button[type="submit"]',
        logoutButton: 'button:has-text("로그아웃"), a:has-text("로그아웃"), [aria-label*="logout" i]',
        userMenu: '[data-testid="user-menu"]',
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
