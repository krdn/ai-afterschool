# Domain Pitfalls: 학원 학생 관리 시스템 with AI 성향 분석

**Domain:** Educational After-School Management System with AI Personality Analysis
**Researched:** 2026-01-27
**Confidence:** HIGH

## Critical Pitfalls

Mistakes that cause rewrites, legal issues, or major system failures.

---

### Pitfall 1: 개인정보보호법 위반 (Korean Personal Information Protection Act Violations)

**What goes wrong:** Student data collection, storage, or sharing without proper consent mechanisms leads to severe legal penalties.

**Why it happens:**
- Developers focus on functionality without understanding Korean privacy law specifics
- Copying GDPR/FERPA patterns without adapting to Korean requirements
- Not implementing proper parental consent for students under 14

**Consequences:**
- Imprisonment up to 3 years or fines up to 30 million KRW for unauthorized data sharing
- School rejection of the system due to compliance concerns
- Complete system redesign to meet legal requirements

**Prevention:**
1. **Identity Verification**: Implement mobile phone authentication for parent/legal guardian verification before allowing access to student data
2. **Minimal Collection**: Only collect absolutely necessary personal information (법정 최소 수집 원칙)
3. **Parental Consent**: Require explicit consent for students under 14 before any data collection
4. **Data Processing Agreement**: Establish clear DPA (Data Processing Agreement) with schools as required by Article 26
5. **Audit Trail**: Log all access to student data with timestamp, user, and purpose
6. **Retention Policy**: Automatically delete data after legal retention period (typically 5 years for educational records)

**Detection:**
- Legal review of data collection forms shows missing consent language
- No separate consent flow for underage students
- Student data accessible without proper authentication
- Missing data retention/deletion policies

**Phase to address:** Phase 1 (Foundation/Authentication) - MUST be part of initial architecture

**Sources:**
- [한국 개인정보보호법 교육 분야](https://easylaw.go.kr/CSP/CnpClsMainBtr.laf?popMenu=ov&csmSeq=1702&ccfNo=4&cciNo=1&cnpClsNo=1)
- [Student Data Privacy Governance](https://secureprivacy.ai/blog/student-data-privacy-governance)

---

### Pitfall 2: 사주/성명학 계산 정확도 문제 (Astronomical Calculation Inaccuracy)

**What goes wrong:** Saju (사주팔자) and naming analysis produce incorrect results due to improper astronomical calculations, destroying user trust.

**Why it happens:**
- Using standard timezone without solar time conversion
- Ignoring historical daylight saving time (1948-1988 in Korea)
- Missing exact solar term (절기) calculations down to the minute
- Using simplified algorithms instead of proper 만세력 (Manselyeok) data

**Consequences:**
- Completely wrong personality analysis
- Parents/students lose faith in the entire system
- Reputation damage spreads through word-of-mouth in academy communities
- Cannot compete with established saju software

**Prevention:**
1. **Solar Time Conversion**: Convert Korea Standard Time (KST, 135°E) to solar time based on birth location longitude (e.g., Seoul at 127°E requires ~30 minute subtraction)
2. **Historical DST**: Account for 12 periods of daylight saving time in Korea (1948-1988)
3. **Precise Solar Terms**: Calculate 24 solar terms (24절기) with minute-level precision, not just date approximations
4. **200-Year Manselyeok Data**: Use comprehensive stem-branch (천간지지) data tables, not algorithmic approximations
5. **Birth Time Edge Cases**: Handle births near midnight, solar term boundaries, and timezone changes with explicit warnings to users
6. **Validation Against Established Software**: Compare results with established saju programs (e.g., 만세력닷컴, 사주카페) before launch

**Detection:**
- Test with known birth dates from established saju software
- Results differ from professional saju readings
- No handling for historical DST periods
- Using datetime libraries without solar time conversion
- Missing solar term boundary condition handling

**Phase to address:** Phase 2 (Saju/Naming Core) - Requires dedicated research and testing phase

**Sources:**
- [ChatGPT 사주 정확도 문제](https://brunch.co.kr/@chatgptsaju/13)
- [사주팔자 계산 원리](https://namu.wiki/w/%EC%82%AC%EC%A3%BC%ED%8C%94%EC%9E%90)

---

### Pitfall 3: 관상/손금 AI 모델의 낮은 신뢰도 (Low Reliability of Facial/Palm Reading AI)

**What goes wrong:** AI models for 관상 (physiognomy) and 손금 (palmistry) produce inconsistent or obviously wrong results, damaging credibility.

**Why it happens:**
- Image quality dependency (lighting, angle, resolution)
- No scientific validation baseline (unlike biometric facial recognition)
- Training data bias and insufficient diverse samples
- Treating subjective traditional practices as objective classification problems

**Consequences:**
- Users get different readings from slightly different photos
- Obviously incorrect readings (e.g., saying young student looks elderly)
- System appears as gimmick rather than serious analysis tool
- Legal/ethical concerns about appearance-based judgments

**Prevention:**
1. **Image Quality Gating**: Reject photos below quality threshold (resolution, lighting, clarity) with specific guidance
2. **Consistency Testing**: Same photo should produce same result within 95% confidence interval
3. **Confidence Scoring**: Display confidence levels and refuse to analyze when <70%
4. **Multiple Reading Requirement**: Require 2-3 photos taken at different times for consistency check
5. **Disclaimer Prominent**: Clear language that this is "entertainment/traditional interpretation" not scientific assessment
6. **Human Review Option**: Allow manual override by system administrator for edge cases
7. **Separate from Core Features**: Keep facial/palm analysis as optional supplement, not core personality assessment

**Detection:**
- Same photo produces different results on repeated analysis
- Accepts clearly unusable photos (dark, blurry, partial face)
- No confidence scores displayed to users
- Analysis works on obviously inappropriate images (animals, cartoons)

**Phase to address:** Phase 4-5 (Image Analysis Features) - Build after core system proven, with extensive testing

**Sources:**
- [AI Palm Reading Accuracy Issues](https://astrobotlab.com/is-online-palm-reading-accurate-what-ai-can-and-cant-do/)
- [Palmistry Machine Learning Research](https://arxiv.org/html/2509.02248v1)

---

### Pitfall 4: Next.js 인증/인가 취약점 (Authentication/Authorization Bypass)

**What goes wrong:** Critical security vulnerabilities allow unauthorized access to student data through authentication bypass.

**Why it happens:**
- Relying solely on middleware for security (CVE-2025-29927)
- Confusing authentication with authorization
- Client-side only security checks
- Over-scoped tokens containing unnecessary data
- Predictable session tokens or header manipulation

**Consequences:**
- Unauthorized access to student personal information
- Data breach with legal consequences (개인정보보호법 violation)
- Complete loss of trust from schools and parents
- Potential system shutdown by authorities

**Prevention:**
1. **Defense in Depth**: NEVER rely only on middleware - implement verification at every data access point (page component, API route, server action)
2. **Server-Side Authorization**: All Server Actions must perform their own authorization checks, not rely on client UI restrictions
3. **Minimal Token Claims**: Include only necessary claims (user ID, role) not full profiles or sensitive data
4. **Established Auth Library**: Use proven libraries (NextAuth.js/Auth.js, Clerk) rather than custom implementation
5. **Role-Based Access Control**: Implement consistent RBAC pattern across all components
6. **Session Security**: Use httpOnly cookies, secure flags, SameSite=strict
7. **Header Validation**: Validate and sanitize all request headers, especially internal ones like x-middleware-subrequest

**Detection:**
- Security scan shows CVE-2025-29927 vulnerability
- Server Actions callable without proper authorization
- Session tokens visible in client-side JavaScript
- Authorization logic only in middleware
- API routes accessible without authentication

**Phase to address:** Phase 1 (Foundation) - Authentication MUST be secure from day one

**Sources:**
- [Next.js Authorization Bypass CVE-2025-29927](https://www.akamai.com/blog/security-research/march-authorization-bypass-critical-nextjs-detections-mitigations)
- [Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)

---

### Pitfall 5: MBTI 검사 결과의 재현성 부족 (MBTI Test Reliability Issues)

**What goes wrong:** Students get different MBTI results when retaking test, undermining credibility of entire personality analysis system.

**Why it happens:**
- Using non-validated questions or simplified tests
- Poor question design with ambiguous language
- No test-retest reliability validation
- Treating MBTI as definitive psychological assessment

**Consequences:**
- Students confused by inconsistent results
- Parents question value of the system
- Teachers cannot rely on analysis for guidance
- System appears unprofessional compared to established MBTI platforms

**Prevention:**
1. **Validated Question Set**: Use established MBTI question sets with proven reliability (>0.80), not self-created questions
2. **Sufficient Questions**: Minimum 60-93 questions for reliable results (official MBTI standard)
3. **Test-Retest Validation**: Before launch, conduct reliability testing with same users 2-4 weeks apart
4. **Preference Clarity Scoring**: Show preference clarity percentage (e.g., 65% Extraversion) not just binary type
5. **Borderline Warnings**: Flag results where preferences are <60% clear as "borderline" requiring retesting
6. **Contextual Disclaimers**: State that MBTI is "preference indicator for self-reflection" not "definitive psychological assessment"
7. **No High-Stakes Use**: Explicitly prohibit using MBTI results alone for major educational decisions

**Detection:**
- Users report different results on retest
- Questions are vague or double-barreled
- No preference strength indicators shown
- All results show high confidence regardless of response patterns
- Marketing materials claim MBTI predicts academic success

**Phase to address:** Phase 3 (MBTI Integration) - Requires psychological validation before implementation

**Sources:**
- [MBTI Reliability Research](https://www.scienceofpeople.com/myers-briggs-valid/)
- [MBTI Validity Concerns](https://careerassessmentsite.com/myers-briggs-type-indicator/mbti-assessment/reliability-validity/)

---

## Moderate Pitfalls

Mistakes that cause delays, technical debt, or degraded user experience.

---

### Pitfall 6: Docker Next.js 배포 시 환경변수 누락 (Environment Variable Configuration Errors)

**What goes wrong:** Application deployed via Docker cannot access required environment variables, causing runtime failures or exposing secrets.

**Why it happens:**
- Setting environment variables after Docker image is built (too late)
- Not passing build-time arguments to Dockerfile
- Hardcoding secrets in Docker images
- Confusing build-time vs runtime environment variables

**Consequences:**
- Application crashes on startup in production
- API keys exposed in Docker image layers
- Unable to connect to databases or external services
- Different behavior between development and production

**Prevention:**
1. **ARG + ENV Pattern**: Accept variables as build arguments (`ARG NEXT_PUBLIC_API_URL`) then set as ENV
2. **Separate Secret Management**: Never bake secrets into images; use Docker secrets or external secret managers
3. **Build-time vs Runtime Clarity**: Document which vars are needed at build time (NEXT_PUBLIC_*) vs runtime (private keys)
4. **Example .env.example File**: Provide template showing all required variables
5. **Startup Validation**: Check for required environment variables on app startup and fail fast with clear error messages

**Detection:**
- Application starts but shows "undefined" for configuration values
- Different database connections in dev vs prod
- Secrets visible in `docker history` output
- Rebuilding image required for environment changes that should be runtime-configurable

**Phase to address:** Phase 1 (Infrastructure Setup) - Critical for deployment pipeline

**Sources:**
- [Next.js Docker Environment Variables Guide](https://medium.com/@mindelias/how-to-deploy-next-js-to-azure-app-service-with-docker-a-complete-guide-to-environment-variables-1aa19d85000a)
- [Top Next.js Deployment Mistakes](https://dev.to/kuberns_cloud/top-mistakes-when-deploying-nextjs-apps-170f)

---

### Pitfall 7: ML 모델 프로덕션 배포 시 데이터 드리프트 (Data Drift in Production ML Models)

**What goes wrong:** AI personality analysis models trained on one dataset produce poor results in production due to data distribution changes.

**Why it happens:**
- Training on demo data that doesn't match real student photos
- Seasonal patterns in student appearance (summer tan, winter pale)
- Camera quality differences between training and production
- No monitoring for input data distribution changes

**Consequences:**
- Accuracy drops silently over time
- Model confidence scores become unreliable
- Need to retrain models frequently without clear triggers
- User complaints about "AI getting worse"

**Prevention:**
1. **Input Monitoring**: Log input data distributions (image brightness, contrast, face angles) and alert on significant drift
2. **Confidence Calibration**: Regularly recalibrate confidence thresholds against manual validation set
3. **A/B Testing New Models**: Deploy new models to 10% traffic first, compare metrics before full rollout
4. **Fallback Logic**: When confidence drops below threshold, route to human review or refuse analysis
5. **Retraining Pipeline**: Automated pipeline to retrain models quarterly with production data samples
6. **Feature Store**: Version all features and log which version was used for each prediction

**Detection:**
- Model accuracy metrics declining over time
- Confidence scores all clustered at extremes (0-10% or 90-100%)
- User feedback reports inconsistent with model predictions
- Input data statistics significantly different from training set

**Phase to address:** Phase 5 (ML Model Deployment) - Build monitoring from day one of ML features

**Sources:**
- [Silent ML Production Failures](https://medium.com/codetodeploy/the-silent-mistakes-that-make-your-ml-models-fail-in-production-4fe348acfa6c)
- [ML Deployment Challenges](https://towardsdatascience.com/the-ultimate-guide-challenges-of-machine-learning-model-deployment-e81b2f6bd83b/)

---

### Pitfall 8: 대용량 PDF 리포트 생성 병목 (PDF Report Generation Bottlenecks)

**What goes wrong:** Generating detailed student reports blocks web requests, causing timeouts and poor user experience.

**Why it happens:**
- Synchronous PDF generation in HTTP request handler
- HTML-to-PDF conversion consuming excessive memory
- Complex templates with many images and charts
- No caching of commonly requested reports

**Consequences:**
- Request timeouts (>30 seconds) when generating reports
- Server memory exhaustion with concurrent report requests
- Poor UX where users wait indefinitely for download
- Cannot scale beyond 10-20 simultaneous users

**Prevention:**
1. **Asynchronous Generation**: Use job queue (Bull/BullMQ) for PDF generation, return immediately with job ID
2. **Progress Notifications**: WebSocket or polling endpoint to show "Report generating... 60% complete"
3. **Caching Strategy**: Cache generated PDFs for 24 hours if report data hasn't changed
4. **Chunked Processing**: Generate report sections in parallel, then combine
5. **Resource Limits**: Limit concurrent PDF jobs (max 5) with queue management
6. **Background Workers**: Separate worker processes for PDF generation, not main web server
7. **Pre-generation**: For standard reports, generate overnight and store in object storage

**Detection:**
- Request timeouts when downloading reports
- Server memory spikes during report generation
- Users report "page hanging" when clicking report button
- Cannot handle more than 5-10 concurrent report requests

**Phase to address:** Phase 6 (Reporting Features) - Design asynchronously from start

**Sources:**
- [PDF Generation Pitfalls](https://reportgen.io/blog/common-pitfalls)
- [Report Automation Best Practices](https://blog.coupler.io/report-automation/)

---

### Pitfall 9: 성명학 계산 시 한자 인코딩 문제 (Hanja Character Encoding Issues)

**What goes wrong:** Korean names with Hanja (한자) characters display incorrectly or fail to calculate stroke counts for 성명학 analysis.

**Why it happens:**
- Using wrong character encoding (CP949 instead of UTF-8)
- Not handling Hanja variants (異體字)
- Simplified vs Traditional Chinese character confusion
- Missing Hanja-to-stroke-count database

**Consequences:**
- Wrong 획수 (stroke count) calculations leading to incorrect 성명학 results
- Name characters showing as ? or garbled text
- Cannot analyze names written in Hanja
- Users lose trust when seeing encoding errors

**Prevention:**
1. **UTF-8 Everywhere**: Ensure database, application, and API all use UTF-8 encoding
2. **Hanja Dictionary**: Integrate comprehensive Hanja-to-stroke database (e.g., Unihan database)
3. **Variant Handling**: Support multiple Hanja variants for same pronunciation (異體字 처리)
4. **Input Validation**: Validate Hanja characters are in supported Unicode range (U+4E00 to U+9FFF)
5. **Fallback to Hangul**: When Hanja not provided, allow Hangul input with manual stroke count specification
6. **Traditional vs Simplified**: Clearly document which character set is used for stroke counting

**Detection:**
- Name display shows � or ??? characters
- Stroke counts obviously wrong (e.g., 金 shown as 5 strokes instead of 8)
- Cannot save names with Hanja characters
- Different results for same name entered in Hanja vs Hangul

**Phase to address:** Phase 2 (Naming System) - Essential for Korean naming analysis

**Sources:**
- [성명학 작명 소프트웨어](https://www.juyeok.com/juyeok/juyeok_name.php3)
- Korean character encoding best practices (general knowledge)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable without major rewrites.

---

### Pitfall 10: 50-200명 규모 최적화 과잉 (Premature Optimization for Scale)

**What goes wrong:** Over-engineering infrastructure for massive scale when serving only 50-200 students.

**Why it happens:**
- Following enterprise patterns from large-scale examples
- Premature microservices architecture
- Complex caching layers for data that rarely changes
- Over-provisioned database with expensive features

**Consequences:**
- High infrastructure costs for minimal traffic
- Increased complexity making features slower to build
- Developer time spent on optimization instead of features
- Still poor performance because real bottlenecks are elsewhere

**Prevention:**
1. **Start Simple**: Single Next.js app with PostgreSQL is sufficient for 200 users
2. **Measure First**: Use Application Performance Monitoring (APM) to identify actual bottlenecks
3. **200ms Response Time Goal**: Optimize only when response times exceed 200ms
4. **Connection Pooling Sufficient**: For 200 users, connection pooling (PgBouncer) handles DB load well
5. **Selective Caching**: Cache only expensive operations (사주 calculations, PDF generation), not CRUD operations
6. **Vertical Scaling First**: Upgrade server size before adding complexity

**Detection:**
- Infrastructure more complex than application features justify
- Caching layers with <10% hit rate
- Microservices for application that fits in single process
- Database running at <5% CPU utilization

**Phase to address:** All phases - Resist complexity temptation throughout

**Sources:**
- [PostgreSQL Performance 2026](https://medium.com/@DevBoostLab/postgresql-17-performance-upgrade-2026-f4222e71f577)
- [Software Performance Optimization](https://sedai.io/blog/software-performance-optimization-expert-guide)

---

### Pitfall 11: Docker 개발 환경의 HMR 성능 저하 (Docker Dev Environment Performance Issues)

**What goes wrong:** Hot Module Replacement (HMR) takes minutes instead of seconds in Docker development environment.

**Why it happens:**
- File system performance overhead on Mac/Windows Docker
- Volume mounting latency between host and container
- Node modules installed inside container instead of volume
- Watching too many files for changes

**Consequences:**
- Developer productivity plummets
- Frustration with slow feedback loop
- Developers avoid running system locally
- Bugs not caught until CI/deployment

**Prevention:**
1. **Local Development Without Docker**: Use Docker only for production builds, not development
2. **If Must Use Docker**: Use delegated volume mounts on Mac/Windows (`delegated` or `cached` options)
3. **Exclude node_modules**: Don't mount node_modules, use named volume instead
4. **Limit Watch Scope**: Configure Next.js to watch only `src/` directories, not all files
5. **Use Host Node**: Run Next.js on host machine, only containerize databases/services

**Detection:**
- HMR taking >5 seconds to reflect changes
- File save triggering multiple rebuilds
- Docker CPU usage high even when idle
- Developers complaining about slow local environment

**Phase to address:** Phase 1 (Development Setup) - Establish pattern early

**Sources:**
- [Docker Next.js Best Practices](https://forums.docker.com/t/best-practices-for-using-docker-in-development-vs-production-nestjs-nextjs-monorepo/149461)
- [Next.js Docker Performance](https://github.com/vercel/next.js/discussions/16995)

---

### Pitfall 12: AI 부정행위 탐지 실패 (Failure to Detect AI-Assisted Cheating)

**What goes wrong:** Students use ChatGPT or other AI tools to complete personality surveys/tests, invalidating results.

**Why it happens:**
- No detection mechanisms for AI-generated responses
- Surveys can be completed outside supervised environment
- Response patterns not analyzed for anomalies
- Time-to-complete not monitored

**Consequences:**
- Personality analysis based on fake responses
- Teachers making decisions on invalid data
- System credibility undermined
- Cannot distinguish genuine from AI-generated profiles

**Prevention:**
1. **Response Time Analysis**: Flag surveys completed too quickly (<2 seconds per question)
2. **Pattern Detection**: Flag overly consistent answer patterns (e.g., all moderate, no extremes)
3. **Attention Check Questions**: Include validation questions to detect random/automated responses
4. **Supervised Testing Option**: Allow teachers to require in-person, supervised survey completion
5. **Consistency Checks**: Ask similar questions in different forms and compare answers
6. **Behavioral Biometrics**: Track typing patterns, mouse movements (if ethically acceptable and disclosed)
7. **Clear Consequences**: State that AI-assisted responses invalidate analysis and will be detected

**Detection:**
- Response times impossibly fast (e.g., 200 questions in 3 minutes)
- All answers show perfect consistency or perfect neutrality
- Response patterns identical across multiple students
- Attention check questions failed

**Phase to address:** Phase 3 (Survey/Testing Features) - Build validation into assessment from start

**Sources:**
- [AI Academic Integrity Issues 2026](https://www.koreadaily.com/article/20260125215413997)
- [AI 부정행위 탐지 어려움](https://news.bbsi.co.kr/news/articleView.html?idxno=4060116)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Priority |
|-------------|---------------|------------|----------|
| Phase 1: Authentication | CVE-2025-29927 bypass vulnerability | Use auth library + defense in depth | CRITICAL |
| Phase 1: Data Model | 개인정보보호법 non-compliance | Legal review + minimal collection | CRITICAL |
| Phase 2: 사주 Calculation | Solar time conversion missing | Implement full astronomical calculation | HIGH |
| Phase 2: 성명학 System | Hanja encoding issues | UTF-8 + Unihan database | HIGH |
| Phase 3: MBTI Testing | Poor test-retest reliability | Use validated question sets | HIGH |
| Phase 3: Survey Design | AI cheating undetected | Response time + pattern analysis | MEDIUM |
| Phase 4: Image Upload | No quality validation | Implement quality gating | MEDIUM |
| Phase 5: 관상/손금 AI | Low accuracy/consistency | Confidence scoring + human review option | HIGH |
| Phase 5: ML Deployment | Data drift unmonitored | Build monitoring from day one | HIGH |
| Phase 6: PDF Reports | Synchronous generation blocking | Async job queue from start | MEDIUM |
| Infrastructure: Docker | Environment variable errors | ARG+ENV pattern + validation | MEDIUM |
| Infrastructure: Dev Environment | Slow HMR in Docker | Use local dev, Docker for prod only | LOW |
| All Phases | Premature optimization | Measure first, optimize actual bottlenecks | LOW |

---

## Research Methodology

**Sources Used:**
- WebSearch: 13 queries covering Korean legal requirements, AI failures, technical pitfalls
- Domains covered: Privacy law, astronomical calculations, ML deployment, authentication, performance optimization
- Confidence level: HIGH for technical/legal issues, MEDIUM for AI accuracy issues (limited production data available)

**Verification:**
- Korean legal requirements verified against official government sources (개인정보보호위원회)
- Technical vulnerabilities verified against CVE databases and recent 2025-2026 security disclosures
- ML pitfalls verified against academic sources (arxiv) and production engineering articles
- Next.js/Docker issues verified against official documentation and recent 2026 guides

**Gaps:**
- Limited public information on specific 학원 management system failures (market is primarily Korean, private sector)
- 관상/손금 AI accuracy data mostly anecdotal; scientific studies lacking (expected for pseudoscience)
- Long-term reliability data for MBTI in Korean educational context not found; relied on international research

**Confidence Assessment:**
- **Critical Pitfalls:** HIGH confidence (legal requirements, known CVEs, established research)
- **Moderate Pitfalls:** MEDIUM-HIGH confidence (production engineering best practices, documented patterns)
- **Minor Pitfalls:** MEDIUM confidence (based on development experience, some anecdotal)
