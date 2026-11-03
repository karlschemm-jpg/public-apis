---
name: clients-meeting-notes
description: Turn a spoken or pasted meeting recap into structured notes with action items.
triggers: ["\\bmeeting (notes|recap)\\b", "^(i|we) just (met|had a call) with\\b"]
---

# Output
- `spoken`: how many action items and who owns them.
- `report_markdown`: `## Attendees` ([[Person]] links), `## Discussion`, `## Decisions`, `## Action items` (`- [ ] [[Owner]] — task — due`).
