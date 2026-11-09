# AI Visibility Map (Roundtable Growth Partners)

Internal build. Company-level data only in anything shared.

- scripts/step1_clean.py: merge raw member files into a company list
- Raw files and outputs stay OUTSIDE this repo (D:\Data\YPO\clean)
- Demo target: visibility.roundtablegrowthpartners.com

## Live run (Claude only, costs money)
1. Copy `config/brand.example.json` to `config/brand.json` and fill your brand + 6 locations
2. Copy `.env.example` to `.env` and paste your Claude Console API key
3. `node scripts/run_panel.mjs` (dry run, free, shows the estimate)
4. `node scripts/run_panel.mjs --mock` (fake answers, free, tests the pipeline)
5. `node scripts/run_panel.mjs --run --max-usd 1` (real run, stops at the cost cap)
The report page loads `web/public/run.json` automatically.
