"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ReservationList } from "@/components/counseling/ReservationList"
import { ReservationForm } from "@/components/counseling/ReservationForm"
import { ReservationCalendar } from "@/components/counseling/ReservationCalendar"
import { getReservationsAction } from "@/lib/actions/reservations"
import type { ReservationWithRelations } from "@/components/counseling/ReservationCard"
import type { CounselingSessionData } from "./types"

interface CounselingPageTabsProps {
  initialTab?: string
  sessions: CounselingSessionData[]
  session: {
    userId: string
    role: string
    teamId?: string | null
  }
  children: React.ReactNode
}

type FormView = "list" | "form"

export function CounselingPageTabs({ initialTab, sessions, session, children }: CounselingPageTabsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"history" | "reservations">(
    initialTab === "reservations" ? "reservations" : "history"
  )
  const [formView, setFormView] = useState<FormView>("list")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [reservations, setReservations] = useState<ReservationWithRelations[]>([])

  // 컴포넌트 마운트 시 예약 목록 로드
  useEffect(() => {
    const loadReservations = async () => {
      const result = await getReservationsAction({
        status: undefined,
      })
      if (result.success && result.data) {
        setReservations(result.data)
      }
    }
    loadReservations()
  }, [])

  // 예약 목록 갱신
  const refreshReservations = async () => {
    const result = await getReservationsAction({
      status: undefined,
    })
    if (result.success && result.data) {
      setReservations(result.data)
    }
  }

  // 날짜 필터 해제
  const clearDateFilter = () => {
    setSelectedDate(undefined)
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "history" | "reservations")}>
      <TabsList>
        <TabsTrigger value="history">상담 기록</TabsTrigger>
        <TabsTrigger value="reservations">예약 관리</TabsTrigger>
      </TabsList>

      {/* 상담 기록 탭 */}
      <TabsContent value="history" className="mt-4">
        {children}
      </TabsContent>

      {/* 예약 관리 탭 */}
      <TabsContent value="reservations" className="mt-4">
        <div className="space-y-6">
          {formView === "list" ? (
            <>
              {/* 탭 헤더: 날짜 선택 + 새 예약 등록 버튼 */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1">
                  <ReservationCalendar
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="max-w-md"
                  />
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearDateFilter}
                      className="mt-2"
                    >
                      날짜 필터 해제
                    </Button>
                  )}
                </div>
                <Button onClick={() => setFormView("form")} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  새 예약 등록
                </Button>
              </div>

              {/* 예약 목록 */}
              <ReservationList
                reservations={reservations}
                onRefresh={() => setFormView("form")}
                dateFilter={selectedDate}
              />
            </>
          ) : (
            /* 예약 등록 폼 */
            <ReservationForm
              onCancel={() => {
                setFormView("list")
                router.refresh()
              }}
              onSuccess={() => {
                setFormView("list")
                refreshReservations()
                router.refresh()
              }}
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
