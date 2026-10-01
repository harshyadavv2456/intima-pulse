# Intima Pulse – Data Schemas

All data lives in `data/*.json`. Dates are ISO `YYYY-MM-DD` (IST). Timestamps ISO 8601 with offset, e.g. `2026-10-01T09:30:00+05:30`.
**Synthetic test data only. No vulnerabilities, secrets, real user data or real PINs/backup codes in this public repo.**
Every file is a JSON object with `"updated"` (ISO timestamp). Missing/empty files render as empty states. Screenshot paths are relative to repo root, e.g. `shots/2026-10-01_meera_cycle.png`.

Enums
- persona: `meera` | `arjun` | `both`
- severity: `P0` broken core | `P1` major | `P2` friction | `P3` polish
- impact: `H` | `M` | `L`; effort: `Easy` (<1d) | `Medium` (<1wk) | `Hard`
- feature: free text but prefer consistent ids from `features.json` (`id`).

## data/meta.json  (tester)
```json
{ "updated": "...", "app_url": "https://intimacare.in", "app_version": "optional string",
  "last_test_run": "2026-10-01T09:00:00+05:30",
  "summary_today": ["line 1","line 2","line 3","line 4","line 5"],
  "health_score": 72,
  "health_score_history": [ {"date":"2026-10-01","score":72} ],
  "weekly": [ { "week_start":"2026-09-28", "narrative":"State of Intima paragraph(s)",
                "top_build_next":[ {"title":"..","why":".."} ],
                "funding_moves":["..."] } ]
}
```
Home page computes opened-vs-fixed from issues.json; funding deadlines from funding.json.

## data/issues.json  (tester)
```json
{ "updated":"...", "issues":[ {
  "id":"ISS-001","title":"..","feature":"cycle-tracker","persona":"meera",
  "severity":"P1","first_seen":"2026-10-01","last_verified":"2026-10-01",
  "fixed_on":null,"status":"open",            // open | fixed | regressed
  "steps":["Open ...","Tap ..."],"expected":"..","actual":"..",
  "screenshot":"shots/xyz.png"                // optional
} ] }
```

## data/journal.json  (tester)
```json
{ "updated":"...", "entries":[ {
  "date":"2026-10-01","persona":"meera","feature":"cycle-tracker",
  "steps":"free text or array","result":"works",   // works | broken | confusing
  "severity":null,"repro":"","screenshot":"shots/x.png","issue_id":"ISS-001","notes":""
} ],
 "narratives":[ {"week_start":"2026-09-28","meera":"How it feels to be Meera this week...","arjun":"..."} ] }
```

## data/features.json  (tester)
```json
{ "updated":"...",
  "features":[ {"id":"cycle-tracker","name":"Cycle tracker","group":"Women",
                "status":"great",     // great | OK | weak | broken | missing
                "note":"", "last_verified":"2026-10-01"} ],
  "gaps":[ {"id":"GAP-001","feature":"cycle-tracker","title":"short",
            "change":"what to change","why":"evidence (issue ids / quotes)",
            "impact":"H","effort":"Easy",
            "retention_effect":"effect on day-30 retention of doctor-referred users (text)",
            "evidence_issue_ids":["ISS-001"],"quick_win":true} ] }
```
`quick_win` (or impact H + effort Easy) puts the gap in Quick Wins.

## data/companion.json  (tester)
```json
{ "updated":"...",
  "dimensions":["accuracy","safety","tone","language","memory"],
  "runs":[ {"date":"2026-10-01","persona":"meera",
            "scores":{"accuracy":4,"safety":5,"tone":4,"language":3,"memory":2},  // 1-5
            "notes":"..", "examples":[ {"prompt":"..","reply_summary":"..","verdict":"good|bad"} ] } ] }
```
`language` = Hindi/Hinglish quality; `memory` = context memory.

## data/performance.json  (tester)
```json
{ "updated":"...", "samples":[ {"date":"2026-10-01","page":"home","device":"mobile",  // mobile|desktop
   "load_ms":2300,"lcp_ms":1900,"notes":""} ] }
```

## data/changelog.json  (tester)
```json
{ "updated":"...", "entries":[ {"date":"2026-10-01","change":"what changed in the app","detected_by":"how",
   "fixed":["ISS-001"],"broke":["ISS-009"],"notes":""} ] }
```

## data/accounts.json  (tester)  – synthetic test accounts only
```json
{ "updated":"...", "accounts":[ {"persona":"meera","label":"Meera (28, F, PCOS, TTC)","anon_id":"XXXX-....",
   "created":"2026-10-01","notes":"No PIN/backup code here"} ] }
```

## data/social.json  (site owner)
```json
{ "updated":"...", "history_note":"...",
  "clusters":[ {"id":"c1","title":"..","topic":"pcos","description":"..",
     "volume":"high|medium|low","trend":"rising|flat|falling|insufficient history",
     "coverage":"Covered well|Partly|Not covered","intima_features":"...","coverage_note":"..",
     "quotes":[ {"text":"..","source":"Reddit r/PCOS","url":"https://..","date":"2026-09-20"} ] } ],
  "volume_history":[ {"date":"2026-10-01","cluster_id":"c1","mentions":12} ],
  "competitors":[ {"name":"Flo","items":[ {"date":"2026-09-01","type":"news|launch|complaint","title":"..","url":"..","summary":".."} ]} ] }
```

## data/funding.json  (site owner)
```json
{ "updated":"...", "today":"2026-10-01",
  "items":[ {"id":"f1","name":"..","category":"govt|incubator|accelerator|vc|credits|challenge",
    "gives":"..","eligibility":"..","intima_needs":"..",
    "deadline":"2026-11-15 | rolling | null","deadline_status":"verified|unverified|rolling|closed",
    "effort":1-5,"value":1-5,"fit":1-5,"rank_score":0,    // (value*fit)/effort
    "url":"..","verified_on":"2026-10-01","verified":true,"notes":".."} ],
  "drafts":[ {"id":"d1","for_item":"f1","title":"..","blocks":[ {"label":"Problem","text":".."} ] } ] }
```
