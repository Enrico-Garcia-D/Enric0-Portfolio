/** Tabs map onto the sections that live on the display. */
const TABS = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'code', label: 'Code' },
]

const KEYS: [string, string][] = [
  ['F1', 'Help'],
  ['Esc', 'Exit'],
  ['↑↓', 'Select Item'],
  ['Enter', 'Select'],
  ['F10', 'Save and Exit'],
]

/**
 * HP Computer Setup chrome for the laptop display: a title bar and tab row pinned to the top of the display window,
 * and the key legend pinned to the bottom. Page content scrolls between them. Pure presentation plus section tabs.
 */
export default function BiosChrome({ active }: { active: string }) {
  return (
    <div className="bios-track">
      <div className="bios-chrome">
        <header className="bios-head">
          <div className="bios-bar">
            <span className="bios-brand">HP Computer Setup</span>
            <span className="bios-model">HP ProBook 445 G10 · Enrico Garcia</span>
          </div>
          <nav className="bios-tabs" aria-label="Sections">
            {TABS.map((t) => (
              <a key={t.id} href={`#${t.id}`} className={`bios-tab${active === t.id ? ' on' : ''}`} aria-current={active === t.id ? 'true' : undefined}>
                {t.label}
              </a>
            ))}
          </nav>
        </header>

        <footer className="bios-foot" aria-hidden="true">
          {KEYS.map(([k, label]) => (
            <span key={k} className="bios-key">
              <kbd>{k}</kbd> {label}
            </span>
          ))}
        </footer>
      </div>
    </div>
  )
}
