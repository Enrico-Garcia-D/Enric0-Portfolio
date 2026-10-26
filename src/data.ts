import { siCss, siExpress, siGit, siGithub, siHtml5, siMysql, siNodedotjs, siPrisma, siReact, siTypescript } from 'simple-icons'

export interface Project {
  title: string
  tags: string
  repo: string
  apk: string
  images: string[]
  platform: string
  /** Physical hardware the project touches, if any. */
  hardware?: string[]
  /** Optional case-study fields; each is shown only when provided. */
  summary?: string
  role?: string
  stack?: string[]
  liveUrl?: string
}

export interface SocialLink {
  label: string
  href: string
}

export interface LogEntry {
  id: string
  area: 'HW' | 'SW'
  title: string
  symptom: string
  diagnosis: string[]
  fix: string
}

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

export const RESUME_URL = asset('Resume_Enrico_Garcia.pdf')
export const FORM_ENDPOINT = 'https://formspree.io/f/xpqjpkby'
/** Set to show a mailto link beside the contact form. */
export const CONTACT_EMAIL = ''
export const PHOTO_URL = asset('assets/myimg.jpg')

export const GITHUB_USER = 'Enrico-Garcia-D'
/** Repos that should not appear in the Code section (tests, experiments). */
export const HIDDEN_REPOS = ['git_test', 'git_test2', 'freeCodeCamp', 'VVV']

export const HERO_WORDS = ['interfaces', 'web apps', 'custom PCs', 'broken machines']

export const NAV_LINKS = [
  { label: 'About', id: 'about' },
  { label: 'Work', id: 'work' },
  { label: 'Code', id: 'code' },
  { label: 'Build', id: 'build' },
  { label: 'Contact', id: 'contact' },
]

export interface ChipIcon {
  label: string
  /** SVG path data (24x24 viewBox). */
  path: string
  /** Brand marks are filled; the generic icons below are drawn as strokes. */
  kind: 'fill' | 'stroke'
  /** Brand color, shown on hover. */
  hex?: string
}

const brand = (label: string, icon: { path: string; hex: string }): ChipIcon => ({
  label,
  path: icon.path,
  hex: icon.hex,
  kind: 'fill',
})

const glyph = (label: string, path: string): ChipIcon => ({ label, path, kind: 'stroke' })

export const TOOLS: ChipIcon[] = [
  brand('React', siReact),
  brand('TypeScript', siTypescript),
  brand('Express', siExpress),
  brand('Node.js', siNodedotjs),
  brand('MySQL', siMysql),
  brand('Prisma', siPrisma),
  glyph('REST APIs', 'M4 8h14M14 4l4 4-4 4M20 16H6M10 12l-4 4 4 4'),
  brand('HTML5', siHtml5),
  brand('CSS', siCss),
  brand('Git', siGit),
  brand('GitHub', siGithub),
  glyph(
    'Hardware troubleshooting',
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  ),
  glyph('Agile / Scrum', 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5'),
  glyph('Rapid learning', 'M13 2 3 14h9l-1 8 10-12h-9l1-8z'),
  glyph('Open to new stacks', 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'),
]

export const SKILLS_SOFTWARE = [
  'Web development',
  'React + TypeScript',
  'Express + TypeScript',
  'MySQL + Prisma',
  'Node.js',
  'REST APIs',
  'HTML5 & CSS3',
  'UI / UX design',
  'Git & GitHub',
]

export const SKILLS_HARDWARE = ['PC builds', 'Repairs', 'Hardware troubleshooting']

export const PROJECTS: Project[] = [
  {
    title: 'MS FIND',
    tags: 'AR · Voice · Mobile App',
    repo: 'https://github.com/Enrico-Garcia-D/MS-FIND-APP',
    apk: 'https://github.com/Enrico-Garcia-D/MS-FIND-APP/releases/download/v1.0.0-beta/MS-FIND-Final.apk',
    images: ['assets/msf1.jpg', 'assets/msf2.jpg', 'assets/msf3.jpg'].map(asset),
    platform: 'Android (APK)',
    hardware: ['Device camera (AR)', 'Microphone (voice input)'],
  },
  {
    title: 'ClassTrack 2.0',
    tags: 'UI Design · Mobile App',
    repo: 'https://github.com/Enrico-Garcia-D/ClassTrack_v2',
    apk: 'https://github.com/Enrico-Garcia-D/ClassTrack_v2/releases/download/0.2.0/ClassTrack.apk',
    images: [asset('assets/CTimg.jpg')],
    platform: 'Android (APK)',
  },
]

/**
 * Representative troubleshooting walkthroughs that show the method (symptom, diagnosis, fix).
 * Replace these with your own real cases when you have them.
 */
export const LOG_ENTRIES: LogEntry[] = [
  {
    id: 'no-display',
    area: 'HW',
    title: 'Fresh build powers on, but no display',
    symptom: 'Fans spin and lights come on, the monitor shows no signal.',
    diagnosis: [
      'Confirm the monitor cable is in the graphics card, not the motherboard port.',
      'Reseat RAM and the GPU, then boot with a single memory stick.',
      'Check whether the CPU has integrated graphics before relying on the board output.',
    ],
    fix: 'Reseat the memory, move the cable to the right port, and clear CMOS if settings were corrupted.',
  },
  {
    id: 'slow-loud-laptop',
    area: 'HW',
    title: 'Laptop is slow, hot, and loud',
    symptom: 'Fans run at full speed under light use and the system stutters.',
    diagnosis: [
      'Check temperatures at idle and under load to separate a thermal issue from a software one.',
      'Inspect vents and fan for dust, then check drive health.',
      'Look at startup items and background processes.',
    ],
    fix: 'Clean the fans and vents, renew thermal paste if temperatures stay high, and replace a failing drive.',
  },
  {
    id: 'prod-api',
    area: 'SW',
    title: 'App works locally, API calls fail in production',
    symptom: 'Pages load, but data never appears once the site is deployed.',
    diagnosis: [
      'Open the browser network tab and read the failing request: status code, URL, and response.',
      'Compare the API base URL and environment variables between local and production.',
      'Check CORS headers and whether the request is blocked as mixed content.',
    ],
    fix: 'Point the build at the production API URL, allow the deployed origin on the server, and serve everything over HTTPS.',
  },
  {
    id: 'render-loop',
    area: 'SW',
    title: 'React component re-renders endlessly',
    symptom: 'The tab freezes and the CPU spikes right after a component mounts.',
    diagnosis: [
      'Look for state updates that run on every render.',
      'Inspect effect dependency arrays for values recreated each render, like inline objects.',
      'Log renders to find which prop or state keeps changing.',
    ],
    fix: 'Stabilise the dependency (memoise it or move it outside the component) and guard the state update.',
  },
]

export const SOCIALS: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/Enrico-Garcia-D' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/enrico-miguel-garcia-092101286/' },
  { label: 'Facebook', href: 'https://www.facebook.com/migzs.g/' },
]
