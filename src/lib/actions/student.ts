"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ParentRelation, StudentImageType } from "@prisma/client";

const createStudentSchema = z.object({
    name: z.string().min(1, "이름을 입력해주세요"),
    birthDate: z.string().min(1, "생년월일을 입력해주세요"),
    grade: z.coerce.number().min(1, "학년을 선택해주세요"),
    school: z.string().min(1, "학교를 입력해주세요"),
    parentName: z.string().optional(),
    parentPhone: z.string().optional(),
});

export async function createStudent(formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Unauthorized");
    }

    const rawData = {
        name: formData.get("name"),
        birthDate: formData.get("birthDate"),
        grade: formData.get("grade"),
        school: formData.get("school"),
        parentName: formData.get("parentName"),
        parentPhone: formData.get("parentPhone"),
    };

    const validatedData = createStudentSchema.parse(rawData);

    const birthTimeHourRaw = formData.get("birthTimeHour") as string | null;
    const birthTimeMinuteRaw = formData.get("birthTimeMinute") as string | null;
    const birthTimeHour = birthTimeHourRaw !== null && birthTimeHourRaw !== "" ? parseInt(birthTimeHourRaw, 10) : null;
    const birthTimeMinute = birthTimeMinuteRaw !== null && birthTimeMinuteRaw !== "" ? parseInt(birthTimeMinuteRaw, 10) : null;

    const result = await db.$transaction(async (tx) => {
        // 1. 학생 생성
        const student = await tx.student.create({
            data: {
                name: validatedData.name,
                birthDate: new Date(validatedData.birthDate),
                grade: validatedData.grade,
                school: validatedData.school,
                teacherId: session.userId,
                birthTimeHour,
                birthTimeMinute,
            },
        });

        // 2. 부모 생성
        if (validatedData.parentName && validatedData.parentPhone) {
            try {
                await tx.parent.create({
                    data: {
                        name: validatedData.parentName,
                        phone: validatedData.parentPhone,
                        relation: ParentRelation.MOTHER,
                        isPrimary: true,
                        studentId: student.id
                    }
                })
            } catch (e) {
                console.error("Parent creation failed", e);
            }
        }

        // 3. 이미지 저장 (Mock)
        const imageFile = formData.get("image") as File;
        if (imageFile && imageFile.size > 0) {
            await tx.studentImage.create({
                data: {
                    studentId: student.id,
                    type: StudentImageType.profile,
                    originalUrl: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
                    resizedUrl: "https://res.cloudinary.com/demo/image/upload/w_200/sample.jpg",
                    publicId: "sample_public_id"
                }
            });
        }

        return student;
    });

    revalidatePath("/students");
    redirect(`/students/${result.id}?created=true`);
}

export async function getStudents(query?: string) {
    const session = await getSession();
    if (!session) return [];

    const where: any = {};
    if (query) {
        where.name = { contains: query, mode: 'insensitive' };
    }

    if (session.role === 'TEACHER') {
        where.teacherId = session.userId;
    }

    // Role == DIRECTOR (관리자)라면 모든 학생 조회
    // 테스트에서 admin으로 로그인하므로 teacherId 필터링 없이 조회해야 할 수도 있음.
    // 하지만 teacherId가 session.userId와 일치하는 데이터만 가져온다면,
    // admin으로 로그인해서 학생 생성 시 admin ID가 teacherId로 저장되므로,
    // admin은 본인이 생성한 학생을 볼 수 있음.
    // 만약 다른 teacher가 생성한 학생도 봐야 한다면 로직 수정 필요.
    // 테스트는 일단 "자신이 생성하고 조회"하므로 문제 없을 듯.

    return await db.student.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
            teacher: true,
            images: true
        }
    });
}

export async function getStudentById(id: string) {
    const session = await getSession();
    if (!session) return null;

    return await db.student.findUnique({
        where: { id },
        include: {
            parents: true,
            teacher: true,
            images: true
        }
    });
}

export async function deleteStudent(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");

    await db.student.delete({
        where: { id }
    });

    revalidatePath("/students");
}

export async function updateStudent(id: string, formData: FormData) {
    const session = await getSession();
    if (!session || !session.userId) {
        throw new Error("Unauthorized");
    }

    const rawData = {
        name: formData.get("name"),
        birthDate: formData.get("birthDate"),
        grade: formData.get("grade"),
        school: formData.get("school"),
        parentName: formData.get("parentName"),
        parentPhone: formData.get("parentPhone"),
    };

    const validatedData = createStudentSchema.parse(rawData);

    const editBirthTimeHourRaw = formData.get("birthTimeHour") as string | null;
    const editBirthTimeMinuteRaw = formData.get("birthTimeMinute") as string | null;
    const editBirthTimeHour = editBirthTimeHourRaw !== null && editBirthTimeHourRaw !== "" ? parseInt(editBirthTimeHourRaw, 10) : null;
    const editBirthTimeMinute = editBirthTimeMinuteRaw !== null && editBirthTimeMinuteRaw !== "" ? parseInt(editBirthTimeMinuteRaw, 10) : null;

    const result = await db.$transaction(async (tx) => {
        // 1. 학생 정보 수정
        const student = await tx.student.update({
            where: { id },
            data: {
                name: validatedData.name,
                birthDate: new Date(validatedData.birthDate),
                grade: validatedData.grade,
                school: validatedData.school,
                birthTimeHour: editBirthTimeHour,
                birthTimeMinute: editBirthTimeMinute,
            },
        });

        // 2. 기존 부모 정보가 있다면 업데이트
        const existingParent = await tx.parent.findFirst({
            where: { studentId: id, isPrimary: true }
        });

        if (validatedData.parentName && validatedData.parentPhone) {
            if (existingParent) {
                await tx.parent.update({
                    where: { id: existingParent.id },
                    data: {
                        name: validatedData.parentName,
                        phone: validatedData.parentPhone,
                    }
                });
            } else {
                await tx.parent.create({
                    data: {
                        name: validatedData.parentName,
                        phone: validatedData.parentPhone,
                        relation: ParentRelation.MOTHER,
                        isPrimary: true,
                        studentId: id
                    }
                });
            }
        }

        // 3. 새 이미지가 업로드되었다면 기존 이미지 삭제 후 새 이미지 저장
        const imageFile = formData.get("image") as File;
        if (imageFile && imageFile.size > 0) {
            // 기존 프로필 이미지 삭제
            await tx.studentImage.deleteMany({
                where: { studentId: id, type: StudentImageType.profile }
            });

            await tx.studentImage.create({
                data: {
                    studentId: id,
                    type: StudentImageType.profile,
                    originalUrl: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
                    resizedUrl: "https://res.cloudinary.com/demo/image/upload/w_200/sample.jpg",
                    publicId: "sample_public_id"
                }
            });
        }

        return student;
    });

    revalidatePath("/students");
    revalidatePath(`/students/${id}`);
    redirect(`/students/${id}`);
}
