'use server'

import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'

export interface SystemLogEntry {
  id: string
  level: string
  message: string
  context: Record<string, unknown> | null
  timestamp: Date
}

export interface SystemLogsResult {
  logs: SystemLogEntry[]
  total: number
  page: number
  pageSize: number
}

export async function getSystemLogs(params: {
  level?: string
  page?: number
  pageSize?: number
}): Promise<SystemLogsResult> {
  const session = await verifySession()

  if (session.role !== 'DIRECTOR') {
    return { logs: [], total: 0, page: 1, pageSize: 20 }
  }

  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const skip = (page - 1) * pageSize

  const where = params.level && params.level !== 'ALL'
    ? { level: params.level }
    : {}

  const [logs, total] = await Promise.all([
    db.systemLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      skip,
      take: pageSize,
    }),
    db.systemLog.count({ where }),
  ])

  return {
    logs: logs.map((log) => ({
      id: log.id,
      level: log.level,
      message: log.message,
      context: log.context as Record<string, unknown> | null,
      timestamp: log.timestamp,
    })),
    total,
    page,
    pageSize,
  }
}
