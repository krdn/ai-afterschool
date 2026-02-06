'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface AdminTabsWrapperProps {
  children: React.ReactNode
  defaultValue?: string
}

export function AdminTabsWrapper({ children, defaultValue = 'llm-settings' }: AdminTabsWrapperProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6" data-testid="admin-tabs">
      <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
        <TabsTrigger value="llm-settings">LLM 설정</TabsTrigger>
        <TabsTrigger value="llm-usage">토큰 사용량</TabsTrigger>
        <TabsTrigger value="system-status">시스템 상태</TabsTrigger>
        <TabsTrigger value="system-logs">시스템 로그</TabsTrigger>
        <TabsTrigger value="database">데이터베이스</TabsTrigger>
        <TabsTrigger value="audit-logs">감사 로그</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}

interface AdminTabsContentProps {
  value: string
  children: React.ReactNode
}

export function AdminTabsContent({ value, children }: AdminTabsContentProps) {
  return <TabsContent value={value} className="space-y-6">{children}</TabsContent>
}
