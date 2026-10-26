import { NAV_LINKS } from '../data'

export default function StatusBar({ active }: { active: string }) {
  const label = active === 'top' ? 'Home' : (NAV_LINKS.find((l) => l.id === active)?.label ?? 'Home')

  return (
    <div className="status-bar" aria-hidden="true">
      <div className="status-keys">
        <span>
          <kbd>1-{NAV_LINKS.length}</kbd>Jump
        </span>
        <span>
          <kbd>T</kbd>Theme
        </span>
        <span>
          <kbd>F2</kbd>Setup
        </span>
        <span>
          <kbd>`</kbd>Terminal
        </span>
      </div>
      <span>Section: {label}</span>
    </div>
  )
}
