import { describe, it, expect } from 'vitest'
import { extractJsonFromLLM } from '../../../src/lib/utils/extract-json'

describe('extractJsonFromLLM', () => {
  it('순수 JSON을 그대로 파싱한다', () => {
    const input = '{"faceShape": "계란형", "features": {"eyes": "큰 눈"}}'
    const result = extractJsonFromLLM(input) as Record<string, unknown>
    expect(result.faceShape).toBe('계란형')
  })

  it('```json 코드블록에서 JSON을 추출한다', () => {
    const input = '```json\n{"faceShape": "둥근형"}\n```'
    const result = extractJsonFromLLM(input) as Record<string, unknown>
    expect(result.faceShape).toBe('둥근형')
  })

  it('``` 코드블록(json 라벨 없이)에서 JSON을 추출한다', () => {
    const input = '```\n{"key": "value"}\n```'
    const result = extractJsonFromLLM(input) as Record<string, unknown>
    expect(result.key).toBe('value')
  })

  it('앞뒤 텍스트가 있는 경우 JSON을 추출한다', () => {
    const input = 'Here is the analysis result:\n{"faceShape": "각진형"}\nHope this helps!'
    const result = extractJsonFromLLM(input) as Record<string, unknown>
    expect(result.faceShape).toBe('각진형')
  })

  it('중첩된 중괄호를 올바르게 처리한다', () => {
    const input = '```json\n{"features": {"eyes": "큰 눈", "nose": "오똑한 코"}, "fortune": {"academic": "좋음"}}\n```'
    const result = extractJsonFromLLM(input) as Record<string, unknown>
    const features = result.features as Record<string, string>
    expect(features.eyes).toBe('큰 눈')
    expect(features.nose).toBe('오똑한 코')
  })

  it('문자열 내 중괄호를 무시한다', () => {
    const input = '{"message": "이 값은 {중괄호}를 포함합니다"}'
    const result = extractJsonFromLLM(input) as Record<string, unknown>
    expect(result.message).toBe('이 값은 {중괄호}를 포함합니다')
  })

  it('앞뒤 공백을 제거한다', () => {
    const input = '  \n  {"key": "value"}  \n  '
    const result = extractJsonFromLLM(input) as Record<string, unknown>
    expect(result.key).toBe('value')
  })

  it('JSON을 찾을 수 없으면 에러를 throw한다', () => {
    expect(() => extractJsonFromLLM('no json here')).toThrow(
      'LLM 응답에서 유효한 JSON을 추출할 수 없습니다'
    )
  })

  it('빈 문자열에 대해 에러를 throw한다', () => {
    expect(() => extractJsonFromLLM('')).toThrow()
  })
})
