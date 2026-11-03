---
name: ops-daily-brief
description: Morning briefing — priorities, open loops from the vault, and today's focus.
triggers: ["\\bbrief me\\b", "\\bwhat'?s on (my plate|today)\\b"]
---

# Goal
A short, decisive start-of-day brief for the owner.

# Steps
1. Read the `<memory>` notes: recent Reports, Inbox captures, and Projects.
2. Pull out open loops (anything marked TODO, `- [ ]`, "follow up", or a deadline).
3. Rank by urgency × impact; pick the top three.

# Output
- `spoken`: "Three things today: …" — names only, no detail.
- `report_markdown`:
  - `## Top 3` with one line of why for each
  - `## Open loops` as a `- [ ]` checklist, each linking its source note with [[wikilinks]]
  - `## Parked` — things deliberately not today

# Guardrails
- Never invent meetings or deadlines that aren't in memory. If memory is thin, say so and suggest what to capture.
