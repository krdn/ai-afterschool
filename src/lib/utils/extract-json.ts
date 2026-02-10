/**
 * LLM 응답 텍스트에서 JSON을 안전하게 추출하는 유틸리티
 *
 * LLM은 JSON을 요청해도 마크다운 코드블록(```json ... ```)으로 감싸거나
 * 앞뒤에 설명 텍스트를 추가하는 경우가 많습니다.
 * 이 함수는 그런 응답에서 JSON 객체를 안전하게 추출합니다.
 */

/**
 * LLM 텍스트 응답에서 JSON 객체를 추출하여 파싱합니다.
 *
 * @param text - LLM의 텍스트 응답
 * @returns 파싱된 JSON 객체
 * @throws {Error} JSON을 찾을 수 없거나 파싱에 실패한 경우
 *
 * @example
 * // 순수 JSON
 * extractJsonFromLLM('{"key": "value"}') // => { key: "value" }
 *
 * // 마크다운 코드블록
 * extractJsonFromLLM('```json\n{"key": "value"}\n```') // => { key: "value" }
 *
 * // 앞뒤 텍스트 포함
 * extractJsonFromLLM('Here is the result: {"key": "value"} Done!') // => { key: "value" }
 */
export function extractJsonFromLLM(text: string): unknown {
  const trimmed = text.trim()

  // 1단계: 그대로 파싱 시도 (순수 JSON인 경우)
  try {
    return JSON.parse(trimmed)
  } catch {
    // 순수 JSON이 아니면 다음 단계로
  }

  // 2단계: 마크다운 코드블록 제거 (```json ... ``` 또는 ``` ... ```)
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim())
    } catch {
      // 코드블록 내용이 유효한 JSON이 아니면 다음 단계로
    }
  }

  // 3단계: 텍스트에서 첫 번째 JSON 객체({...}) 추출
  const startIdx = trimmed.indexOf('{')
  if (startIdx !== -1) {
    let depth = 0
    let inString = false
    let escape = false

    for (let i = startIdx; i < trimmed.length; i++) {
      const ch = trimmed[i]

      if (escape) {
        escape = false
        continue
      }

      if (ch === '\\' && inString) {
        escape = true
        continue
      }

      if (ch === '"') {
        inString = !inString
        continue
      }

      if (inString) continue

      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(startIdx, i + 1))
          } catch {
            break
          }
        }
      }
    }
  }

  throw new Error(
    `LLM 응답에서 유효한 JSON을 추출할 수 없습니다: ${trimmed.slice(0, 100)}...`
  )
}
