"use client"

import { CldUploadWidget } from "next-cloudinary"
import { Button } from "@/components/ui/button"

export type StudentImageType = "profile" | "face" | "palm"

export type StudentImagePayload = {
  type: StudentImageType
  originalUrl: string
  publicId: string
  format?: string
  bytes?: number
  width?: number
  height?: number
}

type StudentImageUploaderProps = {
  type: StudentImageType
  label: string
  description?: string
  studentId?: string
  draftId?: string
  previewUrl?: string | null
  value?: StudentImagePayload | null
  onChange?: (payload: StudentImagePayload) => void
}

const allowedFormats = ["jpg", "jpeg", "png", "heic"]

export function StudentImageUploader({
  type,
  label,
  description,
  studentId,
  draftId,
  previewUrl,
  value,
  onChange,
}: StudentImageUploaderProps) {
  const uploadFolder = studentId
    ? `students/${studentId}/${type}`
    : `students/drafts/${draftId || "draft"}/${type}`

  const hasPreview = Boolean(previewUrl || value)

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description ? (
          <p className="text-xs text-gray-500">{description}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-dashed border-gray-200 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">
                {hasPreview ? "이미지 선택됨" : "이미지를 업로드해주세요"}
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG, HEIC 파일 1장까지 업로드할 수 있어요.
              </p>
            </div>

            <CldUploadWidget
              signatureEndpoint="/api/cloudinary/sign"
              options={{
                multiple: false,
                maxFiles: 1,
                clientAllowedFormats: allowedFormats,
                folder: uploadFolder,
              }}
              onSuccess={(result) => {
                const info = result?.info as
                  | {
                      secure_url?: string
                      public_id?: string
                      format?: string
                      bytes?: number
                      width?: number
                      height?: number
                    }
                  | undefined

                if (!info?.secure_url || !info.public_id) {
                  return
                }

                onChange?.({
                  type,
                  originalUrl: info.secure_url,
                  publicId: info.public_id,
                  format: info.format,
                  bytes: info.bytes,
                  width: info.width,
                  height: info.height,
                })
              }}
            >
              {({ open, isLoading }) => (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => open()}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "업로드 중..."
                    : hasPreview
                      ? "교체하기"
                      : "업로드"}
                </Button>
              )}
            </CldUploadWidget>
          </div>

          {previewUrl ? (
            <div className="rounded-md border border-gray-100 bg-white p-2">
              <img
                src={previewUrl}
                alt={`${label} 미리보기`}
                className="h-32 w-32 rounded-md object-cover"
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
