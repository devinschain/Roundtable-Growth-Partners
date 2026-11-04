// ALL DATA IN THIS FILE IS SAMPLE. Fictional companies, generated numbers. Not real AI results.
export const ENGINES = ['ChatGPT', 'Gemini', 'Perplexity', 'Claude'] as const
export type Engine = (typeof ENGINES)[number]
export interface Company { id: string; name: string; industry: string; city: string; group: 'test' | 'control'; size: string; engines: Record<Engine, number>; score: number; mentioned: number; recommended: number; cited: number; rivals: string[]; described: string; positive: string[]; negative: string[] }

function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } }
const INDUSTRIES = ['Real Estate', 'Healthcare', 'Construction']
const CITIES = ['Chicago', 'Dallas', 'Miami']
const SIZES = ['11-50', '51-200', '201-500']
const RIVALS = ['Northgate Partners', 'Beacon & Rowe', 'Summit Advisory', 'Harbor Point Group', 'Atlas Meridian']
const POS = ['Seen as locally established', 'Praised for responsiveness', 'Linked to named projects', 'Strong reviews mentioned']
const NEG = ['Not named in "best of" lists', 'Services described vaguely', 'No sources cite the website', 'Older facts shown as current']
const r = rng(42)
export const COMPANIES: Company[] = []
let n = 1
for (const industry of INDUSTRIES) for (const city of CITIES) for (let k = 0; k < 4; k++) {
  const base = 25 + r() * 55
  const engines = Object.fromEntries(ENGINES.map(e => [e, Math.max(3, Math.min(98, Math.round(base + (r() - 0.5) * 30)))])) as Record<Engine, number>
  const score = Math.round(ENGINES.reduce((a, e) => a + engines[e], 0) / 4)
  COMPANIES.push({
    id: 'S' + String(n).padStart(3, '0'), name: `SAMPLE ${industry} Co ${n}`, industry, city,
    group: city === 'Dallas' ? 'control' : 'test', size: SIZES[Math.floor(r() * 3)], engines, score,
    mentioned: Math.min(100, Math.round(score * 1.2)), recommended: Math.round(score * 0.8), cited: Math.round(score * 0.5),
    rivals: [...RIVALS].sort(() => r() - 0.5).slice(0, 3),
    described: score > 55 ? 'A well regarded local provider with a clear specialty.' : 'A local provider with limited detail in AI answers.',
    positive: [POS[Math.floor(r() * 4)], POS[Math.floor(r() * 4)]].filter((v, i, a) => a.indexOf(v) === i),
    negative: [NEG[Math.floor(r() * 4)], NEG[Math.floor(r() * 4)]].filter((v, i, a) => a.indexOf(v) === i),
  }); n++
}
export const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)
