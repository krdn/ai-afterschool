"use client";

import { createStudent, updateStudent } from "@/lib/actions/student";
import { useState } from "react";
import { Student } from "@prisma/client";

interface StudentFormProps {
  student?: Student & {
    images?: Array<{
      id: string;
      url: string;
      resizedUrl: string;
      type: string;
    }>;
  };
}

export function StudentForm({ student }: StudentFormProps) {
  const [preview, setPreview] = useState<string | null>(
    student?.images?.find(img => img.type === "profile")?.resizedUrl || null
  );
  const isEdit = !!student;

  const action = isEdit ? updateStudent.bind(null, student.id) : createStudent;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <form action={action} className="space-y-4 max-w-md mx-auto p-4 border rounded-lg bg-white">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">이름</label>
        <input
          type="text"
          name="name"
          id="name"
          required
          defaultValue={student?.name}
          className="border p-2 w-full rounded"
          data-testid="student-name-input"
        />
      </div>

      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium">생년월일</label>
        <input
          type="date"
          name="birthDate"
          id="birthDate"
          required
          defaultValue={student?.birthDate ? new Date(student.birthDate).toISOString().split('T')[0] : undefined}
          className="border p-2 w-full rounded"
          data-testid="student-birthdate-input"
        />
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
              <option key={i} value={i}>{String(i).padStart(2, "0")}시</option>
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
              <option key={m} value={m}>{String(m).padStart(2, "0")}분</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-gray-400 mt-1">사주 분석 시 시주 계산에 사용됩니다</p>
      </div>

      <div>
        <label htmlFor="grade" className="block text-sm font-medium">학년</label>
        <select
          name="grade"
          id="grade"
          required
          defaultValue={student?.grade}
          className="border p-2 w-full rounded"
          data-testid="student-grade-select"
        >
          <option value="">선택하세요</option>
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <option key={g} value={g}>{g}학년</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="school" className="block text-sm font-medium">학교</label>
        <input
          type="text"
          name="school"
          id="school"
          required
          defaultValue={student?.school}
          className="border p-2 w-full rounded"
          data-testid="student-school-input"
        />
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-2">학부모 정보</h3>
        <div className="space-y-2">
          <div>
            <label htmlFor="parentName" className="block text-sm font-medium">부모님 성함</label>
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
            <label htmlFor="parentPhone" className="block text-sm font-medium">부모님 연락처</label>
            <input
              type="text"
              name="parentPhone"
              id="parentPhone"
              defaultValue={student?.parents?.[0]?.phone}
              placeholder="010-0000-0000"
              className="border p-2 w-full rounded"
              data-testid="parent-phone-input"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <label htmlFor="image" className="block text-sm font-medium">프로필 사진</label>
        <input
          type="file"
          name="image"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
          className="border p-2 w-full rounded"
          data-testid="profile-image-input"
        />
        {preview && (
          <div className="mt-2">
            <img src={preview} alt="프로필 미리보기" className="w-32 h-32 object-cover rounded border" data-testid="image-preview" />
          </div>
        )}
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full font-bold"
        data-testid="submit-student-button"
      >
        {isEdit ? "수정" : "등록"}
      </button>
    </form>
  );
}
