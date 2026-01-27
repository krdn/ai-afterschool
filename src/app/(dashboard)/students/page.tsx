import Link from "next/link"
import { verifySession } from "@/lib/dal"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"

export default async function StudentsPage() {
  const session = await verifySession()

  const students = await db.student.findMany({
    where: { teacherId: session.userId },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">학생 관리</h1>
        <Button asChild>
          <Link href="/students/new">학생 등록</Link>
        </Button>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">등록된 학생이 없어요.</p>
          <Button asChild>
            <Link href="/students/new">첫 학생 등록하기</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="p-4 bg-white rounded-lg border flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{student.name}</p>
                <p className="text-sm text-gray-500">
                  {student.school} {student.grade}학년
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/students/${student.id}`}>상세보기</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
