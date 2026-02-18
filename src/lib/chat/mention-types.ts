// 멘션 시스템 공유 타입 — Phase 36~40에서 사용

/**
 * 멘션 가능한 엔티티 타입
 * - student: 학생
 * - teacher: 선생님
 * - team: 팀(학급)
 */
export type MentionType = 'student' | 'teacher' | 'team';

/**
 * 클라이언트에서 서버로 전송되는 멘션 튜플
 * 클라이언트는 최소한의 정보만 전송하고, 서버에서 RBAC 포함 데이터 조회
 */
export type MentionItem = {
  type: MentionType;
  id: string;
};

/**
 * ChatMessage.mentionedEntities JSON에 저장되는 메타데이터
 * - id: 엔티티 ID
 * - type: 엔티티 타입
 * - displayName: UI 렌더링용 표시 이름
 * - accessDenied: RBAC 실패한 멘션 추적용 (선택적 필드)
 */
export type MentionedEntity = {
  id: string;
  type: MentionType;
  displayName: string;
  accessDenied?: boolean;
};

/**
 * mention-resolver가 반환하는 해결된 멘션 데이터
 * - item: 원본 멘션 튜플
 * - displayName: 표시 이름
 * - contextData: context-builder가 system prompt에 주입할 엔티티 요약 텍스트
 * - accessDenied: RBAC 실패 여부
 * - deniedReason: 접근 거부 사유 (선택적)
 */
export type ResolvedMention = {
  item: MentionItem;
  displayName: string;
  contextData: string;
  accessDenied: boolean;
  deniedReason?: string;
};

/**
 * mention-resolver의 전체 반환 타입
 * - resolved: 해결된 멘션 배열
 * - metadata: ChatMessage.mentionedEntities에 저장할 메타데이터 배열
 * - accessDeniedMessages: UI에 표시할 접근 거부 알림 메시지 배열
 *   형태: "○○○님은 접근 권한이 없어 제외되었습니다"
 */
export type MentionResolutionResult = {
  resolved: ResolvedMention[];
  metadata: MentionedEntity[];
  accessDeniedMessages: string[];
};
