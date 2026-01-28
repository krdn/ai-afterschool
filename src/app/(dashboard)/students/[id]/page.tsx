import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { StudentDetail } from "@/components/students/student-detail"
import { getCalculationStatus } from "@/lib/actions/calculation-analysis"

export default async function StudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await verifySession()

  const student = await db.student.findFirst({
    where: {
      id,
      teacherId: session.userId,
    },
    include: {
      images: true,
    },
  })

  if (!student) {
    notFound()
  }

  const analysisStatus = await getCalculationStatus(student.id)

  return <StudentDetail student={student} analysisStatus={analysisStatus} />
}
