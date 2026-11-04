"""Weekly Excel export (tidy tables for Power BI / Tableau). Usage: python export_weekly_xlsx.py prospect.json out.xlsx
Sample mode: data is SAMPLE. Weekly history is generated for layout only."""
import json, sys, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter
d = json.load(open(sys.argv[1])); out = sys.argv[2]
brand, prompts, locs = d['brand']['name'], d['prompts'], d['locs']
today = dt.date(2026, 11, 2)
weeks = [today - dt.timedelta(days=7 * i) for i in (3, 2, 1, 0)]
drift = {'test': [-6, -3, -1, 0], 'control': [-1, 1, 0, 0]}   # SAMPLE layout only
wb = Workbook()
HEAD = PatternFill('solid', fgColor='24313A'); HF = Font(bold=True, color='FFFFFF')
def sheet(name, header, rows, first=False):
    ws = wb.active if first else wb.create_sheet(name); ws.title = name
    ws.append(header)
    for c in ws[1]: c.fill, c.font = HEAD, HF
    for r in rows: ws.append(r)
    ws.freeze_panes = 'A2'; ws.auto_filter.ref = ws.dimensions
    for i, h in enumerate(header, 1):
        w = max(len(str(h)), *(len(str(r[i - 1])) for r in rows)) + 2
        ws.column_dimensions[get_column_letter(i)].width = min(w, 60)
    return ws
sheet('README', ['Field', 'Value'], [
    ['Report', 'AI Visibility Map weekly export'], ['Status', 'SAMPLE DATA. Fictional brand. Not real AI results.'],
    ['Tables', 'Locations, Prompt_Results, Group_Comparison, Gaps (tidy format, one row per record)'],
    ['Power BI / Tableau', 'Connect to this file and import Locations and Prompt_Results. Join on location_id.'],
    ['Score', '0 to 100 per answer, averaged over 3 repeats per prompt'], ['Engine', 'ALL = average across engines (sample has no engine split)']], first=True)
L, P, G, GAP = [], [], {}, []
for i, l in enumerate(locs, 1):
    lid = f'L{i}'
    for w, wd in enumerate(weeks):
        s = max(0, min(100, l['score'] + drift[l['group']][w]))
        L.append([wd.isoformat(), lid, brand, l['city'], l['address'], l['group'], s, True])
        G.setdefault((wd.isoformat(), l['group']), []).append(s)
    for j, p in enumerate(l['prompts']):
        P.append([weeks[-1].isoformat(), lid, brand, l['city'], l['group'], f'P{j+1:02d}', prompts[j], 'ALL', p['score'], p['hits'], 3, True])
    GAP.append([weeks[-1].isoformat(), lid, l['city'], l['group'], l['described'], l['pos'], l['neg'], l['winner'], True])
sheet('Locations', ['week_start', 'location_id', 'brand', 'city', 'address', 'group', 'score', 'is_sample'], L)
sheet('Prompt_Results', ['week_start', 'location_id', 'brand', 'city', 'group', 'prompt_id', 'prompt_template', 'engine', 'score', 'runs_mentioned', 'runs_total', 'is_sample'], P)
gc = []
for w in [x.isoformat() for x in weeks]:
    t = sum(G[(w, 'test')]) / len(G[(w, 'test')]); c = sum(G[(w, 'control')]) / len(G[(w, 'control')])
    gc.append([w, round(t, 1), round(c, 1), round(t - c, 1), True])
sheet('Group_Comparison', ['week_start', 'test_avg', 'control_avg', 'gap', 'is_sample'], gc)
sheet('Gaps', ['week_start', 'location_id', 'city', 'group', 'ai_description', 'positive_gap', 'negative_gap', 'wins_instead', 'is_sample'], GAP)
wb.save(out); print('saved', out)
