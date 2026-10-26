export type Socket = 'AM4' | 'AM5' | 'LGA1700'
export type RamType = 'DDR4' | 'DDR5'

interface Part { id: string; name: string }
export interface Board extends Part { socket: Socket; ramType: RamType }
export interface Cpu extends Part { socket: Socket; watts: number; igpu: boolean }
export interface Ram extends Part { type: RamType }
export interface Storage extends Part { watts: number; mechanical?: boolean }
export interface Gpu extends Part { watts: number }
export interface Psu extends Part { watts: number }

// Power figures are rough typical-load estimates, good enough for a sanity check.
export const BOARDS: Board[] = [
  { id: 'b650', name: 'B650 (AM5 · DDR5)', socket: 'AM5', ramType: 'DDR5' },
  { id: 'b760', name: 'B760 (LGA1700 · DDR5)', socket: 'LGA1700', ramType: 'DDR5' },
  { id: 'b550', name: 'B550 (AM4 · DDR4)', socket: 'AM4', ramType: 'DDR4' },
]

export const CPUS: Cpu[] = [
  { id: 'r5-7600', name: 'Ryzen 5 7600 (AM5)', socket: 'AM5', watts: 65, igpu: true },
  { id: 'r7-7700x', name: 'Ryzen 7 7700X (AM5)', socket: 'AM5', watts: 105, igpu: true },
  { id: 'r5-5600', name: 'Ryzen 5 5600 (AM4)', socket: 'AM4', watts: 65, igpu: false },
  { id: 'i5-13400f', name: 'Core i5-13400F (LGA1700)', socket: 'LGA1700', watts: 65, igpu: false },
]

export const RAMS: Ram[] = [
  { id: 'd4-16', name: '16GB DDR4-3200', type: 'DDR4' },
  { id: 'd5-16', name: '16GB DDR5-5600', type: 'DDR5' },
  { id: 'd5-32', name: '32GB DDR5-6000', type: 'DDR5' },
]

export const STORAGES: Storage[] = [
  { id: 'nvme512', name: '512GB NVMe SSD', watts: 5 },
  { id: 'nvme1t', name: '1TB NVMe SSD', watts: 6 },
  { id: 'ssd1t', name: '1TB SATA SSD', watts: 4 },
  { id: 'hdd1t', name: '1TB HDD (7200 rpm)', watts: 8, mechanical: true },
]

export const GPUS: Gpu[] = [
  { id: 'none', name: 'None (use CPU graphics)', watts: 0 },
  { id: 'rtx4060', name: 'GeForce RTX 4060', watts: 115 },
  { id: 'rx7600', name: 'Radeon RX 7600', watts: 165 },
  { id: 'rtx4070', name: 'GeForce RTX 4070', watts: 200 },
]

export const PSUS: Psu[] = [
  { id: 'psu450', name: '450W', watts: 450 },
  { id: 'psu550', name: '550W', watts: 550 },
  { id: 'psu650', name: '650W', watts: 650 },
  { id: 'psu750', name: '750W', watts: 750 },
]

export interface Build { board: string; cpu: string; ram: string; storage: string; gpu: string; psu: string }

export const DEFAULT_BUILD: Build = {
  board: 'b650', cpu: 'r5-7600', ram: 'd5-16', storage: 'nvme1t', gpu: 'rtx4060', psu: 'psu550',
}

export type Level = 'ok' | 'warn' | 'err'
export interface Issue { level: Level; text: string }

const OTHER_COMPONENTS_W = 50 // fans, board, USB devices
const find = <T extends Part>(list: T[], id: string) => list.find((p) => p.id === id) ?? list[0]

export function checkBuild(b: Build) {
  const board = find(BOARDS, b.board)
  const cpu = find(CPUS, b.cpu)
  const ram = find(RAMS, b.ram)
  const storage = find(STORAGES, b.storage)
  const gpu = find(GPUS, b.gpu)
  const psu = find(PSUS, b.psu)
  const issues: Issue[] = []

  if (cpu.socket === board.socket) {
    issues.push({ level: 'ok', text: `CPU socket ${cpu.socket} matches the board.` })
  } else {
    issues.push({ level: 'err', text: `CPU is ${cpu.socket} but the board is ${board.socket}. It will not fit.` })
  }

  if (ram.type === board.ramType) {
    issues.push({ level: 'ok', text: `${ram.type} memory is supported by the board.` })
  } else {
    issues.push({ level: 'err', text: `Board takes ${board.ramType} but ${ram.type} is selected. Wrong slot keying.` })
  }

  if (gpu.id === 'none' && !cpu.igpu) {
    issues.push({ level: 'err', text: `No display output: ${cpu.name} has no integrated graphics. Add a graphics card.` })
  } else {
    issues.push({ level: 'ok', text: gpu.id === 'none' ? 'Display via CPU graphics.' : `Display via ${gpu.name}.` })
  }

  const draw = cpu.watts + gpu.watts + storage.watts + OTHER_COMPONENTS_W
  const ratio = psu.watts / draw
  if (ratio < 1.2) {
    issues.push({ level: 'err', text: `PSU too small: about ${draw}W load on a ${psu.watts}W unit. Expect shutdowns.` })
  } else if (ratio < 1.5) {
    issues.push({ level: 'warn', text: `Tight power headroom: about ${draw}W load on a ${psu.watts}W unit.` })
  } else {
    issues.push({ level: 'ok', text: `Power headroom is comfortable (about ${draw}W on ${psu.watts}W).` })
  }

  if (storage.mechanical) {
    issues.push({ level: 'warn', text: 'Mechanical drive as the only storage: expect slow boots. Consider an SSD.' })
  }

  const errors = issues.filter((i) => i.level === 'err').length
  const warnings = issues.filter((i) => i.level === 'warn').length
  const verdict = errors ? 'FAILED' : warnings ? 'PASSED WITH WARNINGS' : 'PASSED'

  return { issues, draw, psuWatts: psu.watts, verdict, errors }
}
