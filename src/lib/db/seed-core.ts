/**
 * 시드 실행 핵심 로직 (CLI + 서버 액션 공용)
 *
 * 실행 순서: 팀 → 선생님 → 학생 → 학부모 → LLMConfig → Provider
 * 멱등성: upsert 패턴으로 여러 번 실행해도 안전합니다.
 */

import type { Prisma, PrismaClient } from "@prisma/client"
import argon2 from "argon2"
import {
  SEED_TEAMS,
  SEED_TEACHERS,
  SEED_STUDENTS,
  SEED_PARENTS,
  SEED_LLM_CONFIGS,
  SEED_PROVIDERS,
} from "./seed-data"
import {
  ALL_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  type SeedGroup,
  type SeedOptions,
  type SeedResult,
} from "./seed-constants"

// 클라이언트에서도 사용할 수 있도록 seed-constants에서 re-export
export {
  ALL_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  SEED_GROUP_LABELS,
  SEED_GROUP_COUNTS,
  type SeedGroup,
  type SeedMode,
  type SeedOptions,
  type SeedModelResult,
  type SeedResult,
} from "./seed-constants"

// ---------------------------------------------------------------------------
// 메인 함수
// ---------------------------------------------------------------------------

export async function runSeed(prisma: PrismaClient, options?: SeedOptions): Promise<SeedResult> {
  const groups = options?.groups ?? ALL_SEED_GROUPS
  const modes = options?.modes ?? {}
  const resetGroups = new Set(groups.filter((g) => modes[g] === 'reset'))
  // 의존성 자동 확장
  for (const group of [...resetGroups]) {
    for (const dep of SEED_GROUP_DEPENDENCIES[group]) {
      resetGroups.add(dep)
    }
  }

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const result: SeedResult = {
      teams: { created: 0, updated: 0 },
      teachers: { created: 0, updated: 0 },
      students: { created: 0, updated: 0 },
      parents: { created: 0, updated: 0 },
      llmConfigs: { created: 0, updated: 0 },
      providers: { created: 0, updated: 0 },
    }

    // ── 0. 리셋 단계 (FK 역순으로 삭제) ──────────
    const deleteOrder: SeedGroup[] = ['parents', 'students', 'teachers', 'teams', 'llmConfigs', 'providers']
    for (const group of deleteOrder) {
      if (!resetGroups.has(group) || !groups.includes(group)) continue
      switch (group) {
        case 'parents': await tx.parent.deleteMany(); break
        case 'students': await tx.student.deleteMany(); break
        case 'teachers': await tx.teacher.deleteMany(); break
        case 'teams': await tx.team.deleteMany(); break
        case 'llmConfigs': await tx.lLMConfig.deleteMany(); break
        case 'providers': await tx.provider.deleteMany(); break
      }
    }

    // ── 1. 팀 ──────────────────────────────────
    if (groups.includes('teams')) {
      for (const team of SEED_TEAMS) {
        const existing = await tx.team.findUnique({ where: { name: team.name } })
        if (existing) {
          result.teams.updated++
        } else {
          await tx.team.create({ data: { name: team.name } })
          result.teams.created++
        }
      }
    }

    // 팀 이름 → ID 맵 구축 (다른 그룹이 참조할 수 있으므로 항상 수행)
    const allTeams = await tx.team.findMany()
    const teamMap = new Map(allTeams.map((t) => [t.name, t.id]))

    // ── 2. 선생님 ──────────────────────────────
    if (groups.includes('teachers')) {
      for (const teacher of SEED_TEACHERS) {
        const existing = await tx.teacher.findUnique({ where: { email: teacher.email } })
        const teamId = teacher.teamName ? teamMap.get(teacher.teamName) ?? null : null

        if (existing) {
          // 비밀번호는 변경하지 않음 (운영 설정 보존)
          await tx.teacher.update({
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
          await tx.teacher.create({
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
    }

    // 선생님 email → ID 맵 구축 (다른 그룹이 참조할 수 있으므로 항상 수행)
    const allTeachers = await tx.teacher.findMany({ select: { id: true, email: true } })
    const teacherMap = new Map(allTeachers.map((t) => [t.email, t.id]))

    // ── 3. 학생 ──────────────────────────────────
    if (groups.includes('students')) {
      for (const student of SEED_STUDENTS) {
        const teacherId = teacherMap.get(student.teacherEmail) ?? null
        const teamId = teamMap.get(student.teamName) ?? null
        const birthDate = new Date(student.birthDate)

        // unique 키가 없으므로 name + birthDate로 식별
        const existing = await tx.student.findFirst({
          where: { name: student.name, birthDate },
        })

        if (existing) {
          await tx.student.update({
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
          await tx.student.create({
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
    }

    // 학생 이름 → ID 맵 구축 (학부모 연결용, 항상 수행)
    const allStudents = await tx.student.findMany({ select: { id: true, name: true } })
    const studentMap = new Map(allStudents.map((s) => [s.name, s.id]))

    // ── 4. 학부모 ──────────────────────────────────
    if (groups.includes('parents')) {
      for (const parent of SEED_PARENTS) {
        const studentId = studentMap.get(parent.studentName)
        if (!studentId) continue

        const existing = await tx.parent.findFirst({
          where: { studentId, name: parent.name },
        })

        if (existing) {
          await tx.parent.update({
            where: { id: existing.id },
            data: {
              name: parent.name,
              phone: parent.phone,
              relation: parent.relation,
            },
          })
          result.parents.updated++
        } else {
          await tx.parent.create({
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
    }

    // ── 5. LLMConfig ──────────────────────────────
    if (groups.includes('llmConfigs')) {
      for (const config of SEED_LLM_CONFIGS) {
        const existing = await tx.lLMConfig.findUnique({ where: { provider: config.provider } })
        if (existing) {
          // isEnabled, isValidated, apiKeyEncrypted 보존
          await tx.lLMConfig.update({
            where: { provider: config.provider },
            data: {
              displayName: config.displayName,
              baseUrl: config.baseUrl,
              defaultModel: config.defaultModel,
            },
          })
          result.llmConfigs.updated++
        } else {
          await tx.lLMConfig.create({
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
    }

    // ── 6. Provider (Universal LLM Hub) ────────────
    if (groups.includes('providers')) {
      for (const provider of SEED_PROVIDERS) {
        const existing = await tx.provider.findFirst({
          where: { providerType: provider.providerType, name: provider.name },
        })

        if (existing) {
          // isEnabled, isValidated, apiKeyEncrypted 보존
          await tx.provider.update({
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
          await tx.provider.create({
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
    }

    return result
  }, { timeout: 30000 })
}
