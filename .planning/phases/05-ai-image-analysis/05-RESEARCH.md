# Phase 5: AI Image Analysis - Research

**Research Date:** 2026-01-29
**Researcher:** GSD Research Agent
**Domain:** AI Vision APIs, Image Processing, Traditional Korean Physiognomy
**Confidence:** HIGH

## Executive Summary

이번 연구는 AI 기반 관상 및 손금 분석 기능 구현을 위한 기술적 방안을 조사했습니다. **Claude Vision API (Anthropic)**를 주요 AI 서비스로 추천하며, 이미지 품질 검증을 위한 **face-api.js**와 **Sharp** 라이브리 사용을 권장합니다. Next.js 15의 **Server Actions**와 **`after()` API**를 활용하여 비동기 AI 분석을 처리하고, **Vercel AI SDK**로 스트리밍 응답을 구현하는 아키텍처를 제안합니다. 모든 AI 분석 결과는 "전통 해석 참고용 엔터테인먼트" 면책 조항과 함께 표시되어야 합니다.

**Primary Recommendation:** Claude Vision API (Sonnet 4.5) + face-api.js for validation + Next.js 15 Server Actions with streaming UI

## 1. AI Vision Service Recommendation

### Recommended: Claude Vision API (Anthropic)

**Why Claude Vision:**
- **Natural Korean Language Support**: Claude는 한글 해석에 뛰어난 성능을 발휘
- **Cost Effective**: Sonnet 4.5 기준 $3/M input tokens, 이미지 분석 1회당 약 $0.0045 (1,500 tokens 기준)
- **High Accuracy**: 전통 관상/손금 해석에 필요한 세밀한 이미지 분석 가능
- **Easy Integration**: REST API, TypeScript SDK 지원
- **Vision-First Design**: 이미지 분석에 최적화된 모델

**Pricing (2026):**
| Model | Input | Output |
|-------|-------|--------|
| Claude Sonnet 4.5 | $3.00 / 1M tokens | $15.00 / 1M tokens |
| Claude Haiku 4.5 | $1.00 / 1M tokens | $5.00 / 1M tokens |

**Estimated Cost:**
- 이미지 분석 1회: 약 $0.003~$0.01 (이미지 크기에 따라)
- 월 1,000회 분석: 약 $3~10
- 월 10,000회 분석: 약 $30~100

### Alternatives Considered

| Service | Pros | Cons | When to Use |
|---------|------|------|-------------|
| **OpenAI GPT-4 Vision** | Well-documented, widely adopted | Similar pricing, less optimized for Korean | If Claude unavailable |
| **Google Cloud Vision API** | Excellent face detection | No traditional physiognomy interpretation, separate AI needed | For face detection only |
| **Google Cloud Vision + GPT-4** | Best of both worlds | Complex integration, higher cost | If specialized features needed |

### Integration Approach

```typescript
// Recommended: Anthropic SDK
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

// Face reading analysis
const faceAnalysis = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64Image
        }
      },
      {
        type: 'text',
        text: 'Analyze this face for traditional Korean physiognomy...'
      }
    ]
  }]
})
```

**Installation:**
```bash
npm install @anthropic-ai/sdk
```

## 2. Image Quality Validation Strategy

### Two-Stage Validation Approach

**Stage 1: Client-Side Validation (Browser)**
- **face-api.js**: 얼굴 검출 및 기본 품질 확인
- **Sharp (Server-side)**: 흐림 정도(blur), 밝기, 대비 검사

**Stage 2: AI Validation**
- Claude Vision API로 최종 품질 확인
- 분석 가능 여부 판단 후 재업로드 요청

### Validation Libraries

#### 1. face-api.js (Face Detection)

**Why face-api.js:**
- TensorFlow.js 기반, 브라우저/Node.js 모두 지원
- 얼굴 검출, 랜드마크 추출, 표정 인식 가능
- 2026년 1월 최신 가이드 존재

**Use Cases:**
- 얼굴이 사진에 있는지 확인
- 얼굴 각도 적절성 확인 (정면 views)
- 얼굴 크기 확인 (너무 작으면 재촬영)

**Installation:**
```bash
npm install face-api.js
```

**Example:**
```typescript
import * as faceapi from 'face-api.js'

// Load models (do once at app startup)
await faceapi.nets.tinyFaceDetector.loadFromUri('/models')

// Detect face
const detections = await faceapi
  .detectAllFaces(image, new faceapi.TinyFaceDetectorOptions())
  .withFaceLandmarks()

if (detections.length === 0) {
  throw new Error('얼굴을 찾을 수 없습니다. 정면 얼굴 사진을 업로드해주세요.')
}

if (detections.length > 1) {
  throw new Error('사진에 여러 얼굴이 있습니다. 한 명의 얼굴 사진만 업로드해주세요.')
}
```

#### 2. Sharp (Image Quality Check)

**Why Sharp:**
- 이미 프로젝트에 설치됨 (package.json 확인)
- 고성능 이미지 처리
- 흐림 감지를 위한 edge detection 가능

**Blur Detection Implementation:**
```typescript
import sharp from 'sharp'

async function detectBlur(imageBuffer: Buffer): Promise<boolean> {
  const { data } = await sharp(imageBuffer)
    .greyscale()
    .resize(300, 300, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Calculate edge detection using Laplacian variance
  // Simplified approach - check frequency content
  let totalVariance = 0
  for (let i = 300; i < data.length - 300; i++) {
    const diff = Math.abs(data[i] - data[i - 1])
    totalVariance += diff
  }

  const avgVariance = totalVariance / (data.length - 300)
  // Threshold needs tuning based on testing
  return avgVariance < 10 // Too blurry
}
```

#### 3. Hand/Palm Detection Options

**Option A: MediaPipe Hands (Google)** - RECOMMENDED
- 오픈소스, 생산 준비 완료
- 21개 손 랜드마크 추적
- 실시간 처리 가능

**Option B: Roboflow Palm Detection API**
- 사전 훈련된 모델
- 쉬운 API 통합
- 유료지만 빠른 구현

**Option C: AI-based Detection (Claude Vision)**
- 별도 라이브러리 없이 Claude로 직접 검출
- 정확하지만 비용 발생

**Recommendation:** Claude Vision API로 직접 손바닥 검출 및 분석 수행 (간단함)

### Validation Flow

```typescript
async function validateImage(
  imageBuffer: Buffer,
  type: 'face' | 'palm'
): Promise<{ valid: boolean; reason?: string }> {
  // Stage 1: Sharp blur check
  const isBlurry = await detectBlur(imageBuffer)
  if (isBlurry) {
    return { valid: false, reason: '이미지가 너무 흐릿합니다. 다시 촬영해주세요.' }
  }

  // Stage 2: Face/Hand detection
  if (type === 'face') {
    const hasFace = await checkFaceDetection(imageBuffer)
    if (!hasFace) {
      return { valid: false, reason: '얼굴을 찾을 수 없습니다. 정면 얼굴 사진을 업로드해주세요.' }
    }
  }

  // Stage 3: AI quality check (optional, during analysis)
  // Claude will assess if image is suitable for analysis

  return { valid: true }
}
```

## 3. Face Reading Analysis Features

### Traditional Korean Physiognomy (관상) Elements

**Key Features to Extract:**

#### Face Structure (얼굴형)
- 계란형 (Oval)
- 둥근형 (Round)
- 각진형 (Square)
- 긴형 (Oblong)

#### Facial Features (이목구비)
- **눈 (Eyes)**: 크기, 모양, 눈꼬리 방향
- **코 (Nose)**: 높이, 모양, 콧볼 너비
- **입 (Mouth)**: 크기, 입술 두께
- **귀 (Ears)**: 크기, 위치
- **이마 (Forehead)**: 넓이, 높이
- **턱 (Chin)**: 모양, 각도

#### Facial Zones (관상학적 구역)
- **남녀궁**: 아래 눈꺼풀
- **처첩궁**: 눈꼬리
- **관록궁**: 이마 중앙
- **복사궁**: 미간

### AI Prompt Strategy

**Recommended Prompt Structure:**

```typescript
const FACE_READING_PROMPT = `
너는 한국 전통 관상학을 기반으로 얼굴을 분석하는 전문가야.

다음 지침을 따라 얼굴 사진을 분석해주세요:

1. **얼굴형 판정**: 계란형, 둥근형, 각진형, 긴형 중 분류
2. **이목구비 분석**: 눈, 코, 입, 귀, 이마, 턱의 특징 상세히 묘사
3. **성격 특성**: 전통 관상학 기반 성격 특성 3-5개 추출
4. **운세 해석**: 학업, 진로, 인간관게 관련 운세 간단히 언급

**중요:**
- 과학적 근거가 없음을 명시
- 긍정적이고 격려하는 톤 유지
- 학생의 자존감 해칠만한 내용 제외
- "전통 해석 참고용"임을 강조

**출력 형식 (JSON):**
{
  "faceShape": "string",
  "features": {
    "eyes": "string",
    "nose": "string",
    "mouth": "string",
    "ears": "string",
    "forehead": "string",
    "chin": "string"
  },
  "personalityTraits": ["string"],
  "fortune": {
    "academic": "string",
    "career": "string",
    "relationships": "string"
  },
  "overallInterpretation": "string",
  "disclaimer": "전통 관상학에 기반한 참고용 해석입니다."
}
`
```

### Analysis Output Format

```typescript
interface FaceAnalysisResult {
  faceShape: 'oval' | 'round' | 'square' | 'oblong'
  features: {
    eyes: string      // e.g., "큰 눈, 부리한 눈꼬리"
    nose: string      // e.g., "오똑한 코, 적당한 콧볼"
    mouth: string     // e.g., "적당한 크기, 얇은 입술"
    ears: string      // e.g., "적당한 크기, 붙잡힌 귀"
    forehead: string  // e.g., "넓은 이마"
    chin: string      // e.g., "둥근 턱"
  }
  personalityTraits: string[]  // 3-5 traits
  fortune: {
    academic: string     // 학업 운세
    career: string       // 진로 운세
    relationships: string  // 인간관계 운세
  }
  overallInterpretation: string  // 종합 해석 (2-3 문장)
  disclaimer: string
  analyzedAt: string
  confidence: 'high' | 'medium' | 'low'
}
```

## 4. Palmistry Analysis Features

### Traditional Korean Palm Reading (손금) Elements

**Key Lines to Analyze:**

#### Major Lines (주요 손금)
- **생명선 (Life Line)**: 건강, 생명력, 에너지
  - 엄지 손가락 아래에서 손목 방향으로 뻗어감
  - 깊고 선명할수록 좋음

- **두뇌선 (Head Line/Brain Line)**: 지적 능력, 사고방식
  - 손바닥 가로지르는 선
  - 길고 곧을수록 지적능력 좋음

- **감정선 (Heart Line)**: 정서적 성향, 연애운
  - 손가락 아래에서 손바닥 가로질러 감
  - 깊고 명확할수록 감성 풍부

#### Minor Lines (부속 손금)
- **운명선 (Fate Line)**: 성공, 운, 성취도
  - 손바닥 중앙 세로 방향
  - 뚜렷할수록 강한 목적의식

- **결혼선 (Marriage Line)**: 연애, 결혼운
  - 새끼 손가락 아래 가로선
  - 여러 개일수록 다양한 만남

### AI Prompt Strategy

```typescript
const PALM_READING_PROMPT = `
너는 한국 전통 손금학을 기반으로 손바닥 사진을 분석하는 전문가야.

다음 지침을 따라 손바닥 사진을 분석해주세요:

1. **주요 손금 확인**: 생명선, 두뇌선, 감정선 식별 및 특징 묘사
2. **부속 손금 확인**: 운명선, 결혼선 등 있는지 확인
3. **선의 특징**: 길이, 깊이, 분기점, 끊어짐 등 관찰
4. **성격 및 운세**: 손금 기반 성격 특성 3-5개, 학업/진로 운세

**중요:**
- 손금이 불분명하면 "손금이 잘 보이지 않아 정확한 분석이 어렵습니다"라고 안내
- 과학적 근거 없음을 명시
- 긍정적이고 격려하는 톤 유지
- 학생의 자존감 해칠만한 내용 제외

**출력 형식 (JSON):**
{
  "linesDetected": {
    "lifeLine": "string (description)",
    "headLine": "string (description)",
    "heartLine": "string (description)",
    "fateLine": "string or null",
    "marriageLine": "string or null"
  },
  "personalityTraits": ["string"],
  "fortune": {
    "academic": "string",
    "career": "string",
    "talents": "string"
  },
  "overallInterpretation": "string",
  "clarity": "clear" | "unclear" | "partial",
  "disclaimer": "전통 손금학에 기반한 참고용 해석입니다."
}
`
```

### Analysis Output Format

```typescript
interface PalmAnalysisResult {
  hand: 'left' | 'right'  // Left: 감성/본성, Right: 현실/능력
  linesDetected: {
    lifeLine: string      // 생명선 묘사
    headLine: string      // 두뇌선 묘사
    heartLine: string     // 감정선 묘사
    fateLine?: string     // 운명선 (있으면)
    marriageLine?: string // 결혼선 (있으면)
  }
  personalityTraits: string[]  // 3-5 traits
  fortune: {
    academic: string     // 학업 적성
    career: string       // 진로 적성
    talents: string      // 특이사항/재능
  }
  overallInterpretation: string
  clarity: 'clear' | 'unclear' | 'partial'  // 손금 선명도
  disclaimer: string
  analyzedAt: string
  confidence: 'high' | 'medium' | 'low'
}
```

## 5. Technical Implementation Plan

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Image      │  │   Loading    │  │   Analysis   │  │
│  │   Upload     │  │   State      │  │   Display    │  │
│  │   UI         │  │   (Skeleton) │  │   Panel      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Next.js 15 Server Actions                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. validateImage() - Sharp + face-api.js        │  │
│  │  2. analyzeFace() - Claude Vision API            │  │
│  │  3. analyzePalm() - Claude Vision API            │  │
│  │  4. saveAnalysis() - Prisma + DB                 │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                             │
│                          ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │         after() - Background Processing           │  │
│  │  - Long-running AI analysis                      │  │
│  │  - Don't block UI response                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   External Services                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Claude     │  │  Cloudinary  │  │  PostgreSQL  │  │
│  │   Vision API │  │   (already   │  │   (already   │  │
│  │              │  │   setup)     │  │   setup)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Database Schema Extension

```prisma
// Add to existing schema.prisma

model FaceAnalysis {
  id             String   @id @default(cuid())
  studentId      String   @unique
  imageUrl       String   // Cloudinary URL
  result         Json     // FaceAnalysisResult
  status         String   @default("complete") // pending, complete, failed
  errorMessage   String?
  version        Int      @default(1)
  analyzedAt     DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  student        Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
}

model PalmAnalysis {
  id             String   @id @default(cuid())
  studentId      String   @unique
  hand           String   // 'left' or 'right'
  imageUrl       String   // Cloudinary URL
  result         Json     // PalmAnalysisResult
  status         String   @default("complete") // pending, complete, failed
  errorMessage   String?
  version        Int      @default(1)
  analyzedAt     DateTime
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  student        Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@index([studentId])
}

// Update Student model
model Student {
  // ... existing fields ...
  faceAnalysis   FaceAnalysis?
  palmAnalysis   PalmAnalysis?
}
```

### Server Action Implementation

```typescript
// src/lib/actions/ai-image-analysis.ts

"use server"

import { revalidatePath } from "next/cache"
import { anthropic } from "@/lib/ai/claude"
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { FACE_READING_PROMPT, PALM_READING_PROMPT } from "@/lib/ai/prompts"

export async function analyzeFaceImage(studentId: string, imageUrl: string) {
  const session = await verifySession()

  // Verify student access
  const student = await db.student.findFirst({
    where: { id: studentId, teacherId: session.userId }
  })

  if (!student) {
    throw new Error("학생을 찾을 수 없어요.")
  }

  // Download image from Cloudinary
  const imageBuffer = await fetch(imageUrl).then(r => r.arrayBuffer())
  const base64Image = Buffer.from(imageBuffer).toString('base64')

  try {
    // Call Claude Vision API
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image
            }
          },
          {
            type: 'text',
            text: FACE_READING_PROMPT
          }
        ]
      }]
    })

    // Parse JSON response
    const result = JSON.parse(response.content[0].text)

    // Save to database
    const analysis = await db.faceAnalysis.upsert({
      where: { studentId },
      create: {
        studentId,
        imageUrl,
        result,
        analyzedAt: new Date()
      },
      update: {
        imageUrl,
        result,
        analyzedAt: new Date()
      }
    })

    revalidatePath(`/students/${studentId}`)
    return { success: true, analysis }

  } catch (error) {
    console.error('Face analysis error:', error)
    throw new Error("관상 분석에 실패했어요. 다시 시도해주세요.")
  }
}

export async function analyzePalmImage(
  studentId: string,
  imageUrl: string,
  hand: 'left' | 'right'
) {
  // Similar implementation to face analysis
  // ...
}
```

### Streaming UI with Vercel AI SDK (Optional Enhancement)

For real-time streaming of AI analysis results:

```bash
npm install ai
```

```typescript
// Streaming version (optional)
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function streamFaceAnalysis(imageUrl: string) {
  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    messages: [{
      role: 'user',
      content: [
        { type: 'image', image: imageUrl },
        { type: 'text', text: FACE_READING_PROMPT }
      ]
    }]
  })

  return result.toDataStreamResponse()
}
```

### Async Processing with Next.js 15 `after()` API

For long-running AI analysis without blocking UI:

```typescript
import { after } from 'next/server'

export async function triggerFaceAnalysis(studentId: string, imageUrl: string) {
  // Return immediately to user
  after(async () => {
    // This runs after response is sent
    await analyzeFaceImage(studentId, imageUrl)
  })

  return { success: true, message: "분석을 시작했어요. 잠시 후 결과가 표시됩니다." }
}
```

## 6. UI/UX Considerations

### Loading States

**Progressive Loading Experience:**

1. **Upload State**: Image uploading to Cloudinary
2. **Validation State**: Checking image quality (blur, face detection)
3. **Analyzing State**: AI processing (longest step)
4. **Complete State**: Results displayed

```typescript
// UI States
type AnalysisState =
  | 'idle'
  | 'uploading'
  | 'validating'
  | 'analyzing'
  | 'complete'
  | 'error'
```

**Skeleton Loading:**
```tsx
{state === 'analyzing' && (
  <div className="space-y-4">
    <div className="animate-pulse bg-gray-200 h-4 rounded" />
    <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4" />
    <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2" />
  </div>
)}
```

### Display Patterns

**Analysis Panel Structure:**
```tsx
<div className="bg-white rounded-lg shadow-sm">
  {/* Header */}
  <div className="px-6 py-4 border-b">
    <h2>AI 관상 분석</h2>
  </div>

  {/* Content */}
  <div className="p-6">
    {analysis ? (
      <>
        {/* Image Preview */}
        <img src={analysis.imageUrl} alt="얼굴 사진" />

        {/* Disclaimer Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-800">
            ⚠️ 전통 관상학에 기반한 참고용 해석입니다. 과학적 근거가 없습니다.
          </p>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <FeatureSection title="얼굴형" value={analysis.result.faceShape} />
          <FeatureSection title="이목구비" features={analysis.result.features} />
          <FeatureSection title="성격 특성" traits={analysis.result.personalityTraits} />
          <FeatureSection title="운세 해석" fortune={analysis.result.fortune} />
        </div>
      </>
    ) : (
      <EmptyState />
    )}
  </div>
</div>
```

### Image Preview & Re-upload

```tsx
<div className="relative group">
  <img src={imageUrl} alt="Preview" />
  <button
    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
    onClick={() => fileInputRef.current?.click()}
  >
    📷 다시 찍기
  </button>
</div>
```

### Error Handling UI

```tsx
{error && (
  <div className="bg-red-50 border-l-4 border-red-400 p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-800">{error}</p>
        <button onClick={handleRetry}>다시 시도</button>
      </div>
    </div>
  </div>
)}
```

## 7. Legal & Ethical Notes

### Mandatory Disclaimer

**Required on all AI analysis results:**

```typescript
const DISCLAIMER_TEXT = {
  face: `
⚠️ **전통 관상학 참고용**

이 분석은 한국 전통 관상학에 기반한 AI 해석입니다.
과학적 근거가 없으며 엔터테인먼트 목적으로만 제공됩니다.

실제 상담은 전문가와 상담하시기 바랍니다.
  `.trim(),

  palm: `
⚠️ **전통 손금학 참고용**

이 분석은 한국 전통 손금학에 기반한 AI 해석입니다.
과학적 근거가 없으며 엔터테인먼트 목적으로만 제공됩니다.

실제 상담은 전문가와 상담하시기 바랍니다.
  `.trim()
}
```

**Visual Presentation:**
- Yellow warning banner at top of results
- High contrast text
- Clear, non-legalese language
- Korean language prominent

### Data Privacy

**Image Data Handling:**

1. **Storage**: Cloudinary (already in use)
   - Images encrypted at rest
   - HTTPS delivery
   - Access control via signed URLs

2. **AI Processing**:
   - Images sent to Anthropic API (HTTPS)
   - Not used for training (check Anthropic's data policy)
   - Delete from Cloudinary after analysis if needed

3. **Database**:
   - Analysis results stored as JSON
   - PII limited to student ID
   - No raw images in DB

**Privacy Notice:**
```typescript
const PRIVACY_NOTICE = `
🔒 **개인정보 보호**

업로드된 이미지는 분석 목적으로만 사용됩니다.
이미지는 안전하게 저장되며, 제3자와 공유되지 않습니다.
분석 완료 후 원하지 않으면 이미지 삭제를 요청할 수 있습니다.
`.trim()
```

### Age Restrictions

**Recommendation:**
- Limit analysis to students age 14+ (with parental consent awareness)
- Include age-appropriate disclaimers

### Content Moderation

**AI Response Safety:**
- Filter out negative/harmful interpretations
- Ensure positive, encouraging tone
- No predictions about sensitive topics (death, illness, etc.)

```typescript
function sanitizeAIResponse(response: string): string {
  // Remove or flag concerning content
  const flaggedTerms = ['죽음', '질병', '사고', '불행']
  // Implementation...
}
```

## 8. Key Technical Decisions

### Decision 1: AI Service Provider ✅

**Selected: Claude Vision API (Anthropic)**

**Rationale:**
- Superior Korean language understanding
- Cost-effective for this use case
- High accuracy for image analysis
- Easy TypeScript integration

**Tradeoffs:**
- Pro: Natural Korean, good documentation
- Con: Additional API dependency, cost per analysis

### Decision 2: Validation Strategy ✅

**Selected: Two-Stage (Client + AI)**

**Approach:**
1. **Stage 1**: face-api.js/Sharp for quick feedback
2. **Stage 2**: Claude Vision API for quality assessment

**Rationale:**
- Fast user feedback (no waiting for AI)
- Reduces unnecessary API calls
- Better UX

### Decision 3: Async Processing ✅

**Selected: Next.js 15 `after()` API**

**Options Considered:**
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **after() API** | Built-in, simple | Limited to background tasks | ✅ RECOMMENDED |
| **BullMQ + Redis** | Full queue features | Complex, additional infra | For heavy load |
| **Server Actions (synchronous)** | Simple | Blocks UI | Not for long tasks |

**Rationale:**
- AI analysis takes 5-15 seconds
- `after()` API prevents UI blocking
- Simple integration with Next.js 15
- No additional infrastructure

### Decision 4: Result Storage ✅

**Selected: Separate tables (FaceAnalysis, PalmAnalysis)**

**Schema:**
```prisma
model FaceAnalysis {
  id       String @id @default(cuid())
  studentId String @unique
  result   Json   // Flexible for AI changes
  // ...
}
```

**Rationale:**
- Separate from existing analysis tables (SajuAnalysis, MbtiAnalysis)
- JSON result field flexible for AI model updates
- Unique constraint ensures one analysis per student
- Easy to extend with versioning

### Decision 5: UI Framework ✅

**Selected: Existing component structure (TanStack Table, Radix UI)**

**Rationale:**
- Consistent with existing codebase
- Already familiar patterns from MbtiAnalysisPanel
- Reusable loading/error states

## Code Examples

### Complete Server Action Example

```typescript
// src/lib/actions/ai-image-analysis.ts

"use server"

import { Anthropic } from '@anthropic-ai/sdk'
import { db } from "@/lib/db"
import { verifySession } from "@/lib/dal"
import { revalidatePath } from "next/cache"
import { after } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const FACE_READING_PROMPT = `...` // (from section 3)

type FaceAnalysisResult = {
  faceShape: string
  features: Record<string, string>
  personalityTraits: string[]
  fortune: Record<string, string>
  overallInterpretation: string
  disclaimer: string
  confidence: 'high' | 'medium' | 'low'
}

export async function analyzeFaceImage(studentId: string, imageUrl: string) {
  const session = await verifySession()

  // Verify student access
  const student = await db.student.findFirst({
    where: {
      id: studentId,
      teacherId: session.userId
    }
  })

  if (!student) {
    return { success: false, error: "학생을 찾을 수 없어요." }
  }

  // Trigger async analysis
  after(async () => {
    try {
      // Download and encode image
      const imageResponse = await fetch(imageUrl)
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
      const base64Image = imageBuffer.toString('base64')

      // Call Claude Vision API
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            },
            {
              type: 'text',
              text: FACE_READING_PROMPT
            }
          ]
        }]
      })

      // Parse JSON response
      const content = response.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type')
      }

      const result: FaceAnalysisResult = JSON.parse(content.text)

      // Save to database
      await db.faceAnalysis.upsert({
        where: { studentId },
        create: {
          studentId,
          imageUrl,
          result,
          status: 'complete',
          analyzedAt: new Date()
        },
        update: {
          imageUrl,
          result,
          status: 'complete',
          analyzedAt: new Date()
        }
      })

      revalidatePath(`/students/${studentId}`)

    } catch (error) {
      console.error('Face analysis error:', error)

      // Save error state
      await db.faceAnalysis.upsert({
        where: { studentId },
        create: {
          studentId,
          imageUrl,
          result: null,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          analyzedAt: new Date()
        },
        update: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      revalidatePath(`/students/${studentId}`)
    }
  })

  return {
    success: true,
    message: "분석을 시작했어요. 잠시 후 결과가 표시됩니다."
  }
}

export async function getFaceAnalysis(studentId: string) {
  const session = await verifySession()

  const analysis = await db.faceAnalysis.findUnique({
    where: { studentId },
    include: {
      student: {
        select: {
          teacherId: true
        }
      }
    }
  })

  if (!analysis || analysis.student.teacherId !== session.userId) {
    return null
  }

  return analysis
}
```

### React Component Example

```tsx
// src/components/students/face-analysis-panel.tsx

"use client"

import { useState, useTransition } from "react"
import { Camera, Sparkles } from "lucide-react"
import { analyzeFaceImage } from "@/lib/actions/ai-image-analysis"

type FaceAnalysis = {
  id: string
  status: 'pending' | 'complete' | 'failed'
  result: any | null
  imageUrl: string | null
  errorMessage?: string
} | null

type Props = {
  studentId: string
  studentName: string
  analysis: FaceAnalysis
  faceImageUrl: string | null
}

export function FaceAnalysisPanel({
  studentId,
  studentName,
  analysis,
  faceImageUrl
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [localStatus, setLocalStatus] = useState<'idle' | 'analyzing'>('idle')

  const handleAnalyze = () => {
    if (!faceImageUrl) {
      alert("먼저 얼굴 사진을 업로드해주세요.")
      return
    }

    setLocalStatus('analyzing')
    startTransition(async () => {
      const result = await analyzeFaceImage(studentId, faceImageUrl)
      if (result.success) {
        // Refresh will happen via revalidation
      } else {
        alert(result.error || "분석에 실패했습니다.")
        setLocalStatus('idle')
      }
    })
  }

  const isAnalyzing = localStatus === 'analyzing' ||
    (analysis?.status === 'pending' && analysis?.result === null)

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">AI 관상 분석</h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {analysis?.status === 'complete' && analysis.result ? (
          <AnalysisResult result={analysis.result} />
        ) : analysis?.status === 'failed' ? (
          <ErrorState
            message={analysis.errorMessage || "분석에 실패했습니다."}
            onRetry={handleAnalyze}
          />
        ) : isAnalyzing ? (
          <LoadingState />
        ) : (
          <EmptyState
            hasImage={!!faceImageUrl}
            onAnalyze={handleAnalyze}
          />
        )}
      </div>
    </div>
  )
}

function AnalysisResult({ result }: { result: any }) {
  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ {result.disclaimer}
        </p>
      </div>

      {/* Face Shape */}
      <div>
        <h3 className="font-semibold mb-2">얼굴형</h3>
        <p className="text-gray-700">{result.faceShape}</p>
      </div>

      {/* Features */}
      <div>
        <h3 className="font-semibold mb-2">이목구비</h3>
        <dl className="grid grid-cols-2 gap-2">
          <div>
            <dt className="text-sm text-gray-500">눈</dt>
            <dd className="text-gray-700">{result.features.eyes}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">코</dt>
            <dd className="text-gray-700">{result.features.nose}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">입</dt>
            <dd className="text-gray-700">{result.features.mouth}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">귀</dt>
            <dd className="text-gray-700">{result.features.ears}</dd>
          </div>
        </dl>
      </div>

      {/* Personality Traits */}
      <div>
        <h3 className="font-semibold mb-2">성격 특성</h3>
        <ul className="list-disc list-inside space-y-1">
          {result.personalityTraits.map((trait: string, i: number) => (
            <li key={i} className="text-gray-700">{trait}</li>
          ))}
        </ul>
      </div>

      {/* Fortune */}
      <div>
        <h3 className="font-semibold mb-2">운세 해석</h3>
        <div className="space-y-2 text-sm">
          <p><span className="font-medium">학업:</span> {result.fortune.academic}</p>
          <p><span className="font-medium">진로:</span> {result.fortune.career}</p>
          <p><span className="font-medium">인간관계:</span> {result.fortune.relationships}</p>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="text-center py-8">
      <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-600">AI가 얼굴 사진을 분석 중이에요...</p>
      <p className="text-sm text-gray-500 mt-2">10~20초 정도 소요됩니다.</p>
    </div>
  )
}

function EmptyState({ hasImage, onAnalyze }: { hasImage: boolean; onAnalyze: () => void }) {
  return (
    <div className="text-center py-8">
      <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">
        {hasImage
          ? "얼굴 사진이 준비되었어요. 분석을 시작할까요?"
          : "아직 얼굴 사진이 없어요."
        }
      </p>
      {hasImage && (
        <button
          onClick={onAnalyze}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Sparkles className="w-4 h-4" />
          분석 시작
        </button>
      )}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 text-left">
        <p className="text-sm text-red-800">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50"
      >
        다시 시도
      </button>
    </div>
  )
}
```

## 9. Open Questions

### Q1: Image Retention Policy

**Question:** How long should we retain uploaded face/palm images?

**Options:**
1. **Retain indefinitely** - Simple, but privacy concerns
2. **Delete after analysis** - Most private, but prevents re-analysis
3. **Retain for 30 days** - Balance, allows re-analysis

**Recommendation:** Option 3 (30-day retention) with manual delete option

### Q2: Analysis Caching

**Question:** Should we cache analysis results to avoid re-analyzing same image?

**Recommendation:** Yes, use `studentId` unique constraint in schema. Only re-analyze if:
- User explicitly requests re-analysis
- Image is replaced
- Analysis version changes

### Q3: Cost Monitoring

**Question:** How to monitor and control AI API costs?

**Recommendations:**
- Implement rate limiting per teacher
- Add monthly analysis quota
- Monitor costs via Anthropic dashboard
- Consider caching to reduce duplicate analyses

### Q4: Multi-language Support

**Question:** Should we support languages other than Korean?

**Recommendation:** Start with Korean only (primary use case). Can extend later if needed.

## Sources

### Primary (HIGH confidence)

- **[Claude API Official Docs - Pricing](https://platform.claude.com/docs/en/about-claude/pricing)** - Verified pricing for 2026
- **[Claude API Official Docs - Vision](https://platform.claude.com/docs/en/build-with-claude/vision)** - Official vision API documentation
- **[Next.js 15 Official Blog](https://nextjs.org/blog/next-15)** - React 19 support, `after()` API
- **[Next.js MCP Guides](https://nextjs.org/docs/app/guides/mcp)** - Model Context Protocol for AI integration (Jan 2026)

### Secondary (MEDIUM confidence)

- **[Practical Analysis of Physiognomy - Oreate AI Blog](https://www.oreateai.com/blog/practical-analysis-of-physiognomy/9569142e7b6b6abd338ecaec5fe1cd39)** (Jan 7, 2026) - Traditional Chinese face reading in AI context
- **[Face Reading AI - Devlabs Angelhack](https://devlabs.angelhack.com/case-studies/face-reading-ai/)** - Real-world face reading AI implementation
- **[Vercel AI SDK - Stream Text with Image](https://ai-sdk.dev/cookbook/node/stream-text-with-image-prompt)** - Official streaming examples
- **[face-api.js Ultimate Guide](https://blog.csdn.net/gitblog_00585/article/details/154724724)** (Jan 2026) - Latest face-api.js guide for 2026
- **[Google MediaPipe Hands Documentation](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/hands.md)** - Palm detection technical details

### Tertiary (LOW confidence - verified but may need validation)

- **AI Content Disclaimer Templates** - Various sources for entertainment disclaimers:
  - [Brafton AI Disclaimer Examples](https://www.brafton.com/blog/ai/ai-disclaimer-example/) (2024)
  - [Feisworld Disclaimer Templates](https://www.feisworld.com/blog/disclaimer-templates-for-ai-generated-content) (2026)
  - [The Legal Paige AI Disclaimers](https://thelegalpaige.com/blogs/blog/navigating-the-artificial-intelligence-landscape-choosing-the-right-ai-disclaimer-for-your-business)
- **Korean Traditional Face Reading Resources:**
  - [얼굴이야기 - 한국의 미인형과 관상학적 관점](https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE01169698) (2009 academic paper)
  - Various blog posts and books on Korean physiognomy
- **Korean Palmistry Resources:**
  - [손금보는법 - Naver Blog](https://m.blog.naver.com/PostView.naver?blogId=skkklnm11&logNo=220602594278)
  - [Allure Korea Palmistry Guide](https://www.allurekorea.com/2022/12/02/%25EC%259E%2585%25EB%25AC%25B8%25EC%259E%2590%25EB%25A5%25BC-%25EC%259C%2584%25ED%2595%259C-%25EC%2586%2590%25EA%25B8%2588-%25EA%25B0%2580%25EC%259D%25B4%25EB%2593%259C/)
- **Next.js 15 Server Actions:**
  - [Next.js 15 Server Actions Guide](https://medium.com/@saad.minhas.codes/next-js-15-server-actions-complete-guide-with-real-examples-2026-6320fbfa01c3) (2026)
  - [Next.js after() API Guide](https://blog.devgenius.io/i-am-in-love-with-the-after-of-next-js-15-background-tasks-97e54036637d)
- **Image Processing:**
  - [Sharp GitHub Repository](https://github.com/lovell/sharp)
  - [Sharp API Operations](https://sharp.pixelplumbing.com/api-operation/)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** - Claude API pricing/features from official docs, Next.js 15 features verified
- Architecture: **HIGH** - Next.js 15 Server Actions and `after()` API from official sources
- Image validation: **MEDIUM** - face-api.js and Sharp well-established, but implementation details may need testing
- Face reading prompts: **MEDIUM** - Based on traditional Korean physiognomy principles, may need refinement with actual testing
- Palmistry prompts: **MEDIUM** - Based on traditional Korean palmistry, may need refinement
- Legal/ethical: **LOW/MEDIUM** - Disclaimer templates from legal sources, but specific Korean regulations may require legal review

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - stable APIs, but pricing/features may change)

**Next steps for planner:**
1. Create detailed implementation plans for each sub-feature
2. Define specific task breakdown with time estimates
3. Identify dependencies and integration points
4. Plan testing strategy for AI accuracy and validation
5. Consider A/B testing for prompt optimization
