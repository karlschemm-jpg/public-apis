---
name: memory-capture
description: Capture a thought straight into the vault Inbox (no model call).
handler: local:capture
report: false
---

# Goal
Zero-latency capture. Jarvis writes the text to `vault/Inbox/` locally without calling any model.
When Claude Code runs this skill instead, create a note in `vault/Inbox/` named
`YYYY-MM-DD HHMM <first words>.md` with frontmatter `type: capture` and a link to [[Home]].
