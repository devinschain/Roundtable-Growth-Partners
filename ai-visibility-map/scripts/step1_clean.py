"""Step 1: merge A-Z member files -> company-level list. Run: python step1_clean.py <input_dir> <output_dir>"""
import csv, glob, os, re, sys, hashlib
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
SUFFIX = r'\b(inc|incorporated|llc|l\.l\.c|ltd|limited|corp|corporation|co|company|plc|lp|llp|sa|s\.a|gmbh|pty|group)\b\.?'
def norm(n):
    n = n.lower().replace('&', ' and ')
    n = re.sub(SUFFIX, ' ', n)
    return re.sub(r'[^a-z0-9]+', ' ', n).strip()
JUNK = {'', 'n a', 'na', 'none', 'self', 'self employed', 'retired', 'private', 'confidential', 'tbd', 'various', 'retired', 'n a', 'not applicable', 'none'}
rows, stats = {}, dict(files=0, raw=0, no_company=0, junk=0)
for f in sorted(glob.glob(os.path.join(src, '*.csv'))):
    stats['files'] += 1
    rd = csv.DictReader(open(f, encoding='utf-8-sig', newline=''))
    # Column order differs per file. The company is always the column right before the phone column.
    pi = rd.fieldnames.index('member__connections--phone href')
    ccol = rd.fieldnames[pi - 1]
    for r in rd:
        stats['raw'] += 1
        c = (r.get(ccol) or '').strip()
        if c in ('|', ';', 'New', 'add to favorite'): c = ''
        if not c: stats['no_company'] += 1; continue
        k = norm(c)
        if k in JUNK: stats['junk'] += 1; continue
        chap = (r.get('member-tile__chapter') or '').strip()
        e = rows.setdefault(k, dict(company=c, chapters=set(), members=0))
        e['members'] += 1
        if chap: e['chapters'].add(chap)
ids = sorted(rows)
with open(os.path.join(out, 'companies_internal.csv'), 'w', newline='', encoding='utf-8') as a, \
     open(os.path.join(out, 'companies_external.csv'), 'w', newline='', encoding='utf-8') as b:
    wa, wb = csv.writer(a), csv.writer(b)
    wa.writerow(['company_id', 'company', 'chapters', 'members_in_file'])
    wb.writerow(['company_id', 'company', 'industry', 'city', 'size'])
    for k in ids:
        e = rows[k]; cid = 'C' + hashlib.md5(k.encode()).hexdigest()[:8]
        wa.writerow([cid, e['company'], ' | '.join(sorted(e['chapters'])), e['members']])
        wb.writerow([cid, e['company'], '', '', ''])
print(stats, 'unique_companies=', len(ids))
