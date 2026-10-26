import { NAV_LINKS, RESUME_URL } from '../data'
import type { Theme } from '../hooks/useTheme'
import Logo from './Logo'

interface Props {
  theme: Theme
  active: string
  onToggleTheme: () => void
  onLogoClick: () => void
  onSetup: () => void
  onTerminal: () => void
}

export default function Sidebar({ theme, active, onToggleTheme, onLogoClick, onSetup, onTerminal }: Props) {
  const dark = theme === 'dark'

  return (
    <aside className="sidebar" aria-label="Site navigation">
      <nav className="side-group">
        <a href="#top" className="side-item logo" aria-label="Home" onClick={onLogoClick}>
          <span className="side-mark">
            <Logo />
          </span>
          <span className="side-label">Enrico Garcia</span>
        </a>
        {NAV_LINKS.map((l, i) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            className={`side-item${active === l.id ? ' active' : ''}`}
            aria-current={active === l.id ? 'true' : undefined}
          >
            <span className="side-mark">{String(i + 1).padStart(2, '0')}</span>
            <span className="side-label">{l.label}</span>
          </a>
        ))}
      </nav>

      <div className="side-group">
        <a href={RESUME_URL} download className="side-item">
          <span className="side-mark">↓</span>
          <span className="side-label">Resume</span>
        </a>
        <button className="side-item" onClick={onSetup} aria-label="Open BIOS setup">
          <span className="side-mark">F2</span>
          <span className="side-label">Setup</span>
        </button>
        <button className="side-item" onClick={onTerminal} aria-label="Open terminal">
          <span className="side-mark">&gt;_</span>
          <span className="side-label">Terminal</span>
        </button>
        <button className="side-item" onClick={onToggleTheme} aria-label="Toggle theme">
          <span className="side-mark">{dark ? '○' : '●'}</span>
          <span className="side-label">{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  )
}
