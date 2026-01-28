"use server"

import { runSajuAnalysis } from "@/lib/actions/calculation-analysis"

export async function runSajuAnalysisAction(studentId: string) {
  return runSajuAnalysis(studentId)
}
