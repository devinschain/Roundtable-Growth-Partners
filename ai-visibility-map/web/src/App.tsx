import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { COMPANIES, ENGINES, avg, type Company } from './data'

const TEAL = '#176F73', TEAL_L = '#5CC4C8', AMBER = '#E3A52B', SLATE = '#24313A'
const INDUSTRIES = [...new Set(COMPANIES.map(c => c.industry))]
const CITIES = [...new Set(COMPANIES.map(c => c.city))]

const Sample = () => <span className="inline-block rounded-full bg-amber-rgp text-slate-rgp text-xs font-semibold px-2.5 py-1">SAMPLE DATA</span>
const heat = (v: number) => (v >= 55 ? 'bg-teal-rgp text-white' : v >= 48 ? 'bg-teal-l' : v >= 44 ? 'bg-teal-l/40' : 'bg-cloud')

function Header({ route }: { route: string }) {
  return (
    <header className="bg-slate-rgp text-white no-print">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <a href="#/" className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15" fill="none" stroke={TEAL_L} strokeWidth="2.5" /><circle cx="17" cy="17" r="5" fill={TEAL_L} /></svg>
          <div><div className="font-serif text-lg leading-none">AI Visibility Map</div><div className="text-xs text-white/60">Roundtable Growth Partners</div></div>
        </a>
        <div className="flex items-center gap-4 text-sm"><a href="#/" className={route === '' ? 'font-semibold' : 'text-white/70'}>Market</a><Sample /></div>
      </div>
    </header>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="card"><div className="text-xs uppercase tracking-wide text-steel">{label}</div><div className="font-serif text-4xl text-teal-rgp mt-1">{value}</div>{sub && <div className="text-xs text-steel mt-1">{sub}</div>}</div>
}

function Dashboard() {
  const [ind, setInd] = useState('All')
  const list = ind === 'All' ? COMPANIES : COMPANIES.filter(c => c.industry === ind)
  const test = avg(list.filter(c => c.group === 'test').map(c => c.score)), control = avg(list.filter(c => c.group === 'control').map(c => c.score))
  const engineData = ENGINES.map(e => ({ engine: e, score: avg(list.map(c => c.engines[e])) }))
  const cmp = INDUSTRIES.map(i => ({ industry: i, Test: avg(COMPANIES.filter(c => c.industry === i && c.group === 'test').map(c => c.score)), Control: avg(COMPANIES.filter(c => c.industry === i && c.group === 'control').map(c => c.score)) }))
  return (
    <main className="max-w-6xl mx-auto px-5 py-8 space-y-6">
      <div><h1 className="text-3xl">How visible are companies in AI answers?</h1><p className="text-steel mt-1">Market view across {list.length} companies, 4 AI engines, 10 prompts each, repeated 3 times.</p></div>
      <div className="flex gap-2 flex-wrap no-print">{['All', ...INDUSTRIES].map(i => <button key={i} onClick={() => setInd(i)} className={`px-3 py-1.5 rounded-full text-sm border ${ind === i ? 'bg-teal-rgp text-white border-teal-rgp' : 'bg-white border-line'}`}>{i}</button>)}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Average visibility" value={String(avg(list.map(c => c.score)))} sub="score out of 100" />
        <Kpi label="Mentioned in" value={avg(list.map(c => c.mentioned)) + '%'} sub="of answers" />
        <Kpi label="Recommended in" value={avg(list.map(c => c.recommended)) + '%'} sub="of answers" />
        <Kpi label="Test vs control" value={(test - control >= 0 ? '+' : '') + (test - control)} sub={`test ${test} · control ${control}`} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card"><h3 className="text-lg mb-3">Visibility by AI engine</h3>
          <ResponsiveContainer width="100%" height={240}><BarChart data={engineData}><CartesianGrid stroke="#DCE3E6" vertical={false} /><XAxis dataKey="engine" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="score" radius={[6, 6, 0, 0]}>{engineData.map((_, i) => <Cell key={i} fill={i % 2 ? TEAL_L : TEAL} />)}</Bar></BarChart></ResponsiveContainer></div>
        <div className="card"><h3 className="text-lg mb-3">Test vs control, by industry</h3>
          <ResponsiveContainer width="100%" height={240}><BarChart data={cmp}><CartesianGrid stroke="#DCE3E6" vertical={false} /><XAxis dataKey="industry" /><YAxis domain={[0, 100]} /><Tooltip /><Legend /><Bar dataKey="Test" fill={TEAL} radius={[6, 6, 0, 0]} /><Bar dataKey="Control" fill={AMBER} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
      <div className="card overflow-x-auto"><h3 className="text-lg mb-3">Industry by city</h3>
        <table className="w-full text-sm"><thead><tr><th className="text-left p-2">Industry</th>{CITIES.map(c => <th key={c} className="p-2">{c}</th>)}</tr></thead><tbody>
          {INDUSTRIES.map(i => <tr key={i}><td className="p-2 font-medium">{i}</td>{CITIES.map(c => { const v = avg(COMPANIES.filter(x => x.industry === i && x.city === c).map(x => x.score)); return <td key={c} className={`p-2 text-center font-semibold ${heat(v)}`}>{v}</td> })}</tr>)}
        </tbody></table></div>
      <div className="card overflow-x-auto"><h3 className="text-lg mb-3">Companies</h3>
        <table className="w-full text-sm"><thead><tr className="text-left text-steel"><th className="p-2">Company</th><th>Industry</th><th>City</th><th>Group</th><th>Score</th><th></th></tr></thead><tbody>
          {[...list].sort((a, b) => b.score - a.score).map(c => <tr key={c.id} className="border-t border-line"><td className="p-2 font-medium">{c.name}</td><td>{c.industry}</td><td>{c.city}</td><td>{c.group}</td><td className="font-semibold">{c.score}</td><td><a className="text-teal-rgp font-medium" href={`#/c/${c.id}`}>Report →</a></td></tr>)}
        </tbody></table></div>
    </main>
  )
}

function Report({ c }: { c: Company }) {
  return (
    <main className="max-w-4xl mx-auto px-5 py-8 space-y-5">
      <div className="flex justify-between items-start no-print"><a href="#/" className="text-teal-rgp font-medium">← Back to market</a><button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-teal-rgp text-white text-sm">Save as PDF</button></div>
      <div className="flex justify-between items-end border-b border-line pb-4">
        <div><div className="text-xs uppercase tracking-wide text-steel">AI Visibility Report</div><h1 className="text-3xl">{c.name}</h1><p className="text-steel">{c.industry} · {c.city} · {c.size} staff · {c.group} group</p></div>
        <div className="text-right"><div className="font-serif text-6xl text-teal-rgp leading-none">{c.score}</div><div className="text-xs text-steel">of 100</div></div>
      </div>
      <Sample />
      <div className="grid grid-cols-3 gap-4"><Kpi label="Mentioned" value={c.mentioned + '%'} /><Kpi label="Recommended" value={c.recommended + '%'} /><Kpi label="Cited" value={c.cited + '%'} /></div>
      <div className="card"><h3 className="text-lg mb-3">Score by engine</h3>
        {ENGINES.map(e => <div key={e} className="flex items-center gap-3 mb-2"><div className="w-24 text-sm">{e}</div><div className="flex-1 h-3 bg-cloud rounded-full overflow-hidden"><div className="h-full bg-teal-rgp" style={{ width: c.engines[e] + '%' }} /></div><div className="w-8 text-sm font-semibold text-right">{c.engines[e]}</div></div>)}</div>
      <div className="card"><h3 className="text-lg mb-1">How AI describes it</h3><p>{c.described}</p></div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card"><h3 className="text-lg mb-2" style={{ color: TEAL }}>Positive gaps (working)</h3><ul className="list-disc pl-5 space-y-1">{c.positive.map(p => <li key={p}>{p}</li>)}</ul></div>
        <div className="card"><h3 className="text-lg mb-2" style={{ color: '#9a6a00' }}>Negative gaps (to fix)</h3><ul className="list-disc pl-5 space-y-1">{c.negative.map(p => <li key={p}>{p}</li>)}</ul></div>
      </div>
      <div className="card"><h3 className="text-lg mb-2">Who wins instead</h3><div className="flex gap-2 flex-wrap">{c.rivals.map(x => <span key={x} className="px-3 py-1 rounded-full bg-cloud border border-line text-sm">{x}</span>)}</div></div>
      <p className="text-xs text-steel">Sample report. Names and numbers are fictional. Real runs record engine, model version and date, and average 3 repeats per prompt.</p>
    </main>
  )
}

export default function App() {
  const [hash, setHash] = useState(location.hash.replace('#/', ''))
  useEffect(() => { const f = () => { setHash(location.hash.replace('#/', '')); window.scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  const m = hash.match(/^c\/(.+)$/), c = m ? COMPANIES.find(x => x.id === m[1]) : undefined
  return <><Header route={hash} />{c ? <Report c={c} /> : <Dashboard />}</>
}
