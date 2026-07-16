import { useState } from 'react'
import data from '../questions.json'
import { saveSubmission } from './storage.js'
import { scaleLines } from './scores.js'

// 원본 설문과 동일한 페이지 구성 (p1: 1~7, p2: 8~15, p3: 16~21)
const PAGES = [
  data.questions.slice(0, 7),
  data.questions.slice(7, 15),
  data.questions.slice(15, 21),
]

function QuestionRow({ q, value, warned, onSelect }) {
  const [open, setOpen] = useState(false)
  return (
    <tr>
      <td className={'answer-td' + (warned ? ' target-warning' : '')}>
        {q.question}
        <div style={{ marginTop: 8 }}>
          <span className="more-btn" onClick={() => setOpen(!open)}>
            {open ? '접기' : '더보기'}
            <small className="arrow">{open ? '▲' : '▼'}</small>
          </span>
        </div>
        {open && (
          <div className="item-details">
            <div className="item-details-head">이 문항은 다음 내용을 포함합니다.</div>
            <ul>
              {q.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        )}
      </td>
      {data.scale.map((s) => (
        <td key={s.value} className="td-radio text-center" onClick={() => onSelect(s.value)}>
          <label>
            <input
              type="radio"
              name={q.id}
              checked={value === s.value}
              onChange={() => onSelect(s.value)}
            />
            <span className="nopadding">&nbsp;</span>
          </label>
        </td>
      ))}
    </tr>
  )
}

export default function Survey() {
  const [page, setPage] = useState(0)
  const [answers, setAnswers] = useState({})
  const [warn, setWarn] = useState(false)
  const [done, setDone] = useState(false)

  const questions = PAGES[page]
  const unanswered = questions.filter((q) => answers[q.id] == null)

  const select = (id, value) => {
    setAnswers((a) => ({ ...a, [id]: value }))
  }

  const next = () => {
    if (unanswered.length > 0) {
      setWarn(true)
      window.scrollTo(0, 0)
      return
    }
    setWarn(false)
    if (page < PAGES.length - 1) {
      setPage(page + 1)
      window.scrollTo(0, 0)
    } else {
      saveSubmission(answers)
      setDone(true)
      window.scrollTo(0, 0)
    }
  }

  const prev = () => {
    setWarn(false)
    setPage(page - 1)
    window.scrollTo(0, 0)
  }

  if (done) {
    return (
      <div className="main-container has-notice">
        <div className="notice-bar">이 페이지는 모의 검사 페이지이며 KERIS 설문은 별도로 진행하셔야 합니다</div>
        <div className="main-div question-container">
          <div className="s-title">{data.title}</div>
          <div className="s-desc text-center">
            <p>응답이 저장되었습니다. 참여해 주셔서 감사합니다.</p>
          </div>
          <div className="button-container">
            <button className="pure-button s-btn-ok" onClick={() => (window.location.hash = '#/analysis')}>
              결과 확인
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-container has-notice">
      <div className="notice-bar">이 페이지는 모의 검사 페이지이며 KERIS 설문은 별도로 진행하셔야 합니다</div>
      <div className="main-div question-container">
        <div className="s-title">{data.title}</div>
        <div className="qtop-desc">{data.section}</div>
        {warn && <div className="main-warning">모든 문항에 응답해 주세요.</div>}
        <div className="s-answer">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60%' }}></th>
                {data.scale.map((s) => (
                  <th key={s.value}>
                    {scaleLines(s.label).map((line, i) => (
                      <span key={i}>
                        {i > 0 && <br />}
                        {line}
                      </span>
                    ))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((q) => (
                <QuestionRow
                  key={q.id}
                  q={q}
                  value={answers[q.id]}
                  warned={warn && answers[q.id] == null}
                  onSelect={(v) => select(q.id, v)}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="button-container">
          {page > 0 && (
            <button id="prev" className="pure-button" onClick={prev}>
              이전
            </button>
          )}
          <button id="next" className="pure-button s-btn-ok" onClick={next}>
            {page < PAGES.length - 1 ? '다음' : '제출'}
          </button>
        </div>
        <div className="text-center desc" style={{ marginBottom: '2.5em' }}>
          {page + 1} / {PAGES.length} 페이지
        </div>
      </div>
    </div>
  )
}
