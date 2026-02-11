# Architecture Research: Issue Management & Auto DevOps Integration

**Domain:** Internal DevOps Tooling for School Management SaaS
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

This architecture integrates Issue Management and Auto DevOps pipeline features into the existing AI AfterSchool Next.js 15 application. The design follows the existing patterns (Server Actions for internal, API Routes for external) while adding GitHub integration, webhook handling, and automated deployment triggers.

**Key Integration Points:**
1. **Header UI**: Issue button in header navigation (Director-only)
2. **GitHub Integration**: API routes for webhooks + Server Actions for CRUD
3. **Database**: New Issue/IssueEvent models for local tracking
4. **Sentry Hook**: beforeSend enhancement for auto-issue creation
5. **GitHub Actions**: Conditional deployment based on issue labels

**Complexity:** MEDIUM — Mostly integration work, not new architectural patterns.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐                 │
│  │  Header  │  │ Issue Button │  │ Issue List │                 │
│  │ (Layout) │  │  Component   │  │    Page    │                 │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘                 │
│       │               │                 │                        │
├───────┴───────────────┴─────────────────┴────────────────────────┤
│                         APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  Server Actions               │  API Routes (External)           │
│  ┌───────────────────────┐    │  ┌────────────────────────┐     │
│  │ src/lib/actions/      │    │  │ src/app/api/github/    │     │
│  │   issues.ts           │    │  │   issues/route.ts      │     │
│  │ - createIssue()       │    │  │   webhooks/route.ts    │     │
│  │ - listIssues()        │    │  │                        │     │
│  │ - syncFromGitHub()    │    │  └────────────────────────┘     │
│  └───────────────────────┘    │                                 │
│                                │  Sentry Hooks                   │
│                                │  ┌────────────────────────┐     │
│                                │  │ sentry.*.config.ts     │     │
│                                │  │ - beforeSend()         │     │
│                                │  └────────────────────────┘     │
├───────────────────────────────┴─────────────────────────────────┤
│                         INTEGRATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ GitHub API     │  │ Sentry SDK     │  │ Prisma Client    │   │
│  │ (Octokit)      │  │                │  │ (with RBAC ext)  │   │
│  └────────────────┘  └────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                         PERSISTENCE                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐      │
│  │  PostgreSQL (Prisma)                                   │      │
│  │  - Issue (local cache of GitHub issues)                │      │
│  │  - IssueEvent (webhook events + activity log)          │      │
│  └────────────────────────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────────┤
│                         EXTERNAL SYSTEMS                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ GitHub API  │  │ GitHub       │  │ GitHub Actions       │    │
│  │ (Issues)    │  │ Webhooks     │  │ (Deploy Workflow)    │    │
│  └─────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Header Navigation Integration

**Existing Architecture:**
```
src/app/(dashboard)/layout.tsx
  ├── Logo + Nav Links
  ├── NotificationBell (Director only)
  └── UserMenu (All roles)
```

**New Integration:**
```
src/app/(dashboard)/layout.tsx
  ├── Logo + Nav Links
  ├── NotificationBell (Director only)
  ├── IssueButton (Director only)     ← NEW
  └── UserMenu (All roles)
```

**Implementation Pattern:**
- **Component:** `src/components/layout/issue-button.tsx` (Client Component)
- **Location:** Between `NotificationBell` and `UserMenu` in header
- **RBAC:** Show only to `teacher.role === "DIRECTOR"`
- **Behavior:** Opens modal/drawer with issue form, not full-page navigation

**Rationale:**
- Follows existing pattern (`NotificationBell` is also Director-only, same position)
- Client Component needed for modal/drawer interactivity
- No new route needed (modal-based UI)

### 2. API Route Structure

**Existing Pattern:**
```
src/app/api/
├── health/route.ts           # System health check
├── teams/route.ts            # GET/POST with session auth
├── cloudinary/sign/route.ts  # External service integration
└── students/[id]/report/route.ts  # Resource-specific operations
```

**New GitHub Routes:**
```
src/app/api/github/
├── issues/route.ts           # POST (create issue via GitHub API)
├── webhooks/route.ts         # POST (receive GitHub webhook events)
└── sync/route.ts             # POST (manual sync from GitHub)
```

**Route Responsibilities:**

| Route | Method | Auth | Purpose | Response |
|-------|--------|------|---------|----------|
| `/api/github/issues` | POST | Session (Director) | Create GitHub issue via API, save to DB | `{ issue: Issue, githubUrl: string }` |
| `/api/github/webhooks` | POST | Signature verification | Receive GitHub events (issue updates, comments) | `200 OK` or `400 Bad Request` |
| `/api/github/sync` | POST | Session (Director) | Manually sync all issues from GitHub to local DB | `{ synced: number, errors: string[] }` |

**Signature Verification Pattern (Critical for Webhooks):**
```typescript
// src/app/api/github/webhooks/route.ts
import crypto from 'crypto'

export async function POST(req: Request) {
  // 1. Get raw body for signature verification
  const body = await req.text()
  const signature = req.headers.get('x-hub-signature-256')

  // 2. Verify signature
  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (signature !== expectedSignature) {
    return new Response('Invalid signature', { status: 401 })
  }

  // 3. Process event
  const event = JSON.parse(body)
  await handleGitHubEvent(event)

  return new Response('OK', { status: 200 })
}
```

**Rationale:**
- API Routes used because GitHub webhooks are external, public-facing endpoints
- Signature verification prevents forged webhook events
- Session auth for user-initiated actions (create issue, manual sync)

### 3. Server Actions for Internal Operations

**Existing Pattern:**
```typescript
// src/lib/actions/[domain].ts
"use server"

export async function someAction(formData: FormData) {
  const session = await verifySession() // Auth check
  const db = await getRBACDB()          // RBAC-filtered DB client

  // Business logic

  return { success: true, data }
}
```

**New Issue Actions:**
```typescript
// src/lib/actions/issues.ts
"use server"

import { verifySession, logAuditAction } from '@/lib/dal'
import { db } from '@/lib/db'
import { Octokit } from '@octokit/rest'

export async function createIssue(data: IssueFormData) {
  const session = await verifySession()

  // RBAC: Only Directors can create issues
  if (session.role !== 'DIRECTOR') {
    return { error: 'Unauthorized' }
  }

  // Create GitHub issue via API
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const githubIssue = await octokit.issues.create({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    title: data.title,
    body: data.body,
    labels: data.labels,
  })

  // Save to local DB
  const issue = await db.issue.create({
    data: {
      githubId: githubIssue.data.id,
      githubNumber: githubIssue.data.number,
      title: data.title,
      body: data.body,
      state: 'open',
      createdByTeacherId: session.userId,
      url: githubIssue.data.html_url,
    },
  })

  // Audit log
  await logAuditAction({
    action: 'issue.created',
    entityType: 'Issue',
    entityId: issue.id,
    changes: { title: data.title, githubNumber: githubIssue.data.number },
  })

  return { success: true, issue }
}

export async function listIssues(filters?: IssueFilters) {
  const session = await verifySession()

  if (session.role !== 'DIRECTOR') {
    return { error: 'Unauthorized' }
  }

  const issues = await db.issue.findMany({
    where: {
      state: filters?.state,
      labels: filters?.labels ? { hasSome: filters.labels } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      createdByTeacher: {
        select: { name: true, email: true },
      },
    },
  })

  return { issues }
}

export async function syncIssuesFromGitHub() {
  const session = await verifySession()

  if (session.role !== 'DIRECTOR') {
    return { error: 'Unauthorized' }
  }

  // Fetch all issues from GitHub
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const { data: githubIssues } = await octokit.issues.listForRepo({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    state: 'all',
    per_page: 100,
  })

  // Upsert to local DB
  for (const githubIssue of githubIssues) {
    await db.issue.upsert({
      where: { githubId: githubIssue.id },
      create: {
        githubId: githubIssue.id,
        githubNumber: githubIssue.number,
        title: githubIssue.title,
        body: githubIssue.body || '',
        state: githubIssue.state,
        url: githubIssue.html_url,
        labels: githubIssue.labels.map((l) => typeof l === 'string' ? l : l.name || ''),
      },
      update: {
        title: githubIssue.title,
        body: githubIssue.body || '',
        state: githubIssue.state,
        labels: githubIssue.labels.map((l) => typeof l === 'string' ? l : l.name || ''),
      },
    })
  }

  return { success: true, synced: githubIssues.length }
}
```

**Rationale:**
- Server Actions for user-initiated operations (create, list, sync)
- Follows existing pattern: `verifySession()` → RBAC check → business logic
- Integrates with existing audit logging (`logAuditAction`)

### 4. Database Schema Integration

**Existing Schema:**
- `Teacher` model (role enum includes DIRECTOR)
- `AuditLog` model (for tracking changes)
- `SystemLog` model (for application events)

**New Models:**
```prisma
// prisma/schema.prisma

model Issue {
  id                  String        @id @default(cuid())
  githubId            BigInt        @unique // GitHub's issue ID
  githubNumber        Int           // Issue number in repo (#123)
  title               String
  body                String        @db.Text
  state               IssueState    @default(OPEN)
  labels              String[]      // Array of label names
  url                 String        // GitHub issue URL
  createdByTeacherId  String?       // NULL if created by webhook/system
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  closedAt            DateTime?

  createdByTeacher    Teacher?      @relation(fields: [createdByTeacherId], references: [id])
  events              IssueEvent[]

  @@index([state])
  @@index([githubNumber])
  @@index([createdByTeacherId])
  @@index([createdAt(sort: Desc)])
}

model IssueEvent {
  id          String          @id @default(cuid())
  issueId     String
  eventType   IssueEventType
  payload     Json            // Full webhook payload or event data
  source      EventSource     @default(WEBHOOK)
  createdAt   DateTime        @default(now())

  issue       Issue           @relation(fields: [issueId], references: [id], onDelete: Cascade)

  @@index([issueId])
  @@index([eventType])
  @@index([createdAt(sort: Desc)])
}

enum IssueState {
  OPEN
  CLOSED
}

enum IssueEventType {
  CREATED
  UPDATED
  CLOSED
  REOPENED
  LABELED
  UNLABELED
  COMMENTED
}

enum EventSource {
  WEBHOOK      // From GitHub webhook
  MANUAL_SYNC  // From manual sync action
  SENTRY       // Auto-created from Sentry error
}

// Add to Teacher model:
model Teacher {
  // ... existing fields ...
  createdIssues Issue[]
}
```

**Migration Strategy:**
```bash
# 1. Add new models to schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_issue_management

# 3. Deploy to production
npx prisma migrate deploy
```

**Rationale:**
- `githubId` as unique identifier for sync operations
- `githubNumber` indexed for quick lookup (#123 references)
- `labels` as String array for filtering (no separate Label table needed for MVP)
- `IssueEvent` captures full webhook payload for debugging/audit trail
- Cascade delete on `Issue` → `IssueEvent` for cleanup

### 5. Sentry Integration for Auto-Issue Creation

**Existing Sentry Config:**
```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  beforeSend(event, hint) {
    // Redact sensitive data
    return event
  },
})
```

**Enhanced beforeSend Hook:**
```typescript
// sentry.client.config.ts
import { createIssueFromSentry } from '@/lib/sentry-utils'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  beforeSend(event, hint) {
    // Redact sensitive data (existing logic)
    if (event.request?.headers) {
      const headers = { ...event.request.headers }
      delete headers.authorization
      delete headers.cookie
      event.request.headers = headers
    }

    // Auto-create GitHub issue for critical errors
    if (shouldCreateIssue(event)) {
      // Non-blocking: don't await to avoid slowing down error reporting
      createIssueFromSentry(event, hint).catch(console.error)
    }

    return event
  },
})

function shouldCreateIssue(event: Sentry.Event): boolean {
  // Create issue only for production errors with high severity
  if (process.env.NODE_ENV !== 'production') return false
  if (event.level !== 'error' && event.level !== 'fatal') return false

  // Skip known errors (rate limiting, auth failures, etc.)
  const knownErrors = ['RATE_LIMIT_EXCEEDED', 'UNAUTHORIZED']
  if (event.exception?.values?.some(e =>
    knownErrors.some(known => e.value?.includes(known))
  )) {
    return false
  }

  return true
}
```

```typescript
// src/lib/sentry-utils.ts
import * as Sentry from '@sentry/nextjs'
import { Octokit } from '@octokit/rest'
import { db } from '@/lib/db'

export async function createIssueFromSentry(
  event: Sentry.Event,
  hint?: Sentry.EventHint
): Promise<void> {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

    // Format issue title
    const errorMessage = event.exception?.values?.[0]?.value || event.message || 'Unknown error'
    const title = `[Sentry] ${errorMessage.substring(0, 80)}`

    // Format issue body
    const body = formatSentryIssueBody(event, hint)

    // Create GitHub issue
    const githubIssue = await octokit.issues.create({
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
      title,
      body,
      labels: ['sentry', 'bug', 'auto-created'],
    })

    // Save to local DB
    await db.issue.create({
      data: {
        githubId: githubIssue.data.id,
        githubNumber: githubIssue.data.number,
        title,
        body,
        state: 'open',
        labels: ['sentry', 'bug', 'auto-created'],
        url: githubIssue.data.html_url,
        createdByTeacherId: null, // System-created
      },
    })

    // Log event
    await db.issueEvent.create({
      data: {
        issueId: githubIssue.data.id.toString(),
        eventType: 'CREATED',
        source: 'SENTRY',
        payload: { sentryEventId: event.event_id, githubIssueNumber: githubIssue.data.number },
      },
    })
  } catch (error) {
    console.error('Failed to create issue from Sentry:', error)
    // Don't throw - this is best-effort
  }
}

function formatSentryIssueBody(event: Sentry.Event, hint?: Sentry.EventHint): string {
  const sentryUrl = `https://sentry.io/organizations/${process.env.SENTRY_ORG}/issues/?query=${event.event_id}`

  return `
## Error Details

**Event ID:** ${event.event_id}
**Level:** ${event.level}
**Environment:** ${event.environment}
**Timestamp:** ${new Date(event.timestamp || Date.now()).toISOString()}

## Exception

\`\`\`
${event.exception?.values?.[0]?.value || event.message || 'No exception message'}
\`\`\`

## Stack Trace

\`\`\`
${event.exception?.values?.[0]?.stacktrace?.frames?.slice(-5).map(f =>
  `  at ${f.function} (${f.filename}:${f.lineno})`
).join('\n') || 'No stack trace available'}
\`\`\`

## Request Context

- **URL:** ${event.request?.url || 'N/A'}
- **Method:** ${event.request?.method || 'N/A'}
- **User Agent:** ${event.request?.headers?.['user-agent'] || 'N/A'}

## View in Sentry

[Open in Sentry Dashboard](${sentryUrl})

---
*Auto-created by Sentry integration*
`.trim()
}
```

**Rationale:**
- `beforeSend` is non-blocking (fire-and-forget) to avoid slowing error reporting
- Production-only to prevent spam during development
- Filters known/expected errors (rate limits, auth failures)
- Creates issues with `sentry` label for easy filtering
- Links back to Sentry dashboard for full context

### 6. GitHub Actions Workflow Enhancement

**Existing Workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          script: |
            cd /home/gon/projects/ai/ai-afterschool
            git pull origin main
            ./scripts/deploy.sh --force --tag=${{ github.sha }}
```

**Enhanced Workflow with Issue-Based Auto-Deploy:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    types: [closed]
  workflow_dispatch:

jobs:
  # Job 1: Deploy on direct push to main
  deploy-on-push:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        id: deploy
        uses: appleboy/ssh-action@v1.0.0
        continue-on-error: true
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/gon/projects/ai/ai-afterschool
            git pull origin main
            ./scripts/deploy.sh --force --tag=${{ github.sha }}

      - name: Comment on related issues
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            // Find issues referenced in commit messages
            const commits = await github.rest.repos.listCommits({
              owner: context.repo.owner,
              repo: context.repo.repo,
              sha: context.sha,
              per_page: 10,
            })

            const issueNumbers = new Set()
            commits.data.forEach(commit => {
              const matches = commit.commit.message.matchAll(/#(\d+)/g)
              for (const match of matches) {
                issueNumbers.add(parseInt(match[1]))
              }
            })

            // Comment on each issue
            for (const issueNumber of issueNumbers) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                body: `✅ Deployed to production in commit ${context.sha.substring(0, 7)}\n\nDeployment: https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
              })
            }

      - name: Rollback on failure
        if: failure() && steps.deploy.outcome == 'failure'
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/gon/projects/ai/ai-afterschool
            ./scripts/rollback.sh --force

  # Job 2: Deploy when PR with 'auto-deploy' label is merged
  deploy-on-pr-merge:
    if: |
      github.event_name == 'pull_request' &&
      github.event.pull_request.merged == true &&
      contains(github.event.pull_request.labels.*.name, 'auto-deploy')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        id: deploy
        uses: appleboy/ssh-action@v1.0.0
        continue-on-error: true
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/gon/projects/ai/ai-afterschool
            git pull origin main
            ./scripts/deploy.sh --force --tag=${{ github.sha }}

      - name: Comment on PR and linked issues
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            // Comment on the PR
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
              body: `✅ Auto-deployed to production\n\nDeployment: https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
            })

            // Find and close linked issues with 'closes #123' syntax
            const prBody = context.payload.pull_request.body || ''
            const closeMatches = prBody.matchAll(/(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi)

            for (const match of closeMatches) {
              const issueNumber = parseInt(match[1])
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: issueNumber,
                body: `✅ Fixed and deployed in PR #${context.payload.pull_request.number}\n\nDeployment: https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
              })
            }

      - name: Rollback on failure
        if: failure() && steps.deploy.outcome == 'failure'
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          port: ${{ secrets.SERVER_PORT }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/gon/projects/ai/ai-afterschool
            ./scripts/rollback.sh --force

      - name: Notify on rollback
        if: failure() && steps.deploy.outcome == 'failure'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
              body: `❌ Deployment failed and rolled back\n\nPlease check the logs: https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`,
            })
```

**Rationale:**
- **Two deploy triggers:** Direct push to main (existing) + PR merge with `auto-deploy` label (new)
- **Issue linking:** Automatically comments on issues referenced in commits (#123 syntax)
- **PR-to-issue flow:** When PR with `closes #123` is merged, comments on linked issue
- **Rollback notification:** Comments on PR/issues if deployment fails
- Uses GitHub Script action for API calls (no separate webhook needed)

### 7. Environment Variables

**New Variables Required:**

```bash
# .env.example additions

# =============================================================================
# GitHub Integration
# =============================================================================
# GitHub Personal Access Token (PAT) with repo scope
# Generate at: https://github.com/settings/tokens
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Repository for issue tracking
GITHUB_OWNER=your-org-or-username
GITHUB_REPO=ai-afterschool

# Webhook secret for signature verification
# Generate with: openssl rand -hex 32
GITHUB_WEBHOOK_SECRET=your-webhook-secret-here
```

**Security Considerations:**
- `GITHUB_TOKEN`: Never commit, use GitHub Secrets in Actions
- `GITHUB_WEBHOOK_SECRET`: Same secret in GitHub webhook config and .env
- Store in server `.env` (192.168.0.5:/home/gon/projects/ai/ai-afterschool/.env)

## Data Flow Patterns

### Flow 1: User Creates Issue

```
[Director clicks "Report Issue" in header]
    ↓
[IssueButton opens modal/drawer]
    ↓
[User fills form: title, description, labels]
    ↓
[Submit triggers Server Action: createIssue()]
    ↓ verifySession() + RBAC check
    ↓
[createIssue() calls GitHub API (Octokit)]
    ↓
[GitHub creates issue, returns githubId + number]
    ↓
[Server Action saves to local DB: Issue model]
    ↓
[logAuditAction() records creation]
    ↓
[Return success + issue URL to client]
    ↓
[Modal shows success + link to GitHub issue]
```

### Flow 2: GitHub Webhook Event

```
[GitHub fires webhook (issue updated/closed/commented)]
    ↓
[POST /api/github/webhooks]
    ↓ Verify signature with GITHUB_WEBHOOK_SECRET
    ↓
[Parse event type: issue.updated, issue.closed, etc.]
    ↓
[Update local DB: Issue model (state, labels, closedAt)]
    ↓
[Create IssueEvent record (audit trail)]
    ↓
[Optional: Trigger notification to Directors]
    ↓
[Return 200 OK to GitHub]
```

### Flow 3: Sentry Error → Auto-Issue

```
[Error occurs in production]
    ↓
[Sentry SDK captures error]
    ↓
[beforeSend() hook executes]
    ↓ shouldCreateIssue() checks: production + error level + not known error
    ↓
[createIssueFromSentry() fires (non-blocking)]
    ↓
[Format issue title + body from Sentry event]
    ↓
[Create GitHub issue with 'sentry' + 'bug' labels]
    ↓
[Save to local DB with source = 'SENTRY']
    ↓
[Create IssueEvent record]
    ↓
[Error continues to Sentry (not blocked)]
```

### Flow 4: PR Merge → Auto-Deploy → Issue Comment

```
[Developer merges PR with 'auto-deploy' label]
    ↓
[GitHub triggers workflow: pull_request.closed]
    ↓
[deploy-on-pr-merge job checks: merged == true + has 'auto-deploy' label]
    ↓
[SSH to server, run deploy.sh script]
    ↓ If success:
    ↓
[GitHub Script finds issues in PR body: "closes #123"]
    ↓
[Comment on issue: "✅ Fixed and deployed in PR #456"]
    ↓
[Issue auto-closes (GitHub native behavior)]
    ↓ If failure:
    ↓
[Rollback script executes]
    ↓
[Comment on PR: "❌ Deployment failed and rolled back"]
```

## Build Order & Dependencies

### Phase 1: Database Foundation (No External Dependencies)
1. **Add Prisma models** (`Issue`, `IssueEvent`, enums)
2. **Create migration** (`npx prisma migrate dev --name add_issue_management`)
3. **Update Prisma Client types** (auto-generated)

**Validation:** Migration applies cleanly, no existing data affected.

### Phase 2: GitHub API Integration (Depends on Phase 1)
1. **Install dependencies** (`@octokit/rest`)
2. **Add environment variables** (`.env.example` + server `.env`)
3. **Create Server Action** (`src/lib/actions/issues.ts`)
   - `createIssue()` — calls GitHub API, saves to DB
   - `listIssues()` — reads from local DB
   - `syncIssuesFromGitHub()` — batch sync from GitHub

**Validation:** Can create issues via Server Action in test page.

### Phase 3: UI Components (Depends on Phase 2)
1. **Create IssueButton component** (`src/components/layout/issue-button.tsx`)
2. **Create IssueForm modal** (`src/components/issues/issue-form.tsx`)
3. **Update dashboard layout** (add IssueButton to header, Director-only)
4. **Create issue list page** (`src/app/(dashboard)/issues/page.tsx`)

**Validation:** Director can create issues from header, see list page.

### Phase 4: Webhook Handler (Depends on Phase 1-2)
1. **Create webhook API route** (`src/app/api/github/webhooks/route.ts`)
2. **Implement signature verification**
3. **Add webhook handlers for events** (issue updated, closed, labeled)
4. **Configure webhook in GitHub repo settings**

**Validation:** Manual webhook test (use GitHub "Redeliver" button), verify DB updates.

### Phase 5: Sentry Integration (Depends on Phase 2)
1. **Update Sentry config** (`sentry.client.config.ts`, `sentry.server.config.ts`)
2. **Add `beforeSend` hook with `shouldCreateIssue()` logic**
3. **Create `src/lib/sentry-utils.ts`** with `createIssueFromSentry()`
4. **Test with forced error in production-like environment**

**Validation:** Trigger test error, verify GitHub issue created with `sentry` label.

### Phase 6: GitHub Actions Enhancement (Depends on Phase 2)
1. **Update `.github/workflows/deploy.yml`**
   - Add `pull_request.closed` trigger
   - Add conditional for `auto-deploy` label
   - Add GitHub Script steps for issue commenting
2. **Test with PR** (create PR with `auto-deploy` label, merge, verify deploy + comments)

**Validation:** PR merge triggers deploy, comments appear on linked issues.

### Phase 7: Integration Testing & Documentation
1. **E2E test:** Create issue → webhook updates → list page reflects change
2. **Load test webhook handler** (simulate burst of GitHub events)
3. **Update README** with setup instructions (GitHub webhook config, env vars)
4. **Create runbook** for troubleshooting (webhook delivery failures, token expiry)

**Dependency Graph:**
```
Phase 1 (DB)
    ↓
Phase 2 (GitHub API)
    ↓ ↓ ↓
Phase 3 (UI)  Phase 4 (Webhook)  Phase 5 (Sentry)
    ↓             ↓                   ↓
    └─────────────┴───────────────────┴─→ Phase 6 (Actions)
                                               ↓
                                           Phase 7 (Testing)
```

**Critical Path:** Phase 1 → 2 → 3 (user-facing feature works without webhooks/Sentry/Actions)

## Architectural Patterns

### Pattern 1: Dual-Layer Issue Tracking (Local DB + GitHub)

**What:** Store GitHub issues in local PostgreSQL database as cache, sync via webhooks + manual sync action.

**When to use:** When you need fast queries, custom filtering, or want to survive GitHub API rate limits.

**Trade-offs:**
- **Pro:** Fast queries without hitting GitHub API every time
- **Pro:** Can add custom fields (e.g., `assignedToTeacherId`) not in GitHub
- **Pro:** Works even if GitHub is down (read-only)
- **Con:** Data can drift if webhook delivery fails
- **Con:** Extra complexity (two sources of truth)

**Example:**
```typescript
// Fast local query (no GitHub API call)
const openIssues = await db.issue.findMany({
  where: { state: 'OPEN', labels: { has: 'bug' } },
  orderBy: { createdAt: 'desc' },
})

// Sync from GitHub when needed
const { synced } = await syncIssuesFromGitHub()
```

**Mitigation for drift:** Run `syncIssuesFromGitHub()` on cron (daily) as fallback.

### Pattern 2: Webhook Signature Verification

**What:** Verify `x-hub-signature-256` header on incoming webhooks to prevent forgery.

**When to use:** Always, for any public webhook endpoint.

**Trade-offs:**
- **Pro:** Prevents attackers from forging webhook events
- **Pro:** Required by GitHub (delivery fails if secret is wrong)
- **Con:** Requires storing secret securely (can't be in client code)

**Example:** See [Integration Points → API Route Structure](#2-api-route-structure) above.

### Pattern 3: Non-Blocking Sentry Hook

**What:** Fire-and-forget GitHub issue creation in `beforeSend()` to avoid slowing error reporting.

**When to use:** When side effects (like API calls) shouldn't block the main flow.

**Trade-offs:**
- **Pro:** Doesn't slow down Sentry error reporting
- **Pro:** Failures in issue creation don't break error logging
- **Con:** Can't show user feedback if issue creation fails
- **Con:** Harder to debug (errors are swallowed)

**Example:**
```typescript
beforeSend(event, hint) {
  // Don't await — fire and forget
  createIssueFromSentry(event, hint).catch(console.error)
  return event
}
```

### Pattern 4: GitHub Script Action for Issue Automation

**What:** Use `actions/github-script` in workflows to comment on issues/PRs without separate webhook.

**When to use:** For deployment notifications, auto-closing issues, etc.

**Trade-offs:**
- **Pro:** No need to set up separate API server for GitHub API calls
- **Pro:** Authenticated automatically (no token management)
- **Con:** Only runs in GitHub Actions context (can't use in app)
- **Con:** Limited to workflow triggers

**Example:** See [Integration Points → GitHub Actions](#6-github-actions-workflow-enhancement) above.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing GitHub Token in Client Code

**What people do:** Pass `GITHUB_TOKEN` to client components for direct API calls.

**Why it's wrong:**
- Token is exposed in browser (anyone can extract it)
- Allows unauthorized issue creation/deletion
- Violates security best practices

**Do this instead:** Always call GitHub API from Server Actions or API Routes (server-side only).

### Anti-Pattern 2: Blocking Sentry beforeSend with Await

**What people do:**
```typescript
beforeSend(event) {
  await createIssueFromSentry(event) // WRONG: blocks error reporting
  return event
}
```

**Why it's wrong:**
- Slows down error reporting to Sentry
- If GitHub API is slow/down, errors aren't logged at all
- Defeats the purpose of fast error tracking

**Do this instead:** Fire-and-forget (no await), log failures separately.

### Anti-Pattern 3: No Signature Verification on Webhooks

**What people do:** Accept webhook events without checking `x-hub-signature-256`.

**Why it's wrong:**
- Allows attackers to forge webhook events
- Could trigger malicious actions (close all issues, spam comments)

**Do this instead:** Always verify signature (see Pattern 2 above).

### Anti-Pattern 4: Using OAuth App Instead of Personal Access Token (PAT)

**What people do:** Set up GitHub OAuth App for internal tool issue tracking.

**Why it's wrong:**
- OAuth Apps require user authorization flow (unnecessary for server-to-server)
- Tokens expire when user leaves org
- More complex setup for single-repo operations

**Do this instead:** Use Personal Access Token (PAT) with `repo` scope for server-side automation. For multi-tenant SaaS, use GitHub App.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-100 issues** | Current architecture (local DB cache + webhooks) is sufficient. Manual sync as fallback. |
| **100-1k issues** | Add pagination to issue list page. Index `state` + `labels` columns for faster queries. Consider cron job for daily sync (catch webhook failures). |
| **1k-10k issues** | Add full-text search on `title` + `body` (PostgreSQL `tsvector`). Consider archiving closed issues older than 1 year. Rate limit webhook handler (prevent spam). |
| **10k+ issues** | Switch to dedicated issue tracking system (Linear, Jira) with bi-directional sync. Local DB becomes read-only cache. Add Redis for webhook deduplication. |

**First bottleneck:** Webhook delivery failures (GitHub retries 3x, then stops). Mitigation: Daily cron sync + monitoring.

**Second bottleneck:** Issue list page load time (1k+ issues). Mitigation: Pagination + server-side filtering + caching.

## New Files & Modified Files

### New Files Created

| Path | Purpose | Dependencies |
|------|---------|--------------|
| `prisma/migrations/XXX_add_issue_management.sql` | Database schema for Issue/IssueEvent models | Prisma schema changes |
| `src/lib/actions/issues.ts` | Server Actions for issue CRUD + sync | `@octokit/rest`, `verifySession()` |
| `src/app/api/github/issues/route.ts` | API route for creating issues (alternative to Server Action) | Session auth, Octokit |
| `src/app/api/github/webhooks/route.ts` | Webhook receiver for GitHub events | Crypto (signature verification), Prisma |
| `src/app/api/github/sync/route.ts` | Manual sync trigger endpoint | Session auth, Octokit |
| `src/components/layout/issue-button.tsx` | Header button to open issue form | Client component, modal state |
| `src/components/issues/issue-form.tsx` | Modal form for creating issues | Server Action binding, form validation |
| `src/components/issues/issue-list.tsx` | List view for issues (with filters) | Server Component, fetch from DB |
| `src/app/(dashboard)/issues/page.tsx` | Full-page issue list view | Server Component, RBAC check |
| `src/lib/sentry-utils.ts` | Helper for creating issues from Sentry events | Octokit, Prisma, Sentry types |

### Modified Files

| Path | Changes | Rationale |
|------|---------|-----------|
| `prisma/schema.prisma` | Add `Issue`, `IssueEvent` models + enums | Database schema |
| `src/app/(dashboard)/layout.tsx` | Add `<IssueButton />` component in header (Director-only) | UI integration point |
| `sentry.client.config.ts` | Add `beforeSend` hook with `shouldCreateIssue()` logic | Sentry → GitHub integration |
| `sentry.server.config.ts` | Same `beforeSend` hook (server-side errors) | Sentry → GitHub integration |
| `.env.example` | Add `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_WEBHOOK_SECRET` | Configuration template |
| `.github/workflows/deploy.yml` | Add `pull_request.closed` trigger + GitHub Script steps | Auto-deploy on PR merge |
| `package.json` | Add `@octokit/rest` dependency | GitHub API client |

## Integration Testing Strategy

### Test 1: Manual Issue Creation Flow
1. Login as Director
2. Click "Report Issue" in header
3. Fill form: title, description, labels
4. Submit → verify GitHub issue created
5. Check local DB: `Issue` record exists with correct `githubId`
6. Check `AuditLog`: creation event logged

**Expected:** Issue appears in GitHub + local DB + audit log.

### Test 2: Webhook Delivery
1. Create issue manually in GitHub (not through app)
2. GitHub fires `issue.created` webhook
3. Verify webhook endpoint receives event (check logs)
4. Verify signature verification passes
5. Check local DB: `Issue` record created
6. Check `IssueEvent` record exists with `source = 'WEBHOOK'`

**Expected:** Local DB syncs automatically from GitHub webhook.

### Test 3: Webhook Signature Rejection
1. Send POST to `/api/github/webhooks` with invalid signature
2. Verify returns 401 Unauthorized
3. Verify no DB changes

**Expected:** Invalid webhooks rejected, no side effects.

### Test 4: Sentry Auto-Issue Creation
1. Force error in production-like environment (e.g., throw in Server Action)
2. Verify Sentry captures error
3. Wait 5-10 seconds (fire-and-forget delay)
4. Check GitHub: issue created with `sentry` label
5. Check local DB: `Issue` record exists with `source = 'SENTRY'`

**Expected:** Production errors auto-create GitHub issues.

### Test 5: PR Merge → Deploy → Issue Comment
1. Create PR with `auto-deploy` label
2. Add "closes #123" in PR description
3. Merge PR to main
4. Verify deploy workflow triggers
5. Verify deployment succeeds (check health endpoint)
6. Verify comment appears on issue #123
7. Verify issue auto-closes

**Expected:** PR merge deploys, comments on linked issues, closes them.

### Test 6: Manual Sync After Webhook Failure
1. Simulate webhook failure (disable webhook in GitHub, create issue manually)
2. Run `syncIssuesFromGitHub()` Server Action
3. Verify local DB syncs missing issue
4. Verify `IssueEvent` created with `source = 'MANUAL_SYNC'`

**Expected:** Manual sync catches missed webhook events.

## Sources

- [Next.js Route Handlers: The Complete Guide](https://makerkit.dev/blog/tutorials/nextjs-api-best-practices)
- [GitHub Webhooks And NextJS](https://www.karimshehadeh.com/blog/posts/GithubWebhooksAndNextJS)
- [Understanding Webhooks in Next.js](https://medium.com/@dorinelrushi8/understanding-webhooks-in-next-js-1691eab2395e)
- [What Are Webhooks and How Can You Use Them in Next js 15](https://www.jigz.dev/blogs/what-are-webhooks-and-how-can-you-use-them-in-next-js-15)
- [Differences between GitHub Apps and OAuth apps - GitHub Docs](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps)
- [GitHub App vs. GitHub OAuth: When to Use Which?](https://nango.dev/blog/github-app-vs-github-oauth)
- [GitHub Integration - Sentry Documentation](https://docs.sentry.io/organization/integrations/source-code-mgmt/github/)
- [Automatically create new github issue - Sentry Forum](https://forum.sentry.io/t/automatically-create-new-github-issue/12203)
- [Prisma Schema Overview](https://www.prisma.io/docs/orm/prisma-schema/overview)
- [GitHub - prisma/database-schema-examples](https://github.com/prisma/database-schema-examples)
- [Trigger workflow only on pull request MERGE](https://github.com/orgs/community/discussions/26724)
- [GitHub Actions: How to autodeploy your app](https://blog.logrocket.com/github-actions-how-to-autodeploy-your-app/)
- [Events that trigger workflows - GitHub Docs](https://docs.github.com/actions/learn-github-actions/events-that-trigger-workflows)

---
*Architecture research for: AI AfterSchool Issue Management & Auto DevOps Integration*
*Researched: 2026-02-11*
*Confidence: HIGH (official docs + existing codebase patterns)*
