'use client'

import { useEffect, useState, useTransition } from 'react'
import { getBackupList, type BackupFileEntry } from '@/lib/actions/backup'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Download, Database, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { runSeedAction } from '@/app/(dashboard)/admin/database/actions'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

type DatabaseTabProps = {
  userRole?: string
}

export function DatabaseTab({ userRole }: DatabaseTabProps) {
  const [backups, setBackups] = useState<BackupFileEntry[]>([])
  const [seedDialogOpen, setSeedDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isDirector = userRole === 'DIRECTOR'

  useEffect(() => {
    getBackupList().then(setBackups)
  }, [])

  function handleSeed() {
    startTransition(async () => {
      const result = await runSeedAction()
      setSeedDialogOpen(false)

      if (result.success) {
        const data = result.data
        const total = Object.values(data).reduce(
          (acc, v) => ({ created: acc.created + v.created, updated: acc.updated + v.updated }),
          { created: 0, updated: 0 }
        )
        toast.success(
          `시드 완료: ${total.created}건 생성, ${total.updated}건 갱신`,
          {
            description: Object.entries(data)
              .filter(([, v]) => v.created > 0 || v.updated > 0)
              .map(([k, v]) => `${k}: +${v.created} / ~${v.updated}`)
              .join(', '),
            duration: 8000,
          }
        )
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6" data-testid="database-tab">
      {/* 시드 데이터 초기화 (DIRECTOR만) */}
      {isDirector && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                <Database className="w-4 h-4" />
                시드 데이터 초기화
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                데모/개발용 기본 데이터를 로드합니다. 기존 데이터를 삭제하지 않으며, 없는 데이터만 추가됩니다 (upsert).
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setSeedDialogOpen(true)}
              disabled={isPending}
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로드 중...
                </>
              ) : (
                '시드 데이터 로드'
              )}
            </Button>
          </div>
        </div>
      )}

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

      {/* 시드 확인 AlertDialog */}
      <AlertDialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시드 데이터 로드</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                데모/개발용 기본 데이터를 로드합니다.
              </span>
              <span className="block text-sm">
                기존 데이터를 삭제하지 않으며, 없는 데이터만 추가하고 이미 있는 데이터는 갱신합니다 (upsert).
                비밀번호, API 키 등 운영 설정은 변경되지 않습니다.
              </span>
              <span className="block text-sm font-medium">
                포함 항목: 팀 3개, 선생님 10명, 학생 8명, 학부모 9명, LLM 설정 6개, Provider 7개
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleSeed} disabled={isPending}>
              {isPending ? '로드 중...' : '시드 로드 실행'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
