import { useEffect, useState } from 'react'
import Survey from './Survey.jsx'
import Analysis from './Analysis.jsx'

export default function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const openReal = () =>
    window.open(
      'https://www.survey.co.kr/?ACCESS_KEY=6c6923abcaf64c4ba2b3&grpid=&UID=&TYPE=1',
      'keris-survey',
      'width=1000,height=800',
    )

  return (
    <>
      {hash === '#/analysis' ? <Analysis /> : <Survey />}
      <footer className="site-footer">
        <p>
          이 도구는 KERIS에서 제공하는 교원역량체계표 및 교원역량 자가진단을 기반으로 재구성된 모의 진단
          도구입니다. 해석 시의 실제 데이터와 차이가 있을 수 있습니다.
        </p>
        <p>
          제작: 엄태상(고려대학교 교육학과) <a href="mailto:sendmethere@naver.com">sendmethere@naver.com</a>
        </p>
      </footer>
      <button className="fab-real" onClick={openReal}>
        본 진단 하러가기
      </button>
    </>
  )
}
