'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Brain, Target, TrendingUp, RefreshCw } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { generateAnalysis, getAnalysis } from "@/lib/actions/analysis";
import { toast } from "sonner"; // Toast 알림 (설치되어 있다고 가정하거나 없으면 alert)

export default function AnalysisTab({ studentId }: { studentId: string }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 초기 데이터 로드
    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await getAnalysis(studentId);
                if (result) setData(result);
            } catch (error) {
                console.error("Failed to load analysis:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentId]);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const result = await generateAnalysis(studentId);
            if (result.success) {
                // 성공 시 데이터 재조회
                const newData = await getAnalysis(studentId);
                setData(newData);
                // toast.success("분석이 완료되었습니다."); 
            } else {
                // toast.error("분석 실패: " + result.error);
                alert("분석 실패");
            }
        } catch (error) {
            console.error(error);
            alert("오류가 발생했습니다.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div data-testid="analysis-loading" className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-dashed border-gray-300 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-blue-50 p-6 rounded-full mb-6">
                    <Sparkles className="w-10 h-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI 종합 성향 분석</h3>
                <p className="text-gray-500 mb-8 max-w-md leading-relaxed">
                    학생의 기본 정보, 학습 이력, 상담 기록을 종합적으로 분석하여<br />
                    <span className="font-semibold text-blue-600">학습 성향, 강점, 보완점</span>을 도출합니다.
                </p>
                <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                    {analyzing ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            AI가 데이터를 분석 중입니다...
                        </>
                    ) : (
                        <>
                            <Brain className="mr-2 h-5 w-5" />
                            지금 분석 시작하기
                        </>
                    )}
                </Button>
            </div>
        );
    }

    // 데이터 파싱
    const scores = (data.scores as any[]) || [];
    const strategy = (data.learningStrategy as any) || { strengths: '', weaknesses: '' };
    const generatedDate = data.generatedAt ? new Date(data.generatedAt).toLocaleDateString() : '방금 전';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* 상단: 요약 및 차트 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 핵심 성향 카드 */}
                <Card className="col-span-1 md:col-span-1 border-blue-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-medium text-gray-700">
                            <Target className="w-4 h-4 text-blue-500" />
                            핵심 성향 키워드
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 mb-3">
                            {data.coreTraits || "성향 분석 중"}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            학습 데이터 분석에 따르면, 이 학생은 <strong>{data.coreTraits}</strong> 유형에 속합니다.
                            {/* 추가 설명은 LLM이 생성해준다면 여기에 표시 */}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            {/* 키워드 태그 (임시) */}
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700">#AI 분석</Badge>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">#맞춤형</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Radar Chart 영역 */}
                <Card className="col-span-1 md:col-span-2 shadow-sm">
                    <CardHeader className="pb-2 border-b border-gray-50/50">
                        <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <TrendingUp className="w-4 h-4 text-indigo-500" />
                                성향 다이어그램
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">최종 분석: {generatedDate}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={handleAnalyze}
                                    disabled={analyzing}
                                    title="다시 분석"
                                >
                                    <RefreshCw className={`h-3 w-3 ${analyzing ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full flex items-center justify-center p-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scores}>
                                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 500 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="학생 성향"
                                    dataKey="A"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fill="#818cf8"
                                    fillOpacity={0.25}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* 하단: 상세 리포트 및 가이드 */}
            <Card className="shadow-sm border-l-4 border-l-green-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
                        <Brain className="w-5 h-5 text-green-600" />
                        AI 학습 컨설팅 리포트
                    </CardTitle>
                    <CardDescription>
                        학생의 성향 데이터를 바탕으로 제안하는 맞춤형 지도 가이드입니다.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            강점 활용 전략
                        </h4>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm md:text-base text-gray-700 leading-relaxed shadow-sm">
                            {strategy.strengths || "분석 내용이 없습니다."}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            보완 및 지도 포인트
                        </h4>
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-sm md:text-base text-gray-700 leading-relaxed shadow-sm">
                            {strategy.weaknesses || "분석 내용이 없습니다."}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
