import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import data from '../questions.json'
import { loadSubmissions, clearSubmissions } from './storage.js'
import {
  COMPS,
  INDICATOR_TYPES,
  COMP_COLORS,
  GROUP_AVG,
  COMP_DESC,
  scoreSubmission,
  fmtDate,
  fmt,
} from './scores.js'

/* ---------- SVG 차트들 ---------- */

function polarPoint(cx, cy, r, i, n) {
  const a = (-90 + (i * 360) / n) * (Math.PI / 180)
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function Radar({ mine }) {
  const n = COMPS.length
  const cx = 210
  const cy = 190
  const R = 120
  const rings = [1, 2, 3, 4, 5]
  const poly = (vals) =>
    vals
      .map((v, i) => polarPoint(cx, cy, ((v ?? 0) / 5) * R, i, n).join(','))
      .join(' ')
  return (
    <svg viewBox="0 0 420 400" style={{ width: '100%', maxWidth: 440 }}>
      {rings.map((rv) => (
        <polygon
          key={rv}
          points={Array.from({ length: n }, (_, i) => polarPoint(cx, cy, (rv / 5) * R, i, n).join(',')).join(' ')}
          fill="none"
          stroke="#ddd"
        />
      ))}
      {COMPS.map((c, i) => {
        const [x, y] = polarPoint(cx, cy, R, i, n)
        const [lx, ly] = polarPoint(cx, cy, R + 22, i, n)
        return (
          <g key={c.code}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#ddd" />
            <text
              x={lx}
              y={ly}
              fontSize="10"
              textAnchor={Math.abs(lx - cx) < 10 ? 'middle' : lx > cx ? 'start' : 'end'}
              fill="#333"
            >
              <tspan x={lx} dy="0">{`[${c.code}] ${c.name.length > 10 ? c.name.slice(0, 10) : c.name}`}</tspan>
              {c.name.length > 10 && <tspan x={lx} dy="12">{c.name.slice(10)}</tspan>}
            </text>
          </g>
        )
      })}
      {rings.map((rv) => (
        <text key={rv} x={cx + 4} y={cy - (rv / 5) * R + 3} fontSize="8" fill="#999">
          {rv.toFixed(1)}
        </text>
      ))}
      <polygon points={poly(COMPS.map((c) => GROUP_AVG[c.code]))} fill="rgba(233,30,99,0.15)" stroke="#E91E63" strokeWidth="1.5" />
      <polygon points={poly(mine)} fill="rgba(46,125,50,0.25)" stroke="#2E7D32" strokeWidth="2" />
    </svg>
  )
}

function Donut({ score, avg, color }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 140 140" style={{ width: 130 }}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#d9d9d9" strokeWidth="13" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${(score / 5) * c} ${c}`}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="66" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#222">
        {fmt(score)}점
      </text>
      <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#999">
        평균 {fmt(avg)}점
      </text>
    </svg>
  )
}

function CompareChart({ mine }) {
  const W = 700
  const H = 330
  const y0 = H - 60
  const y = (v) => y0 - (v / 5) * (H - 110)
  const slot = (W - 80) / COMPS.length
  const x = (i) => 60 + i * slot + slot / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%' }}>
      {[0, 1, 2, 3, 4, 5].map((v) => (
        <g key={v}>
          <text x={48} y={y(v) + 3} fontSize="10" textAnchor="end" fill="#888">{v}</text>
          <line x1={54} y1={y(v)} x2={W - 20} y2={y(v)} stroke="#eee" />
        </g>
      ))}
      {COMPS.map((c, i) => {
        const g = GROUP_AVG[c.code]
        return (
          <g key={c.code}>
            <rect x={x(i) - 24} y={y(g)} width="48" height={y0 - y(g)} rx="4" fill={COMP_COLORS[c.code]} />
            <text x={x(i)} y={(y(g) + y0) / 2} fontSize="11" textAnchor="middle" fill="white" fontWeight="bold">
              {fmt(g)}
            </text>
            <text x={x(i)} y={y0 + 16} fontSize="9.5" textAnchor="middle" fill="#444">
              {`[${c.code}] ${c.name.length > 9 ? c.name.slice(0, 9) : c.name}`}
            </text>
            {c.name.length > 9 && (
              <text x={x(i)} y={y0 + 28} fontSize="9.5" textAnchor="middle" fill="#444">
                {c.name.slice(9)}
              </text>
            )}
          </g>
        )
      })}
      <polyline
        points={mine.map((v, i) => `${x(i)},${y(v ?? 0)}`).join(' ')}
        fill="none"
        stroke="#8E24AA"
        strokeWidth="2.5"
      />
      {mine.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v ?? 0)} r="4" fill="#8E24AA" />
          <rect x={x(i) - 16} y={y(v ?? 0) - 26} width="32" height="16" rx="3" fill="#111" />
          <text x={x(i)} y={y(v ?? 0) - 14} fontSize="10" textAnchor="middle" fill="white">
            {fmt(v)}
          </text>
        </g>
      ))}
      <g>
        <line x1={W - 120} y1={18} x2={W - 90} y2={18} stroke="#8E24AA" strokeWidth="2.5" />
        <text x={W - 84} y={22} fontSize="11" fill="#333">내 점수</text>
      </g>
    </svg>
  )
}

/* ---------- 본문 ---------- */

// 원본 설문과 동일한 페이지 구성으로 응답 내용을 읽기 전용 표시
const REVIEW_PAGES = [data.questions.slice(0, 7), data.questions.slice(7, 15), data.questions.slice(15, 21)]

function AnswerSheet({ answers }) {
  return (
    <div>
      {REVIEW_PAGES.map((questions, pi) => (
        <div key={pi} className="s-answer">
          <div className="qtop-desc">
            <b>{pi + 1}페이지</b> ({questions[0].no}~{questions[questions.length - 1].no}번 문항)
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '46%' }}></th>
                {data.scale.map((s) => (
                  <th key={s.value}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <tr key={q.id}>
                  <td>
                    <b>{q.no}.</b> {q.question}
                  </td>
                  {data.scale.map((s) => (
                    <td key={s.value} className="td-radio text-center">
                      <label>
                        <input type="radio" checked={answers[q.id] === s.value} disabled readOnly />
                        <span className="nopadding">&nbsp;</span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

export default function Analysis() {
  const [subs, setSubs] = useState(loadSubmissions)
  const [selIdx, setSelIdx] = useState(-1) // -1 = 최근
  const [showSheet, setShowSheet] = useState(false)
  const [exporting, setExporting] = useState(false)
  const dashRef = useRef(null)

  const clear = () => {
    if (!window.confirm('저장된 응답을 모두 삭제할까요?')) return
    clearSubmissions()
    setSubs([])
  }

  // 내보내기: html-to-image로 캡처 (버튼 등 no-export 요소 제외)
  // margin:auto 중앙정렬 → 오른쪽 잘림 방지 위해 마진 제거
  // 브라우저 배율(줌)이 100%가 아닐 때 devicePixelRatio 기반 캔버스 계산이 어긋나므로
  // width/height와 canvasWidth/canvasHeight를 모두 명시해 배율 의존을 제거
  const capture = () => {
    const node = dashRef.current
    const w = node.offsetWidth
    const h = node.scrollHeight
    return toPng(node, {
      backgroundColor: '#f9f9f9',
      width: w,
      height: h,
      canvasWidth: w * 2,
      canvasHeight: h * 2,
      pixelRatio: 1,
      style: { margin: '0' },
      filter: (n) => !(n.classList && n.classList.contains('no-export')),
    })
  }

  const exportWith = async (fn) => {
    setExporting(true)
    try {
      await fn()
    } catch (e) {
      window.alert('저장에 실패했습니다: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  const savePng = () =>
    exportWith(async () => {
      const url = await capture()
      const a = document.createElement('a')
      a.href = url
      a.download = `역량진단결과_${fmtDate(history[history.length - 1].submittedAt)}.png`
      a.click()
    })

  const savePdf = () =>
    exportWith(async () => {
      const url = await capture()
      const img = new Image()
      await new Promise((res, rej) => {
        img.onload = res
        img.onerror = rej
        img.src = url
      })
      // A4 폭 기준, 높이는 콘텐츠에 맞춘 한 장짜리 페이지 → 중간 쪼개짐 없음
      const pw = 210
      const ih = (img.height * pw) / img.width
      const pdf = new jsPDF({ orientation: ih > pw ? 'p' : 'l', unit: 'mm', format: [pw, ih] })
      pdf.addImage(url, 'PNG', 0, 0, pw, ih)
      pdf.save(`역량진단결과_${fmtDate(history[history.length - 1].submittedAt)}.pdf`)
    })

  if (subs.length === 0) {
    return (
      <div className="main-container">
        <div className="main-div question-container">
          <div className="s-title">역량 진단 결과</div>
          <div className="s-desc text-center">
            <p>저장된 진단 결과가 없습니다.</p>
            <div className="button-container">
              <button className="pure-button s-btn-ok" onClick={() => (window.location.hash = '#/')}>
                진단하러 가기
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const history = subs.map(scoreSubmission)
  const cur = history[selIdx === -1 ? history.length - 1 : selIdx]
  const latest = history[history.length - 1]
  const mine = cur.comps.map((c) => c.mean)
  const compByCode = Object.fromEntries(COMPS.map((c) => [c.code, c]))

  // 상위/하위: 최고점/최저점 동점자만 후보로 — 전부 동점이면 구분 없음
  const scored = cur.comps.filter((c) => c.mean != null)
  const maxScore = scored.length ? Math.max(...scored.map((c) => c.mean)) : null
  const minScore = scored.length ? Math.min(...scored.map((c) => c.mean)) : null
  const allEqual = scored.length > 0 && maxScore === minScore
  const topList = scored.filter((c) => c.mean === maxScore)
  const bottomList = scored.filter((c) => c.mean === minScore)

  // 영역별 rowspan 계산용
  const domains = []
  for (const c of COMPS) {
    const last = domains[domains.length - 1]
    if (last && last.name === c.domain) last.count++
    else domains.push({ name: c.domain, count: 1, firstCode: c.code })
  }
  const domainFirst = Object.fromEntries(domains.map((d) => [d.firstCode, d]))

  const topColors = ['#F95F76', '#F9A03F']
  const bottomColors = ['#5B5FE0', '#4DA3F5']

  return (
    <div className="main-container dash" ref={dashRef}>
      {/* 상단 요약 배너 */}
      <div className="dash-header">
        <div className="dash-header-title">
          <b>AI·디지털 교육역량 모의 진단</b>
          <span>2026년 인공지능 활용 선도교사 연수 효과성 진단(사후조사)</span>
        </div>
        <div className="dash-cards">
          <div className="dash-card">
            <div className="dash-card-label">최근 진단일</div>
            <div className="dash-card-value">{fmtDate(latest.submittedAt)}</div>
          </div>
          <div className="dash-card">
            <div className="dash-card-label">진단 종합 평균</div>
            <div className="dash-card-value">
              {fmt(latest.overall)}점<small>/5.0</small>
            </div>
          </div>
        </div>
      </div>

      <div className="main-div question-container">
        <div className="dash-section-head">
          <h3>🏠 진단 결과</h3>
          <label className="sel-label">
            진단일{' '}
            <select value={selIdx} onChange={(e) => setSelIdx(Number(e.target.value))}>
              <option value={-1}>최근 ({fmtDate(latest.submittedAt)})</option>
              {history.map((h, i) => (
                <option key={i} value={i}>
                  {fmtDate(h.submittedAt)} ({i + 1}회차)
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="dash-grid2">
          {/* 레이더 */}
          <div className="dash-panel radar-panel">
            <div className="legend text-center">
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: 'rgba(46,125,50,0.4)', borderColor: '#2E7D32' }} />
                나의 점수
              </span>
              <span className="legend-item">
                <span className="legend-swatch" style={{ background: 'rgba(233,30,99,0.3)', borderColor: '#E91E63' }} />
                전체 교사 평균(예시)
              </span>
            </div>
            <Radar mine={mine} />
            <div className="text-center no-export">
              <button className="pure-button s-btn-ok dash-btn" onClick={() => (window.location.hash = '#/')}>
                다시 진단하기 ↻
              </button>
            </div>
          </div>

          {/* 역량 표 */}
          <div className="dash-panel" style={{ overflowX: 'auto' }}>
            <table className="comp-table">
              <thead>
                <tr>
                  <th>영역</th>
                  <th>역량</th>
                  {INDICATOR_TYPES.map((t) => (
                    <th key={t.code}>{t.name === '성찰(개선)' ? '성찰' : t.name}</th>
                  ))}
                  <th>역량별 평균</th>
                  <th>전체 교사 평균</th>
                </tr>
              </thead>
              <tbody>
                {COMPS.map((c, ci) => (
                  <tr key={c.code}>
                    {domainFirst[c.code] && (
                      <td className="domain-cell" rowSpan={domainFirst[c.code].count}>
                        {domainFirst[c.code].name}
                      </td>
                    )}
                    <td className="comp-name-cell">
                      <b>[{c.code}] {c.name}</b>
                      <div className="desc">{COMP_DESC[c.code]}</div>
                    </td>
                    {cur.comps[ci].indicators.map((v, ii) => (
                      <td key={ii} className="score-cell">{fmt(v)}</td>
                    ))}
                    <td
                      className="score-cell mean-cell"
                      style={{ background: `rgba(62,207,142,${0.12 + ((cur.comps[ci].mean ?? 0) / 5) * 0.45})` }}
                    >
                      <b>{fmt(cur.comps[ci].mean)}</b>
                    </td>
                    <td className="score-cell">{fmt(GROUP_AVG[c.code])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상위/하위 역량 */}
        {allEqual ? (
          <div className="dash-panel" style={{ marginBottom: '0.6em' }}>
            <h4 className="panel-title">
              상위·하위 역량 <small className="desc">7개의 역량 중 상위/하위 역량입니다.</small>
            </h4>
            <div className="tb-card text-center" style={{ padding: '1.5em' }}>
              모든 역량이 <b>{fmt(maxScore)}점</b>으로 동일하여 상위/하위 역량 구분이 없습니다.
            </div>
          </div>
        ) : (
          <div className="dash-grid2">
            {[
              { title: '상위 역량', desc: '7개의 역량 중 상위 역량입니다.', items: topList, colors: topColors },
              { title: '하위 역량', desc: '7개의 역량 중 하위 역량입니다.', items: bottomList, colors: bottomColors },
            ].map((sec) => (
              <div key={sec.title} className="dash-panel">
                <h4 className="panel-title">
                  {sec.title} <small className="desc">{sec.desc}</small>
                </h4>
                <div className="topbottom-grid">
                  {sec.items.slice(0, 2).map((item, i) => (
                    <div key={item.code} className="tb-card">
                      <div className="tb-name">[{item.code}] {compByCode[item.code].name}</div>
                      <div className="tb-scores">
                        <div>
                          내 역량점수 <b>{fmt(item.mean)}</b> 점
                        </div>
                        <div className="desc">나의 평균 {fmt(cur.overall)}점</div>
                      </div>
                      <div className="text-center">
                        <Donut score={item.mean ?? 0} avg={cur.overall} color={sec.colors[i]} />
                      </div>
                    </div>
                  ))}
                </div>
                {sec.items.length > 2 && (
                  <div className="desc text-center" style={{ marginTop: '0.4em' }}>
                    동점({fmt(sec.items[0].mean)}점) 역량이 {sec.items.length - 2}개 더 있습니다:{' '}
                    {sec.items.slice(2).map((c) => `[${c.code}]`).join(' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 전체 교사 그룹 비교 */}
        <div className="dash-panel">
          <h4 className="panel-title">
            🏠 전체 교사 그룹과 나의 역량별 점수{' '}
            <small className="desc">전체 교사 그룹의 역량별 평균 점수(예시) 대비 나의 역량별 점수입니다</small>
          </h4>
          <CompareChart mine={mine} />
        </div>

        {/* 설문지 보기 (선택한 회차의 응답 원본) */}
        {showSheet && (
          <div className="dash-panel" style={{ marginTop: '0.6em' }}>
            <h4 className="panel-title">
              설문지 보기{' '}
              <small className="desc">
                {fmtDate(cur.submittedAt)} 진단에서 체크한 응답 내용입니다.
              </small>
            </h4>
            <AnswerSheet answers={subs[selIdx === -1 ? subs.length - 1 : selIdx].answers} />
          </div>
        )}

        <div className="button-container no-export">
          <button className="pure-button s-btn-ok dash-btn" onClick={() => setShowSheet(!showSheet)}>
            {showSheet ? '설문지 닫기' : '설문지 보기'}
          </button>
          <button className="pure-button dash-btn btn-soft" disabled={exporting} onClick={savePng}>
            {exporting ? '저장 중…' : 'PNG 저장'}
          </button>
          <button className="pure-button dash-btn btn-soft" disabled={exporting} onClick={savePdf}>
            {exporting ? '저장 중…' : 'PDF 저장'}
          </button>
          <button className="pure-button dash-btn btn-soft" onClick={() => (window.location.hash = '#/')}>
            설문 다시하기
          </button>
          <button className="pure-button s-btn-warning dash-btn" onClick={clear}>
            응답 데이터 삭제
          </button>
        </div>
      </div>
    </div>
  )
}
