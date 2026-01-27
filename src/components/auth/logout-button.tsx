"use client"

import { logout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="ghost" type="submit">
        로그아웃
      </Button>
    </form>
  )
}
