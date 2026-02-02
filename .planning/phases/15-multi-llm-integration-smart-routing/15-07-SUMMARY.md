# Plan 15-07 Summary: Cost Dashboard

## Execution Status: Complete ✓

**Duration:** ~12 minutes
**Commits:** 5

## What Was Built

### LLM 사용량 대시보드 페이지
- `src/app/(dashboard)/admin/llm-usage/page.tsx` - 메인 대시보드 페이지
  - 비용 요약 카드 (오늘/주간/월간)
  - 전체 통계 카드 (총 요청, 토큰, 비용, 평균 응답시간)
  - 예산 현황 섹션 (설정된 예산 대비 사용량)
  - DIRECTOR 권한 체크

### 사용량 차트 컴포넌트
- `src/app/(dashboard)/admin/llm-usage/usage-charts.tsx` - Recharts 기반 차트
  - 일별 비용 추이 (LineChart)
  - 일별 요청 수 (AreaChart)
  - 제공자별 분포 (PieChart)
  - 기능별 사용량 (BarChart)
  - 토큰 사용량 (BarChart)

### 알림 시스템
- `src/lib/actions/notifications.ts` - 알림 Server Actions
  - `getNotificationsAction()`: 알림 목록 조회
  - `checkBudgetAlertsAction()`: 예산 임계값 체크 및 알림 생성
  - `markNotificationReadAction()`: 알림 읽음 처리

- `src/components/layout/notification-bell.tsx` - 알림 벨 컴포넌트
  - 읽지 않은 알림 개수 배지
  - 드롭다운 메뉴로 알림 목록 표시
  - 알림 클릭 시 관련 페이지 이동

### 비용 알림 컴포넌트
- `src/app/(dashboard)/admin/llm-usage/cost-alerts.tsx` - 예산 경고 카드
  - 80%/100% 임계값 경고 표시
  - 예산 설정 링크

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 01b5184 | feat | LLM 사용량 차트 컴포넌트 추가 |
| b58e0e2 | feat | 알림 시스템 및 비용 알림 컴포넌트 추가 |
| d032794 | feat | LLM 사용량 대시보드 페이지 추가 |
| 9c3157e | feat | 대시보드 레이아웃에 알림 벨 통합 및 타입 오류 수정 |
| 529f40f | fix | Edge Runtime 호환성을 위해 middleware 로거 제거 |

## Verification

- [x] /admin/llm-usage 페이지 접근 가능 (DIRECTOR only)
- [x] 요약 카드 4개 표시 (비용 및 통계)
- [x] UsageCharts 컴포넌트 렌더링 (5개 차트)
- [x] NotificationBell 컴포넌트가 헤더에 표시
- [x] 비용 경고 시 CostAlerts 카드 표시

## Deviations

1. **Recharts Tooltip 타입 수정**: formatter 콜백의 value/name 파라미터가 undefined일 수 있어 타입 캐스팅 추가
2. **Edge Runtime 호환성**: Pino 로거의 `bindings()` 메서드가 Edge Runtime에서 지원되지 않아 middleware에서 직접 `crypto.randomUUID()` 사용
3. **NotificationBell 레이아웃 통합**: 별도 커밋으로 대시보드 레이아웃 헤더에 통합

## Notes

- 데이터가 없을 때 "아직 사용량 데이터가 없습니다" 메시지 표시
- 예산 미설정 시 "예산이 설정되지 않았습니다. LLM 설정에서 예산을 설정하세요." 안내
- 알림은 인메모리 저장 (서버 재시작 시 초기화)
