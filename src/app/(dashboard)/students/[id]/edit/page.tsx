import { notFound } from "next/navigation"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { StudentForm } from "@/components/students/student-form"

export default async function EditStudentPage({
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
  })

  if (!student) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <StudentForm student={student} />
    </div>
  )
}
