"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import type { Prisma } from "@/generated/prisma";

export async function getStudents(query?: string) {
    const session = await verifySession();

    const where: Prisma.StudentWhereInput = {};
    if (query) {
        where.name = { contains: query, mode: 'insensitive' };
    }

    if (session.role === 'TEACHER') {
        where.teacherId = session.userId;
    }

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
    const session = await verifySession();

    // TEACHER 역할은 자신의 학생만 조회 가능
    if (session.role === 'TEACHER') {
        return await db.student.findFirst({
            where: { id, teacherId: session.userId },
            include: {
                parents: true,
                teacher: true,
                images: true
            }
        });
    }

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
    const session = await verifySession();

    // TEACHER 역할은 자신의 학생만 삭제 가능
    if (session.role === 'TEACHER') {
        const student = await db.student.findFirst({
            where: { id, teacherId: session.userId },
            select: { id: true }
        });
        if (!student) {
            throw new Error("Forbidden: 해당 학생에 대한 권한이 없습니다");
        }
    }

    await db.student.delete({
        where: { id }
    });

    revalidatePath("/students");
}
