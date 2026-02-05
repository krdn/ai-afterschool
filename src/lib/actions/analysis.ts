'use server';

import { db as prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 분석 결과 스키마
const AnalysisSchema = z.object({
    coreTraits: z.string(),
    scores: z.array(z.object({
        subject: z.string(),
        A: z.number(),
        fullMark: z.number()
    })),
    learningStrategy: z.object({
        strengths: z.string(),
        weaknesses: z.string()
    })
});

export async function generateAnalysis(studentId: string) {
    try {
        // 1. 학생 데이터 조회
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                gradeHistory: true, // 성적
                counselingSessions: true, // 상담 이력
            }
        });

        if (!student) {
            throw new Error("학생을 찾을 수 없습니다.");
        }

        // 2. AI 분석 수행 (현재는 Mocking 처리)
        // TODO: 실제 LLM (OpenAI/Claude) 연동
        // 실제 연동 시: student 데이터를 프롬프트로 변환하여 generateObject 호출

        // 임시: 랜덤성을 가미한 Mock 데이터 생성
        const randomScore = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

        const mockResult = {
            coreTraits: "자기주도적 탐구자",
            scores: [
                { subject: '논리적 사고', A: randomScore(70, 95), fullMark: 100 },
                { subject: '언어 능력', A: randomScore(70, 95), fullMark: 100 },
                { subject: '수리 능력', A: randomScore(60, 90), fullMark: 100 },
                { subject: '창의성', A: randomScore(75, 95), fullMark: 100 },
                { subject: '사회성', A: randomScore(60, 85), fullMark: 100 },
                { subject: '자기주도', A: randomScore(80, 98), fullMark: 100 },
            ],
            learningStrategy: {
                strengths: "관심 분야에 대한 깊이 있는 탐구 능력이 탁월하며, 스스로 목표를 설정하고 실천하는 힘이 있습니다.",
                weaknesses: "협업 활동이나 타인과의 소통 과정에서 다소 소극적일 수 있습니다. 그룹 프로젝트 참여를 독려해주세요."
            }
        };

        // 3. DB 저장 (Upsert)
        // scores는 Json 타입이므로 any[]로 캐스팅하거나 그대로 할당 (Prisma가 처리)
        await prisma.personalitySummary.upsert({
            where: { studentId: student.id },
            create: {
                studentId: student.id,
                coreTraits: mockResult.coreTraits,
                scores: mockResult.scores as any,
                learningStrategy: mockResult.learningStrategy as any,
                status: "complete",
                version: 1,
                generatedAt: new Date()
            },
            update: {
                coreTraits: mockResult.coreTraits,
                scores: mockResult.scores as any,
                learningStrategy: mockResult.learningStrategy as any,
                status: "complete",
                generatedAt: new Date(),
                updatedAt: new Date()
            }
        });

        // 4. 페이지 갱신
        revalidatePath(`/students/${studentId}`);

        return { success: true, data: mockResult };

    } catch (error) {
        console.error("Analysis generation failed:", error);
        return { success: false, error: "분석 생성 중 오류가 발생했습니다." };
    }
}

export async function getAnalysis(studentId: string) {
    const analysis = await prisma.personalitySummary.findUnique({
        where: { studentId }
    });
    return analysis;
}
