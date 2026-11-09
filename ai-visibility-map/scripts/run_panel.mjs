// Runs the 10 prompt panel for one brand across 6 locations on Claude (official API only).
// Safe by default: without --run it only prints a cost estimate and spends nothing.
//   node scripts/run_panel.mjs                      -> dry run (estimate)
//   node scripts/run_panel.mjs --mock               -> fake answers, free, tests the pipeline (output marked SAMPLE)
//   node scripts/run_panel.mjs --run --max-usd 1    -> real run, stops if cost passes the cap
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const flag = (n) => args.includes(n)
const val = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d)

const MODEL = 'claude-haiku-5-5'
const PRICE = { in: 0.10, out: 0.50 } // USD per million tokens. UNVERIFIED: check the Claude Console price page before paying.
const REPEATS = Number(val('--repeats', 3))
const MAX_USD = Number(val('--max-usd', 1))
const brandFile = val('--brand', path.join(root, 'config', 'brand.json'))
const outFile = val('--out', path.join(root, 'web', 'public', 'run.json'))
const MOCK = flag('--mock'), RUN = flag('--run')

// load .env (ANTHROPIC_API_KEY)
try {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {}

const cfgPath = fs.existsSync(brandFile) ? brandFile : path.join(root, 'config', 'brand.example.json')
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const panel = JSON.parse(fs.readFileSync(path.join(root, 'config', 'prompt-panel.json'), 'utf8'))
const fill = (t, loc) => t.replaceAll('{industry}', cfg.industry).replaceAll('{city}', loc.city).replaceAll('{brand}', cfg.brand)

const answers = cfg.locations.length * panel.prompts.length * REPEATS
const estIn = answers * (300 + 900), estOut = answers * (600 + 200)
const estUsd = (estIn * PRICE.in + estOut * PRICE.out) / 1e6
console.log(`Brand: ${cfg.brand} | locations: ${cfg.locations.length} | prompts: ${panel.prompts.length} | repeats: ${REPEATS}`)
console.log(`Model: ${MODEL} | calls: ${answers * 2} (${answers} answers + ${answers} scoring)`)
console.log(`Estimated cost: about $${estUsd.toFixed(2)} (cap ${MAX_USD}). Prices unverified, check the Console.`)
if (!RUN && !MOCK) { console.log('\nDry run only. Nothing was sent and nothing was spent.\nTo spend: node scripts/run_panel.mjs --run --max-usd 1'); process.exit(0) }
if (RUN && !process.env.ANTHROPIC_API_KEY) { console.error('Missing ANTHROPIC_API_KEY. Put it in ai-visibility-map/.env'); process.exit(1) }

let spent = 0, failed = 0
async function claude(system, user, maxTokens) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      })
      if (r.status === 429 || r.status >= 500) throw new Error('retry ' + r.status)
      const j = await r.json()
      if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300))
      spent += ((j.usage?.input_tokens || 0) * PRICE.in + (j.usage?.output_tokens || 0) * PRICE.out) / 1e6
      if (spent > MAX_USD) { console.error(`Cost cap reached ($${spent.toFixed(3)}). Stopping.`); process.exit(2) }
      return j.content.map((c) => c.text || '').join('')
    } catch (e) {
      if (attempt === 3) { failed++; return null }
      await new Promise((r) => setTimeout(r, 1500 * attempt))
    }
  }
}

function mockAnswer(prompt, loc, i) { return `MOCK answer ${i} for ${loc.city}: ${i % 3 === 0 ? cfg.brand : 'Northgate Partners'} is a good option.` }
function mockJudge(answer, brandInPrompt) {
  const has = answer.includes(cfg.brand)
  return { mentioned: has, recommended: has, position: has ? 1 : null, sentiment: has ? 1 : 0, description: has ? 'MOCK description' : '', competitors: ['Northgate Partners'], positive_gap: has ? 'MOCK strength' : '', negative_gap: has ? '' : 'MOCK missing from answers' }
}
const JUDGE_SYS = 'You score AI answers for brand visibility. Reply with JSON only, no other text.'
function judgePrompt(p, loc, answer, brandInPrompt) {
  return `Brand: ${cfg.brand} (${cfg.domain}). City: ${loc.city}. Prompt asked: "${p}".\nAnswer:\n"""${answer}"""\n\nReturn JSON with keys: mentioned (boolean${brandInPrompt ? ', true only if the answer shows real knowledge of the brand, not just repeats the name or says it has no info' : ', true if the brand is named'}), recommended (boolean, brand is among the picks or advised), position (integer rank in a list of options, or null), sentiment (-1, 0 or 1 toward the brand), description (short phrase of how the answer describes the brand, or ""), competitors (array of other company names named as winners, max 3), positive_gap (one short phrase of a strength stated, or ""), negative_gap (one short phrase of a weakness or missing item, or "").`
}
const posPts = (p) => (p == null ? 1 : p === 1 ? 10 : p <= 3 ? 7 : p <= 5 ? 4 : 1)
function scoreRun(j, answer, brandInPrompt) {
  const mentioned = brandInPrompt ? !!j.mentioned : answer.toLowerCase().includes(cfg.brand.toLowerCase())
  const rec = mentioned && !!j.recommended
  // "cited" (15 pts) needs web sources. Claude without search has none, so score out of 85 and rescale to 100.
  const raw = (mentioned ? 40 : 0) + (rec ? 25 : 0) + (mentioned ? posPts(j.position) : 0) + (mentioned ? (j.sentiment > 0 ? 10 : j.sentiment === 0 ? 5 : 0) : 0)
  return { mentioned, score: Math.round((raw / 85) * 100) }
}
const top = (xs) => { const m = {}; xs.filter(Boolean).forEach((x) => (m[x] = (m[x] || 0) + 1)); return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || '' }

async function pool(tasks, n) { let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < tasks.length) { const t = tasks[i++]; await t() } })) }

const locs = cfg.locations.map((l) => ({ ...l, runs: panel.prompts.map(() => []), comps: [], descs: [], pos: [], neg: [] }))
const raw = []
const tasks = []
locs.forEach((loc) => panel.prompts.forEach((p, pi) => { for (let r = 1; r <= REPEATS; r++) tasks.push(async () => {
  const brandInPrompt = p.text.includes('{brand}')
  const text = fill(p.text, loc)
  const answer = MOCK ? mockAnswer(text, loc, pi + r) : await claude('Answer the question helpfully and concisely.', text, 700)
  if (answer == null) return
  let j
  if (MOCK) j = mockJudge(answer, brandInPrompt)
  else { const out = await claude(JUDGE_SYS, judgePrompt(text, loc, answer, brandInPrompt), 400); try { j = JSON.parse(out.match(/\{[\s\S]*\}/)[0]) } catch { failed++; return } }
  const s = scoreRun(j, answer, brandInPrompt)
  loc.runs[pi].push(s); loc.comps.push(...(j.competitors || [])); loc.descs.push(s.mentioned ? j.description : ''); loc.pos.push(j.positive_gap); loc.neg.push(j.negative_gap)
  raw.push({ city: loc.city, prompt_id: p.id, repeat: r, prompt: text, answer, judge: j, score: s.score })
}) }))
await pool(tasks, MOCK ? 8 : 4)
if (failed > answers * 0.2) { console.error(`Too many failed calls (${failed}). Not writing results.`); process.exit(3) }

const result = {
  is_sample: MOCK, cited_measured: false, engine: MOCK ? 'MOCK' : 'Claude', model: MOCK ? 'mock' : MODEL, run_date: new Date().toISOString().slice(0, 10),
  brand: { name: cfg.brand, industry: cfg.industry, domain: cfg.domain }, prompts: panel.prompts.map((p) => p.text),
  locs: locs.map((l) => {
    const prompts = l.runs.map((rs) => ({ score: rs.length ? Math.round(rs.reduce((a, b) => a + b.score, 0) / rs.length) : 0, hits: rs.filter((x) => x.mentioned).length }))
    return { city: l.city, address: l.address, group: l.group, prompts, score: Math.round(prompts.reduce((a, p) => a + p.score, 0) / prompts.length),
      winner: top(l.comps) || 'none found', described: top(l.descs) || 'Not described in these answers.', pos: top(l.pos) || 'None found', neg: top(l.neg) || 'None found' }
  }),
}
fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(result, null, 2))
fs.mkdirSync(path.join(root, 'data'), { recursive: true }); fs.writeFileSync(path.join(root, 'data', `raw_${Date.now()}.json`), JSON.stringify(raw, null, 2))
console.log(`Done. Failed calls: ${failed}. ${MOCK ? 'MOCK run, no cost.' : `Actual cost: $${spent.toFixed(4)}.`}\nResults: ${outFile}`)
