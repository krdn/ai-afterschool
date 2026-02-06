import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { listAssignmentProposals } from "@/lib/db/assignment"
import { getAssignmentResults } from "@/lib/actions/assignment-results"
import { AutoAssignmentSuggestion } from "@/components/assignment/auto-assignment-suggestion"
import { AssignmentResultCard } from "@/components/matching/AssignmentResultCard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

export default async function AutoAssignPage() {
  const session = await verifySession()

  // RBAC: DIRECTOR, TEAM_LEADER만 접근 가능
  if (session.role !== "DIRECTOR" && session.role !== "TEAM_LEADER") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">AI 자동 배정 제안</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">
              이 기능은 원장님과 팀장님만 사용할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 모든 학생 목록 조회 (선생님 ID 포함)
  const allStudents = await db.student.findMany({
    select: {
      id: true,
      name: true,
      school: true,
      grade: true,
      teacherId: true,
    },
    orderBy: { name: "asc" },
  })

  // 대기 중인 제안 목록 조회
  const pendingProposals = await listAssignmentProposals({ status: "pending" })

  // 적용 완료된 제안 목록 조회 (최근 1개)
  const appliedProposals = await listAssignmentProposals({ status: "applied", limit: 1 })

  // 적용 완료된 제안의 결과 데이터 조회
  let latestResults = null
  if (appliedProposals.length > 0) {
    const result = await getAssignmentResults(appliedProposals[0].id)
    if (result.success && result.data) {
      latestResults = result.data
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI 자동 배정 제안</h1>
        <p className="text-gray-500">
          AI가 궁합 점수를 분석하여 최적의 학생-선생님 배정을 제안합니다.
        </p>
      </div>

      {/* 자동 배정 제안 컴포넌트 */}
      <AutoAssignmentSuggestion allStudents={allStudents} />

      {/* 대기 중인 제안 목록 */}
      {pendingProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>대기 중인 제안</CardTitle>
            <CardDescription>
              이전에 생성했지만 아직 적용하지 않은 배정 제안입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingProposals.map((proposal) => {
                const summary = proposal.summary as {
                  totalStudents: number
                  assignedStudents: number
                  averageScore: number
                }
                return (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{proposal.name}</p>
                      <p className="text-sm text-gray-500">
                        생성: {formatDate(proposal.createdAt)} | 제안자:{" "}
                        {proposal.proposer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        학생 {summary?.assignedStudents || 0}명 | 평균 점수:{" "}
                        {Math.round(summary?.averageScore || 0)}점
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`/matching/proposals/${proposal.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        상세 보기
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 배정 결과 */}
      {latestResults && (
        <AssignmentResultCard
          totalStudents={latestResults.totalStudents}
          assignedCount={latestResults.assignedCount}
          excludedCount={latestResults.excludedCount}
          successCount={latestResults.successCount}
          failureCount={latestResults.failureCount}
          averageScore={latestResults.averageScore}
          createdAt={latestResults.createdAt}
          status={latestResults.status}
        />
      )}
    </div>
  )
}
