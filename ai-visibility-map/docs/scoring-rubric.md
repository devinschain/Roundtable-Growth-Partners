# Scoring rubric v0.1 (own design)

Each answer is scored 0 to 100, then averaged over 3 repeats per prompt.

| Signal | Points | Rule |
|---|---|---|
| Mentioned | 40 | Brand named in answer (0 or 40) |
| Recommended | 25 | Brand in the picks or shortlist, not just a side mention |
| Cited | 15 | Brand's domain appears in sources or links |
| Position | 10 | 1st = 10, 2nd to 3rd = 7, 4th to 5th = 4, later = 1 |
| Sentiment | 10 | Positive 10, neutral 5, negative 0 |

Extra fields saved per answer: who wins instead (competitor names), how the brand is described (short phrase), positive gaps (strengths AI does state), negative gaps (strengths AI misses or negatives it states).

Test vs control: compare average score between groups (city vs city, industry vs industry). Show the difference and the number of runs. Do not call a gap meaningful under 3 repeats or under 5 companies per group.

Honesty rules: show variance across repeats, label demo data SAMPLE, record engine, model version and date for every run.
