import Link from "next/link"
import { db } from "@/lib/db"
import { NewPasswordForm } from "@/components/auth/new-password-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">유효하지 않은 링크</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">❌</div>
          <p className="text-gray-600">
            유효하지 않은 링크예요. 비밀번호 재설정을 다시 요청해주세요.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/reset-password">다시 요청하기</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (resetToken.expiresAt < new Date()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">링크가 만료되었어요</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">⏰</div>
          <p className="text-gray-600">
            링크가 만료되었어요. 비밀번호 재설정을 다시 요청해주세요.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/reset-password">다시 요청하기</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (resetToken.used) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">이미 사용된 링크</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <p className="text-gray-600">
            이미 사용된 링크예요. 비밀번호 재설정을 다시 요청해주세요.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/reset-password">다시 요청하기</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return <NewPasswordForm token={token} />
}
