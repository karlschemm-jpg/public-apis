---
type: index
tags: [jarvis/home]
---

# Home

The root of Jarvis's long-term memory. Everything links back here, so the
graph stays connected.

- [[Skill Map]] — every skill the Brain can run (auto-generated)
- [[Example Client]] — client profile + tone preferences
- [[Example Project]] — a project note the client-report skill reads
- `Reports/` — every report the OS generates lands here
- `Inbox/` — quick voice captures ("Jarvis, note that…")

## How memory works
1. Notes are plain markdown. Link them with `[[Note Title]]`.
2. On each command, Jarvis keyword-ranks notes, then follows wikilinks one hop.
3. Only the top few notes go into context — no database, no embeddings.
