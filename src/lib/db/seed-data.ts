/**
 * 시드 데이터 정의 (순수 데이터, DB 의존성 없음)
 *
 * 운영 DB(2026-02-14)에서 추출한 데모/개발용 시드 데이터입니다.
 * 비밀번호는 평문으로 정의하고 runSeed 실행 시 해시됩니다.
 * API 키(apiKeyEncrypted)는 포함하지 않습니다.
 */

import type { Role, ParentRelation } from "@prisma/client"

// ---------------------------------------------------------------------------
// 팀
// ---------------------------------------------------------------------------

export const SEED_TEAMS = [
  { name: "수학팀" },
  { name: "영어팀" },
  { name: "국어팀" },
] as const

// ---------------------------------------------------------------------------
// 선생님
// ---------------------------------------------------------------------------

export type SeedTeacher = {
  email: string
  name: string
  password: string
  phone: string | null
  role: Role
  teamName: string | null
  birthDate: string | null
  birthTimeHour: number | null
  birthTimeMinute: number | null
  nameHanja: unknown | null
}

export const SEED_TEACHERS: SeedTeacher[] = [
  {
    email: "admin@afterschool.com",
    name: "관리자",
    password: "admin1234",
    phone: null,
    role: "DIRECTOR",
    teamName: null,
    birthDate: null,
    birthTimeHour: null,
    birthTimeMinute: null,
    nameHanja: null,
  },
  {
    email: "test@afterschool.com",
    name: "테스트 선생님",
    password: "test1234",
    phone: null,
    role: "TEACHER",
    teamName: null,
    birthDate: null,
    birthTimeHour: null,
    birthTimeMinute: null,
    nameHanja: null,
  },
  {
    email: "math1@school.com",
    name: "김수학",
    password: "test1234",
    phone: "010-1111-1111",
    role: "TEAM_LEADER",
    teamName: "수학팀",
    birthDate: "1985-03-12",
    birthTimeHour: 9,
    birthTimeMinute: 30,
    nameHanja: ["金", "秀", "學"],
  },
  {
    email: "math2@school.com",
    name: "이대수",
    password: "test1234",
    phone: "010-1111-2222",
    role: "TEACHER",
    teamName: "수학팀",
    birthDate: "1990-07-25",
    birthTimeHour: 14,
    birthTimeMinute: 0,
    nameHanja: ["李", "大", "秀"],
  },
  {
    email: "eng1@school.com",
    name: "박영어",
    password: "test1234",
    phone: "010-2222-1111",
    role: "TEAM_LEADER",
    teamName: "영어팀",
    birthDate: "1988-11-08",
    birthTimeHour: 7,
    birthTimeMinute: 15,
    nameHanja: ["朴", "英", "語"],
  },
  {
    email: "kor1@school.com",
    name: "최국어",
    password: "test1234",
    phone: "010-3333-1111",
    role: "TEACHER",
    teamName: "국어팀",
    birthDate: "1992-01-20",
    birthTimeHour: null,
    birthTimeMinute: null,
    nameHanja: ["崔", "國", "語"],
  },
  {
    email: "sci1@school.com",
    name: "정과학",
    password: "test1234",
    phone: "010-4444-1111",
    role: "TEACHER",
    teamName: "수학팀",
    birthDate: "1987-06-15",
    birthTimeHour: 11,
    birthTimeMinute: 45,
    nameHanja: ["鄭", "科", "學"],
  },
  {
    email: "soc1@school.com",
    name: "한사회",
    password: "test1234",
    phone: "010-5555-1111",
    role: "TEACHER",
    teamName: "영어팀",
    birthDate: "1993-09-03",
    birthTimeHour: 16,
    birthTimeMinute: 20,
    nameHanja: null,
  },
  {
    email: "art1@school.com",
    name: "윤예술",
    password: "test1234",
    phone: "010-6666-1111",
    role: "TEACHER",
    teamName: "국어팀",
    birthDate: "1995-12-28",
    birthTimeHour: 6,
    birthTimeMinute: 0,
    nameHanja: ["尹", "藝", "術"],
  },
  {
    email: "music1@school.com",
    name: "송음악",
    password: "test1234",
    phone: "010-7777-1111",
    role: "TEACHER",
    teamName: "국어팀",
    birthDate: "1991-04-10",
    birthTimeHour: null,
    birthTimeMinute: null,
    nameHanja: null,
  },
]

// ---------------------------------------------------------------------------
// 학생
// ---------------------------------------------------------------------------

export type SeedStudent = {
  name: string
  school: string
  grade: number
  birthDate: string
  birthTimeHour: number | null
  birthTimeMinute: number | null
  nameHanja: unknown | null
  phone: string | null
  teacherEmail: string
  teamName: string
}

export const SEED_STUDENTS: SeedStudent[] = [
  {
    name: "홍길동",
    school: "서울중학교",
    grade: 2,
    birthDate: "2012-03-15",
    birthTimeHour: 8,
    birthTimeMinute: 30,
    nameHanja: ["洪", "吉", "東"],
    phone: "010-1234-5678",
    teacherEmail: "math1@school.com",
    teamName: "수학팀",
  },
  {
    name: "김영희",
    school: "서울중학교",
    grade: 2,
    birthDate: "2012-05-20",
    birthTimeHour: 14,
    birthTimeMinute: 0,
    nameHanja: ["金", "英", "姬"],
    phone: "010-2345-6789",
    teacherEmail: "math1@school.com",
    teamName: "수학팀",
  },
  {
    name: "이철수",
    school: "강남중학교",
    grade: 3,
    birthDate: "2011-08-10",
    birthTimeHour: 10,
    birthTimeMinute: 15,
    nameHanja: ["李", "哲", "洙"],
    phone: "010-3456-7890",
    teacherEmail: "math2@school.com",
    teamName: "수학팀",
  },
  {
    name: "박지민",
    school: "강남중학교",
    grade: 1,
    birthDate: "2013-01-25",
    birthTimeHour: null,
    birthTimeMinute: null,
    nameHanja: ["朴", "志", "旻"],
    phone: "010-4567-8901",
    teacherEmail: "eng1@school.com",
    teamName: "영어팀",
  },
  {
    name: "최민수",
    school: "서초중학교",
    grade: 2,
    birthDate: "2012-11-30",
    birthTimeHour: 22,
    birthTimeMinute: 10,
    nameHanja: ["崔", "敏", "秀"],
    phone: "010-5678-9012",
    teacherEmail: "eng1@school.com",
    teamName: "영어팀",
  },
  {
    name: "정수아",
    school: "서초중학교",
    grade: 3,
    birthDate: "2011-04-05",
    birthTimeHour: 5,
    birthTimeMinute: 45,
    nameHanja: ["鄭", "秀", "雅"],
    phone: "010-6789-0123",
    teacherEmail: "kor1@school.com",
    teamName: "국어팀",
  },
  {
    name: "강민호",
    school: "송파중학교",
    grade: 1,
    birthDate: "2013-07-12",
    birthTimeHour: 12,
    birthTimeMinute: 0,
    nameHanja: ["姜", "民", "浩"],
    phone: "010-7890-1234",
    teacherEmail: "math1@school.com",
    teamName: "수학팀",
  },
  {
    name: "윤서연",
    school: "송파중학교",
    grade: 2,
    birthDate: "2012-09-18",
    birthTimeHour: 19,
    birthTimeMinute: 30,
    nameHanja: ["尹", "瑞", "妍"],
    phone: "010-8901-2345",
    teacherEmail: "math2@school.com",
    teamName: "수학팀",
  },
]

// ---------------------------------------------------------------------------
// 학부모
// ---------------------------------------------------------------------------

export type SeedParent = {
  name: string
  phone: string
  relation: ParentRelation
  studentName: string
}

export const SEED_PARENTS: SeedParent[] = [
  { name: "홍판서", phone: "010-1234-0001", relation: "FATHER", studentName: "홍길동" },
  { name: "김미영", phone: "010-1234-0002", relation: "MOTHER", studentName: "홍길동" },
  { name: "김태호", phone: "010-2345-0001", relation: "FATHER", studentName: "김영희" },
  { name: "이지수", phone: "010-3456-0001", relation: "MOTHER", studentName: "이철수" },
  { name: "박성민", phone: "010-4567-0001", relation: "FATHER", studentName: "박지민" },
  { name: "최은정", phone: "010-5678-0001", relation: "MOTHER", studentName: "최민수" },
  { name: "정혜란", phone: "010-6789-0001", relation: "MOTHER", studentName: "정수아" },
  { name: "강동원", phone: "010-7890-0001", relation: "FATHER", studentName: "강민호" },
  { name: "윤미라", phone: "010-8901-0001", relation: "MOTHER", studentName: "윤서연" },
]

// ---------------------------------------------------------------------------
// LLM 설정
// ---------------------------------------------------------------------------

export type SeedLLMConfig = {
  provider: string
  displayName: string
  baseUrl: string | null
  defaultModel: string | null
}

export const SEED_LLM_CONFIGS: SeedLLMConfig[] = [
  { provider: "ollama", displayName: "Ollama (로컬)", baseUrl: "http://localhost:11434", defaultModel: "gemma3:12b" },
  { provider: "anthropic", displayName: "Anthropic", baseUrl: null, defaultModel: "claude-sonnet-4-5-20250514" },
  { provider: "openai", displayName: "OpenAI", baseUrl: null, defaultModel: "gpt-4o" },
  { provider: "google", displayName: "Google AI", baseUrl: null, defaultModel: "gemini-2.0-flash" },
  { provider: "deepseek", displayName: "DeepSeek", baseUrl: "https://api.deepseek.com", defaultModel: "deepseek-chat" },
  { provider: "mistral", displayName: "Mistral AI", baseUrl: null, defaultModel: "mistral-large-latest" },
]

// ---------------------------------------------------------------------------
// Provider (Universal LLM Hub)
// ---------------------------------------------------------------------------

export type SeedProvider = {
  name: string
  providerType: string
  baseUrl: string | null
  authType: string
  capabilities: string[]
  costTier: string
  qualityTier: string
}

export const SEED_PROVIDERS: SeedProvider[] = [
  {
    name: "Ollama (로컬)",
    providerType: "ollama",
    baseUrl: "http://localhost:11434",
    authType: "none",
    capabilities: ["text", "vision"],
    costTier: "free",
    qualityTier: "medium",
  },
  {
    name: "Anthropic",
    providerType: "anthropic",
    baseUrl: null,
    authType: "api_key",
    capabilities: ["text", "vision", "tools"],
    costTier: "premium",
    qualityTier: "high",
  },
  {
    name: "OpenAI",
    providerType: "openai",
    baseUrl: null,
    authType: "api_key",
    capabilities: ["text", "vision", "tools"],
    costTier: "premium",
    qualityTier: "high",
  },
  {
    name: "Google AI",
    providerType: "google",
    baseUrl: null,
    authType: "api_key",
    capabilities: ["text", "vision", "tools"],
    costTier: "standard",
    qualityTier: "high",
  },
  {
    name: "DeepSeek",
    providerType: "deepseek",
    baseUrl: "https://api.deepseek.com",
    authType: "api_key",
    capabilities: ["text"],
    costTier: "budget",
    qualityTier: "medium",
  },
  {
    name: "Mistral AI",
    providerType: "mistral",
    baseUrl: null,
    authType: "api_key",
    capabilities: ["text", "tools"],
    costTier: "standard",
    qualityTier: "medium",
  },
  {
    name: "xAI (Grok)",
    providerType: "xai",
    baseUrl: "https://api.x.ai",
    authType: "api_key",
    capabilities: ["text"],
    costTier: "standard",
    qualityTier: "medium",
  },
]
