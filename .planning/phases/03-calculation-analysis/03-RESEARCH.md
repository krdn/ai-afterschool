# Phase 3 Research: Calculation Analysis

## Goal
Provide accurate 사주팔자 (천간/지지) calculations from birth date/time and 성명학 numerology from Korean/Hanja names, with readable Korean interpretation and persistence in student profiles.

## Scope Notes
- Input is 양력 only.
- Birth time optional; if missing, omit hour pillar and store "unknown time".
- Timezone fixed to KST with solar time correction.
- Interpretation text should be long-form Korean (10+ sentences).
- Results saved immediately; on profile changes, show "recalculation needed" badge.

## Saju (Four Pillars) Calculation
### Data required
- 10 Heavenly Stems (천간): 갑, 을, 병, 정, 무, 기, 경, 신, 임, 계
- 12 Earthly Branches (지지): 자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해
- 60 stem-branch cycle mapping.
- 24 solar terms (절기) timestamps for year/month pillar boundaries.

### Algorithm outline
1. Normalize input datetime to KST.
2. Apply solar time correction (longitude-based offset from standard meridian 135E).
3. Determine year pillar:
   - Use solar term 기준: year changes at 입춘 (usually Feb 4).
4. Determine month pillar:
   - Month pillar changes at each solar term (절입). Use 24-term boundaries.
5. Determine day pillar:
   - Base on known reference date (e.g., 1984-02-02 = 갑자 day) and compute offset in days.
6. Determine hour pillar:
   - If time known, compute by 2-hour branch blocks; stem derived from day stem.

### Interpretation output
- Build derived attributes: 오행 counts, 십성 mapping, 간지 해석.
- Provide summary for 대운/세운 (high-level only, as per context).
- Prefer simple Korean explanations; minimize jargon.

### Accuracy risks
- Historical DST corrections (Korea 1948-1988). Need clarity if DST applied; best to include historical DST table.
- Solar terms precision (minute-level). Prefer a known dataset or library rather than approximate formulas.

## Naming Numerology (성명학)
### Data required
- Hanja stroke count dictionary (standard 획수).
- Rules to split surname/given name (2-4 Hangul chars) as specified.

### Calculation outline
1. Teacher enters Hangul name.
2. Provide Hanja candidates per syllable; store chosen Hanja.
3. Compute stroke counts from selected Hanja only.
4. Calculate four grids:
   - 원격: first + last strokes
   - 형격: surname + first given name strokes
   - 이격: given name strokes (sum)
   - 정격: total strokes
   - (If no Hanja chosen: skip analysis and surface requirement.)
5. Map numeric sums to interpretation text (길흉/설명).

### Edge cases
- Two-char names vs three/four-char: ensure consistent surname/given name split.
- Double-surname (2-char surname) support via list of known surnames.

## Data Storage
- One latest analysis per student (overwrite on recalculation).
- Include "analysis_version" and "calculated_at" for display badges.
- Persist raw calculation inputs alongside results for reproducibility.

## Verification plan
- Unit tests for pillar calculation using known reference cases.
- Snapshot tests for interpretation text structure.
- Integration test: input -> saved result -> profile display.

## Open Questions
- Confirm source for solar term timestamps and DST table.
- Decide on interpretation template content and tone (educational vs advisory).
