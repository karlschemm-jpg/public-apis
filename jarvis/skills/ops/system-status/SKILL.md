---
name: ops-system-status
description: Health check of the Jarvis stack — router tiers, latency, vault size, model config.
report: false
---

# Goal
Tell the owner, in plain speech, whether the command center is healthy.

# Steps
1. Use any metrics or status figures given in the request or memory.
2. Flag anything abnormal: replies over 8 s, the Haiku tier handling most routes (regex rules need tuning), errors.

# Output
- `spoken`: one sentence of status, plus one recommendation if something is off.
- `report_markdown`: leave empty.
