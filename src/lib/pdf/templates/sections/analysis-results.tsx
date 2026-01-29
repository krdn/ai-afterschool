import { View, Text } from '@react-pdf/renderer'
import { styles } from '../styles'

interface AnalysisResultsProps {
  saju: {
    result: unknown
    interpretation: string | null
    calculatedAt: Date | null
  } | null
  name: {
    result: unknown
    interpretation: string | null
    calculatedAt: Date | null
  } | null
  mbti: {
    mbtiType: string
    percentages: Record<string, number>
    calculatedAt: Date
  } | null
  face: {
    result: unknown
    status: string
    errorMessage: string | null
  } | null
  palm: {
    result: unknown
    status: string
    errorMessage: string | null
  } | null
}

export function AnalysisResults({
  saju,
  name,
  mbti,
  face,
  palm,
}: AnalysisResultsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>성향 분석 결과</Text>

      {/* MBTI Analysis */}
      {mbti && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>MBTI 성격 유형</Text>
          <View style={styles.tag}>
            <Text>{mbti.mbtiType}</Text>
          </View>
          {mbti.percentages && (
            <View style={styles.mb8}>
              <Text style={styles.label}>
                E: {mbti.percentages.EI?.toFixed(0) || 50}% | I:{' '}
                {100 - (mbti.percentages.EI || 50)}%
              </Text>
              <Text style={styles.label}>
                S: {mbti.percentages.SN?.toFixed(0) || 50}% | N:{' '}
                {100 - (mbti.percentages.SN || 50)}%
              </Text>
              <Text style={styles.label}>
                T: {mbti.percentages.TF?.toFixed(0) || 50}% | F:{' '}
                {100 - (mbti.percentages.TF || 50)}%
              </Text>
              <Text style={styles.label}>
                J: {mbti.percentages.JP?.toFixed(0) || 50}% | P:{' '}
                {100 - (mbti.percentages.JP || 50)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Saju Analysis */}
      {saju?.calculatedAt && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>사주팔자 분석</Text>
          {saju.interpretation && (
            <Text style={styles.content}>{saju.interpretation}</Text>
          )}
        </View>
      )}

      {/* Name Analysis */}
      {name?.calculatedAt && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>성명학 분석</Text>
          {name.interpretation && (
            <Text style={styles.content}>{name.interpretation}</Text>
          )}
        </View>
      )}

      {/* Face Analysis */}
      {face?.status === 'complete' && face.result && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>관상 분석</Text>
          <Text style={styles.label}>
            (참고용 엔터테인먼트 해석)
          </Text>
          <Text style={styles.content}>
            {typeof face.result === 'string'
              ? face.result
              : JSON.stringify(face.result, null, 2)}
          </Text>
        </View>
      )}

      {/* Palm Analysis */}
      {palm?.status === 'complete' && palm.result && (
        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>손금 분석</Text>
          <Text style={styles.label}>
            (참고용 엔터테인먼트 해석)
          </Text>
          <Text style={styles.content}>
            {typeof palm.result === 'string'
              ? palm.result
              : JSON.stringify(palm.result, null, 2)}
          </Text>
        </View>
      )}

      {/* No Analysis Warning */}
      {!mbti && !saju?.calculatedAt && !name?.calculatedAt && !face && !palm && (
        <View style={styles.subsection}>
          <Text style={styles.content}>
            아직 완료된 성향 분석이 없습니다.
          </Text>
        </View>
      )}
    </View>
  )
}
