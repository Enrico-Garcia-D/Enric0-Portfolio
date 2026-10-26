import { useState, type KeyboardEvent } from 'react'
import { RESUME_URL, SKILLS_HARDWARE, SKILLS_SOFTWARE } from '../data'
import type { Theme } from '../hooks/useTheme'
import Modal from './Modal'

interface Row {
  label: string
  value?: string
  action?: () => void
}

interface Props {
  theme: Theme
  bootIntro: boolean
  onClose: () => void
  onToggleTheme: () => void
  onToggleIntro: () => void
  onBoot: () => void
  onTerminal: () => void
}

export default function SetupMenu({ theme, bootIntro, onClose, onToggleTheme, onToggleIntro, onBoot, onTerminal }: Props) {
  const [tab, setTab] = useState(0)
  const [row, setRow] = useState(0)

  const tabs: { name: string; rows: Row[] }[] = [
    {
      name: 'Main',
      rows: [
        { label: 'Name', value: 'Enrico Garcia' },
        { label: 'Role', value: 'IT Generalist' },
        { label: 'Education', value: 'BSCS (graduating)' },
        { label: 'Focus', value: 'Software + Hardware' },
        { label: 'Status', value: 'Open to full-time / freelance / OSS' },
      ],
    },
    {
      name: 'Skills',
      rows: [
        ...SKILLS_SOFTWARE.map((s) => ({ label: `SW  ${s}`, value: '[Enabled]' })),
        ...SKILLS_HARDWARE.map((s) => ({ label: `HW  ${s}`, value: '[Enabled]' })),
      ],
    },
    {
      name: 'Boot',
      rows: [
        { label: 'Theme', value: `[${theme === 'dark' ? 'Dark' : 'Light'}]`, action: onToggleTheme },
        { label: 'Boot intro', value: `[${bootIntro ? 'Enabled' : 'Disabled'}]`, action: onToggleIntro },
        { label: 'Replay boot sequence', value: '[Run]', action: onBoot },
      ],
    },
    {
      name: 'Exit',
      rows: [
        { label: 'Save & Exit', value: '[Esc]', action: onClose },
        { label: 'Open terminal', value: '[`]', action: onTerminal },
        {
          label: 'Download resume',
          value: '[PDF]',
          action: () => {
            const a = document.createElement('a')
            a.href = RESUME_URL
            a.download = ''
            a.click()
          },
        },
      ],
    },
  ]

  const rows = tabs[tab].rows

  const goTab = (i: number) => {
    setTab((i + tabs.length) % tabs.length)
    setRow(0)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const handled = () => e.preventDefault()
    switch (e.key) {
      case 'ArrowRight': handled(); goTab(tab + 1); break
      case 'ArrowLeft': handled(); goTab(tab - 1); break
      case 'ArrowDown': handled(); setRow((r) => (r + 1) % rows.length); break
      case 'ArrowUp': handled(); setRow((r) => (r - 1 + rows.length) % rows.length); break
      case 'Enter':
      case ' ': handled(); rows[row]?.action?.(); break
      case 'F10': handled(); onClose(); break
    }
  }

  return (
    <Modal title="Setup Utility" onClose={onClose} onKeyDown={onKeyDown}>
      <div className="setup-tabs" role="tablist">
        {tabs.map((t, i) => (
          <button
            key={t.name}
            role="tab"
            aria-selected={i === tab}
            tabIndex={-1}
            className={`setup-tab${i === tab ? ' on' : ''}`}
            onClick={() => goTab(i)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="setup-rows" role="listbox" aria-activedescendant={`setup-row-${row}`}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            id={`setup-row-${i}`}
            role="option"
            aria-selected={i === row}
            className={`setup-row${i === row ? ' sel' : ''}${r.action ? ' act' : ''}`}
            onMouseEnter={() => setRow(i)}
            onClick={() => {
              setRow(i)
              r.action?.()
            }}
          >
            <span>{r.label}</span>
            <span className="leader" />
            {r.value && <span>{r.value}</span>}
          </div>
        ))}
      </div>

      <div className="setup-legend">←→ Screen · ↑↓ Item · Enter Change · Esc Exit</div>
    </Modal>
  )
}
