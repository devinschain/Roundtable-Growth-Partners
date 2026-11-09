import { useEffect, useState } from 'react'
import { BRAND, LOCS, PROMPTS, mean, type Loc } from './prospect'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const cell = (v: number) => (v >= 66 ? 'bg-teal-rgp text-white' : v >= 40 ? 'bg-teal-l' : v >= 20 ? 'bg-teal-l/30' : 'bg-amber-rgp/30')
const Sample = () => <span className="inline-block rounded-full bg-amber-rgp text-slate-rgp text-xs font-semibold px-2.5 py-1">SAMPLE DATA</span>

interface Data { is_sample: boolean; cited_measured: boolean; engine?: string; run_date?: string; brand: { name: string; industry: string }; prompts: string[]; locs: Loc[] }
const SAMPLE_DATA: Data = { is_sample: true, cited_measured: false, brand: BRAND, prompts: PROMPTS, locs: LOCS }

export default function Prospect() {
  const [data, setData] = useState<Data>(SAMPLE_DATA)
  useEffect(() => { fetch('/run.json').then(r => r.text()).then(t => { try { const j = JSON.parse(t); if (j && Array.isArray(j.locs) && j.locs.length) setData(j) } catch { /* no run file, keep sample */ } }).catch(() => {}) }, [])
  const { brand: BR, locs: LOCS_, prompts: PR } = data
  const test = LOCS_.filter(l => l.group === 'test'), control = LOCS_.filter(l => l.group === 'control')
  const t = mean(test.map(l => l.score)), c = mean(control.map(l => l.score)), brand = mean(LOCS_.map(l => l.score))
  const chart = LOCS_.map(l => ({ city: l.city, score: l.score, group: l.group }))
  const fill = (s: string) => s.replace('{industry}', BR.industry.toLowerCase()).replace('{brand}', BR.name).replace('{city}', 'city')
  return (
    <main className="max-w-5xl mx-auto px-5 py-8 space-y-6">
      <div className="flex justify-between items-end border-b border-line pb-4 flex-wrap gap-3">
        <div><div className="text-xs uppercase tracking-wide text-steel">Free AI Visibility Analysis</div><h1 className="text-3xl">{BR.name}</h1><p className="text-steel">{BR.industry} · brand level + 6 locations (3 test, 3 control)</p></div>
        <div className="flex items-center gap-4">{data.is_sample && <Sample />}<button onClick={() => window.print()} className="no-print px-4 py-2 rounded-lg bg-teal-rgp text-white text-sm">Save as PDF</button>
          <div className="text-right"><div className="font-serif text-6xl text-teal-rgp leading-none">{brand}</div><div className="text-xs text-steel">brand score / 100</div></div></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[['Test locations', String(t)], ['Control locations', String(c)], ['Gap (test minus control)', (t - c >= 0 ? '+' : '') + (t - c)], ['Prompts per location', data.is_sample ? '10 × 4 engines × 3 runs' : `10 × ${data.engine} × 3 runs`]].map(([a, b]) =>
          <div key={a} className="card"><div className="text-xs uppercase tracking-wide text-steel">{a}</div><div className="font-serif text-3xl text-teal-rgp mt-1">{b}</div></div>)}
      </div>

      <div className="card"><h3 className="text-lg mb-3">Score by location</h3>
        <ResponsiveContainer width="100%" height={240}><BarChart data={chart}><CartesianGrid stroke="#DCE3E6" vertical={false} /><XAxis dataKey="city" /><YAxis domain={[0, 100]} /><Tooltip />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>{chart.map((d, i) => <Cell key={i} fill={d.group === 'test' ? '#176F73' : '#E3A52B'} />)}</Bar></BarChart></ResponsiveContainer>
        <div className="flex gap-4 text-xs text-steel mt-2"><span><b style={{ color: '#176F73' }}>■</b> Test</span><span><b style={{ color: '#E3A52B' }}>■</b> Control</span></div></div>

      <div className="card overflow-x-auto"><h3 className="text-lg mb-3">10 prompt panel by location</h3>
        <table className="w-full text-xs"><thead><tr><th className="text-left p-2">Prompt</th>{LOCS_.map(l => <th key={l.city} className="p-2">{l.city}<div className="font-normal text-steel">{l.group}</div></th>)}</tr></thead><tbody>
          {PR.map((p, i) => <tr key={i} className="border-t border-line"><td className="p-2">{`P${String(i + 1).padStart(2, '0')} · ${fill(p)}`}</td>
            {LOCS_.map(l => <td key={l.city} className={`p-2 text-center font-semibold ${cell(l.prompts[i].score)}`}>{l.prompts[i].score}</td>)}</tr>)}
        </tbody></table></div>

      <div className="grid md:grid-cols-2 gap-4">{LOCS_.map(l => (
        <div key={l.city} className="card"><div className="flex justify-between"><h3 className="text-lg">{l.city}</h3><span className="font-serif text-2xl text-teal-rgp">{l.score}</span></div>
          <div className="text-xs text-steel mb-2">{l.address} · {l.group}</div>
          <p className="text-sm mb-2">{l.described}</p>
          <p className="text-sm"><b style={{ color: '#176F73' }}>Positive gap:</b> {l.pos}</p>
          <p className="text-sm"><b style={{ color: '#9a6a00' }}>Negative gap:</b> {l.neg}</p>
          <p className="text-sm mt-1"><b>Wins instead:</b> {l.winner}</p></div>))}</div>
      {data.is_sample
        ? <p className="text-xs text-steel">Sample report. Brand, addresses and numbers are fictional. Real runs average 3 repeats per prompt and record engine, model version and date.</p>
        : <p className="text-xs text-steel">Engine: {data.engine}. Run date: {data.run_date}. Each prompt repeated 3 times and averaged. Citations were not measured in this run, so scores are out of the 85 points that apply and rescaled to 100.</p>}
    </main>
  )
}
