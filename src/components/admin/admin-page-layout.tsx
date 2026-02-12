import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Settings, ChevronRight } from 'lucide-react';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

/**
 * Admin 페이지 공통 레이아웃
 * 
 * 외부 admin 페이지들에서 일관된 네비게이션과 헤더를 제공합니다.
 */
export function AdminPageLayout({
  children,
  title,
  description,
  breadcrumbs,
  actions,
}: AdminPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* 상단 네비게이션 바 */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 좌측: 홈 링크 및 브레드크럼 */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">
                  <Home className="w-4 h-4 mr-2" />
                  관리자 대시보드
                </Link>
              </Button>
              
              {breadcrumbs && breadcrumbs.length > 0 && (
                <>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <nav className="flex items-center gap-2">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {index > 0 && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        {crumb.href ? (
                          <Link
                            href={crumb.href}
                            className="text-sm text-muted-foreground hover:text-foreground"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium">{crumb.label}</span>
                        )}
                      </div>
                    ))}
                  </nav>
                </>
              )}
            </div>

            {/* 우측: 설정 링크 */}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin">
                <Settings className="w-4 h-4 mr-2" />
                설정
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-2">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
