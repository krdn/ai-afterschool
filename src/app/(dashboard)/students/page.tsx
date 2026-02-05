import { getStudents } from "@/lib/actions/student";
import Link from "next/link";

export default async function StudentsPage(props: {
    searchParams?: Promise<{ query?: string }>;
}) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || "";
    const students = await getStudents(query);

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">학생 목록</h1>
                <Link href="/students/new" className="bg-blue-600 text-white px-4 py-2 rounded">
                    학생 등록
                </Link>
            </div>

            <div className="mb-6">
                <form className="flex gap-2">
                    <input
                        type="text"
                        name="query"
                        defaultValue={query}
                        placeholder="학생 이름 검색..."
                        className="border p-2 rounded w-full max-w-sm"
                    />
                    <button type="submit" className="bg-gray-200 px-4 py-2 rounded">검색</button>
                </form>
            </div>

            {students.length === 0 ? (
                <p className="text-gray-500">등록된 학생이 없습니다.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                        <Link key={student.id} href={`/students/${student.id}`} className="block">
                            <div data-testid="student-card" className="border p-4 rounded hover:shadow-lg transition bg-white">
                                <h3 className="text-xl font-semibold mb-2">{student.name}</h3>
                                <div className="text-gray-600 space-y-1">
                                    <p>{student.school} {student.grade}학년</p>
                                    <p className="text-sm text-gray-500">
                                        생년월일: {new Date(student.birthDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
