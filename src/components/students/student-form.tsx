"use client"

import { useActionState, useState } from "react"
import {
  createStudent,
  updateStudent,
  type StudentFormState,
} from "@/lib/actions/students"
import {
  StudentImageUploader,
  type StudentImagePayload,
} from "@/components/students/student-image-uploader"

interface StudentFormProps {
  student?: {
    id: string
    name: string
    nameHanja: unknown
    birthDate: Date
    birthTimeHour: number | null
    birthTimeMinute: number | null
    grade: number | null
    school: string | null
    nationality: string | null
    images?: Array<{
      id: string
      url?: string
      originalUrl: string
      resizedUrl: string
      publicId: string
      type: string
    }>
    parents?: Array<{
      id: string
      name: string
      phone: string | null
    }>
  }
}

const initialState: StudentFormState = {}

function extractInitialHanjaText(raw: unknown): string {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => (entry as { hanja?: string | null })?.hanja ?? "")
      .join("")
  }
  return ""
}

export function StudentForm({ student }: StudentFormProps) {
  const isEdit = !!student
  const existingProfile = student?.images?.find(
    (img) => img.type === "profile"
  )

  const [profileImage, setProfileImage] = useState<StudentImagePayload | null>(
    null
  )
  const [draftId] = useState(() => crypto.randomUUID())
  const [nameHanjaText, setNameHanjaText] = useState(
    () => student ? extractInitialHanjaText(student.nameHanja) : ""
  )

  const action = isEdit
    ? updateStudent.bind(null, student.id)
    : createStudent

  const [state, formAction, pending] = useActionState(action, initialState)

  function handleSubmit(formData: FormData) {
    if (profileImage) {
      formData.set("profileImage", JSON.stringify(profileImage))
    }
    const name = formData.get("name") as string
    const hanja = nameHanjaText.trim()
    if (name && hanja) {
      const syllables = Array.from(name.trim())
      const hanjaChars = Array.from(hanja)
      const selections = syllables.map((s, i) => ({
        syllable: s,
        hanja: hanjaChars[i] ?? null,
      }))
      formData.set("nameHanja", JSON.stringify(selections))
    }
    formAction(formData)
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 max-w-md mx-auto p-4 border rounded-lg bg-white"
    >
      {state.errors?._form && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
          {state.errors._form.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          이름
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          defaultValue={student?.name}
          className="border p-2 w-full rounded"
          data-testid="student-name-input"
        />
        {state.errors?.name && (
          <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="nameHanjaText" className="block text-sm font-medium">
          한자 이름 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <input
          type="text"
          id="nameHanjaText"
          placeholder="洪吉東"
          value={nameHanjaText}
          onChange={(e) => setNameHanjaText(e.target.value)}
          className="border p-2 w-full rounded"
          data-testid="student-name-hanja-input"
        />
        <p className="text-xs text-gray-400 mt-1">
          이름 분석에 사용됩니다
        </p>
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium">
          생년월일
        </label>
        <input
          type="date"
          name="birthDate"
          id="birthDate"
          required
          defaultValue={
            student?.birthDate
              ? new Date(student.birthDate).toISOString().split("T")[0]
              : undefined
          }
          className="border p-2 w-full rounded"
          data-testid="student-birthdate-input"
        />
        {state.errors?.birthDate && (
          <p className="text-red-500 text-xs mt-1">
            {state.errors.birthDate[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="birthTimeHour" className="block text-sm font-medium">
          출생 시간 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <div className="flex items-center gap-2">
          <select
            name="birthTimeHour"
            id="birthTimeHour"
            defaultValue={student?.birthTimeHour ?? ""}
            className="border p-2 rounded w-24"
            data-testid="student-birthtime-hour-select"
          >
            <option value="">시</option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, "0")}시
              </option>
            ))}
          </select>
          <span className="text-gray-500">:</span>
          <select
            name="birthTimeMinute"
            id="birthTimeMinute"
            defaultValue={student?.birthTimeMinute ?? ""}
            className="border p-2 rounded w-24"
            data-testid="student-birthtime-minute-select"
          >
            <option value="">분</option>
            {[0, 10, 20, 30, 40, 50].map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}분
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          사주 분석 시 시주 계산에 사용됩니다
        </p>
      </div>

      <div>
        <label htmlFor="grade" className="block text-sm font-medium">
          학년
        </label>
        <select
          name="grade"
          id="grade"
          required
          defaultValue={student?.grade ?? ""}
          className="border p-2 w-full rounded"
          data-testid="student-grade-select"
        >
          <option value="">선택하세요</option>
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>
              {g}학년
            </option>
          ))}
        </select>
        {state.errors?.grade && (
          <p className="text-red-500 text-xs mt-1">{state.errors.grade[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="school" className="block text-sm font-medium">
          학교
        </label>
        <input
          type="text"
          name="school"
          id="school"
          required
          defaultValue={student?.school ?? ""}
          className="border p-2 w-full rounded"
          data-testid="student-school-input"
        />
        {state.errors?.school && (
          <p className="text-red-500 text-xs mt-1">{state.errors.school[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="nationality" className="block text-sm font-medium">
          국적 <span className="text-gray-400 font-normal">(선택)</span>
        </label>
        <input
          type="text"
          name="nationality"
          id="nationality"
          list="nationality-options"
          defaultValue={student?.nationality ?? "한국"}
          placeholder="한국"
          className="border p-2 w-full rounded"
          data-testid="student-nationality-input"
          onFocus={(e) => {
            e.target.dataset.prev = e.target.value;
            e.target.value = "";
          }}
          onBlur={(e) => {
            if (!e.target.value) {
              e.target.value = e.target.dataset.prev || "한국";
            }
          }}
        />
        <datalist id="nationality-options">
          <option value="한국" />
          <option value="중국" />
          <option value="미국" />
          <option value="일본" />
          <option value="프랑스" />
          <option value="독일" />
          <option value="이탈리아" />
        </datalist>
        {state.errors?.nationality && (
          <p className="text-red-500 text-xs mt-1">
            {state.errors.nationality[0]}
          </p>
        )}
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-2">학부모 정보</h3>
        <div className="space-y-2">
          <div>
            <label htmlFor="parentName" className="block text-sm font-medium">
              부모님 성함
            </label>
            <input
              type="text"
              name="parentName"
              id="parentName"
              defaultValue={student?.parents?.[0]?.name}
              className="border p-2 w-full rounded"
              data-testid="parent-name-input"
            />
          </div>
          <div>
            <label htmlFor="parentPhone" className="block text-sm font-medium">
              부모님 연락처
            </label>
            <input
              type="text"
              name="parentPhone"
              id="parentPhone"
              defaultValue={student?.parents?.[0]?.phone ?? ""}
              placeholder="010-0000-0000"
              className="border p-2 w-full rounded"
              data-testid="parent-phone-input"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <StudentImageUploader
          type="profile"
          label="프로필 사진"
          description="학생의 프로필 사진을 업로드해주세요"
          studentId={student?.id}
          draftId={isEdit ? undefined : draftId}
          previewUrl={existingProfile?.resizedUrl}
          value={profileImage}
          onChange={setProfileImage}
          studentName={student?.name}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full font-bold disabled:opacity-50"
        data-testid="submit-student-button"
      >
        {pending ? "저장 중..." : isEdit ? "수정" : "등록"}
      </button>
    </form>
  )
}

export default StudentForm
