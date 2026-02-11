# Feature Research

**Domain:** Issue Management & Auto DevOps Pipeline
**Researched:** 2026-02-11
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| In-app Issue Reporting Modal | Standard UX pattern in modern web apps for reporting bugs/feedback | LOW | Radix UI Dialog already in use; extend existing pattern |
| Screenshot Capture | Visual bug reports are industry standard (tools like Bird Eats Bug, UXCam) | MEDIUM | Browser native APIs available; html2canvas for fallback |
| Issue Type Categorization | Users need to classify reports (bug/feature/question) | LOW | Dropdown selector; maps to GitHub labels |
| GitHub Issue Creation | Central source of truth for development workflow | LOW | REST API available; no direct image upload (need workaround) |
| Branch Auto-Creation from Issue | Standard workflow (GitLab, GitHub native features emerging) | LOW | Convention: `fix/issue-123-description`, `feat/issue-456-description` |
| Error Stack Trace Capture | Runtime errors should include technical context (file, line, stack) | MEDIUM | Sentry already integrated; extend for issue creation |
| CI/CD Pipeline Status Display | Users expect to see deployment progress (registering → branch → test → deploy) | MEDIUM | Webhook listeners + GitHub Actions status API |
| Issue Lifecycle Dashboard | Track issues from report to deployment | MEDIUM | Recharts already in use; extend existing dashboard patterns |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Smart Error Deduplication | Prevents duplicate issues for same root cause; reduces noise | HIGH | Requires stack trace fingerprinting, similarity scoring |
| Screenshot Annotation Tools | Users can highlight/annotate problem areas before submitting | MEDIUM | Libraries: AnnotationCanvas, djaodjin-annotate available |
| Auto-Enrichment with User Context | Issues include user role (DIRECTOR/TEACHER), session info, audit log excerpt | MEDIUM | Leverage existing RBAC + audit logs |
| Health Check Auto-Rollback | Failed deployments auto-revert to last stable version | HIGH | Requires health check endpoints + workflow orchestration |
| Issue-to-Deploy Timeline | Visual representation of lifecycle duration (time in each stage) | MEDIUM | Enhances accountability; reveals bottlenecks |
| Rate-Limiting for Error Reports | Prevents spam from single error flooding issues | MEDIUM | Per-error-fingerprint throttling (e.g., 1 issue per error per hour) |
| In-Dashboard PR Preview Links | Click issue → view PR diff directly in dashboard | LOW | Enhances context without leaving app |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-Time Issue Chat | "Like Slack for issues" | Adds complexity without value; GitHub already has comments | Link to GitHub issue for discussion |
| Custom Issue Templates Builder | "Let users create their own forms" | Template sprawl; inconsistent data | Fixed templates with sensible defaults |
| Video Recording for Issues | "Show us the problem in motion" | Large file sizes; privacy concerns; complexity | Screenshot + step-by-step text description |
| Manual Deployment Trigger per Issue | "Deploy just this fix" | Breaks CI/CD guarantees; deployment should be branch-based | Standard branch → PR → merge → deploy flow |
| In-App Code Review | "Review PRs without GitHub" | Reinventing GitHub's core feature poorly | Deep-link to GitHub PR with context |

## Feature Dependencies

```
Issue Reporting Modal
    └──requires──> Screenshot Capture
                       └──optional──> Annotation Tools

Error Auto-Collection
    └──requires──> Error Deduplication
    └──requires──> Rate Limiting

Branch Auto-Creation
    └──requires──> GitHub Issue Creation
    └──optional──> Branch Naming Convention Config

CI/CD Pipeline Status
    └──requires──> GitHub Actions Webhooks
    └──requires──> Issue Lifecycle Tracking

Issue Lifecycle Dashboard
    └──requires──> CI/CD Pipeline Status
    └──requires──> Issue Lifecycle Tracking
    └──enhances──> Issue-to-Deploy Timeline

Auto-Rollback
    └──requires──> Health Check Endpoints
    └──requires──> CI/CD Pipeline Integration
```

### Dependency Notes

- **Issue Reporting requires Screenshot Capture:** Visual context is essential for bug reports; annotation is optional but enhances clarity
- **Error Auto-Collection requires Deduplication:** Without dedup, single error creates dozens of issues; rate limiting prevents flood
- **Branch Auto-Creation requires GitHub Issue:** Branch name includes issue number for traceability
- **CI/CD Status requires Webhooks:** GitHub Actions must notify app of status changes
- **Issue Lifecycle Dashboard requires Pipeline Status:** Can't visualize lifecycle without knowing current state
- **Auto-Rollback requires Health Checks:** Can't roll back without knowing deployment health

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Issue Reporting Modal** — Core UX; DIRECTOR/TEAM_LEADER must be able to report issues in-app
- [x] **Screenshot Capture** — Visual context essential for bug reports (non-technical users)
- [x] **Issue Type Categorization** — Bug vs Feature distinction needed for triage
- [x] **GitHub Issue Creation** — Central source of truth; development workflow dependency
- [x] **Branch Auto-Creation** — Developer workflow efficiency; standard practice
- [x] **Basic Issue Lifecycle Tracking** — Store issue state (registered → branch_created → in_progress → testing → deployed)
- [x] **Issue Dashboard (Read-Only)** — View reported issues and their status

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Screenshot Annotation** — Add once users confirm screenshot capture works; enhances clarity
- [ ] **Error Auto-Collection** — Add after manual issue reporting validated; requires deduplication logic
- [ ] **CI/CD Pipeline Status Display** — Add once webhook infrastructure proven; shows deployment progress
- [ ] **Rate Limiting for Errors** — Add with error auto-collection to prevent spam
- [ ] **Issue-to-Deploy Timeline** — Add once lifecycle data accumulated; visualizes bottlenecks

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Auto-Rollback** — Complex; requires health checks + workflow orchestration; defer until deployment frequency justifies complexity
- [ ] **Smart Error Deduplication** — ML/similarity scoring adds complexity; start with simple fingerprinting, upgrade if needed
- [ ] **Auto-Enrichment with User Context** — Nice-to-have; manual context entry sufficient for v1

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Dependencies |
|---------|------------|---------------------|----------|--------------|
| Issue Reporting Modal | HIGH | LOW | P1 | Radix UI Dialog (existing) |
| Screenshot Capture | HIGH | MEDIUM | P1 | Browser APIs |
| Issue Type Categorization | HIGH | LOW | P1 | None |
| GitHub Issue Creation | HIGH | LOW | P1 | GitHub REST API |
| Branch Auto-Creation | HIGH | LOW | P1 | GitHub Issue |
| Issue Lifecycle Tracking | HIGH | MEDIUM | P1 | DB schema extension |
| Issue Dashboard | HIGH | MEDIUM | P1 | Recharts (existing) |
| Screenshot Annotation | MEDIUM | MEDIUM | P2 | Screenshot Capture |
| Error Auto-Collection | HIGH | HIGH | P2 | Sentry (existing), Deduplication |
| CI/CD Pipeline Status | MEDIUM | MEDIUM | P2 | Webhooks, GitHub Actions API |
| Rate Limiting | MEDIUM | MEDIUM | P2 | Error Auto-Collection |
| Issue-to-Deploy Timeline | MEDIUM | LOW | P2 | Lifecycle Tracking |
| Auto-Rollback | HIGH | HIGH | P3 | Health Checks, Complex orchestration |
| Smart Deduplication | MEDIUM | HIGH | P3 | ML/similarity algorithms |
| Auto-Enrichment | LOW | MEDIUM | P3 | Existing audit logs |

**Priority key:**
- P1: Must have for launch (v1)
- P2: Should have, add when possible (v1.x)
- P3: Nice to have, future consideration (v2+)

## Competitor Feature Analysis

| Feature | Linear | Jira | Sentry | Our Approach |
|---------|--------|------|--------|--------------|
| Issue Reporting | In-app keyboard shortcut | External form only | Auto from errors | Modal + keyboard shortcut (DIRECTOR/TEAM_LEADER only) |
| Screenshot | Browser extension required | Manual attachment | Auto-capture on error | Native browser API (no extension) |
| GitHub Integration | Deep integration (sync state) | Basic linking | Create issue action | Create + track lifecycle |
| Error Tracking | Not native (integrations) | Not native | Core feature | Leverage existing Sentry + extend |
| Pipeline Visualization | Native (Linear Cycles) | Plugin required | Not available | GitHub Actions status + custom dashboard |
| Branch Auto-Create | Yes (from issue) | Via Bitbucket only | No | Yes (from issue, naming convention) |
| Rollback | Manual | Manual | Not applicable | Auto-rollback on failed health checks |

**Our Differentiation:**
- Tight integration with existing app (RBAC, audit logs, Sentry)
- No external tools required for basic workflow
- Auto-rollback for safety (unique to error tracking → deployment pipeline integration)

## Implementation Notes

### Screenshot Capture Workflow

**Pattern (2026 Standard):**
1. User clicks "Report Issue" → Modal opens
2. Modal offers "Capture Screenshot" button
3. Browser native `MediaDevices.getDisplayMedia()` API captures viewport
4. Canvas rendering via `html2canvas` as fallback for older browsers
5. Optional: Annotation tools (arrows, text, blur) before submit

**Libraries to Consider:**
- `html2canvas` (9.1k stars) — Mature, stable screenshot capture
- `AnnotationCanvas` or `djaodjin-annotate` — Lightweight annotation

**Reference:** [12 Best Chrome Screenshot Extensions 2026](https://cocoshot.net/blog/posts/best-chrome-screenshot-extensions-2026/)

### GitHub Issue Creation (Image Upload Workaround)

**Challenge:** GitHub API does not support direct image upload to issues.

**Workaround Pattern (2026 Standard):**
1. Upload screenshot to MinIO (existing infrastructure)
2. Generate public URL or presigned URL
3. Embed image URL in issue body via Markdown: `![Screenshot](url)`
4. **Alternative:** Base64 encode small images (< 100KB) inline in issue body

**References:**
- [GitHub API Image Upload Discussion](https://github.com/orgs/community/discussions/28219)
- [Adding PNG to GitHub Issue (n8n)](https://community.n8n.io/t/adding-a-png-to-github-issue/91644)

### Branch Naming Convention

**2026 Standard:**
- Bug fixes: `fix/issue-{number}-{short-description}`
- Features: `feat/issue-{number}-{short-description}`
- Chores: `chore/issue-{number}-{short-description}`

**Examples:**
- `fix/issue-123-login-session-timeout`
- `feat/issue-456-student-bulk-import`

**Rationale:**
- Issue number enables auto-linking (GitHub recognizes `#123` in commits/PRs)
- Type prefix aligns with conventional commits
- Short description aids human readability

**References:**
- [Git Branch Naming Conventions 2025 Guide](https://medium.com/@jaychu259/git-branch-naming-conventions-2025-the-ultimate-guide-for-developers-5f8e0b3bb9f7)
- [Best Practices for Git Branches](https://graphite.com/guides/git-branch-naming-conventions)

### Error Deduplication Strategy

**Fingerprinting (Simple Approach for v1):**
```typescript
function errorFingerprint(error: Error): string {
  const stack = error.stack || '';
  const firstFrame = stack.split('\n')[1] || ''; // First stack frame
  return crypto.createHash('sha256')
    .update(`${error.message}:${firstFrame}`)
    .digest('hex');
}
```

**Rate Limiting:**
- Per fingerprint: Max 1 issue per hour
- Store in Redis: `error:fingerprint:{hash}` with 1h TTL

**Advanced (v2+):**
- Similarity scoring (Levenshtein distance on stack traces)
- Group similar errors into single issue

**References:**
- [Error Deduplication Best Practices](https://us.fitgap.com/stack-guides/prevent-duplicate-defects-and-conflicting-rework-with-deduplication-and-ownership-rules)
- [Why Deduplication Is Underrated Security Control](https://securityboulevard.com/2026/02/why-deduplication-is-the-most-underrated-security-control/)

### CI/CD Pipeline Visualization

**GitHub Actions Status Tracking:**
- Listen for `workflow_run`, `deployment_status` webhooks
- Store status in DB: `IssueLifecycle` model with states:
  - `registered` → `branch_created` → `pr_opened` → `checks_running` → `checks_passed` → `merged` → `deploying` → `deployed` / `failed`

**Dashboard Components:**
- Status badge (Recharts or custom CSS badges)
- Timeline visualization (horizontal timeline with milestones)
- Health indicators (last deployment status, success rate)

**References:**
- [CI/CD Pipeline Monitoring Best Practices](https://www.splunk.com/en_us/blog/learn/monitoring-ci-cd.html)
- [CI/CD Observability Guide](https://squaredup.com/blog/ci-cd-pipeline-observability/)
- [Datadog CI/CD Monitoring](https://www.datadoghq.com/blog/best-practices-for-ci-cd-monitoring/)

### Auto-Rollback Implementation

**Health Check Approach:**
```yaml
# .github/workflows/deploy.yml
- name: Deploy
  run: docker compose up -d

- name: Health Check
  run: |
    for i in {1..30}; do
      if curl -f http://localhost:3001/api/health; then
        exit 0
      fi
      sleep 2
    done
    exit 1

- name: Rollback on Failure
  if: failure()
  run: |
    docker compose down
    git checkout HEAD~1 # Revert to previous commit
    docker compose up -d
```

**Considerations:**
- Define health check criteria (DB connectivity, API responsiveness)
- Notify on rollback (Slack, GitHub issue comment)
- Limit rollback depth (max 1 rollback to prevent rollback loops)

**References:**
- [GitHub Actions Rollback Strategies](https://www.aviator.co/blog/managing-rollbacks-with-github-actions-and-heroku/)
- [Automated Rollback Implementation](https://jkrsp.com/deploy-and-rollback-releases-with-github-actions/)

### Issue Lifecycle Tracking Schema

**Database Extension (Prisma):**
```prisma
model Issue {
  id          String   @id @default(cuid())
  title       String
  description String
  type        IssueType // BUG, FEATURE, QUESTION
  status      IssueStatus
  screenshotUrl String?
  githubIssueNumber Int?
  githubIssueUrl    String?
  branchName  String?
  prNumber    Int?
  prUrl       String?
  reportedBy  String
  reportedAt  DateTime @default(now())

  // Lifecycle timestamps
  branchCreatedAt DateTime?
  prOpenedAt      DateTime?
  mergedAt        DateTime?
  deployedAt      DateTime?

  // Relations
  team        Team     @relation(fields: [teamId], references: [id])
  teamId      String
}

enum IssueType {
  BUG
  FEATURE
  QUESTION
}

enum IssueStatus {
  REGISTERED
  BRANCH_CREATED
  IN_PROGRESS
  PR_OPENED
  CHECKS_RUNNING
  CHECKS_PASSED
  MERGED
  DEPLOYING
  DEPLOYED
  FAILED
  CLOSED
}
```

## Sources

**In-App Issue Reporting & Screenshot Capture:**
- [Visual Bug Reporting Benefits](https://aqua-cloud.io/screenshots-video-capture-qa/)
- [Screenshot UX Design Inspiration 2026](https://www.designmonks.co/blog/screenshot-ux-design-inspiration)
- [Bird Eats Bug - Screen Recording](https://birdeatsbug.com/feature/screen-recording-screenshots)

**GitHub Integration:**
- [GitHub Issue Image Upload Discussion](https://github.com/orgs/community/discussions/28219)
- [GitHub Issue Templates Best Practices](https://namastedev.com/blog/using-github-issue-templates-and-labels-for-effective-project-management/)
- [Auto-Label Issues Action](https://github.com/marketplace/actions/auto-label)

**Branch Naming & Automation:**
- [Git Branch Naming Conventions 2025](https://medium.com/@jaychu259/git-branch-naming-conventions-2025-the-ultimate-guide-for-developers-5f8e0b3bb9f7)
- [GitLab Branches Documentation](https://docs.gitlab.com/user/project/repository/branches/)
- [Best Practices for Git Branches](https://graphite.com/guides/git-branch-naming-conventions)

**Error Tracking & Deduplication:**
- [Error Deduplication Best Practices](https://us.fitgap.com/stack-guides/prevent-duplicate-defects-and-conflicting-rework-with-deduplication-and-ownership-rules)
- [Sentry Error Tracking](https://sentry.io/)
- [Automated Sentry Error Analysis](https://docs.continue.dev/guides/sentry-mcp-error-monitoring)

**CI/CD Pipeline Visualization:**
- [CI/CD Monitoring Guide (Splunk)](https://www.splunk.com/en_us/blog/learn/monitoring-ci-cd.html)
- [CI/CD Observability (SquaredUp)](https://squaredup.com/blog/ci-cd-pipeline-observability/)
- [Datadog CI/CD Best Practices](https://www.datadoghq.com/blog/best-practices-for-ci-cd-monitoring/)

**Rollback Strategies:**
- [Managing Rollbacks with GitHub Actions](https://www.aviator.co/blog/managing-rollbacks-with-github-actions-and-heroku/)
- [Release Process with Docker Rollback](https://medium.com/@ignatovich.dm/implementing-a-release-process-with-github-actions-for-docker-image-management-and-rollback-9e385bb7c99a)

**JavaScript Libraries:**
- [html2canvas - Screenshots with JavaScript](https://html2canvas.hertzen.com/)
- [AnnotationCanvas - Drawing on Images](https://github.com/r0ssing/AnnotationCanvas)
- [djaodjin-annotate - jQuery Screenshot Plugin](https://github.com/djaodjin/djaodjin-annotate)

---
*Feature research for: Issue Management & Auto DevOps Pipeline*
*Researched: 2026-02-11*
*Confidence: HIGH (verified via official docs, current tools, 2026 best practices)*
