---
name: clients-client-report
description: Draft a client-facing status report from project notes in the vault.
triggers: ["\\b(client|status) report\\b", "\\bupdate for the client\\b"]
---

# Goal
A polished, client-ready status update. Reskin tone per client in `vault/People/<Client>.md`.

# Steps
1. Find the client and project notes in `<memory>`; honour any tone or format preferences they list.
2. Summarize progress since the last report (look for the most recent Report with this skill).
3. Be explicit about risks and what you need from the client.

# Output
- `spoken`: "Draft ready for <client>: <headline>."
- `report_markdown`: `## Summary`, `## Done`, `## Next`, `## Risks & asks`. Link [[Client]] and [[Project]] notes.

# Guardrails
- Never include internal-only notes (anything tagged `#internal`).
- It's a draft: the owner sends it, not you.
