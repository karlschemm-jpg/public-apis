---
name: research-web-brief
description: Research a topic and file a sourced brief with key findings, open questions and next steps.
triggers: ["^research\\b", "\\bdig into\\b"]
---

# Goal
A decision-ready brief on one topic.

# Steps
1. Check `<memory>` first — build on what the vault already knows and link it.
2. Separate facts from inference; note uncertainty explicitly.
3. If you lack current information, say what should be verified rather than guessing.

# Output
- `spoken`: the single most important finding and a recommendation.
- `report_markdown`:
  - `## TL;DR` (3 bullets)
  - `## Findings`
  - `## Open questions`
  - `## Next steps` as `- [ ]`
  - `## Related` — [[wikilinks]] to existing notes

# Guardrails
- No fabricated citations or URLs.
