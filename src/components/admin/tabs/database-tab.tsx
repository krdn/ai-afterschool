'use client'

import { useEffect, useState } from 'react'
import { getBackupList, type BackupFileEntry } from '@/lib/actions/backup'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

export function DatabaseTab() {
  const [backups, setBackups] = useState<BackupFileEntry[]>([])

  useEffect(() => {
    getBackupList().then(setBackups)
  }, [])

  return (
    <div className="space-y-6" data-testid="database-tab">
      {/* 백업 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>백업 정보:</strong> 백업 파일은{' '}
          <code className="bg-blue-100 px-1 rounded">
            {process.env.NEXT_PUBLIC_BACKUP_DIR || './backups'}
          </code>
          디렉토리에 저장됩니다. 자동 백업은 cron으로 설정되어 있어야 합니다.
        </p>
      </div>

      {/* 백업 목록 */}
      <div data-testid="backup-list">
        {backups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 border rounded-lg" data-testid="no-backups">
            <p className="text-gray-500 mb-2">백업 파일이 없어요</p>
            <p className="text-sm text-gray-400">
              자동 백업이 설정되어 있지 않거나 아직 백업이 실행되지 않았습니다.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파일명</TableHead>
                  <TableHead>크기</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.name} data-testid="backup-row">
                    <TableCell
                      className="font-mono text-sm"
                      data-testid="backup-name"
                    >
                      {backup.name}
                    </TableCell>
                    <TableCell data-testid="backup-size">
                      {formatBytes(backup.size)}
                    </TableCell>
                    <TableCell data-testid="backup-date">
                      {backup.createdAt.toLocaleString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        data-testid="download-backup-button"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
