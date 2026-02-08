"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";

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
