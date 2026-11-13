import { Suspense, lazy, useCallback, useState } from 'react'
import About from './components/About'
import BackToTop from './components/BackToTop'
import BootScreen from './components/BootScreen'
import BiosChrome from './components/BiosChrome'
import Bsod from './components/Bsod'
import Contact from './components/Contact'
import GithubActivity from './components/GithubActivity'
import Hero from './components/Hero'
import Keyboard from './components/Keyboard'
import Memtest from './components/Memtest'
import ReportModal from './components/ReportModal'
import SetupMenu from './components/SetupMenu'
import Sidebar from './components/Sidebar'
import StatusBar from './components/StatusBar'
import SystemInfo from './components/SystemInfo'
import Terminal from './components/Terminal'
import TypingTest from './components/TypingTest'
import Work from './components/Work'
import { NAV_LINKS, PROJECTS, type Project } from './data'
import { useActiveSection } from './hooks/useActiveSection'
import { useHotkeys } from './hooks/useHotkeys'
import { useKonami } from './hooks/useKonami'
import { useRapid } from './hooks/useRapid'
import { useScrollBuild } from './hooks/useScrollBuild'
import { useTheme } from './hooks/useTheme'

// three.js is only needed for the laptop scenes, so it loads as its own chunk.
const LaptopOpen = lazy(() => import('./components/LaptopOpen'))
const LaptopViewer = lazy(() => import('./components/LaptopViewer'))

const NAV_IDS = NAV_LINKS.map((l) => l.id)
const SECTION_IDS = ['top', ...NAV_IDS]

type Overlay = 'setup' | 'terminal' | 'memtest' | 'typing' | 'keyboard' | 'bsod' | null

const readIntroSetting = () => {
  try {
    return localStorage.getItem('bootIntro') !== 'off'
  } catch {
    return true
  }
}

const shouldBoot = () => {
  if (!readIntroSetting()) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return sessionStorage.getItem('booted') !== '1'
  } catch {
    return false
  }
}

const goTo = (id: string) =>
  id === 'top' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

export default function App() {
  const { theme, setTheme, toggle } = useTheme()
  const active = useActiveSection(SECTION_IDS)
  useScrollBuild()
  const [booting, setBooting] = useState(shouldBoot)
  const [bootIntro, setBootIntro] = useState(readIntroSetting)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [report, setReport] = useState<Project | null>(null)
  const [stopCode, setStopCode] = useState('MANUAL_CRASH_REQUESTED')

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem('booted', '1')
    } catch {
      /* storage unavailable */
    }
    setBooting(false)
  }, [])

  const toggleIntro = useCallback(() => {
    setBootIntro((on) => {
      try {
        localStorage.setItem('bootIntro', on ? 'off' : 'on')
      } catch {
        /* storage unavailable */
      }
      return !on
    })
  }, [])

  const closeOverlay = useCallback(() => setOverlay(null), [])
  const openSetup = useCallback(() => setOverlay('setup'), [])
  const openTerminal = useCallback(() => setOverlay('terminal'), [])
  const openTyping = useCallback(() => setOverlay('typing'), [])
  const openKeyboard = useCallback(() => setOverlay('keyboard'), [])
  const replayBoot = useCallback(() => {
    setOverlay(null)
    setBooting(true)
  }, [])

  const crash = useCallback((code: string) => {
    setReport(null)
    setStopCode(code)
    setOverlay('bsod')
  }, [])

  // Accidental triggers: spam-clicking the logo or flipping the theme repeatedly.
  const logoHit = useRapid(5, 2000, useCallback(() => crash('LOGO_CLICKED_TOO_MANY_TIMES'), [crash]))
  const themeHit = useRapid(8, 3000, useCallback(() => crash('THEME_SWITCHED_TOO_FAST'), [crash]))
  const toggleTheme = useCallback(() => {
    toggle()
    themeHit()
  }, [toggle, themeHit])

  const openProjectByName = useCallback((query: string) => {
    const q = query.toLowerCase()
    const match = PROJECTS.find((p) => p.title.toLowerCase().includes(q))
    if (match) setReport(match)
    return Boolean(match)
  }, [])

  const idle = !booting && overlay === null && report === null
  useHotkeys({ sectionIds: NAV_IDS, onToggleTheme: toggleTheme, onSetup: openSetup, onTerminal: openTerminal, enabled: idle })
  useKonami(useCallback(() => setOverlay('memtest'), []), idle)

  return (
    <>
      {booting && <BootScreen onDone={finishBoot} />}
      <Sidebar
        theme={theme}
        active={active}
        onToggleTheme={toggleTheme}
        onLogoClick={logoHit}
        onSetup={openSetup}
        onTerminal={openTerminal}
      />
      <main>
        <div className="container hero-block">
          <Hero />
          <SystemInfo />
        </div>
        {/* Scrolling on: a closed laptop opens its lid until the screen fills the page. */}
        <Suspense fallback={null}>
          <LaptopOpen />
        </Suspense>
        {/* About onward live on the laptop display; the frame is the lid bezel. */}
        <div className="screen-zone">
          <div className="screen-track" aria-hidden="true">
            <div className="screen-frame" />
          </div>
          <BiosChrome active={active} />
          <div className="container">
            <About />
            <Work onReport={setReport} />
            <GithubActivity />
          </div>
          {/* The display ends: its bezel becomes the lid, the camera pulls back, and the whole laptop is the Laptop section. */}
          <div id="build" className="build-anchor">
            <Suspense fallback={<div className="laptop-section" />}>
              <LaptopViewer />
            </Suspense>
          </div>
        </div>
        <div className="container">
          <Contact />
        </div>
      </main>
      <StatusBar active={active} />
      <BackToTop />

      {overlay === 'setup' && (
        <SetupMenu
          theme={theme}
          bootIntro={bootIntro}
          onClose={closeOverlay}
          onToggleTheme={toggleTheme}
          onToggleIntro={toggleIntro}
          onBoot={replayBoot}
          onTerminal={openTerminal}
          onTyping={openTyping}
          onKeyboard={openKeyboard}
        />
      )}
      {overlay === 'terminal' && (
        <Terminal
          onClose={closeOverlay}
          setTheme={setTheme}
          onSetup={openSetup}
          onBoot={replayBoot}
          onTyping={openTyping}
          onKeyboard={openKeyboard}
          onCrash={() => crash('MANUAL_CRASH_REQUESTED')}
          onProject={openProjectByName}
          goTo={goTo}
        />
      )}
      {overlay === 'memtest' && <Memtest onClose={closeOverlay} />}
      {overlay === 'typing' && <TypingTest onClose={closeOverlay} />}
      {overlay === 'keyboard' && <Keyboard onClose={closeOverlay} />}
      {overlay === 'bsod' && <Bsod stopCode={stopCode} onRestart={replayBoot} />}
      {report && <ReportModal project={report} onClose={() => setReport(null)} />}
    </>
  )
}
