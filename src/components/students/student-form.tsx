"use client"

import { startTransition, useActionState, useEffect, useId, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  createStudent,
  updateStudent,
  type StudentFormState,
} from "@/lib/actions/students"
import { CreateStudentSchema } from "@/lib/validations/students"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  StudentImageUploader,
  type StudentImagePayload,
} from "@/components/students/student-image-uploader"
import { HanjaPicker } from "@/components/students/hanja-picker"
import {
  coerceHanjaSelections,
  normalizeHanjaSelections,
  type HanjaSelection,
} from "@/lib/analysis/hanja-strokes"

type StudentFormProps = {
  student?: {
    id: string
    name: string
    nameHanja?: unknown
    birthDate: Date | string
    phone: string | null
    school: string
    grade: number
    targetUniversity: string | null
    targetMajor: string | null
    bloodType: "A" | "B" | "AB" | "O" | null
    images?: StudentImageRecord[]
  }
}

type StudentImageRecord = {
  type: StudentImagePayload["type"]
  originalUrl: string
  resizedUrl: string
  publicId: string
  format: string | null
  bytes: number | null
  width: number | null
  height: number | null
}

type ImageState = StudentImagePayload & {
  resizedUrl?: string | null
}

function toDateInputValue(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0]
}

export function StudentForm({ student }: StudentFormProps) {
  const isEditing = Boolean(student)
  const draftId = useId().replace(/:/g, "")
  const draftFolderId = `draft-${draftId}`

  const boundUpdateStudent = student
    ? updateStudent.bind(null, student.id)
    : null

  const [state, formAction, pending] = useActionState<StudentFormState, FormData>(
    isEditing ? boundUpdateStudent! : createStudent,
    { errors: {} }
  )

  type StudentFormValues = z.input<typeof CreateStudentSchema>

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues: student
      ? {
          name: student.name,
          birthDate: toDateInputValue(student.birthDate),
          phone: student.phone || "",
          school: student.school,
          grade: student.grade,
          targetUniversity: student.targetUniversity || "",
          targetMajor: student.targetMajor || "",
          bloodType: student.bloodType,
        }
      : {
          name: "",
          birthDate: "",
          phone: "",
          school: "",
          grade: 1,
          targetUniversity: "",
          targetMajor: "",
          bloodType: null,
        },
    mode: "onChange",
  })

  const getInitialImage = (
    type: StudentImagePayload["type"]
  ): ImageState | null => {
    const match = student?.images?.find((image) => image.type === type)
    if (!match) return null

    return {
      type: match.type,
      originalUrl: match.originalUrl,
      resizedUrl: match.resizedUrl,
      publicId: match.publicId,
      format: match.format || undefined,
      bytes: match.bytes || undefined,
      width: match.width || undefined,
      height: match.height || undefined,
    }
  }

  const [profileImage, setProfileImage] = useState<ImageState | null>(() =>
    getInitialImage("profile")
  )
  const [faceImage, setFaceImage] = useState<ImageState | null>(() =>
    getInitialImage("face")
  )
  const [palmImage, setPalmImage] = useState<ImageState | null>(() =>
    getInitialImage("palm")
  )
  const [nameHanjaSelections, setNameHanjaSelections] = useState<
    HanjaSelection[]
  >(() =>
    normalizeHanjaSelections(
      student?.name ?? "",
      coerceHanjaSelections(student?.nameHanja)
    )
  )

  const serializeImage = (image: ImageState) =>
    JSON.stringify({
      type: image.type,
      originalUrl: image.originalUrl,
      publicId: image.publicId,
      format: image.format,
      bytes: image.bytes,
      width: image.width,
      height: image.height,
    })

  const handleSubmit = form.handleSubmit((_values, event) => {
    event?.preventDefault()

    const formElement = event?.currentTarget

    if (!formElement) {
      return
    }

    const formData = new FormData(formElement)

    startTransition(() => {
      formAction(formData)
    })
  })

  const nameValue = form.watch("name")

  useEffect(() => {
    setNameHanjaSelections((prev) =>
      normalizeHanjaSelections(nameValue ?? "", prev)
    )
  }, [nameValue])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "학생 정보 수정" : "학생 등록"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {state?.errors?._form && (
            <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
              {state.errors._form[0]}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-medium">기본 정보</h3>

            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                placeholder="홍길동"
                {...form.register("name")}
              />
              {(state?.errors?.name || form.formState.errors.name) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.name?.[0] ||
                    form.formState.errors.name?.message}
                </p>
              )}
            </div>

            <HanjaPicker
              name={nameValue ?? ""}
              value={nameHanjaSelections}
              onChange={setNameHanjaSelections}
            />

            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일 *</Label>
              <Input
                id="birthDate"
                type="date"
                {...form.register("birthDate")}
              />
              {(state?.errors?.birthDate || form.formState.errors.birthDate) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.birthDate?.[0] ||
                    form.formState.errors.birthDate?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">연락처</Label>
              <Input
                id="phone"
                placeholder="010-0000-0000"
                {...form.register("phone")}
              />
              {(state?.errors?.phone || form.formState.errors.phone) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.phone?.[0] ||
                    form.formState.errors.phone?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodType">혈액형</Label>
              <Select name="bloodType" defaultValue={student?.bloodType || ""}>
                <SelectTrigger id="bloodType">
                  <SelectValue placeholder="선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A형</SelectItem>
                  <SelectItem value="B">B형</SelectItem>
                  <SelectItem value="AB">AB형</SelectItem>
                  <SelectItem value="O">O형</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">이미지 업로드</h3>

            <div className="grid gap-4">
              <StudentImageUploader
                type="profile"
                label="프로필 사진"
                description="학생 프로필에 표시됩니다."
                studentId={student?.id}
                draftId={draftFolderId}
                previewUrl={
                  profileImage?.resizedUrl || profileImage?.originalUrl || null
                }
                value={profileImage}
                onChange={(payload) =>
                  setProfileImage({
                    ...payload,
                    resizedUrl: null,
                  })
                }
              />

              <StudentImageUploader
                type="face"
                label="관상 사진"
                description="얼굴 분석을 위한 사진입니다."
                studentId={student?.id}
                draftId={draftFolderId}
                previewUrl={
                  faceImage?.resizedUrl || faceImage?.originalUrl || null
                }
                value={faceImage}
                onChange={(payload) =>
                  setFaceImage({
                    ...payload,
                    resizedUrl: null,
                  })
                }
              />

              <StudentImageUploader
                type="palm"
                label="손금 사진"
                description="손바닥 분석을 위한 사진입니다."
                studentId={student?.id}
                draftId={draftFolderId}
                previewUrl={
                  palmImage?.resizedUrl || palmImage?.originalUrl || null
                }
                value={palmImage}
                onChange={(payload) =>
                  setPalmImage({
                    ...payload,
                    resizedUrl: null,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">학업 정보</h3>

            <div className="space-y-2">
              <Label htmlFor="school">학교 *</Label>
              <Input
                id="school"
                placeholder="서울고등학교"
                {...form.register("school")}
              />
              {(state?.errors?.school || form.formState.errors.school) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.school?.[0] ||
                    form.formState.errors.school?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">학년 *</Label>
              <Input
                id="grade"
                type="number"
                min={1}
                max={12}
                {...form.register("grade")}
              />
              {(state?.errors?.grade || form.formState.errors.grade) && (
                <p className="text-sm text-red-600">
                  {state?.errors?.grade?.[0] ||
                    form.formState.errors.grade?.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUniversity">목표 대학</Label>
              <Input
                id="targetUniversity"
                placeholder="서울대학교"
                {...form.register("targetUniversity")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetMajor">목표 학과</Label>
              <Input
                id="targetMajor"
                placeholder="컴퓨터공학과"
                {...form.register("targetMajor")}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            {profileImage ? (
              <input
                type="hidden"
                name="profileImage"
                value={serializeImage(profileImage)}
              />
            ) : null}
            {faceImage ? (
              <input
                type="hidden"
                name="faceImage"
                value={serializeImage(faceImage)}
              />
            ) : null}
            {palmImage ? (
              <input
                type="hidden"
                name="palmImage"
                value={serializeImage(palmImage)}
              />
            ) : null}
            <input
              type="hidden"
              name="nameHanja"
              value={JSON.stringify(nameHanjaSelections)}
            />
            <Button type="submit" disabled={pending}>
              {pending
                ? isEditing
                  ? "수정 중..."
                  : "등록 중..."
                : isEditing
                  ? "수정하기"
                  : "등록하기"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
