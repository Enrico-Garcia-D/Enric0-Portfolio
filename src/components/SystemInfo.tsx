import { useEffect, useState } from 'react'
import { SYSTEM_INFO, uptime } from '../system'

const ART = [
  '  ┌──┬──┬──┬──┐  ',
  '──┤  │  │  │  ├──',
  '──┤ ┌┴──┴──┴┐ ├──',
  '──┤ │  CPU  │ ├──',
  '──┤ └┬──┬──┬┘ ├──',
  '──┤  │  │  │  ├──',
  '  └──┴──┴──┴──┘  ',
].join('\n')

/** neofetch-style spec readout with a live uptime counter. */
export default function SystemInfo() {
  const [up, setUp] = useState(uptime)
  useEffect(() => {
    const id = window.setInterval(() => setUp(uptime()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="sysinfo" role="group" aria-label="System information">
      <pre className="sysinfo-art" aria-hidden="true">
        {ART}
      </pre>
      <dl className="sysinfo-rows">
        <div className="sysinfo-head">
          <dt>enrico</dt>
          <dd>@portfolio</dd>
        </div>
        {SYSTEM_INFO.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        <div>
          <dt>Uptime</dt>
          <dd>{up}</dd>
        </div>
      </dl>
    </div>
  )
}
