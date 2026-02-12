/**
 * Feature Mappings API - GET /api/feature-mappings
 * 
 * 기능 매핑 규칙 목록 조회 및 생성 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureResolver } from '@/lib/ai/feature-resolver';
import { verifySession } from '@/lib/dal';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import type { FeatureMappingInput } from '@/lib/ai/types';

/**
 * GET /api/feature-mappings?featureType=xxx
 * 
 * 기능 매핑 규칙 목록을 조회합니다.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 인증 확인
    const session = await verifySession();
    if (!session || session.role !== 'DIRECTOR') {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const featureType = searchParams.get('featureType') || undefined;

    // FeatureResolver로 매핑 조회
    const resolver = new FeatureResolver(db);
    const mappings = await resolver.getMappings(featureType);

    return NextResponse.json({
      success: true,
      data: mappings,
      count: mappings.length,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch feature mappings');
    return NextResponse.json(
      { success: false, error: '매핑 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feature-mappings
 * 
 * 새로운 기능 매핑 규칙을 생성합니다.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 인증 확인
    const session = await verifySession();
    if (!session || session.role !== 'DIRECTOR') {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 요청 본문 파싱
    const body = await request.json() as FeatureMappingInput;

    // 필수 필드 검증
    if (!body.featureType || !body.matchMode || !body.fallbackMode) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // matchMode에 따른 추가 검증
    if (body.matchMode === 'specific_model' && !body.specificModelId) {
      return NextResponse.json(
        { success: false, error: 'specific_model 모드에는 specificModelId가 필요합니다.' },
        { status: 400 }
      );
    }

    // FeatureResolver로 매핑 생성
    const resolver = new FeatureResolver(db);
    const mapping = await resolver.createOrUpdateMapping(body);

    logger.info({ 
      featureType: body.featureType, 
      matchMode: body.matchMode,
      priority: body.priority 
    }, 'Feature mapping created');

    return NextResponse.json({
      success: true,
      data: mapping,
    }, { status: 201 });
  } catch (error) {
    logger.error({ error }, 'Failed to create feature mapping');
    return NextResponse.json(
      { success: false, error: '매핑 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
