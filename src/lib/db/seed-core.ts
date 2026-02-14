/**
 * 시드 실행 핵심 로직 (CLI + 서버 액션 공용)
 *
 * 실행 순서: 팀 → 선생님 → 학생 → 학부모 → LLMConfig → Provider
 * 멱등성: upsert 패턴으로 여러 번 실행해도 안전합니다.
 */

import type { PrismaClient } from "@prisma/client"
import argon2 from "argon2"
import {
  SEED_TEAMS,
  SEED_TEACHERS,
  SEED_STUDENTS,
  SEED_PARENTS,
  SEED_LLM_CONFIGS,
  SEED_PROVIDERS,
} from "./seed-data"

// ---------------------------------------------------------------------------
// 결과 타입
// ---------------------------------------------------------------------------

export type SeedModelResult = { created: number; updated: number }

export type SeedResult = {
  teams: SeedModelResult
  teachers: SeedModelResult
  students: SeedModelResult
  parents: SeedModelResult
  llmConfigs: SeedModelResult
  providers: SeedModelResult
}

// ---------------------------------------------------------------------------
// 메인 함수
// ---------------------------------------------------------------------------

export async function runSeed(prisma: PrismaClient): Promise<SeedResult> {
  const result: SeedResult = {
    teams: { created: 0, updated: 0 },
    teachers: { created: 0, updated: 0 },
    students: { created: 0, updated: 0 },
    parents: { created: 0, updated: 0 },
    llmConfigs: { created: 0, updated: 0 },
    providers: { created: 0, updated: 0 },
  }

  // ── 1. 팀 ──────────────────────────────────
  for (const team of SEED_TEAMS) {
    const existing = await prisma.team.findUnique({ where: { name: team.name } })
    if (existing) {
      result.teams.updated++
    } else {
      await prisma.team.create({ data: { name: team.name } })
      result.teams.created++
    }
  }

  // 팀 이름 → ID 맵 구축
  const allTeams = await prisma.team.findMany()
  const teamMap = new Map(allTeams.map((t) => [t.name, t.id]))

  // ── 2. 선생님 ──────────────────────────────
  for (const teacher of SEED_TEACHERS) {
    const existing = await prisma.teacher.findUnique({ where: { email: teacher.email } })
    const teamId = teacher.teamName ? teamMap.get(teacher.teamName) ?? null : null

    if (existing) {
      // 비밀번호는 변경하지 않음 (운영 설정 보존)
      await prisma.teacher.update({
        where: { email: teacher.email },
        data: {
          name: teacher.name,
          phone: teacher.phone,
          role: teacher.role,
          teamId,
          birthDate: teacher.birthDate ? new Date(teacher.birthDate) : null,
          birthTimeHour: teacher.birthTimeHour,
          birthTimeMinute: teacher.birthTimeMinute,
          nameHanja: teacher.nameHanja ?? undefined,
        },
      })
      result.teachers.updated++
    } else {
      const hashedPassword = await argon2.hash(teacher.password)
      await prisma.teacher.create({
        data: {
          email: teacher.email,
          password: hashedPassword,
          name: teacher.name,
          phone: teacher.phone,
          role: teacher.role,
          teamId,
          birthDate: teacher.birthDate ? new Date(teacher.birthDate) : null,
          birthTimeHour: teacher.birthTimeHour,
          birthTimeMinute: teacher.birthTimeMinute,
          nameHanja: teacher.nameHanja ?? undefined,
        },
      })
      result.teachers.created++
    }
  }

  // 선생님 email → ID 맵 구축
  const allTeachers = await prisma.teacher.findMany({ select: { id: true, email: true } })
  const teacherMap = new Map(allTeachers.map((t) => [t.email, t.id]))

  // ── 3. 학생 ──────────────────────────────────
  for (const student of SEED_STUDENTS) {
    const teacherId = teacherMap.get(student.teacherEmail) ?? null
    const teamId = teamMap.get(student.teamName) ?? null
    const birthDate = new Date(student.birthDate)

    // unique 키가 없으므로 name + birthDate로 식별
    const existing = await prisma.student.findFirst({
      where: { name: student.name, birthDate },
    })

    if (existing) {
      await prisma.student.update({
        where: { id: existing.id },
        data: {
          school: student.school,
          grade: student.grade,
          birthTimeHour: student.birthTimeHour,
          birthTimeMinute: student.birthTimeMinute,
          nameHanja: student.nameHanja ?? undefined,
          phone: student.phone,
          ...(teacherId && { teacherId }),
          ...(teamId && { teamId }),
        },
      })
      result.students.updated++
    } else {
      // 시드 데이터의 학생은 항상 담당 선생님이 지정됨
      if (!teacherId) continue
      await prisma.student.create({
        data: {
          name: student.name,
          school: student.school,
          grade: student.grade,
          birthDate,
          birthTimeHour: student.birthTimeHour,
          birthTimeMinute: student.birthTimeMinute,
          nameHanja: student.nameHanja ?? undefined,
          phone: student.phone,
          teacherId,
          teamId,
        },
      })
      result.students.created++
    }
  }

  // 학생 이름 → ID 맵 구축 (학부모 연결용)
  const allStudents = await prisma.student.findMany({ select: { id: true, name: true } })
  const studentMap = new Map(allStudents.map((s) => [s.name, s.id]))

  // ── 4. 학부모 ──────────────────────────────────
  for (const parent of SEED_PARENTS) {
    const studentId = studentMap.get(parent.studentName)
    if (!studentId) continue

    const existing = await prisma.parent.findFirst({
      where: { studentId, name: parent.name },
    })

    if (existing) {
      await prisma.parent.update({
        where: { id: existing.id },
        data: {
          name: parent.name,
          phone: parent.phone,
          relation: parent.relation,
        },
      })
      result.parents.updated++
    } else {
      await prisma.parent.create({
        data: {
          name: parent.name,
          phone: parent.phone,
          relation: parent.relation,
          student: { connect: { id: studentId } },
        },
      })
      result.parents.created++
    }
  }

  // ── 5. LLMConfig ──────────────────────────────
  for (const config of SEED_LLM_CONFIGS) {
    const existing = await prisma.lLMConfig.findUnique({ where: { provider: config.provider } })
    if (existing) {
      // isEnabled, isValidated, apiKeyEncrypted 보존
      await prisma.lLMConfig.update({
        where: { provider: config.provider },
        data: {
          displayName: config.displayName,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel,
        },
      })
      result.llmConfigs.updated++
    } else {
      await prisma.lLMConfig.create({
        data: {
          provider: config.provider,
          displayName: config.displayName,
          baseUrl: config.baseUrl,
          defaultModel: config.defaultModel,
        },
      })
      result.llmConfigs.created++
    }
  }

  // ── 6. Provider (Universal LLM Hub) ────────────
  for (const provider of SEED_PROVIDERS) {
    const existing = await prisma.provider.findFirst({
      where: { providerType: provider.providerType, name: provider.name },
    })

    if (existing) {
      // isEnabled, isValidated, apiKeyEncrypted 보존
      await prisma.provider.update({
        where: { id: existing.id },
        data: {
          baseUrl: provider.baseUrl,
          authType: provider.authType,
          capabilities: provider.capabilities,
          costTier: provider.costTier,
          qualityTier: provider.qualityTier,
        },
      })
      result.providers.updated++
    } else {
      await prisma.provider.create({
        data: {
          name: provider.name,
          providerType: provider.providerType,
          baseUrl: provider.baseUrl,
          authType: provider.authType,
          capabilities: provider.capabilities,
          costTier: provider.costTier,
          qualityTier: provider.qualityTier,
        },
      })
      result.providers.created++
    }
  }

  return result
}
