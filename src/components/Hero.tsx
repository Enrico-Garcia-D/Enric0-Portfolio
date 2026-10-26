import { HERO_WORDS, RESUME_URL } from '../data'
import RotatingWord from './RotatingWord'

export default function Hero() {
  return (
    <section id="top" className="hero fade-in">
      <p className="greeting">Enrico Garcia · IT Generalist</p>
      <h1 className="name">
        I design, build, and fix <RotatingWord words={HERO_WORDS} />
      </h1>
      <p className="role">PC builds · Repairs · Web development · UI/UX</p>

      <div className="duo" aria-hidden="true">
        <div className="panel">
          <div className="panel-head">
            <span>software</span>
            <span>App.tsx</span>
          </div>
          <pre className="panel-body">
            <span className="c-key">const</span> me = {'{'}
            {'\n  '}builds: [<span className="c-str">'websites'</span>, <span className="c-str">'interfaces'</span>],
            {'\n  '}designs: [<span className="c-str">'UI'</span>, <span className="c-str">'UX'</span>],
            {'\n'}
            {'}'}
          </pre>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span>hardware</span>
            <span>bench</span>
          </div>
          <pre className="panel-body">
            <span className="c-dim">$</span> bench --check
            {'\n'}CPU{'      '}
            <span className="c-ok">✓</span> assembled
            {'\n'}RAM{'      '}
            <span className="c-ok">✓</span> seated
            {'\n'}STORAGE{'  '}
            <span className="c-ok">✓</span> detected
            {'\n'}POST{'     '}
            <span className="c-ok">✓</span> passed
          </pre>
        </div>
      </div>

      <div className="hero-actions">
        <a href={RESUME_URL} className="btn" download>
          Download Resume
        </a>
        <a href="#work" className="btn btn-solid">
          My Works
        </a>
      </div>
    </section>
  )
}
