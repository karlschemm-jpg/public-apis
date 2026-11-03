---
name: research-summarize
description: Summarize a note, transcript or pasted text into key points and decisions.
triggers: ["^summari[sz]e\\b", "\\btl;?dr\\b"]
---

# Goal
Compress material without losing decisions, numbers or owners.

# Output
- `spoken`: the gist in one sentence.
- `report_markdown`: `## Key points`, `## Decisions`, `## Action items` (`- [ ] owner — task`), and a [[wikilink]] back to the source note when there is one.
