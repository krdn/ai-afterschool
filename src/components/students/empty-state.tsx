import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GraduationCap } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gray-100">
        <GraduationCap className="h-16 w-16 text-gray-400" />
      </div>

      <h2 className="mb-2 text-xl font-semibold text-gray-900">
        아직 등록된 학생이 없어요
      </h2>
      <p className="mb-6 max-w-sm text-gray-500">
        학생을 등록하고 학습 관리를 시작해보세요. 학생 정보와 분석 결과를
        한눈에 확인할 수 있어요.
      </p>

      <Button asChild size="lg">
        <Link href="/students/new">첫 학생 등록하기</Link>
      </Button>
    </div>
  )
}
