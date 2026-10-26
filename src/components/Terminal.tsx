import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { LOG_ENTRIES, NAV_LINKS, PROJECTS, RESUME_URL, SKILLS_HARDWARE, SKILLS_SOFTWARE, SOCIALS } from '../data'
import type { Theme } from '../hooks/useTheme'

interface Line {
  text: string
  kind?: 'cmd' | 'err'
}

interface Props {
  onClose: () => void
  setTheme: (t: Theme) => void
  onSetup: () => void
  onBoot: () => void
  onCrash: () => void
  onProject: (query: string) => boolean
  goTo: (id: string) => void
}

const SECTION_IDS = ['top', ...NAV_LINKS.map((l) => l.id)]

const HELP = [
  'Commands:',
  '  whoami            who I am',
  '  skills            software and hardware skills',
  '  projects          list projects',
  '  open <project>    open a project report',
  '  troubleshooting           my troubleshooting log (list cases)',
  '  troubleshooting <number>  read one case: symptom, diagnosis, fix',
  '  goto <section>    top, about, work, code, build, contact',
  '  contact           links and ways to reach me',
  '  resume            download my resume',
  '  theme <light|dark>',
  '  setup             open the BIOS setup',
  '  boot              replay the boot sequence',
  '  clear · exit',
]

export default function Terminal({ onClose, setTheme, onSetup, onBoot, onCrash, onProject, goTo }: Props) {
  const [lines, setLines] = useState<Line[]>([
    { text: "Enrico Garcia terminal. Type 'help' to list commands." },
    { text: "Type 'troubleshooting' to read my troubleshooting log." },
  ])
  const [input, setInput] = useState('')
  const history = useRef<string[]>([])
  const cursor = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const outRef = useRef<HTMLDivElement>(null)

  useEffect(() => inputRef.current?.focus(), [])
  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight })
  }, [lines])

  const print = (...text: string[]) => text.map((t): Line => ({ text: t }))
  const err = (text: string): Line[] => [{ text, kind: 'err' }]

  const run = (raw: string): Line[] => {
    const [cmd, ...args] = raw.trim().split(/\s+/)
    const arg = args.join(' ')

    switch (cmd.toLowerCase()) {
      case 'help':
        return print(...HELP)
      case 'whoami':
        return print('Enrico Garcia: IT generalist.', 'BSCS (graduating). I build software and I know the hardware it runs on.')
      case 'skills':
        return print(`Software: ${SKILLS_SOFTWARE.join(', ')}`, `Hardware: ${SKILLS_HARDWARE.join(', ')}`)
      case 'projects':
        return PROJECTS.map((p) => ({ text: `  ${p.title.padEnd(16)} ${p.tags}` }))
      case 'troubleshooting':
      case 'log': {
        if (!arg) {
          return print(
            'Troubleshooting log:',
            ...LOG_ENTRIES.map((e, i) => `  ${i + 1}. [${e.area}] ${e.title}`),
            "Run 'troubleshooting <number>' to read a case.",
          )
        }
        const entry = LOG_ENTRIES[Number(arg) - 1]
        if (!entry) return err(`no entry "${arg}". Run 'troubleshooting' to list them (1-${LOG_ENTRIES.length}).`)
        return print(
          `[${entry.area}] ${entry.title}`,
          '',
          `Symptom:   ${entry.symptom}`,
          'Diagnosis:',
          ...entry.diagnosis.map((d, i) => `  ${i + 1}) ${d}`),
          `Fix:       ${entry.fix}`,
        )
      }
      case 'open': {
        if (!arg) return err('usage: open <project>')
        return onProject(arg) ? print(`Opening report for "${arg}"...`) : err(`no project matching "${arg}". Try 'projects'.`)
      }
      case 'goto': {
        const id = arg.toLowerCase()
        if (!SECTION_IDS.includes(id)) return err(`unknown section "${arg}". Options: ${SECTION_IDS.join(', ')}`)
        goTo(id)
        onClose()
        return []
      }
      case 'ls':
        return print(SECTION_IDS.map((s) => `${s}/`).join('  '))
      case 'contact':
        return print(...SOCIALS.map((s) => `  ${s.label.padEnd(10)} ${s.href}`), "Or run 'goto contact' to use the form.")
      case 'resume': {
        const a = document.createElement('a')
        a.href = RESUME_URL
        a.download = ''
        a.click()
        return print('Downloading resume...')
      }
      case 'theme': {
        const t = arg.toLowerCase()
        if (t !== 'light' && t !== 'dark') return err('usage: theme <light|dark>')
        setTheme(t)
        return print(`Theme set to ${t}.`)
      }
      case 'setup':
        onSetup()
        return []
      case 'boot':
        onBoot()
        return []
      case 'clear':
        setLines([])
        return []
      case 'exit':
        onClose()
        return []
      case 'coffee':
        return err('ERROR 418: I am a teapot.')
      case 'crash':
        onCrash()
        return []
      case 'sudo':
        if (arg.toLowerCase().replace(/\s+/g, ' ') === 'rm -rf /') {
          onCrash()
          return []
        }
        if (arg.toLowerCase() === 'hire enrico') {
          window.setTimeout(() => {
            goTo('contact')
            onClose()
          }, 900)
          return print('[sudo] password for recruiter: ********', 'Access granted. Opening contact...')
        }
        return err('recruiter is not in the sudoers file. This incident will be reported.')
      default:
        return err(`command not found: ${cmd}. Type 'help'.`)
    }
  }

  const submit = () => {
    const value = input.trim()
    if (!value) return
    history.current.push(value)
    cursor.current = history.current.length
    const result = run(value)
    // 'clear' resets the screen, so the echoed command is skipped in that case.
    if (value.toLowerCase() !== 'clear') {
      setLines((l) => [...l, { text: `> ${value}`, kind: 'cmd' }, ...result])
    }
    setInput('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const h = history.current
      cursor.current = Math.min(h.length, Math.max(0, cursor.current + (e.key === 'ArrowUp' ? -1 : 1)))
      setInput(h[cursor.current] ?? '')
    }
  }

  return (
    <div className="terminal" role="dialog" aria-label="Terminal" onKeyDown={onKeyDown}>
      <div className="modal-title">
        <span>Terminal</span>
        <button className="modal-close" onClick={onClose} aria-label="Close terminal">
          ×
        </button>
      </div>
      <div className="term-out" ref={outRef} aria-live="polite">
        {lines.map((l, i) => (
          <div key={i} className={`term-${l.kind ?? 'out'}`}>
            {l.text}
          </div>
        ))}
      </div>
      <form
        className="term-line"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <span aria-hidden="true">&gt;</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Command"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </form>
    </div>
  )
}
