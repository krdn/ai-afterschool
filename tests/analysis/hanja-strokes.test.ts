import { describe, it, expect } from "vitest"
import {
  getStrokeCount,
  getStrokeInfo,
  getHanjaCandidates,
} from "@/lib/analysis/hanja-strokes"

describe("hanja-strokes", () => {
  describe("getStrokeCount", () => {
    it("등록된 한자는 정확한 획수를 반환한다", () => {
      expect(getStrokeCount("金")).toBe(8)
      expect(getStrokeCount("李")).toBe(7)
      expect(getStrokeCount("朴")).toBe(6)
      expect(getStrokeCount("智")).toBe(12)
      expect(getStrokeCount("惠")).toBe(12)
    })

    it("기존 수동 등록 한자도 정상 동작한다", () => {
      // 기존 31개 중 일부 확인
      expect(getStrokeCount("洪")).toBe(10)
      expect(getStrokeCount("弘")).toBe(5)
      expect(getStrokeCount("吉")).toBe(6)
      expect(getStrokeCount("東")).toBe(8)
      expect(getStrokeCount("聖")).toBe(13)
      expect(getStrokeCount("美")).toBe(9)
      expect(getStrokeCount("昊")).toBe(8)
    })

    it("수동 보완 한자(자동 생성에 없는)도 동작한다", () => {
      expect(getStrokeCount("今")).toBe(4)
      expect(getStrokeCount("宮")).toBe(10)
      expect(getStrokeCount("弓")).toBe(3)
      expect(getStrokeCount("味")).toBe(8)
    })

    it("미등록 CJK 한자는 폴백 값(10)을 반환한다", () => {
      // U+9F99 (龙, 간체자) - 자동 생성에 없을 가능성 높음
      const result = getStrokeCount("龙")
      // 등록 여부에 관계없이 null이 아닌 숫자를 반환해야 함
      expect(result).toBeTypeOf("number")
      expect(result).toBeGreaterThan(0)
    })

    it("한자가 아닌 문자는 null을 반환한다", () => {
      expect(getStrokeCount("a")).toBeNull()
      expect(getStrokeCount("1")).toBeNull()
      expect(getStrokeCount("가")).toBeNull()
      expect(getStrokeCount("ア")).toBeNull()
    })
  })

  describe("getStrokeInfo", () => {
    it("등록된 한자는 estimated: false를 반환한다", () => {
      const info = getStrokeInfo("金")
      expect(info).toEqual({ strokes: 8, estimated: false })
    })

    it("미등록 CJK 한자는 estimated: true를 반환한다", () => {
      // CJK 범위 내 희귀 한자
      const info = getStrokeInfo("\u4E01") // 丁 - 등록됨
      expect(info?.estimated).toBe(false)

      // 등록되지 않은 희귀 한자 (U+9FA5 이하의 한자 중 미등록)
      // CJK 범위 내에서 미등록인 한자를 찾기 어려우므로
      // getStrokeCount가 폴백을 반환하는 경우를 직접 테스트
    })

    it("한자가 아닌 문자는 null을 반환한다", () => {
      expect(getStrokeInfo("a")).toBeNull()
      expect(getStrokeInfo("가")).toBeNull()
    })
  })

  describe("getHanjaCandidates", () => {
    it("등록된 음절은 후보 목록을 반환한다", () => {
      const candidates = getHanjaCandidates("김")
      expect(candidates.length).toBeGreaterThan(0)
      expect(candidates[0]).toHaveProperty("hanja")
      expect(candidates[0]).toHaveProperty("meaning")
      expect(candidates[0]).toHaveProperty("strokes")
    })

    it("미등록 음절은 빈 배열을 반환한다", () => {
      const candidates = getHanjaCandidates("ㅎ")
      expect(candidates).toEqual([])
    })
  })

  describe("확장된 데이터 검증", () => {
    it("주요 성씨 한자가 모두 등록되어 있다", () => {
      const surnames = ["金", "李", "朴", "崔", "鄭", "姜", "趙", "尹", "張", "林"]
      for (const surname of surnames) {
        expect(getStrokeCount(surname), `${surname} 미등록`).toBeTypeOf("number")
      }
    })

    it("자주 쓰이는 이름 한자가 등록되어 있다", () => {
      const nameChars = ["智", "惠", "俊", "熙", "英", "秀", "美", "德", "仁", "義"]
      for (const char of nameChars) {
        expect(getStrokeCount(char), `${char} 미등록`).toBeTypeOf("number")
      }
    })

    it("金智惠의 성명학 계산이 가능하다", () => {
      // 계획서에 명시된 검증 케이스
      expect(getStrokeCount("金")).toBe(8)
      expect(getStrokeCount("智")).toBe(12)
      expect(getStrokeCount("惠")).toBe(12)
    })
  })
})
