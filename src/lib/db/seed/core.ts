/**
 * 시드 실행 핵심 로직 (CLI + 서버 액션 공용)
 *
 * 실행 순서: 팀 → 선생님 → 학생 → 학부모 → LLMConfig → Provider
 * 멱등성: upsert 패턴으로 여러 번 실행해도 안전합니다.
 */

import type { Prisma, PrismaClient } from "@prisma/client"
import argon2 from "argon2"
import path from "path"
import fs from "fs"
import {
  SEED_TEAMS,
  SEED_TEACHERS,
  SEED_STUDENTS,
  SEED_PARENTS,
  SEED_LLM_CONFIGS,
  SEED_PROVIDERS,
} from "./data"
import {
  ALL_SEED_GROUPS,
  SEED_GROUP_DEPENDENCIES,
  type SeedGroup,
  type SeedOptions,
  type SeedResult,
} from "./constants"

// 클라이언트에서도 사용할 수 있도록 constants에서 re-export
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
} from "./constants"

// ---------------------------------------------------------------------------
// 메인 함수
// ---------------------------------------------------------------------------

export async function runSeed(prisma: PrismaClient, options?: SeedOptions): Promise<SeedResult> {
  const groups = options?.groups ?? ALL_SEED_GROUPS
  const modes = options?.modes ?? {}
  const excludeTeacherId = options?.excludeTeacherId
  const resetGroups = new Set(groups.filter((g) => modes[g] === 'reset'))
  // 의존성 자동 확장
  for (const group of [...resetGroups]) {
    for (const dep of SEED_GROUP_DEPENDENCIES[group]) {
      resetGroups.add(dep)
    }
  }

  const txResult = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
        case 'teachers': {
          // Teacher를 참조하는 onDelete 미설정(Restrict) 테이블 먼저 삭제
          // IssueEvent → Issue 순서 (IssueEvent가 Issue를 참조)
          if (excludeTeacherId) {
            const notMe = { NOT: { performedBy: excludeTeacherId } }
            await tx.issueEvent.deleteMany({ where: notMe })
            await tx.issue.deleteMany({ where: { NOT: { createdBy: excludeTeacherId } } })
            await tx.assignmentProposal.deleteMany({ where: { NOT: { proposedBy: excludeTeacherId } } })
            await tx.passwordResetToken.deleteMany({ where: { NOT: { teacherId: excludeTeacherId } } })
            await tx.teacher.deleteMany({ where: { NOT: { id: excludeTeacherId } } })
          } else {
            await tx.issueEvent.deleteMany()
            await tx.issue.deleteMany()
            await tx.assignmentProposal.deleteMany()
            await tx.passwordResetToken.deleteMany()
            await tx.teacher.deleteMany()
          }
          break
        }
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

  // ── 이미지 업로드 (트랜잭션 밖 — Cloudinary 외부 API) ──
  await uploadSeedImages(prisma, groups)

  return txResult
}

// ---------------------------------------------------------------------------
// 이미지 업로드 헬퍼 (Cloudinary)
// ---------------------------------------------------------------------------

async function uploadSeedImages(prisma: PrismaClient, groups: SeedGroup[]) {
  // Cloudinary 설정 확인 — 미설정이면 건너뜀
  let cloudinary: typeof import("cloudinary").v2
  let buildResizedImageUrl: (publicId: string) => string
  try {
    const mod = await import("@/lib/cloudinary")
    if (!mod.isCloudinaryConfigured) {
      console.log("[seed] Cloudinary 미설정 — 이미지 업로드를 건너뜁니다")
      return
    }
    cloudinary = mod.cloudinary
    buildResizedImageUrl = mod.buildResizedImageUrl
  } catch {
    console.log("[seed] Cloudinary 모듈 로드 실패 — 이미지 업로드를 건너뜁니다")
    return
  }

  // 프로젝트 루트 경로 해석
  const projectRoot = process.cwd()

  // ── 선생님 프로필 이미지 ──
  if (groups.includes("teachers")) {
    for (const teacher of SEED_TEACHERS) {
      if (!teacher.imagePath) continue

      const absPath = path.resolve(projectRoot, teacher.imagePath)
      if (!fs.existsSync(absPath)) {
        console.warn(`[seed] 이미지 파일 없음: ${absPath}`)
        continue
      }

      // 이미 업로드된 이미지가 있으면 건너뜀
      const dbTeacher = await prisma.teacher.findUnique({
        where: { email: teacher.email },
        select: { id: true, profileImage: true },
      })
      if (!dbTeacher) continue
      if (dbTeacher.profileImage) continue

      try {
        const publicId = `afterschool/teachers/${teacher.email.split("@")[0]}`
        const uploadResult = await cloudinary.uploader.upload(absPath, {
          public_id: publicId,
          folder: undefined,
          overwrite: true,
          transformation: [{ width: 512, height: 512, crop: "fill", gravity: "auto" }],
        })

        await prisma.teacher.update({
          where: { id: dbTeacher.id },
          data: {
            profileImage: uploadResult.secure_url,
            profileImagePublicId: uploadResult.public_id,
          },
        })
        console.log(`[seed] 선생님 이미지 업로드: ${teacher.name}`)
      } catch (err) {
        console.error(`[seed] 선생님 이미지 업로드 실패 (${teacher.name}):`, err)
      }
    }
  }

  // ── 학생 프로필 이미지 ──
  if (groups.includes("students")) {
    for (const student of SEED_STUDENTS) {
      if (!student.imagePath) continue

      const absPath = path.resolve(projectRoot, student.imagePath)
      if (!fs.existsSync(absPath)) {
        console.warn(`[seed] 이미지 파일 없음: ${absPath}`)
        continue
      }

      // 학생 ID 조회
      const birthDate = new Date(student.birthDate)
      const dbStudent = await prisma.student.findFirst({
        where: { name: student.name, birthDate },
        select: { id: true },
      })
      if (!dbStudent) continue

      // 이미 프로필 이미지가 있으면 건너뜀
      const existingImage = await prisma.studentImage.findUnique({
        where: { studentId_type: { studentId: dbStudent.id, type: "profile" } },
      })
      if (existingImage) continue

      try {
        const safeName = student.name.replace(/\s/g, "_")
        const publicId = `afterschool/students/${safeName}_profile`
        const uploadResult = await cloudinary.uploader.upload(absPath, {
          public_id: publicId,
          folder: undefined,
          overwrite: true,
        })

        const resizedUrl = buildResizedImageUrl(uploadResult.public_id)

        await prisma.studentImage.create({
          data: {
            studentId: dbStudent.id,
            type: "profile",
            originalUrl: uploadResult.secure_url,
            resizedUrl,
            publicId: uploadResult.public_id,
            format: uploadResult.format,
            bytes: uploadResult.bytes,
            width: uploadResult.width,
            height: uploadResult.height,
          },
        })
        console.log(`[seed] 학생 이미지 업로드: ${student.name}`)
      } catch (err) {
        console.error(`[seed] 학생 이미지 업로드 실패 (${student.name}):`, err)
      }
    }
  }
}
