import competency from '../competency.json'

// 문항 1~21 → 역량 A~G(각 3문항: 이해/활용/성찰) 순서 매핑
export const COMPS = competency.core_values.flatMap((cv) =>
  cv.competencies.map((c) => ({
    code: c.code,
    name: c.name,
    domain: cv.domain.name,
    indicators: c.indicators,
  })),
)

export const INDICATOR_TYPES = competency.indicator_types // 이해/활용/성찰

export const COMP_COLORS = {
  A: '#5B5FE0',
  B: '#4DA3F5',
  C: '#3ECF8E',
  D: '#F95F76',
  E: '#F9A03F',
  F: '#8BC34A',
  G: '#9E86F0',
}

// ponytail: 비교그룹 응답 데이터가 없으므로 화면 예시용 고정값 (실데이터 생기면 교체)
export const GROUP_AVG = { A: 3.8, B: 4.0, C: 3.8, D: 3.8, E: 3.8, F: 3.7, G: 3.8 }

export const COMP_DESC = {
  A: 'AI·디지털 기반 교육의 개념을 이해하고, 인간 중심으로 기술을 활용하는 실천 방안을 마련한다.',
  B: '디지털·AI 기술 활용에 관련된 윤리적인 측면을 내재화하고 실천한다.',
  C: '수업설계를 위한 학습자 특성 분석에 디지털·AI 기술을 활용한다.',
  D: '교수 학습방법 설계와 교수 학습자료 및 평가자료 개발에 디지털·AI 기술을 활용한다.',
  E: '설계한 수업을 실행하는데 디지털·AI 기술을 활용한다.',
  F: '학습자의 학업 성취를 평가하고, 수업을 성찰하는데 디지털·AI 기술을 활용한다.',
  G: 'AI·디지털 기반 교육 역량을 꾸준히 개발한다.',
}

// 한 제출 건을 역량별 점수로 환산 (99=해당없음 제외)
export function scoreSubmission(sub) {
  const comps = COMPS.map((c, ci) => {
    const indicators = c.indicators.map((ind, ii) => {
      const qno = ci * 3 + ii + 1
      const v = sub.answers[`A${qno}`]
      return v == null || v === 99 ? null : v
    })
    const valid = indicators.filter((v) => v != null)
    const mean = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null
    return { code: c.code, indicators, mean }
  })
  const means = comps.filter((c) => c.mean != null).map((c) => c.mean)
  const overall = means.length ? means.reduce((a, b) => a + b, 0) / means.length : null
  return { comps, overall, submittedAt: sub.submittedAt }
}

export function fmtDate(iso) {
  const d = new Date(iso)
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export const fmt = (v) => (v == null ? '-' : v.toFixed(1))

// 척도 라벨을 어절 단위 줄바꿈으로 (전혀/그렇지/않다, 보통/이다 등)
export const scaleLines = (label) => (label === '보통이다' ? ['보통', '이다'] : label.split(' '))
