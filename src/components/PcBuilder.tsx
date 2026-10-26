import { useState } from 'react'
import {
  BOARDS, CPUS, DEFAULT_BUILD, GPUS, PSUS, RAMS, STORAGES, checkBuild,
  type Build, type Level,
} from '../builder'

interface Option { id: string; name: string }

const FIELDS: { key: keyof Build; label: string; options: Option[] }[] = [
  { key: 'board', label: 'Motherboard', options: BOARDS },
  { key: 'cpu', label: 'Processor', options: CPUS },
  { key: 'ram', label: 'Memory', options: RAMS },
  { key: 'storage', label: 'Storage', options: STORAGES },
  { key: 'gpu', label: 'Graphics', options: GPUS },
  { key: 'psu', label: 'Power supply', options: PSUS },
]

const TAG: Record<Level, string> = { ok: '[ OK ]', warn: '[WARN]', err: '[FAIL]' }
const BAR = 20

export default function PcBuilder() {
  const [build, setBuild] = useState<Build>(DEFAULT_BUILD)
  const result = checkBuild(build)

  const used = Math.min(1, result.draw / result.psuWatts)
  const filled = Math.round(used * BAR)

  return (
    <section id="build" className="section fade-in">
      <h2 className="section-title">Build a PC</h2>
      <p className="section-lead">Pick parts and run a POST check. It tests socket, memory, display output and power.</p>

      <div className="builder">
        <div className="builder-fields">
          {FIELDS.map((f) => (
            <label key={f.key} className="field">
              <span>{f.label}</span>
              <select value={build[f.key]} onChange={(e) => setBuild({ ...build, [f.key]: e.target.value })}>
                {f.options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button className="link-btn" onClick={() => setBuild(DEFAULT_BUILD)}>
            Reset to default build
          </button>
        </div>

        <div className="panel post" aria-live="polite">
          <div className="panel-head">
            <span>POST report</span>
            <span>{result.errors ? 'no boot' : 'boots'}</span>
          </div>
          <div className="post-body">
            {result.issues.map((i, n) => (
              <p key={n} className={`post-line ${i.level}`}>
                <span className="post-tag">{TAG[i.level]}</span> {i.text}
              </p>
            ))}
            <p className="post-power">
              Load: [{'█'.repeat(filled)}
              {'░'.repeat(BAR - filled)}] {result.draw}W / {result.psuWatts}W
            </p>
            <p className={`post-verdict ${result.errors ? 'err' : ''}`}>RESULT: {result.verdict}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
