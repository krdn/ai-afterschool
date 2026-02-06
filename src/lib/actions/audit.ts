'use server'

import { verifySession } from '@/lib/dal'
import { db } from '@/lib/db'

export interface AuditLogEntry {
  id: string
  teacherId: string
  teacherName: string
  action: string
  entityType: string
  entityId: string | null
  changes: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: Date
}

export interface AuditLogsResult {
  logs: AuditLogEntry[]
  total: number
  page: number
  pageSize: number
}

export async function getAuditLogs(params: {
  action?: string
  page?: number
  pageSize?: number
}): Promise<AuditLogsResult> {
  const session = await verifySession()

  if (session.role !== 'DIRECTOR') {
    return { logs: [], total: 0, page: 1, pageSize: 20 }
  }

  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const skip = (page - 1) * pageSize

  const where = params.action && params.action !== 'ALL'
    ? { action: params.action }
    : {}

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    db.auditLog.count({ where }),
  ])

  return {
    logs: logs.map((log) => ({
      id: log.id,
      teacherId: log.teacherId,
      teacherName: log.teacher.name,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      changes: log.changes as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    })),
    total,
    page,
    pageSize,
  }
}
