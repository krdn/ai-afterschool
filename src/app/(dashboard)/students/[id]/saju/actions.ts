"use server"

import { runSajuAnalysis } from "@/lib/actions/calculation-analysis"

export async function runSajuAnalysisAction(studentId: string, provider?: string) {
  return runSajuAnalysis(studentId, provider)
}
