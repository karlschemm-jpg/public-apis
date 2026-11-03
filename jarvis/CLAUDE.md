# Jarvis — instructions for Claude Code

You are the brain of a voice-driven command center (V.A.U.L.T.). Replies are spoken aloud.

## Brain: skills
- Skills live in `skills/<branch>/<skill>/SKILL.md` and are linked into `.claude/skills/`
  (`python -m jarvis skills sync`). Load a skill only when the request needs it.
- New skill: `python -m jarvis new-skill <branch>/<name> "description"`.

## Memory: the Obsidian vault (`vault/`)
- Plain markdown, connected with `[[wikilinks]]`. Start from `vault/Home.md` and follow links.
- Every report you produce is saved as a new note in `vault/Reports/` with frontmatter
  (`type: report`, `skill`, `created`, `tags`) and a `Related:` line of wikilinks
  including [[Home]].
- Never delete or rewrite existing notes unless explicitly asked; append instead.

## Voice output contract
When invoked by the voice loop, answer with ONLY a JSON object:
`{"spoken": "...", "title": "...", "report_markdown": "..."}` — `spoken` is 1–3 plain sentences
(no markdown, URLs or lists); long content goes in `report_markdown`. In that mode Jarvis files
the report into `vault/Reports/` itself, so do not write the report file yourself.

## Code map
- `jarvis/router.py` regex → local model (Ollama) → Haiku intent routing
- `jarvis/brain.py` skill + memory injection, Claude call, report filing
- `jarvis/memory.py` vault search, link graph, note writing
- `jarvis/voice/` faster-whisper STT, Kokoro TTS, listen loop
- `jarvis/hud/` stdlib HTTP(S) + SSE server, access key + self-signed cert (`net.py`), static dashboard;
  `static/voice.js` records with the viewing device's mic (iPad) and plays replies there
- Tests: `python -m pytest tests` (no network, no audio hardware needed)
