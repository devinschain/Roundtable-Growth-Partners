// ALL DATA IN THIS FILE IS SAMPLE. Fictional brand and numbers. Not real AI results.
export const PROMPTS = [
  'Best {industry} in {city}', 'Recommend {industry} for a mid-sized business', 'Leading {industry} providers near {city}',
  'Compare top {industry} in {city}', 'Is {brand} a good choice in {city}?', 'What is {brand} known for?',
  'What do customers say about {brand}?', 'Shortlist of 5 {industry} in {city}', 'Who to double check in {city}?', 'Alternatives to {brand}',
]
export const BRAND = { name: 'SAMPLE Brand Fitness', industry: 'Fitness Studios', domain: 'samplebrand.example' }
export interface Loc { city: string; address: string; group: 'test' | 'control'; prompts: { score: number; hits: number }[]; score: number; winner: string; described: string; pos: string; neg: string }
function rng(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } }
const r = rng(7)
const RIVALS = ['Northgate Fitness', 'Beacon Strength Club', 'Summit Athletic', 'Harbor Point Gym', 'Atlas Training Co']
const SETUP: [string, string, 'test' | 'control', number][] = [
  ['New York', '12 Sample St', 'test', 58], ['Chicago', '40 Example Ave', 'test', 52], ['Austin', '8 Demo Blvd', 'test', 47],
  ['Denver', '77 Sample Rd', 'control', 41], ['Miami', '3 Example Way', 'control', 38], ['Seattle', '95 Demo Ln', 'control', 44],
]
export const LOCS: Loc[] = SETUP.map(([city, address, group, base]) => {
  const prompts = PROMPTS.map(() => { const score = Math.max(0, Math.min(100, Math.round(base + (r() - 0.5) * 60))); return { score, hits: Math.round((score / 100) * 3) } })
  const score = Math.round(prompts.reduce((a, p) => a + p.score, 0) / prompts.length)
  return { city, address, group, prompts, score, winner: RIVALS[Math.floor(r() * RIVALS.length)],
    described: score > 50 ? 'A well known local studio with a clear offer.' : 'A local studio, few details in AI answers.',
    pos: score > 50 ? 'Named in several "best of" answers' : 'Brand name is recognized when asked directly',
    neg: score > 50 ? 'Pricing is rarely mentioned' : 'Missing from discovery answers ("best in city")' }
})
export const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0)
