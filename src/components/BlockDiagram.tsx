import type { Project } from '../data'

const ROW = 46
const NODE_H = 32

function Column({ x, w, items, cy }: { x: number; w: number; items: string[]; cy: number }) {
  const top = cy - ((items.length - 1) * ROW) / 2
  return (
    <>
      {items.map((t, i) => (
        <g key={t}>
          <rect className="bd-node" x={x} y={top + i * ROW - NODE_H / 2} width={w} height={NODE_H} />
          <text className="bd-text" x={x + w / 2} y={top + i * ROW + 4} textAnchor="middle">
            {t}
          </text>
        </g>
      ))}
    </>
  )
}

/** Block diagram of what a project touches: hardware in, the app in the middle, how it ships on the right. */
export default function BlockDiagram({ project }: { project: Project }) {
  const inputs = project.hardware?.length ? project.hardware : ['User input']
  const outputs = ['Source repo', 'APK build', ...(project.liveUrl ? ['Live demo'] : [])]
  const app = [project.title, project.platform, ...(project.stack ?? []).slice(0, 2)]

  const rows = Math.max(inputs.length, outputs.length, 2)
  const h = rows * ROW + 24
  const cy = h / 2
  const rowY = (n: number, i: number) => cy - ((n - 1) * ROW) / 2 + i * ROW
  const coreH = app.length * 20 + 24

  const wire = (x1: number, x2: number, y1: number, y2: number, key: string) => (
    <path key={key} className="bd-wire" d={`M${x1} ${y1} H${(x1 + x2) / 2} V${y2} H${x2}`} markerEnd="url(#bd-arrow)" />
  )

  return (
    <svg className="block-diagram" viewBox={`0 0 640 ${h}`} role="img" aria-label={`Block diagram for ${project.title}`}>
      <defs>
        <marker id="bd-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" className="bd-head" />
        </marker>
      </defs>
      <text className="bd-label" x="70" y="10" textAnchor="middle">INPUTS</text>
      <text className="bd-label" x="320" y="10" textAnchor="middle">APPLICATION</text>
      <text className="bd-label" x="570" y="10" textAnchor="middle">DELIVERY</text>

      {inputs.map((_, i) => wire(140, 222, rowY(inputs.length, i), cy, `i${i}`))}
      {outputs.map((_, i) => wire(418, 500, cy, rowY(outputs.length, i), `o${i}`))}

      <Column x={0} w={140} items={inputs} cy={cy} />
      <rect className="bd-core" x={222} y={cy - coreH / 2} width={196} height={coreH} />
      {app.map((t, i) => (
        <text key={t} className={i === 0 ? 'bd-title' : 'bd-text'} x={320} y={cy - coreH / 2 + 28 + i * 20} textAnchor="middle">
          {t}
        </text>
      ))}
      <Column x={500} w={140} items={outputs} cy={cy} />
    </svg>
  )
}
