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

export const SEED_TEAMS = [] as const

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

export const SEED_STUDENTS: SeedStudent[] = []

// ---------------------------------------------------------------------------
// 학부모
// ---------------------------------------------------------------------------

export type SeedParent = {
  name: string
  phone: string
  relation: ParentRelation
  studentName: string
}

export const SEED_PARENTS: SeedParent[] = []

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
