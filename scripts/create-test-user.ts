import { PrismaClient } from "@prisma/client"
import * as argon2 from "argon2"

const prisma = new PrismaClient()

async function main() {
  const password = "test1234"
  const hashedPassword = await argon2.hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  })

  const teacher = await prisma.teacher.create({
    data: {
      email: "test@example.com",
      password: hashedPassword,
      name: "테스트 선생님"
    }
  })

  console.log("✅ 테스트 계정 생성 완료!")
  console.log("────────────────────────────────────────")
  console.log("이메일:", teacher.email)
  console.log("비밀번호:", password)
  console.log("이름:", teacher.name)
  console.log("────────────────────────────────────────")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
