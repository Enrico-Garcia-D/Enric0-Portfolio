import { PROJECTS } from './data'

/** Spec-sheet rows about me, shared by the About panel and the terminal's `neofetch`. */
export const SYSTEM_INFO: [string, string][] = [
  ['Name', 'Enrico Garcia'],
  ['Role', 'IT generalist / Digital Architect'],
  ['Education', 'BSCS (graduating)'],
  ['Frontend', 'React + TypeScript'],
  ['Backend', 'Express + TypeScript'],
  ['Database', 'MySQL via Prisma'],
  ['Hardware', 'PC builds, repairs, troubleshooting'],
  ['Projects', `${PROJECTS.length} shipped`],
  ['Status', 'Open to full-time, freelance, open source'],
]

const STARTED = Date.now()

/** Time this page has been open, like `uptime`. */
export function uptime() {
  const s = Math.floor((Date.now() - STARTED) / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}h ${m}m ${sec}s` : m ? `${m}m ${sec}s` : `${sec}s`
}

export const BOOT_LOG = [
  '[  OK  ] Started portfolio.service',
  `[  OK  ] Mounted /projects (${PROJECTS.length} entries)`,
  '[  OK  ] Reached target Code, Build',
  '[  OK  ] Started contact-form.service',
  '[ INFO ] Listening for messages...',
  'System ready.',
]
